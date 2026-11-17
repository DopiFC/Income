/**
 * Quy định làm tròn tiền tệ VND:
 * Luôn làm tròn tới số nguyên VND gần nhất (Math.round)
 * để tránh sai lệch số học dấu phẩy động trong quá trình tính toán.
 */
export function roundVND(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount);
}
