"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import config from "../config";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // 'connected', 'disconnected', 'connecting'
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    console.log(`Connecting to socket server at: ${config.socketUrl}`);

    const newSocket = io(config.socketUrl, {
      auth: {
        token: localStorage.getItem("token"),
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server with ID:", newSocket.id);
      setConnectionStatus("connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setConnectionStatus("error");
    });

    newSocket.on("users:online", (users) => {
      console.log("Received online users:", users);
      setOnlineUsers(users);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      setConnectionStatus("disconnected");
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(
        `Reconnected to socket server after ${attemptNumber} attempts`
      );
      setConnectionStatus("connected");
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
      setConnectionStatus("connecting");
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
      setConnectionStatus("error");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
      setConnectionStatus("failed");
    });

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [currentUser]);

  const value = {
    socket,
    onlineUsers,
    connectionStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
