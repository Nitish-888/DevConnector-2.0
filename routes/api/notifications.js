const express = require('express');
const Notification = require('../../models/Notification');
const router = express.Router();
const auth = require('../../middleware/auth'); // Import authentication middleware

// @route GET api/notifications
// @desc Get all notifications for a user (with optional pagination)
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;  // Default: page 1, 10 notifications per page

  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('message')
      .sort({ date: -1 })  // Sort by date, newest first
      .limit(parseInt(limit))  // Limit the number of results
      .skip((page - 1) * limit);  // Skip based on the page

    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/notifications/mark-as-read
// @desc Mark all notifications for a specific chat room as read
router.put('/mark-as-read', auth, async (req, res) => {
  const { roomId } = req.body;

  try {
    const notifications = await Notification.updateMany(
      { roomId: roomId, recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    if (!notifications) {
      return res.status(404).json({ msg: 'No notifications found for this room' });
    }

    res.json({ msg: 'Notifications marked as read', notifications });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/notifications/:id
// @desc Mark a single notification as read
router.put('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the logged-in user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Unauthorized to access this notification' });
    }

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
