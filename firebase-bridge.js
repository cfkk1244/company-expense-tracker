import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { firebaseConfig } from "./firebase.config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

function safeFileName(name = "file") {
  return String(name).replace(/[\/:*?"<>|#%{}^~`\[\]]/g, "_");
}

function normalizeMonth(record) {
  const m = Number(record.month ?? 0);
  // ระบบเดิมใช้ month แบบ 0-11 จาก JavaScript Date.getMonth()
  // แต่บางระบบอาจส่งมา 1-12 จึงเก็บทั้งสองค่าไว้
  const monthIndex = m >= 1 && m <= 12 ? m - 1 : m;
  return {
    month: monthIndex,
    monthIndex,
    monthNumber: monthIndex + 1
  };
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return await response.blob();
}

async function uploadDataUrlFiles(folder, record) {
  const files = record.attachments || [];
  const uploaded = [];

  for (const file of files) {
    if (!file?.data) continue;

    const blob = await dataUrlToBlob(file.data);
    const docNo = safeFileName(record.no || String(record.id || Date.now()));
    const path = `${folder}/${record.branch || "unknown"}/${docNo}/${Date.now()}-${safeFileName(file.name)}`;
    const fileRef = ref(storage, path);

    await uploadBytes(fileRef, blob, {
      contentType: file.type || "application/octet-stream"
    });

    const url = await getDownloadURL(fileRef);

    uploaded.push({
      name: file.name,
      type: file.type,
      storagePath: path,
      url
    });
  }

  return uploaded;
}

async function saveDoc(collectionName, record, fileFolder = collectionName) {
  const monthFields = normalizeMonth(record);
  const uploadedFiles = await uploadDataUrlFiles(fileFolder, record);

  const payload = {
    ...record,
    ...monthFields,
    attachments: uploadedFiles,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  return await addDoc(collection(db, collectionName), payload);
}

export function saveProduction(record) {
  return saveDoc("productions", record, "productions");
}

export function saveInvoice(record) {
  return saveDoc("invoices", record, "invoices");
}

export function saveQuote(record) {
  return saveDoc("quotes", record, "quotes");
}

export function saveReceipt(record) {
  return saveDoc("receipts", record, "receipts");
}

export function saveExpense(record) {
  return saveDoc("expenses", record, "expenses");
}

export async function loadCollectionByYear(collectionName, year) {
  const q = query(
    collection(db, collectionName),
    where("year", "==", Number(year))
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    firebaseId: doc.id,
    ...doc.data()
  }));
}

export async function loadAllDashboardDataByYear(year) {
  const [invoices, productions, expenses, quotes, receipts] = await Promise.all([
    loadCollectionByYear("invoices", year),
    loadCollectionByYear("productions", year),
    loadCollectionByYear("expenses", year),
    loadCollectionByYear("quotes", year),
    loadCollectionByYear("receipts", year)
  ]);

  return { invoices, productions, expenses, quotes, receipts };
}

// ให้ app.js เดิมเรียกใช้งานได้โดยไม่ต้องแปลงทั้งไฟล์ทันที
window.FirebaseService = {
  saveProduction,
  saveInvoice,
  saveQuote,
  saveReceipt,
  saveExpense,
  loadCollectionByYear,
  loadAllDashboardDataByYear
};
