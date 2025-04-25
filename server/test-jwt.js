require("dotenv").config();
const jwt = require("jsonwebtoken");

// Get JWT secret from environment or use default
const jwtSecret =
  process.env.JWT_SECRET || "Q2gEtBY4orRJUrtjjPcFgd48Qqs5vFCthtx2/GWNOyM=";

console.log("Testing JWT functionality...");
console.log(
  "JWT Secret (masked):",
  jwtSecret ? "***" + jwtSecret.substring(jwtSecret.length - 5) : "Not defined"
);

try {
  // Create a test payload
  const payload = {
    userId: "123456789012345678901234",
    testField: "This is a test",
  };

  console.log("\nTest payload:", payload);

  // Sign the token
  const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
  console.log("\n✅ Successfully signed JWT token:");
  console.log(token);

  // Verify the token
  const decoded = jwt.verify(token, jwtSecret);
  console.log("\n✅ Successfully verified JWT token:");
  console.log("Decoded payload:", decoded);

  console.log("\nJWT test completed successfully!");
} catch (err) {
  console.error("❌ JWT error:", err);
  console.error("Error details:", err.message);

  // Additional error information
  if (err.name === "JsonWebTokenError") {
    console.error(
      "\nThis error typically occurs when there is an issue with the JWT token or secret."
    );
    console.error("Possible causes:");
    console.error("1. JWT_SECRET environment variable is not set correctly");
    console.error("2. The token is malformed or tampered with");
  }

  process.exit(1);
}
