// js/login.js
import { emailLogin, bounceIfLogged } from "./auth.js";

// Se già loggato, rimbalza (rispetta ?from=)
bounceIfLogged();

const form = document.getElementById("loginForm");
const msg  = document.getElementById("msg");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.innerHTML = "";

  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value;

  try {
    await emailLogin(email, pass);
    const back = new URL(location.href).searchParams.get("from");
    location.href = back || "index.html";
  } catch (err) {
    const text = err?.message || "Accesso non riuscito.";
    msg.innerHTML = `<div class="alert alert-danger" role="alert">${text}</div>`;
  }
});
