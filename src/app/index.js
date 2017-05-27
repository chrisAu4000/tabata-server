const {curry, any} = require('ramda')
const path = require('path')
// const client = require('../../../tabata-frontend/src/App')
// const InvernoServer = require('inferno-server')

const version = '/v1'

const reduceError = curry((res, errors) => {
	const error = errors.reduce((acc, curr) => {
		return any(x => x.status === curr.status, acc)
			? acc
			: acc.concat(curr)
	}, [])
	return res.status(error[0].status).json(error)
})

const sendNotFound = (res) => () => res.status(404).end()

const authenticationMiddleware = () => (req, res, next) => {
	if (req.isAuthenticated()) return next()
	return res.status(401).end()
}

const App = (app, passport, models) => {
	const user = models.user
	app.post(version + '/user', (req, res) => {
		return user.registration(req.body).fork(
			(errs) => reduceError(res, errs),
			(user) => res.json(user)
		)
	})
	
	app.patch(version + '/user/confirm/:id', (req, res) => {
		return user.confirmation(req.params.id).fork(
			errs => {
				reduceError(res, errs)
			},
			user => res.status(200).send('confirmed user').end()
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
	app.get(version + '/user/:email', (req, res) => {
		return user.findByEmail(req.params.email).cata({
			Nothing: errs => reduceError(res, errs),
			Just: user => res.json(user)
		})
	})
}

module.exports = App
