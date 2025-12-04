// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDC1T9bU2zZVYDUbA4CxifeEtUfXD9DvGY",
  authDomain: "betterhuman-102fc.firebaseapp.com",
  projectId: "betterhuman-102fc",
  storageBucket: "betterhuman-102fc.appspot.com",
  messagingSenderId: "814803947192",
  appId: "1:814803947192:web:3092a0beb16582998f6e4d",
  measurementId: "G-T2WJ7DRKGR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
