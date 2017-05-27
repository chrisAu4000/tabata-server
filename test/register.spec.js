const {assert} = require('chai')
const NotFoundError = require('../src/app/error/NotFoundError')
const FakeMail = require('./utils/fakeMail')
const fakeDb = require('./utils/fakeDb')()
const Validation = require('data.validation')
const ValidationError = require('../src/app/error/ValidationError')

before(function(done) {
	fakeDb.setup()
		.then(function(res) {
			done.call(this)
		})
		.catch(function(err) {
			done.bind(this, err)
		})
})
after(function() {
	return fakeDb.teardown()
})

const register = require('../src/app/controller/user/register')
const testUser = {
	name: 'Testuser',
	email: 'test@test.de',
	password: 'Passw0rd2',
	verification: 'Passw0rd2'
}

describe('Register', function() {
	beforeEach(function() {
		return fakeDb.removeCollection('User')
	})
	describe('User is not in the database', function() {
		beforeEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should register a user', function(done) {
			const email = new FakeMail()
			register(process.db, email, testUser)
				.fork(
					err => done.call(this, err),
					res => {
						assert.equal.call(this, res, 'Success')
						assert.isTrue.call(this, email.renderEmailCalled)
						assert.isTrue.call(true, email.hasSend)
						assert.equal.call(this, email.template, 'confirmation-email')
						fakeDb.find('User', {email: testUser.email}, function(err, doc) {
							assert.equal.call(this, doc.length, 1)
							const user = doc[0]
							assert.equal.call(this, user.name, testUser.name)
							assert.equal.call(this, user.email, testUser.email)
							done.call(this)
						})
					}
				)
		})
		it('should not register a user if confirmation-email can not be send', function(done) {
			const email = new FakeMail({shouldErrorOnSend: true})
			register(process.db, email, testUser)
				.fork(
					err => {
						console.log(err)
						assert.equal(err, 'Error')
						assert.isTrue.call(this, email.renderEmailCalled)
						assert.isTrue.call(true, email.hasSend)
						assert.equal.call(this, email.template, 'confirmation-email')
						fakeDb.find('User', {email: testUser.email}, function(err, doc) {
							assert.equal.call(this, doc.length, 0)
							done.call(this)
						})
					},
					res => {
						done.call(this, 'Not deleted user')
					}
				)
		})
		it('should return a ValidationError', function(done) {
			const email = new FakeMail()
			const invalidUser = {
				name: '123',
				email: 'test@test.com',
				password: 'Passw0rd2',
				verification: 'Passw0rd2'
			}
			register(process.db, email, invalidUser)
				.fork(
					err => {
						assert.deepEqual.call(this, 
							err, 
							[new ValidationError('Username must be longer than 4 characters.')]
						)
						assert.isFalse.call(this, email.renderEmailCalled)
						assert.isFalse.call(true, email.hasSend)
						fakeDb.find('User', {email: testUser.email}, function(err, doc) {
							assert.equal.call(this, doc.length, 0)
							done.call(this)
						})
					},
					res => {
						done.call(this)
					}
				)
		})
		it('should return a 2 ValidationErrors', function(done) {
			const email = new FakeMail()
			const invalidUser = {
				name: '123',
				email: 'testtest.com',
				password: 'Passw0rd2',
				verification: 'Passw0rd2'
			}
			register(process.db, email, invalidUser)
				.fork(
					err => {
						assert.deepEqual.call(this, 
							err, 
							[new ValidationError('Username must be longer than 4 characters.'),
							 new ValidationError('E-Mail of invalid format.')]
						)
						assert.isFalse.call(this, email.renderEmailCalled)
						assert.isFalse.call(true, email.hasSend)
						fakeDb.find('User', {email: testUser.email}, function(err, doc) {
							assert.equal.call(this, doc.length, 0)
							done.call(this)
						})
					},
					res => {
						done.call(this)
					}
				)
		})
	})
	describe('User already is in the database.', function() {
		beforeEach(function(done) {
			process.db.create('User', testUser)
				.fork(
					err => done.call(this, err),
					res => done.call(this)
				)
		})
		it('should return an Error', function(done) {
			const email = new FakeMail()
			register(process.db, email, testUser)
				.fork(
					err => {
						assert.deepEqual.call(this, 
							err, 
							[new ValidationError('unique key email already exists.')]
						)
						assert.isFalse.call(this, email.renderEmailCalled)
						assert.isFalse.call(true, email.hasSend)
						fakeDb.find('User', {email: testUser.email}, function(err, doc) {
							assert.equal.call(this, doc.length, 1)
							done.call(this)
						})
					},
					res => {
						assert.fail.call(this, 'Registered user.')
						done.call(this)
					}
				)
		})
	})
})