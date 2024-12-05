const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const normalize = require('normalize-url');

const User = require('../../models/User');
const ProfileAnalytics = require('../../models/ProfileAnalytics');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  check('name', 'Name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      const avatar = normalize(
        gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        }),
        { forceHttps: true }
      );

      user = new User({
        name,
        email,
        avatar,
        password
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Create profile analytics after user is saved
      let analytics = await ProfileAnalytics.findOne({ userId: user.id });

      if (!analytics) {
        analytics = new ProfileAnalytics({
          userId: user.id,
          totalPosts: 0,
          totalMessages: 0,
          totalGroups: 0,
          totalNotifications: 0,
          unreadNotifications: 0,
        });

        await analytics.save();
        console.log('Profile Analytics created for the user');
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/users/search
// @desc     Search users by name or email
// @access   Public
router.get('/search', async (req, res) => {
  const { query } = req.query; // Get the search query from the request

  try {
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ msg: 'Please provide a valid search query with at least 3 characters.' });
    }

    // Search for users matching the query in their name or email (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },  // Case-insensitive search for name
        { email: { $regex: query, $options: 'i' } }  // Case-insensitive search for email
      ]
    }).select('name email avatar'); // Only return relevant fields

    if (users.length === 0) {
      return res.status(404).json({ msg: 'No users found matching that query.' });
    }

    res.json(users); // Send the search results as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
