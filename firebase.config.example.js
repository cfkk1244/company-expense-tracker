// ตัวอย่าง Firebase config สำหรับโปรเจกต์แบบไฟล์แบน (อัปขึ้น GitHub ทีละไฟล์)
// ไฟล์นี้ไม่มี API จริง ถ้าต้องใช้ Firebase จริงให้ใส่ค่าใน Vercel Environment Variables
// หรือสร้าง .env.local ในเครื่องตาม .env.example
//
// หมายเหตุ: ค่า VITE_* จะถูกนำไปใช้ฝั่ง Browser ได้ จึงห้ามใส่ secret เช่น serviceAccountKey

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};
