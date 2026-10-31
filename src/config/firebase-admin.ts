import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized with custom service account JSON.');
    } else {
      // Do NOT fall back to application default credentials: on a local dev machine
      // there are none, which crashes the process. Leave Admin uninitialized so the
      // server can still boot; endpoints that need Admin will return 503 until a
      // service account JSON is provided in FIREBASE_SERVICE_ACCOUNT_JSON.
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase Admin disabled (local dev without service account).');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export const adminDb = getApps().length ? getFirestore() : null;
export const adminAuth = getApps().length ? getAuth() : null;
