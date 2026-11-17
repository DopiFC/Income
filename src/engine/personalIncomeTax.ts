import { TaxBracket } from '../types/legal';
import { roundVND } from './rounding';

export interface TaxCalculationResult {
  taxableIncome: number;
  totalTax: number;
  breakdown: {
    bracketIndex: number;
    bracketLabel: string;
    bracketIncome: number;
    rate: number;
    taxAmount: number;
  }[];
  method: 'progressive' | 'flat_10_percent' | 'flat_20_percent';
  note?: string;
}

/**
 * Tính thuế TNCN theo biểu thuế lũy tiến từng phần.
 * @param taxableIncome Thu nhập tính thuế (đã trừ bản thân, người phụ thuộc, bảo hiểm)
 * @param brackets Danh sách bậc thuế
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[]
): TaxCalculationResult {
  if (taxableIncome <= 0) {
    return {
      taxableIncome: 0,
      totalTax: 0,
      breakdown: [],
      method: 'progressive'
    };
  }

  const breakdown: {
    bracketIndex: number;
    bracketLabel: string;
    bracketIncome: number;
    rate: number;
    taxAmount: number;
  }[] = [];

  let remaining = taxableIncome;
  let totalTax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const prevTo = b.from;
    const currentLimit = b.to !== null ? b.to - prevTo : Infinity;

    if (remaining <= 0) break;

    const portion = Math.min(remaining, currentLimit);
    const taxOnPortion = portion * b.rate;
    totalTax += taxOnPortion;
    remaining -= portion;

    const label = b.to !== null
      ? `Bậc ${i + 1} (${(b.from / 1_000_000).toFixed(0)}tr - ${(b.to / 1_000_000).toFixed(0)}tr)`
      : `Bậc ${i + 1} (> ${(b.from / 1_000_000).toFixed(0)}tr)`;

    breakdown.push({
      bracketIndex: i + 1,
      bracketLabel: label,
      bracketIncome: roundVND(portion),
      rate: b.rate,
      taxAmount: roundVND(taxOnPortion)
    });
  }

  return {
    taxableIncome: roundVND(taxableIncome),
    totalTax: roundVND(totalTax),
    breakdown,
    method: 'progressive'
  };
}

/**
 * Tính thuế TNCN cho toàn bộ các tình huống:
 * - Cư trú ký HĐLĐ >= 3 tháng: lũy tiến từng phần
 * - Cư trú thử việc ngắn hạn / thời vụ (< 3 tháng) có thu nhập >= 2tr: khấu trừ 10%
 * - Cá nhân không cư trú: 20%
 */
export function computePIT(params: {
  assessableIncome: number; // Thu nhập chịu thuế
  totalDeductions: number; // Giảm trừ gia cảnh + BHXH bắt buộc
  isResident: boolean;
  contractType: string;
  brackets: TaxBracket[];
  hasProbationCommitmentForm08?: boolean; // Cam kết mẫu 08/CK-TNCN không bị trừ 10%
}): TaxCalculationResult {
  const { assessableIncome, totalDeductions, isResident, contractType, brackets, hasProbationCommitmentForm08 } = params;

  // Trường hợp không cư trú: 20% trên thu nhập chịu thuế
  if (!isResident) {
    const tax = Math.max(0, assessableIncome * 0.20);
    return {
      taxableIncome: roundVND(assessableIncome),
      totalTax: roundVND(tax),
      breakdown: [{
        bracketIndex: 1,
        bracketLabel: 'Cá nhân không cư trú (20%)',
        bracketIncome: roundVND(assessableIncome),
        rate: 0.20,
        taxAmount: roundVND(tax)
      }],
      method: 'flat_20_percent',
      note: 'Áp dụng thuế suất cố định 20% đối với cá nhân không cư trú theo Điều 18 Thông tư 111/2013/TT-BTC.'
    };
  }

  // Trường hợp thử việc / bán thời gian dưới 3 tháng không làm cam kết: khấu trừ 10% tại nguồn nếu thu nhập >= 2,000,000 VND
  if (contractType === 'probation' && !hasProbationCommitmentForm08) {
    if (assessableIncome >= 2_000_000) {
      const tax = assessableIncome * 0.10;
      return {
        taxableIncome: roundVND(assessableIncome),
        totalTax: roundVND(tax),
        breakdown: [{
          bracketIndex: 1,
          bracketLabel: 'Khấu trừ thử việc / thời vụ 10%',
          bracketIncome: roundVND(assessableIncome),
          rate: 0.10,
          taxAmount: roundVND(tax)
        }],
        method: 'flat_10_percent',
        note: 'Khấu trừ 10% tại nguồn theo Điểm i Khoản 1 Điều 25 Thông tư 111/2013/TT-BTC đối với hợp đồng dưới 3 tháng có thu nhập từ 2 triệu đồng/lần trở lên.'
      };
    } else {
      return {
        taxableIncome: roundVND(assessableIncome),
        totalTax: 0,
        breakdown: [],
        method: 'flat_10_percent',
        note: 'Thu nhập dưới 2.000.000đ/kỳ chưa thuộc diện khấu trừ 10% tại nguồn.'
      };
    }
  }

  // Hợp đồng chính thức hoặc thử việc có cam kết: tính lũy tiến từng phần
  const taxableIncome = Math.max(0, assessableIncome - totalDeductions);
  return calculateProgressiveTax(taxableIncome, brackets);
}
