const {curry} = require('ramda')

const validationError = curry((key, message) => {
  return {
    name: 'ValidationError',
    key: key,
    message: message,
  }
})

module.exports = validationError
