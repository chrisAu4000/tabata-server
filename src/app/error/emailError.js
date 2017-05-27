function EmailError(message) {
  this.name = 'E-MailError'
  this.message = message
}

Object.setPrototypeOf(EmailError, Error.prototype)

module.exports = EmailError
