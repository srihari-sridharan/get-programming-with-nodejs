'use strict';

const mongoose = require('mongoose'),
Schema = require('mongoose').Schema,
Subscriber = require('./subscriber'),
bcrypt = require('bcrypt');

var userSchema = new Schema({
  name: {
    first: {
      type: String,
      trim: true
    },
    last: {
      type: String,
      trim: true
    }
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  zipCode:  {
    type: Number,
    min: [1000, 'Zip code too short'],
    max: 99999
  },
  password: {
    type: String, required: true
  },
  subscribedAccount: {type: Schema.Types.ObjectId, ref: 'Subscriber'},
  courses: [{type: Schema.Types.ObjectId, ref: 'Course'}],
},
{
  timestamps: true
});

userSchema.virtual('fullName').get(function(){
  return `${this.name.first} ${this.name.last}`;
});

userSchema.pre('save', function (next) {
  var user = this;
  if (user.subscribedAccount === undefined) {
    Subscriber.findOne({email: user.email})
    .then(subscriber => {
      user.subscribedAccount = subscriber;
      next();
    })
    .catch(e => {
      console.log(`Error in connecting subscriber: ${e.message}`);
      next(e);
    });
  } else {
    next();
  }
});

userSchema.pre('save', function(next) {
  let user = this;

  bcrypt.hash(user.password, 10).then(hash => {
    user.password = hash;
    next();
  })
  .catch(error => {
    console.log(`Error in encrypting password: ${e.message}`);
    next(error);
  });
});

userSchema.methods.passwordComparison = function(inputPassword){
  let user = this;
  return bcrypt.compare(inputPassword, user.password);
};

module.exports = mongoose.model('User', userSchema);
