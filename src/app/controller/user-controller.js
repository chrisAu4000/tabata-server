const Task = require('data.task')
const Validation = require('data.validation')
const {sequence, objOf, assoc, reduce, curry, prop, compose} = require('ramda')
const {hash, compare} = require('../crypto')
const {isEqual, match, minLength, maxLength} = require('../validation')
const {validationError} = require('../error/validationError')

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
const taskFromValidation = (validation) => new Task((rej, res) => {
  return validation.isFailure
    ? rej(validation.merge())
    : res(validation.get())
})

const User = ({db}) => {
  const register = (user) => {
    return taskFromValidation(validUser(user))
    .chain(hash('password'))
    .chain(db.createUnique('email', 'User'))
  }

  const find = (email) => {
    return db.findOne('User', {email: email})
  }

  return {register, find}
}



module.exports = User
