const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authenticate HTTP requests
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Authenticate socket connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("Socket auth failed: No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("Socket auth failed: User not found");
      return next(new Error("User not found"));
    }

    console.log(
      `Socket authenticated for user: ${user.username} (${user._id})`
    );

    // Add user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error(`Authentication error: ${error.message}`));
  }
};

module.exports = { authenticate, authenticateSocket };
