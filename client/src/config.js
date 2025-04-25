// Get the server URL from environment variable or use default
console.log("Environment variables:", {
  REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL,
  NODE_ENV: process.env.NODE_ENV,
});

// In production with Vercel, we'll use the deployed API URL
// For local development, use localhost
let SERVER_URL;

if (process.env.NODE_ENV === "production") {
  SERVER_URL =
    process.env.REACT_APP_SERVER_URL ||
    "https://chat-app-server-vercel.vercel.app";
} else {
  SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
}

console.log("Using SERVER_URL:", SERVER_URL);

// Ensure the URL doesn't have a trailing slash
const normalizeUrl = (url) => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const config = {
  apiUrl: normalizeUrl(SERVER_URL),
  socketUrl: normalizeUrl(SERVER_URL),
};

console.log("Final API and Socket URLs:", config);

export default config;
