// models/GroupMessage.js
const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Reference to the User model (who sent the message)
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = GroupMessage = mongoose.model('GroupMessage', GroupMessageSchema);
