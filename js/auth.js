// js/auth.js — solo email/password, guardia semplice
import { auth } from "./db.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Rileva file corrente (su Pages "" => index.html)
const currentFile = () => {
  const last = location.pathname.split("/").pop();
  return (last === "" ? "index.html" : last).toLowerCase();
};

// Pagine protette (per ora solo index)
const PROT = new Set(["index.html"]);

// Anti-flash: nasconde la pagina finché non decidiamo cosa fare
const maskOn  = () => document.documentElement.classList.add("auth-checking");
const maskOff = () => document.documentElement.classList.remove("auth-checking");

// Da chiamare SUBITO nelle pagine protette
export function requireAuth() {
  maskOn();
  onAuthStateChanged(auth, (user) => {
    if (PROT.has(currentFile()) && !user) {
      const backTo = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`login.html?from=${backTo}`);
      return;
    }
    maskOff();
  });
}

// Evita di mostrare login se già autenticato
export function bounceIfLogged() {
  maskOn();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const back = new URL(location.href).searchParams.get("from");
      maskOff();
      location.replace(back || "index.html");
    } else {
      maskOff();
    }
  });
}

// Email/password
export function emailLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
  location.replace("login.html");
}

export const currentUser = () => auth.currentUser;