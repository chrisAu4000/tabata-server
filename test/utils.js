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

module.exports = { streamWrapper }
