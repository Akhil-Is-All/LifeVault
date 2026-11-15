import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseEnvironment = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};

const missingConfiguration = Object.entries(firebaseEnvironment)
  .filter(([, value]) => typeof value !== "string" || !value.trim())
  .map(([key]) => {
    const variableNames = {
      apiKey: "VITE_FIREBASE_API_KEY",
      authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
      projectId: "VITE_FIREBASE_PROJECT_ID",
      storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
      messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
      appId: "VITE_FIREBASE_APP_ID",
      vapidKey: "VITE_FIREBASE_VAPID_KEY",
    };

    return variableNames[key];
  });

if (missingConfiguration.length > 0) {
  throw new Error(
    `Missing Firebase environment configuration: ${missingConfiguration.join(", ")}`
  );
}

const { vapidKey, ...firebaseConfig } = firebaseEnvironment;
const existingDefaultApp = getApps().find(
  (firebaseApp) => firebaseApp.name === "[DEFAULT]"
);

export const firebaseApp = existingDefaultApp || initializeApp(firebaseConfig);
export const firebaseVapidKey = vapidKey;

export async function initializeMessaging() {
  let messagingSupported = false;

  try {
    messagingSupported = await isSupported();
  } catch {
    return null;
  }

  return messagingSupported ? getMessaging(firebaseApp) : null;
}
