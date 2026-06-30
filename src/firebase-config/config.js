import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getDatabase } from "firebase/database";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "ENTER_YOUR_API_KEY",
  authDomain: "turf-1c32c.firebaseapp.com",
  databaseURL: "https://turf-1c32c-default-rtdb.firebaseio.com",
  projectId: "turf-1c32c",
  storageBucket: "turf-1c32c.appspot.com",
  messagingSenderId: "837226059982",
  appId: "ENTER_YOUR_APPID",
  measurementId: "G-QNFGLSJXKR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional)
// Initialize Firebase Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const database = getDatabase(app);

export default app;
