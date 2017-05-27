// AUTHENTIFICATION MIDDLEWARE
const {curry, compose} = require('ramda')
const {compare} = require('../../crypto')
const {Success, Failure} = require('data.Validation')
const ForbiddenError = require('../../error/ForbiddenError')
const Task = require('data.task')

const isVerified = (user) =>
	user.verified === true
		? Success(user)
		: Failure('User is not verified.')

const comparePasswords = curry((password, user) =>
	compare(password, user.password)
		.chain(res => res.cata({
			Right: () => Task.of(user),
			Left: () => Task.rejected([new ForbiddenError('Incorrect password.')])
		}))
)

/**
 * Authenticates an user.
 * @param {DbDriver} db - The database on which the user should authenicate.
 * @param {String} email - The e-mail of an persisted user.
 * @param {String} password - The password of the user with the e-mail.
 * @param {Function} done - Callback
 */
const authenticate = 
	curry((db, email, password, done) =>
		db.findOne('User', {email: email})
			.map(isVerified)
			.chain(isVerified => isVerified.cata({
				Success: comparePasswords(password),
				Failure: () => Task.rejected([new ForbiddenError('E-Mail is not verified.')])
			}))
			.fork(
				(error) => done(null, false, error),
				(user) => done(null, user)
			)
	)

module.exports = authenticate