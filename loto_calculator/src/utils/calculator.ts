import { Bet, Settings, DailySummary } from '../types';

/**
 * Cài đặt mặc định ban đầu
 */
export const DEFAULT_SETTINGS: Settings = {
  loCostPerPoint: 23000, // Giá 1 điểm lô: 23.000 đ
  loPayoutPerPoint: 80000, // Tiền trúng 1 điểm lô: 80.000 đ
  dePayoutMultiplier: 60, // Hệ số Đề: x60 (10.000đ ăn 600.000đ)
  xien2PayoutMultiplier: 10, // Hệ số Xiên 2: x10 (50.000đ ăn 500.000đ)
};

/**
 * Tính tiền đánh Lô:
 * Tiền đánh = Số điểm × Mức giá mỗi điểm (Mặc định: 23.000đ)
 */
export function calculateLoCost(points: number, costPerPoint: number = DEFAULT_SETTINGS.loCostPerPoint): number {
  if (points <= 0 || costPerPoint <= 0) return 0;
  return Math.round(points * costPerPoint);
}

/**
 * Tính tiền trúng Lô:
 * Tiền trúng = Số điểm × Mức trả thưởng mỗi điểm × Số nháy
 */
export function calculateLoPayout(
  points: number,
  payoutPerPoint: number = DEFAULT_SETTINGS.loPayoutPerPoint,
  hits: number = 0
): number {
  if (points <= 0 || payoutPerPoint <= 0 || hits <= 0) return 0;
  return Math.round(points * payoutPerPoint * hits);
}

/**
 * Tính tiền trúng Đề:
 * Tiền trúng = Tiền đánh × Hệ số Đề (Mặc định: x60)
 */
export function calculateDePayout(
  amount: number,
  multiplier: number = DEFAULT_SETTINGS.dePayoutMultiplier,
  isWin: boolean = true
): number {
  if (amount <= 0 || multiplier <= 0 || !isWin) return 0;
  return Math.round(amount * multiplier);
}

/**
 * Tính tiền trúng Xiên 2:
 * Tiền trúng = Tiền đánh × Hệ số Xiên 2 (Mặc định: x10)
 */
export function calculateXien2Payout(
  amount: number,
  multiplier: number = DEFAULT_SETTINGS.xien2PayoutMultiplier,
  isWin: boolean = true
): number {
  if (amount <= 0 || multiplier <= 0 || !isWin) return 0;
  return Math.round(amount * multiplier);
}

/**
 * Tính Lãi/Lỗ thực tế:
 * Lãi/Lỗ = Tiền trúng - Tiền đánh
 */
export function calculateProfit(payout: number, cost: number): number {
  return Math.round(payout - cost);
}

/**
 * Tính tổng các chỉ số trong ngày từ danh sách các khoản đánh
 */
export function calculateDailyTotal(
  bets: Bet[],
  initialCapital: number = 0
): DailySummary {
  let totalCost = 0;
  let totalPayout = 0;

  for (const bet of bets) {
    totalCost += bet.cost || 0;
    totalPayout += bet.payout || 0;
  }

  const totalProfit = calculateProfit(totalPayout, totalCost);
  const remainingCapital = calculateRemainingCapital(initialCapital, totalCost);

  let capitalUsageRate = 0;
  if (initialCapital > 0) {
    capitalUsageRate = Math.min(100, Math.round((totalCost / initialCapital) * 100));
  }

  return {
    totalCost,
    totalPayout,
    totalProfit,
    remainingCapital,
    capitalUsageRate,
  };
}

/**
 * Tính Vốn còn lại:
 * Vốn còn lại = Vốn ban đầu - Tổng tiền đã đánh
 */
export function calculateRemainingCapital(initialCapital: number, totalCost: number): number {
  return Math.round(initialCapital - totalCost);
}

/**
 * Định dạng tiền tệ VNĐ (ví dụ: 1.150.000 đ)
 */
export function formatVND(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0 đ';
  const rounded = Math.round(value);
  return `${rounded.toLocaleString('vi-VN')} đ`;
}

/**
 * Định dạng tiền tệ có hiển thị dấu + / - rõ ràng cho Lãi/Lỗ
 * Ví dụ: +800.000 đ hoặc -1.000.000 đ hoặc 0 đ
 */
export function formatVNDWithSign(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0 đ';
  const rounded = Math.round(value);
  if (rounded > 0) {
    return `+${rounded.toLocaleString('vi-VN')} đ`;
  } else if (rounded < 0) {
    return `-${Math.abs(rounded).toLocaleString('vi-VN')} đ`;
  }
  return '0 đ';
}

/**
 * Hàm phân tích số tiền thông minh từ chuỗi người dùng nhập (loại bỏ chữ, giữ số)
 * Ví dụ: "10000" -> 10000, "10.000 đ" -> 10000
 */
export function parseSmartMoney(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.max(0, Math.round(input));
  if (!input) return 0;
  const digitsOnly = input.toString().replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  const num = parseInt(digitsOnly, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Format chuỗi số khi người dùng đang gõ (nhập tiền thông minh: 10000 -> 10.000)
 */
export function formatMoneyInput(raw: string | number): string {
  const num = parseSmartMoney(raw);
  if (num === 0) return '';
  return num.toLocaleString('vi-VN');
}
