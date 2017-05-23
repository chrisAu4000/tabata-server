const Task = require('data.task')
const {fromNullable} = require('data.maybe')
const {curry, compose, assoc, map} = require('ramda')
const ValidationError = require('../app/error/validationError')
const models = require('./models')

const iface = (db) => {
  const create = curry((model, data) => new Task((rej, res) =>
    db.model(model).create(data).then(res, rej)
  ))

  const createUnique = curry((key, model, data) =>
    findOne(model, assoc(key, data[key], {}))
      .chain(maybe => maybe.isNothing
        ? create(model, data)
        : Task.rejected(ValidationError(key, `unique key ${key} already exists.`))
      )
  )

  const find = curry((model, query) => new Task((rej, res) =>
    db.model(model).find(query).then(compose(res, fromNullable), rej)
  ))
  // findOne :: String -> Query -> Task Error Maybe Doc
  const findOne = curry((model, query) => new Task((rej, res) =>
    db.model(model).findOne(query).then(compose(res, fromNullable), rej)
  ))

  const findById = curry((model, id) => new Task((rej, res) =>
    db.model(model).findById(id).then(compose(res, fromNullable), rej)
  ))

  const updateById = curry((model, data, id) => new Task((rej, res) =>
    db.model(model)
      .findByIdAndUpdate(id, {$set: data}, {runValidators: true})
      .then(fromNullable, rej)
      .then(mbDoc => res(mbDoc.map(doc => Object.assign({}, doc._doc, data))))
  ))

  const removeOne = curry((model, query) => new Task((rej, res) =>
    db.model(model).findOneAndRemove(query).then(res, rej)
  ))

  return {
    create,
    createUnique,
    find,
    findOne,
    findById,
    updateById,
    removeOne
  }
}

const connect = (driver, url) => new Task((rej, res) => {
  const initializeModel = curry((driver, {name, schema, collection}) =>
    driver.model(name, new driver.Schema(schema, {collection: collection}))
  )
  driver.Promise = global.Promise
  models
    .forEach(initializeModel(driver))
  driver
    .connect(url)
	
	driver.connection.once('open', () => res(iface(driver)))
	driver.connection.on('error', (e) => {
		return rej([{
			name: 'DatabaseError',
			message:'Cannot connect to mongodb'
		}])
	})
	driver.connection.on('disconnected', () => {
		return rej([{
			name: 'DatabaseError',
			message: 'Lost database connection'
		}])
	})
	// If the Node process ends, close the Mongoose connection 
	process.on('SIGINT', () => {  
		driver.connection.close(() => { 
			console.log('Mongoose default connection disconnected through app termination'); 
			process.exit(0); 
		}); 
	}); 
})


module.exports = {connect}
