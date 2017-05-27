const User = require('../src/app/controller/user-controller')
const {assert} = require('chai')
const {Mongoose} = require('mongoose')
const mongoose = new Mongoose
const mockgoose = require('mockgoose')
const {connect} = require('../src/database')
const Task = require('data.task')
const {curry} = require('ramda')
const ValidationError = require('../src/app/error/ValidationError')
const NotFoundError = require('../src/app/error/NotFoundError')
const UnauthorizedError = require('../src/app/error/UnauthorizedError')

let sendCalled = false
let renderEmailCalled = false
let shouldReturnMailError = false
function EmailMock() {
  return {
    renderEmail: curry((template, params) => {
      renderEmailCalled = true
      return Task.of('TEMPLATE-STRING')
    }),
    send: curry((subject, to, template) => {
      sendCalled = true
      return shouldReturnMailError
        ? Task.rejected('Error')
        : Task.of('Success')
    })
  }
}

let user = undefined
let emailMock = new EmailMock()

before(function(done) {
  mockgoose(mongoose).then(function() {
    connect(mongoose, 'mongodb://localhost:27017/tabata')
      .fork(done, function(db) {
        user = User({db, email: emailMock})
        done()
      })
  })
})

describe('User-Controller', function() {
  beforeEach(function(done) {
    renderEmailCalled = false
    sendCalled = false
    mockgoose.reset(function() {done(null)})
  })
  const testUser = {
    _id: '58a3730d78c045c18607d489',
    name: 'Test',
    email: 'test@test.com',
    password: 'password',
    verified: true
  }
  describe('#serialize', function() {
    it('should return the user id', function(done) {
      user.serialize({_id: 'testId'}, function(error, id) {
        if (error) done(error)
        assert.strictEqual(id, 'testId')
        done()
      })
    })
  })
  describe('#deserialize', function() {
    describe('empty database', function() {
      it('should return null', function(done) {
        user.deserialize('58a1f27c348c5f3190cf316f', function(error, user) {
          if (error) done(error)
          try {
            assert.strictEqual(user, null)
            done()
          } catch (error) {
            done(error)
          }
        })
      })
    })
    describe('user in database', function() {
      beforeEach(function(done) {
        const con = mongoose.connection
        con.model('User').create(testUser, function(error, res) {
          if (error) done(error)
          done()
        })
      })
      it('should return a user', function(done) {
        user.deserialize(testUser._id, function(error, user) {
          if (error) done(error)
          try {
            assert.equal(user._id, testUser._id)
            assert.strictEqual(user.name, testUser.name)
            assert.strictEqual(user.email, testUser.email)
            assert.strictEqual(user.password, testUser.password)
            done()
          } catch (error) {
            done(error)
          }
        })
      })
    })
  })
  describe('#authenticate', function() {
    describe('no user found', function() {
      it('should return an error message.', function(done) {
        user.authenticate('wrong-email', 'password', function(error, res, msg) {
          if (error) done(error)
          try {
            assert.strictEqual(false, res)
            assert.strictEqual('Cannot find user with query: {"email":"wrong-email"}', msg.message)
            done()
          } catch (error) {
            done(error)
          }
        })
      })
    })
    describe('user not verified.', function() {
      beforeEach(function(done) {
        const con = mongoose.connection
        const unverifiedUser = Object.assign({}, testUser, {verified: false})
        con.model('User').create(unverifiedUser, function(error, res) {
          if (error) done(error)
          done()
        })
      })
      it('should return an error message: E-Mail is not verified.', function(done) {
        user.authenticate(
          testUser.email,
          testUser.password,
          function(error, res, msg) {
          if (error) done(error)
          try {
            assert.strictEqual(false, res)
            assert.strictEqual('E-Mail is not verified.', msg.message)
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })
    describe('user has wrong password.', function() {
      const con = mongoose.connection
      beforeEach(function(done) {
        con.model('User').create(testUser, function(error, res) {
          if (error) done(error)
          done()
        })
      })
      it('should return an error message: Incorrect password.', function(done) {
        user.authenticate(
          testUser.email,
          'testUserpassword',
          function(error, res, msg) {
          if (error) done(error)
          try {
            assert.strictEqual(false, res)
            assert.strictEqual('Incorrect password.', msg.message)
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })
  })

  describe('#registration', function() {
    const data = {
      name: 'testuser',
      email: 'test@test.com',
      password: 't3stPassw0rd',
      verification: 't3stPassw0rd'
    }

    it('should insert a user', function(done) {
      user.registration(data).fork(function(error) {
        done(error)
      }, function(user) {
        done()
      })
    })

    it('should hash the password', function(done) {
      user.registration(data).fork(done, function(user) {
        try {
          assert.notEqual('testpassword', user.password)
          done()
        } catch(err) {
          done(err)
        }
      })
    })

    it('should delete the saved User if sending email failes', function(done) {
      const con = mongoose.connection
      shouldReturnMailError = true
      user.registration(data).fork(
        error => {
          con.model('User').find({email: data.email}, function(error, users) {
            if (error) done(error)
            assert.strictEqual(0, users.length)
            shouldReturnMailError = false
            done()
          })
        },
        user => {
          shouldReturnMailError = false
          done()
        }
      )
    })

    it('should throw an error if two users with same email are created', function(done) {
      user.registration(data).fork(assert.isNull, function(doc) {
        user.registration(data).fork(function(error) {
          try {
            assert.deepEqual(
							new ValidationError(`unique key email already exists.`), 
							error
						)
            done()
          } catch(error) {
            done(error)
          }
        }, function(doc) {
          try {
            assert.isNull(doc)
            done()
          } catch(err) {
            done(err)
          }
        })
      })
    })

    it('should render an email', function(done) {
      user.registration(data).fork(assert.isNull, function(doc) {
        try {
          assert.strictEqual(renderEmailCalled, true)
          done()
        } catch(error) {
          done(error)
        }
      })
    })

    it('should send an email', function(done) {
      user.registration(data).fork(assert.isNull, function(doc) {
        try {
          assert.strictEqual(sendCalled, true)
          done()
        } catch(error) {
          done(error)
        }
      })
    })
  })

  describe('#confirmation', function() {
    describe('user not in database', function() {

      it('should return NotFoundError.', function(done) {
        user.confirmation(testUser._id).fork(
          error => {
            try {
							const expected = new NotFoundError('Cannot find document with _id: ' + testUser._id)
              assert.deepEqual(expected, error),
              done()
            } catch(error) {
              done(error)
            }
          },
          user => {
            assert.deepEqual(null, user)
            done()
          }
        )
      })

    })

    describe('user in database', function() {
      beforeEach(function(done) {
        const con = mongoose.connection
        con.model('User').create(testUser, function(error, res) {
          if (error) done(error)
          done()
        })
      })

      it('should return a verified user.', function(done) {
        user.confirmation(testUser._id).fork(
          error => error && done(error),
          user => {
            try {
              assert.equal(testUser._id, user._id)
              assert.deepEqual(true, user.verified)
              done()
            } catch (error) {
              done(error)
            }
          }
        )
      })
    })
  })
  describe('#sendResetPasswordEmail', function() {
    describe('user not in database', function() {
      it('should return NotFoundError', function(done) {
        user.sendResetPasswordEmail(testUser).fork(
          error => {
            try {
							const expected = new NotFoundError('Cannot find user with query: {\"email\":\"test@test.com\"}')
              assert.deepEqual(expected, error)
              done()
            } catch(error) {
              done(error)
            }
          },
          res => {
            try {
              assert.strictEqual(null, res)
              done()
            } catch (error) {
              done(error)
            }
          }
        )
      })
    })

    describe('user in database', function() {
      const con = mongoose.connection
      beforeEach(function(done) {
        con.model('User').create(testUser, function(error, res) {
          if (error) done(error)
          done()
        })
      })

      it('should send an email.', function(done) {
        user.sendResetPasswordEmail(testUser).fork(
          error => error && done(error),
          res => {
            try {
              assert.strictEqual(true, renderEmailCalled)
              assert.strictEqual(true, sendCalled)
              done()
            } catch(error) {
              done(error)
            }
          }
        )
      })
      it('should update the user token', function(done) {
        user.sendResetPasswordEmail(testUser).fork(
          error => error && done(error),
          res => {
            con.model('User').findById(testUser._id, function(error, user) {
              try {
                assert.notEqual(null, user.token)
                done()
              } catch(error) {
                done(error)
              }
            })
          }
        )
      })
    })
  })

  describe('#resetPassword', function() {
    describe('user not in database', function() {
      const data = {
        _id: '58a3730d78c045c18607d489',
        password: 't3stPassw0rd',
        verification: 't3stPassw0rd'
      }
      it ('should return NotFoundError', function(done) {
        user.resetPassword(data).fork(
          error => {
            try {
							const expected = new NotFoundError('Cannot find document with _id: ' + data._id)
              assert.deepEqual(expected, error)
              done()
            } catch(error) {
              done(error)
            }
          },
          res => {
            assert.strictEqual(null, res)
            done()
          }
        )
      })
    })
    describe('user in database', function() {
      const con = mongoose.connection
      const data = {
        _id: '58a3730d78c045c18607d489',
        password: 't3stPassw0rd',
        verification: 't3stPassw0rd'
      }
      describe('user without token', function() {
        beforeEach(function(done) {
          con.model('User').create(testUser, function(error, res) {
            if (error) done(error)
            done()
          })
        })
        it ('should return status 401', function(done) {
          user.resetPassword(data).fork(
            error => {
              try {
								const expected = new UnauthorizedError('Not allowed to reset password')
                assert.deepEqual(expected, error)
                done()
              } catch(error) {
                done(error)
              }
            },
            res => {
              assert.strictEqual(null, res)
              done()
            }
          )
        })
      })
      describe('user with token.', function() {
        beforeEach(function(done) {
          con.model('User').create(Object.assign({}, testUser, {
              token: '$2a$10$.OXYZ7LQHYGXZkAqgO6HieieAOePtG3h/iNRmK9rE/1.HtNQgaFxO'
            }),
            function(error, res) {
            if (error) done(error)
            done()
          })
        })
        it ('should return status 401', function(done) {
          const data = {
            _id: '58a3730d78c045c18607d489',
            password: 't3stPassw0rd',
            verification: 't3stPassw0rds'
          }
          user.resetPassword(data).fork(
            error => {
              try {
								const expected = [new ValidationError('Password and verification must be equal.')]
                assert.deepEqual(expected, error)
                done()
              } catch(error) {
                done(error)
              }
            },
            res => {
              assert.strictEqual(null, res)
              done()
            }
          )
        })
        it('should update a user in database', function(done) {
          const data = {
            _id: '58a3730d78c045c18607d489',
            password: 't3stPassw0rd',
            verification: 't3stPassw0rd'
          }
          user.resetPassword(data).fork(
            error => error && done(error),
            res => {
              try {
                con.model('User').findById(testUser._id, function(error, user) {
                  if (error) done(error)
                  assert.strictEqual(false, user.verified)
                  assert.strictEqual(null, user.token)
                  assert.notEqual(testUser.password, user.password)
                })
                done()
              } catch(error) {
                done(error)
              }
            }
          )
        })
      })
    })
  })
})
