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
            <h2>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Sign In</button>
            
            {/* Forgot password link */}
            <p style={{ marginTop: "10px" }}>
              <small onClick={() => setShowReset(true)} style={{ cursor: "pointer", color: "blue" }}>
                Forgot password?
              </small>
            </p>

            <p style={{ marginTop: "10px" }}>
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </>
        ) : (
          // Forgot password form
          <>
            <h2>Reset Password</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {resetMessage && <p style={{ color: "green" }}>{resetMessage}</p>}
            <input
              type="email"
              placeholder="Email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <button 
            className="reset-email-btn" 
            onClick={handleForgotPassword}
            >
            Send Reset Email
            </button>

            <p style={{ marginTop: "10px" }}>
              <small onClick={() => setShowReset(false)} style={{ cursor: "pointer", color: "blue" }}>
                Back to login
              </small>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
