// js/auth.js
import { auth } from "./db.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

export function requireAuth() {
  const protectedPages = ["/", "/index.html", "/inserisci.html", "/storico.html"];
  const path = location.pathname.endsWith("/") ? "/" : location.pathname;
  onAuthStateChanged(auth, (user) => {
    const mustBeLogged = protectedPages.includes(path);
    if (mustBeLogged && !user) location.href = "/login.html";
  });
}

export async function emailLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
  location.href = "/login.html";
}

export function currentUser() {
  return auth.currentUser;
}
