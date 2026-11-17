import { Employee } from '../types/employee';
import { MonthlyAttendance, Adjustments } from '../types/attendance';
import { LegalConfig } from '../types/legal';
import { PayslipItem } from '../types/payroll';
import { calculateEmployeePayroll } from './salaryCalculation';
import { roundVND } from './rounding';

/**
 * Tính Net từ Gross chuẩn.
 */
export function calculateGrossToNet(
  employee: Employee,
  attendance: MonthlyAttendance,
  adjustments: Adjustments,
  legalConfig: LegalConfig
): PayslipItem {
  return calculateEmployeePayroll(employee, attendance, adjustments, legalConfig);
}

/**
 * Chế độ B: Quy đổi từ Lương Net mục tiêu sang Lương Gross.
 * Sử dụng giải thuật Tìm kiếm nhị phân (Binary Search / Bisection)
 * để tính chính xác mức Gross cần ký hợp đồng với sai số tuyệt đối < 1 VND.
 */
export function solveGrossFromTargetNet(
  targetNet: number,
  employeeTemplate: Employee,
  attendance: MonthlyAttendance,
  adjustments: Adjustments,
  legalConfig: LegalConfig,
  tolerance: number = 1,
  maxIterations: number = 60
): { grossSalary: number; payslip: PayslipItem; iterations: number; delta: number } {
  if (targetNet <= 0) {
    const dummyEmp: Employee = { ...employeeTemplate, baseSalary: 0 };
    const p = calculateEmployeePayroll(dummyEmp, attendance, adjustments, legalConfig);
    return { grossSalary: 0, payslip: p, iterations: 0, delta: 0 };
  }

  // Khung tìm kiếm:
  // Gross luôn >= Net.
  // Giả sử mức trần tối đa là 500,000,000đ hoặc gấp 3 lần Net
  let low = targetNet;
  let high = Math.max(targetNet * 3, 500_000_000);

  let bestGross = low;
  let bestPayslip = calculateEmployeePayroll({ ...employeeTemplate, baseSalary: low }, attendance, adjustments, legalConfig);
  let iterations = 0;

  while (iterations < maxIterations && (high - low) > tolerance) {
    iterations++;
    const mid = (low + high) / 2;
    const testEmp: Employee = { ...employeeTemplate, baseSalary: mid };
    const currentPayslip = calculateEmployeePayroll(testEmp, attendance, adjustments, legalConfig);
    const diff = currentPayslip.netSalary - targetNet;

    if (Math.abs(diff) <= tolerance) {
      bestGross = mid;
      bestPayslip = currentPayslip;
      break;
    }

    if (diff < 0) {
      // Net tính ra còn thấp hơn mục tiêu -> cần tăng Gross
      low = mid;
    } else {
      // Net tính ra đã vượt mục tiêu -> giảm Gross
      high = mid;
    }

    bestGross = mid;
    bestPayslip = currentPayslip;
  }

  const roundedGross = roundVND(bestGross);
  const finalPayslip = calculateEmployeePayroll({ ...employeeTemplate, baseSalary: roundedGross }, attendance, adjustments, legalConfig);
  const delta = finalPayslip.netSalary - targetNet;

  return {
    grossSalary: roundedGross,
    payslip: finalPayslip,
    iterations,
    delta
  };
}
