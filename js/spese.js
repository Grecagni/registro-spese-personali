// js/spese.js
import { auth, db } from "./db.js";
import {
  addDoc, collection, getDocs, orderBy, query, where, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// attende che l'utente sia pronto
function waitUser() {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const id = setInterval(() => {
      const u = auth.currentUser;
      if (u) { clearInterval(id); resolve(u); }
      if (performance.now() - t0 > 8000) { clearInterval(id); reject(new Error("Login timeout")); }
    }, 100);
  });
}

export async function addSpesa({ data, descrizione, importo, categoria, etichette }) {
  const user = await waitUser();
  const uid = user.uid;

  const amount = Number(parseFloat(importo).toFixed(2));
  const tags = (etichette || "")
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  const doc = {
    userId: uid,
    data,                // "YYYY-MM-DD"
    descrizione,
    importo: amount,     // numero
    categoria,
    etichette: tags,
    createdAt: new Date().toISOString()
  };

  const col = collection(db, "users", uid, "spese");
  const ref = await addDoc(col, doc);
  return ref.id;
}

// lettura semplice: ultime N spese dell'utente, ordinate per data (stringa "YYYY-MM-DD")
export async function getUltimeSpese(max = 200) {
  const user = await waitUser();
  const uid = user.uid;
  const col = collection(db, "users", uid, "spese");
  const q = query(col, where("userId", "==", uid), orderBy("data", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// utilità client: filtra per mese AAAA-MM (su array già caricato)
export function filtraPerMese(spese, yearMonth) {
  return spese.filter(s => s.data && s.data.startsWith(yearMonth)); // "2025-08"
}

// format valuta base
export function euro(n) {
  const v = Number(n || 0);
  return v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}
