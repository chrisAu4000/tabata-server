module.exports = {
  name: 'User',
  collection: 'users',
  schema: {
    name: {
      type: String,
      trim: true,
      required: [true, 'Username is required.'],
      minlength: [4, 'Username should be at least 4 characters long.'],
      maxlength: [60,'Username is to long.']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'Email is required.'],
      //match: [/^[\w\.]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,10}$/g, 'Email {VALUE} is not valid.']
    },
    password: {
      type: String,
      trim: true,
      required: [true, 'Password is required'],
      minlength: [8, 'Password should be at least 8 characters long.'],
      maxlength: [60, 'Password is to long'],
    },
    verified: {
      type: Boolean,
      required: [true, 'Verified is required'],
      default: false
    },
    trainings: Array,
  }
}
