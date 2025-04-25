"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SearchIcon, PlusIcon } from "lucide-react";
import axios from "../utils/api";

const UserList = ({
  conversations,
  onlineUsers,
  currentUser,
  activeConversation,
  onSelect,
  setConversations,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const { connectionStatus } = useSocket();

  // Debug logging for online users
  useEffect(() => {
    console.log("Online users in UserList:", onlineUsers);
  }, [onlineUsers]);

  // Search for users as the user types
  useEffect(() => {
    const searchUsers = async () => {
      if (searchUsername.trim().length < 2) {
        setUserSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      setShowSuggestions(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `/api/users/search?query=${searchUsername}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserSuggestions(response.data);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchUsername]);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = conversation.participants.find(
      (p) => p._id !== currentUser?._id
    );
    return otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateConversation = async (selectedUser) => {
    if (!selectedUser || !selectedUser.email) {
      setError("Please select a valid user");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/conversations",
        { email: selectedUser.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add the new conversation to the list
      setConversations((prev) => [...prev, response.data]);

      // Select the new conversation
      onSelect(response.data);

      // Reset form
      setShowNewChat(false);
      setSearchUsername("");
      setUserSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create conversation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.some((user) => user._id === userId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 sm:p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 text-sm"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon size={16} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-3 sm:px-4 py-2">
        <h3 className="text-xs sm:text-sm font-medium text-gray-400">
          RECENT CHATS
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white p-1"
          onClick={() => setShowNewChat(true)}
        >
          <PlusIcon size={16} />
        </Button>
      </div>

      {/* Connection status indicator when not connected */}
      {connectionStatus !== "connected" && (
        <div className="mx-3 sm:mx-4 mb-2 p-2 bg-yellow-900 bg-opacity-30 rounded-md">
          <p className="text-xs text-yellow-400">
            {connectionStatus === "connecting"
              ? "Connecting to server..."
              : "Connection issue. Online status may be inaccurate."}
          </p>
        </div>
      )}

      {showNewChat && (
        <div className="mx-3 sm:mx-4 mb-4 p-3 bg-gray-700 rounded-md">
          <h4 className="text-xs sm:text-sm font-medium text-white mb-2">
            Start a new conversation
          </h4>
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <div className="relative" ref={searchContainerRef}>
            <Input
              type="text"
              placeholder="Search for users..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onFocus={() => {
                if (searchUsername.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              onClick={(e) => {
                // Prevent the click from closing the dropdown
                e.stopPropagation();
                if (searchUsername.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              className="w-full mb-2 bg-gray-600 border border-gray-500 text-white text-sm"
            />

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
              </div>
            )}

            {/* User suggestions dropdown */}
            {showSuggestions && searchUsername.trim().length >= 2 && (
              <div
                className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
              >
                {userSuggestions.length > 0 ? (
                  <ul className="py-1">
                    {userSuggestions.map((user) => (
                      <li key={user._id}>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm flex items-center"
                          onClick={() => handleCreateConversation(user)}
                          disabled={isLoading}
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold mr-2">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                          {isLoading && (
                            <div className="ml-auto">
                              <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-2 px-3 text-sm text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white text-xs sm:text-sm"
              onClick={() => {
                setShowNewChat(false);
                setError("");
                setSearchUsername("");
                setUserSuggestions([]);
                setShowSuggestions(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {isLoading && (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent mr-2"></div>
                <span className="text-xs text-gray-400">
                  Creating conversation...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <ul className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.participants.find(
                (p) => p._id !== currentUser?._id
              );
              const isOnline = isUserOnline(otherUser?._id);
              const isActive = activeConversation?._id === conversation._id;

              return (
                <li key={conversation._id}>
                  <button
                    onClick={() => onSelect(conversation)}
                    className={`w-full flex items-center p-2 sm:p-3 rounded-md transition-colors ${
                      isActive ? "bg-gray-700" : "hover:bg-gray-700"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                        {otherUser?.username.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div className="ml-2 sm:ml-3 text-left">
                      <p className="text-xs sm:text-sm font-medium text-white">
                        {otherUser?.username}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <p className="text-center mb-4 text-sm">No conversations found</p>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm"
              onClick={() => setShowNewChat(true)}
            >
              <PlusIcon size={14} className="mr-1" />
              Start a new chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
