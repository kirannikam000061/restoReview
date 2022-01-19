var mongoose = require('mongoose')
var uniqueValidator = require('mongoose-unique-validator')

var restoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  cost2: Number,
  location: String,
  cuisine: String,
  restoPic: String,
  veg1: String,
  veg2: String,
  veg3: String,
  nonveg1: String,
  nonveg2: String,
  nonveg3: String,
  reviews: [{
    reviewById: String,
    reviewByName: String,
    rating: String,
    review: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps:true
})

module.exports = mongoose.model('Resto', restoSchema)
restoSchema.plugin(uniqueValidator)
