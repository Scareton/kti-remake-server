const mongoose = require('mongoose')
const NavigationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  items: [mongoose.Types.ObjectId]
})

module.exports = mongoose.model('Navigation', NavigationSchema)