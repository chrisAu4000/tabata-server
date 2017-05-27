const main = require('./server')
const db = require('./database')
const email = require('./email')

const {forEach, compose} = require('ramda')
const {logErrors} = require('./app/error')
const exit = compose(process.exit.bind(this, 1), logErrors)
main(db, email).fork(
	errors => exit(errors),
	server => {
		console.log('listen on port: ' + server.address().port)
	}
)

