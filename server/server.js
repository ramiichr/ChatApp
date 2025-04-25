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
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS to accept connections from any origin
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB
console.log("Attempting to connect to MongoDB...");
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb+srv://ramiirchr:Ramichr670@chatapp.hesoxgt.mongodb.net/chatapp?retryWrites=true&w=majority";
console.log(
  "MongoDB URI (masked):",
  mongoUri.replace(
    /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
    "mongodb+srv://***:***@"
  )
);

// Function to connect to MongoDB with retries
const connectWithRetry = (retryCount = 0, maxRetries = 5) => {
  console.log(`MongoDB connection attempt ${retryCount + 1}/${maxRetries + 1}`);

  return mongoose
    .connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Longer timeout for Vercel
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log("Connected to MongoDB successfully");
      console.log("Connection state:", mongoose.connection.readyState);
    })
    .catch((err) => {
      console.error(
        `MongoDB connection error (attempt ${retryCount + 1}):`,
        err
      );
      console.error("Error details:", err.message);

      if (retryCount < maxRetries) {
        console.log(`Retrying connection in 3 seconds...`);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(connectWithRetry(retryCount + 1, maxRetries));
          }, 3000);
        });
      } else {
        console.error(
          "Maximum retry attempts reached. Could not connect to MongoDB."
        );
        // Don't crash the server, but log the error
        return Promise.resolve(); // Continue without DB connection
      }
    });
};

// Start connection process
connectWithRetry();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);

// Add a status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    onlineUsers: Array.from(userSockets.keys()).map((userId) => {
      const user = getUserById(userId);
      return {
        id: userId,
        username: user ? user.username : "Unknown",
        connections: userSockets.get(userId).size,
      };
    }),
    timestamp: new Date().toISOString(),
  });
});

// Add a simple test endpoint that doesn't require authentication
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working correctly",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb_uri_exists: !!process.env.MONGODB_URI,
    jwt_secret_exists: !!process.env.JWT_SECRET,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
  });
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const mongoStatusText = [
    "disconnected",
    "connected",
    "connecting",
    "disconnecting",
  ][mongoStatus];

  // Get environment variables (masked for security)
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || "not set",
    PORT: process.env.PORT || "5000",
    MONGODB_URI: process.env.MONGODB_URI ? "set (masked)" : "not set",
    JWT_SECRET: process.env.JWT_SECRET ? "set (masked)" : "not set",
    CLIENT_URL: process.env.CLIENT_URL || "not set",
  };

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStatusText,
      readyState: mongoStatus,
      host: mongoose.connection.host || "not connected",
      name: mongoose.connection.name || "not connected",
    },
    environment: process.env.NODE_ENV || "development",
    env_vars: envVars,
    server: {
      uptime: Math.floor(process.uptime()) + " seconds",
      memory: process.memoryUsage(),
      node_version: process.version,
    },
  });
});

// 404 handler - must be before the error handler
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/health") {
    console.log(`404 Not Found: ${req.method} ${req.path}`);
    return res.status(404).json({
      error: "Not Found",
      message: `The requested endpoint ${req.method} ${req.path} does not exist`,
      available_endpoints: [
        "GET /api/test",
        "GET /health",
        "POST /api/auth/register",
        "POST /api/auth/login",
        "GET /api/users/me",
        "GET /api/conversations",
      ],
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  console.error("Error stack:", err.stack);

  // Send detailed error in development, generic in production
  res.status(500).json({
    error: "Server error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

// Socket.io
// Instead of a simple Map, we'll use a Map of Sets to track multiple connections per user
const userSockets = new Map(); // userId -> Set of socket IDs
const socketUsers = new Map(); // socketId -> userId

// Helper function to get a user by ID from our connected users
function getUserById(userId) {
  for (const [socketId, socket] of io.sockets.sockets.entries()) {
    if (socket.user && socket.user._id.toString() === userId) {
      return socket.user;
    }
  }
  return null;
}

// Helper function to broadcast online users
function broadcastOnlineUsers() {
  const onlineUsers = Array.from(userSockets.keys())
    .map((userId) => {
      const user = getUserById(userId);
      if (!user) return null;

      return {
        _id: userId,
        username: user.username,
      };
    })
    .filter(Boolean); // Remove any null entries

  io.emit("users:online", onlineUsers);
  console.log(
    "Broadcasting online users:",
    onlineUsers.map((u) => u.username)
  );
}

io.use(authenticateSocket);

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  const socketId = socket.id;

  console.log(
    `Socket connected: ${socketId} for user ${socket.user.username} (${userId})`
  );

  // Add this socket to the user's set of connections
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);
  socketUsers.set(socketId, userId);

  // Log current online users
  console.log(
    "Current online users:",
    Array.from(userSockets.keys()).map((id) => {
      const user = getUserById(id);
      return user ? user.username : "Unknown";
    })
  );

  // Broadcast online users
  broadcastOnlineUsers();

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
        const recipientId = recipient._id.toString();
        const recipientSockets = userSockets.get(recipientId);

        if (recipientSockets && recipientSockets.size > 0) {
          // Send message to all of recipient's connected sockets
          recipientSockets.forEach((recipientSocketId) => {
            io.to(recipientSocketId).emit("message:received", {
              ...message,
              _id: newMessage._id,
            });
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Handle calls
  socket.on("call:start", ({ to, type }) => {
    console.log(
      `Call start request from ${socket.user.username} to user ID ${to}, type: ${type}`
    );
    const recipientSockets = userSockets.get(to);

    if (recipientSockets && recipientSockets.size > 0) {
      // Send to first socket (we can only have one call at a time per user)
      const recipientSocketId = Array.from(recipientSockets)[0];
      console.log(`Sending call:incoming to socket ${recipientSocketId}`);
      io.to(recipientSocketId).emit("call:incoming", {
        from: {
          _id: userId,
          username: socket.user.username,
        },
        type,
      });
    } else {
      console.log(`User ${to} is not online or has no active sockets`);
      // Notify caller that recipient is not available
      socket.emit("call:error", {
        message: "User is not available",
        code: "USER_UNAVAILABLE",
      });
    }
  });

  socket.on("call:accept", ({ to }) => {
    console.log(`Call accept from ${socket.user.username} to user ID ${to}`);
    const callerSockets = userSockets.get(to);

    if (callerSockets && callerSockets.size > 0) {
      // Send to first socket
      const callerSocketId = Array.from(callerSockets)[0];
      console.log(`Sending call:accepted to socket ${callerSocketId}`);
      io.to(callerSocketId).emit("call:accepted", {
        to: userId,
      });
    } else {
      console.log(`Caller ${to} is no longer online`);
      socket.emit("call:error", {
        message: "Caller is no longer available",
        code: "CALLER_UNAVAILABLE",
      });
    }
  });

  socket.on("call:reject", ({ to }) => {
    console.log(`Call reject from ${socket.user.username} to user ID ${to}`);
    const callerSockets = userSockets.get(to);

    if (callerSockets && callerSockets.size > 0) {
      // Send to first socket
      const callerSocketId = Array.from(callerSockets)[0];
      io.to(callerSocketId).emit("call:rejected", {
        by: userId,
      });
    }
  });

  socket.on("call:end", ({ to }) => {
    console.log(`Call end from ${socket.user.username} to user ID ${to}`);
    const recipientSockets = userSockets.get(to);

    if (recipientSockets && recipientSockets.size > 0) {
      // Send to first socket
      const recipientSocketId = Array.from(recipientSockets)[0];
      io.to(recipientSocketId).emit("call:ended", {
        by: userId,
      });
    }
  });

  socket.on("call:offer", ({ to, offer, reconnect }) => {
    console.log(
      `Call offer from ${socket.user.username} to user ID ${to}${
        reconnect ? " (reconnection attempt)" : ""
      }`
    );
    const recipientSockets = userSockets.get(to);

    if (recipientSockets && recipientSockets.size > 0) {
      // Send to first socket
      const recipientSocketId = Array.from(recipientSockets)[0];
      console.log(`Sending call:offer to socket ${recipientSocketId}`);
      io.to(recipientSocketId).emit("call:offer", {
        from: userId,
        offer,
        reconnect: !!reconnect,
      });
    } else {
      console.log(`Recipient ${to} is no longer online`);
      socket.emit("call:error", {
        message: "Recipient is no longer available",
        code: "RECIPIENT_UNAVAILABLE",
      });
    }
  });

  socket.on("call:answer", ({ to, answer, reconnect }) => {
    console.log(
      `Call answer from ${socket.user.username} to user ID ${to}${
        reconnect ? " (reconnection)" : ""
      }`
    );
    const callerSockets = userSockets.get(to);

    if (callerSockets && callerSockets.size > 0) {
      // Send to first socket
      const callerSocketId = Array.from(callerSockets)[0];
      console.log(`Sending call:answer to socket ${callerSocketId}`);
      io.to(callerSocketId).emit("call:answer", {
        answer,
        reconnect: !!reconnect,
      });
    } else {
      console.log(`Caller ${to} is no longer online`);
      socket.emit("call:error", {
        message: "Caller is no longer available",
        code: "CALLER_UNAVAILABLE",
      });
    }
  });

  socket.on("call:ice-candidate", ({ to, candidate }) => {
    // console.log(`ICE candidate from ${socket.user.username} to user ID ${to}:`, candidate);
    const recipientSockets = userSockets.get(to);

    if (recipientSockets && recipientSockets.size > 0) {
      // Send to first socket
      const recipientSocketId = Array.from(recipientSockets)[0];
      io.to(recipientSocketId).emit("call:ice-candidate", {
        candidate,
      });
    } else {
      console.log(`Recipient ${to} is no longer online for ICE candidate`);
    }
  });

  // Add a ping/pong mechanism to test connectivity
  socket.on("test:ping", () => {
    console.log(`Received ping from ${socket.user.username}`);
    socket.emit("test:pong");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socketId} for user ${socket.user.username} (${userId})`
    );

    // Remove this socket from the user's connections
    if (userSockets.has(userId)) {
      userSockets.get(userId).delete(socketId);

      // If this was the user's last connection, remove them from the map
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
      }
    }

    // Remove from socket-to-user mapping
    socketUsers.delete(socketId);

    // Broadcast updated online users
    broadcastOnlineUsers();
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(
    `For local network access, use your machine's IP address: http://<YOUR-IP-ADDRESS>:${PORT}`
  );
});
