const Task = require('data.task')
const {curry, assoc, prop} = require('ramda')
const {validUser} = require('../../validation/user-validation')
const {hash} = require('../../crypto')
const sendConfirmationEMail = require('./sendConfirmationEmail')

/**
 * Writes a valid user into a database where email must be unique.
 * @Side-Effect:
 *    Writing to database
 *    Reading from filesystem
 *    Sending an E-Mail
 * @param {DbDriver} db - The database in which the user should be saved.
 * @param {MailDriver} email - The e-mail-service which should send an confirmation-e-mail.
 * @param {Object} user
 * @param {String} user.name
 * @param {String} user.email
 * @param {String} user.password
 * @param {String} user.verification
 * @return {Task} Array({String} Error) User
 */
const register = curry((db, email, user) =>
	validUser(user)
		.cata({ Success: hash('password'), Failure: Task.rejected })
		.chain(db.createUnique('email', 'User'))
		.map(assoc('url', 'http://localhost:3000/v1/user/confirm/'))
		.chain(email.renderEmail('confirmation-email'))
		.map(prop('html'))
		.chain(sendConfirmationEMail(db, email, user.email))
)

module.exports = register