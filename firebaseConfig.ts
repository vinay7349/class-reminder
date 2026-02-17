import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB99UQ1kXii9Ytce6rRnyaKNddYKTaRjzw",
  authDomain: "college-reminder-app-7f7c1.firebaseapp.com",
  projectId: "college-reminder-app-7f7c1",
  storageBucket: "college-reminder-app-7f7c1.firebasestorage.app",
  messagingSenderId: "405798923036",
  appId: "1:405798923036:web:f11baa2b7dda494dd728d9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
