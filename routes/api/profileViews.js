// routes/api/profileViews.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const ProfileView = require('../../models/ProfileView');
const mongoose = require('mongoose');

// @route   POST api/profile-views
// @desc    Record a new profile view
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { profileId, source } = req.body;
    
    // Don't record if user is viewing their own profile
    if (profileId === req.user.id) {
      return res.json({ msg: 'Own profile view not recorded' });
    }

    const newView = new ProfileView({
      profileId,
      viewerId: req.user.id,
      source
    });

    await newView.save();
    res.json(newView);
  } catch (err) {
    console.error('Error recording profile view:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile-views/stats/:profileId
// @desc    Get profile view statistics
// @access  Private
router.get('/stats/:profileId', auth, async (req, res) => {
  try {
    // Total views
    const totalViews = await ProfileView.countDocuments({ 
      profileId: req.params.profileId 
    });

    // Unique viewers
    const uniqueViewers = await ProfileView.distinct('viewerId', { 
      profileId: req.params.profileId 
    });

    // Views by source
    const viewsBySource = await ProfileView.aggregate([
      { $match: { profileId: mongoose.Types.ObjectId(req.params.profileId) }},
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent viewers
    const recentViews = await ProfileView.find({ profileId: req.params.profileId })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('viewerId', ['name', 'avatar']);

    res.json({
      totalViews,
      uniqueViewers: uniqueViewers.length,
      viewsBySource,
      recentViews
    });
  } catch (err) {
    console.error('Error fetching profile view stats:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile-views/trend/:profileId
// @desc    Get profile view trend (last 7 days)
// @access  Private
router.get('/trend/:profileId', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trend = await ProfileView.aggregate([
      { 
        $match: { 
          profileId: mongoose.Types.ObjectId(req.params.profileId),
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 }}
    ]);

    res.json(trend);
  } catch (err) {
    console.error('Error fetching profile view trend:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile-views/return-rate/:profileId
// @desc    Get profile return view rate
// @access  Private
router.get('/return-rate/:profileId', auth, async (req, res) => {
  try {
    const viewers = await ProfileView.aggregate([
      { $match: { profileId: mongoose.Types.ObjectId(req.params.profileId) }},
      {
        $group: {
          _id: '$viewerId',
          viewCount: { $sum: 1 },
          firstView: { $min: '$timestamp' },
          lastView: { $max: '$timestamp' }
        }
      }
    ]);

    const returnRate = viewers.filter(v => v.viewCount > 1).length / viewers.length;

    res.json({
      totalViewers: viewers.length,
      returnViewers: viewers.filter(v => v.viewCount > 1).length,
      returnRate: returnRate.toFixed(2)
    });
  } catch (err) {
    console.error('Error calculating return rate:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;