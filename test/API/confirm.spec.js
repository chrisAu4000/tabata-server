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

describe('PATCH/user/confirm/:id', function() {
	beforeEach(function() {
		return fakeDb.removeCollection('User')
	})
	it('should reject with status 404', function(done) {
		const db = wrapper(process.db)
		const email = wrapper(FakeMail())
		server(db, email)
			.fork(
				err => done.call(this, err),
				api => {
					chai.request(api)
						.patch('/v1/user/confirm/token')
						.end((err, res) => {
							api.close(function() {
								if (err) {
									assert.equal(err.status, 404)
									fakeDb.find('User', {}, function(err, docs) {
										assert.equal(docs.length, 0)
										return done()
									})
								} else {
									assert.fail('found user')
									done()
								}
							})
						})
				})
	})
	describe('User in database', function() {
		beforeEach(function(done) {
			const data = {
				_id: '58a3730d78c045c18607d489',
				name: 'testUser',
				email: 'test@test.com',
				password: 'password',
				verified: false,
			}
			fakeDb.create('User', data, function(err, res) {
				if (err) return done(err)
				done()
			})
		})
		afterEach(function() {
			return fakeDb.removeCollection('User')
		})
		it('should set the verified property of a user to true', function(done) {
			const db = wrapper(process.db)
			const fmail = FakeMail()
			const email = wrapper(fmail)
			server(db, email)
				.fork(
					err => done.call(this, err),
					api => {
						chai.request(api)
							.patch('/v1/user/confirm/58a3730d78c045c18607d489')
							.end((err, res) => {
								api.close()
								if (err) {
									assert.fail('status is: ' + err.status)
								} else {
									assert.equal(res.status, 200)
									fakeDb.find('User', {}, function(err, docs) {
										if (err) return done(err)
										assert.equal(docs.length, 1)
										const user = docs[0]
										assert.isTrue(user.verified)
									})
								}
								done()
							})
					})
		})
	})
	// it('should response with ValidationError. Verification = undefined', function(done) {
	// 	const db = wrapper(process.db)
	// 	const email = wrapper(FakeMail())
	// 	server(db, email)
	// 		.fork(
	// 			err => done.call(this, err),
	// 			api => {
	// 				const userdata = {
	// 					name: 'test user',
	// 					email: 'test@test.com',
	// 					password: 'newPassw0rd',
	// 				}
	// 				chai.request(api)
	// 					.post('/v1/user')
	// 					.send(userdata)
	// 					.end((err, res) => {
	// 						api.close(function() {
	// 							if (err) {
	// 								assert.equal(err.status, 400)
	// 								done()
	// 							}
	// 							assert.fail('status is: ' + res.status)
	// 							done()
	// 						})
	// 					})
	// 			})
	// })
	// it('should response with ValidationError. Password != Verification', function(done) {
	// 	const db = wrapper(process.db)
	// 	const email = wrapper(FakeMail())
	// 	server(db, email)
	// 		.fork(
	// 			err => done.call(this, err),
	// 			api => {
	// 				const userdata = {
	// 					name: 'test user',
	// 					email: 'test@test.com',
	// 					password: 'newPassw0rd',
	// 					verification: 'newPassword'
	// 				}
	// 				chai.request(api)
	// 					.post('/v1/user')
	// 					.send(userdata)
	// 					.end((err, res) => {
	// 						api.close(function() {
	// 							if (err) {
	// 								assert.equal(err.status, 400)
	// 								done()
	// 							}
	// 							assert.fail('status is: ' + res.status)
	// 							done()
	// 						})
	// 					})
	// 			})
	// })
})