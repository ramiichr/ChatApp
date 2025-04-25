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
  MenuIcon,
  XIcon,
  ArrowLeftIcon,
} from "lucide-react";
import axios from "../utils/api";

const Chat = () => {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { socket, onlineUsers, connectionStatus } = useSocket();
  const { callStatus, startCall } = useCall();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
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
        const response = await axios.get(`/api/conversations`, {
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
          `/api/conversations/${activeConversation._id}/messages`,
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
    setShowSidebar(false); // Close sidebar on mobile when conversation is selected
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
      <header className="flex items-center justify-between px-3 sm:px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center">
          {activeConversation && (
            <Button
              onClick={() => setActiveConversation(null)}
              variant="ghost"
              className="mr-2 text-gray-400 hover:text-white md:hidden"
            >
              <ArrowLeftIcon size={18} />
            </Button>
          )}
          {!activeConversation && (
            <Button
              onClick={() => setShowSidebar(!showSidebar)}
              variant="ghost"
              className="mr-2 text-gray-400 hover:text-white md:hidden"
            >
              <MenuIcon size={18} />
            </Button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            ConnectHub
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Connection status indicator */}
          <div
            className={`hidden sm:flex items-center ${getConnectionStatusColor()}`}
          >
            {connectionStatus === "connected" ? (
              <WifiIcon size={16} className="mr-1" />
            ) : (
              <WifiOffIcon size={16} className="mr-1" />
            )}
            <span className="text-xs">{connectionStatus}</span>
          </div>

          <span className="hidden sm:inline text-gray-300">
            {currentUser?.username}
          </span>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <LogOutIcon size={18} />
            <span className="ml-2 hidden sm:inline">Logout</span>
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
          {/* Sidebar - Hidden on mobile by default, shown when showSidebar is true */}
          <aside
            className={`
              ${showSidebar ? "flex" : "hidden"} md:flex
              fixed md:relative inset-0 z-20 md:z-0
              w-full md:w-80 bg-gray-800 border-r border-gray-700 flex-col
            `}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-gray-200">
                Conversations
              </h2>
              <Button
                onClick={() => setShowSidebar(false)}
                variant="ghost"
                className="md:hidden text-gray-400 hover:text-white"
              >
                <XIcon size={18} />
              </Button>
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

          {/* Chat Area - Full width on mobile when activeConversation is set */}
          <main
            className={`
            flex-1 flex flex-col
            ${activeConversation || !showSidebar ? "flex" : "hidden"} md:flex
          `}
          >
            {activeConversation ? (
              <>
                {/* Conversation Header - Fixed position to ensure it stays visible */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
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
                        <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <h3 className="text-sm sm:text-lg font-medium text-white">
                        {
                          activeConversation.participants.find(
                            (p) => p._id !== currentUser?._id
                          )?.username
                        }
                      </h3>
                    </div>
                  </div>
                  <div className="flex space-x-1 sm:space-x-2">
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1 sm:p-2"
                      onClick={() => {
                        const otherUser = activeConversation.participants.find(
                          (p) => p._id !== currentUser?._id
                        );
                        if (otherUser) {
                          startCall(otherUser, "audio");
                        }
                      }}
                    >
                      <PhoneIcon size={18} className="sm:w-5 sm:h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1 sm:p-2"
                      onClick={() => {
                        const otherUser = activeConversation.participants.find(
                          (p) => p._id !== currentUser?._id
                        );
                        if (otherUser) {
                          startCall(otherUser, "video");
                        }
                      }}
                    >
                      <VideoIcon size={18} className="sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                </div>

                {/* Chat Window - Make sure it doesn't overlap the header */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <ChatWindow
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-850">
                <div className="text-center p-4">
                  <h3 className="text-lg sm:text-xl font-medium text-gray-400">
                    Select a conversation to start chatting
                  </h3>
                  <Button
                    onClick={() => setShowSidebar(true)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white md:hidden"
                  >
                    View Conversations
                  </Button>
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
