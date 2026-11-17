import { Employee } from '../types/employee';
import { MonthlyAttendance, Adjustments } from '../types/attendance';
import { LegalConfig } from '../types/legal';
import { PayslipItem } from '../types/payroll';
import { roundVND } from './rounding';
import { calculateSalaryProration } from './proration';
import { calculateInsurance } from './insurance';
import { calculateOvertime } from './overtime';
import { computePIT } from './personalIncomeTax';

export function calculateEmployeePayroll(
  employee: Employee,
  attendance: MonthlyAttendance,
  adjustments: Adjustments,
  legalConfig: LegalConfig
): PayslipItem {
  const warnings: string[] = [];

  // 1. Tính lương theo ngày công
  const proration = calculateSalaryProration(employee.baseSalary, attendance);

  // 2. Tính phụ cấp
  // Phụ cấp ăn trưa: miễn thuế tối đa theo hạn mức (730.000đ)
  const totalLunch = employee.lunchAllowance || 0;
  const taxExemptLunch = Math.min(totalLunch, legalConfig.taxExemptLunchMax);
  const taxableLunch = Math.max(0, totalLunch - legalConfig.taxExemptLunchMax);

  // Các phụ cấp khác
  let otherTaxableAllowances = 0;
  let otherTaxExemptAllowances = 0;

  // Phụ cấp chức vụ: chịu thuế, chịu BHXH
  otherTaxableAllowances += employee.positionAllowance || 0;

  // Hỗ trợ điện thoại, đi lại: thường được miễn thuế nếu có quy chế hợp lệ
  otherTaxExemptAllowances += (employee.phoneAllowance || 0) + (employee.transportAllowance || 0);
  // Hỗ trợ nhà ở: tính vào thu nhập chịu thuế (tối đa 15% tổng thu nhập chịu thuế khác)
  otherTaxableAllowances += employee.housingAllowance || 0;

  // Phụ cấp tùy chỉnh
  if (employee.otherAllowances && employee.otherAllowances.length > 0) {
    for (const allw of employee.otherAllowances) {
      if (allw.isTaxable) {
        otherTaxableAllowances += allw.amount || 0;
      } else {
        otherTaxExemptAllowances += allw.amount || 0;
      }
    }
  }

  const totalAllowances = totalLunch + (employee.positionAllowance || 0) + (employee.phoneAllowance || 0) + 
                          (employee.transportAllowance || 0) + (employee.housingAllowance || 0) + 
                          (employee.otherAllowances?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0);

  const totalTaxExemptAllowances = taxExemptLunch + otherTaxExemptAllowances;
  const totalTaxableAllowances = taxableLunch + otherTaxableAllowances;

  // 3. Tính tiền làm thêm giờ (Overtime)
  const otResult = calculateOvertime(attendance, employee.baseSalary, legalConfig.maxMonthlyOvertimeHoursWarning);
  if (otResult.warnings.length > 0) {
    warnings.push(...otResult.warnings);
  }

  // 4. Thưởng và thu nhập bổ sung
  const bonusKpi = adjustments.bonusKpi || 0;
  const bonusSales = adjustments.bonusSales || 0;
  const bonusTet = adjustments.bonusTet || 0;
  const commission = adjustments.commission || 0;
  const retroactivePay = adjustments.retroactivePay || 0;
  const taxExemptReimbursement = adjustments.taxExemptReimbursement || 0;

  const totalBonuses = bonusKpi + bonusSales + bonusTet + commission + retroactivePay;

  // Cảnh báo nếu có khoản khấu trừ phạt nhân viên trái luật (Điều 102, Điều 127 BLLĐ)
  if (adjustments.warningDisciplinaryPenalty) {
    warnings.push(`CẢNH BÁO PHÁP LUẬT: ${adjustments.warningDisciplinaryPenalty}`);
  }

  // 5. Tổng thu nhập Gross
  const grossIncome = roundVND(
    proration.actualBaseSalary + 
    totalAllowances + 
    otResult.totalOvertimePay + 
    totalBonuses + 
    taxExemptReimbursement
  );

  // 6. Tính bảo hiểm bắt buộc
  const insurance = calculateInsurance(employee, legalConfig);
  if (insurance.warnings.length > 0) {
    warnings.push(...insurance.warnings);
  }

  // Kiểm tra lương tối thiểu vùng đối với lương thỏa thuận
  const minWage = legalConfig.regionalMinWage[employee.region || 'I'];
  const isBelowMinimumWage = employee.baseSalary < minWage && employee.contractType !== 'part_time';
  if (isBelowMinimumWage) {
    warnings.push(
      `Lương thỏa thuận (${employee.baseSalary.toLocaleString('vi-VN')} đ) thấp hơn mức lương tối thiểu Vùng ${employee.region} (${minWage.toLocaleString('vi-VN')} đ theo NĐ 293/2025/NĐ-CP).`
    );
  }

  // 7. Tính thuế Thu nhập cá nhân (PIT)
  // Thu nhập chịu thuế (Assessable income) = Lương thực tế + phụ cấp chịu thuế + thưởng + tăng ca chịu thuế
  const assessableIncome = roundVND(
    proration.actualBaseSalary + 
    totalTaxableAllowances + 
    otResult.taxableOvertimePay + 
    totalBonuses
  );

  // Giảm trừ bản thân và người phụ thuộc
  const personalDeduction = legalConfig.personalDeduction;
  const dependentDeduction = legalConfig.dependentDeduction * (employee.dependentsCount || 0);
  const insuranceDeduction = insurance.employee.total; // BHXH, BHYT, BHTN được trừ khỏi thu nhập chịu thuế

  const totalDeductions = roundVND(personalDeduction + dependentDeduction + insuranceDeduction);
  const taxableIncome = Math.max(0, assessableIncome - totalDeductions);

  const pitResult = computePIT({
    assessableIncome,
    totalDeductions,
    isResident: employee.residencyStatus === 'resident',
    contractType: employee.contractType,
    brackets: legalConfig.pitBrackets
  });

  const personalIncomeTax = roundVND(pitResult.totalTax);

  // 8. Các khoản khấu trừ khác và tạm ứng
  const advancePayment = adjustments.advancePayment || 0;
  const damageCompensation = adjustments.damageCompensation || 0;
  const otherDeductions = adjustments.otherDeductions || 0;
  const totalOtherDeductions = roundVND(advancePayment + damageCompensation + otherDeductions);

  // 9. Lương thực nhận (Net salary)
  const netSalary = roundVND(
    grossIncome - 
    insurance.employee.total - 
    personalIncomeTax - 
    totalOtherDeductions
  );

  return {
    employee,
    attendance,
    adjustments,
    dailyRate: proration.dailyRate,
    hourlyRate: proration.hourlyRate,
    actualWorkingDaysCount: proration.paidDaysCount,
    actualBaseSalary: proration.actualBaseSalary,
    
    totalLunchAllowance: totalLunch,
    taxableLunchAllowance: taxableLunch,
    taxExemptLunchAllowance: taxExemptLunch,
    totalAllowances: roundVND(totalAllowances),
    taxExemptAllowances: roundVND(totalTaxExemptAllowances),
    taxableAllowances: roundVND(totalTaxableAllowances),

    overtimeNormalPay: otResult.normalDayPay,
    overtimeWeekendPay: otResult.weekendPay,
    overtimeHolidayPay: otResult.holidayPay,
    nightWorkPay: otResult.nightWorkPay,
    nightOvertimePay: otResult.nightOvertimePay,
    totalOvertimePay: otResult.totalOvertimePay,
    taxableOvertimePay: otResult.taxableOvertimePay,
    taxExemptOvertimePay: otResult.taxExemptOvertimePay,

    totalBonuses: roundVND(totalBonuses),
    taxExemptReimbursements: roundVND(taxExemptReimbursement),
    
    grossIncome,

    insuranceSalaryBase: insurance.insuranceSalaryBase,
    socialInsuranceCap: insurance.socialCap,
    unemploymentInsuranceCap: insurance.unemploymentCap,

    employeeSocialInsurance: insurance.employee.social,
    employeeHealthInsurance: insurance.employee.health,
    employeeUnemploymentInsurance: insurance.employee.unemployment,
    employeeTradeUnion: insurance.employee.tradeUnion,
    totalEmployeeInsurance: insurance.employee.total,

    employerSocialInsurance: insurance.employer.social,
    employerHealthInsurance: insurance.employer.health,
    employerUnemploymentInsurance: insurance.employer.unemployment,
    employerTradeUnion: insurance.employer.tradeUnion,
    totalEmployerInsurance: insurance.employer.total,
    totalCompanyCost: roundVND(grossIncome + insurance.employer.total),

    assessableIncome,
    personalDeduction,
    dependentDeduction,
    totalDeductions,
    taxableIncome,
    personalIncomeTax,

    advancePayment,
    damageCompensation,
    otherDeductions,
    totalOtherDeductions,

    netSalary,

    warnings,
    isBelowMinimumWage,
    isOvertimeExceeded: otResult.isOvertimeExceeded
  };
}
