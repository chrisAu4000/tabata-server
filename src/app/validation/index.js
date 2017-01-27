const {curry} = require('ramda')
const {Success, Failure} = require('data.validation')

const isEqual = curry((message, a, b) => {
  return a === b
    ? Success(b)
    : Failure([message])
})

const match = curry((regEx, message, value) => {
  return value.match(regEx)
    ? Success(value)
    : Failure([message])
})

const minLength = curry((length, message, value) =>
  value.length >= length
    ? Success(value)
    : Failure([message])
)

const maxLength = curry((length, message, value) =>
  value.length < length
    ? Success(value)
    : Failure([message])
)

module.exports = {isEqual, match, minLength, maxLength}
