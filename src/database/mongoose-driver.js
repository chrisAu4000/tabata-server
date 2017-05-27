const Task = require('data.task')
const {fromNullable} = require('data.maybe')
const {curry, compose, assoc, map} = require('ramda')
const NotFoundError = require('../app/error/NotFoundError')
const ValidationError = require('../app/error/ValidationError')

const mongodb = (db) => {
	const create = curry((model, data) => new Task((rej, res) =>
		db.model(model).create(data).then(res).catch(rej)
	))

	const createUnique = curry((key, model, data) => new Task((rej, res) => {
		db.model(model).findOne(assoc(key, data[key], {}))
			.then(doc => doc 
				? rej([new ValidationError('unique key ' + key + ' already exists.')]) 
				: res()
			)
			.catch(rej)
		})
		.chain(_ => create(model, data))
	)

	const find = curry((model, query) => new Task((rej, res) =>
		db.model(model).find(query).then(compose(res, fromNullable), rej)
	))
	// findOne :: String -> Query -> Task Error Doc
	const findOne = curry((model, query) => new Task((rej, res) =>{
		return typeof db.model(model).findOne === 'function' 
			? db.model(model).findOne(query)
				.then(doc => doc
					? res(doc)
					: rej([new NotFoundError('Cannot find user with query: ' + JSON.stringify(query))])
				)
				.catch(rej)
			: rej([new Error('Cannot find function: findOne.')])
	}))

	const findById = curry((model, id) => new Task((rej, res) =>
		db.model(model).findById(id)
			.then(doc => doc 
				? res(doc) 
				: rej([new NotFoundError('Cannot find document with _id: ' + id)])
			)
			.catch(rej)
	))

	const updateById = curry((model, data, id) => new Task((rej, res) =>
		db.model(model)
			.findByIdAndUpdate(id, {$set: data}, {runValidators: true})
			.then(doc => {
				return doc
			})
			.then(doc => doc 
				? res(Object.assign({}, doc._doc, data), rej)
				: rej([new NotFoundError('Cannot find document with _id: ' + id)]))
			.catch(err => err.name === 'CastError' 
				? rej([new NotFoundError(err.message)]) 
				: rej([err])
			) 
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

module.exports = mongodb