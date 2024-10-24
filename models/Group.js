const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  profilePicture: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Group = mongoose.model('Group', GroupSchema);
