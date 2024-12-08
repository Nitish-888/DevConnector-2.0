const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const ProfileAnalytics = require('../../models/ProfileAnalytics');

const Post = require('../../models/Post');
const User = require('../../models/User');
const checkObjectId = require('../../middleware/checkObjectId');

// Utility to update Profile Analytics
const updateProfileAnalytics = async (userId, action) => {
  try {
    let analytics = await ProfileAnalytics.findOne({ userId });

    if (!analytics) {
      // Create new analytics if it doesn't exist
      analytics = new ProfileAnalytics({
        userId,
        totalPosts: action === 'POST' ? 1 : 0,
        totalMessages: 0,
        totalGroups: 0,
        totalNotifications: 0,
        unreadNotifications: 0
      });
    } else {
      // Update the analytics based on action type
      if (action === 'POST') {
        analytics.totalPosts += 1;
      }
      // You can add more actions like messages, notifications, etc.
    }

    await analytics.save(); // Save updated analytics
    console.log(`Profile analytics updated for user: ${userId}`);
  } catch (err) {
    console.error('Error updating profile analytics:', err.message);
  }
};

// Utility to update Profile Analytics for likes and comments received
const updateLikesAndComments = async (userId) => {
  try {
    // Fetch all posts created by the user
    const posts = await Post.find({ user: userId });

    // Initialize counters
    let totalLikesReceived = 0;
    let totalCommentsReceived = 0;

    // Loop through the user's posts and calculate likes and comments
    for (const post of posts) {
      totalLikesReceived += post.likes.length;
      totalCommentsReceived += post.comments.length;
    }

    // Update the ProfileAnalytics model
    await ProfileAnalytics.updateOne(
      { userId },
      {
        $set: {
          totalLikesReceived,
          totalCommentsReceived,
        },
      },
      { upsert: true } // Create the document if it doesn't exist
    );
  } catch (err) {
    console.error('Error updating likes and comments analytics:', err.message);
  }
};

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/',
  auth,
  check('text', 'Text is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      await updateProfileAnalytics(req.user.id, 'POST'); // Update on post creation

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    // Update likes received for the post's owner
    await updateLikesAndComments(post.user);

    // Update ProfileAnalytics for Likes
    let analytics = await ProfileAnalytics.findOne({ userId: req.user.id });

    if (!analytics) {
      analytics = new ProfileAnalytics({
        userId: req.user.id,
        totalPosts: 0,
        totalMessages: 0,
        totalGroups: 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        totalLikes: 1,  // Start with 1 like
        totalComments: 0
      });
    } else {
      analytics.totalLikes += 1;  // Increment likes count
    }

    await analytics.save();

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, checkObjectId('id'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has not yet been liked
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    // Update likes received for the post's owner
    await updateLikesAndComments(post.user);

    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  '/comment/:id',
  auth,
  checkObjectId('id'),
  check('text', 'Text is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      post.comments.unshift(newComment);

      await post.save();

       // Update ProfileAnalytics for Comments
       let analytics = await ProfileAnalytics.findOne({ userId: req.user.id });

       if (!analytics) {
         analytics = new ProfileAnalytics({
           userId: req.user.id,
           totalPosts: 0,
           totalMessages: 0,
           totalGroups: 0,
           totalNotifications: 0,
           unreadNotifications: 0,
           totalLikes: 0,
           totalComments: 1  // Start with 1 comment
         });
       } else {
         analytics.totalComments += 1;  // Increment comment count
       }
 
       await analytics.save();

       // Update comments received for the post's owner
      await updateLikesAndComments(post.user);

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    // Remove the comment
    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );
    
    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
