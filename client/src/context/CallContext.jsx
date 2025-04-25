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
import {
  ensureWebRTCCompatibility,
  isWebRTCSupported,
  isSecureContext,
  getUserMedia,
  checkAndRequestPermissions,
  createPeerConnectionWithFallback,
} from "../utils/webrtcUtils";

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

  // Force WebRTC support to true for Chrome
  const isChrome =
    typeof navigator !== "undefined" &&
    /Chrome/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor);
  const [webRTCSupported, setWebRTCSupported] = useState(
    isChrome ? true : true
  );

  const peerConnection = useRef(null);

  // Initialize WebRTC compatibility
  useEffect(() => {
    try {
      // Check if we're on Chrome and FORCE WebRTC support
      const isChrome =
        /Chrome/.test(navigator.userAgent) &&
        /Google Inc/.test(navigator.vendor);

      if (isChrome) {
        console.log("Chrome detected, FORCING WebRTC support to true");
        setWebRTCSupported(true);

        // Check for permissions but don't let it affect our WebRTC support status
        checkAndRequestPermissions(true, false)
          .then(() => {
            console.log("Microphone permission granted or prompted");
          })
          .catch((err) => {
            console.warn("Microphone permission issue detected:", err);
          });

        return;
      }

      // Check if we have a global flag set by Chat.jsx
      if (
        typeof window !== "undefined" &&
        window.forceWebRTCSupported === true
      ) {
        console.log("Global flag forcing WebRTC support to true");
        setWebRTCSupported(true);
        return;
      }

      // First check if we're in a secure context
      const secure = isSecureContext();
      console.log("Is secure context:", secure);

      if (!secure) {
        console.error("WebRTC requires a secure context (HTTPS or localhost)");
        setWebRTCSupported(false);
        return;
      }

      // Ensure compatibility by setting up polyfills
      ensureWebRTCCompatibility();

      // Check if we're on a known browser that should support WebRTC
      const isEdgeChromium = /Edg/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      // If we're on a modern browser, assume WebRTC is supported
      if (isEdgeChromium || isFirefox || isSafari) {
        console.log("Detected a modern browser that should support WebRTC");
        setWebRTCSupported(true);

        // Pre-check permissions to help with debugging
        checkAndRequestPermissions(true, false)
          .then(() => {
            console.log("Microphone permission granted or prompted");
          })
          .catch((err) => {
            console.warn("Microphone permission issue detected:", err);
          });

        return;
      }

      // For other browsers, check WebRTC support
      const supported = isWebRTCSupported();
      setWebRTCSupported(supported);

      if (!supported) {
        console.error("WebRTC is not supported in this browser");
      }
    } catch (error) {
      console.error("Error initializing WebRTC:", error);

      // Even if there's an error, if we're on a modern browser, assume WebRTC is supported
      const isModernBrowser = /Chrome|Firefox|Safari|Edge/.test(
        navigator.userAgent
      );
      if (isModernBrowser) {
        console.log(
          "Error occurred but we're on a modern browser, assuming WebRTC is supported"
        );
        setWebRTCSupported(true);
      } else {
        setWebRTCSupported(false);
      }
    }
  }, []);

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
    // No need to check for WebRTC support - we'll just try to create the connection directly

    try {
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          // Free TURN server from Twilio (limited but useful for testing)
          {
            urls: "turn:global.turn.twilio.com:3478?transport=udp",
            username:
              "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
            credential: "w1WpauEsFLlf91PdVRMDFyNMQVX3i7EMIgDn7Sd1",
          },
          // Free TURN server from Open Relay
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: "all", // Try both relay and direct connections
      };

      console.log("Creating peer connection with config:", config);
      const pc = createPeerConnectionWithFallback(config);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate generated:", event.candidate);
          socket.emit("call:ice-candidate", {
            to: remoteUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Log ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      pc.ontrack = (event) => {
        console.log("Remote track received:", event.streams);
        setRemoteStream(event.streams[0]);
      };

      // Add local tracks to peer connection
      if (localStream) {
        console.log("Adding local tracks to peer connection");
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      } else {
        console.warn("No local stream available to add tracks");
      }

      peerConnection.current = pc;
      return pc;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      throw new Error(`Failed to create peer connection: ${error.message}`);
    }
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

    // Reference to connection timeout timer
    let connectionTimeoutTimer = null;

    // Function to set up connection timeout
    const setupConnectionTimeout = () => {
      // Clear any existing timeout
      if (connectionTimeoutTimer) {
        clearTimeout(connectionTimeoutTimer);
      }

      // Set a new timeout - if connection isn't established in 30 seconds, try to use TURN
      connectionTimeoutTimer = setTimeout(() => {
        if (
          peerConnection.current &&
          (peerConnection.current.iceConnectionState === "checking" ||
            peerConnection.current.iceConnectionState === "new")
        ) {
          console.warn(
            "Connection taking too long - may be having trouble with NAT traversal"
          );

          // Force the use of TURN servers by recreating the connection with relay-only policy
          if (peerConnection.current) {
            console.log("Forcing TURN relay for connection");

            // Close the existing connection
            peerConnection.current.close();

            // Create a new config that forces TURN usage
            const turnOnlyConfig = {
              iceServers: [
                // Free TURN server from Twilio
                {
                  urls: "turn:global.turn.twilio.com:3478?transport=udp",
                  username:
                    "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
                  credential: "w1WpauEsFLlf91PdVRMDFyNMQVX3i7EMIgDn7Sd1",
                },
                // Free TURN server from Open Relay
                {
                  urls: "turn:openrelay.metered.ca:80",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
                {
                  urls: "turn:openrelay.metered.ca:443",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
                {
                  urls: "turn:openrelay.metered.ca:443?transport=tcp",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
              ],
              iceTransportPolicy: "relay", // Force usage of TURN servers
            };

            // Create a new peer connection with the TURN-only config
            const pc = createPeerConnectionWithFallback(turnOnlyConfig);
            peerConnection.current = pc;

            // Add local tracks to the new peer connection
            if (localStream) {
              localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
              });
            }

            // Restart the connection process
            if (callStatus === "ongoing") {
              // Recreate and send offer
              pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                  socket.emit("call:offer", {
                    to: remoteUser._id,
                    offer: pc.localDescription,
                    reconnect: true,
                  });
                })
                .catch((error) => {
                  console.error("Error recreating connection:", error);
                  alert("Connection issues detected. Please try again.");
                  endCall();
                });
            }
          }
        }
      }, 15000); // 15 seconds timeout
    };

    socket.on("call:incoming", async ({ from, type }) => {
      console.log(`Incoming ${type} call from:`, from);
      setCallStatus("incoming");
      setCallType(type);
      setRemoteUser(from);
    });

    socket.on("call:accepted", async ({ to }) => {
      console.log("Call accepted, creating peer connection");
      setCallStatus("ongoing");
      createPeerConnection();

      // Set up connection timeout
      setupConnectionTimeout();

      try {
        // Create and send offer
        console.log("Creating offer");
        const offer = await peerConnection.current.createOffer();
        console.log("Setting local description", offer);
        await peerConnection.current.setLocalDescription(offer);

        console.log("Sending offer to:", remoteUser._id);
        socket.emit("call:offer", {
          to: remoteUser._id,
          offer: peerConnection.current.localDescription,
        });
      } catch (error) {
        console.error("Error creating or sending offer:", error);
        alert("Failed to establish call connection. Please try again.");
        endCall();
      }
    });

    socket.on("call:offer", async ({ from, offer, reconnect }) => {
      console.log(
        "Received offer from:",
        from,
        reconnect ? "(reconnection attempt)" : ""
      );

      // Handle reconnection attempts differently
      if (reconnect && callStatus === "ongoing") {
        try {
          // Close existing connection if there is one
          if (peerConnection.current) {
            peerConnection.current.close();
          }

          // Create a new peer connection
          createPeerConnection();

          // Set up connection timeout
          setupConnectionTimeout();

          console.log("Setting remote description from reconnect offer");
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          // Create and send answer
          console.log("Creating answer for reconnection");
          const answer = await peerConnection.current.createAnswer();
          console.log("Setting local description for reconnection answer");
          await peerConnection.current.setLocalDescription(answer);

          console.log("Sending reconnection answer to:", from);
          socket.emit("call:answer", {
            to: from,
            answer: peerConnection.current.localDescription,
            reconnect: true,
          });

          return;
        } catch (error) {
          console.error("Error handling reconnection offer:", error);
          alert("Failed to reestablish connection. Please try again.");
          endCall();
          return;
        }
      }

      // Normal offer handling (not a reconnection)
      if (callStatus !== "incoming") {
        console.log("Ignoring offer as call status is not 'incoming'");
        return;
      }

      try {
        console.log("Creating peer connection for incoming call");
        createPeerConnection();

        // Set up connection timeout
        setupConnectionTimeout();

        console.log("Setting remote description from offer");
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // Create and send answer
        console.log("Creating answer");
        const answer = await peerConnection.current.createAnswer();
        console.log("Setting local description for answer");
        await peerConnection.current.setLocalDescription(answer);

        console.log("Sending answer to:", from);
        socket.emit("call:answer", {
          to: from,
          answer: peerConnection.current.localDescription,
        });

        setCallStatus("ongoing");
      } catch (error) {
        console.error("Error handling offer:", error);
        alert("Failed to establish call connection. Please try again.");
        endCall();
      }
    });

    socket.on("call:answer", async ({ answer, reconnect }) => {
      console.log(
        "Received answer, setting remote description",
        reconnect ? "(from reconnection)" : ""
      );
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("Remote description set successfully");

        // If this was a successful reconnection, clear the timeout
        if (reconnect && connectionTimeoutTimer) {
          clearTimeout(connectionTimeoutTimer);
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
        alert("Failed to establish call connection. Please try again.");
        endCall();
      }
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        console.log("Received ICE candidate:", candidate);
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          console.log("Successfully added ICE candidate");
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    socket.on("call:ended", () => {
      console.log("Call ended by remote user");
      // Clear any connection timeout
      if (connectionTimeoutTimer) {
        clearTimeout(connectionTimeoutTimer);
      }
      endCall();
    });

    socket.on("call:error", ({ message, code }) => {
      console.error(`Call error: ${message} (${code})`);
      alert(`Call error: ${message}`);
      // Clear any connection timeout
      if (connectionTimeoutTimer) {
        clearTimeout(connectionTimeoutTimer);
      }
      endCall();
    });

    return () => {
      // Clear any connection timeout
      if (connectionTimeoutTimer) {
        clearTimeout(connectionTimeoutTimer);
      }

      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice-candidate");
      socket.off("call:ended");
      socket.off("call:error");
    };
  }, [
    socket,
    callStatus,
    remoteUser,
    createPeerConnection,
    endCall,
    localStream,
  ]);

  const startCall = async (user, type) => {
    try {
      console.log(`Starting ${type} call with user:`, user);
      console.log("Browser user agent:", navigator.userAgent);

      // For Chrome, we'll bypass the secure context check
      const isChrome =
        /Chrome/.test(navigator.userAgent) &&
        /Google Inc/.test(navigator.vendor);

      if (!isChrome) {
        // Check if we're in a secure context (skip for Chrome)
        const secure = isSecureContext();
        if (!secure) {
          throw new Error(
            "WebRTC requires a secure context (HTTPS or localhost). Please use HTTPS."
          );
        }
      }

      // ALWAYS force WebRTC support for Chrome
      if (isChrome) {
        console.log("Chrome detected, FORCING WebRTC support to true");
        setWebRTCSupported(true);

        // Set global flag
        if (typeof window !== "undefined") {
          window.forceWebRTCSupported = true;
        }
      }

      // ALWAYS set WebRTC support to true for modern browsers
      const isModernBrowser = /Chrome|Firefox|Safari|Edge/.test(
        navigator.userAgent
      );
      if (isModernBrowser) {
        console.log("Modern browser detected, forcing WebRTC support to true");
        setWebRTCSupported(true);
      }

      // Skip this check for Chrome
      if (!isChrome && !webRTCSupported) {
        throw new Error(
          "WebRTC is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari."
        );
      }

      // Ensure WebRTC compatibility is set up
      ensureWebRTCCompatibility();

      // Explicitly check and request permissions first
      try {
        console.log("Explicitly checking permissions before starting call");
        await checkAndRequestPermissions(true, type === "video");
        console.log("Permissions granted or prompted");
      } catch (permError) {
        console.error("Permission check failed:", permError);
        throw new Error(
          "Microphone/camera access is required for calls. Please allow access in your browser settings."
        );
      }

      // Define constraints with specific settings for better compatibility
      const constraints = {
        audio: true, // Simplified audio constraints
        video: type === "video", // Simplified video constraints
      };

      console.log("Requesting media with constraints:", constraints);

      try {
        // Try with direct navigator.mediaDevices.getUserMedia first for Chrome
        if (
          isChrome &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          console.log(
            "Using direct navigator.mediaDevices.getUserMedia for Chrome"
          );
          try {
            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            );
            console.log(
              "Media stream obtained directly:",
              stream.getTracks().map((t) => t.kind)
            );

            setLocalStream(stream);
            setCallType(type);
            setRemoteUser(user);
            setCallStatus("calling");

            socket.emit("call:start", {
              to: user._id,
              type,
            });
            return;
          } catch (directError) {
            console.error("Direct getUserMedia failed:", directError);
            // Continue to other methods
          }
        }

        // Try with our enhanced getUserMedia function
        const stream = await getUserMedia(constraints);
        console.log(
          "Media stream obtained:",
          stream.getTracks().map((t) => t.kind)
        );

        setLocalStream(stream);
        setCallType(type);
        setRemoteUser(user);
        setCallStatus("calling");

        socket.emit("call:start", {
          to: user._id,
          type,
        });
      } catch (mediaError) {
        console.error("Error accessing media devices:", mediaError);

        // If it's a video call and we failed, try falling back to audio-only
        if (type === "video") {
          console.log("Falling back to audio-only call");
          try {
            const audioOnlyStream = await getUserMedia({
              audio: true,
              video: false,
            });

            setLocalStream(audioOnlyStream);
            setCallType("audio"); // Change call type to audio
            setRemoteUser(user);
            setCallStatus("calling");

            socket.emit("call:start", {
              to: user._id,
              type: "audio", // Specify audio-only call
            });
          } catch (audioError) {
            console.error("Even audio-only call failed:", audioError);

            // Last resort: try with minimal constraints
            try {
              console.log(
                "Trying with minimal audio constraints as last resort"
              );
              const minimalStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                },
                video: false,
              });

              setLocalStream(minimalStream);
              setCallType("audio");
              setRemoteUser(user);
              setCallStatus("calling");

              socket.emit("call:start", {
                to: user._id,
                type: "audio",
              });
            } catch (minimalError) {
              console.error("All media access attempts failed:", minimalError);
              throw new Error(
                "Could not access microphone. Please check your device settings and permissions."
              );
            }
          }
        } else {
          // For audio calls, try with minimal constraints as a last resort
          try {
            console.log("Audio call failed, trying with minimal constraints");
            const minimalStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
              video: false,
            });

            setLocalStream(minimalStream);
            setCallType("audio");
            setRemoteUser(user);
            setCallStatus("calling");

            socket.emit("call:start", {
              to: user._id,
              type: "audio",
            });
          } catch (minimalError) {
            console.error("All media access attempts failed:", minimalError);
            throw new Error(
              "Could not access microphone. Please check your device settings and permissions."
            );
          }
        }
      }
    } catch (error) {
      console.error("Error starting call:", error);
      alert(
        `Failed to start call: ${
          error.message || "Could not access camera/microphone"
        }`
      );
      resetCallState();
    }
  };

  const acceptCall = async () => {
    try {
      console.log(`Accepting ${callType} call from:`, remoteUser);
      console.log("Browser user agent:", navigator.userAgent);

      // For Chrome, we'll bypass the secure context check
      const isChrome =
        /Chrome/.test(navigator.userAgent) &&
        /Google Inc/.test(navigator.vendor);

      if (!isChrome) {
        // Check if we're in a secure context (skip for Chrome)
        const secure = isSecureContext();
        if (!secure) {
          throw new Error(
            "WebRTC requires a secure context (HTTPS or localhost). Please use HTTPS."
          );
        }
      }

      // ALWAYS force WebRTC support for Chrome
      if (isChrome) {
        console.log("Chrome detected, FORCING WebRTC support to true");
        setWebRTCSupported(true);

        // Set global flag
        if (typeof window !== "undefined") {
          window.forceWebRTCSupported = true;
        }
      }

      // ALWAYS set WebRTC support to true for modern browsers
      const isModernBrowser = /Chrome|Firefox|Safari|Edge/.test(
        navigator.userAgent
      );
      if (isModernBrowser) {
        console.log("Modern browser detected, forcing WebRTC support to true");
        setWebRTCSupported(true);
      }

      // Skip this check for Chrome
      if (!isChrome && !webRTCSupported) {
        throw new Error(
          "WebRTC is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari."
        );
      }

      // Ensure WebRTC compatibility is set up
      ensureWebRTCCompatibility();

      // Explicitly check and request permissions first
      try {
        console.log("Explicitly checking permissions before accepting call");
        await checkAndRequestPermissions(true, callType === "video");
        console.log("Permissions granted or prompted");
      } catch (permError) {
        console.error("Permission check failed:", permError);
        throw new Error(
          "Microphone/camera access is required for calls. Please allow access in your browser settings."
        );
      }

      // Define constraints with specific settings for better compatibility
      const constraints = {
        audio: true, // Simplified audio constraints
        video: callType === "video", // Simplified video constraints
      };

      console.log("Requesting media with constraints:", constraints);

      try {
        // Try with direct navigator.mediaDevices.getUserMedia first for Chrome
        if (
          isChrome &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          console.log(
            "Using direct navigator.mediaDevices.getUserMedia for Chrome"
          );
          try {
            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            );
            console.log(
              "Media stream obtained directly:",
              stream.getTracks().map((t) => t.kind)
            );

            setLocalStream(stream);

            socket.emit("call:accept", {
              to: remoteUser._id,
            });
            return;
          } catch (directError) {
            console.error("Direct getUserMedia failed:", directError);
            // Continue to other methods
          }
        }

        // Try with our enhanced getUserMedia function
        const stream = await getUserMedia(constraints);
        console.log(
          "Media stream obtained:",
          stream.getTracks().map((t) => t.kind)
        );

        setLocalStream(stream);

        socket.emit("call:accept", {
          to: remoteUser._id,
        });
      } catch (mediaError) {
        console.error("Error accessing media devices:", mediaError);

        // If it's a video call and we failed, try falling back to audio-only
        if (callType === "video") {
          console.log("Falling back to audio-only for accepting call");
          try {
            const audioOnlyStream = await getUserMedia({
              audio: true,
              video: false,
            });

            setLocalStream(audioOnlyStream);
            setCallType("audio"); // Change call type to audio

            socket.emit("call:accept", {
              to: remoteUser._id,
              audioOnly: true, // Indicate we're accepting as audio-only
            });
          } catch (audioError) {
            console.error("Even audio-only call failed:", audioError);

            // Last resort: try with minimal constraints
            try {
              console.log(
                "Trying with minimal audio constraints as last resort"
              );
              const minimalStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                },
                video: false,
              });

              setLocalStream(minimalStream);
              setCallType("audio");

              socket.emit("call:accept", {
                to: remoteUser._id,
                audioOnly: true,
              });
            } catch (minimalError) {
              console.error("All media access attempts failed:", minimalError);
              throw new Error(
                "Could not access microphone. Please check your device settings and permissions."
              );
            }
          }
        } else {
          // For audio calls, try with minimal constraints as a last resort
          try {
            console.log("Audio call failed, trying with minimal constraints");
            const minimalStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
              video: false,
            });

            setLocalStream(minimalStream);

            socket.emit("call:accept", {
              to: remoteUser._id,
            });
          } catch (minimalError) {
            console.error("All media access attempts failed:", minimalError);
            throw new Error(
              "Could not access microphone. Please check your device settings and permissions."
            );
          }
        }
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      alert(
        `Failed to accept call: ${
          error.message || "Could not access camera/microphone"
        }`
      );
      resetCallState();
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
    webRTCSupported,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
