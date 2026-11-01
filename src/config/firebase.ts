import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Firebase web config. Values may be overridden via VITE_FIREBASE_* env vars;
// fall back to the project defaults so the app keeps working out of the box.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDIY2-sZQ65l4WNmWebAnxJOgOLqyE2yZk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bersamakita-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bersamakita-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bersamakita-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "101620394048",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:101620394048:web:ddeccfeaf644c24b2d57a5",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// NOTE: Firebase Storage TIDAK diinisialisasi di sini. Dulu `getStorage(app)`
// dieksekusi saat import dan melempar "Access to storage is not allowed from
// this context." di lingkungan tanpa indexedDB (iframe/sandbox). Semua upload
// (bukti penyaluran, foto) sudah via Cloudinary (server). Jika kelak butuh
// Storage, inisialisasi LAZY tepat di modul yang memakainya.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test Firestore connection on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info("Firestore connected successfully to project bersamakita-app");
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Harap periksa koneksi atau konfigurasi Firebase.");
    }
    return false;
  }
}
