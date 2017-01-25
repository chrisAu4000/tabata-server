const Task = require('data.task')
const Validation = require('data.validation')
const {sequence, objOf, assoc, reduce, curry, prop, compose} = require('ramda')
const {hash, compare} = require('../crypto')
const {validate, isEqual, match} = require('../validation')

const emailRegEx = /^[\w\.]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,10}$/g
const passwordRegEx = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,16}$/g
const user = curry((name, email, password) => ({name, email, password}))
const validPassword = isEqual('password and verification.')
const validEmail = match(emailRegEx, 'E-Mail of invalid fromat.')

const User = ({db}) => {
  const register = ({name, email, password, verification}) => {
    const validUser = Validation.of(user)
      .ap(Validation.of(name))
      .ap(validEmail(email))
      .ap(validPassword(verification, password))
    return new Task((rej, res) => {
      validUser.isFailure
        ? rej(validUser.merge())
        : res(validUser.get())
      })
      .chain(hash('password'))
      .chain(db.createUnique('email', 'User'))
  }

  const find = (email) => {
    return db.findOne('User', {email: email})
  }
  return {register, find}
}



module.exports = User
