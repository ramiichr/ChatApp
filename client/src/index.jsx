import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Log environment variables at startup
console.log("React App Environment Variables:", {
  REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL,
  NODE_ENV: process.env.NODE_ENV,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
