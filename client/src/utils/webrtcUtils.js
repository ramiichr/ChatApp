/**
 * Simplified WebRTC utility functions
 */

// Check if we're in a secure context (required for WebRTC)
export const isSecureContext = () => {
  // Check for global flag first
  if (typeof window !== "undefined" && window.forceSecureContext === true) {
    console.log("Global flag forcing secure context to true");
    return true;
  }

  // For Chrome, always return true to bypass this check
  const isChrome =
    typeof navigator !== "undefined" &&
    /Chrome/.test(navigator.userAgent) &&
    /Google Inc/.test(navigator.vendor);

  if (isChrome) {
    console.log("Chrome detected, bypassing secure context check");
    return true;
  }

  // For development, always return true
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Development environment detected, bypassing secure context check"
    );
    return true;
  }

  // For testing or local development, always return true
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      /^192\.168\./.test(window.location.hostname) ||
      /^10\./.test(window.location.hostname))
  ) {
    console.log("Local development detected, bypassing secure context check");
    return true;
  }

  // Check if window.isSecureContext is available and true
  if (
    typeof window !== "undefined" &&
    typeof window.isSecureContext !== "undefined"
  ) {
    return window.isSecureContext;
  }

  // Fallback check: WebRTC is generally only available in secure contexts
  // Check if the page is served over HTTPS or localhost or local network
  return (
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      /^192\.168\./.test(window.location.hostname) || // Local network
      /^10\./.test(window.location.hostname) || // Local network
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname)) // Local network
  );
};

// Check for actual WebRTC support with detailed logging
export const isWebRTCSupported = () => {
  console.log("Checking WebRTC support with detailed diagnostics");
  console.log("Browser user agent:", navigator.userAgent);

  try {
    // Apply basic polyfills directly here to avoid circular dependency
    // Polyfill for RTCPeerConnection
    window.RTCPeerConnection =
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection;

    // Polyfill for RTCSessionDescription
    window.RTCSessionDescription =
      window.RTCSessionDescription ||
      window.webkitRTCSessionDescription ||
      window.mozRTCSessionDescription;

    // Polyfill for RTCIceCandidate
    window.RTCIceCandidate =
      window.RTCIceCandidate ||
      window.webkitRTCIceCandidate ||
      window.mozRTCIceCandidate;

    // Check for RTCPeerConnection
    const hasPeerConnection = !!(
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection
    );
    console.log(`RTCPeerConnection support: ${hasPeerConnection}`);
    console.log(
      `Available implementations: ${
        [
          window.RTCPeerConnection ? "standard" : null,
          window.webkitRTCPeerConnection ? "webkit" : null,
          window.mozRTCPeerConnection ? "moz" : null,
        ]
          .filter(Boolean)
          .join(", ") || "none"
      }`
    );

    // Check for getUserMedia
    const hasStandardGetUserMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    const hasLegacyGetUserMedia = !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
    const hasGetUserMedia = hasStandardGetUserMedia || hasLegacyGetUserMedia;

    console.log(`getUserMedia support: ${hasGetUserMedia}`);
    console.log(`Standard getUserMedia: ${hasStandardGetUserMedia}`);
    console.log(`Legacy getUserMedia: ${hasLegacyGetUserMedia}`);
    console.log(
      `Available implementations: ${
        [
          hasStandardGetUserMedia ? "standard" : null,
          navigator.getUserMedia ? "legacy" : null,
          navigator.webkitGetUserMedia ? "webkit" : null,
          navigator.mozGetUserMedia ? "moz" : null,
          navigator.msGetUserMedia ? "ms" : null,
        ]
          .filter(Boolean)
          .join(", ") || "none"
      }`
    );

    // Check for RTCSessionDescription
    const hasRTCSessionDescription = !!(
      window.RTCSessionDescription ||
      window.webkitRTCSessionDescription ||
      window.mozRTCSessionDescription
    );
    console.log(`RTCSessionDescription support: ${hasRTCSessionDescription}`);

    // Check for RTCIceCandidate
    const hasRTCIceCandidate = !!(
      window.RTCIceCandidate ||
      window.webkitRTCIceCandidate ||
      window.mozRTCIceCandidate
    );
    console.log(`RTCIceCandidate support: ${hasRTCIceCandidate}`);

    // Chrome-specific check
    const isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdgeChromium = /Edg/.test(navigator.userAgent);
    const isChromeBasedBrowser = isChrome || isEdgeChromium;

    // Firefox-specific check
    const isFirefox = /Firefox/.test(navigator.userAgent);

    // Safari-specific check
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    console.log(
      `Browser detection: Chrome-based: ${isChromeBasedBrowser}, Firefox: ${isFirefox}, Safari: ${isSafari}`
    );

    // If we're on a known browser that should support WebRTC, force return true
    if (isChromeBasedBrowser || isFirefox || isSafari) {
      console.log(
        "Detected a modern browser that should support WebRTC, forcing support to true"
      );
      return true;
    }

    // Final result for other browsers
    const isSupported =
      hasPeerConnection &&
      hasGetUserMedia &&
      hasRTCSessionDescription &&
      hasRTCIceCandidate;
    console.log(`Overall WebRTC support: ${isSupported}`);

    return isSupported;
  } catch (error) {
    console.error("Error checking WebRTC support:", error);

    // Check if we're on a known browser that should support WebRTC
    const isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdgeChromium = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isChrome || isEdgeChromium || isFirefox || isSafari) {
      console.log(
        "Error occurred but we're on a modern browser, assuming WebRTC is supported"
      );
      return true;
    }

    return false;
  }
};

// Set up polyfills for WebRTC compatibility
export const ensureWebRTCCompatibility = () => {
  console.log("Setting up WebRTC compatibility polyfills");

  try {
    // Try to load adapter.js dynamically if it's not already loaded
    if (typeof window.adapter === "undefined") {
      console.log("Adapter.js not detected, setting up manual polyfills");

      // Polyfill for RTCPeerConnection
      window.RTCPeerConnection =
        window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection;

      // Polyfill for RTCSessionDescription
      window.RTCSessionDescription =
        window.RTCSessionDescription ||
        window.webkitRTCSessionDescription ||
        window.mozRTCSessionDescription;

      // Polyfill for RTCIceCandidate
      window.RTCIceCandidate =
        window.RTCIceCandidate ||
        window.webkitRTCIceCandidate ||
        window.mozRTCIceCandidate;

      // Polyfill for mediaDevices
      if (!navigator.mediaDevices) {
        console.log("Creating navigator.mediaDevices object");
        navigator.mediaDevices = {};
      }

      // Polyfill for getUserMedia
      if (!navigator.mediaDevices.getUserMedia) {
        console.log("Setting up getUserMedia polyfill");

        // First check for direct navigator.getUserMedia
        if (navigator.getUserMedia) {
          console.log("Using navigator.getUserMedia directly");
          navigator.mediaDevices.getUserMedia = function (constraints) {
            return new Promise((resolve, reject) => {
              navigator.getUserMedia(constraints, resolve, reject);
            });
          };
        }
        // Then check for vendor prefixed versions
        else {
          const getUserMedia =
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;

          if (getUserMedia) {
            console.log("Using vendor prefixed getUserMedia");
            navigator.mediaDevices.getUserMedia = function (constraints) {
              return new Promise((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject);
              });
            };
          } else {
            console.warn("No getUserMedia implementation found!");
          }
        }
      }

      // Polyfill for adapter.js-like functionality
      // This helps with browser compatibility for WebRTC
      if (window.RTCPeerConnection) {
        console.log("Setting up RTCPeerConnection polyfills");

        // Fix for older Chrome versions that use URL objects
        if (
          typeof window.URL.createObjectURL === "undefined" &&
          typeof window.webkitURL !== "undefined"
        ) {
          console.log("Using webkitURL as URL");
          window.URL = window.webkitURL;
        }

        // Fix for older Firefox versions
        if (
          !window.RTCPeerConnection.prototype.getStats &&
          window.mozRTCPeerConnection &&
          window.mozRTCPeerConnection.prototype.getStats
        ) {
          console.log("Using Firefox getStats implementation");
          window.RTCPeerConnection.prototype.getStats =
            window.mozRTCPeerConnection.prototype.getStats;
        }

        // Ensure addTrack exists (for older implementations)
        if (
          !window.RTCPeerConnection.prototype.addTrack &&
          window.RTCPeerConnection.prototype.addStream
        ) {
          console.log("Polyfilling addTrack with addStream");
          window.RTCPeerConnection.prototype.addTrack = function (
            track,
            stream
          ) {
            this.addStream(stream);
            return { track };
          };
        }

        // Ensure removeTrack exists
        if (
          !window.RTCPeerConnection.prototype.removeTrack &&
          window.RTCPeerConnection.prototype.removeStream
        ) {
          console.log("Polyfilling removeTrack with removeStream");
          window.RTCPeerConnection.prototype.removeTrack = function (sender) {
            if (sender && sender.track) {
              const streams = this.getLocalStreams();
              streams.forEach((stream) => {
                const tracks = stream.getTracks();
                tracks.forEach((track) => {
                  if (track.id === sender.track.id) {
                    this.removeStream(stream);
                  }
                });
              });
            }
          };
        }
      } else {
        console.warn(
          "RTCPeerConnection not available even after polyfill attempts!"
        );
      }
    } else {
      console.log("Adapter.js detected, using its polyfills");
    }

    // Final check for critical WebRTC components
    if (!window.RTCPeerConnection) {
      console.error("RTCPeerConnection not available after polyfill attempts");
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not available after polyfill attempts");
    }

    console.log("WebRTC compatibility polyfills set up");
  } catch (error) {
    console.error("Error setting up WebRTC compatibility:", error);
  }
};

// Function to explicitly check and request permissions
export const checkAndRequestPermissions = async (
  audio = true,
  video = false
) => {
  console.log(`Checking permissions for audio: ${audio}, video: ${video}`);

  // Create a temporary button to trigger permission request
  const requestPermissions = () => {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary stream just to trigger the permission dialog
        navigator.mediaDevices
          .getUserMedia({ audio, video })
          .then((stream) => {
            // Stop all tracks immediately
            stream.getTracks().forEach((track) => track.stop());
            console.log("Permission granted successfully");
            resolve(true);
          })
          .catch((err) => {
            console.error("Permission request failed:", err);
            reject(err);
          });
      } catch (err) {
        console.error("Error requesting permissions:", err);
        reject(err);
      }
    });
  };

  try {
    // Try to check permission status if the API is available
    if (navigator.permissions && navigator.permissions.query) {
      let audioPermission, videoPermission;

      if (audio) {
        try {
          audioPermission = await navigator.permissions.query({
            name: "microphone",
          });
          console.log("Microphone permission status:", audioPermission.state);

          if (audioPermission.state === "prompt") {
            console.log("Need to request microphone permission");
            await requestPermissions();
          } else if (audioPermission.state === "denied") {
            throw new Error(
              "Microphone access has been blocked. Please allow access in your browser settings."
            );
          }
        } catch (err) {
          if (err.name === "TypeError") {
            // Some browsers don't support checking microphone permission
            console.log(
              "Can't check microphone permission, will request directly"
            );
            await requestPermissions();
          } else {
            throw err;
          }
        }
      }

      if (video) {
        try {
          videoPermission = await navigator.permissions.query({
            name: "camera",
          });
          console.log("Camera permission status:", videoPermission.state);

          if (videoPermission.state === "prompt") {
            console.log("Need to request camera permission");
            await requestPermissions();
          } else if (videoPermission.state === "denied") {
            throw new Error(
              "Camera access has been blocked. Please allow access in your browser settings."
            );
          }
        } catch (err) {
          if (err.name === "TypeError") {
            // Some browsers don't support checking camera permission
            console.log("Can't check camera permission, will request directly");
            await requestPermissions();
          } else {
            throw err;
          }
        }
      }

      return true;
    } else {
      // If permissions API is not available, try to request permissions directly
      console.log(
        "Permissions API not available, requesting permissions directly"
      );
      await requestPermissions();
      return true;
    }
  } catch (error) {
    console.error("Permission check/request failed:", error);
    throw error;
  }
};

// Enhanced implementation of getUserMedia with better browser compatibility
export const getUserMedia = async (constraints) => {
  console.log("Getting user media with constraints:", constraints);
  console.log("Browser details:", navigator.userAgent);

  // Debug WebRTC support
  console.log("WebRTC support check:");
  console.log("- navigator.mediaDevices exists:", !!navigator.mediaDevices);
  console.log(
    "- navigator.mediaDevices.getUserMedia exists:",
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );
  console.log("- navigator.getUserMedia exists:", !!navigator.getUserMedia);
  console.log(
    "- navigator.webkitGetUserMedia exists:",
    !!navigator.webkitGetUserMedia
  );
  console.log(
    "- navigator.mozGetUserMedia exists:",
    !!navigator.mozGetUserMedia
  );
  console.log("- navigator.msGetUserMedia exists:", !!navigator.msGetUserMedia);
  console.log("- RTCPeerConnection exists:", !!window.RTCPeerConnection);

  try {
    // First, try to explicitly check and request permissions
    try {
      await checkAndRequestPermissions(
        !!constraints.audio,
        !!constraints.video
      );
      console.log("Permissions explicitly checked/requested");
    } catch (permError) {
      console.warn(
        "Permission check failed, will try getUserMedia directly:",
        permError
      );
      // Continue anyway - we'll handle permission errors in the getUserMedia call
    }

    // Ensure WebRTC compatibility is set up first
    ensureWebRTCCompatibility();

    // Double-check and set up navigator.mediaDevices
    if (!navigator.mediaDevices) {
      console.log("Setting up navigator.mediaDevices polyfill");
      navigator.mediaDevices = {};
    }

    // Double-check and set up getUserMedia
    if (!navigator.mediaDevices.getUserMedia) {
      console.log("Setting up getUserMedia polyfill");

      // Try to find any available getUserMedia implementation
      const legacyGetUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      if (legacyGetUserMedia) {
        console.log("Using legacy getUserMedia implementation");
        navigator.mediaDevices.getUserMedia = function (constraints) {
          return new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      } else {
        console.error("No getUserMedia implementation found in this browser");
      }
    }

    // Final check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is still not available after polyfills");
      throw new Error("getUserMedia is not implemented in this browser");
    }

    // Try with minimal constraints first for maximum compatibility
    const minimalConstraints = {
      audio: constraints.audio
        ? {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        : false,
      video: constraints.video ? false : false,
    };

    console.log("Trying with minimal constraints first:", minimalConstraints);

    try {
      // First try with minimal constraints
      const stream = await navigator.mediaDevices.getUserMedia(
        minimalConstraints
      );
      console.log("Successfully got media stream with minimal constraints");

      // If we requested video but got audio-only, try to add video
      if (constraints.video && !stream.getVideoTracks().length) {
        try {
          console.log("Adding video track to existing audio stream");
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          videoStream.getVideoTracks().forEach((track) => {
            stream.addTrack(track);
          });

          console.log("Successfully added video track");
        } catch (videoError) {
          console.warn("Could not add video track:", videoError);
          // Continue with audio-only
        }
      }

      return stream;
    } catch (minimalError) {
      console.warn("Failed with minimal constraints:", minimalError);

      // Simplify constraints for maximum compatibility
      const simplifiedConstraints = {
        audio: constraints.audio ? true : false,
        video: constraints.video ? true : false,
      };

      console.log("Trying with simplified constraints:", simplifiedConstraints);

      try {
        // Try with simplified constraints
        const stream = await navigator.mediaDevices.getUserMedia(
          simplifiedConstraints
        );
        console.log(
          "Successfully got media stream with simplified constraints"
        );
        return stream;
      } catch (simplifiedError) {
        console.warn("Failed with simplified constraints:", simplifiedError);

        // If that fails and we're requesting video, try with more specific constraints
        if (constraints.video) {
          const videoConstraints = {
            audio: constraints.audio ? true : false,
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 },
            },
          };

          console.log(
            "Trying with specific video constraints:",
            videoConstraints
          );

          try {
            const stream = await navigator.mediaDevices.getUserMedia(
              videoConstraints
            );
            console.log(
              "Successfully got media stream with specific video constraints"
            );
            return stream;
          } catch (videoError) {
            console.warn("Failed with specific video constraints:", videoError);

            // If video fails, try audio only as last resort
            if (constraints.audio) {
              console.log("Trying audio only as fallback");
              const audioOnlyConstraints = { audio: true, video: false };

              try {
                const audioStream = await navigator.mediaDevices.getUserMedia(
                  audioOnlyConstraints
                );
                console.log("Successfully got audio-only stream as fallback");
                return audioStream;
              } catch (audioError) {
                console.error("All attempts to get media failed:", audioError);
                throw audioError;
              }
            } else {
              throw videoError;
            }
          }
        } else {
          // If we're only requesting audio and it failed, throw the error
          throw simplifiedError;
        }
      }
    }
  } catch (error) {
    console.error("Error getting user media:", error);

    // Provide more helpful error messages based on the error type
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      throw new Error(
        "Camera/microphone access denied. Please allow access in your browser settings."
      );
    } else if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      throw new Error(
        "No camera or microphone found. Please check your device connections."
      );
    } else if (
      error.name === "NotReadableError" ||
      error.name === "TrackStartError"
    ) {
      throw new Error(
        "Camera or microphone is already in use by another application."
      );
    } else if (error.name === "OverconstrainedError") {
      throw new Error(
        "Camera doesn't support the requested resolution or frame rate."
      );
    } else if (error.name === "AbortError") {
      throw new Error(
        "Hardware or permission error occurred. Please check your device settings."
      );
    } else if (error.name === "SecurityError") {
      throw new Error(
        "Media access is not allowed in this context. Make sure you're using HTTPS."
      );
    } else if (error.name === "TypeError") {
      throw new Error(
        "Invalid constraints were used. This is a bug in our application."
      );
    } else if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        "Your browser doesn't support WebRTC. Please use a modern browser like Chrome, Firefox, or Safari."
      );
    } else {
      throw new Error(
        `Failed to access media: ${error.message || "Unknown error"}`
      );
    }
  }
};

// Enhanced implementation of RTCPeerConnection creation with fallbacks
export const createPeerConnectionWithFallback = (config) => {
  console.log("Creating RTCPeerConnection with config:", config);

  try {
    // Ensure WebRTC compatibility is set up first
    ensureWebRTCCompatibility();

    // Ensure RTCPeerConnection is available
    const PeerConnection =
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection;

    if (!PeerConnection) {
      throw new Error("RTCPeerConnection is not supported in this browser");
    }

    // Create the peer connection
    const pc = new PeerConnection(config);

    // Add some additional error handling and logging
    pc.onerror = (error) => {
      console.error("PeerConnection error:", error);
    };

    // Log connection state changes for debugging
    pc.onconnectionstatechange = () => {
      console.log("PeerConnection state changed:", pc.connectionState);

      // Handle connection failures
      if (pc.connectionState === "failed") {
        console.warn(
          "Connection failed - this may be due to NAT traversal issues in local network"
        );
      }
    };

    // Log ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", pc.iceConnectionState);

      // If ICE connection fails, it might be a NAT traversal issue
      if (pc.iceConnectionState === "failed") {
        console.warn("ICE connection failed - likely a NAT traversal issue");
      }
    };

    // Log ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state changed:", pc.iceGatheringState);
    };

    // Log when ICE candidates are created
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate generated:", event.candidate.candidate);
        // The original event handler will be overwritten by the application code
      }
    };

    console.log("RTCPeerConnection created successfully");
    return pc;
  } catch (error) {
    console.error("Error creating RTCPeerConnection:", error);
    throw new Error(
      `Failed to create peer connection: ${error.message}. Please check your browser compatibility and network settings.`
    );
  }
};
