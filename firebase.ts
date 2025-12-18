
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
// Separated type imports and corrected modular exports for Firebase v10 to avoid resolution errors
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCSs8dyTW_5FNllDtODiPuVuqScXbweDl4",
  authDomain: "close-box-17904.firebaseapp.com",
  projectId: "close-box-17904",
  storageBucket: "close-box-17904.firebasestorage.app",
  messagingSenderId: "353620096626",
  appId: "1:353620096626:web:2ac80029d6feb775ae34eb",
  measurementId: "G-CZS08SWWE6"
};

// Singleton pattern for Firebase App initialization. 
// This ensures we always use the exact same internal registry for components.
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Initialize services using the singleton app instance.
 */
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics initialization with environment check
isAnalyticsSupported().then(supported => {
  if (supported) {
    getAnalytics(app);
  }
});

/**
 * Robust FCM instance getter
 */
export const getMessagingInstance = async () => {
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      return getMessaging(app);
    }
    return null;
  } catch (err) {
    console.warn("FCM registration error skipped in this environment:", err);
    return null;
  }
};
