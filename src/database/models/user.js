module.exports = {
  name: 'User',
  collection: 'users',
  schema: {
    name: {
      type: String,
      required: [true, 'Username is required.'],
      minlength: [4, 'Username should be at least 4 characters long.'],
      maxlength: [60,'Username is to long.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      match: [/^[\w\.]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,10}$/g, 'Email is not valid.']
    },
    password: String,
    trainings: Array,
  }
}
