import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildSafeEmployeePayslipFileName, createPayslipsZipBlob } from '../services/payslipImage';
import { getWorkingStatusMeta, WORKING_STATUS_OPTIONS } from '../types/employee';

describe('Payslip Batch Folder Export & Working Status', () => {
  it('Đặt tên file ảnh theo tên nhân viên và chống trùng tên', () => {
    const seen = new Set<string>();
    expect(buildSafeEmployeePayslipFileName('Nguyễn Văn An', 'NV001', seen)).toBe('Nguyễn Văn An.png');
    expect(buildSafeEmployeePayslipFileName('Trần Thị Bình', 'NV002', seen)).toBe('Trần Thị Bình.png');
    // Trùng tên -> tự động gắn mã NV
    expect(buildSafeEmployeePayslipFileName('Nguyễn Văn An', 'NV003', seen)).toBe('Nguyễn Văn An (NV003).png');
    // Loại bỏ ký tự không hợp lệ trong tên file
    expect(buildSafeEmployeePayslipFileName('Lê / Văn : Cường', 'NV004', seen)).toBe('Lê Văn Cường.png');
  });

  it('Đóng gói nhiều phiếu lương vào 1 thư mục duy nhất trong file ZIP', async () => {
    const entries = [
      { fileName: 'Nguyễn Văn An.png', blob: new Blob(['fake-png-1'], { type: 'image/png' }) },
      { fileName: 'Trần Thị Bình.png', blob: new Blob(['fake-png-2'], { type: 'image/png' }) }
    ];

    const zipBlob = await createPayslipsZipBlob(entries, 'Bang_Luong_2026-03');
    const loadedZip = await JSZip.loadAsync(await zipBlob.arrayBuffer());

    expect(loadedZip.files['Bang_Luong_2026-03/Nguyễn Văn An.png']).toBeDefined();
    expect(loadedZip.files['Bang_Luong_2026-03/Trần Thị Bình.png']).toBeDefined();
  });

  it('Hỗ trợ đầy đủ các trạng thái nghỉ việc theo yêu cầu', () => {
    const keys = WORKING_STATUS_OPTIONS.map((o) => o.value);
    expect(keys).toContain('active');
    expect(keys).toContain('resignation_submitted');
    expect(keys).toContain('resignation_approved');
    expect(keys).toContain('abandoned');
    expect(keys).toContain('terminated');

    expect(getWorkingStatusMeta('resignation_submitted').label).toBe('Đã nộp đơn xin nghỉ');
    expect(getWorkingStatusMeta('resignation_approved').label).toBe('Duyệt nghỉ');
    expect(getWorkingStatusMeta('abandoned').label).toBe('Nghỉ ngang');
    expect(getWorkingStatusMeta('terminated').label).toBe('Sa thải');
  });
});
