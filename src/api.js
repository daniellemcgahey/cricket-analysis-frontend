// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "https://cricket-analysis-api.onrender.com", // fallback in case env variable is missing
});

export default api;
