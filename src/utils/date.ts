import { MonthlyAttendance } from '../types/attendance';

export function getCurrentMonthStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `Tháng ${parseInt(month, 10)}/${year}`;
}

/**
 * Tính số ngày làm việc chuẩn (thứ 2 - thứ 6 hoặc thứ 2 - thứ 7)
 */
export function calculateWorkingDaysInMonth(year: number, month: number, workSaturdays: boolean = false): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0: CN, 6: T7
    if (dayOfWeek !== 0) {
      if (workSaturdays || dayOfWeek !== 6) {
        count++;
      }
    }
  }
  return count;
}

export function createDefaultAttendance(employeeId: string, month: string, standardDays: number = 22): MonthlyAttendance {
  return {
    employeeId,
    month,
    standardWorkDays: standardDays,
    standardWorkHoursPerDay: 8,
    actualWorkDays: standardDays,
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
    nightOvertimeHours: 0,
    notes: ''
  };
}
