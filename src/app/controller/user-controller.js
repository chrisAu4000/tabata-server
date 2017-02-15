const Task = require('data.task')
const Validation = require('data.validation')
const {Success, Failure} = require('data.validation')
const {Right, Left} = require('data.either')
const {Just, Nothing} = require('data.maybe')
const {curry, prop, compose, assoc} = require('ramda')
const {hash, compare} = require('../crypto')
const {isEqual, match, minLength, maxLength, taskFromValidation} = require('../validation')
const validationError = require('../error/validationError')
const notFoundError = require('../error/notFoundError')
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

const sendConfirmationEMail = curry((db, email, userEmail, template) =>
  email.send('Tabata Confirmation', userEmail, template)
  .orElse((error) =>
    db.removeOne('User', {email: userEmail})
      .chain((user) => Task.rejected(error)))
)

const maybeUserToTask = maybeUser => maybeUser.cata({
  Just: Task.of,
  Nothing: () => Task.rejected(notFoundError('Can not find user.'))
})

const comparePasswords = curry((password, user) =>
  compare(password, user.password)
    .chain(res => res.cata({
      Right: () => Task.of(user),
      Left: () => Task.rejected('Incorrect password.')
    }))
)

const isVerified = (user) =>
  user.verified === true
  ? Success(user)
  : Failure('User is not verified.')

const User = ({db, email}) => {
  // AUTHENTIFICATION MIDDLEWARE
  const serialize = (user, done) => done(null, user._id)
  const deserialize = (id, done) => {
    return db.findById('User', id)
    .fork(done, maybeUser => maybeUser.cata({
      Just: (user) => done(null, user),
      Nothing: ()  => done(null, null)
    }))
  }
  const authenticate = (email, password, done) =>
    db.findOne('User', {email: email})
    .chain(maybeUser => maybeUser.cata({
      Just: compose(Task.of, isVerified),
      Nothing: () => Task.rejected('Incorrect username.')
    }))
    .chain(isVerified => isVerified.cata({
      Success: comparePasswords(password),
      Failure: () => Task.rejected('E-Mail is not verified.')
    }))
    .fork(
      (error) => done(null, false, {message: error}),
      (user) => done(null, user)
    )
  // )

  /**
   * Writes a valid user into a database where email must be unique.
   * @Side-Effect:
   *    Writing to database
   *    Reading from filesystem
   *    Sending an E-Mail
   * @param {Object} user - {
   *  {String} name,
   *  {String} email,
   *  {String} password,
   *  {String} verification
   * }
   * @return {Task} Array({String} Error) User
   */
  const registration = (user) => {
    return taskFromValidation(validUser(user))
    .chain(hash('password'))
    .chain(db.createUnique('email', 'User'))
    .map(assoc('url', 'http://localhost:3000/v1/user/confirm/'))
    .chain(email.renderEmail('confirmation-email'))
    .map(prop('html'))
    .chain(sendConfirmationEMail(db, email, user.email))
  }
  /**
   * Sets a users verified property to true.
   * @Side-Effect:
   *    Writing to database
   * @param {String} id - the user id.
   * @return {Task} NotFoundError User
   */
  const confirmation = (id) => {
    return db.updateById('User', {verified: true}, id)
    .chain(maybeUserToTask)
  }
  /**
   * Sets a token on which the user can reset the password and sends an E-Mail.
   * @Side-Effect:
   *    Writing to database
   *    Reading from filesystem
   *    Sending an E-Mail
   * @param {Object} user - {
   *  {String} email,
   * }
   * @return {Task} Error User
   */
  const sendResetPasswordEmail = (user) => {
    return Task.of(curry((token, id) => Object.assign({}, token, {id: id})))
    .ap(hash('token', {token: user.email}))
    .ap(db.findOne('User', {email: user.email})
      .chain(maybeUserToTask)
      .map(prop('_id'))
    )
    .chain(({id, token}) => db.updateById('User', {token: token}, id))
    .chain(maybeUserToTask)
    .map(assoc('url', 'http://localhost:3000/v1/user/resetPassword/'))
    .chain(email.renderEmail('reset-password-email'))
    .map(prop('html'))
    .chain(email.send('Tabata Reset Password', user.email))
  }
  const resetPasswordPage = (token) => {
    return db.findOne('User', {token: token})
    .chain(maybeUserToTask)
  }
  /**
   * Updates a users password and sends an email to verify to the user.
   * @Side-Effect:
   *    Writing to database
   *    Reading from filesystem
   *    Sending an E-Mail
   * @param {Object} user - {
   *  {String} _id,
   *  {String} password,
   *  {String} verification
   * }
   * @return {Task} Error User
   */
  const resetPassword = (user) => {
    return validatePassword(user.verification, user.password)
    .cata({
      Success: (password) => db.findById('User', user._id),
      Failure: (error) => Task.rejected(error)
    })
    .chain(maybeUserToTask)
    .map(user => user.token ? Just(user) : Nothing())
    .chain(maybeUser => maybeUser.cata({
      Just: Task.of,
      Nothing: () => Task.rejected({status: 401})
    }))
    .chain(savedUser => hash('password', {password: user.password})
      .map(({password}) => Object.assign({}, savedUser._doc, {
        token: null,
        password: password,
        verified: false
      }))
    )
    .chain(user => db.updateById('User', user, user._id))
    .chain(maybeUserToTask)
    .map(assoc('url', 'http://localhost:3000/v1/user/confirm/'))
    .chain(email.renderEmail('confirmation-email'))
    .map(prop('html'))
    .chain(sendConfirmationEMail(db, email, user.email))
  }
  return {
    serialize,
    deserialize,
    authenticate,
    registration,
    confirmation,
    sendResetPasswordEmail,
    resetPasswordPage,
    resetPassword,
  }
}



module.exports = User
