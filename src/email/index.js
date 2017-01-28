const {curry} = require('ramda')
const Task = require('data.task')
const Validation = require('data.validation')
const ValidationError = require('../app/error/validationError')
const {match, minLength, taskFromValidation} = require('../app/validation')
const {EmailTemplate} = require('email-templates')
const path = require('path')

const emailRegEx = /^[\w\.]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,10}$/g

const iface = ({key, from}) => {
  const sg = require('sendgrid')(key)
  const helper = require('sendgrid').mail
  const from_email = new helper.Email(from)
  const templatesDir = path.join(__dirname + '/../', 'app', 'templates')

  const send = curry((subject, to, template) => new Task((rej, res) => {
    const to_email = new helper.Email(to)
    const content = new helper.Content("text/html", template)
    const mail = new helper.Mail(from_email, subject, to_email, content)
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: mail.toJSON()
    })

    return sg.API(request, function(error, response) {
      if (error) {
        return rej(error)
      }
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
      return res(response)
    })
  }))

  const renderEmail = curry((templateName, params) => new Task((rej, res) => {
    const templatePath = path.join(templatesDir, templateName)
    const email = new EmailTemplate(templatePath)
    return email.render(params, (error, result) => {
      if (error) {
        return rej(error)
      }
      return res(result)
    })
  }))

  return {send, renderEmail}
}

const validateEmail = match(emailRegEx, ValidationError(
  'email',
  'Application E-Mail of invalid format'
))
const validateApiKey = minLength(50, ValidationError(
  'API_KEY',
  'Invalid API key.'
))

const connect = curry((apiKey, from) =>
  taskFromValidation(
    Validation.of(key => from => ({key, from}))
    .ap(validateApiKey(apiKey))
    .ap(validateEmail(from))
  )
  .map(iface)
)
module.exports = {connect}
