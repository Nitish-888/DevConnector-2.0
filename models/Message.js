const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',  // Reference to the sender's user document
    required: true
  },
  receiverId: {                          // This would be new field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);
