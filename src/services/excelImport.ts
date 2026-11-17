import * as XLSX from 'xlsx';
import { Employee, ContractType, SalaryType, RegionType, ResidencyStatus } from '../types/employee';
import { parseVND } from '../utils/currency';

export interface ColumnMapping {
  systemField: keyof Employee | 'customAllowance';
  displayName: string;
  excelHeader: string;
  required: boolean;
}

export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

export interface ImportValidationResult {
  headers: string[];
  totalRows: number;
  validRows: Employee[];
  invalidRows: { rowIndex: number; raw: Record<string, any>; errors: string[] }[];
  duplicateCodes: string[];
}

// Từ khóa để tự động nhận diện cột từ file Excel
export const SYSTEM_FIELDS: { field: string; label: string; keywords: string[]; required?: boolean; basic?: boolean }[] = [
  { field: 'stt', label: 'STT (Số thứ tự)', keywords: ['stt', 'số thứ tự', 'so thu tu', 'no.', 'no', '#'], basic: true },
  { field: 'fullName', label: 'Họ và tên', keywords: ['họ và tên', 'họ tên', 'ho ten', 'ho_ten', 'full name', 'fullname', 'tên nhân viên', 'tên'], required: true, basic: true },
  { field: 'code', label: 'Mã nhân viên (tự tạo nếu trống)', keywords: ['mã nv', 'manv', 'mã nhân viên', 'ma_nhan_vien', 'code', 'id'], basic: true },
  { field: 'department', label: 'Phòng ban', keywords: ['phòng ban', 'phong ban', 'bộ phận', 'department', 'dept'], basic: true },
  { field: 'position', label: 'Chức danh / Chức vụ', keywords: ['chức danh', 'chức vụ', 'chuc vu', 'position', 'title'], basic: true },
  { field: 'baseSalary', label: 'Mức lương thỏa thuận (trống = 0 đ)', keywords: ['lương cơ bản', 'lương cb', 'luong co ban', 'lương thỏa thuận', 'base salary', 'lương gross', 'lương net', 'mức lương', 'lương'], basic: true },
  { field: 'rank', label: 'Cấp bậc', keywords: ['cấp bậc', 'cap bac', 'bậc', 'rank', 'level', 'grade'] },
  { field: 'joinDate', label: 'Ngày vào làm', keywords: ['ngày vào làm', 'ngày vào', 'ngay vao', 'join date', 'start date'] },
  { field: 'contractType', label: 'Loại hợp đồng', keywords: ['loại hợp đồng', 'loại hđ', 'loai hop dong', 'contract type'] },
  { field: 'salaryType', label: 'Loại lương (Gross/Net)', keywords: ['loại lương', 'hình thức lương', 'gross/net', 'salary type'] },
  { field: 'insuranceSalary', label: 'Lương đóng bảo hiểm', keywords: ['lương đóng bh', 'lương bảo hiểm', 'insurance salary', 'luong bhxh'] },
  { field: 'region', label: 'Vùng lương tối thiểu (I, II, III, IV)', keywords: ['vùng', 'vùng lương', 'region', 'khu vực'] },
  { field: 'dependentsCount', label: 'Số người phụ thuộc', keywords: ['người phụ thuộc', 'phụ thuộc', 'dependents', 'npt'] },
  { field: 'lunchAllowance', label: 'Phụ cấp ăn trưa', keywords: ['ăn trưa', 'phụ cấp ăn trưa', 'cơm trưa', 'lunch allowance', 'tien an'] },
  { field: 'phoneAllowance', label: 'Phụ cấp điện thoại', keywords: ['điện thoại', 'phụ cấp điện thoại', 'phone allowance'] },
  { field: 'transportAllowance', label: 'Phụ cấp đi lại', keywords: ['đi lại', 'xăng xe', 'phụ cấp đi lại', 'transport allowance'] },
  { field: 'housingAllowance', label: 'Phụ cấp nhà ở', keywords: ['nhà ở', 'phụ cấp nhà ở', 'housing allowance'] },
  { field: 'positionAllowance', label: 'Phụ cấp chức vụ', keywords: ['phụ cấp chức vụ', 'pc chức vụ', 'position allowance'] },
  { field: 'bankAccount', label: 'Số tài khoản ngân hàng', keywords: ['số tài khoản', 'stk', 'tài khoản', 'bank account'] },
  { field: 'bankName', label: 'Ngân hàng', keywords: ['ngân hàng', 'ngan hang', 'bank'] }
];

/**
 * Tải file Excel mẫu danh sách thô đơn giản (chỉ gồm STT và Họ và tên)
 */
export function downloadRawListExcelTemplate() {
  const headers = ['STT', 'Họ và tên'];
  const sampleRows = [
    [1, 'Nguyễn Văn An'],
    [2, 'Trần Thị Bình'],
    [3, 'Lê Hoàng Minh'],
    [4, 'Phạm Thu Hà'],
    [5, 'Vũ Đức Mạnh'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [{ wch: 10 }, { wch: 28 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Nhan_Vien');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Tho_STT_HoTen.xlsx');
}

/**
 * Tải file Excel mẫu chuẩn đầy đủ (.xlsx)
 */
export function downloadSampleExcelTemplate() {
  const headers = [
    'Mã nhân viên',
    'Họ và tên',
    'Phòng ban',
    'Chức vụ',
    'Cấp bậc',
    'Ngày vào làm (YYYY-MM-DD)',
    'Loại hợp đồng (Thử việc / 1 năm / Không thời hạn)',
    'Hình thức lương (Gross / Net)',
    'Mức lương thỏa thuận (VND)',
    'Lương đóng bảo hiểm (để trống nếu bằng lương TT)',
    'Vùng tối thiểu (I, II, III, IV)',
    'Số người phụ thuộc',
    'Ăn trưa (VND)',
    'Phụ cấp chức vụ (VND)',
    'Phụ cấp điện thoại (VND)',
    'Phụ cấp đi lại (VND)',
    'Số tài khoản',
    'Ngân hàng'
  ];

  const sampleRows = [
    [
      'NV001', 'Nguyễn Văn An', 'Ban Giám Đốc', 'Giám đốc Điều hành', 'Cấp 1', '2022-03-01',
      'Không thời hạn', 'Gross', 65000000, 46800000, 'I', 2, 730000, 5000000, 1000000, 1500000, '19030012345678', 'Techcombank'
    ],
    [
      'NV002', 'Trần Thị Mai', 'Kế toán', 'Kế toán trưởng', 'Cấp 2', '2023-01-15',
      'Không thời hạn', 'Net', 25000000, 25000000, 'I', 1, 730000, 2000000, 500000, 500000, '0011004567890', 'Vietcombank'
    ],
    [
      'NV003', 'Lê Hoàng Nam', 'Kỹ thuật', 'Kỹ sư Phần mềm', 'Cấp 3', '2023-08-01',
      '1 năm', 'Gross', 35000000, 35000000, 'I', 1, 730000, 0, 500000, 800000, '1012345678', 'MBBank'
    ],
    [
      'NV004', 'Hoàng Minh Tuấn', 'Vận hành', 'Nhân viên Kho', 'Cấp 4', '2024-02-01',
      '1 năm', 'Gross', 9000000, 9000000, 'II', 0, 730000, 500000, 200000, 600000, '0451000123987', 'BIDV'
    ],
    [
      'NV005', 'Bùi Tuấn Kiệt', 'Kinh doanh', 'Chuyên viên TT', 'Cấp 5', '2026-02-01',
      'Thử việc', 'Gross', 12000000, 0, 'I', 0, 730000, 0, 300000, 500000, '888899990000', 'ACB'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Mã NV
    { wch: 22 }, // Họ tên
    { wch: 18 }, // Phòng ban
    { wch: 20 }, // Chức vụ
    { wch: 12 }, // Cấp bậc
    { wch: 18 }, // Ngày vào
    { wch: 20 }, // HĐ
    { wch: 15 }, // Loại lương
    { wch: 18 }, // Lương TT
    { wch: 18 }, // Lương BH
    { wch: 14 }, // Vùng
    { wch: 14 }, // NPT
    { wch: 14 }, // Ăn trưa
    { wch: 16 }, // PC Chức vụ
    { wch: 14 }, // Điện thoại
    { wch: 14 }, // Đi lại
    { wch: 20 }, // STK
    { wch: 16 }  // Bank
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhan_Vien');
  XLSX.writeFile(wb, 'Mau_Nhan_Vien_DopiGRIncome.xlsx');
}

/**
 * Đọc file Excel từ File object của browser
 */
export async function readExcelFile(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  // Lấy danh sách headers từ dòng đầu tiên
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const headers: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
    if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
      headers.push(String(cell.v).trim());
    }
  }

  return { headers, rows };
}

/**
 * Tự động đoán ánh xạ cột dựa trên tên header trong Excel
 */
export function autoMapColumns(excelHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  for (const field of SYSTEM_FIELDS) {
    // Ưu tiên khớp chính xác hoặc bắt đầu bằng từ khóa trước
    let matched = excelHeaders.find((h) => {
      if (usedHeaders.has(h)) return false;
      const lower = h.toLowerCase().trim();
      return field.keywords.some((k) => lower === k);
    });

    if (!matched) {
      matched = excelHeaders.find((h) => {
        if (usedHeaders.has(h)) return false;
        const lower = h.toLowerCase().trim();
        return field.keywords.some((k) => lower.includes(k));
      });
    }

    if (matched) {
      mapping[field.field] = matched;
      usedHeaders.add(matched);
    }
  }

  return mapping;
}

/**
 * Tạo mã nhân viên tự động không bị trùng
 */
function generateUniqueEmployeeCode(
  preferredNum: number | null,
  existingCodes: Set<string>,
  fileSeenCodes: Set<string>,
  fallbackCounter: { value: number }
): string {
  if (preferredNum && preferredNum > 0) {
    const candidate = `NV${String(preferredNum).padStart(3, '0')}`;
    if (!existingCodes.has(candidate.toLowerCase()) && !fileSeenCodes.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  while (true) {
    const candidate = `NV${String(fallbackCounter.value).padStart(3, '0')}`;
    fallbackCounter.value += 1;
    if (!existingCodes.has(candidate.toLowerCase()) && !fileSeenCodes.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

/**
 * Xử lý dữ liệu đã map và kiểm tra tính hợp lệ
 * Hỗ trợ import danh sách thô (chỉ cần Họ và tên, có thể kèm STT), mọi trường khác tự mặc định để cập nhật trên web.
 */
export function validateAndParseImport(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  existingCodes: Set<string>
): ImportValidationResult {
  const validRows: Employee[] = [];
  const invalidRows: { rowIndex: number; raw: Record<string, any>; errors: string[] }[] = [];
  const fileSeenCodes = new Set<string>();
  const duplicateCodes: string[] = [];
  const autoCodeCounter = { value: existingCodes.size + 1 };

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Dòng 1 là header
    const errors: string[] = [];

    // Lấy giá trị theo mapping
    const getValue = (fieldKey: string) => {
      const headerName = columnMapping[fieldKey];
      return headerName !== undefined ? row[headerName] : undefined;
    };

    // Kiểm tra dòng hoàn toàn rỗng
    const hasAnyVal = Object.values(row).some((v) => String(v).trim() !== '');
    if (!hasAnyVal) return; // Bỏ qua dòng trống

    const rawStt = parseInt(String(getValue('stt') || '').trim(), 10);
    const rawCode = String(getValue('code') || '').trim();
    const rawFullName = String(getValue('fullName') || '').trim();
    const rawSalary = getValue('baseSalary');

    if (!rawFullName) {
      errors.push('Thiếu họ và tên nhân viên.');
    }

    // Xử lý Mã nhân viên: nếu trống -> tự động sinh theo STT hoặc thứ tự
    let finalCode = rawCode;
    if (!finalCode) {
      finalCode = generateUniqueEmployeeCode(
        !isNaN(rawStt) ? rawStt : null,
        existingCodes,
        fileSeenCodes,
        autoCodeCounter
      );
    } else {
      if (fileSeenCodes.has(finalCode.toLowerCase())) {
        errors.push(`Mã nhân viên "${finalCode}" bị trùng lặp trong file.`);
        duplicateCodes.push(finalCode);
      } else if (existingCodes.has(finalCode.toLowerCase())) {
        errors.push(`Mã nhân viên "${finalCode}" đã tồn tại trong danh sách hiện tại.`);
        duplicateCodes.push(finalCode);
      }
    }

    // Xử lý lương: nếu không có cột lương hoặc bỏ trống -> mặc định 0 đ để người dùng tự cập nhật trên web
    const parsedSalary = rawSalary !== undefined && String(rawSalary).trim() !== '' ? parseVND(rawSalary) : 0;
    const baseSalary = isNaN(parsedSalary) || parsedSalary < 0 ? 0 : parsedSalary;

    if (errors.length > 0) {
      invalidRows.push({ rowIndex: rowNum, raw: row, errors });
    } else {
      fileSeenCodes.add(finalCode.toLowerCase());

      // Parse contract type
      const rawContract = String(getValue('contractType') || '').toLowerCase();
      let contractType: ContractType = 'official_fixed';
      if (rawContract.includes('thử việc') || rawContract.includes('probation')) {
        contractType = 'probation';
      } else if (rawContract.includes('không xác định') || rawContract.includes('không thời hạn') || rawContract.includes('indefinite')) {
        contractType = 'official_indefinite';
      } else if (rawContract.includes('bán thời gian') || rawContract.includes('part time')) {
        contractType = 'part_time';
      }

      // Parse salary type
      const rawSalType = String(getValue('salaryType') || '').toLowerCase();
      const salaryType: SalaryType = rawSalType.includes('net') ? 'net' : 'gross';

      // Parse region
      const rawRegion = String(getValue('region') || 'I').toUpperCase().trim();
      let region: RegionType = 'I';
      if (['I', 'II', 'III', 'IV'].includes(rawRegion)) {
        region = rawRegion as RegionType;
      }

      // Insurance salary
      const rawIns = getValue('insuranceSalary');
      const insSalary = parseVND(rawIns);
      const useCustomInsuranceSalary = insSalary > 0;

      // Lunch allowance: nếu có nhập trong file thì lấy giá trị file, ngược lại nếu nhập lương > 0 thì mặc định 730k, nếu danh sách thô lương = 0 thì để 0
      const rawLunch = getValue('lunchAllowance');
      const hasLunchCol = rawLunch !== undefined && String(rawLunch).trim() !== '';
      const lunchAllowance = hasLunchCol ? parseVND(rawLunch) : (baseSalary > 0 ? 730000 : 0);

      const employee: Employee = {
        id: `emp-imp-${Date.now()}-${idx}`,
        code: finalCode,
        fullName: rawFullName,
        department: String(getValue('department') || 'Chưa phân bổ').trim(),
        position: String(getValue('position') || 'Nhân viên').trim(),
        rank: String(getValue('rank') || 'Cấp 4 - Nhân viên').trim(),
        joinDate: String(getValue('joinDate') || new Date().toISOString().split('T')[0]).trim(),
        contractType,
        salaryType,
        baseSalary,
        insuranceSalary: useCustomInsuranceSalary ? insSalary : baseSalary,
        useCustomInsuranceSalary,
        region,
        dependentsCount: Math.max(0, parseInt(String(getValue('dependentsCount') || 0), 10) || 0),
        residencyStatus: 'resident',
        hasSocialInsurance: contractType !== 'probation',
        hasHealthInsurance: contractType !== 'probation',
        hasUnemploymentInsurance: contractType !== 'probation',
        hasTradeUnion: contractType !== 'probation',
        lunchAllowance,
        phoneAllowance: parseVND(getValue('phoneAllowance')) || 0,
        transportAllowance: parseVND(getValue('transportAllowance')) || 0,
        housingAllowance: parseVND(getValue('housingAllowance')) || 0,
        positionAllowance: parseVND(getValue('positionAllowance')) || 0,
        otherAllowances: [],
        workingStatus: 'active',
        bankAccount: String(getValue('bankAccount') || '').trim(),
        bankName: String(getValue('bankName') || '').trim()
      };

      validRows.push(employee);
    }
  });

  return {
    headers: Object.keys(columnMapping),
    totalRows: rawRows.length,
    validRows,
    invalidRows,
    duplicateCodes
  };
}

