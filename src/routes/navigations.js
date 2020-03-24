const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')
const Navigation = require('../models/navigation-model')
const Post = require('../models/post-model')


router.get('/navigations', (req, res) => {
  Navigation.aggregate([
    {
      $lookup: {
        from: 'posts',
        let: { items: "$items" },
        pipeline: [
          { '$match': { '$expr': { '$in': ['$_id', '$$items'] } } },
          {
            '$project': {
              id: "$_id",
              fullpath: 1,
              name: "$title",
              publishedBy: 1
            }
          }
        ],
        as: "items"
      }
    }
  ]).exec((err, navigations) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send({
        success: true,
        navigations: navigations
      })
    }
  })
})

router.get('/navigations/:id', (req, res) => {
  let navid = req.params.id;
  Navigation.findOne({ _id: navid }, (err, navigation) => {
    if (err) {
      res.sendStatus(500)
    } else {
      let items = navigation.items;
      Post.find({ "_id": { $in: items } }, { title: 1, fullpath: 1 }, (err, links) => {
        if (err) {
          res.sendStatus(500)
        } else {
          res.send({
            success: true,
            links: links
          })
        }
      })

    }
  });
})

router.post('/navigations/:id', (req, res) => {
  let navid = req.params.id;
  let body = req.body

  Navigation.findOne({ _id: navid }, (err, nav) => {
    if (!err) {
      body.forEach((item, i) => {
        body[i] = mongoose.Types.ObjectId(item)
      });
      nav.items = body;
      nav.save(err => {
        if (!err) {
          res.send({
            success: true,
            info: "Навигация сохранена успешно"
          })
        } else {
          res.send({
            success: false,
            info: "Произошла ошибка при сохранении навигации. Попробуйте обновить страницу"
          })
        }
      })
    } else {
      res.send({
        success: false,
        info: "Произошла ошибка при получении навигации. Попробуйте обновить страницу"
      })
    }
  })

})

module.exports = router