// AUTHENTIFICATION MIDDLEWARE
/**
 * Extracts the user id from the user and calles the done callback with it.
 * @param {Object} user
 * @param {String} user._id
 * @param {Function} done
 */
const serialize = (user, done) => done(null, user._id)

module.exports = serialize