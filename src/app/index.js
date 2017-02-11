const {curry} = require('ramda')
// const client = require('../../../tabata-frontend/src/App')
const InvernoServer = require('inferno-server')

const version = '/v1'

const sendError = curry((res, error) => {
  console.error(error)
  return res.status(500).json(error.message)
})

const sendNotFound = (res) => () => res.status(404).end()

const App = (app, models) => {
  const user = models.user

  // app.get(version + '/', (req, res) => {
  //   const html = InvernoServer.renderToString(client)
  //   return res.send(html)
  // })

  app.get(version + '/user/:email', (req, res) => {
    return user.find(req.params.email).fork(sendError(res), maybe => {
      return maybe.cata({
        Nothing: sendNotFound(res),
        Just: (user) => res.json(user)
      })
    })
  })
  app.post(version + '/user/register', (req, res) => {
    return user.registration(req.body).fork(sendError(res), (user) => {
      console.log(user)
      return res.json(user)
    })
  })
  app.get(version + '/user/confirm/:id', (req, res) => {
    return user.confirmation(req.params.id).fork(sendError(res), (user) => {
      console.log(user)
      return res.json(user)
    })
  })
}

module.exports = App
