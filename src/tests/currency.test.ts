import { describe, it, expect } from 'vitest';
import { formatVND, formatVNDNumber, formatLiveVNDInput, parseVND } from '../utils/currency';

describe('Currency utilities - VND parsing & formatting', () => {
  it('Không làm mất số khi chuyển đổi qua lại giữa 8000000 và 8.000.000', () => {
    const formatted = formatVNDNumber(8_000_000);
    expect(formatted).toBe('8.000.000');
    expect(parseVND(formatted)).toBe(8_000_000);
    expect(parseVND('8.000.000VNĐ')).toBe(8_000_000);
    expect(parseVND('8.000.000 đ')).toBe(8_000_000);
  });

  it('Phân tích chính xác các định dạng số có dấu chấm, phẩy, khoảng trắng', () => {
    expect(parseVND('8000000')).toBe(8_000_000);
    expect(parseVND('8,000,000')).toBe(8_000_000);
    expect(parseVND('8 000 000')).toBe(8_000_000);
    expect(parseVND('730.000')).toBe(730_000);
    expect(parseVND('730,000')).toBe(730_000);
    expect(parseVND('1.500.000.000')).toBe(1_500_000_000);
    expect(parseVND('8.000')).toBe(8_000);
    expect(parseVND('15.5')).toBe(15.5);
    expect(parseVND('8.000.000,5')).toBe(8_000_000.5);
    expect(parseVND('')).toBe(0);
    expect(parseVND(null)).toBe(0);
  });

  it('Tự động tách dấu chấm hàng nghìn khi người dùng đang gõ', () => {
    expect(formatLiveVNDInput('')).toBe('');
    expect(formatLiveVNDInput('8')).toBe('8');
    expect(formatLiveVNDInput('8000')).toBe('8.000');
    expect(formatLiveVNDInput('8000000')).toBe('8.000.000');
    expect(formatLiveVNDInput('8.000.000')).toBe('8.000.000');
    expect(formatLiveVNDInput('008000000')).toBe('8.000.000');
    expect(formatLiveVNDInput('8.000.000 VNĐ')).toBe('8.000.000');
  });

  it('Định dạng hiển thị VND chính xác và bảo toàn round-trip nhiều mức lương', () => {
    const samples = [0, 500, 1_000, 730_000, 5_310_000, 8_000_000, 15_500_000, 46_800_000, 120_000_000];
    for (const amt of samples) {
      expect(parseVND(formatVNDNumber(amt))).toBe(amt);
    }
    expect(formatVND(8_000_000)).toBe('8.000.000 ₫');
  });
});
