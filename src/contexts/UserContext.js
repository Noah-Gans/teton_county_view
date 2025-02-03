import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch subscriptionStatus from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSubscriptionStatus(data.subscriptionStatus || 'none');
        } else {
          setSubscriptionStatus('none');
        }
      } else {
        setUser(null);
        setSubscriptionStatus(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth); // Sign out using Firebase
      setUser(null); // Clear the user state
      console.log("User successfully signed out");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };


  // Provide user, subscriptionStatus, and loading to the rest of the app
  return (
    <UserContext.Provider value={{ user, subscriptionStatus, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}



