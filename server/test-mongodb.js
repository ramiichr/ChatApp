require("dotenv").config();
const mongoose = require("mongoose");

// Get MongoDB URI from environment or use default
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb+srv://ramiirchr:Ramichr670@chatapp.hesoxgt.mongodb.net/chatapp?retryWrites=true&w=majority";

console.log("Testing MongoDB connection...");
console.log(
  "MongoDB URI (masked):",
  mongoUri.replace(
    /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
    "mongodb+srv://***:***@"
  )
);

// Connect to MongoDB
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    console.log("Connection state:", mongoose.connection.readyState);
    console.log("Host:", mongoose.connection.host);
    console.log("Database name:", mongoose.connection.name);

    // Try to perform a simple operation
    return mongoose.connection.db.admin().listDatabases();
  })
  .then((dbs) => {
    console.log("\n✅ Successfully listed databases:");
    dbs.databases.forEach((db) => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });

    // Try to access the users collection
    return mongoose.connection.db.collection("users").countDocuments();
  })
  .then((count) => {
    console.log(
      `\n✅ Successfully accessed users collection. Found ${count} documents.`
    );
    console.log("\nMongoDB connection test completed successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.error("Error details:", err.message);

    // Additional error information
    if (err.name === "MongoServerSelectionError") {
      console.error(
        "\nThis error typically occurs when the MongoDB server cannot be reached."
      );
      console.error("Possible causes:");
      console.error("1. Network connectivity issues");
      console.error("2. MongoDB Atlas IP whitelist restrictions");
      console.error("3. Incorrect connection string");
      console.error("4. MongoDB Atlas cluster is paused or unavailable");
    }

    process.exit(1);
  });
