import axios from "axios";
import config from "../config";

// Set the base URL for all axios requests
axios.defaults.baseURL = config.apiUrl;

export default axios;
