const {curry} = require('ramda')
const {Success, Failure} = require('data.validation')

const isEqual = curry((msg, a, b) => {
  return a === b
    ? Success(b)
    : Failure([msg])
})

const match = curry((regEx, msg, value) => {
  return value.match(regEx)
    ? Success(value)
    : Failure([msg])
})

const minLength = curry((length, message, value) =>
  value.length > length
    ? Success(value)
    : Failure([message])
)

const maxLength = curry((length, message, value) =>
  value.length < length
    ? Success(value)
    : Failure([message])
)

module.exports = {isEqual, match, minLength, maxLength}
