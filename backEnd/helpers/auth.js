
const jwt = require('jsonwebtoken');
const constants = require('../config/constants')
const messages = require('../config/messages')
const resFormat = require('../helpers/responseFormat')

module.exports = (req, res, next) => {
  try {
    const accessToken = req.headers.accessToken || req.headers.accesstoken
    const userId = req.headers.userId || req.headers.userid
    const decodedToken = jwt.verify(accessToken, constants.secret)
    if(!decodedToken || !decodedToken.userId) {
        res.status(401).send(resFormat.rError(messages.auth1))
    } else if(decodedToken.userId !== userId) {
        res.status(401).send(resFormat.rError(messages.auth2))
    }else if (new Date(decodedToken.iat) > new Date()) {
        res.status(401).send(resFormat.rError(messages.auth3))
    } else {
      next()
    }
  } catch {
    res.status(401).send(resFormat.rError(messages.auth1))
  }
};