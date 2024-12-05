// routes/api/userActivity.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const UserActivity = require('../../models/UserActivity');
const mongoose = require('mongoose');

// @route   POST api/user-activity
// @desc    Record a new user activity
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { activityType } = req.body;
    const date = new Date();
    
    const newActivity = new UserActivity({
      userId: req.user.id,
      activityType,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      hourOfDay: date.getHours()
    });

    await newActivity.save();
    res.json(newActivity);
  } catch (err) {
    console.error('Error recording activity:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-activity/pattern/:userId
// @desc    Get user's activity pattern
// @access  Private
router.get('/pattern/:userId', auth, async (req, res) => {
  try {
    // Get activity counts by day and hour
    const activityPattern = await UserActivity.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.params.userId) }},
      {
        $group: {
          _id: {
            day: '$dayOfWeek',
            hour: '$hourOfDay'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(activityPattern);
  } catch (err) {
    console.error('Error fetching activity pattern:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-activity/summary/:userId
// @desc    Get summary of user's activities
// @access  Private
router.get('/summary/:userId', auth, async (req, res) => {
  try {
    const summary = await UserActivity.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.params.userId) }},
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      }
    ]);

    res.json(summary);
  } catch (err) {
    console.error('Error fetching activity summary:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/user-activity/peak-hours/:userId
// @desc    Get user's peak activity hours
// @access  Private
router.get('/peak-hours/:userId', auth, async (req, res) => {
  try {
    const peakHours = await UserActivity.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.params.userId) }},
      {
        $group: {
          _id: '$hourOfDay',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 }},
      { $limit: 5 }
    ]);

    res.json(peakHours);
  } catch (err) {
    console.error('Error fetching peak hours:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;