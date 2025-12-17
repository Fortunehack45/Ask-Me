import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

// Helper to get env vars safely (supports Vite and CRA/Next)
const getEnv = (key: string) => {
  // Check for Vite import.meta.env
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  
  // Check for Node.js process.env safely
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || process.env[`REACT_APP_${key}`];
    }
  } catch (e) {
    // Ignore error if process is accessed in strict browser env
  }

  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || "AIzaSyCSs8dyTW_5FNllDtODiPuVuqScXbweDl4",
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "close-box-17904.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "close-box-17904",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "close-box-17904.firebasestorage.app",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "353620096626",
  appId: getEnv('FIREBASE_APP_ID') || "1:353620096626:web:2ac80029d6feb775ae34eb",
  measurementId: getEnv('FIREBASE_MEASUREMENT_ID') || "G-CZS08SWWE6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to improve connection stability
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const googleProvider = new GoogleAuthProvider();

// Initialize analytics only if supported (client-side)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Messaging
export const getMessagingInstance = async () => {
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      return getMessaging(app);
    }
    return null;
  } catch (err) {
    console.log("Messaging not supported", err);
    return null;
  }
};

export { analytics };