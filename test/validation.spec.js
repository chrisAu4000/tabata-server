const {assert} = require('chai')
const {Success, Failure} = require('data.validation')
const {
	match,
	isEqualString,
	minLength,
	maxLength
} = require('../src/app/validation')
const ValidationError = require('../src/app/error/ValidationError')
const onlyLetters = /^[a-zA-Z]+$/

describe('Validation', function() {
	describe('#isEqualString', function() {
		it('should retrun a Success if test(a, a) are equal.', function() {
			assert.deepEqual(isEqualString('TEST MESSAGE', 'test', 'test'), Success('test'))
		})
		it('should return a Failure if test(a, b) && a != b.', function() {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), isEqualString('MESSAGE', 'test', 'est'))
		})
		it('should return a Failure if test(b, a) && a != b', function() {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), isEqualString('MESSAGE', 'est', 'test'))
		})
		it('should return a Failure if first value is falsy.', function() {
			assert.deepEqual(Failure([new ValidationError('undefined is not a string')]), isEqualString('MESSAGE', undefined, 'test'))
		})
		it('should return a Failure if second value is falsy.', () => {
			assert.deepEqual(Failure([new ValidationError('undefined is not a string')]), isEqualString('MESSAGE', 'test', undefined))
		})
	})
	describe('#minLength', function() {
		it('should return a Success if values length is greater then or equal param.', function() {
			assert.deepEqual(minLength(4, 'MESSAGE', '1234'), Success('1234'))
		})
		it('should return a Failure if values length is less then param.', function() {
			assert.deepEqual(minLength(4, 'MESSAGE', '123'), Failure([new ValidationError('MESSAGE')]))
		})
		it('should return a Failure if test value is null.', () => {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), minLength(4, 'MESSAGE', undefined))
		}),
		it('should return a Failure if test value is undefined.', () => {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), minLength(4, 'MESSAGE', null))
		})
	})
	describe('#maxLength', function() {
		it('should return a Success if values length is less then param.', function() {
			assert.deepEqual(maxLength(4, 'MESSAGE', '123'), Success('123'))
		})
		it('should return a Failure if the length of value is greater then param.', function() {
			assert.deepEqual(maxLength(4, 'MESSAGE', '12345'), Failure([new ValidationError('MESSAGE')]))
		})
		it('should return a Failure if test value is null.', () => {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), maxLength(4, 'MESSAGE', null))
		})
		it('should return a Failure if test value is undefined.', () => {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), maxLength(4, 'MESSAGE', undefined))
		})
	})
	describe('#match', function() {
		it('should return a Success if a value matches a regexp.', function() {
			assert.deepEqual(Success('Letters'), match(onlyLetters, 'MESSAGE', 'Letters'))
		})
		it('should return a Failure if a value does not match a regexp.', function() {
			assert.deepEqual(Failure([new ValidationError('MESSAGE')]), match(onlyLetters, 'MESSAGE', 'Le7ters'))
		})
		it('should return a Failure if a value is undefined.', function() {
			assert.deepEqual(Failure([new ValidationError('Can not match undefined')]), match(onlyLetters, 'MESSAGE', undefined))
		})
		it('should return a Failure if a value is null.', function() {
			assert.deepEqual(Failure([new ValidationError('Can not match null')]), match(onlyLetters, 'MESSAGE', null))
		})
	})
})
