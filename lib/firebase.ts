// lib/firebase.ts
/**
 * Firebase Configuration & Initialization
 *
 * IMPORTANT: You need to add your Firebase config values here!
 *
 * HOW TO GET YOUR CONFIG:
 * 1. Go to: https://console.firebase.google.com/
 * 2. Select your MyChef project (or create one)
 * 3. Click the gear icon ⚙️ → Project Settings
 * 4. Scroll to "Your apps" section
 * 5. Click on your web app (or add one if none exist)
 * 6. Copy the firebaseConfig object values
 * 7. Paste them below (replace the placeholder values)
 *
 * OPTION 1: Hardcode values here (quickest for testing)
 * OPTION 2: Use .env file with EXPO_PUBLIC_ prefix (better for production)
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";


/**
 * Firebase configuration
 *
 * REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG!
 * Get them from: Firebase Console → Project Settings → General → Your apps
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "your-project.appspot.com",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

/**
 * Validate Firebase configuration
 * This will throw an error if you haven't updated the config yet
 */
if (
  firebaseConfig.apiKey === "YOUR_API_KEY_HERE" ||
  firebaseConfig.apiKey.includes("YOUR_") ||
  firebaseConfig.projectId === "your-project-id"
) {
  console.error("🔥 FIREBASE CONFIGURATION ERROR!");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.error("You need to update your Firebase config in lib/firebase.ts");
  console.error("");
  console.error("HOW TO FIX:");
  console.error("1. Go to https://console.firebase.google.com/");
  console.error("2. Select or create your MyChef project");
  console.error("3. Click Settings (⚙️) → Project Settings");
  console.error("4. Scroll to 'Your apps' → Click your web app");
  console.error("5. Copy the config values");
  console.error("6. Replace the values in lib/firebase.ts");
  console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  throw new Error(
    "Firebase configuration not found. Please update lib/firebase.ts with your Firebase project credentials."
  );
}

console.log("🔥 Firebase initializing with project:", firebaseConfig.projectId);

/**
 * Initialize Firebase
 */
let firebaseApp: FirebaseApp;

if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized successfully!");
} else {
  firebaseApp = getApps()[0];
  console.log("✅ Firebase already initialized");
}

/**
 * Firebase Authentication instance
 */
export const auth: Auth = getAuth(firebaseApp);

/**
 * Firestore Database instance
 */
export const db: Firestore = getFirestore(firebaseApp);

/**
 * Export the Firebase app instance
 */
export { firebaseApp };
