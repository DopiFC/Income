import { Employee } from '../types/employee';
import { LegalConfig } from '../types/legal';
import { roundVND } from './rounding';

export interface InsuranceBreakdown {
  insuranceSalaryBase: number;
  socialCap: number;
  unemploymentCap: number;
  minWageFloor: number;

  employee: {
    social: number; // 8%
    health: number; // 1.5%
    unemployment: number; // 1%
    tradeUnion: number; // 1% nếu tham gia đoàn
    total: number;
  };

  employer: {
    social: number; // 17.5%
    health: number; // 3%
    unemployment: number; // 1%
    tradeUnion: number; // 2%
    total: number;
  };

  warnings: string[];
}

export function calculateInsurance(
  employee: Employee,
  legalConfig: LegalConfig
): InsuranceBreakdown {
  const warnings: string[] = [];
  const region = employee.region || 'I';
  const minWage = legalConfig.regionalMinWage[region];
  const socialCap = legalConfig.referenceBaseSalary * legalConfig.insuranceCapMultiplier; // 46,800,000đ
  const unemploymentCap = minWage * legalConfig.insuranceCapMultiplier; // 20 * Lương tối thiểu vùng

  // Hợp đồng thử việc riêng biệt không bắt buộc đóng BHXH
  if (employee.contractType === 'probation' && !employee.hasSocialInsurance) {
    return {
      insuranceSalaryBase: 0,
      socialCap,
      unemploymentCap,
      minWageFloor: minWage,
      employee: { social: 0, health: 0, unemployment: 0, tradeUnion: 0, total: 0 },
      employer: { social: 0, health: 0, unemployment: 0, tradeUnion: 0, total: 0 },
      warnings: []
    };
  }

  // Mức lương căn cứ đóng BH:
  // Nếu có tùy chọn riêng hoặc lương cố định
  let baseForInsurance = employee.useCustomInsuranceSalary && employee.insuranceSalary > 0
    ? employee.insuranceSalary
    : employee.baseSalary;

  // Kiểm tra cảnh báo sàn lương tối thiểu vùng
  if (baseForInsurance < minWage) {
    warnings.push(
      `Mức lương đóng BHXH (${baseForInsurance.toLocaleString('vi-VN')} đ) thấp hơn mức lương tối thiểu Vùng ${region} (${minWage.toLocaleString('vi-VN')} đ theo NĐ 293/2025/NĐ-CP).`
    );
  }

  // Căn cứ đóng BHXH & BHYT (bị khống chế trần 20 lần mức tham chiếu)
  const baseSocialHealth = Math.min(baseForInsurance, socialCap);
  // Căn cứ đóng BHTN (bị khống chế trần 20 lần lương tối thiểu vùng)
  const baseUnemployment = Math.min(baseForInsurance, unemploymentCap);

  // Người lao động
  const empSocial = employee.hasSocialInsurance
    ? roundVND(baseSocialHealth * legalConfig.employeeRates.socialInsurance)
    : 0;
  const empHealth = employee.hasHealthInsurance
    ? roundVND(baseSocialHealth * legalConfig.employeeRates.healthInsurance)
    : 0;
  const empUnemployment = employee.hasUnemploymentInsurance
    ? roundVND(baseUnemployment * legalConfig.employeeRates.unemploymentInsurance)
    : 0;
  const empUnion = employee.hasTradeUnion
    ? roundVND(Math.min(baseForInsurance * legalConfig.employeeRates.tradeUnion, legalConfig.referenceBaseSalary * 0.10))
    : 0;

  const totalEmployee = empSocial + empHealth + empUnemployment + empUnion;

  // Người sử dụng lao động
  const compSocial = employee.hasSocialInsurance
    ? roundVND(baseSocialHealth * legalConfig.employerRates.socialInsurance)
    : 0;
  const compHealth = employee.hasHealthInsurance
    ? roundVND(baseSocialHealth * legalConfig.employerRates.healthInsurance)
    : 0;
  const compUnemployment = employee.hasUnemploymentInsurance
    ? roundVND(baseUnemployment * legalConfig.employerRates.unemploymentInsurance)
    : 0;
  const compUnion = employee.hasTradeUnion
    ? roundVND(baseSocialHealth * legalConfig.employerRates.tradeUnion)
    : 0;

  const totalEmployer = compSocial + compHealth + compUnemployment + compUnion;

  return {
    insuranceSalaryBase: baseForInsurance,
    socialCap,
    unemploymentCap,
    minWageFloor: minWage,
    employee: {
      social: empSocial,
      health: empHealth,
      unemployment: empUnemployment,
      tradeUnion: empUnion,
      total: totalEmployee
    },
    employer: {
      social: compSocial,
      health: compHealth,
      unemployment: compUnemployment,
      tradeUnion: compUnion,
      total: totalEmployer
    },
    warnings
  };
}
