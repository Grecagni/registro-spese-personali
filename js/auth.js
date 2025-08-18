// js/auth.js — guardia + login/logout (solo email)
import { auth } from "./db.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// file corrente (su Pages "" => index.html)
const currentFile = () => {
  const last = location.pathname.split("/").pop();
  return (last === "" ? "index.html" : last).toLowerCase();
};

// pagine protette
const PROT = new Set(["index.html","inserisci.html","storico.html"]);

// maschera solo l'area protetta (elemento con [data-guard]), fallback <html>
const guardEl = () => document.querySelector("[data-guard]") || document.documentElement;
const startMask = () => guardEl().classList.add("guard-hidden");
const stopMask  = () => guardEl().classList.remove("guard-hidden");

// da chiamare SUBITO nelle pagine protette
export function requireAuth() {
  startMask();
  onAuthStateChanged(auth, (user) => {
    if (PROT.has(currentFile()) && !user) {
      const backTo = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`login.html?from=${backTo}`);
      return;
    }
    stopMask();
  });
}

// evita di mostrare login se già autenticato
export function bounceIfLogged() {
  startMask();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const back = new URL(location.href).searchParams.get("from");
      stopMask();
      location.replace(back || "index.html");
    } else {
      stopMask();
    }
  });
}

// email/password
export function emailLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
  location.replace("login.html");
}

export const currentUser = () => auth.currentUser;
