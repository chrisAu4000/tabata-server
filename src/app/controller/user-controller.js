const Task = require('data.task')
const Validation = require('data.validation')
const {sequence, objOf, assoc, reduce} = require('ramda')
const {hash, compare} = require('../crypto')

const isEqual = (a, b) => new Task((rej, res) => a === b ? res(b) : rej('Not Equal'))

const keyValToObj = reduce((acc, curr) => assoc(curr.key, curr.value, acc),{})

const User = ({db}) => {
  const register = ({name, email, password, verification}) => {
    return sequence(
      Task.of,
      [
        Task.of(name).map(assoc('value')).ap(Task.of({key: 'name'})),
        Task.of(email).map(assoc('value')).ap(Task.of({key: 'email'})),
        isEqual(verification, password)
          .chain(hash)
          .map(assoc('value'))
          .ap(Task.of({key: 'password'}))
      ]
    )
    .map(keyValToObj)
    .chain(db.createUnique('email', 'User'))
  }

  const find = (email) => {
    return db.findOne('User', {email: email})
  }
  return {register, find}
}



module.exports = User
