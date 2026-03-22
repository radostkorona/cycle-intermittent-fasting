import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWZn23jsqJXOqGtu5zIL3V8yi4SPEbPEY",
  authDomain: "cycle-intermittent-fasting.firebaseapp.com",
  projectId: "cycle-intermittent-fasting",
  storageBucket: "cycle-intermittent-fasting.firebasestorage.app",
  messagingSenderId: "37061037394",
  appId: "1:37061037394:web:273495e5a918913490be8b",
  measurementId: "G-7Q0ERTKGDZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
