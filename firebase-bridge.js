import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseConfig } from "./firebase.config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

function safeFileName(name = "file") {
  return name.replace(/[\\/:*?"<>|#%{}^~`\[\]]/g, "_");
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return await response.blob();
}

async function uploadProductionFiles(record) {
  const files = record.attachments || [];
  const uploaded = [];

  for (const file of files) {
    const blob = await dataUrlToBlob(file.data);
    const path = `productions/${record.branch}/${record.no}/${Date.now()}-${safeFileName(file.name)}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob, { contentType: file.type || "application/octet-stream" });
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

async function saveProduction(record) {
  const uploadedFiles = await uploadProductionFiles(record);

  const payload = {
    ...record,
    attachments: uploadedFiles,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  return await addDoc(collection(db, "productions"), payload);
}

window.FirebaseService = {
  saveProduction
};
