const express = require('express');
const ProfileAnalytics = require('../../models/ProfileAnalytics');
const router = express.Router();
const auth = require('../../middleware/auth'); // Ensure the user is authenticated

// @route    GET api/profileAnalytics/:userId
// @desc     Get profile analytics for a user
// @access   Private
router.get('/:userId', auth, async (req, res) => {
  try {
    // Extract the userId from the route parameter (not from query)
    const userIdFromRoute = req.params.userId;  // This comes from the URL parameter

    console.log('User ID from route param:', userIdFromRoute);
    console.log('User ID from token:', req.user.id);

    // Query the ProfileAnalytics model based on the userId from the route param
    const analytics = await ProfileAnalytics.findOne({ userId: userIdFromRoute });

    if (!analytics) {
      return res.status(404).json({ msg: 'Analytics not found for this user' });
    }

    res.json(analytics);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
