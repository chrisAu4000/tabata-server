const {forEach} = require('ramda')
const logError = error => console.error(`${error.name}: ${error.message}`)
const logErrors = forEach(logError)

module.exports = {logError, logErrors}