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

  const findOne = curry((model, query) => new Task((rej, res) =>
    db.model(model).findOne(query).then(compose(res, fromNullable), rej)
  ))

  const removeOne = curry((model, query) => new Task((rej, res) =>
    db.model(model).findOneAndRemove(query).then(res, rej)
  ))

  return {create, createUnique, find, findOne, removeOne}
}

const connect = (driver, url) => new Task((rej, res) => {
  const initializeModel = curry((driver, {name, schema, collection}) =>
    driver.model(name, new driver.Schema(schema, {collection: collection}))
  )
  driver.Promise = global.Promise
  models
    .forEach(initializeModel(driver))
  driver
    .connect(url, (err) => err ? rej([err]) : undefined)
    .connection.once('open', () => res(iface(driver)))
})


module.exports = {connect}
