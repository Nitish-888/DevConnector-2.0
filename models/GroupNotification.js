// models/GroupNotification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupNotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  groupId: {
    type: String,
    required: true,
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: 'GroupMessage',
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'group_message',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('GroupNotification', GroupNotificationSchema);
