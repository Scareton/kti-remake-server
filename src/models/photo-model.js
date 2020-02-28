const mongoose = require('mongoose')
const PhotoSchema = new mongoose.Schema({
  path: {
    type: String
  },
  title: {
    type: String
  },
  author: {
    type: String
  },
  place: {
    type: String
  },
  createdDate: {
    type: Date,
  },
  publishedBy: {
    type: Date,
    default: Date.now
  },
  album: {
    type: String
  },
})

module.exports = mongoose.model('Photo', PhotoSchema)