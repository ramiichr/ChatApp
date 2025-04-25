"use client";

import { createContext, useState, useEffect, useContext } from "react";
import axios from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set default auth header for all requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const response = await axios.get("/api/users/me");
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Error loading user:", err);
        localStorage.removeItem("token");
        setError("Session expired. Please login again.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log("Attempting login with API URL:", axios.defaults.baseURL);

      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);
      const { token, user } = response.data;
      localStorage.setItem("token", token);

      // Set default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setCurrentUser(user);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      console.log(
        "Attempting registration with API URL:",
        axios.defaults.baseURL
      );

      const response = await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });

      console.log("Registration response:", response.data);
      const { token, user } = response.data;
      localStorage.setItem("token", token);

      // Set default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setCurrentUser(user);
      return true;
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
