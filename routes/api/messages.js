const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');
const ProfileAnalytics = require('../../models/ProfileAnalytics');

// @route   GET api/messages/:roomId
// @desc    Get all messages for a specific room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ date: 1 });

    if (!messages) {
      return res.status(404).json({ msg: 'No messages found' });
    }

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/messages
// @desc    Create a new message and update analytics
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, roomId, text } = req.body;

    // Create new message
    const newMessage = new Message({
      senderId,
      receiverId,
      roomId,
      text,
      isRead: false
    });

    const message = await newMessage.save();

    // Update receiver's analytics
    await ProfileAnalytics.findOneAndUpdate(
      { userId: receiverId },
      { 
        $inc: { 
          messagesReceived: 1,
          totalMessages: 1,
          totalNotifications: 1,
          unreadNotifications: 1
        } 
      },
      { 
        new: true,
        upsert: true // Create if doesn't exist
      }
    );

    // Update sender's analytics
    await ProfileAnalytics.findOneAndUpdate(
      { userId: senderId },
      { 
        $inc: { 
          messagesSent: 1,
          totalMessages: 1 
        }
      },
      { 
        new: true,
        upsert: true
      }
    );

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/messages/mark-as-read
// @desc    Mark messages as read and update analytics
router.put('/mark-as-read', async (req, res) => {
  try {
    const { roomId, userId } = req.body;

    // Find unread messages in this room for this user
    const unreadCount = await Message.countDocuments({ 
      roomId, 
      receiverId: userId,
      isRead: false 
    });

    if (unreadCount === 0) {
      return res.status(404).json({ msg: 'No unread messages found' });
    }

    // Mark messages as read
    const updatedMessages = await Message.updateMany(
      { 
        roomId, 
        receiverId: userId,
        isRead: false 
      },
      { isRead: true }
    );

    // Update analytics
    await ProfileAnalytics.findOneAndUpdate(
      { userId },
      { 
        $inc: { unreadNotifications: -unreadCount }
      },
      { 
        new: true,
        upsert: true
      }
    );

    res.json({ 
      msg: 'Messages marked as read',
      count: unreadCount 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/messages/:messageId
// @desc    Delete a message and update analytics
router.delete('/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    // Update sender's analytics
    await ProfileAnalytics.findOneAndUpdate(
      { userId: message.senderId },
      { 
        $inc: { totalMessages: -1 }
      }
    );

    // Update receiver's analytics
    await ProfileAnalytics.findOneAndUpdate(
      { userId: message.receiverId },
      { 
        $inc: { 
          totalMessages: -1,
          totalNotifications: -1,
          unreadNotifications: message.isRead ? 0 : -1
        } 
      }
    );

    await message.remove();
    res.json({ msg: 'Message removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/messages/unread/:userId
// @desc    Get unread message count for a user
router.get('/unread/:userId', async (req, res) => {
  try {
    const analytics = await ProfileAnalytics.findOne({ 
      userId: req.params.userId 
    }).select('unreadNotifications');

    res.json({
      unreadCount: analytics ? analytics.unreadNotifications : 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get message count for a user
// @route   GET api/messages/count/:userId
// @desc    Get message counts for a user
router.get('/count/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const senderId = req.params.senderId;
    const receiverId = req.params.receiverId;

    const allMessages = await Message.find({
      $or: [
        { sender: userId },
        { receiverId: userId }
      ]
    });

     // Count messages based on user's role
     const sentCount = allMessages.filter(msg => msg.sender.toString() === userId).length;
     const receivedCount = allMessages.filter(msg => msg.receiverId.toString() === userId).length;
    
    console.log("User Params", req);
    console.log("UserId", userId);
    console.log("SenderId", senderId);
    console.log("ReceiverId", receiverId);
    
    // Update analytics
    await ProfileAnalytics.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          messagesSent: sentCount,
          messagesReceived: receivedCount,
          totalMessages: sentCount + receivedCount
        } 
      },
      { upsert: true }
    );

    res.json({
      messagesSent: sentCount,
      messagesReceived: receivedCount,
      totalMessages: sentCount + receivedCount
    });
  } catch (err) {
    console.error('Error getting message counts:', err);
    res.status(500).send('Server Error');
  }
});

// Utility function to recalculate message counts for a user
const recalculateMessageCounts = async (userId) => {
  try {
    const sentCount = await Message.countDocuments({ senderId: userId });
    const receivedCount = await Message.countDocuments({ receiverId: userId });
    
    await ProfileAnalytics.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          messagesSent: sentCount,
          messagesReceived: receivedCount,
          totalMessages: sentCount + receivedCount
        } 
      },
      { upsert: true }
    );

    return {
      messagesSent: sentCount,
      messagesReceived: receivedCount,
      totalMessages: sentCount + receivedCount
    };
  } catch (err) {
    console.error('Error recalculating message counts:', err);
    throw err;
  }
};

// Route to force recalculate message counts
router.post('/recalculate-counts/:userId', async (req, res) => {
  try {
    const counts = await recalculateMessageCounts(req.params.userId);
    res.json(counts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;