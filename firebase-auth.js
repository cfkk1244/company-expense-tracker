// =====================================================================
// firebase-auth.js — ระบบ Login สำหรับ Comform Esan ERP
// =====================================================================
// ไฟล์นี้ใช้คู่กับ index.firebase.html เท่านั้น
// ทำหน้าที่:
//   1. แสดงหน้าจอ Login ก่อนเข้าใช้งานระบบ
//   2. ตรวจสอบ Email/Password ผ่าน Firebase Authentication
//   3. โหลดโปรไฟล์ผู้ใช้จาก Firestore (collection "users") เพื่อรู้ว่าอยู่สาขาไหน
//   4. ล็อกหน้าจอจนกว่าจะ login สำเร็จ และมีปุ่มออกจากระบบ
//
// ข้อกำหนด: ต้องสร้างบัญชีผู้ใช้ใน Firebase Console > Authentication > Users
// และสร้างเอกสารคู่กันใน Firestore collection "users" โดยใช้ uid เดียวกันเป็น Document ID
// ตัวอย่างเอกสาร: { branch: "khonkaen", displayName: "พนักงานขอนแก่น" }
// บัญชีแอดมินที่เห็นทุกสาขาให้ตั้ง branch เป็น "all"
// =====================================================================

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "./firebase.config.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentProfile = null;

function injectLoginStyles() {
  if (document.getElementById("auth-style")) return;
  const style = document.createElement("style");
  style.id = "auth-style";
  style.textContent = `
    #auth-overlay{position:fixed;inset:0;background:#eef4fb;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem}
    #auth-box{background:#fff;border-radius:18px;box-shadow:0 10px 30px rgba(15,23,42,.12);padding:2.25rem 2rem;width:100%;max-width:380px;text-align:center}
    #auth-box img{width:64px;height:64px;object-fit:contain;margin-bottom:.75rem}
    #auth-box h1{font-size:18px;font-weight:800;color:#0f172a;margin-bottom:4px}
    #auth-box p.sub{font-size:13px;color:#64748b;margin-bottom:1.5rem}
    #auth-box input{width:100%;padding:12px 14px;border:1px solid #d1d9e6;border-radius:10px;font-size:15px;margin-bottom:12px;background:#fff}
    #auth-box input:focus{outline:none;border-color:#1d4ed8;box-shadow:0 0 0 4px rgba(29,78,216,.08)}
    #auth-box button{width:100%;padding:12px;border-radius:10px;border:none;background:#1d4ed8;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px}
    #auth-box button:hover{background:#1741a6}
    #auth-box button:disabled{opacity:.6;cursor:not-allowed}
    #auth-error{color:#b91c1c;font-size:13px;margin-top:10px;min-height:18px}
    #auth-userbar{position:fixed;top:10px;right:14px;z-index:400;background:#fff;border:1px solid #dbe4ef;border-radius:20px;padding:6px 14px;font-size:13px;color:#334155;display:flex;align-items:center;gap:10px;box-shadow:0 2px 6px rgba(15,23,42,.08)}
    #auth-userbar button{border:none;background:#fef2f2;color:#b91c1c;font-size:12px;font-weight:700;padding:5px 10px;border-radius:8px;cursor:pointer}
    #app-content{display:none}
  `;
  document.head.appendChild(style);
}

function renderLoginScreen() {
  injectLoginStyles();
  const overlay = document.createElement("div");
  overlay.id = "auth-overlay";
  overlay.innerHTML = `
    <div id="auth-box">
      <img src="logo.png" alt="Comform Esan">
      <h1>บริษัท คอมฟอร์มอีสาน จำกัด</h1>
      <p class="sub">เข้าสู่ระบบเพื่อใช้งาน — Comform Esan ERP</p>
      <input type="email" id="auth-email" placeholder="อีเมลพนักงาน" autocomplete="username">
      <input type="password" id="auth-password" placeholder="รหัสผ่าน" autocomplete="current-password">
      <button id="auth-submit">เข้าสู่ระบบ</button>
      <div id="auth-error"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const submitBtn = document.getElementById("auth-submit");
  const emailInput = document.getElementById("auth-email");
  const passInput = document.getElementById("auth-password");
  const errorBox = document.getElementById("auth-error");

  async function doLogin() {
    const email = emailInput.value.trim();
    const password = passInput.value;
    if (!email || !password) {
      errorBox.textContent = "กรุณากรอกอีเมลและรหัสผ่าน";
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "กำลังเข้าสู่ระบบ...";
    errorBox.textContent = "";
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged ด้านล่างจะจัดการขั้นตอนถัดไปเอง
    } catch (err) {
      errorBox.textContent = mapAuthError(err.code);
      submitBtn.disabled = false;
      submitBtn.textContent = "เข้าสู่ระบบ";
    }
  }

  submitBtn.addEventListener("click", doLogin);
  passInput.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
}

function mapAuthError(code) {
  const map = {
    "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
    "auth/user-disabled": "บัญชีนี้ถูกระงับการใช้งาน",
    "auth/user-not-found": "ไม่พบบัญชีผู้ใช้นี้",
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/too-many-requests": "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่"
  };
  return map[code] || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

function removeLoginScreen() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.remove();
}

function renderUserBar(profile, email) {
  let bar = document.getElementById("auth-userbar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "auth-userbar";
    document.body.appendChild(bar);
  }
  const branchLabel = profile?.branch === "all"
    ? "ผู้ดูแลระบบ (ทุกสาขา)"
    : profile?.branch === "khonkaen"
      ? "สาขาขอนแก่น"
      : profile?.branch === "ubon"
        ? "สาขาอุบล"
        : "ไม่ระบุสาขา";
  bar.innerHTML = `
    <span>👤 ${profile?.displayName || email} · ${branchLabel}</span>
    <button id="auth-logout-btn">ออกจากระบบ</button>
  `;
  document.getElementById("auth-logout-btn").addEventListener("click", () => signOut(auth));
}

function showApp() {
  const content = document.getElementById("app-content");
  if (content) content.style.display = "";
}

function hideApp() {
  const content = document.getElementById("app-content");
  if (content) content.style.display = "none";
  const bar = document.getElementById("auth-userbar");
  if (bar) bar.remove();
}

async function loadUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentProfile = null;
    hideApp();
    if (!document.getElementById("auth-overlay")) renderLoginScreen();
    return;
  }

  try {
    const profile = await loadUserProfile(user.uid);
    if (!profile) {
      document.getElementById("auth-error") &&
        (document.getElementById("auth-error").textContent =
          "บัญชีนี้ยังไม่ได้ผูกสาขา กรุณาติดต่อผู้ดูแลระบบ");
      await signOut(auth);
      return;
    }
    currentProfile = { uid: user.uid, email: user.email, ...profile };
    window.CurrentUser = currentProfile;
    removeLoginScreen();
    renderUserBar(profile, user.email);
    showApp();
    window.dispatchEvent(new CustomEvent("comform-auth-ready", { detail: currentProfile }));
  } catch (err) {
    console.error("โหลดโปรไฟล์ผู้ใช้ล้มเหลว:", err);
    hideApp();
  }
});

// แสดงหน้า Login ทันทีตอนเริ่มโหลดหน้าเว็บ ก่อนรู้สถานะ login
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("auth-overlay")) renderLoginScreen();
  });
} else {
  renderLoginScreen();
}

window.ComformAuth = { auth, getCurrentProfile: () => currentProfile };
