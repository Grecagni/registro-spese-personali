// js/db.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyB76HrqxMp0EuPsedVMBJaz6MW5qHdFr10",
  authDomain: "gestione-spese-personale.firebaseapp.com",
  projectId: "gestione-spese-personale",
  storageBucket: "gestione-spese-personale.firebasestorage.app",
  messagingSenderId: "659511690509",
  appId: "1:659511690509:web:c1eb2a8c1b0b10ce469c44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);