// js/spese.js
import { auth, db } from "./db.js";
import {
  addDoc, collection, getDocs, orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// attende utente pronto (max ~8s)
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

// Aggiunge una spesa nello schema /users/{uid}/spese
export async function addSpesa(payload) {
  const u = auth.currentUser || await waitUser();
  const etichette = Array.isArray(payload.etichette)
    ? payload.etichette
    : (typeof payload.etichette === "string"
        ? payload.etichette.split(",").map(s => s.trim()).filter(Boolean)
        : []);

  const doc = {
    userId: u.uid,
    data: payload.data,                         // "YYYY-MM-DD"
    descrizione: payload.descrizione,
    importo: Number(payload.importo),
    categoria: payload.categoria || "Altro",
    etichette,
    createdAt: new Date().toISOString()
  };

  const col = collection(db, "users", u.uid, "spese");
  await addDoc(col, doc);
}

// Ultime spese ordinate per data (stringa "YYYY-MM-DD")
export async function getUltimeSpese(max = 200) {
  const u = auth.currentUser || await waitUser();
  const col = collection(db, "users", u.uid, "spese");
  const qy  = query(col, orderBy("data", "desc"), limit(max));
  const snap = await getDocs(qy);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Filtra array già caricato per mese AAAA-MM
export function filtraPerMese(spese, yearMonth) {
  return spese.filter(s => s.data && s.data.startsWith(yearMonth));
}

// Format valuta base
export function euro(n) {
  const v = Number(n || 0);
  return v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}
