"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  // Removed unused currentUser variable
  const [callStatus, setCallStatus] = useState("idle"); // idle, calling, incoming, ongoing
  const [callType, setCallType] = useState(null); // audio, video
  const [remoteUser, setRemoteUser] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnection = useRef(null);

  const resetCallState = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setCallStatus("idle");
    setCallType(null);
    setRemoteUser(null);
    setLocalStream(null);
    setRemoteStream(null);
  }, [localStream]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call:ice-candidate", {
          to: remoteUser._id,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Add local tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnection.current = pc;
  }, [socket, remoteUser, localStream]);

  const endCall = useCallback(() => {
    if (remoteUser && socket) {
      socket.emit("call:end", {
        to: remoteUser._id,
      });
    }

    resetCallState();
  }, [remoteUser, socket, resetCallState]);

  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", async ({ from, type }) => {
      setCallStatus("incoming");
      setCallType(type);
      setRemoteUser(from);
    });

    socket.on("call:accepted", async ({ to }) => {
      setCallStatus("ongoing");
      createPeerConnection();

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call:offer", {
        to: remoteUser._id,
        offer: peerConnection.current.localDescription,
      });
    });

    socket.on("call:offer", async ({ from, offer }) => {
      if (callStatus !== "incoming") return;

      createPeerConnection();
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create and send answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("call:answer", {
        to: from._id,
        answer: peerConnection.current.localDescription,
      });

      setCallStatus("ongoing");
    });

    socket.on("call:answer", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    socket.on("call:ended", () => {
      endCall();
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice-candidate");
      socket.off("call:ended");
    };
  }, [socket, callStatus, remoteUser, createPeerConnection, endCall]);

  const startCall = async (user, type) => {
    try {
      const constraints = {
        audio: true,
        video: type === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallType(type);
      setRemoteUser(user);
      setCallStatus("calling");

      socket.emit("call:start", {
        to: user._id,
        type,
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const acceptCall = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      socket.emit("call:accept", {
        to: remoteUser._id,
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const rejectCall = () => {
    socket.emit("call:reject", {
      to: remoteUser._id,
    });

    resetCallState();
  };

  const value = {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
