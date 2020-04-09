const mongoose = require('mongoose')
const PhotoSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ""
  },
  author: {
    type: String,
    default: ""
  },
  place: {
    type: String,
    default: ""
  },
  createdDate: {
    type: Date,
  },
  publishedBy: {
    type: Date,
    default: Date.now
  },
  album: {
    type: String,
    default: ""
  },
  albumname: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Photo', PhotoSchema)