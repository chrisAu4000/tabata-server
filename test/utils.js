const xs = require('xstream').default

const streamWrapper = (task) => {
  return xs.create({
    start: listener => task.fork(
      err => listener.next(err),
      val => listener.next(val)
    ),
    stop: () => {}
  })
}

const connectDb = function(db) { 
	return new Promise((res, rej) => 
		connect(mongoose, 'mongodb://localhost:27017/tabata')
			.fork(rej.bind(this), function(_db) {
				db = _db
				res.call(this, db)
			})
	)
}
module.exports = { connectDb }
