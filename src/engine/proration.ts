import { MonthlyAttendance } from '../types/attendance';
import { roundVND } from './rounding';

export interface ProrationResult {
  dailyRate: number;
  hourlyRate: number;
  paidDaysCount: number;
  actualBaseSalary: number;
  unpaidDaysCount: number;
  bhxhDaysCount: number; // Ốm đau + thai sản
}

export function calculateSalaryProration(
  baseSalary: number,
  attendance: MonthlyAttendance
): ProrationResult {
  const standardDays = attendance.standardWorkDays || 22;
  const standardHours = attendance.standardWorkHoursPerDay || 8;
  const dailyRate = baseSalary / standardDays;
  const hourlyRate = dailyRate / standardHours;

  const paidDaysCount = 
    (attendance.actualWorkDays || 0) +
    (attendance.paidAnnualLeaveDays || 0) +
    (attendance.paidHolidayDays || 0) +
    (attendance.paidSpecialLeaveDays || 0) +
    (attendance.compensatoryLeaveDays || 0);

  const unpaidDaysCount = attendance.unpaidLeaveDays || 0;
  const bhxhDaysCount = (attendance.sickLeaveDays || 0) + (attendance.maternityLeaveDays || 0);

  // Lương thực tế:
  // Nếu đi làm đủ ngày công chuẩn (hoặc hơn) và không có nghỉ không lương: nhận đủ 100% lương
  let actualBaseSalary = 0;
  if (paidDaysCount >= standardDays && unpaidDaysCount === 0 && bhxhDaysCount === 0) {
    actualBaseSalary = baseSalary;
  } else {
    actualBaseSalary = dailyRate * paidDaysCount;
  }

  return {
    dailyRate: roundVND(dailyRate),
    hourlyRate: roundVND(hourlyRate),
    paidDaysCount,
    actualBaseSalary: roundVND(actualBaseSalary),
    unpaidDaysCount,
    bhxhDaysCount
  };
}
