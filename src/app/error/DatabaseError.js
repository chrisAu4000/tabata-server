function DatabaseError(msg) {
	this.name = 'DatabaseError'
	this.message = msg
}
Object.setPrototypeOf(DatabaseError, Error.prototype)

module.exports = DatabaseError