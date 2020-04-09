const mongoose = require('mongoose')

// Посты
const PostSchema = new mongoose.Schema({
  title: {
    $type: String,
    required: true,
  },
  alias: {
    $type: String,
    required: true
  },
  fullpath: {
    $type: String,
    required: true,
    unique: true,
  },
  path: {
    $type: String,
    required: true,
    default: ""
  },
  publishedBy: {
    $type: Date,
    default: Date.now()
  },
  content: {
    $type: String,
    required: true
  },
  forms: {
    $type: Array
  },
  visible: {
    $type: Boolean,
    default: false,
  },
  published: {
    $type: Boolean,
    default: false
  },

  // news
  cover: {
    $type: String
  },
  tag: {
    $type: String,
    default: ""
  },
  subtag: {
    $type: String,
    default: ""
  },
  description: {
    $type: String,
    default: ""
  },
}, { typeKey: '$type' })

PostSchema.index(
  {
    title: 'text',
    alias: 'text',
    description: 'text',
    content: 'text'
  },
  {
    name: 'My text index',
    weights: {
      title: 10,
      alias: 2,
      description: 4,
      content: 1
    }
  }
);

module.exports = mongoose.model('Post', PostSchema)