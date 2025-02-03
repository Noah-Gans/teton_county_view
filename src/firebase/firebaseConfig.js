// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // For authentication
import { getAnalytics } from "firebase/analytics"; // Optional, for analytics
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

    apiKey: "AIzaSyDdmELgEKKGiP-4EUqvRS0BcWEWEen_g1Y",
  
    authDomain: "tetoncountygis.firebaseapp.com",
  
    projectId: "tetoncountygis",
  
    storageBucket: "tetoncountygis.firebasestorage.app",
  
    messagingSenderId: "594232611140",
  
    appId: "1:594232611140:web:31a4f11c6d9adf12fa8711",
  
    measurementId: "G-B2SDB2WPGR"
  
  };
  
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Optional: Initialize Analytics (only if you want to use it)
export const analytics = getAnalytics(app);

export const db = getFirestore(app);

// Export the app instance for use elsewhere
export default app;