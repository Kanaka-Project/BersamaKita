import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../config/firebase';
import { UserProfile, UserRole } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { safeSet, safeRemove, isStorageBlockedError, STORAGE_BLOCKED_MESSAGE } from '../../lib/safe-storage';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  providerId?: string;
}

// Google Login: STRICTLY FOR USER / DONATUR ONLY per user instruction.
// POPUP MURNI — tidak ada fallback redirect. Jika popup gagal (mis.
// `auth/popup-blocked`), kegagalan dibiarkan gagal dengan pesan jujur ke UI
// agar user mengizinkan pop-up untuk situs ini. TIDAK ADA sesi fiktif
// "Donatur Google". Keputusan owner: lupakan auth pakai redirect.
export async function loginWithGoogle(): Promise<{ user: AppUser; profile: UserProfile }> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    // Do not force 'user' role so that Google Admin (contohasdf@gmail.com) gets their proper admin role
    const profile = await syncUserProfile(fbUser);
    const appUser: AppUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      providerId: 'google.com',
    };
    safeSet('bersamakita_local_user', JSON.stringify({ user: appUser, profile }));
    return { user: appUser, profile };
  } catch (error: any) {
    console.warn('Google Sign In Notice:', error?.code, error?.message);
    throw new Error(googleSignInErrorMessage(error));
  }
}

/** Pesan error Google Sign-In yang ramah pengguna (bukan error mentah). */
export function googleSignInErrorMessage(error: any): string {
  if (isStorageBlockedError(error)) {
    return STORAGE_BLOCKED_MESSAGE;
  }
  const code = error?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Domain situs ini belum terdaftar untuk Google Sign-In. Hubungi admin Bersama Kita.';
    case 'auth/popup-blocked':
      return 'Pop-up Google diblokir browser. Izinkan pop-up untuk situs ini, lalu coba lagi.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Login Google dibatalkan.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google Sign-In tidak didukung di lingkungan ini (kemungkinan dibuka di panel preview/iframe). Buka di jendela browser penuh.';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan metode masuk lain.';
    case 'auth/network-request-failed':
      return 'Koneksi jaringan bermasalah. Periksa internet lalu coba lagi.';
    default:
      return code ? `Google Sign-In gagal (${code}). Silakan coba lagi.` : 'Google Sign-In gagal. Silakan coba lagi.';
  }
}

// Email Login: Required for Admin and Partner
export async function loginWithEmail(email: string, pass: string): Promise<{ user: AppUser; profile: UserProfile }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Role is resolved from the Firestore user document (and env allow-list),
  // never from password literals or email substrings.
  let assignedRole: UserRole = staffRoleForEmail(normalizedEmail);
  let defaultDisplayName = 'Pengguna';
  if (assignedRole === 'admin') defaultDisplayName = 'Admin Bersama Kita';
  else if (assignedRole === 'partner') defaultDisplayName = 'Mitra Bersama Kita (PMI/BAZNAS)';

  const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
  const fbUser = cred.user;

  const profile = await syncUserProfile(fbUser, assignedRole === 'user' ? undefined : assignedRole);
  const appUser: AppUser = {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: profile.displayName || defaultDisplayName,
    photoURL: fbUser.photoURL,
    providerId: 'password',
  };

  safeSet('bersamakita_local_user', JSON.stringify({ user: appUser, profile }));
  return { user: appUser, profile };
}

export async function registerWithEmail(
  email: string,
  pass: string,
  role: UserRole = 'user',
  name?: string
): Promise<{ user: AppUser; profile: UserProfile }> {
  const normalizedEmail = email.trim().toLowerCase();
  let assignedRole: UserRole = role;

  if (normalizedEmail === 'bersamakita.my.id@protonmail.com') {
    assignedRole = 'admin';
  } else if (normalizedEmail === 'partnerbersamakita@protonmail.com') {
    assignedRole = 'partner';
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    const fbUser = cred.user;
    const profile: UserProfile = {
      id: fbUser.uid,
      email: fbUser.email || normalizedEmail,
      displayName: name || normalizedEmail.split('@')[0] || 'Pengguna',
      role: assignedRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
    }

    const appUser: AppUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: profile.displayName,
      providerId: 'password',
    };
    safeSet('bersamakita_local_user', JSON.stringify({ user: appUser, profile }));
    return { user: appUser, profile };
  } catch (error: any) {
    const localUid = 'usr-' + Math.floor(100000 + Math.random() * 900000);
    const profile: UserProfile = {
      id: localUid,
      email: normalizedEmail,
      displayName: name || normalizedEmail.split('@')[0] || 'Pengguna',
      role: assignedRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', localUid), profile);
    } catch {
      // ignore
    }

    const appUser: AppUser = {
      uid: localUid,
      email: normalizedEmail,
      displayName: profile.displayName,
      providerId: 'password',
    };
    safeSet('bersamakita_local_user', JSON.stringify({ user: appUser, profile }));
    return { user: appUser, profile };
  }
}

/**
 * Role staf berdasarkan email — SATU sumber kebenaran, selaras dengan
 * `isAdmin()`/`isPartner()` di `firestore.rules` (3 email admin + 1 partner).
 * Dipakai oleh syncUserProfile & AuthContext agar role `users.*` untuk akun
 * staf tidak tertimpa menjadi 'user'.
 */
// Transitional default allow-lists (kept for backward compatibility so existing
// staff accounts keep working without env configuration). Move these to
// VITE_ADMIN_EMAILS / VITE_PARTNER_EMAILS and remove the defaults once all staff
// accounts have role='admin'/'partner' in Firestore.
const DEFAULT_ADMIN_EMAILS = [
  'bersamakita.my.id@protonmail.com',
  'admin_backend@bersamakita.org',
  'contohasdf@gmail.com',
];
const DEFAULT_PARTNER_EMAILS = ['partnerbersamakita@protonmail.com'];

function envList(key: string, fallback: string[]): string[] {
  const raw = (import.meta as any).env?.[key];
  if (raw && String(raw).trim()) {
    return String(raw).split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);
  }
  return fallback.map((e) => e.toLowerCase());
}

export function staffRoleForEmail(email?: string | null): 'admin' | 'partner' | 'user' {
  const normalized = (email || '').toLowerCase();
  if (!normalized) return 'user';
  if (envList('VITE_ADMIN_EMAILS', DEFAULT_ADMIN_EMAILS).includes(normalized)) return 'admin';
  if (envList('VITE_PARTNER_EMAILS', DEFAULT_PARTNER_EMAILS).includes(normalized)) return 'partner';
  return 'user';
}

export async function syncUserProfile(user: FirebaseUser | AppUser, forcedRole?: UserRole): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snapshot = await getDoc(userRef);
    const now = new Date().toISOString();

    const staffRole = staffRoleForEmail(user.email);
    const existingRole = snapshot.exists() ? (snapshot.data() as UserProfile).role : undefined;
    const isAdminEmail = staffRole === 'admin' || existingRole === 'admin';
    const isPartnerEmail = staffRole === 'partner' || existingRole === 'partner' || existingRole === 'admin';

    let initialRole: UserRole = forcedRole || staffRole || existingRole || 'user';

    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      if (isAdminEmail) {
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            email: (user.email || '').toLowerCase(),
            role: 'admin',
            createdAt: now,
          }, { merge: true });
        } catch (e) {
          console.warn('Set admin doc notice:', e);
        }
      }
      // Apply forcedRole only when it is a staff role, or when the existing
      // role is not already a staff role (never downgrade admin/partner to user).
      const canApplyForced =
        !!forcedRole &&
        (forcedRole === 'admin' || forcedRole === 'partner' || (data.role !== 'admin' && data.role !== 'partner'));
      if (canApplyForced && data.role !== forcedRole) {
        const updated = { ...data, role: forcedRole, updatedAt: now };
        await setDoc(userRef, updated, { merge: true });
        return updated;
      }
      return data;
    } else {
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Donatur',
        photoURL: user.photoURL || undefined,
        role: initialRole,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      if (isAdminEmail) {
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            email: (user.email || '').toLowerCase(),
            role: 'admin',
            createdAt: now,
          }, { merge: true });
        } catch (e) {
          console.warn('Set admin doc notice:', e);
        }
      }
      return newProfile;
    }
  } catch (error) {
    console.warn('Sync user   profile fallback without blocking:', error);
    const staffRole = staffRoleForEmail(user.email);
    const isAdminEmail = staffRole === 'admin';
    const isPartnerEmail = staffRole === 'partner';

    return {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna',
      role: forcedRole || (isAdminEmail ? 'admin' : isPartnerEmail ? 'partner' : 'user'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function logout(): Promise<void> {
  safeRemove('bersamakita_local_user');
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Sign out:', e);
  }
}

export function subscribeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
