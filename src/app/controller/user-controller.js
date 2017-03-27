const Task = require('data.task')
const {validUser} = require('../validation/user-validation')
const {Success, Failure} = require('data.validation')
const {Right, Left} = require('data.either')
const {Just, Nothing} = require('data.maybe')
const {curry, curryN, identity, prop, compose, assoc} = require('ramda')
const {hash, compare} = require('../crypto')
const {isEqual, match, minLength, maxLength, taskFromValidation} = require('../validation')
const validationError = require('../error/validationError')
const notFoundError = require('../error/notFoundError')
const emailError = require('../error/emailError')

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
  /**
   * Extracts the user id from the user and calles the done callback with it.
   * @param {Object} user
   * @param {String} user._id
   * @param {Function} done
   */
  const serialize = (user, done) => done(null, user._id)
  /**
   * Finds an user by id and calles the done callback with it.
   * @param {String} id - The id of an user.
   * @param {Function} done - callback.
   */
  const deserialize = (id, done) =>
    db.findById('User', id)
      .fork(done, maybeUser => maybeUser.cata({
        Just: (user) => done(null, user),
        Nothing: (_) => done(null, null)
      }))
  /**
   * Authenticates an user.
   * @param {String} email - The e-mail of an persisted user.
   * @param {String} password - The password of the user with the e-mail.
   * @param {Function} done - Callback
   */
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
  /**
   * Writes a valid user into a database where email must be unique.
   * @Side-Effect:
   *    Writing to database
   *    Reading from filesystem
   *    Sending an E-Mail
   * @param {Object} user
   * @param {String} user.name
   * @param {String} user.email
   * @param {String} user.password
   * @param {String} user.verification
   * @return {Task} Array({String} Error) User
   */
  const registration = (user) =>
    taskFromValidation(validUser(user))
      .chain(hash('password'))
      .chain(db.createUnique('email', 'User'))
      .map(assoc('url', 'http://localhost:3000/v1/user/confirm/'))
      .chain(email.renderEmail('confirmation-email'))
      .map(prop('html'))
      .chain(sendConfirmationEMail(db, email, user.email))
  /**
   * Sets a users verified property to true.
   * @Side-Effect:
   *    Writing to database
   * @param {String} id - the user id.
   * @return {Task} Task NotFoundError User
   */
  const confirmation = (id) =>
    db.updateById('User', {verified: true}, id)
      .chain(maybeUserToTask)
  /**
   * Sets a token on which the user can reset the password and sends an E-Mail.
   * @Side-Effect:
   *    Writing to database
   *    Reading from filesystem
   *    Sending an E-Mail
   * @param {Object} user
   * @param {String} user.email
   * @return {Task} Task Error User
   */
  const sendResetPasswordEmail = (user) =>
    Task.of(curry((token, id) => Object.assign({}, token, {id: id})))
      .ap(hash('token', {token: user.email}))
      .ap(db
        .findOne('User', {email: user.email})
        .chain(maybeUserToTask)
        .map(prop('_id'))
      )
      .chain(({id, token}) => db.updateById('User', {token: token}, id))
      .chain(maybeUserToTask)
      .map(assoc('url', 'http://localhost:3000/v1/user/resetPassword/'))
      .chain(email.renderEmail('reset-password-email'))
      .map(prop('html'))
      .chain(email.send('Tabata Reset Password', user.email))
  /**
   * Finds a user by a token if both, the token and the user exists.
   * @param {String} token - The token by which the user will be searched.
   * @return {Task} Task Error User
   */
  const resetPasswordPage = (token) =>
    db.findOne('User', {token: token})
      .chain(maybeUserToTask)
  /**
   * Updates a users password and sends an email to verify to the user.
   * @Side-Effect:
   *    Writing to database
   *    Reading from filesystem
   *    Sending an E-Mail
   * @param {Object} user
   * @param {String} user._id
   * @param {String} user.password
   * @param {String} user.verification
   * @return {Task} Task Error User
   */
  const resetPassword = (user) =>
    validatePassword(user.verification, user.password)
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
