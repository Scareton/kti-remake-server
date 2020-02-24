const mongoose = require('mongoose')
const SectionSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
  },
  path: {
    type: String,
  },
  children: {
    type: Object
  },
  publishedBy: {
    type: Date,
    default: Date.now
  },
  children: [Object]
})

module.exports = mongoose.model('Section', SectionSchema)