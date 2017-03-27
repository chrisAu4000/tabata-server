const { describe, given, it, equals } = require('45')
const {Success, Failure} = require('data.validation')
const {
  match,
  isEqual,
  minLength,
  maxLength
} = require('../src/app/validation')
const onlyLetters = /^[a-zA-Z]+$/
module.exports = describe('Validation', [
  given('#isEqual', [
    it('should return a Success if testvalues are equal.', () => {
      return equals(isEqual('TEST MESSAGE', 'test', 'test'), Success('test'))
    }),
    it('should return a Failure if testvalues are not equal.', () => {
      return equals(isEqual('MESSAGE', 'test', 'est'), Failure(['MESSAGE']))
    }),
    it('should return a Failure if testvalues are not equal.', () => {
      return equals(isEqual('MESSAGE', 'est', 'test'), Failure(['MESSAGE']))
    })
  ]),
  given('#minLength', [
    it('should return a Success if values length is greater then or equal param.', () => {
      return equals(minLength(4, 'MESSAGE', '1234'), Success('1234'))
    }),
    it('should return a Failure if values length is less then param.', () => {
      return equals(minLength(4, 'MESSAGE', '123'), Failure(['MESSAGE']))
    })
  ]),
  given('#maxLength', [
    it('should return a Success if values length is less then param.', () => {
      return equals(maxLength(4, 'MESSAGE', '123'), Success('123'))
    }),
    it('should return a Failure if the length of value is greater then param.', () => {
      return equals(maxLength(4, 'MESSAGE', '12345'), Failure(['MESSAGE']))
    })
  ]),
  given('#match', [
    it('should return a Success if a value matches a regexp.', () => {
      return equals(match(onlyLetters, 'MESSAGE', 'Letters'), Success('Letters'))
    }),
    it('should return a Failure if a value does not match a regexp.', () => {
      return equals(match(onlyLetters, 'MESSAGE', 'Le7ters'), Failure(['MESSAGE']))
    })
  ])
])
