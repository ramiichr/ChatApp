require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing MongoDB connection...");
console.log(
  "MongoDB URI (masked):",
  process.env.MONGODB_URI
    ? "***" +
        process.env.MONGODB_URI.substring(process.env.MONGODB_URI.indexOf("@"))
    : "Not defined"
);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  })
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    console.log("Connection state:", mongoose.connection.readyState);
    return mongoose.connection.db.admin().serverStatus();
  })
  .then((info) => {
    console.log("MongoDB server info:");
    console.log("- version:", info.version);
    console.log(
      "- uptime:",
      Math.floor(info.uptime / 86400),
      "days,",
      Math.floor((info.uptime % 86400) / 3600),
      "hours"
    );
    console.log(
      "- connections:",
      info.connections.current,
      "current,",
      info.connections.available,
      "available"
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Error details:", err.message);
    process.exit(1);
  });
