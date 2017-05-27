const {assert} = require('chai')
const confirm = require('../src/app/controller/user/confirm')
const NotFoundError = require('../src/app/error/NotFoundError')
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
	fakeDb.teardown()
})

const testUser = {
	_id: '58a3730d78c045c18607d489',
	name: 'Testuser',
	email: 'test@test.com',
	password: 'password',
	verified: false
}
describe('Confirm', function() {
	describe('empty database', function() {
		beforeEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should return a NotFoundError', function(done) {
			const expected = [new NotFoundError('Cannot find document with _id: 58a3730d78c045c18607d489')]
			confirm(process.db, testUser._id)
				.fork(
					err => {
						assert.deepEqual.call(this, 
							err, 
							expected
						)
						done.call(this)
					},
					res => {
						assert.fail.call(this, res, 'Found a user.')
						done.call(this)
					})
		})
	})
	describe('test-user in database', function() {
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
		it('should update the verified propertie of the testuser to true', function(done) {
			confirm(process.db, testUser._id)
				.chain(() => process.db.find('User', {email: testUser.email}))
				.fork(
					err => done.call(this, err),
					res => {
						const users = res.getOrElse(done.bind(this))
						assert.equal.call(this, users.length, 1)
						const user = users[0]
						assert.equal.call(this, user._id, user._id)
						assert.equal.call(this, user.name, testUser.name)
						assert.equal.call(this, user.email, testUser.email)
						assert.equal.call(this, user.password, testUser.password)
						assert.isTrue.call(this, user.verified)
						done.call(this)
					}
				)
		})
		it('should return a NotFoundError', function(done) {
			const expected = [new NotFoundError('Cannot find document with _id: 58a3730d78c045c18607d480')]
			confirm(process.db, '58a3730d78c045c18607d480')
				.fork(
					err => {
						assert.deepEqual.call(this, err, expected)
						done.call(this)
					},
					res => {
						assert.fail.call(this, 'User was updated')
						done.call(this)
					}
				)
		})
	})
})