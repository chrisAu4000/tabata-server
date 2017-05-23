const Validation = require('data.validation')
const { curry, curryN, identity } = require('ramda')
const {isEqualString, match, minLength, maxLength, taskFromValidation} = require('./index')
const emailRegEx = /^[\w\.]+@[a-zA-Z_-]+?\.[a-zA-Z]{1,10}$/g
const passwordRegEx = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*/g

const user = curry((name, email, password) => ({name, email, password}))

const validatePassword = (verification, password) =>
  Validation.of(curryN(4, identity))
  .ap(isEqualString('Password and verification must be equal.', verification, password))
  .ap(minLength(8, 'Password must be longer than 8 characters.', password))
  .ap(maxLength(40, 'Password should not be longer than 40 characters.', password))
  .ap(match(passwordRegEx, 'Password of invalid format.', password))

const validateName = (name) =>
  Validation.of(curryN(2, identity))
  .ap(minLength(4, 'Username must be longer than 4 characters.', name))
  .ap(maxLength(40, 'Username should not be longer than 40 characters', name))

const validateEmail = (email) =>
  Validation.of(curryN(3, identity))
  .ap(match(emailRegEx, 'E-Mail of invalid format.', email))
  .ap(minLength(6, 'E-Mail must be longer than 6 characters.', email))
  .ap(maxLength(60, 'E-Mail should not be longer than 60 characters.', email))

const validUser = ({name, email, password, verification}) =>
  Validation.of(user)
  .ap(validateName(name))
  .ap(validateEmail(email))
  .ap(validatePassword(verification, password))

module.exports = {
  validUser,
  validatePassword,
  validateName,
  validateEmail
}
