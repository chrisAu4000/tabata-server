const Task = require('data.task')
const {fromNullable} = require('data.maybe')
const {curry, compose, assoc, map} = require('ramda')
const models = require('./models')

const iface = (db) => {
  const create = curry((model, data) => new Task((rej, res) =>
    db.model(model).create(data).then(res, rej)
  ))

  const find = curry((model, data) => new Task((rej, res) =>
    db.model(model).find(data).then(compose(res, fromNullable), rej)
  ))

  const findOne = curry((model, data) => new Task((rej, res) =>
    db.model(model).findOne(data).then(compose(res, fromNullable), rej)
  ))

  const createUnique = curry((key, model, data) => {
    return findOne(model, assoc(key, data[key], {}))

      // .chain(maybe => {
      //   return new Task((rej, res) => {
      //     return maybe => maybe.getOrElse()
      //       ? res()
      //       : rej({name: 'ValidationError', message: `unique key ${key} already exists.`})
      //     //   cata({
      //     //   Just: rej({name: 'ValidationError', message: `unique key ${key} already exists.`}),
      //     //   Nothing: res()
      //     // })
      //   })
      // })
      .chain(maybe => {
        return maybe.isNothing
          ? create(model, data)
          : Task.rejected({name: 'ValidationError', message: `unique key ${key} already exists.`})
      })
  })

  return {create, createUnique, findOne}
}

const connect = (driver, url) => new Task((rej, res) => {
  const initializeModel = curry((driver, {name, schema, collection}) =>
    driver.model(name, new driver.Schema(schema, {collection: collection}))
  )
  driver.Promise = global.Promise
  models
    .forEach(initializeModel(driver))
  driver
    .connect(url, (err) => err ? rej(err) : undefined)
    .connection.once('open', () => res(iface(driver)))
})


module.exports = {connect}
