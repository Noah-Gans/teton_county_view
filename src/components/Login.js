import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // For forgot password flow
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();

  // 1) Normal login
  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On success, you can navigate or do something else
      navigate("/map"); // for instance, go to the map or hide the overlay
    } catch (err) {
      setError(err.message);
    }
  };

  // 2) Forgot Password
  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");
    try {
      if (!resetEmail) {
        setError("Please enter your email to reset password");
        return;
      }
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(`Password reset email sent to ${resetEmail}. Please check your inbox.`);
    } catch (err) {
      setError(err.message);
    }
  };

  // 3) Close/Exit button - send user back to intro or wherever
  const handleClose = () => {
    navigate("/");  // Go to intro page
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* EXIT / CLOSE BUTTON */}
        <button className="close-login" onClick={handleClose}>X</button>

        {!showReset ? (
          <>
            <div className="login-header">
              <img src="/test.svg" alt="Logo" className="login-logo" />
              <h2>
                <span className="title-main">A Better Teton County GIS</span>
              </h2>
            </div>
            {error && <p className="error-message">{error}</p>}
            <input
              type="email"
              className="login-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Login Button */}
            <button className="login-btn" onClick={handleLogin}>Sign In</button>

            {/* Forgot password link */}
            {/* Forgot Password */}
            <p className="reset-email-btn">
              <small onClick={() => setShowReset(true)}>Forgot password?</small>
            </p>

            {/* Sign Up Link */}
            <p className="register-link">
              Need an account? <Link to="/signup">Sign Up</Link>
            </p>
          </>
        ) : (
          // Forgot password form
          // Reset Password Form
          <>
            <h2>
                <span className="reset-title">Reset Password</span>
            </h2>
            
            {error && <p className="error-message">{error}</p>}
            {resetMessage && <p className="success-message">{resetMessage}</p>}

            <input
              type="email"
              className="login-input"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button className="reset-email-btn" onClick={handleForgotPassword}>
              Send Reset Email
            </button>

            <p className="login-link">
              <small onClick={() => setShowReset(false)}>Back to login</small>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
