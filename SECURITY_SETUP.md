# คู่มือติดตั้งระบบความปลอดภัย — Comform Esan ERP

ไฟล์ชุดนี้เพิ่มเข้ามา 3 อย่าง โดยไม่แก้ไขไฟล์เดิมที่ทำงานอยู่แล้วเลย:

```text
firestore.rules        กฎความปลอดภัยของฐานข้อมูล Firestore
storage.rules           กฎความปลอดภัยของ Firebase Storage (ไฟล์แนบ)
firebase-auth.js        ระบบ Login ใหม่ (ไฟล์ใหม่ ไม่แก้ของเดิม)
index.firebase.html     แก้เพิ่ม 2 จุดเท่านั้น: ห่อเนื้อหาด้วย #app-content
                         และเพิ่ม <script src="firebase-auth.js">
```

`index.html` (เวอร์ชัน localStorage อย่างเดียว) **ไม่ถูกแตะต้องเลย** ยังเปิดดูได้ตามปกติโดยไม่ต้อง login

---

## ขั้นตอนที่ 1 — เปิด Firebase Authentication

1. เข้า Firebase Console > เลือกโปรเจกต์ > เมนู Authentication > Get started
2. แท็บ Sign-in method > เปิดใช้ **Email/Password**
3. แท็บ Users > Add user > สร้างบัญชีให้พนักงานแต่ละคน เช่น
   - `khonkaen@comformesan.com` (สาขาขอนแก่น)
   - `ubon@comformesan.com` (สาขาอุบล)
   - `admin@comformesan.com` (ดูได้ทุกสาขา)
4. จด **User UID** ของแต่ละบัญชีไว้ (กดดูได้ในหน้า Users list)

## ขั้นตอนที่ 2 — สร้างโปรไฟล์ผู้ใช้ใน Firestore

1. Firebase Console > Firestore Database > Start collection
2. ตั้งชื่อ collection ว่า `users`
3. สร้างเอกสารโดยใช้ **Document ID = User UID** ที่จดไว้ตอนต้นที่ 1 (สำคัญมาก ต้องตรงกัน)
4. ใส่ฟิลด์:

```text
branch: "khonkaen"        (หรือ "ubon" หรือ "all" สำหรับแอดมิน)
displayName: "พนักงานสาขาขอนแก่น"
```

ทำซ้ำสำหรับทุกบัญชี — ผู้ใช้แต่ละคนต้องมี 1 เอกสารใน `users` ที่ Document ID ตรงกับ UID ของตัวเอง

## ขั้นตอนที่ 3 — ติดตั้ง Firestore Rules

1. Firebase Console > Firestore Database > แท็บ Rules
2. ลบกฎเดิมทั้งหมด แล้ววางเนื้อหาจากไฟล์ `firestore.rules` ที่แนบมาทั้งหมด
3. กด Publish

## ขั้นตอนที่ 4 — ติดตั้ง Storage Rules

1. Firebase Console > Storage > แท็บ Rules
2. ลบกฎเดิมทั้งหมด แล้ววางเนื้อหาจากไฟล์ `storage.rules` ที่แนบมาทั้งหมด
3. กด Publish

## ขั้นตอนที่ 5 — เพิ่มไฟล์ในโปรเจกต์

คัดลอกไฟล์เหล่านี้ไปไว้ที่ root ของโปรเจกต์ (ตำแหน่งเดียวกับ `app.js`, `style.css`):

```text
firebase-auth.js
```

แล้วแทนที่ `index.firebase.html` เดิมด้วยไฟล์ `index_firebase.html` ที่แนบมา (มีการห่อเนื้อหาด้วย `#app-content` และเพิ่ม script tag ของระบบ login แล้ว)

## ขั้นตอนที่ 6 — ทดสอบในเครื่องก่อน

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง แล้วเลือกไฟล์ `index.firebase.html` — ควรเจอหน้าจอ Login ก่อนเข้าใช้งาน ลองล็อกอินด้วยบัญชีที่สร้างไว้ ถ้าเข้าได้และเห็นข้อมูลเฉพาะสาขาตัวเอง แปลว่าระบบทำงานถูกต้อง

## ขั้นตอนที่ 7 — Push ขึ้น GitHub Private และเชื่อม Vercel

1. สร้าง repository ใหม่บน GitHub แล้วเลือก **Private**
2. Push โค้ดทั้งหมดขึ้นไป (ไฟล์ `.gitignore` กันไม่ให้ `.env` หลุดไปอยู่แล้ว)
3. เข้า vercel.com > Add New Project > Import จาก GitHub (Vercel รองรับเชื่อมกับ Private repo ได้ปกติ ไม่มีข้อจำกัด)
4. ใน Project Settings > Environment Variables ใส่ค่า Firebase จริงทั้ง 6 ตัว (`VITE_FIREBASE_API_KEY` ฯลฯ)
5. Deploy

---

## สิ่งที่ระบบนี้ป้องกันได้แล้ว

หลังทำครบทุกขั้นตอน ระบบจะป้องกัน:

- คนนอกที่ไม่มีบัญชีเข้าดูข้อมูลใด ๆ ไม่ได้เลย (ต้อง login ก่อนเสมอ)
- พนักงานสาขาขอนแก่นมองไม่เห็นข้อมูลสาขาอุบล และในทางกลับกัน
- พนักงานแก้ไข field `branch` ของเอกสารตัวเองเพื่อสวมรอยสาขาอื่นไม่ได้ (rules บล็อกไว้)
- ไฟล์แนบ (รูป/PDF) ถูกจำกัดขนาดไม่เกิน 10MB และต้องเป็นรูปภาพหรือ PDF เท่านั้น
- พนักงานเปลี่ยนสาขาตัวเองไม่ได้ (ต้องให้แอดมินแก้ผ่าน Firebase Console เท่านั้น)

## สิ่งที่ยังควรทำเพิ่มในอนาคต (ไม่จำเป็นต้องทำทันที)

- เพิ่มปุ่ม "ลืมรหัสผ่าน" (Firebase มี `sendPasswordResetEmail` ให้ใช้ได้เลย)
- จำกัดจำนวนครั้งที่พยายาม login ผิดต่อ IP (ป้องกัน brute force เพิ่มเติมนอกเหนือจาก Firebase's built-in rate limit)
- เพิ่ม Cloud Function สำหรับสร้างบัญชีพนักงานใหม่ผ่านหน้าเว็บ แทนการสร้างผ่าน Console ทุกครั้ง
