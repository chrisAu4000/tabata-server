function NotFoundError(message) {
	this.status = 404
  this.name = 'NotFoundError'
  this.message = message
}

Object.setPrototypeOf(NotFoundError, Error.prototype)

module.exports = NotFoundError
