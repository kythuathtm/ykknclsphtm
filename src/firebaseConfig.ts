
// Import the functions you need from the SDKs you need
import * as firebaseApp from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Workaround for TypeScript error: Module '"firebase/app"' has no exported member...
// This allows the code to run with Firebase v9+ even if types are not resolving correctly
const { initializeApp, getApps, getApp } = firebaseApp as any;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeqjEcX4eEvl-2FBhY4mCTx7zmMVl55vE",
  authDomain: "ykkhclsp.firebaseapp.com",
  projectId: "ykkhclsp",
  storageBucket: "ykkhclsp.firebasestorage.app",
  messagingSenderId: "123816810828",
  appId: "1:123816810828:web:7d7b52ebe943cbf17e17e9",
  measurementId: "G-PP20K8JT03"
};

// Initialize Firebase
// Check if an app is already initialized to avoid "Firebase: Firebase App named '[DEFAULT]' already exists" error during HMR
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

console.log("Firebase Analytics và Firestore đã được kết nối thành công!");
