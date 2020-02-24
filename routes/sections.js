const express = require('express')
const router = express.Router()
const Section = require('../models/section-model')

router.post('/sections', (req, res) => {
  const section = new Section({
    title: req.body.title,
    path: req.body.path,
    children: req.body.children
  })
  section.save((err, data) => {
    if (err) {
      console.log(err)
    } else {
      res.send({
        success: true,
        message: `Post with ID_${data._id} saved successfully!`
      })
    }
  })
})

router.get('/sections', (req, res) => {
  Section.find({}, (err, sections) => {
    if (err) {
      res.sendStatus(500)
    } else {
      res.send({ sections: sections })
    }
  }).sort({ _id: -1 })
})

module.exports = router