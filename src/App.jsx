import { useState } from "react";
import "./App.css";

export default function App() {
  const [screenGranted, setScreenGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const allGranted = screenGranted && cameraGranted;

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
                onClick={() => setScreenGranted((prev) => !prev)}
              >
                {screenGranted ? "Allowed" : "Allow"}
              </button>
            </div>

            {/* Black screen placeholder next to screen permission */}
            {screenGranted && <div className="dev-feed-screen"></div>}
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
