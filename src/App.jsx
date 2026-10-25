import { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const [screenGranted, setScreenGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const screenStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const allGranted = screenGranted && cameraGranted;

  function setFullscreen() {
    if (window.electronAPI?.setFullscreen) {
      window.electronAPI.setFullscreen();
    }
  }

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraGranted(false);
  };

  // Helper to completely reset permissions and stop streams
  const resetPermissions = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenGranted(false);
  };

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onExitFullscreen?.(() => {
      resetPermissions();
    });
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        resetPermissions();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleToggleCamera = async () => {
    if (cameraGranted) {
      stopCameraStream();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (stream) {
        cameraStreamRef.current = stream;
        setCameraGranted(true);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopCameraStream();
          };
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      stopCameraStream();
    }
  };

  const handleToggleScreen = async () => {
    if (screenGranted) {
      resetPermissions();
      return;
    }

    try {
      setFullscreen();

      let stream = null;

      if (window.electronAPI?.getScreenSources) {
        try {
          const sources = await window.electronAPI.getScreenSources();
          const primarySource = sources[0];
          if (primarySource) {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: primarySource.id,
                  minWidth: 1280,
                  maxWidth: 1920,
                  minHeight: 720,
                  maxHeight: 1080,
                },
              },
            });
          }
        } catch (ipcErr) {
          console.warn("Electron desktopCapturer stream failed, attempting getDisplayMedia fallback:", ipcErr);
        }
      }

      if (!stream && navigator.mediaDevices?.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" },
          audio: false,
        });
      }

      if (stream) {
        screenStreamRef.current = stream;
        setScreenGranted(true);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            resetPermissions();
          };
        }
      } else {
        setScreenGranted(false);
      }
    } catch (err) {
      console.error("Screen access error:", err);
      resetPermissions();
    }
  };

  return (
    <div className="dev-container">
      {/* Title Bar */}
      <div className="dev-titlebar">
        <span className="dev-titlebar-tag">SENTRY</span>
        <span className={`dev-titlebar-status ${allGranted ? "ready" : ""}`}>
          {allGranted ? "Ready" : "Permissions"}
        </span>
      </div>

      {/* Main Content */}
      <div className="dev-body">
        <div className="dev-header">
          <h1 className="dev-title">Permissions Required</h1>
          <p className="dev-subtitle">
            Please allow the following permissions to begin your assessment
            session.
          </p>
        </div>

        <div className="dev-permission-list">
          {/* Permission 1: Screen */}
          <div className="dev-permission-row">
            <div
              className={`dev-permission-box ${screenGranted ? "granted" : ""}`}
            >
              <div className="dev-permission-meta">
                <span className="dev-name">Screen access</span>
                <span className="dev-desc">
                  Permission to access and record your display and turn full-screen mode on
                </span>
              </div>

              <button
                type="button"
                className={`dev-btn ${screenGranted ? "btn-granted" : "btn-pending"}`}
                onClick={handleToggleScreen}
              >
                {screenGranted ? "Allowed" : "Allow"}
              </button>
            </div>

            {/* Black screen displaying screen feed next to screen permission */}
            {screenGranted && (
              <div className="dev-feed-screen">
                <video
                  ref={(node) => {
                    if (node && screenStreamRef.current && node.srcObject !== screenStreamRef.current) {
                      node.srcObject = screenStreamRef.current;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="dev-feed-video"
                />
              </div>
            )}
          </div>

          {/* Permission 2: Camera */}
          <div className="dev-permission-row">
            <div
              className={`dev-permission-box ${cameraGranted ? "granted" : ""}`}
            >
              <div className="dev-permission-meta">
                <span className="dev-name">Camera access</span>
                <span className="dev-desc">
                  Permission to access your webcam
                </span>
              </div>

              <button
                type="button"
                className={`dev-btn ${cameraGranted ? "btn-granted" : "btn-pending"}`}
                onClick={handleToggleCamera}
              >
                {cameraGranted ? "Allowed" : "Allow"}
              </button>
            </div>

            {/* Black screen displaying camera feed next to camera permission */}
            {cameraGranted && (
              <div className="dev-feed-screen">
                <video
                  ref={(node) => {
                    if (node && cameraStreamRef.current && node.srcObject !== cameraStreamRef.current) {
                      node.srcObject = cameraStreamRef.current;
                      node.play?.().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="dev-feed-video dev-camera-video"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer / Continue */}
        <div className="dev-footer">
          <button
            type="button"
            className={`dev-continue-btn ${allGranted ? "active" : "disabled"}`}
            disabled={!allGranted}
          >
            Continue
          </button>
          <div className="dev-note">
            Permissions are only active during your exam session.
          </div>
        </div>
      </div>
    </div>
  );
}
