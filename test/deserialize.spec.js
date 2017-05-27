const {assert} = require('chai')
const NotFoundError = require('../src/app/error/NotFoundError')
const fakeDb = require('./utils/fakeDb')()
const deserialize = require('../src/app/controller/user/deserialize')

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

describe('Deserialize', function() {
	
	describe('User is not in the database', function() {
		beforeEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should call the callback with error=null, user=null', function(done) {
			deserialize(process.db, testUser._id, function(err, user) {
				assert.isNull.call(this, err)
				assert.isNull.call(this, user)
				done.call(this)
			})
		})
	})

	describe('User in database', function() {
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
		it('should return the user', function(done) {
			deserialize(process.db, testUser._id, function(err, user) {
				assert.equal.call(this, user._id, testUser._id)
				assert.equal.call(this, user.name, testUser.name)
				assert.equal.call(this, user.email, testUser.email)
				assert.equal.call(this, user.password, testUser.password)
				done.call(this)
			})
		})
	})
})