const path = require('path')
const Task = require('data.task')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const mongoose = require('mongoose')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const expressSession = require('express-session')
const cookieParser = require('cookie-parser')
const routes = require('./app')
const port = 3000
const User = require('./app/controller/user-controller')
const db = require('./database')

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(expressSession({
  secret: 'development',
  resave: false,
  saveUninitialized: false
}))

if (!process.env.PRODUCTION) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
  	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  	res.header('Access-Control-Allow-Headers', 'Content-Type');
  	next();
  })
}

const main = db.connect(mongoose, 'mongodb://localhost:27017/tabata')
  .chain(db => new Task((rej, res) => {
    routes(app, { user: User({db}) })
    server.listen(port, () => res(`Listen on port: ${port}`))
}))

main.fork(error => {
  console.error(`${error.name}: ${error.message}`)
  process.exit(1)
}, console.log)
