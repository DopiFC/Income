import { Employee } from './employee';
import { MonthlyAttendance, Adjustments } from './attendance';

export interface PayslipItem {
  employee: Employee;
  attendance: MonthlyAttendance;
  adjustments: Adjustments;
  
  // Lương theo ngày công
  dailyRate: number; // baseSalary / standardWorkDays
  hourlyRate: number; // dailyRate / standardWorkHoursPerDay
  actualWorkingDaysCount: number; // actualWorkDays + paidAnnualLeaveDays + paidHolidayDays + paidSpecialLeaveDays + compensatoryLeaveDays
  actualBaseSalary: number; // Lương thực tế theo ngày công hưởng lương

  // Các khoản phụ cấp
  totalLunchAllowance: number;
  taxableLunchAllowance: number;
  taxExemptLunchAllowance: number;
  totalAllowances: number;
  taxExemptAllowances: number;
  taxableAllowances: number;

  // Tăng ca
  overtimeNormalPay: number;
  overtimeWeekendPay: number;
  overtimeHolidayPay: number;
  nightWorkPay: number;
  nightOvertimePay: number;
  totalOvertimePay: number;
  taxableOvertimePay: number; // Phần lương tăng ca 100% cơ bản
  taxExemptOvertimePay: number; // Phần chênh lệch phụ trội vượt 100% được miễn thuế TNCN

  // Thưởng & Thu nhập khác
  totalBonuses: number;
  taxExemptReimbursements: number;
  
  // Tổng thu nhập
  grossIncome: number; // Tổng thu nhập nhận được trước bảo hiểm và thuế

  // Căn cứ đóng bảo hiểm
  insuranceSalaryBase: number;
  socialInsuranceCap: number;
  unemploymentInsuranceCap: number;

  // Bảo hiểm Người Lao Động (NLĐ)
  employeeSocialInsurance: number; // 8%
  employeeHealthInsurance: number; // 1.5%
  employeeUnemploymentInsurance: number; // 1%
  employeeTradeUnion: number; // Công đoàn NLĐ nếu có
  totalEmployeeInsurance: number;

  // Bảo hiểm Người Sử Dụng Lao Động (NSDLĐ)
  employerSocialInsurance: number; // 17.5%
  employerHealthInsurance: number; // 3%
  employerUnemploymentInsurance: number; // 1%
  employerTradeUnion: number; // 2% kinh phí công đoàn
  totalEmployerInsurance: number;
  totalCompanyCost: number; // grossIncome + totalEmployerInsurance

  // Tính thuế TNCN
  assessableIncome: number; // Thu nhập chịu thuế = Tổng thu nhập - Các khoản miễn thuế
  personalDeduction: number;
  dependentDeduction: number;
  totalDeductions: number; // Giảm trừ bản thân + người phụ thuộc + bảo hiểm bắt buộc NLĐ
  taxableIncome: number; // Thu nhập tính thuế = max(0, assessableIncome - totalDeductions)
  personalIncomeTax: number; // Thuế TNCN lũy tiến

  // Khấu trừ khác & tạm ứng
  advancePayment: number;
  otherDeductions: number;
  damageCompensation: number;
  totalOtherDeductions: number;

  // Lương thực nhận (Net)
  netSalary: number; // grossIncome - totalEmployeeInsurance - personalIncomeTax - totalOtherDeductions

  // Cảnh báo & Trạng thái kiểm tra
  warnings: string[];
  isBelowMinimumWage: boolean;
  isOvertimeExceeded: boolean;
}

export interface PayrollSummary {
  month: string;
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalPersonalIncomeTax: number;
  totalEmployeeInsurance: number;
  totalEmployerInsurance: number;
  totalCompanyCost: number;
  warningCount: number;
}
