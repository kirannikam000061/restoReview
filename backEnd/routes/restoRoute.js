var express = require('express')
var router = express.Router()
const { isEmpty } = require('lodash')
var passport = require('passport')

const Resto = require('../models/Resto')
const resFormat = require('../helpers/responseFormat')
let constants = require('../config/constants')
const messages = require('../config/messages')

//function to create new resto
create = (req, res) => {
  try {
    let resto = new Resto()
    resto = Object.assign(resto, req.body)
    resto.isActive = true
    resto.save(async (err, newResto) => {
      if (err) {
        console.log('err', err)
        res.status(500).send(resFormat.rError(err))
      } else {
        res.send(resFormat.rSuccess('Successfully onboarded restaurant!'))
      }
    })
  } catch(e) {
    res.send(resFormat.rError(messages.somethingWentWrong))
  }
}

//function to get list of resto
list = async (req, res) => {
  const { query } = req.body
  try {
    const restos = await Resto.find(query)
    let restoList = JSON.parse(JSON.stringify(restos))
    await restoList.map((r) => {
      r.reviewCount = r.reviews ? r.reviews.length : 0
    })
    res.send(resFormat.rSuccess({ restoList }))
  } catch(e) {
    res.send(resFormat.rError(messages.somethingWentWrong))
  }
}

//function to get resto details
details = async (req, res) => {
  const { restoId } = req.body
  try {
    const restoDetails = await Resto.findOne({ _id: restoId})
    res.send(resFormat.rSuccess({ restoDetails }))
  } catch(e) {
    res.send(resFormat.rError(messages.somethingWentWrong))
  }
}

//function to add review to restaurant
addReview = async (req, res) => {
  const { restoId, reviewById, reviewByName, rating, review } = req.body
  try {
    const resto = await Resto.findOne({ _id: restoId})
    resto.reviews.push({ 
      reviewById,
      reviewByName,
      rating,
      review
    })
    await resto.save()
    res.send(resFormat.rSuccess({ resto }))
  } catch(e) {
    console.log(e)
    res.send(resFormat.rError(messages.somethingWentWrong))
  }
}

//function to delete review of restaurant
deleteReview = async (req, res) => {
  const { restoId, reviewId } = req.body
  try {
    const resto = await Resto.findOne({ _id: restoId})
    const reviewIndex = resto.reviews.findIndex((o) => o._id.toString() == reviewId)
    if(reviewIndex > -1) {
      resto.reviews.splice(reviewIndex, 1)
    }
    await resto.save()
    res.send(resFormat.rSuccess("Successfully deleted review!"))
  } catch(e) {
    console.log(e)
    res.send(resFormat.rError(messages.somethingWentWrong))
  }
}

router.post("/onboard", create)
router.post("/list", list)
router.post("/details", details)
router.post("/addReview", addReview)
router.post("/deleteReview", deleteReview)

module.exports = router
