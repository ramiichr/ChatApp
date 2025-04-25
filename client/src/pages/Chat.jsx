"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useCall } from "../context/CallContext";
import UserList from "../components/UserList";
import ChatWindow from "../components/ChatWindow";
import CallInterface from "../components/CallInterface";
import { Button } from "../components/ui/Button";
import {
  PhoneIcon,
  VideoIcon,
  LogOutIcon,
  WifiIcon,
  WifiOffIcon,
} from "lucide-react";
import axios from "axios";
import config from "../config";

const Chat = () => {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { socket, onlineUsers, connectionStatus } = useSocket();
  const { callStatus, startCall } = useCall();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) {
      return; // Wait until authentication check is complete
    }

    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Fetch conversations
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/conversations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setConversations(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser, navigate, authLoading]);

  useEffect(() => {
    if (!socket || !activeConversation) return;

    // Listen for new messages
    socket.on("message:received", (message) => {
      if (message.conversationId === activeConversation._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Fetch messages for active conversation
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${config.apiUrl}/api/conversations/${activeConversation._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    return () => {
      socket.off("message:received");
    };
  }, [socket, activeConversation]);

  // Add this useEffect to test socket connection
  useEffect(() => {
    if (socket) {
      console.log("Socket connected status:", socket.connected);

      // Test emitting an event
      socket.emit("test:ping");

      // Listen for test response
      socket.on("test:pong", () => {
        console.log("Received pong from server");
      });

      return () => {
        socket.off("test:pong");
      };
    }
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleSendMessage = (text) => {
    if (!socket || !activeConversation || !text.trim()) return;

    const message = {
      sender: currentUser._id,
      content: text,
      conversationId: activeConversation._id,
      timestamp: new Date().toISOString(),
    };

    socket.emit("message:send", message);
    setMessages((prev) => [...prev, message]);
  };

  // Helper function to get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "error":
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          ConnectHub
        </h1>
        <div className="flex items-center space-x-4">
          {/* Connection status indicator */}
          <div className={`flex items-center ${getConnectionStatusColor()}`}>
            {connectionStatus === "connected" ? (
              <WifiIcon size={16} className="mr-1" />
            ) : (
              <WifiOffIcon size={16} className="mr-1" />
            )}
            <span className="text-xs">{connectionStatus}</span>
          </div>

          <span className="text-gray-300">{currentUser?.username}</span>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <LogOutIcon size={18} />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading conversations...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-200">
                Conversations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <UserList
                conversations={conversations}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                activeConversation={activeConversation}
                onSelect={handleConversationSelect}
                setConversations={setConversations}
              />
            </div>
          </aside>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Conversation Header - Fixed position to ensure it stays visible */}
                <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                        {activeConversation.participants
                          .find((p) => p._id !== currentUser?._id)
                          ?.username.charAt(0)
                          .toUpperCase()}
                      </div>
                      {onlineUsers.some(
                        (user) =>
                          user._id ===
                          activeConversation.participants.find(
                            (p) => p._id !== currentUser?._id
                          )?._id
                      ) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-white">
                        {
                          activeConversation.participants.find(
                            (p) => p._id !== currentUser?._id
                          )?.username
                        }
                      </h3>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-2"
                      onClick={() => {
                        const otherUser = activeConversation.participants.find(
                          (p) => p._id !== currentUser?._id
                        );
                        if (otherUser) {
                          startCall(otherUser, "audio");
                        }
                      }}
                    >
                      <PhoneIcon size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-2"
                      onClick={() => {
                        const otherUser = activeConversation.participants.find(
                          (p) => p._id !== currentUser?._id
                        );
                        if (otherUser) {
                          startCall(otherUser, "video");
                        }
                      }}
                    >
                      <VideoIcon size={20} />
                    </Button>
                  </div>
                </div>

                {/* Chat Window - Make sure it doesn't overlap the header */}
                <div className="flex-1 overflow-hidden">
                  <ChatWindow
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-850">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-gray-400">
                    Select a conversation to start chatting
                  </h3>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Call Interface */}
      {callStatus !== "idle" && <CallInterface />}
    </div>
  );
};

export default Chat;
