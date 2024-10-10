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

module.exports = router;
