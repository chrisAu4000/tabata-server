const {curry} = require('ramda')

/**
 * Sets a users verified property to true.
 * @Side-Effect:
 *    Writing to database
 * @param {String} id - the user id.
 * @return {Task} Task Error Maybe User
 */
const confirmation = 
	curry((db, id) => db.updateById('User', {verified: true}, id))

module.exports = confirmation