const {curry, assoc, prop} = require('ramda')
const {hash} = require('../../crypto')
const NotFoundError = require('../../error/notFoundError')
const Task = require('data.task')
/**
 * Sets a token on which the user can reset the password and sends an E-Mail.
 * @Side-Effect:
 *    Writing to database
 *    Reading from filesystem
 *    Sending an E-Mail
 * @param {DbDriver} db - The database in which the user is.
 * @param {MailDriver} email - The mail-service that sends the email.
 * @param {Object} user
 * @param {String} user.email
 * @return {Task} Task Error User
 */
const sendResetPasswordEmail = 
	curry((db, email, user) =>
		Task.of(curry((token, id) => Object.assign({}, token, {id: id})))
		.ap(hash('token', {token: user.email}))
		.ap(db
			.findOne('User', {email: user.email})
			.map(prop('_id'))
		)
		.chain(({id, token}) => db.updateById('User', {token: token}, id))
		.map(assoc('url', 'http://localhost:3000/v1/user/resetPassword/'))
		.chain(email.renderEmail('reset-password-email'))
		.map(prop('html'))
		.chain(email.send('Tabata Reset Password', user.email))
	)

module.exports = sendResetPasswordEmail