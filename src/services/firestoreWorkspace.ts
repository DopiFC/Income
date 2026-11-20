import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AppWorkspaceState } from '../types/storage';

const WORKSPACE_DOC_ID = 'primary';

/**
 * Recursively removes `undefined` keys/entries because Cloud Firestore
 * rejects documents containing `undefined` values.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

export async function loadCloudWorkspace(uid: string): Promise<AppWorkspaceState | null> {
  const path = `users/${uid}/workspaces/${WORKSPACE_DOC_ID}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'workspaces', WORKSPACE_DOC_ID));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      version: typeof data.version === 'string' ? data.version : '2.0',
      savedAt:
        typeof data.updatedAt?.toDate === 'function'
          ? data.updatedAt.toDate().toISOString()
          : new Date().toISOString(),
      selectedMonth: typeof data.selectedMonth === 'string' ? data.selectedMonth : '2026-03',
      companyProfile: data.companyProfile,
      employees: Array.isArray(data.employees) ? data.employees : [],
      attendanceMap: data.attendanceMap && typeof data.attendanceMap === 'object' ? data.attendanceMap : {},
      adjustmentsMap: data.adjustmentsMap && typeof data.adjustmentsMap === 'object' ? data.adjustmentsMap : {},
      departments: Array.isArray(data.departments) ? data.departments : [],
      ranks: Array.isArray(data.ranks) ? data.ranks : [],
      customLegalConfig: data.customLegalConfig ?? null
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudWorkspace(
  uid: string,
  state: AppWorkspaceState,
  existsInCloud: boolean
): Promise<void> {
  const path = `users/${uid}/workspaces/${WORKSPACE_DOC_ID}`;
  const ref = doc(db, 'users', uid, 'workspaces', WORKSPACE_DOC_ID);

  const safeMonth = /^[0-9]{4}-[0-9]{2}$/.test(state.selectedMonth)
    ? state.selectedMonth
    : '2026-03';

  const cleanPayload = stripUndefinedDeep({
    version: (state.version || '2.0').slice(0, 20),
    selectedMonth: safeMonth,
    companyProfile: state.companyProfile,
    employees: state.employees.slice(0, 1000),
    attendanceMap: state.attendanceMap,
    adjustmentsMap: state.adjustmentsMap,
    departments: state.departments.slice(0, 100),
    ranks: state.ranks.slice(0, 100),
    customLegalConfig: state.customLegalConfig ?? null
  });

  try {
    if (existsInCloud) {
      await updateDoc(ref, {
        ...cleanPayload,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(ref, {
        ownerUid: uid,
        ...cleanPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, existsInCloud ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function clearCloudWorkspace(uid: string): Promise<void> {
  const path = `users/${uid}/workspaces/${WORKSPACE_DOC_ID}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'workspaces', WORKSPACE_DOC_ID));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
