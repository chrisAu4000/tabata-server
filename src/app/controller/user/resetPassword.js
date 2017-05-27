const {curry, assoc, prop} = require('ramda')
const Task = require('data.task')
const {validatePassword} = require('../../validation/user-validation')
const NotFoundError = require('../../error/notFoundError')
const UnauthorizedError = require('../../error/UnauthorizedError')
const {hash} = require('../../crypto')
const sendConfirmationEMail = require('./sendConfirmationEmail')
/**
 * Updates a users password and sends an email to verify to the user.
 * @Side-Effect:
 *    Writing to database
 *    Reading from filesystem
 *    Sending an E-Mail
 * @param {Object} user
 * @param {String} user._id
 * @param {String} user.password
 * @param {String} user.verification
 * @return {Task} Task Error User
 */
const resetPassword = curry(
	(db, email, user) =>
	validatePassword(user.verification, user.password)
		.cata({
			Success: (password) => db.findById('User', user._id),
			Failure: (error) => Task.rejected(error)
		})
		.chain(user => user.token && user.verified
			? Task.of(user) 
			: Task.rejected([new UnauthorizedError('Not allowed to reset password')])
		)
		.chain(savedUser => hash('password', {password: user.password})
			.map(({password}) => Object.assign({}, savedUser._doc, {
				token: null,
				password: password,
				verified: false
			}))
		)
		.chain(user => db.updateById('User', user, user._id))
		.map(assoc('url', 'http://localhost:3000/v1/user/confirm/'))
		.chain(email.renderEmail('confirmation-email'))
		.map(prop('html'))
		.chain(sendConfirmationEMail(db, email, user.email))
)

module.exports = resetPassword