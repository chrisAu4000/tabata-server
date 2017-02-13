const Task = require('data.task')
const Validation = require('data.validation')
const {Right, Left} = require('data.either')
const {curry, prop, compose} = require('ramda')
const LocalStrategie = require('passport-local').Strategy
const {hash, compare} = require('../crypto')
const {isEqual, match, minLength, maxLength, taskFromValidation} = require('../validation')
const validationError = require('../error/validationError')
const emailError = require('../error/emailError')

const emailRegEx = /^[\w\.]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,10}$/g
const passwordRegEx = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,16}$/g

const user = curry((name, email, password) => ({name, email, password}))

const validatePassword = (verification, password) =>
  Validation.of(curry((a,b,c,d) => a))
  .ap(isEqual('Password and verification must be equal.', verification, password))
  .ap(minLength(8, 'Password must be longer than 4 characters.', password))
  .ap(maxLength(40, 'Username should not be longer than 40 characters', password))
  .ap(match(passwordRegEx, 'Password of invalid format.', password))

const validateName = (name) =>
  Validation.of(curry((a,b) => a))
  .ap(minLength(4, 'Username must be longer than 4 characters.', name))
  .ap(maxLength(40, 'Username should not be longer than 40 characters', name))

const validateEmail = (email) =>
  Validation.of(curry((a,b,c) => a))
  .ap(match(emailRegEx, 'E-Mail of invalid fromat.', email))
  .ap(minLength(6, 'E-Mail must be longer than 6 characters.', email))
  .ap(maxLength(60, 'E-Mail should not be longer than 60 characters.', email))

const validUser = ({name, email, password, verification}) =>
  Validation.of(user)
  .ap(validateName(name))
  .ap(validateEmail(email))
  .ap(validatePassword(verification, password))

const prepareToRender = curry((replyUrl, user) => {
  return {
    url: replyUrl,
    user: {
      _id: user._id,
      name: user.name,
    }
  }
})

const sendConfirmationEMail = curry((db, email, userEmail, template) =>
  email.send('Tabata Confirmation', userEmail, template)
  .orElse((error) =>
    db.removeOne('User', {email: userEmail})
      .chain((user) => Task.rejected(error)))
)

const debug = function(x) {
  console.log(x)
  return x
}
const userNotFoundError = {
  name: 'Not-Found',
  message: ['Can not find user.']
}
const comparePasswords = curry((password, user) =>
  compare(password, user.password)
    .chain(res => res.cata({
      Right: () => Task.of(user),
      Left: () => Task.rejected('Incorrect password.')
    }))
)
const isVerified = (user) =>
  user.verified === true
  ? Right(user)
  : Left('User is not verified.')

const User = ({db, email, passport}) => {
  // AUTHENTIFICATION MIDDLEWARE
  const serialize = (user, done) => {
    done(null, user._id)
  }
  const deserialize = (id, done) => {
    console.log('deserializeUser')
    console.log(id)
    return db.findById('User', id)
      .fork(done, maybeUser => maybeUser
        .cata({
          Just: (user) => done(null, user),
          Nothing: ()  => done(null, null)
        })
      )
  }
  const authenticate = new LocalStrategie({
    usernameField: 'email'
    }, (email, password, done) =>
      db.findOne('User', {email: email})
      .chain(maybeUser => maybeUser.cata({
        Just: compose(Task.of, isVerified),
        Nothing: () => Task.rejected('Incorrect username.')
      }))
      .chain(isVerified => isVerified.cata({
        Right: comparePasswords(password),
        Left: () => Task.rejected('E-Mail is not verified.')
      }))
      .fork(
        (error) => done(null, false, {message: error}),
        (user) => done(null, user)
      )
  )

  const registration = (user) => {
    return taskFromValidation(validUser(user))
    .chain(hash('password'))
    .chain(db.createUnique('email', 'User'))
    .map(prepareToRender('http://localhost:3000/v1/user/confirm/'))
    .chain(email.renderEmail('confirmation-email'))
    .map(prop('html'))
    .chain(sendConfirmationEMail(db, email, user.email))
  }
  const confirmation = (id) => {
    return db.updateById('User', {verified: true}, id)
    .chain(maybeUser => maybeUser
      .cata({
        Just: Task.of,
        Nothing: () => Task.rejected(userNotFoundError)
      })
    )
  }
  const find = (email) => {
    return db.findOne('User', {email: email})
  }

  return {
    registration,
    confirmation,
    serialize,
    deserialize,
    authenticate,
  }
}



module.exports = User
