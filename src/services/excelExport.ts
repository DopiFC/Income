import * as XLSX from 'xlsx';
import { PayslipItem, PayrollSummary } from '../types/payroll';
import { LegalConfig } from '../types/legal';

export function exportPayrollWorkbook(
  items: PayslipItem[],
  summary: PayrollSummary,
  legalConfig: LegalConfig,
  companyName: string = 'Doanh nghiệp / Hộ kinh doanh'
) {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Bảng Tổng Hợp Lương
  // -------------------------------------------------------------
  const summaryHeaderRows = [
    [companyName.toUpperCase()],
    [`BẢNG THANH TOÁN TIỀN LƯƠNG & CHI PHÍ NHÂN SỰ - ${summary.month}`],
    ['Thời điểm lập báo cáo:', new Date().toLocaleString('vi-VN')],
    ['Tổng nhân viên:', summary.totalEmployees, 'Tổng quỹ lương Gross:', summary.totalGrossSalary, 'Tổng thực nhận Net:', summary.totalNetSalary, 'Tổng chi phí DN:', summary.totalCompanyCost],
    [] // empty row
  ];

  const colHeaders1 = [
    'STT', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức vụ', 'Cấp bậc',
    'Ngày công tính lương', 'Lương hợp đồng', 'Tổng thu nhập Gross',
    'Tổng phụ cấp', 'Tổng thưởng', 'Tiền tăng ca',
    'BHXH NLĐ (8%)', 'BHYT NLĐ (1.5%)', 'BHTN NLĐ (1%)', 'Đoàn phí NLĐ',
    'Tổng BH NLĐ', 'Thuế TNCN', 'Tạm ứng', 'Khấu trừ khác', 'Tổng khấu trừ',
    'Lương thực nhận (Net)', 'Bảo hiểm DN đóng', 'Tổng chi phí DN'
  ];

  const rows1 = items.map((p, idx) => [
    idx + 1,
    p.employee.code,
    p.employee.fullName,
    p.employee.department,
    p.employee.position,
    p.employee.rank,
    p.actualWorkingDaysCount,
    p.employee.baseSalary,
    p.grossIncome,
    p.totalAllowances,
    p.totalBonuses,
    p.totalOvertimePay,
    p.employeeSocialInsurance,
    p.employeeHealthInsurance,
    p.employeeUnemploymentInsurance,
    p.employeeTradeUnion,
    p.totalEmployeeInsurance,
    p.personalIncomeTax,
    p.advancePayment,
    p.damageCompensation + p.otherDeductions,
    p.totalEmployeeInsurance + p.personalIncomeTax + p.totalOtherDeductions,
    p.netSalary,
    p.totalEmployerInsurance,
    p.totalCompanyCost
  ]);

  // Hàng tổng cộng
  const totalRow1 = [
    'TỔNG CỘNG', '', '', '', '', '', '',
    items.reduce((s, p) => s + p.employee.baseSalary, 0),
    summary.totalGrossSalary,
    items.reduce((s, p) => s + p.totalAllowances, 0),
    items.reduce((s, p) => s + p.totalBonuses, 0),
    items.reduce((s, p) => s + p.totalOvertimePay, 0),
    items.reduce((s, p) => s + p.employeeSocialInsurance, 0),
    items.reduce((s, p) => s + p.employeeHealthInsurance, 0),
    items.reduce((s, p) => s + p.employeeUnemploymentInsurance, 0),
    items.reduce((s, p) => s + p.employeeTradeUnion, 0),
    summary.totalEmployeeInsurance,
    summary.totalPersonalIncomeTax,
    items.reduce((s, p) => s + p.advancePayment, 0),
    items.reduce((s, p) => s + (p.damageCompensation + p.otherDeductions), 0),
    items.reduce((s, p) => s + (p.totalEmployeeInsurance + p.personalIncomeTax + p.totalOtherDeductions), 0),
    summary.totalNetSalary,
    summary.totalEmployerInsurance,
    summary.totalCompanyCost
  ];

  const ws1Data = [...summaryHeaderRows, colHeaders1, ...rows1, totalRow1];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

  ws1['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
    { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Tong_Hop_Luong');

  // -------------------------------------------------------------
  // Sheet 2: Chi Tiết Thuế TNCN & Giảm Trừ
  // -------------------------------------------------------------
  const colHeaders2 = [
    'Mã NV', 'Họ và tên', 'Tổng thu nhập', 'Thu nhập miễn thuế',
    'Thu nhập chịu thuế', 'Giảm trừ bản thân', 'Số người phụ thuộc',
    'Giảm trừ người phụ thuộc', 'Giảm trừ bảo hiểm bắt buộc',
    'Tổng các khoản giảm trừ', 'Thu nhập tính thuế', 'Thuế TNCN phải nộp'
  ];

  const rows2 = items.map(p => [
    p.employee.code,
    p.employee.fullName,
    p.grossIncome,
    (p.taxExemptAllowances + p.taxExemptOvertimePay + p.taxExemptReimbursements),
    p.assessableIncome,
    p.personalDeduction,
    p.employee.dependentsCount,
    p.dependentDeduction,
    p.totalEmployeeInsurance,
    p.totalDeductions,
    p.taxableIncome,
    p.personalIncomeTax
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([['CHI TIẾT TÍNH THUẾ THU NHẬP CÁ NHÂN (TNCN) NĂM 2026'], [], colHeaders2, ...rows2]);
  ws2['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
    { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
    { wch: 18 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Chi_Tiet_Thue_TNCN');

  // -------------------------------------------------------------
  // Sheet 3: Chấm Công & Ngày Nghỉ
  // -------------------------------------------------------------
  const colHeaders3 = [
    'Mã NV', 'Họ và tên', 'Công chuẩn', 'Công thực tế',
    'Phép năm có lương', 'Nghỉ lễ có lương', 'Nghỉ việc riêng có lương',
    'Nghỉ không lương', 'Nghỉ ốm (BHXH)', 'Nghỉ thai sản (BHXH)',
    'Tổng ngày hưởng lương', 'Lương thực tế theo ngày công'
  ];

  const rows3 = items.map(p => [
    p.employee.code,
    p.employee.fullName,
    p.attendance.standardWorkDays,
    p.attendance.actualWorkDays,
    p.attendance.paidAnnualLeaveDays,
    p.attendance.paidHolidayDays,
    p.attendance.paidSpecialLeaveDays,
    p.attendance.unpaidLeaveDays,
    p.attendance.sickLeaveDays,
    p.attendance.maternityLeaveDays,
    p.actualWorkingDaysCount,
    p.actualBaseSalary
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet([['BẢNG TỔNG HỢP CHẤM CÔNG & NGHỈ PHÉP'], [], colHeaders3, ...rows3]);
  ws3['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Cham_Cong_Ngay_Nghi');

  // -------------------------------------------------------------
  // Sheet 4: Phụ Cấp & Tăng Ca
  // -------------------------------------------------------------
  const colHeaders4 = [
    'Mã NV', 'Họ và tên', 'Ăn trưa', 'Chức vụ', 'Điện thoại', 'Đi lại', 'Nhà ở',
    'Tổng phụ cấp', 'Giờ TC ngày thường (150%)', 'Giờ TC cuối tuần (200%)', 'Giờ TC ngày lễ (300%)',
    'Làm đêm', 'Tổng giờ làm thêm', 'Tổng tiền tăng ca', 'Phần tăng ca miễn thuế TNCN'
  ];

  const rows4 = items.map(p => {
    const totalOtHours = (p.attendance.normalDayOvertimeHours || 0) +
                         (p.attendance.weekendOvertimeHours || 0) +
                         (p.attendance.holidayOvertimeHours || 0) +
                         (p.attendance.nightOvertimeHours || 0);
    return [
      p.employee.code,
      p.employee.fullName,
      p.totalLunchAllowance,
      p.employee.positionAllowance || 0,
      p.employee.phoneAllowance || 0,
      p.employee.transportAllowance || 0,
      p.employee.housingAllowance || 0,
      p.totalAllowances,
      p.attendance.normalDayOvertimeHours || 0,
      p.attendance.weekendOvertimeHours || 0,
      p.attendance.holidayOvertimeHours || 0,
      p.attendance.nightWorkHours || 0,
      totalOtHours,
      p.totalOvertimePay,
      p.taxExemptOvertimePay
    ];
  });

  const ws4 = XLSX.utils.aoa_to_sheet([['BẢNG PHỤ CẤP & CHI TIẾT TĂNG CA'], [], colHeaders4, ...rows4]);
  ws4['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws4, 'Phu_Cap_Tang_Ca');

  // -------------------------------------------------------------
  // Sheet 5: Tham Số & Căn Cứ Pháp Luật
  // -------------------------------------------------------------
  const legalData = [
    ['CĂN CỨ VÀ THAM SỐ TÍNH LƯƠNG ĐANG ÁP DỤNG TRONG PHIÊN'],
    ['Kỳ lương tính toán:', summary.month],
    ['Thời điểm xử lý:', new Date().toISOString()],
    [],
    ['1. Giảm trừ gia cảnh thuế TNCN (Năm 2026):'],
    ['   - Bản thân người nộp thuế:', `${legalConfig.personalDeduction.toLocaleString('vi-VN')} đ/tháng`],
    ['   - Mỗi người phụ thuộc:', `${legalConfig.dependentDeduction.toLocaleString('vi-VN')} đ/tháng`],
    [],
    ['2. Biểu thuế lũy tiến từng phần (Kỳ tính thuế 2026):'],
    ['   - Bậc 1 (Đến 10 triệu đ):', '5%'],
    ['   - Bậc 2 (Trên 10 đến 30 triệu đ):', '10%'],
    ['   - Bậc 3 (Trên 30 đến 60 triệu đ):', '20%'],
    ['   - Bậc 4 (Trên 60 đến 100 triệu đ):', '30%'],
    ['   - Bậc 5 (Trên 100 triệu đ):', '35%'],
    [],
    ['3. Mức lương tối thiểu vùng (Nghị định 293/2025/NĐ-CP):'],
    ['   - Vùng I:', `${legalConfig.regionalMinWage.I.toLocaleString('vi-VN')} đ/tháng`],
    ['   - Vùng II:', `${legalConfig.regionalMinWage.II.toLocaleString('vi-VN')} đ/tháng`],
    ['   - Vùng III:', `${legalConfig.regionalMinWage.III.toLocaleString('vi-VN')} đ/tháng`],
    ['   - Vùng IV:', `${legalConfig.regionalMinWage.IV.toLocaleString('vi-VN')} đ/tháng`],
    [],
    ['4. Tỷ lệ đóng bảo hiểm bắt buộc:'],
    ['   - BHXH:', `NLĐ: ${(legalConfig.employeeRates.socialInsurance * 100).toFixed(1)}% | Doanh nghiệp: ${(legalConfig.employerRates.socialInsurance * 100).toFixed(1)}%`],
    ['   - BHYT:', `NLĐ: ${(legalConfig.employeeRates.healthInsurance * 100).toFixed(1)}% | Doanh nghiệp: ${(legalConfig.employerRates.healthInsurance * 100).toFixed(1)}%`],
    ['   - BHTN:', `NLĐ: ${(legalConfig.employeeRates.unemploymentInsurance * 100).toFixed(1)}% | Doanh nghiệp: ${(legalConfig.employerRates.unemploymentInsurance * 100).toFixed(1)}%`],
    ['   - Kinh phí công đoàn:', `NLĐ: ${(legalConfig.employeeRates.tradeUnion * 100).toFixed(1)}% | Doanh nghiệp: ${(legalConfig.employerRates.tradeUnion * 100).toFixed(1)}%`],
    ['   - Trần đóng BHXH & BHYT:', `${(legalConfig.referenceBaseSalary * legalConfig.insuranceCapMultiplier).toLocaleString('vi-VN')} đ (20 lần mức tham chiếu)`]
  ];

  const ws5 = XLSX.utils.aoa_to_sheet(legalData);
  ws5['!cols'] = [{ wch: 35 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'Can_Cu_Phap_Luat');

  const fileName = `Bang_Luong_Tong_Hop_${summary.month}_LuongGon.xlsx`;
  XLSX.writeFile(wb, fileName);
}
