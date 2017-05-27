const { assert } = require('chai')
const { validatePassword, validateName, validateEmail } = require('../src/app/validation/user-validation')
const { Failure, Success } = require('data.validation')
const ValidationError = require('../src/app/error/ValidationError')
describe('User-Validation', function() {
	describe('validatePassword', function() {
		it('should return [\'Password and verification must be equal.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('Password and verification must be equal.')]),
				validatePassword('random', 'Val1dPass')
			)
		})
		it('should return [\'Password must be longer than 8 characters.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('Password must be longer than 8 characters.')]),
				validatePassword('Val1dPa', 'Val1dPa')
			)
		})
		it('should return [\'Password should not be longer than 40 characters.\']', function() {
			const password = Array
				.apply(null, {length: 39})
				.map(x => 'x')
				.concat(['X', '1'])
				.join('')
			assert.deepEqual(
				Failure([new ValidationError('Password should not be longer than 40 characters.')]),
				validatePassword(password, password)
			)
		})
		it('should return [\'Password of invalid fromat.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('Password of invalid format.')]),
				validatePassword('Password', 'Password')
			)
		})
		it('should return [\'Password of invalid fromat.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('Password of invalid format.')]),
				validatePassword('password4', 'password4')
			)
		})
		it('should return [\'Password of invalid fromat.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('Password of invalid format.')]),
				validatePassword('password', 'password')
			)
		})
		it('should return [' +
			'\'Password must be longer than 8 characters.\',' +
			'\'Password of invalid format.\'' +
			']', function() {
			assert.deepEqual(
				Failure([
					new ValidationError('Password must be longer than 8 characters.'),
					new ValidationError('Password of invalid format.')
				]),
				validatePassword('ValidPa', 'ValidPa')
			)
		})
		it('should return \'Val1dPas\'', function() {
			assert.deepEqual(
				Success('Val1dPas'),
				validatePassword('Val1dPas', 'Val1dPas')
			)
		})
	})
	describe('validateUsername', function() {
		it('should return [\'Username must be longer than 4 characters.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('Username must be longer than 4 characters.')]),
				validateName('123')
			)
		})
		it('should return [\'Username must be longer than 4 characters.\']', function() {
			const username = Array
				.apply(null, {length: 41})
				.map(x => 'x')
				.join('')
			assert.deepEqual(
				Failure([new ValidationError('Username should not be longer than 40 characters')]),
				validateName(username)
			)
		})
		it('should return \'Username\'', function() {
			assert.deepEqual(
				Success('Username'),
				validateName('Username')
			)
		})
	})
	describe('validateUserEmail', function() {
		it('should return [\'E-Mail of invalid format.\']', function() {
			assert.deepEqual(
				Failure([new ValidationError('E-Mail of invalid format.')]),
				validateEmail('emailmail.com')
			)
		})
		it('should return [\'E-Mail of invalid format.\']', () => {
			assert.deepEqual(
				Failure([new ValidationError('E-Mail of invalid format.')]),
				validateEmail('email@mailcom')
			)
		})
		it('should return [\'E-Mail of invalid format.\']', () => {
			assert.deepEqual(
				Failure([new ValidationError('E-Mail of invalid format.')]),
				validateEmail('email@ mail.com')
			)
		})
		it('should return [\'E-Mail must be longer than 6 characters.\']', () => {
			assert.deepEqual(
				Failure([new ValidationError('E-Mail must be longer than 6 characters.')]),
				validateEmail('e@m.c')
			)
		})
		it('should return [\'E-Mail should not be longer than 60 characters.\']', () => {
			const email = Array
				.apply(null, {length: 56})
				.map(x => 'x')
				.concat(['@m.c'])
				.join('')
			assert.deepEqual(
				Failure([new ValidationError('E-Mail should not be longer than 60 characters.')]),
				validateEmail(email)
			)
		})
		it('should return \'email@mail.com\'', () => {
			assert.deepEqual(
				Success('email@mail.com'),
				validateEmail('email@mail.com')
			)
		})
	})
})
