const {curry} = require('ramda')
const version = '/v1'
const App = (app, models) => {
  const user = models.user
  const sendError = curry((res, error) => {
    console.error(error)
    return res.status(500).json(error.message)
  })
  const sendNotFound = (res) => () => {
    return res.status(404).end()
  }

  app.get(version + '/user/:email', (req, res) => {
    return user.find(req.params.email).fork(sendError(res), maybe => {
      return maybe.cata({
        Nothing: sendNotFound(res),
        Just: (user) => res.json(user)
      })
    })
  })
  app.post(version + '/user/register', (req, res) => {
    return user.register(req.body).fork(sendError(res), (user) => {
      return res.json(user)
    })
  })
}

module.exports = App
