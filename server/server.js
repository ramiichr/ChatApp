const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const conversationRoutes = require("./routes/conversations");
const { authenticateSocket } = require("./middleware/auth");
const Message = require("./models/Message"); // Import Message model
const Conversation = require("./models/Conversation"); // Import Conversation model

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);

// Socket.io
const onlineUsers = new Map();

io.use(authenticateSocket);

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();

  // Add user to online users
  onlineUsers.set(userId, {
    _id: userId,
    username: socket.user.username,
    socketId: socket.id,
  });

  // Broadcast online users
  io.emit("users:online", Array.from(onlineUsers.values()));

  console.log(`User connected: ${socket.user.username} (${userId})`);

  // Handle messages
  socket.on("message:send", async (message) => {
    try {
      // Save message to database
      const newMessage = await new Message({
        sender: message.sender,
        content: message.content,
        conversation: message.conversationId,
      }).save();

      // Find the conversation
      const conversation = await Conversation.findById(
        message.conversationId
      ).populate("participants", "_id username");

      // Find the recipient
      const recipient = conversation.participants.find(
        (p) => p._id.toString() !== message.sender
      );

      if (recipient) {
        const recipientSocketId = onlineUsers.get(
          recipient._id.toString()
        )?.socketId;

        if (recipientSocketId) {
          // Send message to recipient
          io.to(recipientSocketId).emit("message:received", {
            ...message,
            _id: newMessage._id,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Handle calls
  socket.on("call:start", ({ to, type }) => {
    const recipientSocketId = onlineUsers.get(to)?.socketId;

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call:incoming", {
        from: {
          _id: userId,
          username: socket.user.username,
        },
        type,
      });
    }
  });

  socket.on("call:accept", ({ to }) => {
    const callerSocketId = onlineUsers.get(to)?.socketId;

    if (callerSocketId) {
      io.to(callerSocketId).emit("call:accepted", {
        to: userId,
      });
    }
  });

  socket.on("call:reject", ({ to }) => {
    const callerSocketId = onlineUsers.get(to)?.socketId;

    if (callerSocketId) {
      io.to(callerSocketId).emit("call:rejected", {
        by: userId,
      });
    }
  });

  socket.on("call:end", ({ to }) => {
    const recipientSocketId = onlineUsers.get(to)?.socketId;

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call:ended", {
        by: userId,
      });
    }
  });

  socket.on("call:offer", ({ to, offer }) => {
    const recipientSocketId = onlineUsers.get(to)?.socketId;

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call:offer", {
        from: userId,
        offer,
      });
    }
  });

  socket.on("call:answer", ({ to, answer }) => {
    const callerSocketId = onlineUsers.get(to)?.socketId;

    if (callerSocketId) {
      io.to(callerSocketId).emit("call:answer", {
        answer,
      });
    }
  });

  socket.on("call:ice-candidate", ({ to, candidate }) => {
    const recipientSocketId = onlineUsers.get(to)?.socketId;

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call:ice-candidate", {
        candidate,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username} (${userId})`);

    // Remove user from online users
    onlineUsers.delete(userId);

    // Broadcast online users
    io.emit("users:online", Array.from(onlineUsers.values()));
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
