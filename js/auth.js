// js/auth.js — guardie + login/logout (solo email)
import { auth } from "./db.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const PROTECTED = new Set(["index.html","inserisci.html","storico.html"]);

const currentFile = () => {
  const last = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return last === "" ? "index.html" : last;
};

const redirect = (url) => location.replace(url);

// Se sei già loggato, non ha senso stare su login
export function bounceIfLogged() {
  onAuthStateChanged(auth, (user) => {
    if (user && (currentFile() === "login.html" || currentFile() === "signup.html")) {
      const back = new URL(location.href).searchParams.get("from");
      redirect(back || "index.html");
    }
  });
}

// Impone autenticazione sulle pagine protette
export function requireAuth() {
  if (!PROTECTED.has(currentFile())) return; // pagina non protetta
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      const from = encodeURIComponent(currentFile());
      redirect(`login.html?from=${from}`);
    } else {
      // se usi .guard-hidden per evitare flash
      document.querySelectorAll(".guard-hidden").forEach(el => el.classList.remove("guard-hidden"));
    }
  });
}

// Login email/password
export function emailLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function emailSignup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export async function logout() {
  await signOut(auth);
  redirect("login.html");
}

// User corrente
export const currentUser = () => auth.currentUser;
