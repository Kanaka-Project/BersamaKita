// Centralized, server-side authorization helpers.
//
// Authorization is primarily role-based: after verifying the Firebase ID token
// we look up `users/{uid}.role` in Firestore. Email allow-lists are only a
// *transitional* fallback (sourced from env, with a default list for backward
// compatibility) so that legacy admin/partner accounts keep working while the
// data is being migrated to role-based access. Remove the default fallback once
// every staff account has role='admin'/'partner' in Firestore and
// ADMIN_EMAILS/PARTNER_EMAILS are configured in the environment.

const DEFAULT_ADMIN_EMAILS = [
  'admin_backend@bersamakita.org',
  'contohasdf@gmail.com',
  'bersamakita.my.id@protonmail.com',
];

const DEFAULT_PARTNER_EMAILS = [
  'partnerbersamakita@protonmail.com',
];

function envList(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return fallback.map((e) => e.toLowerCase());
}

export function adminEmailAllowlist(): string[] {
  return envList('ADMIN_EMAILS', DEFAULT_ADMIN_EMAILS);
}

export function partnerEmailAllowlist(): string[] {
  return envList('PARTNER_EMAILS', DEFAULT_PARTNER_EMAILS);
}

export async function isAdminUser(decoded: any, adminDb: any): Promise<boolean> {
  // 1. Firebase custom claim (preferred, set server-side when promoting users)
  if (decoded?.admin === true) return true;

  // 2. Firestore role
  try {
    if (adminDb && decoded?.uid) {
      const doc = await adminDb.collection('users').doc(decoded.uid).get();
      if (doc.exists && doc.data()?.role === 'admin') return true;
    }
  } catch {
    // fall through to allowlist
  }

  // 3. Transitional env/default allowlist
  const email = (decoded?.email || '').toLowerCase();
  if (email && adminEmailAllowlist().includes(email)) return true;

  return false;
}

export async function isPartnerUser(decoded: any, adminDb: any): Promise<boolean> {
  // 1. Firebase custom claim
  if (decoded?.partner === true || decoded?.admin === true) return true;

  // 2. Firestore role (admin implies partner-level access)
  try {
    if (adminDb && decoded?.uid) {
      const doc = await adminDb.collection('users').doc(decoded.uid).get();
      const role = doc.exists ? doc.data()?.role : undefined;
      if (role === 'partner' || role === 'admin') return true;
    }
  } catch {
    // fall through
  }

  // 3. Transitional env/default allowlist
  const email = (decoded?.email || '').toLowerCase();
  if (email && (partnerEmailAllowlist().includes(email) || adminEmailAllowlist().includes(email))) {
    return true;
  }

  return false;
}

export async function isPrivilegedUser(decoded: any, adminDb: any): Promise<boolean> {
  return (await isAdminUser(decoded, adminDb)) || (await isPartnerUser(decoded, adminDb));
}
