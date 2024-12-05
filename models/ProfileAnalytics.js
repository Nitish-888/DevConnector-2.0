const mongoose = require('mongoose');

// Check if the model is already registered (this prevents overwriting)
const ProfileAnalytics = mongoose.models.ProfileAnalytics || mongoose.model('ProfileAnalytics', new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Reference to the User model
    required: true
  },
  totalPosts: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  totalGroups: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0  // New field for total likes
  },
  totalComments: {
    type: Number,
    default: 0  // New field for total comments
  },
  totalNotifications: {
    type: Number,
    default: 0
  },
  unreadNotifications: {
    type: Number,
    default: 0
  },
  totalLikesReceived: { // New attribute
    type: Number,
    default: 0
  },
  totalCommentsReceived: { // New attribute
    type: Number,
    default: 0
  },
  messagesSent: {
    type: Number,
    default: 0
  },
  messagesReceived: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true  // Automatically add createdAt and updatedAt fields
}));

module.exports = ProfileAnalytics;
