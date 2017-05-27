function ForbiddenError(message) {
	this.status = 403
  this.name = 'ForbiddenError'
  this.message = message
}

Object.setPrototypeOf(ForbiddenError, Error.prototype)

module.exports = ForbiddenError