function LoggedError(message) {
	this.status = 423
  this.name = 'LoggedError'
  this.message = message
}

Object.setPrototypeOf(LoggedError, Error.prototype)

module.exports = LoggedError
