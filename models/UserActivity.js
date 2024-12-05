// models/UserActivity.js
const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  activityType: {
    type: String,
    enum: ['login', 'post', 'comment', 'profile_view', 'message', 'group_action'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  dayOfWeek: {
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  hourOfDay: {
    type: Number,
    min: 0,
    max: 23
  }
});

module.exports = mongoose.model('UserActivity', UserActivitySchema);