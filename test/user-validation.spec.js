const { validatePassword, validateName, validateEmail } = require('../src/app/validation/user-validation')
const { describe, given, it, equals } = require('45')
const { Failure, Success } = require('data.validation')

exports.passwordValidation = describe('validatePassword', [
  given('verification !== password', [
    it('should return [\'Password and verification must be equal.\']', () => {
      return equals(
        Failure(['Password and verification must be equal.']),
        validatePassword('random', 'Val1dPass')
      )
    }),
  ]),
  given('verification & password length < 8', [
    it('should return [\'Password must be longer than 8 characters.\']', () => {
      return equals(
        Failure(['Password must be longer than 8 characters.']),
        validatePassword('Val1dPa', 'Val1dPa')
      )
    })
  ]),
  given('verification & password length > 40', [
    it('should return [\'Password should not be longer than 40 characters.\']', () => {
      const password = Array
        .apply(null, {length: 39})
        .map(x => 'x')
        .concat(['X', '1'])
        .join('')
      return equals(
        Failure(['Password should not be longer than 40 characters.']),
        validatePassword(password, password)
      )
    })
  ]),
  given('verification & password does not include a number and a capital letter', [
    it('should return [\'Password of invalid fromat.\']', () => {
      return equals(
        Failure(['Password of invalid format.']),
        validatePassword('Password', 'Password')
      )
    }),
    it('should return [\'Password of invalid fromat.\']', () => {
      return equals(
        Failure(['Password of invalid format.']),
        validatePassword('password4', 'password4')
      )
    }),
    it('should return [\'Password of invalid fromat.\']', () => {
      return equals(
        Failure(['Password of invalid format.']),
        validatePassword('password', 'password')
      )
    })
  ]),
  given('verification & password length < 8 + password does not include a nummber', [
    it('should return [' +
      '\'Password must be longer than 8 characters.\',' +
      '\'Password of invalid format.\'' +
    ']', () => {
      return equals(
        Failure([
          'Password must be longer than 8 characters.',
          'Password of invalid format.'
        ]),
        validatePassword('ValidPa', 'ValidPa')
      )
    })
  ]),
  given('verification === password', [
    it('should return \'Val1dPas\'', () => {
      return equals(
        Success('Val1dPas'),
        validatePassword('Val1dPas', 'Val1dPas')
      )
    })
  ]),
])

exports.nameValidation = describe('validateUsername', [
  given('username length < 5.', [
    it('should return [\'Username must be longer than 4 characters.\']', () => {
      return equals(
        Failure(['Username must be longer than 4 characters.']),
        validateName('123')
      )
    })
  ]),
  given('username length > 40.', [
    it('should return [\'Username must be longer than 4 characters.\']', () => {
      const username = Array
        .apply(null, {length: 41})
        .map(x => 'x')
        .join('')
      return equals(
        Failure(['Username should not be longer than 40 characters']),
        validateName(username)
      )
    })
  ]),
  given('5 < username length < 40.', [
    it('should return \'Username\'', () => {
      return equals(
        Success('Username'),
        validateName('Username')
      )
    })
  ]),
])
// const validateEmail = (email) =>
//   Validation.of(curry((a,b,c) => a))
//   .ap(match(emailRegEx, 'E-Mail of invalid fromat.', email))
//   .ap(minLength(6, 'E-Mail must be longer than 6 characters.', email))
//   .ap(maxLength(60, 'E-Mail should not be longer than 60 characters.', email))
exports.emailValidation = describe('validateUserEmail', [
  given('email without @', [
    it('should return [\'E-Mail of invalid format.\']', () => {
      return equals(
        Failure(['E-Mail of invalid format.']),
        validateEmail('emailmail.com')
      )
    })
  ]),
  given('email without .', [
    it('should return [\'E-Mail of invalid format.\']', () => {
      return equals(
        Failure(['E-Mail of invalid format.']),
        validateEmail('email@mailcom')
      )
    })
  ]),
  given('email without with spaces', [
    it('should return [\'E-Mail of invalid format.\']', () => {
      return equals(
        Failure(['E-Mail of invalid format.']),
        validateEmail('email@ mail.com')
      )
    })
  ]),
  given('email length < 6', [
    it('should return [\'E-Mail must be longer than 6 characters.\']', () => {
      return equals(
        Failure(['E-Mail must be longer than 6 characters.']),
        validateEmail('e@m.c')
      )
    })
  ]),
  given('email length > 60', [
    it('should return [\'E-Mail should not be longer than 60 characters.\']', () => {
      const email = Array
        .apply(null, {length: 56})
        .map(x => 'x')
        .concat(['@m.c'])
        .join('')
      return equals(
        Failure(['E-Mail should not be longer than 60 characters.']),
        validateEmail(email)
      )
    })
  ]),
  given('valid email', [
    it('should return \'email@mail.com\'', () => {
      return equals(
        Success('email@mail.com'),
        validateEmail('email@mail.com')
      )
    })
  ])
])
