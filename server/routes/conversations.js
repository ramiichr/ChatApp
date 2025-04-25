const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { authenticate } = require("../middleware/auth");
const router = express.Router();

// Get all conversations for current user
router.get("/", authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId,
    })
      .populate("participants", "username email avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new conversation
router.post("/", authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    // Find the recipient user
    const recipient = await User.findOne({ email });

    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [req.user.userId, recipient._id],
      },
    }).populate("participants", "username email avatar");

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // Create new conversation
    const newConversation = new Conversation({
      participants: [req.user.userId, recipient._id],
    });

    await newConversation.save();

    // Populate participants
    await newConversation.populate("participants", "username email avatar");

    res.status(201).json(newConversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a conversation
router.get("/:id/messages", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user.userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Get messages
    const messages = await Message.find({
      conversation: id,
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a message in a conversation
router.post("/:id/messages", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user.userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create new message
    const newMessage = new Message({
      conversation: id,
      sender: req.user.userId,
      content,
    });

    await newMessage.save();

    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
