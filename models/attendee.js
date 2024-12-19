const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  check_in: Boolean,
  swag: Boolean,
  food: Boolean,
  check_in_updatedAt: Date,
  swag_updatedAt: Date,
  food_updatedAt: Date,
  check_in_updatedBy: String,
  swag_updatedBy: String,
  food_updatedBy: String,
});

const Attendee = mongoose.model('AttendeeDetails', attendeeSchema);

module.exports = Attendee;