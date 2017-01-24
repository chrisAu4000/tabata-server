const Maybe = require('data.maybe')
const {map, compose} = require('ramda')

const Exercises = (db) => {

  const allExercises = db.all('Exercise')

  // exerciseById :: (String id) -> Task Error, Maybe Exercise
  const exerciseById = compose(map(Maybe.fromNullable), db.findById('Exercise'))
  return {
    allExercises,
    exerciseById
  }
}

module.exports = Exercises
