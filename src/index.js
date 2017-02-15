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
const passport = require('passport')
const LocalStrategie = require('passport-local').Strategy
const flash = require('connect-flash')
const exphbs  = require('express-handlebars')
const routes = require('./app')
const port = 3000
const User = require('./app/controller/user-controller')
const db = require('./database')
const email = require('./email')
const config = require('../config.json')

if (!process.env.PRODUCTION) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    next()
  })
}
app.engine('handlebars', exphbs());
app.set('views', path.join(__dirname, '/app/templates/pages'));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(expressSession({
  secret: 'development',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

const interfaces = db => email => ({db, email})

const main = Task.of(interfaces)
  .ap(db.connect(mongoose, 'mongodb://localhost:27017/tabata'))
  .ap(email.connect(config.SENDGRID_API_KEY, 'noreply@tabata.de'))
  .chain(({db, email}) => new Task((rej, res) => {
    const user = User({db, email})
    passport.serializeUser(user.serialize)
    passport.deserializeUser(user.deserialize)
    passport.use('user-local', new LocalStrategie({
      usernameField: 'email'
    }, user.authenticate)
    routes(app, passport, { user: user })
    server.listen(port, () => res(`Listen on port: ${port}`))
}))

main.fork(errors => {
  errors.forEach(error => console.error(`${error.name}: ${error.message}`))
  process.exit(1)
}, console.log)
