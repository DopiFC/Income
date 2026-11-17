import { describe, it, expect } from 'vitest';
import { autoMapColumns, validateAndParseImport } from '../services/excelImport';

describe('Excel Import - Raw Employee List (STT & Họ tên)', () => {
  it('Tự động nhận diện cột STT và Họ và tên từ file thô', () => {
    const mapping = autoMapColumns(['STT', 'Họ và tên']);
    expect(mapping.stt).toBe('STT');
    expect(mapping.fullName).toBe('Họ và tên');
    expect(mapping.baseSalary).toBeUndefined();
    expect(mapping.code).toBeUndefined();
  });

  it('Import thành công danh sách chỉ có STT và Họ tên (không có lương và mã NV)', () => {
    const rawRows = [
      { STT: 1, 'Họ và tên': 'Nguyễn Văn An' },
      { STT: 2, 'Họ và tên': 'Trần Thị Bình' },
      { STT: '', 'Họ và tên': '' }, // dòng trống bị bỏ qua
      { STT: 3, 'Họ và tên': 'Lê Hoàng Minh' }
    ];

    const mapping = autoMapColumns(['STT', 'Họ và tên']);
    const result = validateAndParseImport(rawRows, mapping, new Set(['nv002']));

    expect(result.invalidRows.length).toBe(0);
    expect(result.validRows.length).toBe(3);

    // STT 1 -> NV001
    expect(result.validRows[0].code).toBe('NV001');
    expect(result.validRows[0].fullName).toBe('Nguyễn Văn An');
    expect(result.validRows[0].baseSalary).toBe(0);
    expect(result.validRows[0].lunchAllowance).toBe(0);

    // STT 2 trùng nv002 đã tồn tại -> tự sinh mã không trùng
    expect(result.validRows[1].code).not.toBe('NV002');
    expect(result.validRows[1].fullName).toBe('Trần Thị Bình');

    // STT 3 -> mã hợp lệ và không trùng lặp với các mã trước
    const codes = result.validRows.map((r) => r.code);
    expect(new Set(codes).size).toBe(3);
    expect(result.validRows[2].fullName).toBe('Lê Hoàng Minh');
  });

  it('Vẫn báo lỗi dòng thiếu Họ và tên', () => {
    const rawRows = [
      { STT: 1, 'Họ và tên': '' }
    ];
    const mapping = autoMapColumns(['STT', 'Họ và tên']);
    const result = validateAndParseImport(rawRows, mapping, new Set());

    expect(result.validRows.length).toBe(0);
    expect(result.invalidRows.length).toBe(1);
    expect(result.invalidRows[0].errors[0]).toContain('Thiếu họ và tên');
  });
});
