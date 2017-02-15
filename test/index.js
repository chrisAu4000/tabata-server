const path = require('path')
const glob = require('glob')
glob.sync(__dirname + '/*.js').forEach(file => {
	if(path.basename(file,'.js') !== 'index') {
		module.exports[path.basename(file,'.js')] = require(path.resolve(file));
	}
});
