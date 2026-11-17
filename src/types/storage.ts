import { Employee } from './employee';
import { MonthlyAttendance, Adjustments } from './attendance';
import { CompanyProfile } from './organization';
import { LegalConfig } from './legal';

export interface AppWorkspaceState {
  version: string;
  savedAt: string;
  selectedMonth: string;
  companyProfile: CompanyProfile;
  employees: Employee[];
  attendanceMap: Record<string, MonthlyAttendance>;
  adjustmentsMap: Record<string, Adjustments>;
  departments: string[];
  ranks: string[];
  customLegalConfig: LegalConfig | null;
}

export interface EncryptedVaultRecord {
  id: string; // 'primary_profile'
  profileName: string;
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2-SHA256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  ciphertextHex: string;
  updatedAt: string;
  dataLength: number;
}

export interface DopiGrBackupFile {
  format: 'DopiGRIncome_Encrypted_Backup';
  version: '1.0';
  exportedAt: string;
  profileName: string;
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2-SHA256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  ciphertextHex: string;
  checksum?: string;
}

export interface StoredProfileRecord {
  id: string; // 'primary_profile'
  isEncrypted: boolean;
  updatedAt: string;
  // If encrypted:
  profileName?: string;
  algorithm?: 'AES-256-GCM';
  keyDerivation?: 'PBKDF2-SHA256';
  iterations?: number;
  saltHex?: string;
  ivHex?: string;
  ciphertextHex?: string;
  dataLength?: number;
  // If standard local auto-save (no password):
  plainWorkspace?: AppWorkspaceState;
}

export type StorageStatus =
  | 'unconfigured' // Chưa có dữ liệu
  | 'locked'       // Hồ sơ có mật khẩu đang bị khóa
  | 'unlocked'     // Hồ sơ có mật khẩu đã mở khóa
  | 'saving'       // Đang lưu vào IndexedDB
  | 'saved'        // Đã lưu an toàn trên thiết bị
  | 'error';       // Lỗi khi lưu
