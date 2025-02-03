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
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-left">
        <h1>Subscribe to Teton GIS</h1>
        <p>Access advanced mapping tools, custom prints, and priority support.</p>
        <ul>
          <li>Detailed layers</li>
          <li>Export & print in high resolution</li>
          <li>24/7 support</li>
        </ul>
        <p className="price">$9.99 / month</p>
        <p><small>Cancel anytime, no hidden fees.</small></p>
      </div>

      <div className="signup-right">
        <button className="close-button" onClick={() => navigate('/')}>X</button>
        
        {/* STEP 1: Create Account */}
        <div className={`signup-step ${step >= 1 ? "active-step" : ""} ${step > 1 ? "blurred" : ""}`}>
          <h2>Create Your Account</h2>
          {error && step === 1 && <div className="error-message">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={step > 1}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={step > 1}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPass}
            disabled={step > 1}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
          {step === 1 && (
            <button className="primary-button" onClick={handleCreateAccount}>
              Create Account
            </button>
          )}
        </div>

        {/* STEP 2: Email Verification */}
        <div className={`signup-step ${step >= 2 ? "active-step" : ""}`}>
          {step >= 2 && (
            <>
              <h2>Verify Your Email</h2>
              {error && step === 2 && <div className="error-message">{error}</div>}
              <p>
                We’ve sent a verification link to <strong>{email}</strong>.
                Once verified, you can continue to payment.
              </p>

              {isVerified ? (
                <div style={{ color: "green", margin: "10px 0" }}>
                  Email verified! You may continue.
                </div>
              ) : (
                <div style={{ margin: "10px 0", color: "#666" }}>
                  Checking your verification status automatically...
                  <br />
                  (Please confirm the email link we sent)
                </div>
              )}

              <button
                className="primary-button"
                disabled={!isVerified}
                style={{ marginTop: "10px" }}
                onClick={handleContinueToPayment}
              >
                Continue to Payment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
