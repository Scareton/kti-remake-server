const express = require('express')
var multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()
const Photo = require('../models/photo-model')

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

// Место хранения файлов multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    var dir = "uploads/photos";

    // Директория загрузки - папка альбома в uploads/photos
    if (req.params.album) {
      dir = `${dir}/${req.params.album}`;
    }

    // Создать директорию, если она не существует
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

var upload = multer({ storage: storage, fileFilter: fileFilter })

router.get('/api/uploads/*', (req, res) => {
  res.sendFile(req.originalUrl.slice(4), { root: path.dirname(require.main.filename) })
})

router.get('/api/photo/albums', (req, res) => {
  Photo.aggregate(
    [
      { $sort: { name: 1 } },
      {
        $group:
        {
          _id: '$album',
          name: { $first: '$albumname' },
          count: { $sum: 1 }
        }
      }
    ]
  ).exec((err, albums) => {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.send({
        albums: albums
      })
    }
  })
})

router.get('/api/photo/albums-previews', (req, res) => {
  Photo.aggregate(
    [
      { $sort: { name: 1 } },
      {
        $group:
        {
          _id: '$album',
          name: { $first: '$albumname' },
          cover: { $first: '$path' },
          count: { $sum: 1 }
        }
      }
    ]
  ).exec((err, albums) => {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.send({
        success: true,
        albums: albums
      })
    }
  })
})

router.get('/api/photo/albums/:album', (req, res) => {
  var album = req.params.album;
  var query = Photo.find({ "album": album }).sort({ "publishedBy": -1 });

  query.exec((err, photos) => {
    if (err) {
      console.log(err)
      res.sendStatus(500)
    } else {
      res.send({
        success: true,
        photos: photos
      })
    }
  })
})

// Загрузка фотографий в альбом
router.post('/api/photo/albums/:album', upload.array('photos', 24), (req, res) => {

  // Получаем url-корректный alias и название альбома
  var album = req.params.album;
  var albumname = req.body.albumname;

  // Массив для полей фотографий
  var photosData = [];

  // Если полей с данными фотографий несколько
  if (Array.isArray(req.body.photosData)) {
    // Добавляем каждое в массив полей
    req.body.photosData.forEach(item => {
      photosData.push(JSON.parse(item));
    });
  } else {
    // Если поле одно, добавляем его в массив полей
    photosData.push(JSON.parse(req.body.photosData));
  }

  // Документы для записи в базу
  var images = [];

  // Если есть загруженные файлы
  if (req.files) {

    // Перебираем их
    req.files.forEach(file => {

      var photo = {}; // Обхект для хранения данных фотографии
      // Находим связь между файлом и данными
      var dataItem = photosData.find(item => item.photo === file.originalname);

      // Если данные есть - берём их за основу объекта
      if (dataItem) photo = dataItem;

      // Заполняем обязательные поля
      photo.path = file.path;
      photo.album = album
      photo.albumname = albumname;

      // Добавляем документ к массиву документов
      images.push(photo)
    });

    // Сохраняем массив документов в базе
    Photo.insertMany(images, (err, photos) => {
      res.send({
        success: true,
        photos: photos
      })
    });

  } else {
    res.sendStatus(500)
  }
})

// Обновить поля фото
router.put('/api/photo/:id', (req, res) => {
  let _id = req.params.id;
  let data = req.body;

  Photo.findOne({ _id }, (err, photo) => {
    if (!err) {
      photo.title = data.title;
      photo.author = data.author;
      photo.place = data.place;
      photo.save(response => {
        res.send()
      })
    } else res.status(500).send(err)
  })
})

// Удалить фото
router.delete('/api/photo/:id', (req, res) => {
  let _id = req.params.id;
  Photo.findOne({ _id }, (err, photo) => {
    if (!err) {
      photo.remove(response => {
        res.send(response)
      })
    } else res.status(500).send(err);
  })
})

module.exports = router