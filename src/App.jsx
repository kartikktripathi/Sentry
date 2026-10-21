import { useState } from "react";
import "./App.css";

export default function App() {
  const [screenGranted, setScreenGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  const allGranted = screenGranted && cameraGranted;

  return (
    <div className="permission-container">
      {/* Header */}
      <div className="permission-header">
        <span className="brand-label">SENTRY</span>
        <div className="title-wrap">
          <h1 className="permission-title">Permissions Required</h1>
          <p className="permission-subtitle">
            Grant the following permissions to begin your assessment session.
          </p>
        </div>
      </div>

      {/* Permission List: Screen and Camera */}
      <div className="permission-list">
        {/* Screen Permission */}
        <div className={`permission-item ${screenGranted ? "granted" : ""}`}>
          <div className="permission-text">
            <span className="permission-name">Screen access</span>
            <span className="permission-desc">
              Permission to access and record your display
            </span>
          </div>

          <button
            type="button"
            className={`btn-toggle ${screenGranted ? "allowed" : "pending"}`}
            onClick={() => setScreenGranted((prev) => !prev)}
          >
            {screenGranted ? "Allowed" : "Allow"}
          </button>
        </div>

        {/* Camera Permission */}
        <div className={`permission-item ${cameraGranted ? "granted" : ""}`}>
          <div className="permission-text">
            <span className="permission-name">Camera access</span>
            <span className="permission-desc">
              Permission to access your webcam
            </span>
          </div>

          <button
            type="button"
            className={`btn-toggle ${cameraGranted ? "allowed" : "pending"}`}
            onClick={() => setCameraGranted((prev) => !prev)}
          >
            {cameraGranted ? "Allowed" : "Allow"}
          </button>
        </div>
      </div>

      {/* Footer / Continue */}
      <div className="permission-footer">
        <button
          type="button"
          className={`btn-continue ${allGranted ? "active" : "disabled"}`}
          disabled={!allGranted}
        >
          Continue
        </button>
        <p className="footer-note">
          Permissions are only active during your exam session.
        </p>
      </div>
    </div>
  );
}
