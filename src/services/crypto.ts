import { AppWorkspaceState, EncryptedVaultRecord, DopiGrBackupFile } from '../types/storage';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12; // 96 bits standard for AES-GCM

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Định dạng chuỗi hex không hợp lệ.');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Dẫn xuất khóa AES-256 từ mật khẩu người dùng bằng PBKDF2-SHA256
 */
async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Mã hóa dữ liệu không gian làm việc bằng AES-256-GCM
 */
export async function encryptWorkspace(
  data: AppWorkspaceState,
  password: string,
  profileName: string = 'Hồ sơ làm việc chính'
): Promise<EncryptedVaultRecord> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(jsonString);

  // Tạo salt và IV ngẫu nhiên bảo mật cao
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const key = await deriveAesKey(password, salt);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource
    },
    key,
    encodedPlaintext
  );

  return {
    id: 'primary_profile',
    profileName,
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    saltHex: bufferToHex(salt),
    ivHex: bufferToHex(iv),
    ciphertextHex: bufferToHex(ciphertextBuffer),
    updatedAt: new Date().toISOString(),
    dataLength: encodedPlaintext.length
  };
}

/**
 * Giải mã dữ liệu từ bản ghi mã hóa
 */
export async function decryptWorkspace(
  record: EncryptedVaultRecord,
  password: string
): Promise<AppWorkspaceState> {
  try {
    const salt = hexToBuffer(record.saltHex);
    const iv = hexToBuffer(record.ivHex);
    const ciphertext = hexToBuffer(record.ciphertextHex);

    const key = await deriveAesKey(password, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    const parsed = JSON.parse(jsonString) as AppWorkspaceState;
    return parsed;
  } catch (err) {
    throw new Error('Mật khẩu không chính xác hoặc dữ liệu hồ sơ đã bị thay đổi.');
  }
}

/**
 * Tạo file sao lưu mã hóa định dạng .dopigr
 */
export function createBackupFileContent(record: EncryptedVaultRecord): string {
  const backup: DopiGrBackupFile = {
    format: 'DopiGRIncome_Encrypted_Backup',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profileName: record.profileName,
    algorithm: record.algorithm,
    keyDerivation: record.keyDerivation,
    iterations: record.iterations,
    saltHex: record.saltHex,
    ivHex: record.ivHex,
    ciphertextHex: record.ciphertextHex
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Giải mã và kiểm tra tính toàn vẹn của file sao lưu .dopigr
 */
export async function restoreFromBackupFile(
  fileContent: string,
  password: string
): Promise<{ state: AppWorkspaceState; record: EncryptedVaultRecord }> {
  let parsed: any;
  try {
    parsed = JSON.parse(fileContent);
  } catch (e) {
    throw new Error('File sao lưu không đúng định dạng JSON.');
  }

  if (parsed.format !== 'DopiGRIncome_Encrypted_Backup' || !parsed.saltHex || !parsed.ivHex || !parsed.ciphertextHex) {
    throw new Error('File không phải là bản sao lưu hợp lệ của Dopi GRIncome (.dopigr).');
  }

  const record: EncryptedVaultRecord = {
    id: 'primary_profile',
    profileName: parsed.profileName || 'Hồ sơ khôi phục',
    algorithm: parsed.algorithm || 'AES-256-GCM',
    keyDerivation: parsed.keyDerivation || 'PBKDF2-SHA256',
    iterations: parsed.iterations || PBKDF2_ITERATIONS,
    saltHex: parsed.saltHex,
    ivHex: parsed.ivHex,
    ciphertextHex: parsed.ciphertextHex,
    updatedAt: parsed.exportedAt || new Date().toISOString(),
    dataLength: 0
  };

  const state = await decryptWorkspace(record, password);
  return { state, record };
}
