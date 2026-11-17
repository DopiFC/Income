export interface TaxBracket {
  from: number; // VND
  to: number | null; // null for no upper limit
  rate: number; // e.g. 0.05, 0.10, 0.20, 0.30, 0.35
  quickDeduction: number; // VND
}

export interface LegalConfig {
  year: number;
  effectiveDate: string;
  
  // Giảm trừ gia cảnh (2026: 15.5M bản thân, 6.2M người phụ thuộc)
  personalDeduction: number;
  dependentDeduction: number;

  // Lương tối thiểu vùng theo Nghị định 293/2025/NĐ-CP (từ 01/01/2026)
  regionalMinWage: {
    I: number; // 5,310,000 VND
    II: number; // 4,730,000 VND
    III: number; // 4,140,000 VND
    IV: number; // 3,700,000 VND
  };

  // Mức tham chiếu / cơ sở dùng làm trần BHXH, BHYT (theo Luật BHXH 41/2024/QH15)
  // Trần BHXH & BHYT = 20 lần mức tham chiếu
  referenceBaseSalary: number; // Hiện hành 2,340,000 VND -> Trần 46,800,000 VND
  insuranceCapMultiplier: number; // 20
  
  // Tỷ lệ trích BHXH, BHYT, BHTN Người Lao Động
  employeeRates: {
    socialInsurance: number; // 0.08 (8%)
    healthInsurance: number; // 0.015 (1.5%)
    unemploymentInsurance: number; // 0.01 (1%)
    tradeUnion: number; // 0.01 (1% lương đóng BH, tối đa 10% mức tham chiếu nếu có)
  };

  // Tỷ lệ trích đóng Người Sử Dụng Lao Động
  employerRates: {
    socialInsurance: number; // 0.175 (17.5% gồm 14% hưu trí tử tuất, 3% ốm đau thai sản, 0.5% TNLĐ-BNN)
    healthInsurance: number; // 0.03 (3%)
    unemploymentInsurance: number; // 0.01 (1%)
    tradeUnion: number; // 0.02 (2% quỹ tiền lương đóng BHXH)
  };

  // Giới hạn tăng ca theo Bộ luật Lao động 2019: tối đa 40h/tháng (trường hợp đặc biệt 40h/tháng, bình thường 40h/tháng, 200-300h/năm)
  maxMonthlyOvertimeHoursWarning: number; // 40h

  // Mức ăn trưa miễn thuế tối đa (730,000 VND/tháng theo Thông tư 26/2015/TT-BTC)
  taxExemptLunchMax: number;

  // Biểu thuế lũy tiến từng phần
  pitBrackets: TaxBracket[];
}

export interface LegalSource {
  id: string;
  lawName: string;
  docNumber: string;
  issuedDate: string;
  effectiveDate: string;
  url: string;
  summary: string;
  lastChecked: string;
}
