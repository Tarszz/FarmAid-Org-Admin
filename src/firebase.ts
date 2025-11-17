// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // Add this if you're using Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2_a91SdWfX5eVihs2wKb5MjZVVq58seg",
  authDomain: "farmaid-21053.firebaseapp.com",
  databaseURL: "https://farmaid-21053-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farmaid-21053",
  storageBucket: "farmaid-21053.firebasestorage.app",
  messagingSenderId: "822952482588",
  appId: "1:822952482588:web:74a55c97e58c797e5dccd9",
  measurementId: "G-EQ0D2XM5MX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // Optional: export if you use Realtime DB

// ✅ Export needed variables
export { app, analytics, database };
export const db = getFirestore(app);