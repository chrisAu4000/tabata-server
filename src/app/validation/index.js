const {curry, curryN, identity} = require('ramda')
const Validation = require('data.validation')
const {Success, Failure} = Validation
const Task = require('data.task')
const Maybe = require('data.maybe')

const isSetoid =
  a => typeof a.equals === 'function'
    ? Success(a)
    : Failure([a + ' is not a setoid'])

const isType = curry((message, type, a) =>
  typeof a === type
    ? Success(a)
    : Failure([message(a)])
)

const isString = isType((a) => a + ' is not a string', 'string')

const isFunction = curry((message, f, a) =>
  a && typeof a[f] === 'function'
    ? Success(a)
    : Failure([message(a)])
)

const hasMatch = isFunction((a) => 'Can not match ' + a, 'match')

const isEqual = curry((message, a, b) =>
  a === b
    ? Success(b)
    : Failure([message])
)

const isEqualString = curry((message, a, b) =>
  Validation
    .of(curryN(2, (a, b) => b))
    .ap(isString(a))
    .ap(isString(b))
    .cata({
      Failure: Failure,
      Success: isEqual(message, a)
    })
)

const match = curry((regEx, message, value) =>
  hasMatch(value)
    .cata({
      Failure: Failure,
      Success: val => val.match(regEx)
        ? Success(value)
        : Failure([message])
    })
)

const minLength = curry((length, message, value) =>
  value
    && typeof value.length === 'number'
    && value.length >= length
    ? Success(value)
    : Failure([message])
)

const maxLength = curry((length, message, value) =>
  value
    && typeof value.length === 'number'
    && value.length < length
    ? Success(value)
    : Failure([message])
)

const taskFromValidation = (validation) => new Task((rej, res) => {
  return validation.isFailure
    ? rej(validation.merge())
    : res(validation.get())
})

module.exports = {isEqualString, match, minLength, maxLength, taskFromValidation}
