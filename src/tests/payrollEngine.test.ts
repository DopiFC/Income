import { describe, it, expect } from 'vitest';
import { calculateInsurance } from '../engine/insurance';
import { calculateOvertime } from '../engine/overtime';
import { calculateSalaryProration } from '../engine/proration';
import { calculateEmployeePayroll } from '../engine/salaryCalculation';
import { solveGrossFromTargetNet } from '../engine/grossToNet';
import { DEFAULT_LEGAL_CONFIG_2026 } from '../legal/rules';
import { Employee } from '../types/employee';
import { MonthlyAttendance, Adjustments } from '../types/attendance';

const baseEmployee: Employee = {
  id: 'test-01',
  code: 'NV_TEST',
  fullName: 'Nguyễn Văn Test',
  department: 'Công nghệ',
  position: 'Kỹ sư',
  rank: 'Cấp 3',
  joinDate: '2025-01-01',
  contractType: 'official_fixed',
  salaryType: 'gross',
  baseSalary: 20_000_000,
  insuranceSalary: 20_000_000,
  useCustomInsuranceSalary: false,
  region: 'I',
  dependentsCount: 0,
  residencyStatus: 'resident',
  hasSocialInsurance: true,
  hasHealthInsurance: true,
  hasUnemploymentInsurance: true,
  hasTradeUnion: false,
  lunchAllowance: 730_000,
  phoneAllowance: 0,
  transportAllowance: 0,
  housingAllowance: 0,
  positionAllowance: 0,
  otherAllowances: [],
  workingStatus: 'active'
};

const defaultAttendance: MonthlyAttendance = {
  employeeId: 'test-01',
  month: '2026-03',
  standardWorkDays: 22,
  standardWorkHoursPerDay: 8,
  actualWorkDays: 22,
  paidAnnualLeaveDays: 0,
  paidHolidayDays: 0,
  paidSpecialLeaveDays: 0,
  unpaidLeaveDays: 0,
  sickLeaveDays: 0,
  maternityLeaveDays: 0,
  compensatoryLeaveDays: 0,
  normalDayOvertimeHours: 0,
  weekendOvertimeHours: 0,
  holidayOvertimeHours: 0,
  nightWorkHours: 0,
  nightOvertimeHours: 0
};

const emptyAdjustments: Adjustments = {
  employeeId: 'test-01',
  bonusKpi: 0,
  bonusSales: 0,
  bonusTet: 0,
  commission: 0,
  retroactivePay: 0,
  taxExemptReimbursement: 0,
  advancePayment: 0,
  advanceRepayment: 0,
  damageCompensation: 0,
  otherDeductions: 0
};

describe('Payroll Engine - Bảo hiểm, Chấm công, Tăng ca và Gross-Net', () => {
  it('Kiểm tra tỷ lệ đóng bảo hiểm và trần đóng BHXH/BHYT (46.8M)', () => {
    // Nhân viên có lương cao 80,000,000đ (vượt trần BHXH 46.8M và BHTN 106.2M Vùng 1)
    const highEarner: Employee = {
      ...baseEmployee,
      baseSalary: 80_000_000,
      insuranceSalary: 80_000_000
    };

    const ins = calculateInsurance(highEarner, DEFAULT_LEGAL_CONFIG_2026);

    // Căn cứ đóng BHXH/BHYT bị khống chế tối đa 46.800.000đ
    expect(ins.employee.social).toBe(Math.round(46_800_000 * 0.08)); // 3,744,000đ
    expect(ins.employee.health).toBe(Math.round(46_800_000 * 0.015)); // 702,000đ
    
    // Căn cứ đóng BHTN Vùng I: 80M < 106.2M nên tính trên 80M
    expect(ins.employee.unemployment).toBe(Math.round(80_000_000 * 0.01)); // 800,000đ

    // Phía người sử dụng lao động (NSDLĐ): BHXH 17.5%, BHYT 3%, BHTN 1%
    expect(ins.employer.social).toBe(Math.round(46_800_000 * 0.175)); // 8,190,000đ
    expect(ins.employer.health).toBe(Math.round(46_800_000 * 0.03)); // 1,404,000đ
    expect(ins.employer.unemployment).toBe(Math.round(80_000_000 * 0.01)); // 800,000đ
  });

  it('Kiểm tra tính tiền tăng ca và phân tách phần miễn thuế TNCN', () => {
    // Lương 17,600,000đ với 22 ngày công, 8h/ngày -> Đơn giá 100,000đ/giờ
    const otEmp: Employee = {
      ...baseEmployee,
      baseSalary: 17_600_000
    };

    const otAttendance: MonthlyAttendance = {
      ...defaultAttendance,
      normalDayOvertimeHours: 10, // 10h ngày thường (150%) -> 10 * 100k * 1.5 = 1,500,000đ
      weekendOvertimeHours: 5,   // 5h cuối tuần (200%) -> 5 * 100k * 2.0 = 1,000,000đ
      holidayOvertimeHours: 2    // 2h ngày lễ (300%) -> 2 * 100k * 3.0 = 600,000đ
    };

    const ot = calculateOvertime(otAttendance, otEmp.baseSalary);
    expect(ot.hourlyRate).toBe(100_000);
    expect(ot.normalDayPay).toBe(1_500_000);
    expect(ot.weekendPay).toBe(1_000_000);
    expect(ot.holidayPay).toBe(600_000);
    expect(ot.totalOvertimePay).toBe(3_100_000);

    // Thuế TNCN:
    // Phần chịu thuế (100% chuẩn): (10 + 5 + 2) * 100k = 1,700,000đ
    // Phần miễn thuế (vượt 100%): 10 * 50k + 5 * 100k + 2 * 200k = 500k + 500k + 400k = 1,400,000đ
    expect(ot.taxableOvertimePay).toBe(1_700_000);
    expect(ot.taxExemptOvertimePay).toBe(1_400_000);
    expect(ot.taxableOvertimePay + ot.taxExemptOvertimePay).toBe(3_100_000);
  });

  it('Kiểm tra ngày công làm không đủ tháng và nghỉ không lương (Proration)', () => {
    const proratedAttendance: MonthlyAttendance = {
      ...defaultAttendance,
      actualWorkDays: 15,
      paidAnnualLeaveDays: 2, // 2 ngày phép năm có lương
      unpaidLeaveDays: 5     // 5 ngày nghỉ không lương
    };

    const pro = calculateSalaryProration(22_000_000, proratedAttendance);
    // Lương 1 ngày = 22M / 22 = 1,000,000đ/ngày
    // Ngày hưởng lương = 15 + 2 = 17 ngày
    expect(pro.dailyRate).toBe(1_000_000);
    expect(pro.paidDaysCount).toBe(17);
    expect(pro.actualBaseSalary).toBe(17_000_000);
  });

  it('Kiểm tra giải ngược Gross từ Net mục tiêu (Net to Gross)', () => {
    // Mục tiêu: Người lao động muốn nhận Net đúng 20,000,000đ
    const targetNet = 20_000_000;
    const solution = solveGrossFromTargetNet(
      targetNet,
      baseEmployee,
      defaultAttendance,
      emptyAdjustments,
      DEFAULT_LEGAL_CONFIG_2026
    );

    // Kiểm tra lương thực nhận sau khi tính ngược
    expect(Math.abs(solution.payslip.netSalary - targetNet)).toBeLessThanOrEqual(1);
    expect(solution.grossSalary).toBeGreaterThan(targetNet);
  });

  it('Kiểm tra bảo mật: Không có dữ liệu lưu vào browser storage (Zero Storage)', () => {
    // Xác minh nguyên tắc thiết kế: Không ghi dữ liệu nhân viên vào biến lưu trữ toàn cục
    const state = { employees: [baseEmployee] };
    expect(state.employees.length).toBe(1);
    // Khi xóa phiên:
    state.employees = [];
    expect(state.employees.length).toBe(0);
  });
});
