const express = require('express')

const router = express.Router()
const Post = require('../models/post-model')

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

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

// Получение секции
router.get('/api/post/childs', (req, res) => {
  let path = req.query.path ? req.query.path : "/";
  if (path[path.length - 1] !== "/") path += "/";

  Post.aggregate(
    [
      {
        $sort: {
          title: 1
        }
      },
      {
        $match: {
          path: path,
          alias: {
            $ne: ""
          }
        }
      },
    ]
  ).exec((err, posts) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send({
        posts
      })
    }
  })
})

// Получение статьи
router.get('/api/post/get/', (req, res) => {
  let path = req.query.path ? req.query.path : "/";
  if (path[path.length - 1] !== "/") path += "/";
  console.log(path)

  Post.aggregate(
    [
      {
        $match: {
          fullpath: path
        }
      },
      {
        $sort: {
          title: 1
        }
      }
    ]
  ).exec((err, post) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send({
        post
      })
    }
  })
})

// Обновление статьи
router.put('/api/post/update/', upload.single('cover'), (req, res) => {
  let path = req.query.path ? req.query.path : "/";
  if (path[path.length - 1] !== "/") path += "/";

  const _id = ObjectId(req.body._id);

  Post.deleteOne({ _id: _id }, (err, response) => {
    if (!err) {
      const post = new Post(req.body);

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

      post.save((err, post) => {
        if (!err) res.send(post);
        else res.status(500).send(err)
      })
    }
  });


})

// Создание статьи
router.post('/api/post/create', upload.single('cover'), (req, res) => {
  let path = req.query.path ? req.query.path : "/";
  if (path[path.length - 1] !== "/") path += "/";

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
    if (!err) res.send(data)
    else res.status(500).send(err)
  })
})

// Удаление статьи
router.delete('/api/post/remove', (req, res) => {
  let _id = req.query._id;

  Post.findOne({ _id }, (err, post) => {
    post.remove(err => {
      if (!err) res.send({ success: true })
      else res.status(500).send(err)
    })
  })
})

router.get('/api/sections', (req, res) => {
  Post.aggregate(
    [
      { $sort: { title: 1 } },
      {
        $group:
        {
          _id: '$_id',
          fullpath: { $first: '$fullpath' },
          title: { $first: '$title' },
          publishedBy: { $first: '$publishedBy' },
        }
      }
    ]
  ).exec((err, sections) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send({
        sections
      })
    }
  })
})

router.get('/api/search', (req, res) => {
  let search = req.query.search;

  Post.find({ $text: { $search: search } }).limit(8).exec((err, posts) => {
    if (!err) res.send({ posts })
    else res.status(500).send(err)
  })
})


// old
router.get('/api/navigation', (req, res) => {
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

router.post('/api/loadimage', upload.single('file'), (req, res) => {
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

// router.get('/api/*', (req, res) => {
//   var path = req._parsedUrl.pathname;
//   path = path.replace(/([^\/]+)$/, "");

//   var query = Post.find({ "path": path }).sort({ "publishedBy": -1 });
//   var count = null;

//   if (req.query) {
//     if (req.query.limit) {
//       var limit = parseInt(req.query.limit, 10)
//       if (limit) query.limit(limit);
//     }
//     if (req.query.offset) {
//       var skip = parseInt(req.query.offset, 10);
//       if (skip) query.skip(skip);
//     }
//     if (req.query.count) {
//       count = true;
//     }
//   }


//   // Если нужно получить только количество документов
//   if (count) {
//     Post.count({ "path": path }, (err, count) => {
//       res.send({
//         count: count
//       })
//     })
//   } else {
//     query.exec().then((response) => {
//       if (response) {
//         var send = {
//           posts: response,
//           post: response.filter(post => post.fullpath === req._parsedUrl.pathname)[0],
//         }
//         if (count) send.count = count;
//         res.send(send)
//       }
//     })
//   }

//   // 
// })

module.exports = router