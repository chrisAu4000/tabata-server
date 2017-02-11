const User = require('../src/app/controller/user-controller')
const {assert} = require('chai')
const {Mongoose} = require('mongoose')
const mongoose = new Mongoose
const mockgoose = require('mockgoose')
const {connect} = require('../src/database')
const Task = require('data.task')
const {curry} = require('ramda')

let sendCalled = false
let renderEmailCalled = false

function EmailMock() {
  return {
    renderEmail: curry((template, params) => {
      renderEmailCalled = true
      return Task.of('TEMPLATE-STRING')
    }),
    send: curry((subject, to, template) => {
      sendCalled = true
      return Task.of('Success')
    })
  }
}

// EmailMock.prototype.renderEmail = curry((template, params) => {
//   this.renderEmailCalled = true
//   console.log(this)
//   return Task.of('TEMPLATE-STRING')
// })
//
// EmailMock.prototype.send = curry((subject, to, template) => {
//   this.sendCalled = true
//   return Task.of('Success')
// })
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
  describe('#register', function() {
    beforeEach(function(done) {
      renderEmailCalled = false
      sendCalled = false
      mockgoose.reset(function() {done(null)})
    })
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

    it('should throw an error if two users with same email are created', function(done) {
      user.registration(data).fork(assert.isNull, function(doc) {
        user.registration(data).fork(function(error) {
          try {
            assert.deepEqual(error, {
              name: 'ValidationError',
              key: 'email',
              message: 'unique key email already exists.',
            })
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
})
