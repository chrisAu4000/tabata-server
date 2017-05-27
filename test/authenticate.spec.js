const {assert} = require('chai')
const { curry, prop, compose, apply } = require('ramda')
const authenticate = require('../src/app/controller/user/authenticate')
const NotFoundError = require('../src/app/error/NotFoundError')
const ValidationError = require('../src/app/error/ValidationError')
const ForbiddenError = require('../src/app/error/ForbiddenError')
const {hash} = require('../src/app/crypto')
const Task = require('data.task')
const fakeDb = require('./utils/fakeDb')()

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

describe('Authenticate', function() {
	
	describe('empty database', function() {
		it('should return a not found message', function(done) {
			authenticate(process.db, 'username', 'password', function(err, res, info) {
				const expected = [new NotFoundError('Cannot find user with query: {\"email\":\"username\"}')]
				assert.isNull.call(this, err, 'Error was thrown.')
				assert.equal.call(this, false, res, 'User was found')
				assert.deepEqual.call(this, expected, info)
				done()
			})
		})
	})

	describe('user in database', function() {
		const testUser = {
			name: 'Testuser',
			email: 'test@test.com',
			password: 'password',
			verified: true
		}
		beforeEach(function(done) {
			hash('password', testUser)
				.chain(process.db.create('User'))
				.fork(
					err => done(err),
					res => done()
				)
		})
		afterEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should return a user', function(done) {
			authenticate(process.db, testUser.email, 'password', function(err, res, info) {
				assert.isNull.call(this, err, 'Error was thrown')
				assert.isUndefined.call(this, info)
				assert.equal(testUser.name, res._doc.name)
				assert.equal(testUser.email, res._doc.email)
				assert.equal(testUser.verified, res._doc.verified)
				done.call(this)
			})
		})
		it('should return a ForbiddenError: Incorrect password.', function(done) {
			authenticate(process.db, testUser.email, 'Password', function(err, res, info) {
				const expected = [new ForbiddenError('Incorrect password.')]
				assert.isNull.call(this, err, 'Error was thrown')
				assert.isFalse.call(this, res)
				assert.deepEqual.call(this, expected, info)
				done.call(this)
			})
		})
		it('should return a message: Cannot find user with query: {\"email\":\"wtest@test.com\"}', function(done) {
			authenticate(process.db, 'wtest@test.com' , testUser.password, function(err, res, info) {
				const expected = [new NotFoundError('Cannot find user with query: {\"email\":\"wtest@test.com\"}')]
				assert.isNull.call(this, err, 'Error was thrown')
				assert.isFalse.call(this, res)
				assert.deepEqual.call(this, expected, info)
				done.call(this)
			})
		})
	})
})