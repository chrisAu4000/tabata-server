const {curry} = require('ramda')

const ValidationError = curry((key, message) => {
  return {
    name: 'ValidationError',
    key: key,
    message: message,
  }
})

module.exports = ValidationError
