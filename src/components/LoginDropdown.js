import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig"; // import your Firestore instance
import { getFunctions, httpsCallable } from "firebase/functions";
import "./LoginDropdown.css";

const LoginDropdown = () => {
  const { user, logout } = useUser(); // Access user and logout function
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };

  // 1) On mount or when `user` changes, fetch Firestore doc to see if they're active, etc.
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setSubscriptionStatus(data.subscriptionStatus || "none");
        } else {
          setSubscriptionStatus("none");
        }
      } else {
        setSubscriptionStatus(null);
      }
    };

    fetchSubscriptionInfo();
  }, [user]);

  // 2) Create a function to call your createPortalSession
  const handleManageSubscription = async () => {
    try {
      const functions = getFunctions();
      const createPortalSession = httpsCallable(functions, "createPortalSession");

      const result = await createPortalSession({});
      const { url } = result.data;
      window.location.href = url; // redirect to Stripe Billing Portal
    } catch (error) {
      console.error("Failed to create portal session:", error);
      alert("Unable to open portal. Please try again later.");
    }
  };

  return (
    <div className="login-dropdown">
      <button className="login-button" onClick={toggleDropdown}>
        {user ? "Account" : "Sign In"}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {user ? (
            <>
              <div className="dropdown-item">Email: {user.email}</div>

              {/* Show 'Manage Subscription' only if subscription is active */}
              {subscriptionStatus === "active" && (
                <button className="dropdown-item" onClick={handleManageSubscription}>
                  Manage Subscription
                </button>
              )}
              {(subscriptionStatus === "none" || subscriptionStatus === "canceled") && (
  <button
    className="dropdown-item"
    onClick={async () => {
      try {
        const functions = getFunctions();
        const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

        // Call the existing function with the user’s data
        const result = await createCheckoutSession({
          email: user.email, 
          userId: user.uid 
        });

        const { url } = result.data;
        window.location.href = url; // Off to Stripe Checkout
      } catch (err) {
        console.error("Error re-subscribing:", err);
        alert("Unable to start subscription. Please try again later.");
      }
    }}
  >
    Re-subscribe
  </button>
)}

              <button className="dropdown-item" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <div>
              {/* If not logged in, link to /login or /signup */}
              <a href="/login" className="dropdown-item">
                Sign In / Sign Up
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoginDropdown;
