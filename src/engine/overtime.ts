import { MonthlyAttendance } from '../types/attendance';
import { roundVND } from './rounding';

export interface OvertimeResult {
  hourlyRate: number;
  normalDayPay: number;
  weekendPay: number;
  holidayPay: number;
  nightWorkPay: number;
  nightOvertimePay: number;
  totalOvertimePay: number;
  
  // Phân bổ thuế TNCN
  taxableOvertimePay: number; // Phần lương chuẩn 100%
  taxExemptOvertimePay: number; // Phần phụ trội vượt 100% được miễn thuế TNCN
  
  totalHours: number;
  isOvertimeExceeded: boolean;
  warnings: string[];
}

export function calculateOvertime(
  attendance: MonthlyAttendance,
  baseSalary: number,
  maxMonthlyHoursWarning: number = 40
): OvertimeResult {
  const warnings: string[] = [];
  const standardDays = attendance.standardWorkDays || 22;
  const standardHours = attendance.standardWorkHoursPerDay || 8;
  const hourlyRate = baseSalary / (standardDays * standardHours);

  // Giờ làm thêm
  const normalHours = attendance.normalDayOvertimeHours || 0;
  const weekendHours = attendance.weekendOvertimeHours || 0;
  const holidayHours = attendance.holidayOvertimeHours || 0;
  const nightWorkHours = attendance.nightWorkHours || 0;
  const nightOtHours = attendance.nightOvertimeHours || 0;

  const totalHours = normalHours + weekendHours + holidayHours + nightOtHours;

  if (totalHours > maxMonthlyHoursWarning) {
    warnings.push(
      `Tổng số giờ làm thêm trong tháng là ${totalHours}h, đã vượt mức tối đa ${maxMonthlyHoursWarning}h/tháng theo Điều 107 Bộ luật Lao động 2019.`
    );
  }

  // Tiền lương trả cho từng loại
  // 1. Ngày thường: 150% (1.5x)
  const normalDayPay = normalHours * hourlyRate * 1.5;
  const normalExempt = normalHours * hourlyRate * 0.5;
  const normalTaxable = normalHours * hourlyRate * 1.0;

  // 2. Ngày nghỉ hàng tuần: 200% (2.0x)
  const weekendPay = weekendHours * hourlyRate * 2.0;
  const weekendExempt = weekendHours * hourlyRate * 1.0;
  const weekendTaxable = weekendHours * hourlyRate * 1.0;

  // 3. Ngày lễ, Tết, ngày nghỉ có hưởng lương: 300% (3.0x)
  const holidayPay = holidayHours * hourlyRate * 3.0;
  const holidayExempt = holidayHours * hourlyRate * 2.0;
  const holidayTaxable = holidayHours * hourlyRate * 1.0;

  // 4. Làm việc ban đêm: phụ trội ít nhất 30%
  const nightWorkPay = nightWorkHours * hourlyRate * 0.3;
  const nightWorkExempt = nightWorkHours * hourlyRate * 0.3; // Phụ trội ban đêm được miễn thuế
  const nightWorkTaxable = 0;

  // 5. Làm thêm giờ ban đêm: phụ trội thêm 20% của đơn giá ban ngày
  // (ví dụ ngày thường: 150% + 30% + 20%*150% = 210%)
  const nightOvertimeRate = 2.1;
  const nightOvertimePay = nightOtHours * hourlyRate * nightOvertimeRate;
  const nightOtExempt = nightOtHours * hourlyRate * (nightOvertimeRate - 1.0);
  const nightOtTaxable = nightOtHours * hourlyRate * 1.0;

  const totalOvertimePay = normalDayPay + weekendPay + holidayPay + nightWorkPay + nightOvertimePay;
  const taxExemptOvertimePay = normalExempt + weekendExempt + holidayExempt + nightWorkExempt + nightOtExempt;
  const taxableOvertimePay = normalTaxable + weekendTaxable + holidayTaxable + nightWorkTaxable + nightOtTaxable;

  return {
    hourlyRate: roundVND(hourlyRate),
    normalDayPay: roundVND(normalDayPay),
    weekendPay: roundVND(weekendPay),
    holidayPay: roundVND(holidayPay),
    nightWorkPay: roundVND(nightWorkPay),
    nightOvertimePay: roundVND(nightOvertimePay),
    totalOvertimePay: roundVND(totalOvertimePay),
    taxableOvertimePay: roundVND(taxableOvertimePay),
    taxExemptOvertimePay: roundVND(taxExemptOvertimePay),
    totalHours,
    isOvertimeExceeded: totalHours > maxMonthlyHoursWarning,
    warnings
  };
}
