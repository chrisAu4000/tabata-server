const Task = require('data.task')
const Either = require('data.either')
const bcrypt = require('bcrypt')

const hash = (password) => new Task((rej, res) => {
  bcrypt.hash(password, 10, (err, hash) => err ? rej(err) : res(hash))
})

const compare = (password, hash) => new Task((rej, res) =>
  bcrypt.compare(password, hash, (err, isEqual) =>
      err
    ? rej(err)
    : res(isEqual
      ? Right('Password correct')
      : Left('Password not correct')
    )
  )
)

module.exports = {hash, compare}
