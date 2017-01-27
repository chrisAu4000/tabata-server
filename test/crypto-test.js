const {assert} = require('chai')
const {Left, Right} = require('data.either')
const {hash, compare} = require('../src/app/crypto')

describe('Crypto', function() {
  describe('#hash', function() {
    it('should change a value to a hash', function(done) {
      hash('value', {value: 'value'}).fork(done, function(hash) {
        assert.notEqual('value', hash.value)
        done()
      })
    })
    it('should return an error if a value to hash is undefined', function(done) {
      hash('value', {value: undefined}).fork(
        function(error) {
          assert.isNotNull(error)
          done()
        },
        function(hash) {
          assert.isNull(hash)
          done()
        }
      )
    })
    it('should return a Right if two values are equal', function(done) {
      hash('value', {value: 'test'})
      .map(obj => obj.value)
      .chain(compare('test'))
      .fork(done, function(eitherMessage) {
        assert.deepEqual(eitherMessage, Right('Password correct'))
        done()
      })
    })
    it('should return a Left if two values are not equal', function(done) {
      hash('value', {value: 'test'})
      .map(obj => obj.value)
      .chain(compare('testing'))
      .fork(done, function(eitherMessage) {
        assert.deepEqual(eitherMessage, Left('Password not correct'))
        done()
      })
    })
  })
})
