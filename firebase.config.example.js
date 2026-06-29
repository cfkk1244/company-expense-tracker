// วิธีใช้:
// 1) คัดลอกไฟล์นี้เป็น js/firebase.config.js
// 2) ถ้าใช้ Vercel ให้ใส่ค่าจริงใน Project Settings > Environment Variables
// 3) ถ้าทดสอบในเครื่อง ให้สร้างไฟล์ .env.local แล้วใส่ค่า VITE_FIREBASE_...
//
// หมายเหตุ: ไฟล์ js/firebase.config.js ที่ใส่ค่าจริงแล้ว ไม่ควรอัปขึ้น GitHub Public

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};
