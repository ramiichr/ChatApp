"use client";

import { useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SearchIcon, PlusIcon, UserPlusIcon } from "lucide-react";

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
  const [newChatEmail, setNewChatEmail] = useState("");
  const [error, setError] = useState("");
  const { socket } = useSocket();

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser = conversation.participants.find(
      (p) => p._id !== currentUser._id
    );
    return otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateConversation = async () => {
    try {
      setError("");
      const response = await fetch("http://localhost:5000/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ email: newChatEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create conversation");
      }

      // Add the new conversation to the list
      setConversations((prev) => [...prev, data]);
      setShowNewChat(false);
      setNewChatEmail("");

      // Select the new conversation
      onSelect(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-2">
        <h3 className="text-sm font-medium text-gray-400">RECENT CHATS</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white p-1"
          onClick={() => setShowNewChat(true)}
        >
          <PlusIcon size={18} />
        </Button>
      </div>

      {showNewChat && (
        <div className="mx-4 mb-4 p-3 bg-gray-700 rounded-md">
          <h4 className="text-sm font-medium text-white mb-2">
            Start a new conversation
          </h4>
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <Input
            type="email"
            placeholder="Enter email address"
            value={newChatEmail}
            onChange={(e) => setNewChatEmail(e.target.value)}
            className="w-full mb-2 bg-gray-600 border border-gray-500 text-white"
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleCreateConversation}
            >
              <UserPlusIcon size={16} className="mr-1" />
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white"
              onClick={() => {
                setShowNewChat(false);
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <ul className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.participants.find(
                (p) => p._id !== currentUser._id
              );
              const isOnline = onlineUsers.some(
                (user) => user._id === otherUser?._id
              );
              const isActive = activeConversation?._id === conversation._id;

              return (
                <li key={conversation._id}>
                  <button
                    onClick={() => onSelect(conversation)}
                    className={`w-full flex items-center p-3 rounded-md transition-colors ${
                      isActive ? "bg-gray-700" : "hover:bg-gray-700"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                        {otherUser?.username.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-white">
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
            <p className="text-center mb-4">No conversations found</p>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowNewChat(true)}
            >
              <PlusIcon size={16} className="mr-1" />
              Start a new chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
