const {curry} = require('ramda')
// const client = require('../../../tabata-frontend/src/App')
const InvernoServer = require('inferno-server')

const version = '/v1'

const sendError = curry((res, error) => {
  console.error(error)
  return res.status(500).json(error.message)
})

const sendNotFound = (res) => () => res.status(404).end()

const authenticationMiddleware = () => (req, res, next) => {
  if (req.isAuthenticated()) return next()
  return res.status(401).end()
}

const App = (app, passport, models) => {
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
    return user.registration(req.body).fork(
      sendError(res),
      (user) => res.json(user)
    )
  })
  app.get(version + '/user/confirm/:id', (req, res) => {
    return user.confirmation(req.params.id).fork(
      sendError(res),
      (user) => res.json(user)
    )
  })
  app.post(version + '/user/resetPasswordReq', (req, res) => {
    return user.sendResetPasswordEmail(req.body).fork(
      sendError(res),
      () => res.status(200).end()
    )
  })
  app.get(version + '/user/resetPassword/:token', (req, res) => {
    return user.resetPasswordPage(req.params.query).fork(
      (error) => {/*TODO: render ErrorPage*/},
      (user) => {/* TODO: render ResetPasswordForm*/}
    )
  })
  app.post(version + '/user/resetPassword', (req, res) => {
    return user.resetPassword(req.body).fork(
      error => error.status ? res.status(error.status).end() : sendError(res, error),
      user => res.json(user)
    )
  })
  // AUTHORISED ONLY
  app.post(version + '/user/login',
    passport.authenticate('user-local', {failureFlash: true}),
    (req, res) => {
    return res.status(200).end()
  })
  app.post(version + '/user/logout',
    authenticationMiddleware(), (req, res) => {
    req.logout()
    return res.status(200).end()
  })

}

module.exports = App
