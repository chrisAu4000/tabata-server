const {curry} = require('ramda')
const {Success, Failure} = require('data.validation')
const Task = require('data.task')

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
  value
    && typeof value.length === 'number'
    && value.length >= length
    ? Success(value)
    : Failure([message])
)

const maxLength = curry((length, message, value) =>
  value.length < length
    ? Success(value)
    : Failure([message])
)

const taskFromValidation = (validation) => new Task((rej, res) => {
  return validation.isFailure
    ? rej(validation.merge())
    : res(validation.get())
})

module.exports = {isEqual, match, minLength, maxLength, taskFromValidation}
