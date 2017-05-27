process.env.NODE_ENV = 'test'
const Task = require('data.task')
const fakeDb = require('../utils/fakeDb')()
const FakeMail = require('../utils/FakeMail')
const server = require('../../src/server')
const chai = require('chai')
chai.use(require('chai-http'))
const assert = chai.assert
const {Mongoose} = require('mongoose')
const mockgoose = require('mockgoose')
const db = require('../../src/database')

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
const wrapper = function(x) {
	return {
		connect: function() {
			return Task.of(x)
		}
	}
}

describe('POST/user', function() {
	beforeEach(function() {
		return fakeDb.removeCollection('User')
	})
	it('should save the user', function(done) {
		const db = wrapper(process.db)
		const email = wrapper(FakeMail())
		server(db, email)
			.fork(
				err => done.call(this, err),
				api => {
					const userdata = {
						name: 'test user',
						email: 'test@test.com',
						password: 'newPassw0rd',
						verification: 'newPassw0rd'
					}
					chai.request(api)
						.post('/v1/user')
						.send(userdata)
						.end((err, res) => {
							api.close()
							if (err) return done(err)
							assert.equal(res.status, 200)
							fakeDb.find('User', {email: userdata.email}, function(err, docs) {
								assert.equal(docs.length, 1)
								const user = docs[0]
								assert.isFalse(user.verified)
								assert.notEqual(user.password, userdata.password)
								done()
							})
						})
				})
	})
	it('should response with ValidationError', function(done) {
		const db = wrapper(process.db)
		const email = wrapper(FakeMail())
		server(db, email)
			.fork(
				err => done.call(this, err),
				api => {
					const userdata = {
						name: 'test user',
						email: 'test@test.com',
						password: 'newPassw0rd',
						verification: 'newPassword'
					}
					chai.request(api)
						.post('/v1/user')
						.send(userdata)
						.end((err, res) => {
							api.close() 
							if (err) {
								assert.equal(err.status, 400)
								return done()
							}
							assert.fail('status is: ' + res.status)
							done()
						})
				})
	})
	it('should response with ValidationError. Verification = undefined', function(done) {
		const db = wrapper(process.db)
		const email = wrapper(FakeMail())
		server(db, email)
			.fork(
				err => done.call(this, err),
				api => {
					const userdata = {
						name: 'test user',
						email: 'test@test.com',
						password: 'newPassw0rd',
					}
					chai.request(api)
						.post('/v1/user')
						.send(userdata)
						.end((err, res) => {
							api.close()
							if (err) {
								assert.equal(err.status, 400)
								return done()
							}
							assert.fail('status is: ' + res.status)
							done()
						})
				})
	})
	it('should response with ValidationError. Password != Verification', function(done) {
		const db = wrapper(process.db)
		const email = wrapper(FakeMail())
		server(db, email)
			.fork(
				err => done.call(this, err),
				api => {
					const userdata = {
						name: 'test user',
						email: 'test@test.com',
						password: 'newPassw0rd',
						verification: 'newPassword'
					}
					chai.request(api)
						.post('/v1/user')
						.send(userdata)
						.end((err, res) => {
							api.close()
							if (err) {
								assert.equal(err.status, 400)
								done()
							}
							assert.fail('status is: ' + res.status)
							done()
						})
				})
	})
})