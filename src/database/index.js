const Task = require('data.task')
const {curry, compose, toLower, path} = require('ramda')
const models = require('./models')
const DatabaseError = require('../app/error/DatabaseError')

const initializeModel = curry((database, {name, schema, collection}) =>
	database.model(name, new database.Schema(schema, {collection: collection}))
)

const toDriverUrl = str => './' + str + '-driver'
const driverFromDatabase = compose(require, toDriverUrl, toLower, path(['constructor', 'name']))
const sendError = rej => compose(rej, Array.of)
const connect = (database, url) => new Task((rej, res) => {
	try {
		let driver = undefined
		driver = driverFromDatabase(database)
		database.Promise = global.Promise
		models.forEach(initializeModel(database))

		database.connect(url).catch(function(error) {
			rej([error])
		})
		database.connection.on('disconnected', () => sendError(rej)(new DatabaseError('Database disconnected')))
		database.connection.once('open', () => res(driver(database)))
		// If the Node process ends, close the Mongoose connection 
		process.on('SIGINT', () => {  
			database.connection.close(() => { 
				console.log('Mongoose default connection disconnected through app termination')
				process.exit(0)
			})
		})
	} catch(error) { 
		rej([error]) 
	}
})

module.exports = {connect}
