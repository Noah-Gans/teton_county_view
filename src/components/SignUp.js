import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import "./SignUp.css";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [step, setStep] = useState(1);            
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showRedirectPopup, setShowRedirectPopup] = useState(false); // Popup state
  const navigate = useNavigate();
  const functions = getFunctions();
  const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

  // 1) Create account
  const handleCreateAccount = async () => {
    setError("");

    if (!email || !password || !confirmPass) {
      setError("Please fill out all fields");
      return;
    }
    if (password !== confirmPass) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      console.log("Verification email sent to:", user.email);

      setUserId(user.uid);

      // Move to Step 2
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // 2) Autopoll for verification
  useEffect(() => {
    let intervalId = null;

    // Only start polling if step === 2 and not verified yet
    if (step === 2 && !isVerified) {
      intervalId = setInterval(async () => {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setIsVerified(true);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Auto-check verification error:", err);
        }
      }, 500); // check every 5 seconds
    }

    // Cleanup if user leaves step 2 or the component unmounts
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, isVerified]);

  // 3) Continue to Payment (only if verified)
  const handleContinueToPayment = async () => {
    setError("");
    try {
      if (!isVerified) {
        setError("Please verify your email first.");
        return;
      }
      setShowRedirectPopup(true); // Show popup before redirecting
      // user is verified, create checkout session
      const result = await createCheckoutSession({
        email: auth.currentUser.email,
        userId: auth.currentUser.uid,
      });
      const { url } = result.data;
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError(err.message);
      setShowRedirectPopup(false); // Hide popup if error occurs
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-left">
        <h1>A Better Teton County GIS Subscription</h1>
        
        <p className = "subheader-signup"> If you use the county GIS platform every week, this subscription is worth its cost in time saved. </p>
        {/* Features Section */}
        <ul>
          <li>📍 Detailed layers</li>
          <li>⏱️ Updated Daily</li>
          <li>📊 Built In Report Builder</li>
          <li>⚡ Always Improving</li>
        </ul>
        <p className="price">$00.00 / month</p>
        <p><small>Cancel anytime, no hidden fees.</small></p>
      </div>

      <div className="signup-right">
        <button className="close-button" onClick={() => navigate('/')}>✖</button>

        {/* Step 1: Create Account */}
        <div className={`signup-step ${step === 1 ? "active-step" : "blurred-step"}`}>
          <h2>Create Your Account</h2>
          {error && step === 1 && <div className="error-message">{error}</div>}
          
          <div className="signup-input-wrapper">
            <div className="signup-input-container">
              <input type="email" placeholder="Email" value={email} disabled={step > 1} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={password} disabled={step > 1} onChange={(e) => setPassword(e.target.value)} />
              <input type="password" placeholder="Confirm Password" value={confirmPass} disabled={step > 1} onChange={(e) => setConfirmPass(e.target.value)} />
            </div>

            {step === 1 && (
              <button className="create-account-btn" onClick={handleCreateAccount}>
                Create <br /> Account
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Email Verification */}
        <div className={`signup-step ${step === 2 ? "active-step" : "blurred-step"}`}>
          {step >= 2 && (
            <>
              <h2>Verify Your Email</h2>
              {error && step === 2 && <div className="error-message">{error}</div>}
              <p>We've sent a verification link to <strong>{email}</strong>. Once verified, you can continue to payment.</p>

              {isVerified ? (
                <div className="verified-message">✅ Email verified! </div>
              ) : (
                <div className="verification-check">Waiting for verification...</div>
              )}

              <button className="primary-button" disabled={!isVerified} onClick={handleContinueToPayment}>
                Continue to Payment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payment Redirect Popup */}
      {showRedirectPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <p>🔒 Taking you to a secure payment portal... Please wait.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
