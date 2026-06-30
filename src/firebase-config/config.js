import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getDatabase } from "firebase/database";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDe27qpEEQComE9p3VrndjGa6qFMtv2qmc",
  authDomain: "turf-1c32c.firebaseapp.com",
  databaseURL: "https://turf-1c32c-default-rtdb.firebaseio.com",
  projectId: "turf-1c32c",
  storageBucket: "turf-1c32c.appspot.com",
  messagingSenderId: "837226059982",
  appId: "1:837226059982:web:87c3abfa7adea7bfc5989f",
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
