
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
// Consolidated modular auth imports with explicit type separation to resolve "no exported member" errors
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
// Consolidated modular analytics imports with explicit type separation to resolve "no exported member" errors
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

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initializing core services with proper types and explicit modular functions
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Safe initialization of Analytics using the resolved isSupported function
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
    // Dynamic import to handle environments without messaging support
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
