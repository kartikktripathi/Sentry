import { useState, useRef, useEffect } from "react";
import "./App.css";

export default function App() {
  const [screenGranted, setScreenGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const screenStreamRef = useRef(null);

  const allGranted = screenGranted && cameraGranted;

  function setFullscreen() {
    if (window.electronAPI?.setFullscreen) {
      window.electronAPI.setFullscreen();
    }
  }

  // Cleanup screen capture track on unmount
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleToggleScreen = async () => {
    if (screenGranted) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setScreenGranted(false);
      return;
    }

    try {
      setFullscreen();

      let stream = null;

      // In Electron: fetch desktop source and capture with getUserMedia
      if (window.electronAPI?.getScreenSources) {
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
      }

      // Fallback for standard browser
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
            if (screenStreamRef.current) {
              screenStreamRef.current.getTracks().forEach((track) => track.stop());
              screenStreamRef.current = null;
            }
            setScreenGranted(false);
          };
        }
      }
    } catch (err) {
      console.error("Screen access error:", err);
      setScreenGranted(false);
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
                onClick={() => setCameraGranted((prev) => !prev)}
              >
                {cameraGranted ? "Allowed" : "Allow"}
              </button>
            </div>

            {/* Black screen placeholder next to camera permission */}
            {cameraGranted && <div className="dev-feed-screen"></div>}
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
