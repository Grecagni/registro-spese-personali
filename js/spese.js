// js/spese.js
import { db } from "./db.js";
import { currentUid } from "./auth.js";
import {
  addDoc, setDoc, updateDoc, deleteDoc,
  collection, doc, getDoc, getDocs,
  orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ---------- Spese "normali" ----------
export async function addSpesa(payload) {
  const uid = await currentUid();
  const etichette = Array.isArray(payload.etichette)
    ? payload.etichette
    : (typeof payload.etichette === "string"
        ? payload.etichette.split(",").map(s => s.trim()).filter(Boolean)
        : []);

  const docData = {
    userId: uid,
    data: payload.data,                         // "YYYY-MM-DD"
    descrizione: payload.descrizione,
    importo: Number(payload.importo),
    categoria: payload.categoria || "Altro",
    etichette,
    createdAt: new Date().toISOString()
  };

  const col = collection(db, "users", uid, "spese");
  await addDoc(col, docData);
}
export async function updateSpesa(id, payload) {
  const uid = await currentUid();
  const ref = doc(db, "users", uid, "spese", id);
  const snap = await getDoc(ref);
  if(!snap.exists() || snap.data().userId !== uid) throw new Error("Non autorizzato");
  const data = {};
  if(payload.data !== undefined) data.data = payload.data;
  if(payload.descrizione !== undefined) data.descrizione = payload.descrizione;
  if(payload.importo !== undefined) data.importo = Number(payload.importo);
  if(payload.categoria !== undefined) data.categoria = payload.categoria;
  if(payload.etichette !== undefined) {
    data.etichette = Array.isArray(payload.etichette) ? payload.etichette : (typeof payload.etichette === "string" ? payload.etichette.split(",").map(s=>s.trim()).filter(Boolean) : []);
  }
  data.updatedAt = new Date().toISOString();
  await updateDoc(ref, data);
}

export async function deleteSpesa(id){
  const uid = await currentUid();
  const ref = doc(db, "users", uid, "spese", id);
  const snap = await getDoc(ref);
  if(!snap.exists() || snap.data().userId !== uid) throw new Error("Non autorizzato");
  await deleteDoc(ref);
}


export async function getUltimeSpese(max = 200) {
  const uid = await currentUid();
  const col = collection(db, "users", uid, "spese");
  const qy  = query(col, orderBy("data", "desc"), limit(max));
  const snap = await getDocs(qy);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setBudget(categoria, importo, mese){
  const uid = await currentUid();
  const ref = doc(db, "users", uid, "budgets", mese);
  await setDoc(ref, { [categoria]: Number(importo) }, { merge: true });
}

export async function getBudget(mese){
  const uid = await currentUid();
  const ref = doc(db, "users", uid, "budgets", mese);
  const snap = await getDoc(ref);
  return snap.exists()?snap.data():{};
}

export function filtraPerMese(spese, yearMonth) {
  return spese.filter(s => s.data && s.data.startsWith(yearMonth));
}

export function euro(n) {
  const v = Number(n || 0);
  return v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}
