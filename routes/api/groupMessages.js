const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Import auth middleware
const GroupMessage = require('../../models/GroupMessage'); // Import the GroupMessage model
const Group = require('../../models/Group');

// @route   POST api/groupMessages/:groupId
// @desc    Send a message in a group chat
// @access  Private
router.post('/:groupId', auth, async (req, res) => {
  const { text } = req.body;

  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    if (!group.members.includes(req.user.id)) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const newMessage = new GroupMessage({
      groupId: req.params.groupId,
      sender: req.user.id,
      text,
    });

    const message = await newMessage.save();

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/groupMessages/:groupId
// @desc    Get all messages for a specific group
// @access  Private
router.get('/:groupId', auth, async (req, res) => {
  try {
    const messages = await GroupMessage.find({ groupId: req.params.groupId }).sort({ date: 1 }).populate('sender', ['name', 'avatar']);
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
