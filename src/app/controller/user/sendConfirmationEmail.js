const Task = require('data.task')
const {curry} = require('ramda')

const sendConfirmationEMail = curry((db, email, userEmail, template) =>
	email.send('Tabata Confirmation', userEmail, template)
	.orElse((error) =>
		db.removeOne('User', {email: userEmail})
			.chain((user) => Task.rejected(error)))
)

module.exports = sendConfirmationEMail