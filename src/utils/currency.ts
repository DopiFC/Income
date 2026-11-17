/**
 * Định dạng số nguyên bằng dấu chấm ngăn cách hàng nghìn (VD: 8000000 -> "8.000.000")
 */
function formatDotThousands(num: number): string {
  const isNeg = num < 0;
  const roundedStr = Math.round(Math.abs(num)).toString();
  const formatted = roundedStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNeg ? `-${formatted}` : formatted;
}

/**
 * Định dạng tiền tệ VND chuẩn Việt Nam.
 * Ví dụ: 15.000.000 ₫
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  return formatDotThousands(amount) + ' ₫';
}

/**
 * Định dạng tiền tệ không kèm đơn vị ₫ (dùng cho ô nhập liệu hoặc bảng)
 */
export function formatVNDNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return formatDotThousands(amount);
}

/**
 * Định dạng trực tiếp khi người dùng đang gõ vào ô nhập tiền tệ:
 * Tự động tách dấu chấm hàng nghìn (VD: gõ "8000000" -> "8.000.000").
 */
export function formatLiveVNDInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Định dạng thu gọn: ví dụ 15.5 tr, 1.2 tỷ
 */
export function formatCompactVND(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + ' tỷ ₫';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(2).replace(/\.00$/, '') + ' tr ₫';
  }
  return formatVND(amount);
}

/**
 * Phân tích chuỗi số tiền VND từ người dùng hoặc Excel (hỗ trợ 8.000.000, 8,000,000, 8000000 VNĐ, 8 000 000).
 * Xử lý chính xác nhiều dấu phân cách hàng nghìn để không bị cắt mất số khi dùng parseFloat.
 */
export function parseVND(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const trimmed = value.toString().trim();
  if (!trimmed) return 0;

  const isNegative = trimmed.startsWith('-');
  const cleaned = trimmed.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  const dotMatches = cleaned.match(/\./g) || [];
  const commaMatches = cleaned.match(/,/g) || [];
  let normalized = cleaned;

  if (dotMatches.length > 0 && commaMatches.length > 0) {
    // Có cả dấu chấm và dấu phẩy: dấu xuất hiện sau cùng là dấu thập phân nếu theo sau bởi != 3 chữ số
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (dotMatches.length > 1) {
    // Nhiều dấu chấm (VD: 8.000.000) -> toàn bộ là dấu phân cách hàng nghìn
    normalized = cleaned.replace(/\./g, '');
  } else if (commaMatches.length > 1) {
    // Nhiều dấu phẩy (VD: 8,000,000) -> toàn bộ là dấu phân cách hàng nghìn
    normalized = cleaned.replace(/,/g, '');
  } else if (dotMatches.length === 1) {
    // Một dấu chấm duy nhất: nếu sau dấu chấm có đúng 3 chữ số (VD: 8.000, 730.000) -> dấu hàng nghìn
    const [, frac = ''] = cleaned.split('.');
    if (frac.length === 3) {
      normalized = cleaned.replace('.', '');
    }
  } else if (commaMatches.length === 1) {
    // Một dấu phẩy duy nhất: nếu sau dấu phẩy có đúng 3 chữ số (VD: 730,000) -> dấu hàng nghìn
    const [intPart = '', frac = ''] = cleaned.split(',');
    if (frac.length === 3 && intPart.length > 0) {
      normalized = cleaned.replace(',', '');
    } else {
      normalized = cleaned.replace(',', '.');
    }
  }

  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

/**
 * Đọc số tiền VND thành chữ tiếng Việt chuẩn (dùng cho phiếu lương)
 */
export function readVietnameseCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n) || n === 0) return 'Không đồng';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  let num = Math.round(Math.abs(n));
  if (num === 0) return 'Không đồng';

  function readGroupOfThree(threeDigits: number, showZeroHundred: boolean): string {
    const h = Math.floor(threeDigits / 100);
    const t = Math.floor((threeDigits % 100) / 10);
    const o = threeDigits % 10;
    let res = '';

    if (h > 0 || showZeroHundred) {
      res += digits[h] + ' trăm ';
      if (t === 0 && o > 0) res += 'lẻ ';
    }

    if (t > 1) {
      res += digits[t] + ' mươi ';
      if (o === 1) res += 'mốt ';
      else if (o === 5) res += 'lăm ';
      else if (o > 0) res += digits[o] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (o === 5) res += 'lăm ';
      else if (o > 0) res += digits[o] + ' ';
    } else if (o > 0 && (h > 0 || showZeroHundred)) {
      res += digits[o] + ' ';
    } else if (o > 0 && !showZeroHundred && h === 0) {
      res += digits[o] + ' ';
    }

    return res.trim();
  }

  const groups: number[] = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const showZero = i < groups.length - 1;
      const groupText = readGroupOfThree(groupVal, showZero);
      if (groupText) {
        words += groupText + ' ' + units[i] + ' ';
      }
    }
  }

  words = words.trim();
  if (!words) return 'Không đồng';
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return (n < 0 ? 'Âm ' : '') + capitalized + ' đồng chẵn';
}
