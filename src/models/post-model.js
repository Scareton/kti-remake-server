const mongoose = require('mongoose')

// Посты
const PostSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  alias: {
    type: String,
  },
  fullpath: {
    type: String,
    unique: true,
  },
  path: {
    type: String,
  },
  publishedBy: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String
  },
  forms: {
    type: Array
  },
  visible: {
    type: Boolean
  },
  published: {
    type: Boolean
  },

  // news
  cover: {
    type: String
  },
  tag: {
    type: String
  },
  subtag: {
    type: String
  },
  description: {
    type: String
  },
})
module.exports = mongoose.model('Post', PostSchema)