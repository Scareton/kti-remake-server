const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

const config = require('./src/config/config')
const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())
// app.use(require('./routes/sections'));
app.use(require('./src/routes/photos'));
app.use(require('./src/routes/navigations'));
app.use(require('./src/routes/posts'));




// Подключение к базе данных MongoDB
mongoose.Promise = global.Promise
mongoose.connect(config.dbURL, config.dbOptions)
mongoose.connection
  .once('open', () => {
    // Включение сервера
    console.log(`Mongoose - successful connection ...`)   
    app.listen(process.env.PORT || config.port,
      () => console.log(`Server start on port ${config.port} ...`))
  })
  .on('error', error => console.warn(error))