// models/ProfileView.js
const mongoose = require('mongoose');

const ProfileViewSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['search', 'direct', 'group', 'post', 'profile_page', 'developers_list', 'comment'],
    default: 'direct'
  }
});

module.exports = mongoose.model('ProfileView', ProfileViewSchema);