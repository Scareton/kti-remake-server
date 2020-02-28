const mongoose = require('mongoose')
const AlbumSchema = new mongoose.Schema({
  name: {
    type: String
  },
  path: {
    type: String
  },
})

module.exports = mongoose.model('Album', AlbumSchema)