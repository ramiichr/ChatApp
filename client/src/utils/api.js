import axios from "axios";
import config from "../config";

// Set the base URL for all axios requests
axios.defaults.baseURL = config.apiUrl;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
      baseURL: axios.defaults.baseURL,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Response Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export default axios;
