export type BetType = 'lo' | 'de' | 'xien2';

export type BetResultStatus = 'pending' | 'win' | 'loss';

export interface Bet {
  id: string;
  type: BetType;
  numbers: string; // "23", "51", "23-51"
  amount: number; // Điểm (với Lô) hoặc Tiền VNĐ (với Đề, Xiên 2)
  cost: number; // Thành tiền đã đánh VNĐ
  result: BetResultStatus; // 'pending' | 'win' | 'loss'
  hits: number; // Số nháy trúng (0 đối với trượt/chưa có, 1, 2, 3, 4, ... đối với trúng)
  payout: number; // Tiền trúng VNĐ
  profit: number; // Lãi/lỗ = payout - cost (âm hoặc dương)
  createdAt?: string;
}

export interface DailySession {
  date: string; // YYYY-MM-DD
  initialCapital: number; // Vốn ban đầu (VNĐ)
  bets: Bet[];
  updatedAt?: string;
}

export interface Settings {
  loCostPerPoint: number; // Giá 1 điểm lô (Mặc định: 23.000 đ)
  loPayoutPerPoint: number; // Tiền trúng 1 điểm lô (Mặc định: 80.000 đ)
  dePayoutMultiplier: number; // Hệ số Đề (Mặc định: 60, đánh 10k ăn 600k)
  xien2PayoutMultiplier: number; // Hệ số Xiên 2 (Mặc định: 10, đánh 50k ăn 500k)
}

export interface DailySummary {
  totalCost: number;
  totalPayout: number;
  totalProfit: number;
  remainingCapital: number;
  capitalUsageRate: number; // Tỷ lệ % vốn đã sử dụng (0 - 100)
}

export interface DayHistoryRecord {
  date: string;
  initialCapital: number;
  totalCost: number;
  totalPayout: number;
  totalProfit: number;
  remainingCapital: number;
  betsCount: number;
  winCount: number;
  lossCount: number;
  pendingCount: number;
  bets: Bet[];
}

export interface Statistics {
  period: 'today' | '7days' | '30days' | 'all';
  totalBetsCost: number;
  totalPayout: number;
  totalProfit: number;
  grossProfit: number; // Tổng các khoản lãi dương
  grossLoss: number; // Tổng các khoản lỗ âm
  winDaysCount: number;
  lossDaysCount: number;
  evenDaysCount: number;
  winRate: number;
  chartData: Array<{
    date: string;
    displayDate: string;
    cost: number;
    payout: number;
    profit: number;
  }>;
}
