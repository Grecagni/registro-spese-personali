// auth.js
import { auth } from "./db.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// File corrente (index.html se path termina con /)
function currentFile() {
  const p = location.pathname.split("/").pop();
  return (p === "" ? "index.html" : p).toLowerCase();
}

// Elenco pagine protette
const PROTECTED = new Set(["index.html","inserisci.html","storico.html"]);

// Nasconde la pagina finché non sappiamo se l'utente è loggato (evita flash)
function startAuthMask()   { document.documentElement.classList.add("auth-checking"); }
function stopAuthMask()    { document.documentElement.classList.remove("auth-checking"); }

// Da chiamare nelle pagine protette, il prima possibile
export function requireAuth() {
  startAuthMask();
  onAuthStateChanged(auth, (user) => {
    const file = currentFile();
    const mustBeLogged = PROTECTED.has(file);
    if (mustBeLogged && !user) {
      // redirect pulito, niente "back loop"
      const backTo = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`login.html?from=${backTo}`);
      return;
    }
    // OK: mostra la pagina
    stopAuthMask();
  });
}

// Se sei già loggato, evita di vedere la pagina di login
export function bounceIfLogged() {
  startAuthMask();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const url = new URL(location.href);
      const back = url.searchParams.get("from");
      stopAuthMask();
      location.replace(back ? back : "index.html");
    } else {
      stopAuthMask();
    }
  });
}

// Helpers login/logout
export function emailLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
export async function logout() {
  await signOut(auth);
  location.replace("login.html");
}
export function currentUser() {
  return auth.currentUser;
}