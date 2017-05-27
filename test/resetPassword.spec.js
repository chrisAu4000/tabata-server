const {assert} = require('chai')
const NotFoundError = require('../src/app/error/NotFoundError')
const ValidationError = require('../src/app/error/ValidationError')
const UnauthorizedError = require('../src/app/error/UnauthorizedError')
const fakeDb = require('./utils/fakeDb')()
const fakeMail = require('./utils/fakeMail')
const resetPassword = require('../src/app/controller/user/resetPassword')
const {hash, compare} = require('../src/app/crypto')

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
	fakeDb.teardown()
})

const testUser = {
	_id: '58a3730d78c045c18607d489',
	password: 'Passw0rd2',
	verification: 'Passw0rd2',
}

describe('ResetPassword', function() {
	describe('User is not in the database', function() {
		it('should return a NotFoundError', function(done) {
			const email = new fakeMail()
			resetPassword(process.db, email, testUser)
				.fork(
					err => {
						assert.deepEqual.call(
							this,
							[new NotFoundError('Cannot find document with _id: ' + testUser._id)], 
							err
						)
						fakeDb.find('User', {_id: testUser._id}, function(err, docs) {
							assert.isNull(err)
							assert.equal(docs.length, 0)
							done.call(this)
						})
					},
					res => {
						assert.fail('insterted a user')
						done.call(this)
					}
				)
		})
	})
	describe('User in database is not confirmed', function() {
		beforeEach(function(done) {
			hash('password', {password: testUser.password})
				.chain(({password}) => process.db.create('User', {
					_id: testUser._id,
					name: 'testuser',
					email: 'testuser@test.com',
					password: password,
					verified: false,
					token: 'randomString'
				}))
				.fork(
					err => done.call(this, err),
					res => done.call(this)
				)
		})
		afterEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should return a UnauthorizedError', function(done) {
			const email = new fakeMail()
			resetPassword(process.db, email, {
					_id: testUser._id,
					password: 'n3wPw___',
					verification: 'n3wPw___'
				})
				.fork(
					err => {
						assert.deepEqual.call(
							this,
							[new UnauthorizedError('Not allowed to reset password')], 
							err
						)
						fakeDb.find('User', {_id: testUser._id}, function(err, docs) {
							assert.isNull(err)
							assert.equal(docs.length, 1)
							const user = docs[0]
							assert.isFalse(user.verified)
							assert.equal(user.token, 'randomString')
							compare('n3wPw___', user.password)
								.fork(
									err => {
										done.call(this)
									},
									res => {
										assert.isTrue(res.isLeft)
										done.call(this)
									}
								)
						})
					},
					res => {
						assert.fail('insterted a user')
						done.call(this)
					}
				)
		})
	})
	describe('User in database has no tocken', function() {
		beforeEach(function(done) {
			hash('password', {password: testUser.password})
				.chain(({password}) => process.db.create('User', {
					_id: testUser._id,
					name: 'testuser',
					email: 'testuser@test.com',
					password: password,
					verified: true,
					token: null
				}))
				.fork(
					err => done.call(this, err),
					res => done.call(this)
				)
		})
		afterEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should return a UnauthorizedError', function(done) {
			const email = new fakeMail()
			resetPassword(process.db, email, testUser)
				.fork(
					err => {
						assert.deepEqual.call(
							this,
							[new UnauthorizedError('Not allowed to reset password')], 
							err
						)
						fakeDb.find('User', {_id: testUser._id}, function(err, docs) {
							assert.isNull(err)
							assert.equal(docs.length, 1)
							const user = docs[0]
							assert.isTrue(user.verified)
							assert.isNull(user.token)
							compare('n3wPw___', user.password)
								.fork(
									err => {
										done.call(this)
									},
									res => {
										assert.isTrue(res.isLeft)
										done.call(this)
									}
								)
						})
					},
					res => {
						assert.fail('insterted a user')
						done.call(this)
					}
				)
		})
	})
	describe('User in database has a tocken', function() {
		beforeEach(function(done) {
			hash('password', {password: testUser.password})
				.chain(({password}) => process.db.create('User', {
					_id: testUser._id,
					name: 'testuser',
					email: 'testuser@test.com',
					password: password,
					verified: true,
					token: 'randomString'
				}))
				.fork(
					err => done.call(this, err),
					res => done.call(this)
				)
		})
		afterEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should return a UnauthorizedError', function(done) {
			const email = new fakeMail()
			resetPassword(process.db, email, {
					_id: testUser._id,
					password: 'n3wPw___',
					verification: 'n3wPw___'
				})
				.fork(
					err => {
						done.call(this, err)
					},
					res => {
						assert.equal('Success', res)
						assert.isTrue(email.hasSend)
						assert.equal(email.template, 'confirmation-email')
						fakeDb.find('User', {_id: testUser._id}, function(err, docs) {
							assert.isNull(err)
							assert.equal(docs.length, 1)
							const user = docs[0]
							assert.isFalse(user.verified)
							assert.isNull(user.token)
							compare('n3wPw___', user.password)
								.fork(
									err => {
										done.call(this)
									},
									res => {
										assert.isTrue(res.isRight)
										done.call(this)
									}
								)
						})
					}
				)
		})
	})
})