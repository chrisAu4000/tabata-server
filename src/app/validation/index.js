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

module.exports = {isEqual, match}
