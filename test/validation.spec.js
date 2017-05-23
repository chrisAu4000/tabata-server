const { describe, given, it, equals } = require('45')
const {Success, Failure} = require('data.validation')
const {
  match,
  isEqualString,
  minLength,
  maxLength
} = require('../src/app/validation')
const onlyLetters = /^[a-zA-Z]+$/
module.exports = describe('Validation', [
  given('#isEqual', [
    it('should return a Success if testvalues are equal.', () => {
      return equals(Success('test'), isEqualString('TEST MESSAGE', 'test', 'test'))
    }),
    it('should return a Failure if testvalues are not equal.', () => {
      return equals(Failure(['MESSAGE']), isEqualString('MESSAGE', 'test', 'est'))
    }),
    it('should return a Failure if testvalues are not equal.', () => {
      return equals(Failure(['MESSAGE']), isEqualString('MESSAGE', 'est', 'test'))
    }),
    it('should return a Failure if first value is falsy.', () => {
      return equals(Failure(['undefined is not a string']), isEqualString('MESSAGE', undefined, 'test'))
    }),
    it('should return a Failure if second value is falsy.', () => {
      return equals(Failure(['undefined is not a string']), isEqualString('MESSAGE', 'test', undefined))
    })
  ]),
  given('#minLength', [
    it('should return a Success if values length is greater then or equal param.', () => {
      return equals(Success('1234'), minLength(4, 'MESSAGE', '1234'))
    }),
    it('should return a Failure if values length is less then param.', () => {
      return equals(Failure(['MESSAGE']), minLength(4, 'MESSAGE', '123'))
    }),
    it('should return a Failure if test value is falsy.', () => {
      return equals(Failure(['MESSAGE']), minLength(4, 'MESSAGE', undefined))
    }),
    it('should return a Failure if test value is falsy.', () => {
      return equals(Failure(['MESSAGE']), minLength(4, 'MESSAGE', null))
    })
  ]),
  given('#maxLength', [
    it('should return a Success if values length is less then param.', () => {
      return equals(Success('123'), maxLength(4, 'MESSAGE', '123'))
    }),
    it('should return a Failure if the length of value is greater then param.', () => {
      return equals(Failure(['MESSAGE']), maxLength(4, 'MESSAGE', '12345'))
    }),
    it('should return a Failure if test value is falsy.', () => {
      return equals(Failure(['MESSAGE']), maxLength(4, 'MESSAGE', undefined))
    })
  ]),
  given('#match', [
    it('should return a Success if a value matches a regexp.', () => {
      return equals(Success('Letters'), match(onlyLetters, 'MESSAGE', 'Letters'))
    }),
    it('should return a Failure if a value does not match a regexp.', () => {
      return equals(Failure(['MESSAGE']), match(onlyLetters, 'MESSAGE', 'Le7ters'))
    }),
    it('should return a Failure if test value is falsy.', () => {
      return equals(Failure(['Can not match undefined']), match(onlyLetters, 'MESSAGE', undefined))
    })
  ])
])
