import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  ADMIN_EMAILS,
  DEFAULT_LICENSE_SETTINGS,
  DEFAULT_PURCHASE_URL,
  ExternalApiVerifyResult,
  LicenseEvaluation,
  LicenseKeyDoc,
  LicenseSettingsDoc,
  UserProfileDoc
} from '../types/license';

const KEY_REGEX = /^[A-Z0-9_-]{4,64}$/;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}

export function normalizeLicenseKey(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/g, '');
}

export function isValidLicenseKeyFormat(key: string): boolean {
  return KEY_REGEX.test(key);
}

export function computeExpiresAtIso(durationDays: number, fromDate: Date = new Date()): string {
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return '';
  }
  const ms = fromDate.getTime() + Math.floor(durationDays) * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

export function evaluateLicenseStatus(
  profile: UserProfileDoc | null,
  now: Date = new Date()
): LicenseEvaluation {
  if (!profile) {
    return {
      isActive: false,
      isAdmin: false,
      reason: 'missing',
      daysRemaining: null,
      expiresAt: '',
      plan: '',
      licenseKey: ''
    };
  }

  const adminFlag = profile.role === 'admin' || isAdminEmail(profile.email);
  if (adminFlag) {
    return {
      isActive: true,
      isAdmin: true,
      reason: 'admin',
      daysRemaining: null,
      expiresAt: profile.licenseExpiresAt || '',
      plan: profile.licensePlan || 'Quản trị viên',
      licenseKey: profile.licenseKey || ''
    };
  }

  if (!profile.licenseKey || profile.licenseKey.trim().length < 4) {
    return {
      isActive: false,
      isAdmin: false,
      reason: 'missing',
      daysRemaining: null,
      expiresAt: '',
      plan: '',
      licenseKey: ''
    };
  }

  if (profile.licenseRevoked) {
    return {
      isActive: false,
      isAdmin: false,
      reason: 'revoked',
      daysRemaining: 0,
      expiresAt: profile.licenseExpiresAt || '',
      plan: profile.licensePlan || '',
      licenseKey: profile.licenseKey
    };
  }

  if (!profile.licenseExpiresAt) {
    return {
      isActive: true,
      isAdmin: false,
      reason: 'ok',
      daysRemaining: null,
      expiresAt: '',
      plan: profile.licensePlan || 'Vĩnh viễn',
      licenseKey: profile.licenseKey
    };
  }

  const expiresMs = Date.parse(profile.licenseExpiresAt);
  if (Number.isNaN(expiresMs)) {
    return {
      isActive: false,
      isAdmin: false,
      reason: 'expired',
      daysRemaining: 0,
      expiresAt: profile.licenseExpiresAt,
      plan: profile.licensePlan || '',
      licenseKey: profile.licenseKey
    };
  }

  const diffMs = expiresMs - now.getTime();
  if (diffMs <= 0) {
    return {
      isActive: false,
      isAdmin: false,
      reason: 'expired',
      daysRemaining: 0,
      expiresAt: profile.licenseExpiresAt,
      plan: profile.licensePlan || '',
      licenseKey: profile.licenseKey
    };
  }

  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return {
    isActive: true,
    isAdmin: false,
    reason: 'ok',
    daysRemaining,
    expiresAt: profile.licenseExpiresAt,
    plan: profile.licensePlan || 'Bản quyền tiêu chuẩn',
    licenseKey: profile.licenseKey
  };
}

export function generateRandomLicenseKey(prefix = 'DOPI'): string {
  const cleanPrefix = normalizeLicenseKey(prefix || 'DOPI').slice(0, 12) || 'DOPI';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = (len: number) => {
    let out = '';
    const bytes = new Uint8Array(len);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    for (let i = 0; i < len; i++) {
      out += chars[bytes[i] % chars.length];
    }
    return out;
  };
  return `${cleanPrefix}-${chunk(4)}-${chunk(4)}-${chunk(4)}`;
}

export async function verifyKeyViaEduTechApi(
  normalizedKey: string,
  user: { uid: string; email: string | null },
  settings: LicenseSettingsDoc,
  fetchImpl: typeof fetch = fetch
): Promise<ExternalApiVerifyResult> {
  const endpoint = settings.apiEndpointUrl.trim();
  if (!endpoint) {
    return {
      valid: false,
      plan: '',
      durationDays: 0,
      expiresAt: '',
      message: 'Chưa cấu hình đường dẫn API kiểm tra key từ EduTech-Hub.'
    };
  }

  try {
    let response: Response;
    if (settings.apiMethod === 'GET') {
      const url = new URL(endpoint);
      url.searchParams.set('key', normalizedKey);
      url.searchParams.set('uid', user.uid);
      if (user.email) url.searchParams.set('email', user.email);
      url.searchParams.set('app', 'dopi-grincome');
      response = await fetchImpl(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
    } else {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          key: normalizedKey,
          uid: user.uid,
          email: user.email || '',
          app: 'dopi-grincome'
        })
      });
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await response.json()) as Record<string, unknown>;
    } catch {
      payload = {};
    }

    const isValidFlag =
      response.ok &&
      (payload.valid === true ||
        payload.ok === true ||
        payload.success === true ||
        payload.status === 'valid' ||
        payload.status === 'active');

    if (!isValidFlag) {
      const msg =
        typeof payload.message === 'string' && payload.message.trim()
          ? payload.message
          : typeof payload.error === 'string' && payload.error.trim()
            ? payload.error
            : `Mã key không hợp lệ hoặc bị từ chối bởi API EduTech-Hub (HTTP ${response.status}).`;
      return {
        valid: false,
        plan: '',
        durationDays: 0,
        expiresAt: '',
        message: msg
      };
    }

    const rawDuration = Number(payload.durationDays ?? payload.days ?? 0);
    const durationDays = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.floor(rawDuration) : 0;

    let expiresAt = '';
    if (typeof payload.expiresAt === 'string' && payload.expiresAt.trim()) {
      const parsed = Date.parse(payload.expiresAt);
      if (!Number.isNaN(parsed)) {
        expiresAt = new Date(parsed).toISOString();
      }
    } else if (durationDays > 0) {
      expiresAt = computeExpiresAtIso(durationDays);
    }

    const plan =
      typeof payload.plan === 'string' && payload.plan.trim()
        ? payload.plan.trim().slice(0, 64)
        : durationDays > 0
          ? `Gói ${durationDays} ngày (EduTech-Hub)`
          : 'Bản quyền vĩnh viễn (EduTech-Hub)';

    return {
      valid: true,
      plan,
      durationDays,
      expiresAt,
      message: typeof payload.message === 'string' ? payload.message : undefined
    };
  } catch (err) {
    return {
      valid: false,
      plan: '',
      durationDays: 0,
      expiresAt: '',
      message: `Không thể kết nối API EduTech-Hub (${err instanceof Error ? err.message : 'Lỗi mạng / CORS'}).`
    };
  }
}

export async function ensureUserProfile(user: User): Promise<UserProfileDoc> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfileDoc;
    }

    const adminFlag = isAdminEmail(user.email) && user.emailVerified;
    const newProfile: UserProfileDoc = {
      uid: user.uid,
      email: (user.email || '').slice(0, 254),
      displayName: (user.displayName || user.email?.split('@')[0] || 'Người dùng').slice(0, 120),
      role: adminFlag ? 'admin' : 'user',
      licenseKey: '',
      licensePlan: '',
      licenseSource: 'none',
      licenseActivatedAt: '',
      licenseExpiresAt: '',
      licenseRevoked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getLicenseSettings(): Promise<LicenseSettingsDoc> {
  const path = 'appConfig/licenseSettings';
  try {
    const snap = await getDoc(doc(db, 'appConfig', 'licenseSettings'));
    if (!snap.exists()) {
      return { ...DEFAULT_LICENSE_SETTINGS };
    }
    const data = snap.data() as Partial<LicenseSettingsDoc>;
    return {
      verificationMode: data.verificationMode || 'firestore_only',
      apiEndpointUrl: data.apiEndpointUrl || '',
      apiMethod: data.apiMethod || 'POST',
      purchaseUrl: data.purchaseUrl || DEFAULT_PURCHASE_URL,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveLicenseSettings(
  settings: Omit<LicenseSettingsDoc, 'updatedAt'>
): Promise<void> {
  const path = 'appConfig/licenseSettings';
  try {
    await setDoc(doc(db, 'appConfig', 'licenseSettings'), {
      verificationMode: settings.verificationMode,
      apiEndpointUrl: settings.apiEndpointUrl.trim().slice(0, 500),
      apiMethod: settings.apiMethod,
      purchaseUrl: (settings.purchaseUrl.trim() || DEFAULT_PURCHASE_URL).slice(0, 500),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function activateLicenseKeyForUser(
  rawKey: string,
  user: User
): Promise<{ plan: string; expiresAt: string; source: 'edutech_api' | 'firestore_store' }> {
  const normalizedKey = normalizeLicenseKey(rawKey);
  if (!isValidLicenseKeyFormat(normalizedKey)) {
    throw new Error('Mã key không đúng định dạng (chỉ gồm chữ cái, số, dấu gạch ngang, từ 4–64 ký tự).');
  }

  const settings = await getLicenseSettings();
  const keyRef = doc(db, 'licenseKeys', normalizedKey);
  const userRef = doc(db, 'users', user.uid);
  const nowIso = new Date().toISOString();

  // Step 1: Check existing key ledger in Firestore (also protects against duplicate activation)
  let existingKeySnap;
  try {
    existingKeySnap = await getDoc(keyRef);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('insufficient')) {
      throw new Error('Mã key này đã được kích hoạt cho một tài khoản khác hoặc không khả dụng.');
    }
    handleFirestoreError(err, OperationType.GET, `licenseKeys/${normalizedKey}`);
  }

  if (existingKeySnap.exists()) {
    const existing = existingKeySnap.data() as LicenseKeyDoc;

    if (existing.status === 'revoked') {
      throw new Error('Mã key này đã bị thu hồi. Vui lòng liên hệ hỗ trợ hoặc mua key mới tại EduTech-Hub.');
    }

    if (existing.status === 'active') {
      if (existing.assignedUid !== user.uid) {
        throw new Error('Mã key này đã được sử dụng cho một tài khoản khác (mỗi key chỉ áp dụng cho 1 tài khoản).');
      }
      // Already assigned to this exact user — check expiry
      if (existing.expiresAt && Date.parse(existing.expiresAt) <= Date.now()) {
        throw new Error('Mã key của bạn đã hết hạn sử dụng. Vui lòng mua key gia hạn mới tại EduTech-Hub.');
      }
      return {
        plan: existing.plan,
        expiresAt: existing.expiresAt,
        source: existing.source
      };
    }

    // Status is 'available' in Firestore store
    if (settings.verificationMode === 'api_only') {
      throw new Error('Hệ thống đang ở chế độ chỉ xác thực qua API EduTech-Hub.');
    }

    const expiresAt = computeExpiresAtIso(existing.durationDays);
    const batch = writeBatch(db);
    batch.update(keyRef, {
      status: 'active',
      assignedUid: user.uid,
      assignedEmail: (user.email || '').slice(0, 254),
      activatedAt: nowIso,
      expiresAt,
      updatedAt: serverTimestamp()
    });
    batch.update(userRef, {
      licenseKey: normalizedKey,
      licensePlan: existing.plan,
      licenseSource: existing.source,
      licenseActivatedAt: nowIso,
      licenseExpiresAt: expiresAt,
      licenseRevoked: false,
      updatedAt: serverTimestamp()
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `licenseKeys/${normalizedKey}`);
    }

    return {
      plan: existing.plan,
      expiresAt,
      source: existing.source
    };
  }

  // Step 2: Key is not pre-seeded in Firestore — verify against EduTech-Hub API if enabled
  if (settings.verificationMode === 'firestore_only' || !settings.apiEndpointUrl.trim()) {
    throw new Error(
      'Mã key không tồn tại trong hệ thống. Vui lòng kiểm tra lại mã key hoặc mua key chính thức tại EduTech-Hub.'
    );
  }

  const apiResult = await verifyKeyViaEduTechApi(normalizedKey, user, settings);
  if (!apiResult.valid) {
    throw new Error(apiResult.message || 'Mã key không hợp lệ trên hệ thống EduTech-Hub.');
  }

  if (apiResult.expiresAt && Date.parse(apiResult.expiresAt) <= Date.now()) {
    throw new Error('Mã key này đã hết hạn sử dụng trên hệ thống EduTech-Hub.');
  }

  const batch = writeBatch(db);
  batch.set(keyRef, {
    key: normalizedKey,
    plan: apiResult.plan.slice(0, 64),
    durationDays: apiResult.durationDays,
    status: 'active',
    assignedUid: user.uid,
    assignedEmail: (user.email || '').slice(0, 254),
    activatedAt: nowIso,
    expiresAt: apiResult.expiresAt,
    source: 'edutech_api',
    note: 'Kích hoạt qua API EduTech-Hub',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.update(userRef, {
    licenseKey: normalizedKey,
    licensePlan: apiResult.plan.slice(0, 64),
    licenseSource: 'edutech_api',
    licenseActivatedAt: nowIso,
    licenseExpiresAt: apiResult.expiresAt,
    licenseRevoked: false,
    updatedAt: serverTimestamp()
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `licenseKeys/${normalizedKey}`);
  }

  return {
    plan: apiResult.plan,
    expiresAt: apiResult.expiresAt,
    source: 'edutech_api'
  };
}

export async function adminListLicenseKeys(): Promise<LicenseKeyDoc[]> {
  const path = 'licenseKeys';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LicenseKeyDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminCreateLicenseKeys(params: {
  count: number;
  prefix?: string;
  customKeys?: string[];
  plan: string;
  durationDays: number;
  note: string;
}): Promise<string[]> {
  const keysToCreate: string[] = [];
  if (params.customKeys && params.customKeys.length > 0) {
    for (const raw of params.customKeys) {
      const norm = normalizeLicenseKey(raw);
      if (isValidLicenseKeyFormat(norm) && !keysToCreate.includes(norm)) {
        keysToCreate.push(norm);
      }
    }
  } else {
    const count = Math.min(Math.max(1, Math.floor(params.count)), 50);
    for (let i = 0; i < count; i++) {
      let candidate = generateRandomLicenseKey(params.prefix);
      while (keysToCreate.includes(candidate)) {
        candidate = generateRandomLicenseKey(params.prefix);
      }
      keysToCreate.push(candidate);
    }
  }

  if (keysToCreate.length === 0) {
    throw new Error('Không có mã key hợp lệ nào để tạo.');
  }

  const batch = writeBatch(db);
  const safePlan = (params.plan.trim() || 'Bản quyền Dopi GRIncome').slice(0, 64);
  const safeDuration = Number.isFinite(params.durationDays) && params.durationDays > 0
    ? Math.min(36500, Math.floor(params.durationDays))
    : 0;
  const safeNote = (params.note || '').trim().slice(0, 200);

  for (const keyId of keysToCreate) {
    const ref = doc(db, 'licenseKeys', keyId);
    batch.set(ref, {
      key: keyId,
      plan: safePlan,
      durationDays: safeDuration,
      status: 'available',
      assignedUid: '',
      assignedEmail: '',
      activatedAt: '',
      expiresAt: '',
      source: 'firestore_store',
      note: safeNote,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  try {
    await batch.commit();
    return keysToCreate;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'licenseKeys');
  }
}

export async function adminSetKeyRevoked(
  keyId: string,
  revoked: boolean,
  assignedUid?: string
): Promise<void> {
  const batch = writeBatch(db);
  const keyRef = doc(db, 'licenseKeys', keyId);
  batch.update(keyRef, {
    status: revoked ? 'revoked' : assignedUid ? 'active' : 'available',
    updatedAt: serverTimestamp()
  });

  if (assignedUid) {
    const userRef = doc(db, 'users', assignedUid);
    batch.update(userRef, {
      licenseRevoked: revoked,
      updatedAt: serverTimestamp()
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `licenseKeys/${keyId}`);
  }
}

export async function adminUpdateUserDisplayName(uid: string, displayName: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: displayName.trim().slice(0, 120),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminListUsers(): Promise<UserProfileDoc[]> {
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfileDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
