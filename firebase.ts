
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCSs8dyTW_5FNllDtODiPuVuqScXbweDl4",
  authDomain: "close-box-17904.firebaseapp.com",
  projectId: "close-box-17904",
  storageBucket: "close-box-17904.firebasestorage.app",
  messagingSenderId: "353620096626",
  appId: "1:353620096626:web:2ac80029d6feb775ae34eb",
  measurementId: "G-CZS08SWWE6"
};

// Initialize Firebase App
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Modular Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Analytics Initialization
isSupported().then(supported => {
  if (supported) {
    getAnalytics(app);
  }
});

/**
 * Utility to get messaging instance with robust support check
 */
export const getMessagingInstance = async () => {
  try {
    const { getMessaging, isSupported: isMessagingSupported } = await import("firebase/messaging");
    const supported = await isMessagingSupported();
    if (supported) {
      return getMessaging(app);
    }
    return null;
  } catch (err) {
    console.warn("FCM registration error skipped:", err);
    return null;
  }
};
