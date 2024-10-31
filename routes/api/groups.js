// routes/api/groups.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Group = require('../../models/Group');
const User = require('../../models/User');

// @route POST api/groups
// @desc Create a new group
// @access Private
router.post('/', auth, async (req, res) => {
  const { name, description, members } = req.body;

  try {
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

// @route GET api/groups
// @desc Get all groups the user is part of
// @access Private
router.get('/:groupId', auth, async (req, res) => {
  try {
    console.log('Fetching group information for groupId:', req.params.groupId); // Debugging log
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    res.json(group);
  } catch (err) {
    console.error('Error fetching group:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET api/groups
// @desc Get all groups the user is part of
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching group for user:', req.user.id); // Debugging log
    const group = await Group.find({ members: req.user.id });
    if (!group) {
      console.log('No groups found for user:', req.user.id);
    }
    res.json(group);
  } catch (err) {
    console.error('Error fetching group:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
