import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

// Standardize env access for Vite/ESM environments
const getEnv = (key: string) => {
  const env = (import.meta as any).env;
  if (env) {
    return env[key] || env[`VITE_${key}`];
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

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const googleProvider = new GoogleAuthProvider();

// Initialize analytics
isSupported().then(supported => {
  if (supported) {
    getAnalytics(app);
  }
});

export const getMessagingInstance = async () => {
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      return getMessaging(app);
    }
    return null;
  } catch (err) {
    console.warn("Messaging initialization skipped", err);
    return null;
  }
};
