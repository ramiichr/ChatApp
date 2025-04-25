const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    console.log("Register request received:", {
      body: req.body,
      headers: {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },
    });

    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log("Missing required fields:", {
        username: !!username,
        email: !!email,
        password: !!password,
      });
      return res.status(400).json({
        message: "All fields are required (username, email, password)",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log("User already exists:", { email, username });
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();
    console.log("User created successfully:", {
      id: user._id,
      username: user.username,
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error details:", error.message);

    // Send more detailed error in development
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({
        message: "Server error",
        details: error.message,
        stack: error.stack,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    console.log("Login request received:", {
      body: req.body,
      headers: {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },
    });

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("Missing required fields:", {
        email: !!email,
        password: !!password,
      });
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found:", { email });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log("Password mismatch for user:", { email });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User authenticated successfully:", {
      id: user._id,
      username: user.username,
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", error.message);

    // Send more detailed error in development
    if (process.env.NODE_ENV !== "production") {
      return res.status(500).json({
        message: "Server error",
        details: error.message,
        stack: error.stack,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
