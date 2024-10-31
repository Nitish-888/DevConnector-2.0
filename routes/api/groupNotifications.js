// routes/api/groupNotifications.js
const express = require('express');
const GroupNotification = require('../../models/GroupNotification');
const router = express.Router();
const auth = require('../../middleware/auth');

// @route GET api/groupNotifications
// @desc Get all group notifications for a user
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await GroupNotification.find({ recipient: req.user.id })
      .populate('message')
      .populate('groupId')
      .sort({ date: -1 });

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching group notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/groupNotifications/mark-as-read
// @desc Mark all group notifications for a specific group as read
// @access Private
router.put('/mark-as-read', auth, async (req, res) => {
  const { groupId } = req.body;

  try {
    const notifications = await GroupNotification.updateMany(
      { groupId, recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ msg: 'Group notifications marked as read' });
  } catch (err) {
    console.error('Error marking group notifications as read:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
