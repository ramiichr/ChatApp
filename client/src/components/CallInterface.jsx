"use client";

import { useState } from "react";

import { useEffect, useRef } from "react";
import { useCall } from "../context/CallContext";
import { Button } from "./ui/Button";
import {
  PhoneIcon,
  VideoIcon,
  MicIcon,
  MicOffIcon,
  VideoOffIcon,
} from "lucide-react";

const CallInterface = () => {
  const {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl overflow-hidden mx-2 sm:mx-4">
        <div className="p-3 sm:p-4 bg-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
              {remoteUser?.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="text-sm sm:text-lg font-medium text-white">
                {callStatus === "incoming"
                  ? "Incoming Call"
                  : callStatus === "calling"
                  ? "Calling..."
                  : remoteUser?.username}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                {callType === "video" ? "Video Call" : "Audio Call"}
              </p>
            </div>
          </div>
          <div>
            {callStatus === "incoming" ? (
              <div className="flex space-x-2 sm:space-x-3">
                <Button
                  onClick={rejectCall}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 sm:p-3"
                >
                  <PhoneIcon
                    size={16}
                    className="sm:w-5 sm:h-5 transform rotate-135"
                  />
                </Button>
                <Button
                  onClick={acceptCall}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 sm:p-3"
                >
                  {callType === "video" ? (
                    <VideoIcon size={16} className="sm:w-5 sm:h-5" />
                  ) : (
                    <PhoneIcon size={16} className="sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={endCall}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 sm:p-3"
              >
                <PhoneIcon
                  size={16}
                  className="sm:w-5 sm:h-5 transform rotate-135"
                />
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Main video (remote) */}
          {callType === "video" && remoteStream && (
            <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-gray-900">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Audio only display */}
          {(callType === "audio" || !remoteStream) && (
            <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-purple-600 mx-auto flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                    {remoteUser?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-medium text-white">
                  {remoteUser?.username}
                </h3>
                {callStatus === "calling" && (
                  <p className="mt-1 sm:mt-2 text-sm text-gray-400">
                    Calling...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Self view (local) */}
          {callType === "video" && localStream && (
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-24 h-32 sm:w-36 sm:h-28 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {callStatus === "ongoing" && (
          <div className="p-3 sm:p-4 bg-gray-900 flex items-center justify-center space-x-3 sm:space-x-4">
            <Button
              onClick={toggleMute}
              className={`rounded-full p-2 sm:p-3 ${
                isMuted
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              } text-white`}
            >
              {isMuted ? (
                <MicOffIcon size={16} className="sm:w-5 sm:h-5" />
              ) : (
                <MicIcon size={16} className="sm:w-5 sm:h-5" />
              )}
            </Button>

            {callType === "video" && (
              <Button
                onClick={toggleVideo}
                className={`rounded-full p-2 sm:p-3 ${
                  isVideoOff
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                } text-white`}
              >
                {isVideoOff ? (
                  <VideoOffIcon size={16} className="sm:w-5 sm:h-5" />
                ) : (
                  <VideoIcon size={16} className="sm:w-5 sm:h-5" />
                )}
              </Button>
            )}

            <Button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 sm:p-3"
            >
              <PhoneIcon
                size={16}
                className="sm:w-5 sm:h-5 transform rotate-135"
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallInterface;
