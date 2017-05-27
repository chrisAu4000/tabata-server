// AUTHENTIFICATION MIDDLEWARE
const {curry} = require('ramda')

/**
 * Finds an user by id and calles the done callback with it.
 * @param {DbDriver} db - The database in that an id will be searched.
 * @param {String} id - The id of an user.
 * @param {Function} done - callback.
 */
const deserialize = 
	curry((db, id, done) => db.findById('User', id)
		.fork(
			error => error.length === 1 && error[0].name === 'NotFoundError' 
				? done(null, null) 
				: done(error),
			user => done(null, user)
		)
	)

module.exports = deserialize