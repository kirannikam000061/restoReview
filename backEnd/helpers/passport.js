var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var Users = require("./../models/Users")
var messages = require("./../config/messages")

passport.use(new LocalStrategy({
    usernameField: 'email'
  }, (email, password, done) => {
    Users.findOne({ email: {'$regex' : new RegExp("^" + email + "$"), '$options' : 'i'} }, function (err, user) {
      if (err) { 
        return done(err)
      }

      // Return if user not found in database
      if (!user) {
        return done(null, false, {
          message: messages.userNotFound
        })
      }
      
      if (user.isSuspended) {
        return done(null, false, {
          message: messages.suspendedAccount
        })
      }

      const validator = user.validPassword(password, user)
      // Return if password is wrong
      if (validator == false) {
        return done(null, false, {
          message: messages.wrongPassword
        })
      }
      if (validator == -1) {
        return done(null, user, { message: "WrongMethod"})
      }

      // If credentials are correct, return the user object
      return done(null, user)
    })
  }
))

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
