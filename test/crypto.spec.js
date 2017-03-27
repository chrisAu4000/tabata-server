const { describe, given, it, equals, pass } = require('45')
const { streamWrapper } = require('./utils')
const { Left, Right } = require('data.either')
const { hash, compare } = require('../src/app/crypto')

module.exports = describe('Crypto', [
  given('#hash', [
    it('should change a value to a hash', () => {
      return streamWrapper(hash('value', {value: 'value'}))
        .take(1)
        .map(x => x.value)
        .map(pass)
    }),
    it('should return an error if a value to hash is undefined', () => {
      return streamWrapper(hash('value', {value: undefined}))
        .take(1)
        .replaceError(err => xs.of('err'))
        .map(pass)
    })
  ]),
  given('#compare', [
    it('should return a Right if two values are equal', () => {
      return streamWrapper(hash('value', {value: 'test'}))
        .map(x => x.value)
        .map(hash => streamWrapper(compare('test', hash)))
        .flatten()
        .take(1)
        .map(equals(Right('Password correct')))
    }),
    it('should return a Left if two values are not equal', () => {
      return streamWrapper(hash('value', {value: 'test'}))
        .map(x => x.value)
        .map(hash => streamWrapper(compare('testing', hash)))
        .flatten()
        .take(1)
        .map(equals(Left('Password not correct')))
    })
  ])

])
