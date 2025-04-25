"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SendIcon, PaperclipIcon, SmileIcon } from "lucide-react";

const ChatWindow = ({ messages, currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender === currentUser._id;
          return (
            <div
              key={index}
              className={`flex ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] sm:max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 sm:px-4 py-2 ${
                  isCurrentUser
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-gray-700 text-white rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isCurrentUser ? "text-purple-200" : "text-gray-400"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 border-t border-gray-700 p-2 sm:p-4 bg-gray-800"
      >
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            type="button"
            variant="ghost"
            className="text-gray-400 hover:text-white p-1 sm:p-2 hidden sm:block"
          >
            <PaperclipIcon size={18} className="sm:w-5 sm:h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-700 border-gray-600 text-white pr-10 text-sm sm:text-base"
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
            >
              <SmileIcon size={18} className="sm:w-5 sm:h-5" />
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1 sm:p-2"
          >
            <SendIcon size={18} className="sm:w-5 sm:h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
