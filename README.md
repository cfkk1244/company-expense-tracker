# Comform Esan ERP — Flat GitHub Ready

ชุดนี้ถูกจัดเป็น “ไฟล์แบน” ทั้งหมดไว้ที่ root เพื่อให้คุณอัปขึ้น GitHub ทีละไฟล์ได้โดยไม่ต้องสร้างโฟลเดอร์ `css/`, `js/`, `assets/` หรือ `backup/`

## ใช้ไฟล์ไหน

```text
index.html                     ใช้ดู UI / ใช้งานระบบแบบ localStorage เดิม
index.firebase.html            ใช้เมื่อพร้อมเชื่อม Firebase + Dashboard จาก Firestore
style.css                      CSS ของเว็บ
app.js                         JavaScript ระบบหลัก
firebase-bridge.js             เชื่อม Firestore + Storage
firebase-dashboard.js          โหลดข้อมูล Firebase มาแสดงกราฟ Dashboard
firebase.config.js             config แบบปลอดภัย อ่านค่าจาก Vercel Environment Variables
firebase.config.example.js     ไฟล์ตัวอย่าง config
firebase.example.js            ตัวอย่างโค้ด Firebase แบบเก่า
logo.png                       โลโก้บริษัท
index_original_unchanged.html  ไฟล์ต้นฉบับเดิม
index_before_split.html        ไฟล์ก่อนแยกโค้ด
package.json                   สำหรับ Vite/Vercel
vite.config.js                 ตั้งค่า Vite
.env.example                   ตัวอย่างชื่อ Environment Variables
.gitignore                     ไฟล์กัน secret/ไฟล์ build
```

## วิธีดู UI ก่อน

เปิด `index.html` หรือ deploy ผ่าน Vercel ได้เลย โดยยังไม่ต้องใส่ Firebase จริง

## วิธีใช้ Firebase

1. สร้าง Firebase Project
2. เปิด Firestore และ Storage
3. เพิ่ม Web App ใน Firebase Console
4. นำค่ามาใส่ใน Vercel > Project Settings > Environment Variables

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

5. ใช้ `index.firebase.html`

## การอัปขึ้น GitHub แบบไฟล์แบน

ให้อัปไฟล์ทั้งหมดนี้ไว้หน้า root ของ repo เดียวกัน ห้ามเปลี่ยนชื่อไฟล์สำคัญ เช่น:

```text
index.html
style.css
app.js
logo.png
firebase-bridge.js
firebase-dashboard.js
firebase.config.js
```

เพราะ `index.html` จะเรียกไฟล์จากชื่อเหล่านี้โดยตรง

## Vercel

```bash
npm install
npm run dev
```

ตอน Deploy:

```text
Build Command: npm run build
Output Directory: dist
```

## ความปลอดภัย

ไฟล์นี้ไม่มี API Firebase จริง มีแต่ placeholder และอ่านค่าจาก Environment Variables

ห้ามอัปไฟล์เหล่านี้หากมีค่าจริง:

```text
.env
.env.local
serviceAccountKey.json
ไฟล์ Backup JSON ข้อมูลจริง
Excel / PDF / รูปหลักฐานจริงของลูกค้า
```

แนะนำให้ใช้ GitHub Private
