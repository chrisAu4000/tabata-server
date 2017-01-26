const User = require('../src/app/controller/user-controller')
const {assert} = require('chai')
const {Mongoose} = require('mongoose')
const mongoose = new Mongoose
const mockgoose = require('mockgoose')
const {connect} = require('../src/database')
let user = undefined

before(function(done) {
  mockgoose(mongoose).then(function() {
    connect(mongoose, 'mongodb://localhost:27017/tabata')
      .fork(done, function(db) {
        user = User({db})
        done()
      })
  })
})

describe('User-Controller', function() {
  describe('#register', function() {
    beforeEach(function(done) {
      mockgoose.reset(function() {done(null)})
    })
    const data = {
      name: 'testuser',
      email: 'test@test.com',
      password: 't3stPassw0rd',
      verification: 't3stPassw0rd'
    }

    it('should insert a user', function(done) {
      user.register(data).fork(function(error) {
        done(error)
      }, function(user) {
        done()
      })
    })

    it('should hash the password', function(done) {
      user.register(data).fork(done, function(user) {
        try {
          assert.notEqual('testpassword', user.password)
          done()
        } catch(err) {
          done(err)
        }
      })
    })

    it('should throw an error if two users with same email are created', function(done) {
      user.register(data).fork(assert.isNull, function(doc) {
        user.register(data).fork(function(error) {
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
  })
})
