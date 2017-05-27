function UnauthorizedError(message) {
	this.status = 401
  this.name = 'UnauthorizedError'
  this.message = message
}

Object.setPrototypeOf(UnauthorizedError, Error.prototype)

module.exports = UnauthorizedError
