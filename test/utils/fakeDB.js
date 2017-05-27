const {Mongoose} = require('mongoose')

const mockgoose = require('mockgoose')
const {connect} = require('../../src/database')
let mongoose
module.exports = function() {
	return {
		setup: function() {
			if (process.db && process.db.isMocked === true) {
				return new Promise((res) => res.call(this, process.db))
			}
			mongoose = new Mongoose
			return mockgoose(mongoose)
				.then(function() {
					return new Promise(function(res, rej) {
						connect(mongoose, 'mongodb://localhost:27017/tabata')
							.fork(rej.bind(this), function(db) {
								res.call(this, db)
							})
					})
				})
				.then(function(db) {
					process.db = db
				})
				.catch(function(err) {
					console.error(err)
					process.exit(1)
				})
		},
		teardown: function() {
			return Promise.all(Object.keys(mongoose.connection.models).map(function(model) {
					delete mongoose.connection.models[model]
					return Promise.resolve()
				}))
				.then(mongoose.disconnect())
				.then(function() {
					delete process.db
				})
		},
		removeCollection: function(collection) {
			return mongoose.connection.model(collection).remove({})
		},
		find: function(model, data, cb) {
			return mongoose.model(model).find(data, cb)
		},
		create: function(model, data, cb) {
			return mongoose.model(model).create(data, cb)
		}
	}
}
