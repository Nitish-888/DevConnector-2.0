const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Import Schema from mongoose

const GroupSchema = new Schema({ // Use Schema here instead of undefined
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'user', 
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'user',
  }],
  profilePicture: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Group = mongoose.model('Group', GroupSchema);
