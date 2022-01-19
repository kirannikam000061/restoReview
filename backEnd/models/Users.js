var mongoose = require('mongoose')
var uniqueValidator = require('mongoose-unique-validator')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var constants = require("./../config/constants")

var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  userType: {
    type: String,
    required: true
  },
  fullName: String,
  accessToken: String,
  contactNumber: String,
  hash: String,
  salt: String,
  otp: String,
  dob: String,
  address: {
    suiteNumber: String,
    streetAddress: String,
    city: String,
    state: String,
    zipCode: Number,
  },
  profilePicture: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps:true
})

//function to set password
userSchema.methods.setPassword = (password) => {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex')
  return { salt: this.salt, hash: this.hash }
}

//function to validate password
userSchema.methods.validPassword = (password, user) => {
  if (user && user.salt) {
    var hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex')
    return user.hash === hash
  }
  return -1
}

//function to generate token which is signed by id and email_id with expiry
userSchema.methods.generateJwt = (userId) => {
  var expiry = new Date()
  expiry.setDate(expiry.getDate() + 7)
  return jwt.sign({
    userId: userId,
    exp: parseInt(expiry.getTime() / 100),
  }, constants.secret)
}

module.exports = mongoose.model('User', userSchema)
userSchema.plugin(uniqueValidator)
