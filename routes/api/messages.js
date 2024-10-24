const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');

// @route   GET api/messages/:roomId
// @desc    Get all messages for a specific room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    // Fetch messages for the given roomId
    const messages = await Message.find({ roomId }).sort({ date: 1 });

    if (!messages) {
      return res.status(404).json({ msg: 'No messages found' });
    }

    // Return messages
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/messages/mark-as-read
// @desc    Mark all messages in a room as read by the recipient
router.put('/mark-as-read', async (req, res) => {
  try {
    const { roomId } = req.body; // The room ID sent from the client

    // Mark all unread messages in the room as read by the current user
    const updatedMessages = await Message.updateMany(
      { roomId, isRead: false },  // Only update unread messages in the room
      { isRead: true }            // Mark them as read
    );

    if (updatedMessages.nModified === 0) {
      return res.status(404).json({ msg: 'No unread messages found' });
    }

    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
