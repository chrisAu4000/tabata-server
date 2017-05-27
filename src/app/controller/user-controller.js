const Task = require('data.task')
const {validUser} = require('../validation/user-validation')
const {Success, Failure} = require('data.validation')
const {Right, Left} = require('data.either')
const {Just, Nothing} = require('data.maybe')
const {curry, curryN, identity, prop, compose, assoc} = require('ramda')
const {hash, compare} = require('../crypto')
const {isEqual, match, minLength, maxLength, taskFromValidation} = require('../validation')
const validationError = require('../error/validationError')
const notFoundError = require('../error/notFoundError')
const emailError = require('../error/emailError')

const User = ({db, email}) => {
	/**
	 * Finds a user by a token if both, the token and the user exists.
	 * @param {String} token - The token by which the user will be searched.
	 * @return {Task} Task Error User
	 */
	const resetPasswordPage = (token) =>
		db.findOne('User', {token: token})
			.chain(maybeUserToTask)
	const findById = (id) => db
		.findOne('User', {_id: id})
		.chain(maybeUserToTask)
		
	const findByEmail = (email) => db
		.findOne('User', {email: email})
		// .chain(maybeUserToTask)

	return {
		// AUTHENTIFICATION MIDDLEWARE
		serialize: 							require('./user/serialize'),
		deserialize: 						require('./user/deserialize')(db),
		authenticate: 					require('./user/authenticate')(db),
		// API
		registration: 					require('./user/register')(db, email),
		confirmation: 					require('./user/confirm')(db),
		sendResetPasswordEmail: require('./user/requestPasswordReset')(db, email),
		resetPassword:					require('./user/resetPassword')(db, email),
		resetPasswordPage,
		findById,
		findByEmail
	}
}

module.exports = User
