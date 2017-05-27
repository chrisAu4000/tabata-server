const {assert} = require('chai')
const FakeMail = require('./utils/fakeMail')
const fakeDb = require('./utils/fakeDb')()
const requestPasswordReset = require('../src/app/controller/user/requestPasswordReset')
const NotFoundError = require('../src/app/error/NotFoundError')

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

const testUser = {
	_id: '58a3730d78c045c18607d489',
	name: 'Testuser',
	email: 'test@test.com',
	password: 'password',
	verified: true
}

describe('RequestPasswordReset', function() {
	describe('User is not in the database', function() {
		beforeEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should return a NotFoundError', function(done) {
			const email = new FakeMail()
			requestPasswordReset(process.db, email, testUser)
				.fork(
					err => {
						const expected = [new NotFoundError('Cannot find user with query: {"email":"test@test.com"}')]
						assert.deepEqual.call(this, err, expected)
						assert.isFalse.call(this, email.hasSend)
						fakeDb.find('User', testUser, function(err, docs) {
							assert.equal.call(this, docs.length, 0)
							done.call(this)
						})
					},
					res => done.call(this, 'requested password-reset.')
				)
		})
	})
	describe('User is in database', function() {
		beforeEach(function(done) {
			process.db.create('User', testUser)
				.fork(
					err => done.call(this, err),
					res => done.call(this)
				)
		})
		afterEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should send a reset-password-email.', function(done) {
			const email = new FakeMail()
			requestPasswordReset(process.db, email, testUser)
				.fork(
					err => done.call(this, err),
					res => {
						assert.isTrue.call(this, email.hasSend)
						assert.isTrue.call(this, email.renderEmailCalled)
						assert.equal.call(this, email.template, 'reset-password-email')
						fakeDb.find('User', {email: testUser.email}, function(err, docs) {
							if (err) return done.call(this, err)
							assert.equal.call(this, docs.length, 1)
							const user = docs[0]
							assert.isNotNull.call(this, user.token)
							done.call(this)
						})
					}
				)
		})

	})
})