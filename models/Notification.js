const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
  },
  roomId: {
    type: String,  // Store the roomId associated with the notification
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'message',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);
