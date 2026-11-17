import { EncryptedVaultRecord, StoredProfileRecord, AppWorkspaceState } from '../types/storage';

const DB_NAME = 'dopi_grincome_db';
const DB_VERSION = 1;
const STORE_NAME = 'vault';
const PRIMARY_KEY = 'primary_profile';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Không thể mở IndexedDB: ${request.error?.message}`));
    };
  });
}

/**
 * Kiểm tra xem trên thiết bị hiện tại đã có hồ sơ (mã hóa hoặc tiêu chuẩn) lưu trong IndexedDB chưa
 */
export async function hasStoredProfile(): Promise<boolean> {
  try {
    const record = await getStoredProfile();
    return record !== null;
  } catch {
    return false;
  }
}

/**
 * Đọc bản ghi hồ sơ từ IndexedDB
 */
export async function getStoredProfile(): Promise<StoredProfileRecord | EncryptedVaultRecord | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(PRIMARY_KEY);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`Lỗi khi đọc hồ sơ từ IndexedDB: ${request.error?.message}`));
    };
  });
}

/**
 * Ghi bản ghi hồ sơ đã mã hóa vào IndexedDB.
 * Chỉ hoàn tất khi transaction 'complete' (đảm bảo dữ liệu đã ghi thành công).
 */
export async function saveEncryptedProfile(record: EncryptedVaultRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const toSave: StoredProfileRecord = {
      ...record,
      id: PRIMARY_KEY,
      isEncrypted: true,
      updatedAt: record.updatedAt || new Date().toISOString()
    };
    store.put(toSave);

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(new Error(`Lỗi khi ghi hồ sơ vào IndexedDB: ${tx.error?.message}`));
    };

    tx.onabort = () => {
      reject(new Error('Giao dịch ghi IndexedDB đã bị hủy.'));
    };
  });
}

/**
 * Tự động lưu không gian làm việc cục bộ tiêu chuẩn (không bắt buộc mật khẩu)
 */
export async function saveStandardWorkspace(workspace: AppWorkspaceState): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const toSave: StoredProfileRecord = {
      id: PRIMARY_KEY,
      isEncrypted: false,
      updatedAt: new Date().toISOString(),
      plainWorkspace: workspace
    };
    store.put(toSave);

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(new Error(`Lỗi khi ghi dữ liệu vào IndexedDB: ${tx.error?.message}`));
    };

    tx.onabort = () => {
      reject(new Error('Giao dịch ghi IndexedDB đã bị hủy.'));
    };
  });
}

/**
 * Xóa sạch hồ sơ khỏi IndexedDB
 */
export async function deleteStoredProfile(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(PRIMARY_KEY);

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(new Error(`Lỗi khi xóa hồ sơ khỏi IndexedDB: ${tx.error?.message}`));
    };
  });
}

