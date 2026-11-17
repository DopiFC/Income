import { describe, it, expect } from 'vitest';
import { calculateProgressiveTax, computePIT } from '../engine/personalIncomeTax';
import { DEFAULT_PIT_BRACKETS_2026 } from '../legal/rules';

describe('Biểu thuế TNCN 2026 - Kiểm thử độ chính xác lũy tiến từng phần', () => {
  it('Trường hợp 1: Thu nhập tính thuế bằng 0 hoặc âm -> Thuế bằng 0', () => {
    const resZero = calculateProgressiveTax(0, DEFAULT_PIT_BRACKETS_2026);
    expect(resZero.totalTax).toBe(0);

    const resNegative = calculateProgressiveTax(-5_000_000, DEFAULT_PIT_BRACKETS_2026);
    expect(resNegative.totalTax).toBe(0);
  });

  it('Trường hợp 2: Thu nhập nằm ngay dưới, đúng tại và ngay trên ngưỡng Bậc 1 (10 triệu)', () => {
    // 9,999,999đ -> 5%
    const resBelow = calculateProgressiveTax(9_999_999, DEFAULT_PIT_BRACKETS_2026);
    expect(resBelow.totalTax).toBe(Math.round(9_999_999 * 0.05));

    // Đúng 10,000,000đ -> 500,000đ
    const resAt = calculateProgressiveTax(10_000_000, DEFAULT_PIT_BRACKETS_2026);
    expect(resAt.totalTax).toBe(500_000);

    // 10,000,001đ -> 10,000,000 * 5% + 1 * 10% = 500,000đ (làm tròn)
    const resAbove = calculateProgressiveTax(10_000_001, DEFAULT_PIT_BRACKETS_2026);
    expect(resAbove.totalTax).toBe(500_000);
  });

  it('Trường hợp 3: Thu nhập nằm tại ngưỡng Bậc 2 (30 triệu)', () => {
    // 30,000,000đ:
    // Bậc 1 (10M * 5%) = 500,000đ
    // Bậc 2 (20M * 10%) = 2,000,000đ
    // Tổng = 2,500,000đ
    const res = calculateProgressiveTax(30_000_000, DEFAULT_PIT_BRACKETS_2026);
    expect(res.totalTax).toBe(2_500_000);
    expect(res.breakdown.length).toBe(2);
  });

  it('Trường hợp 4: Thu nhập trải qua Bậc 3 (50 triệu)', () => {
    // 50,000,000đ:
    // Bậc 1 (10M * 5%) = 500,000
    // Bậc 2 (20M * 10%) = 2,000,000
    // Bậc 3 (20M * 20%) = 4,000,000
    // Tổng = 6,500,000đ
    // Hoặc tính nhanh: 50M * 20% - 3.5M = 10M - 3.5M = 6.5M
    const res = calculateProgressiveTax(50_000_000, DEFAULT_PIT_BRACKETS_2026);
    expect(res.totalTax).toBe(6_500_000);
  });

  it('Trường hợp 5: Thu nhập trải qua Bậc 5 cao nhất (120 triệu)', () => {
    // 120,000,000đ:
    // Bậc 1 (10M * 5%) = 500k
    // Bậc 2 (20M * 10%) = 2,000k
    // Bậc 3 (30M * 20%) = 6,000k
    // Bậc 4 (40M * 30%) = 12,000k
    // Bậc 5 (20M * 35%) = 7,000k
    // Tổng = 500k + 2M + 6M + 12M + 7M = 27,500,000đ
    // Tính nhanh: 120M * 35% - 14.5M = 42M - 14.5M = 27.5M
    const res = calculateProgressiveTax(120_000_000, DEFAULT_PIT_BRACKETS_2026);
    expect(res.totalTax).toBe(27_500_000);
    expect(res.breakdown.length).toBe(5);
  });

  it('Trường hợp 6: Giảm trừ gia cảnh người phụ thuộc', () => {
    // Thu nhập chịu thuế: 35,000,000đ
    // Giảm trừ bản thân (2026): 15,500,000đ
    // Trường hợp A: 0 người phụ thuộc -> Giảm trừ 15.5M -> TNTT: 19.5M
    const taxA = computePIT({
      assessableIncome: 35_000_000,
      totalDeductions: 15_500_000,
      isResident: true,
      contractType: 'official_fixed',
      brackets: DEFAULT_PIT_BRACKETS_2026
    });
    // TNTT 19.5M: 10M * 5% + 9.5M * 10% = 500k + 950k = 1,450,000đ
    expect(taxA.totalTax).toBe(1_450_000);

    // Trường hợp B: 2 người phụ thuộc (2 * 6.2M = 12.4M) -> Tổng giảm trừ: 27.9M -> TNTT: 7.1M
    const taxB = computePIT({
      assessableIncome: 35_000_000,
      totalDeductions: 15_500_000 + 12_400_000,
      isResident: true,
      contractType: 'official_fixed',
      brackets: DEFAULT_PIT_BRACKETS_2026
    });
    // TNTT 7.1M: 7.1M * 5% = 355,000đ
    expect(taxB.totalTax).toBe(355_000);
  });

  it('Trường hợp 7: Khấu trừ 10% đối với thử việc / thời vụ ngắn hạn có thu nhập >= 2tr', () => {
    const resProbation = computePIT({
      assessableIncome: 12_000_000,
      totalDeductions: 0,
      isResident: true,
      contractType: 'probation',
      brackets: DEFAULT_PIT_BRACKETS_2026
    });
    expect(resProbation.method).toBe('flat_10_percent');
    expect(resProbation.totalTax).toBe(1_200_000); // 10% của 12M
  });

  it('Trường hợp 8: Cá nhân không cư trú chịu thuế suất 20%', () => {
    const resNonResident = computePIT({
      assessableIncome: 50_000_000,
      totalDeductions: 0,
      isResident: false,
      contractType: 'official_fixed',
      brackets: DEFAULT_PIT_BRACKETS_2026
    });
    expect(resNonResident.method).toBe('flat_20_percent');
    expect(resNonResident.totalTax).toBe(10_000_000); // 20% của 50M
  });
});
