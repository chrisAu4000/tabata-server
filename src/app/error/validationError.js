function ValidationError(msg) {
	this.status = 400
	this.name = 'ValidationError'
	this.message = msg
}

Object.setPrototypeOf(ValidationError, Error.prototype)

module.exports = ValidationError
