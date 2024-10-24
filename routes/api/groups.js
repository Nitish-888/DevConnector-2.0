// routes/api/groups.js
const express = require('express');
const router = express.Router();
const Group = require('../../models/Group'); // Make sure you have a Group model
const auth = require('../../middleware/auth'); // Authentication middleware

// @route   GET api/groups
// @desc    Get all groups (for example)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find(); // Fetch all groups from the database
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/groups
// @desc    Create a new group
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    const newGroup = new Group({
      name,
      description,
      members,
      createdBy: req.user.id,
    });

    const group = await newGroup.save();
    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
