import { LegalConfig, TaxBracket } from '../types/legal';

// Biểu thuế lũy tiến từng phần kỳ 2026 theo luật thuế TNCN mới:
// Đến 10 triệu đồng: 5% (Trừ nhanh: 0)
// Trên 10 đến 30 triệu đồng: 10% (Trừ nhanh: 10M*5% - 10M*10% = -0.5M -> 0.5M)
// Trên 30 đến 60 triệu đồng: 20% (Trừ nhanh: 3.5M)
// Trên 60 đến 100 triệu đồng: 30% (Trừ nhanh: 9.5M)
// Trên 100 triệu đồng: 35% (Trừ nhanh: 14.5M)
export const DEFAULT_PIT_BRACKETS_2026: TaxBracket[] = [
  { from: 0, to: 10_000_000, rate: 0.05, quickDeduction: 0 },
  { from: 10_000_000, to: 30_000_000, rate: 0.10, quickDeduction: 500_000 },
  { from: 30_000_000, to: 60_000_000, rate: 0.20, quickDeduction: 3_500_000 },
  { from: 60_000_000, to: 100_000_000, rate: 0.30, quickDeduction: 9_500_000 },
  { from: 100_000_000, to: null, rate: 0.35, quickDeduction: 14_500_000 }
];

export const DEFAULT_LEGAL_CONFIG_2026: LegalConfig = {
  year: 2026,
  effectiveDate: '2026-01-01',
  
  // Giảm trừ gia cảnh từ kỳ tính thuế 2026
  personalDeduction: 15_500_000,
  dependentDeduction: 6_200_000,

  // Lương tối thiểu vùng theo Nghị định 293/2025/NĐ-CP
  regionalMinWage: {
    I: 5_310_000,
    II: 4_730_000,
    III: 4_140_000,
    IV: 3_700_000
  },

  // Mức tham chiếu BHXH
  referenceBaseSalary: 2_340_000,
  insuranceCapMultiplier: 20, // 20 * 2.34M = 46.8M

  // Tỷ lệ trích đóng Người Lao Động
  employeeRates: {
    socialInsurance: 0.08, // 8%
    healthInsurance: 0.015, // 1.5%
    unemploymentInsurance: 0.01, // 1%
    tradeUnion: 0.01 // 1% (tùy đoàn viên)
  },

  // Tỷ lệ trích đóng Doanh nghiệp
  employerRates: {
    socialInsurance: 0.175, // 17.5%
    healthInsurance: 0.03, // 3%
    unemploymentInsurance: 0.01, // 1%
    tradeUnion: 0.02 // 2%
  },

  maxMonthlyOvertimeHoursWarning: 40,
  taxExemptLunchMax: 730_000,
  pitBrackets: DEFAULT_PIT_BRACKETS_2026
};

// Cấu hình tham chiếu 2024 - 2025 (khi tính kỳ lương quá khứ)
export const HISTORICAL_LEGAL_CONFIG_2025: LegalConfig = {
  year: 2025,
  effectiveDate: '2025-01-01',
  personalDeduction: 11_000_000,
  dependentDeduction: 4_400_000,
  regionalMinWage: {
    I: 4_960_000,
    II: 4_410_000,
    III: 3_860_000,
    IV: 3_450_000
  },
  referenceBaseSalary: 2_340_000,
  insuranceCapMultiplier: 20,
  employeeRates: {
    socialInsurance: 0.08,
    healthInsurance: 0.015,
    unemploymentInsurance: 0.01,
    tradeUnion: 0.01
  },
  employerRates: {
    socialInsurance: 0.175,
    healthInsurance: 0.03,
    unemploymentInsurance: 0.01,
    tradeUnion: 0.02
  },
  maxMonthlyOvertimeHoursWarning: 40,
  taxExemptLunchMax: 730_000,
  pitBrackets: [
    { from: 0, to: 5_000_000, rate: 0.05, quickDeduction: 0 },
    { from: 5_000_000, to: 10_000_000, rate: 0.10, quickDeduction: 250_000 },
    { from: 10_000_000, to: 18_000_000, rate: 0.15, quickDeduction: 750_000 },
    { from: 18_000_000, to: 32_000_000, rate: 0.20, quickDeduction: 1_650_000 },
    { from: 32_000_000, to: 52_000_000, rate: 0.25, quickDeduction: 3_250_000 },
    { from: 52_000_000, to: 80_000_000, rate: 0.30, quickDeduction: 5_850_000 },
    { from: 80_000_000, to: null, rate: 0.35, quickDeduction: 9_850_000 }
  ]
};

export function getLegalConfigForMonth(month: string, currentCustomConfig?: LegalConfig): LegalConfig {
  if (currentCustomConfig) {
    return currentCustomConfig;
  }
  const year = parseInt(month.split('-')[0], 10);
  if (year >= 2026) {
    return DEFAULT_LEGAL_CONFIG_2026;
  }
  return HISTORICAL_LEGAL_CONFIG_2025;
}
