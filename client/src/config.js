// Get the server URL from environment variable or use default
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

// Ensure the URL doesn't have a trailing slash
const normalizeUrl = (url) => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const config = {
  apiUrl: normalizeUrl(SERVER_URL),
  socketUrl: normalizeUrl(SERVER_URL),
};

console.log("API and Socket URLs:", config);

export default config;
