import { describe, it, expect } from 'vitest';
import {
  encryptWorkspace,
  decryptWorkspace,
  createBackupFileContent,
  restoreFromBackupFile
} from '../services/crypto';
import { AppWorkspaceState } from '../types/storage';
import { DEFAULT_COMPANY_PROFILE } from '../types/organization';

const sampleWorkspace: AppWorkspaceState = {
  version: '1.0',
  savedAt: new Date().toISOString(),
  selectedMonth: '2026-03',
  companyProfile: {
    ...DEFAULT_COMPANY_PROFILE,
    companyName: 'Công Ty Dopi Test',
    taxCode: '0101234567'
  },
  employees: [
    {
      id: 'emp-01',
      code: 'NV001',
      fullName: 'Trần Văn Dopi',
      department: 'Kỹ thuật',
      position: 'Lập trình viên',
      rank: 'Cấp 3',
      joinDate: '2026-01-01',
      contractType: 'official_fixed',
      salaryType: 'gross',
      baseSalary: 25_000_000,
      insuranceSalary: 25_000_000,
      useCustomInsuranceSalary: false,
      region: 'I',
      dependentsCount: 1,
      residencyStatus: 'resident',
      hasSocialInsurance: true,
      hasHealthInsurance: true,
      hasUnemploymentInsurance: true,
      hasTradeUnion: true,
      lunchAllowance: 730000,
      phoneAllowance: 0,
      transportAllowance: 0,
      housingAllowance: 0,
      positionAllowance: 0,
      otherAllowances: [],
      workingStatus: 'active'
    }
  ],
  attendanceMap: {},
  adjustmentsMap: {},
  departments: ['Kỹ thuật', 'Kế toán'],
  ranks: ['Cấp 1', 'Cấp 2', 'Cấp 3'],
  customLegalConfig: null
};

describe('Dopi GRIncome Cryptographic Vault (AES-256-GCM + PBKDF2)', () => {
  const masterPassword = 'MySecretPassword123!';

  it('Mã hóa và giải mã thành công với đúng mật khẩu', async () => {
    const encryptedRecord = await encryptWorkspace(sampleWorkspace, masterPassword, 'Hồ sơ thử nghiệm');

    expect(encryptedRecord.algorithm).toBe('AES-256-GCM');
    expect(encryptedRecord.keyDerivation).toBe('PBKDF2-SHA256');
    expect(encryptedRecord.saltHex.length).toBe(32); // 16 bytes = 32 hex chars
    expect(encryptedRecord.ivHex.length).toBe(24);   // 12 bytes = 24 hex chars
    expect(encryptedRecord.ciphertextHex.length).toBeGreaterThan(50);

    // Giải mã với đúng mật khẩu
    const decrypted = await decryptWorkspace(encryptedRecord, masterPassword);
    expect(decrypted.companyProfile.companyName).toBe('Công Ty Dopi Test');
    expect(decrypted.employees.length).toBe(1);
    expect(decrypted.employees[0].fullName).toBe('Trần Văn Dopi');
    expect(decrypted.employees[0].baseSalary).toBe(25_000_000);
  });

  it('Giải mã thất bại khi nhập sai mật khẩu (Bảo vệ dữ liệu)', async () => {
    const encryptedRecord = await encryptWorkspace(sampleWorkspace, masterPassword, 'Hồ sơ');

    await expect(
      decryptWorkspace(encryptedRecord, 'WrongPassword999')
    ).rejects.toThrow('Mật khẩu không chính xác hoặc dữ liệu hồ sơ đã bị thay đổi.');
  });

  it('Tạo và khôi phục file sao lưu mã hóa (.dopigr)', async () => {
    const encryptedRecord = await encryptWorkspace(sampleWorkspace, masterPassword, 'Hồ sơ sao lưu');
    const backupContent = createBackupFileContent(encryptedRecord);

    expect(backupContent).toContain('DopiGRIncome_Encrypted_Backup');
    expect(backupContent).not.toContain(masterPassword); // Tuyệt đối không chứa mật khẩu

    // Khôi phục từ file sao lưu
    const { state } = await restoreFromBackupFile(backupContent, masterPassword);
    expect(state.companyProfile.taxCode).toBe('0101234567');
    expect(state.employees[0].code).toBe('NV001');

    // Khôi phục thất bại nếu sai mật khẩu
    await expect(
      restoreFromBackupFile(backupContent, 'WrongBackupPassword')
    ).rejects.toThrow();
  });
});
