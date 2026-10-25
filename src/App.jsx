import { useState, useRef, useEffect } from "react";
import "./App.css";
import MATH_QUESTIONS from "./test.json";

export default function App() {
  // Permission states
  const [screenGranted, setScreenGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);

  // App view: "permissions" | "exam" | "summary"
  const [currentView, setCurrentView] = useState("permissions");

  // Exam states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [examEndedEarly, setExamEndedEarly] = useState(false);

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

  // Exam handler actions
  const startExam = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowEndConfirm(false);
    setExamEndedEarly(false);
    setCurrentView("exam");
  };

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleEndExam = (early = false) => {
    setExamEndedEarly(early);
    setShowEndConfirm(false);
    setCurrentView("summary");
  };

  const retakeExam = () => {
    startExam();
  };

  const currentQuestion = MATH_QUESTIONS[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const isLastQuestion = currentQuestionIndex === MATH_QUESTIONS.length - 1;

  // Calculate score for summary
  const correctCount = MATH_QUESTIONS.reduce((count, q) => {
    return selectedAnswers[q.id] === q.correctAnswer ? count + 1 : count;
  }, 0);
  const scorePercent = Math.round((correctCount / MATH_QUESTIONS.length) * 100);

  return (
    <div className="dev-container">
      {/* VIEW 1: PERMISSIONS SCREEN */}
      {currentView === "permissions" && (
        <>
          {/* Title Bar */}
          <div className="dev-titlebar">
            <span className="dev-titlebar-tag">SENTRY</span>
            <span className={`dev-titlebar-status ${allGranted ? "ready" : ""}`}>
              {allGranted ? "Ready" : "Permissions"}
            </span>
          </div>

          {/* Main Body */}
          <div className="dev-body">
            <div className="dev-header">
              <h1 className="dev-title">Permissions Required</h1>
              <p className="dev-subtitle">
                Please allow the following permissions to begin your assessment session.
              </p>
            </div>

            <div className="dev-permission-list">
              {/* Permission 1: Screen */}
              <div className="dev-permission-row">
                <div className={`dev-permission-box ${screenGranted ? "granted" : ""}`}>
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

                {screenGranted && (
                  <div className="dev-feed-screen">
                    <video
                      ref={(node) => {
                        if (node && screenStreamRef.current && node.srcObject !== screenStreamRef.current) {
                          node.srcObject = screenStreamRef.current;
                          node.play?.().catch(() => {});
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
                <div className={`dev-permission-box ${cameraGranted ? "granted" : ""}`}>
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
                onClick={startExam}
              >
                Continue to Exam
              </button>
              <button
                type="button"
                className="dev-skip-link"
                onClick={startExam}
              >
                Start sample exam directly (Testing mode)
              </button>
              <div className="dev-note">
                Permissions are only active during your exam session.
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: EXAM SCREEN */}
      {currentView === "exam" && (
        <>
          {/* Exam Topbar */}
          <div className="exam-topbar">
            <div className="exam-brand-group">
              <span className="dev-titlebar-tag">SENTRY</span>
              <span className="exam-live-badge">
                <span className="exam-live-dot"></span>
                ACTIVE PROCTOR
              </span>
            </div>

            <div className="exam-pip-wrapper">
              {cameraGranted && (
                <div className="exam-camera-pip" title="Proctored Camera Feed">
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
                  />
                </div>
              )}
              <button
                type="button"
                className="exam-btn-end"
                onClick={() => setShowEndConfirm(true)}
              >
                End Exam
              </button>
            </div>
          </div>

          {/* Exam Meta Bar */}
          <div className="exam-meta-bar">
            <span className="exam-meta-tag">
              Mathematics Assessment • {answeredCount} of {MATH_QUESTIONS.length} Answered
            </span>
            <span className="exam-untimed-tag">
              ∞ No Time Limit
            </span>
          </div>

          {/* Question Navigator Strip */}
          <div className="exam-nav-strip">
            {MATH_QUESTIONS.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isAnswered = selectedAnswers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={`exam-nav-pill ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Body */}
          <div className="exam-question-body">
            <div className="exam-question-header">
              <span className="exam-question-subtitle">
                Question {currentQuestionIndex + 1} of {MATH_QUESTIONS.length}
              </span>
              <h2 className="exam-question-title">{currentQuestion.question}</h2>
            </div>

            {/* Options List */}
            <div className="exam-options-grid">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`exam-option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                  >
                    <span className="exam-option-badge">{opt.id}</span>
                    <span className="exam-option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Controls / Footer */}
          <div className="exam-controls-bar">
            <button
              type="button"
              className="exam-btn-secondary"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </button>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="exam-btn-end"
                onClick={() => setShowEndConfirm(true)}
              >
                End Exam in Between
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  className="exam-btn-primary"
                  onClick={() => handleEndExam(false)}
                >
                  Submit Exam
                </button>
              ) : (
                <button
                  type="button"
                  className="exam-btn-primary"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(MATH_QUESTIONS.length - 1, prev + 1))}
                >
                  Next
                </button>
              )}
            </div>
          </div>

          {/* End Exam Early Confirmation Modal */}
          {showEndConfirm && (
            <div className="modal-overlay" onClick={() => setShowEndConfirm(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">End Exam Early?</h3>
                  <p className="modal-desc">
                    You have answered {answeredCount} of {MATH_QUESTIONS.length} questions. You can end the exam anytime; your current responses will be evaluated.
                  </p>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="exam-btn-secondary"
                    onClick={() => setShowEndConfirm(false)}
                  >
                    Resume Exam
                  </button>
                  <button
                    type="button"
                    className="exam-btn-end"
                    onClick={() => handleEndExam(true)}
                  >
                    Confirm & End Exam
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 3: SUMMARY & RESULTS SCREEN */}
      {currentView === "summary" && (
        <>
          <div className="dev-titlebar">
            <span className="dev-titlebar-tag">SENTRY</span>
            <span className="dev-titlebar-status ready">
              {examEndedEarly ? "Exam Ended Early" : "Exam Completed"}
            </span>
          </div>

          <div className="summary-body">
            {/* Score Banner */}
            <div className="summary-score-banner">
              <div className="score-main">
                <span className="score-label">Your Score</span>
                <span className="score-number">
                  {correctCount} / {MATH_QUESTIONS.length}
                </span>
              </div>
              <div className="score-stats">
                <div className="score-stat-item">
                  <span>Accuracy</span>
                  <span className="score-stat-val">{scorePercent}%</span>
                </div>
                <div className="score-stat-item">
                  <span>Answered</span>
                  <span className="score-stat-val">{answeredCount} of {MATH_QUESTIONS.length}</span>
                </div>
                <div className="score-stat-item">
                  <span>Duration</span>
                  <span className="score-stat-val">Untimed</span>
                </div>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div className="summary-review-list">
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                Question Breakdown
              </h3>
              {MATH_QUESTIONS.map((q, idx) => {
                const userAnsId = selectedAnswers[q.id];
                const isAnswered = userAnsId !== undefined;
                const isCorrect = userAnsId === q.correctAnswer;
                const userAnsObj = q.options.find((o) => o.id === userAnsId);
                const correctAnsObj = q.options.find((o) => o.id === q.correctAnswer);

                let statusClass = "unanswered";
                let statusLabel = "Skipped / Unanswered";
                if (isAnswered) {
                  statusClass = isCorrect ? "correct" : "incorrect";
                  statusLabel = isCorrect ? "Correct" : "Incorrect";
                }

                return (
                  <div key={q.id} className={`review-item ${statusClass}`}>
                    <div className="review-header">
                      <span>{idx + 1}. {q.question}</span>
                      <span className={`review-status-badge ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="review-answer-row">
                      <span className="review-user-ans">
                        Your answer: {isAnswered ? `${userAnsId}) ${userAnsObj?.text}` : "None"}
                      </span>
                      {!isCorrect && (
                        <span className="review-correct-ans">
                          Correct: {q.correctAnswer}) {correctAnsObj?.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Actions */}
            <div className="dev-footer" style={{ flexDirection: "row", gap: "12px" }}>
              <button
                type="button"
                className="exam-btn-primary"
                style={{ flex: 1, padding: "12px" }}
                onClick={retakeExam}
              >
                Retake Exam
              </button>
              <button
                type="button"
                className="exam-btn-secondary"
                style={{ flex: 1, padding: "12px" }}
                onClick={() => setCurrentView("permissions")}
              >
                Back to Permissions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
