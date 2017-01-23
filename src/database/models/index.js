const glob = require('glob')
const path = require('path')
let models = []

glob.sync(__dirname + '/*.js').forEach(file => {
  if (path.basename(file, '.js') !== 'index') {
    models.push(require(path.resolve(file)))
  }
})

module.exports = models
