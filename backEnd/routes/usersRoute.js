var express = require('express')
var router = express.Router()
const { isEmpty } = require('lodash')
var passport = require('passport')

const Users = require('../models/Users')
const resFormat = require('../helpers/responseFormat')
let constants = require('../config/constants')
const messages = require('../config/messages')

//function to get list of users as per given criteria
list = async (req, res) => {
  let { fields, offset, query, order, limit, search, userId } = req.body
  
  let totalRecords = 0
  if (search && !isEmpty(query)) {
    Object.keys(query).map((key) => {
      if (key !== "active") {
        query[key] = new RegExp(query[key], 'i')
      }
    })
  }

  Users.countDocuments(query, (err, userCount) => {
    if (userCount) {
      totalRecords = userCount
    }
    Users.find(query, fields, async (err, userList) => {
      if (err) {
        res.status(401).send(resFormat.rError(err))
      } else {
        res.send(resFormat.rSuccess({ userList, totalRecords}))
      }
    }).sort(order).skip(offset).limit(limit)
  })
}

//function to signup
signup = (req, res) => {
  try {
    let user = new Users()
    user = Object.assign(user, req.body)
    user.isActive = true
    user.userType = "User"
    const hashing = user.setPassword(req.body.password)
    user.hash = hashing.hash
    user.salt = hashing.salt
    user.accessToken = user.generateJwt(user._id)
    user.save(async (err, newUser) => {
      if (err) {
        console.log('err', err)
        res.status(500).send(resFormat.rError(err))
      } else {
        res.send(resFormat.rSuccess('Successfully signed up!'))
      }
    })
  } catch(e) {
    res.send(resFormat.rError(messages.incorrectMobile))
  }
}

//function to mark user as deleted
deleteUser = (req, res) => {
  Users.updateOne({ _id: req.body.userId }, { $set: { isActive: false } }, (err, updatedUser) => {
    if (err) {
      res.status(500).send(resFormat.rError(err))
    } else {
      res.send(resFormat.rSuccess('User has been deleted successfully!'))
    }
  })
}

//function to mark user as deleted
updateUser = async (req, res) => {
  const { userId } = req.body
  await Users.updateOne({ _id: userId }, { $set: req.body })
  res.send(resFormat.rSuccess('User has been updated successfully!'))
}

//function to mark user as deleted
details = async (req, res) => {
  const { userId } = req.body
  const userDetails = await Users.findOne({ _id: userId })
  res.send(resFormat.rSuccess({ userDetails }))
}

//function to get user by email
getByEmail = async (req, res) => {
  const { userId } = req.body
  const userDetails = await Users.findOne({ email: { '$regex': new RegExp("^" + escapeRegExp(req.body.email) + "$"), '$options': 'i' } })
  res.send(resFormat.rSuccess({ userDetails }))  
}

//function to signin in patient / study user
signin = async (req, res) => {
  const { userType, email } = req.body
  let query = {
    email: { '$regex': new RegExp("^" + email + "$"), '$options': 'i' },
    userType
  }
  let user = await Users.findOne(query)
  
  if (!user) {
    res.send(resFormat.rError(messages.noAccount))
  } else if(user && !user.isActive) {
    res.send(resFormat.rError(messages.suspendedAccount))
  } else if(user && (!user.salt || !user.hash)) {
    res.send(resFormat.rError(messages.incompleteSetup))
  } else {
    passport.authenticate('local', async (err, user, info) => {
      console.log("info => ", info)
      if (err || !user) {
        if(info && info.message) {
          res.send(resFormat.rError(info.message))
        } else {
          res.status(401).send(resFormat.rError(err))
        }
      } else {
        user.accessToken = user.generateJwt(user._id)
        await user.save()
        res.send(resFormat.rSuccess({ userDetails: user, message: "Successfully Signed in!" }))
      }
    })(req, res)
  }
}

//function to send forget password email
forgetPassword = async (req, res) => {
  const { userType, email  } = req.body
  
  try {
    const query = { userType, email: {'$regex' : new RegExp("^" + escapeRegExp(email) + "$", "i")} }
    let user = await Users.findOne(query)
    
    if (user) {
      user.resetPasswordExpiry = new Date().addHours(2)
      user.resetLinkActive = true

      if (await user.save()) {
        sendResetEmail(req, res, user)
      } else {
        res.send(resFormat.rError(messages.userNotFound))
      }

    } else {
      res.send(resFormat.rError(messages.userNotFound))
    }

  } catch (e) {
    res.status(500).send(resFormat.rError(e.message))
  }
}

//function to send forget link via email 
sendResetEmail = async (req, res, user) => {
  const template = await EmailTemplates.findOne({ templateCode: "userForgotPassword" })
  if (template) {
    let link = constants.baseUrl + constants.resetPasswordLink + `?_id=${user._id}`
  
    let html = template.mailBody.replace("{link}", link)
    html = html.replace("{name}", user.firstName)
    const mailOptions = {
      to: user.email,
      subject: template.mailSubject,
      html
    }
    await sendEmail(mailOptions)
    res.send(resFormat.rSuccess({ message: messages.forgotPassword }))
  } else {
    res.send(resFormat.rError({ message: messages.somethingWentWrong }))
  }
}

//function to Send reset link on forgot
resetPassword = async (req, res) => {
  try {
    let user = await Users.findOne({ _id: req.body.userId }, { _id: 1, resetLinkActive: 1 })

    if (user && !user.resetLinkActive) {
      res.send(resFormat.rError("Reset password link is expired."))
    } else if (user && user.resetLinkActive) {
      let userSecurityDetails = user.setPassword(req.body.password)
      user.salt = userSecurityDetails.salt
      user.hash = userSecurityDetails.hash
      user.resetLinkActive = false
      if (await user.save()) {
        res.send(resFormat.rError(messages.resetPassword))
      } else {
        res.send(resFormat.rError(messages.somethingWentWrong))
      }
    } else {
      res.send(resFormat.rError(messages.userNotFound))
    }
  } catch (e) {
    res.status(500).send(resFormat.rError(e))
  }
}

//function to change Password
changePassword = async (req, res) => {

  Users.findOne({ _id: req.body.userId }, (err, userDetails) => {
    if (err) {
      res.send(resFormat.rError(err))
    } else {
      const user = new Users()
      if (req.body.oldPassword && !user.validPassword(req.body.oldPassword, userDetails)) {
        res.send(resFormat.rError('Please enter the correct current password'))
      } else {
        const { salt, hash } = user.setPassword(req.body.password)

        Users.updateOne({ _id: req.body.userId }, { $set: { salt, hash } }, (err, updatedUser) => {
          if (err) {
            res.send(resFormat.rError(err))
          } else {
            res.send(resFormat.rSuccess('Password Changed successfully'))
          }
        })
      }
    }
  })
}

// function to create random 6 digit otp
createRandomNumber = () => {
  return Math.floor(100000 + Math.random() * 900000)
}


router.post("/list", list)
router.post("/signup", signup)
router.post("/delete", deleteUser)
router.post("/update", updateUser)
router.post("/details", details)
router.post("/getByEmail", getByEmail)
router.post("/signin", signin)
router.post("/forget", forgetPassword)
router.post("/reset", resetPassword)
router.post("/changePassword", changePassword)

module.exports = router
