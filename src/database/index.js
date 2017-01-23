const Task = require('data.task')
const {curry} = require('ramda')
const models = require('./models')

const initializeModel = curry((driver, {name, schema, collection}) =>
  driver.model(name, new driver.Schema(schema, {collection: collection}))
)
const connect = (driver, url) => new Task((rej, res) => {
  driver.Promise = global.Promise
  models
    .forEach(initializeModel(driver))
  driver
    .connect(url, (err) => err ? rej(err) : undefined)
    .connection.once('open', () => res(driver))
})

module.exports = {connect}
