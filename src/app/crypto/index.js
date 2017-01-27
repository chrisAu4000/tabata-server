const Task = require('data.task')
const {Right, Left} = require('data.either')
const bcrypt = require('bcrypt')
const {curry, assoc} = require('ramda')

const hash = curry((key, value) => new Task((rej, res) => {
  bcrypt.hash(value[key], 10, (err, hash) =>
    err
      ? rej(err)
      : res(assoc(key, hash, value))
  )
}))

const compare = curry((password, hash) => new Task((rej, res) =>
  bcrypt.compare(password, hash, (err, isEqual) =>
    err
      ? rej(err)
      : res(isEqual
        ? Right('Password correct')
        : Left('Password not correct')
      )
  )
))

module.exports = {hash, compare}
