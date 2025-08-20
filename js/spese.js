// js/spese.js
import { auth, db } from "./db.js";
import {
  addDoc, setDoc, updateDoc,
  collection, doc, getDoc, getDocs,
  orderBy, query, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ---------- Helpers auth ----------
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
async function currentUid() {
  return (auth.currentUser || await waitUser()).uid;
}

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

export async function getUltimeSpese(max = 200) {
  const uid = await currentUid();
  const col = collection(db, "users", uid, "spese");
  const qy  = query(col, orderBy("data", "desc"), limit(max));
  const snap = await getDocs(qy);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function filtraPerMese(spese, yearMonth) {
  return spese.filter(s => s.data && s.data.startsWith(yearMonth));
}

export function euro(n) {
  const v = Number(n || 0);
  return v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

// ============================================================================
// =========================  RICORRENTI  =====================================
// ============================================================================

// A) CREA SERIE RICORRENTE
export async function addSerieRicorrente(serieInput) {
  const uid = await currentUid();

  // serializzazione "pulita"
  const serie = {
    userId: uid,
    descrizione: serieInput.descrizione,    // dal campo descrizione del form
    importo: Number(serieInput.importo),
    categoria: serieInput.categoria || "Altro",
    metodoPagamento: serieInput.metodoPagamento || null,
    etichette: normTags(serieInput.etichette),
    note: serieInput.note || null,

    startDate: serieInput.startDate,        // YYYY-MM-DD
    endDate: serieInput.endDate || null,

    frequenza: serieInput.frequenza,        // weekly | monthly | yearly
    interval: Number(serieInput.interval || 1),

    // specifici per tipo
    weekday: serieInput.weekday || null,    // 1=lun ... 7=dom
    monthlyMode: serieInput.monthlyMode || null, // giorno_fisso | ultimo_giorno
    anchorDay: serieInput.anchorDay ? Number(serieInput.anchorDay) : null, // 1..31
    monthlyFallback: "EOM",                  // EOM | shift_al_basso

    anchorMonth: serieInput.anchorMonth ? Number(serieInput.anchorMonth) : null, // (annuale) 1..12

    timezone: "Europe/Rome",
    status: (serieInput.status || "active"),
    lookaheadDays: 45,

    skipDates: Array.isArray(serieInput.skipDates) ? serieInput.skipDates : [],
    lastMaterializedDate: null,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const col = collection(db, "users", uid, "recurrenceSeries");
  const ref = await addDoc(col, serie);
  return { id: ref.id, ...serie };
}

// B) MATERIALIZZA ISTANZE (idempotente)
export async function materializeSerie(seriesId) {
  const uid = await currentUid();

  const ref = doc(db, "users", uid, "recurrenceSeries", seriesId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Serie non trovata.");
  const s = snap.data();

  if (s.status !== "active") return { created: 0, dates: [] };

  const today = toYMD(new Date());
  const from  = maxDate(s.lastMaterializedDate || s.startDate, s.startDate);
  const to    = toYMD(addDays(new Date(), s.lookaheadDays || 45));

  const dates = computeOccurrences(s, from, to);
  let created = 0;

  for (const d of dates) {
    if (isBefore(d, s.startDate)) continue;
    if (s.endDate && isAfter(d, s.endDate)) continue;
    if (Array.isArray(s.skipDates) && s.skipDates.includes(d)) continue;

    const uniqueKey = `${seriesId}_${d}`;
    const spesaRef = doc(db, "users", uid, "spese", uniqueKey);

    // upsert idempotente (non sovrascrivere se già esiste)
    const spSnap = await getDoc(spesaRef);
    if (spSnap.exists()) continue;

    const spesaDoc = {
      userId: uid,
      data: d,
      descrizione: s.descrizione,
      importo: Number(s.importo),
      categoria: s.categoria || "Altro",
      etichette: Array.isArray(s.etichette) ? s.etichette : [],
      metodoPagamento: s.metodoPagamento || null,
      createdAt: new Date().toISOString(),

      // flag ricorrente
      isAuto: true,
      seriesId: seriesId,
      occurrenceDate: d,
      uniqueKey
    };

    await setDoc(spesaRef, spesaDoc);
    created++;
  }

  await updateDoc(ref, { lastMaterializedDate: today, updatedAt: new Date().toISOString() });
  return { created, dates };
}

// ---------- Utilities: date & occorrenze ----------
function normTags(x) {
  if (Array.isArray(x)) return x;
  if (typeof x === "string") return x.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

function toYMD(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toISOString().slice(0,10);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isBefore(a, b) { return a < b; }
function isAfter(a, b)  { return a > b; }
function maxDate(a, b)  { return (a && b) ? (a > b ? a : b) : (a || b); }

function endOfMonth(y, m) {
  return new Date(y, m, 0).getDate(); // m = 1..12
}

// Calcola le date dovute tra from..to inclusi (stringhe YYYY-MM-DD)
function computeOccurrences(s, from, to) {
  const out = [];
  if (!s.frequenza || s.frequenza === "none") return out;

  const step = Number(s.interval || 1);
  const start = new Date(s.startDate + "T00:00:00");

  // startCursor = primo evento >= from
  let cursor = nextOnOrAfter(s, start, from);

  while (toYMD(cursor) <= to) {
    const ymd = toYMD(cursor);
    out.push(ymd);
    cursor = nextAfter(s, cursor, step);
  }
  // filtra sotto from
  return out.filter(d => d >= from);
}

// Trova la prima occorrenza >= from
function nextOnOrAfter(s, startDate, fromYmd) {
  let c = new Date(startDate);
  while (toYMD(c) < fromYmd) {
    c = nextAfter(s, c, Number(s.interval || 1));
  }
  return c;
}

// Passo successivo in base alla frequenza
function nextAfter(s, date, step) {
  const d = new Date(date);

  if (s.frequenza === "weekly") {
    d.setDate(d.getDate() + 7 * step);
    if (s.weekday) {
      // riallinea al weekday desiderato (1=Mon .. 7=Sun)
      const want = Number(s.weekday);
      const curr = ((d.getDay() + 6) % 7) + 1; // JS: 0=Sun → 1..7 (Mon..Sun)
      const delta = (want - curr + 7) % 7;
      d.setDate(d.getDate() + delta);
    }
    return d;
  }

  if (s.frequenza === "monthly") {
    const mode = s.monthlyMode || "giorno_fisso";
    if (mode === "ultimo_giorno") {
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1..12
      const next = addMonthsEOM(y, m, step);
      return next;
    } else { // giorno_fisso
      const anchor = Number(s.anchorDay || new Date(s.startDate).getDate());
      const fallback = s.monthlyFallback || "EOM";
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const next = addMonthsDayWithFallback(y, m, step, anchor, fallback);
      return next;
    }
  }

  if (s.frequenza === "yearly") {
    const anchorDay = Number(s.anchorDay || new Date(s.startDate).getDate());
    const anchorMonth = Number(s.anchorMonth || (new Date(s.startDate).getMonth() + 1));
    const y = d.getFullYear() + step;
    const daysIn = endOfMonth(y, anchorMonth);
    const day = Math.min(anchorDay, daysIn);
    return new Date(`${y}-${String(anchorMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}T00:00:00`);
  }

  // fallback
  d.setDate(d.getDate() + 1);
  return d;
}

// Aggiunge N mesi e ritorna l'ultimo giorno del mese target
function addMonthsEOM(y, m, step) {
  const targetM = m + step;
  const yy = y + Math.floor((targetM - 1) / 12);
  const mm = ((targetM - 1) % 12) + 1;
  const dd = endOfMonth(yy, mm);
  return new Date(`${yy}-${String(mm).padStart(2,"0")}-${dd}T00:00:00`);
}

// Aggiunge N mesi e sceglie il giorno con fallback (EOM o shift_al_basso)
function addMonthsDayWithFallback(y, m, step, anchorDay, fallback) {
  const targetM = m + step;
  const yy = y + Math.floor((targetM - 1) / 12);
  const mm = ((targetM - 1) % 12) + 1;
  const dim = endOfMonth(yy, mm);

  let day = anchorDay;
  if (anchorDay > dim) {
    day = (fallback === "shift_al_basso") ? dim : dim; // entrambe confluiscono a EOM per semplicità MVP
  }
  return new Date(`${yy}-${String(mm).padStart(2,"0")}-${String(day).padStart(2,"0")}T00:00:00`);
}
