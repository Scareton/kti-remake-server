const express = require('express')

const router = express.Router()
const Post = require('../models/post-model')

// Multer
const fs = require('fs-extra')
var multer = require('multer')
const path = require('path')

// определение фильтра multer
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg") {
    cb(null, true);
  }
  else {
    cb(null, false);
  }
}


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = "";
    // Определить директорию - id документа, с которым мы работаем
    if (req.body && req.body._id) {
      dir = req.body._id;
    } else {
      // Если мы загружаем фотографии для статей
      if (req._parsedUrl.pathname === "/loadimage") {
        dir = "images_temp"
      } else dir = `temp_${Date.now()}`;
    }
    dir = `uploads/${dir}/`;
    // Создать директорию, если она не существует
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    var name = "";
    // Если загружается обложка, название должно быть строго cover (Т.к обложка уникальна)
    if (file.fieldname === "cover") name = "cover";
    // Если загружается обычная картинка, создаётся уникальное название
    else name = Date.now();
    cb(null, name + path.extname(file.originalname))
  }
})

var upload = multer({ storage: storage, fileFilter: fileFilter })
// -----

router.get('/uploads/*', (req, res) => {
  res.sendFile(req.originalUrl, { root: path.dirname(require.main.filename) })
})

router.get('/sections', (req, res) => {
  Post.distinct("path", (err, sections) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send({
        sections: sections
      })
    }
  })
})

router.get('/navigation', (req, res) => {
  if (req.query && req.query.sections) {
    var sections = req.query.sections.split(",");
    Post.find({ path: { $in: sections }, visible: true }, (err, posts) => {
      res.send({
        sections: sections,
        posts: posts
      })
    })
  }
})

router.post('/loadimage', upload.single('file'), (req, res) => {
  if (res && req.file) {
    res.send({
      success: true,
      location: req.file.path,
    })
  } else {
    res.send({
      success: false,
      message: "Произошла ошибка",
    })
  }
})

router.put('/*', upload.single('cover'), (req, res) => {
  var fullpath = req.body.path + req.body.alias;
  const post = req.body;
  if (req.file) {
    post.cover = req.file.path;
  }

  if (post.images) {
    var images = post.images.split(",");
    var newdest = `uploads/${post._id}`;
    // Если конечной директории не существует - создаём её
    if (!fs.existsSync(newdest)) {
      fs.mkdirSync(newdest);
    }

    images.forEach(item => {
      // Новый путь = /uploads/{id_документа}/{имя_и_расширение_файла}
      var newpath = `${newdest}/${path.basename(item)}`;
      post.content = post.content.replace(item, newpath);

      fs.copyFile(item, newpath, (err) => {
        if (err) throw err;

        // Удаляем временный файл
        fs.unlink(item, (err) => {
          if (err) throw err;
        });
      })
    });
  }

  Post.replaceOne({ '_id': post._id }, post).then(response => {
    res.send({
      success: true,
      post: post,
      message: response
    })
  })
})

router.post('/*', upload.single('cover'), (req, res) => {
  var fullpath = req.body.path + req.body.alias;
  const post = new Post(req.body);

  if (req.file) {
    // Определяем путь временного файла и конечное местоположение
    let olddest = req.file.destination;
    let oldpath = req.file.path;
    let newdest = `uploads/${post._id}`;
    let newpath = `${newdest}/${req.file.filename}`;

    // Обновляем поле документа
    post.cover = newpath;

    // Если конечной директории не существует - создаём её
    if (!fs.existsSync(newdest)) {
      fs.mkdirSync(newdest);
    }

    // Копируем файл в конечную директорию
    fs.copyFile(oldpath, newpath, (err) => {
      if (err) throw err;

      // Удаляем временный файл
      fs.remove(olddest, (err) => {
        if (err) throw err;
      });
    })
  }

  post.save((err, data) => {
    if (err) {
      console.log(err)
    } else {
      // Отправляем ответ. Конец запроса

      res.send({
        success: true,
        post: post
      })
    }
  })
})

router.get('/*', (req, res) => {
  var path = req._parsedUrl.pathname;
  path = path.replace(/([^\/]+)$/, "");

  var query = Post.find({ "path": path }).sort({ "publishedBy": -1 });
  var count = null;

  if (req.query) {
    if (req.query.limit) {
      var limit = parseInt(req.query.limit, 10)
      if (limit) query.limit(limit);
    }
    if (req.query.offset) {
      var skip = parseInt(req.query.offset, 10);
      if (skip) query.skip(skip);
    }
    if (req.query.count) {
      count = true;
    }
  }


  // Если нужно получить только количество документов
  if (count) {
    Post.count({ "path": path }, (err, count) => {
      res.send({
        count: count
      })
    })
  } else {
    query.exec().then((response) => {
      if (response) {
        var send = {
          posts: response,
          post: response.filter(post => post.fullpath === req._parsedUrl.pathname)[0],
        }
        if (count) send.count = count;
        res.send(send)
      }
    })
  }

  // 
})

module.exports = router