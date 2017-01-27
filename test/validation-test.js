const {assert} = require('chai')
const {Success, Failure} = require('data.validation')
const {
  match,
  isEqual,
  minLength,
  maxLength
} = require('../src/app/validation')

describe('Validation', function() {
  describe('#isEqual', function() {
    it('should retrun a Success if testvalues are equal.', function() {
      assert.deepEqual(isEqual('TEST MESSAGE', 'test', 'test'), Success('test'))
    })
    it('should return a Failure if testvalues are not equal.', function() {
      assert.deepEqual(isEqual('MESSAGE', 'test', 'est'), Failure(['MESSAGE']))
      assert.deepEqual(isEqual('MESSAGE', 'est', 'test'), Failure(['MESSAGE']))
    })
  })
  describe('#minLength', function() {
    it('should return a Success if values length is greater then or equal param.', function() {
      assert.deepEqual(minLength(4, 'MESSAGE', '1234'), Success('1234'))
    })
    it('should return a Failure if values length is less then param.', function() {
      assert.deepEqual(minLength(4, 'MESSAGE', '123'), Failure(['MESSAGE']))
    })
  })
  describe('#maxLength', function() {
    it('should return a Success if values length is less then param.', function() {
      assert.deepEqual(maxLength(4, 'MESSAGE', '123'), Success('123'))
    })
    it('should return a Failure if the length of value is greater then param.', function() {
      assert.deepEqual(maxLength(4, 'MESSAGE', '12345'), Failure(['MESSAGE']))
    })
  })
  describe('#match', function() {
    const onlyLetters = /^[a-zA-Z]+$/
    it('should return a Success if a value matches a regexp.', function() {
      assert.deepEqual(match(onlyLetters, 'MESSAGE', 'Letters'), Success('Letters'))
    })
    it('should return a Failure if a value does not match a regexp.', function() {
      assert.deepEqual(match(onlyLetters, 'MESSAGE', 'Le7ters'), Failure(['MESSAGE']))
    })
  })
})
