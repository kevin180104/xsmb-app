import { DailySession, Settings, DayHistoryRecord, Statistics } from '../types';
import { DEFAULT_SETTINGS, calculateDailyTotal } from './calculator';

const SETTINGS_KEY = 'loto_calc_settings';
const SESSIONS_KEY = 'loto_calc_sessions';

/**
 * Lấy cài đặt tỷ lệ từ localStorage
 */
export function getSavedSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      loCostPerPoint: Number(parsed.loCostPerPoint) || DEFAULT_SETTINGS.loCostPerPoint,
      loPayoutPerPoint: Number(parsed.loPayoutPerPoint) || DEFAULT_SETTINGS.loPayoutPerPoint,
      dePayoutMultiplier: Number(parsed.dePayoutMultiplier) || DEFAULT_SETTINGS.dePayoutMultiplier,
      xien2PayoutMultiplier: Number(parsed.xien2PayoutMultiplier) || DEFAULT_SETTINGS.xien2PayoutMultiplier,
    };
  } catch (e) {
    console.error('Lỗi đọc cài đặt:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Lưu cài đặt tỷ lệ
 */
export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Lỗi lưu cài đặt:', e);
  }
}

/**
 * Lấy toàn bộ các phiên ngày (Sessions)
 */
export function getAllSessions(): Record<string, DailySession> {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) {
    console.error('Lỗi đọc danh sách phiên đánh:', e);
    return {};
  }
}

/**
 * Lưu toàn bộ các phiên
 */
export function saveAllSessions(sessions: Record<string, DailySession>): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Lỗi lưu danh sách phiên đánh:', e);
  }
}

/**
 * Lấy session của một ngày cụ thể (mặc định vốn 5.000.000 nếu chưa có)
 */
export function getSessionByDate(dateStr: string): DailySession {
  const sessions = getAllSessions();
  if (sessions[dateStr]) {
    return sessions[dateStr];
  }
  return {
    date: dateStr,
    initialCapital: 5000000, // Vốn mặc định 5 triệu
    bets: [],
  };
}

/**
 * Lưu hoặc cập nhật session của 1 ngày
 */
export function saveSession(session: DailySession): void {
  const sessions = getAllSessions();
  sessions[session.date] = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  saveAllSessions(sessions);
}

/**
 * Lấy danh sách lịch sử tất cả các ngày đã có dữ liệu, sắp xếp mới nhất lên đầu
 */
export function getHistoryList(): DayHistoryRecord[] {
  const sessions = getAllSessions();
  const dates = Object.keys(sessions).sort((a, b) => b.localeCompare(a));

  return dates.map((date) => {
    const session = sessions[date];
    const summary = calculateDailyTotal(session.bets, session.initialCapital);
    const winCount = session.bets.filter((b) => b.result === 'win').length;
    const lossCount = session.bets.filter((b) => b.result === 'loss').length;
    const pendingCount = session.bets.filter((b) => b.result === 'pending').length;

    return {
      date,
      initialCapital: session.initialCapital,
      totalCost: summary.totalCost,
      totalPayout: summary.totalPayout,
      totalProfit: summary.totalProfit,
      remainingCapital: summary.remainingCapital,
      betsCount: session.bets.length,
      winCount,
      lossCount,
      pendingCount,
      bets: session.bets,
    };
  });
}

/**
 * Tính toán số liệu thống kê theo khoảng thời gian
 */
export function getStatistics(period: 'today' | '7days' | '30days' | 'all', todayDateStr: string): Statistics {
  const allHistory = getHistoryList();
  let filtered: DayHistoryRecord[] = [];

  if (period === 'today') {
    filtered = allHistory.filter((item) => item.date === todayDateStr);
    if (filtered.length === 0) {
      // Nếu chưa có phiên hôm nay thì tạo rỗng
      const todaySession = getSessionByDate(todayDateStr);
      const sum = calculateDailyTotal(todaySession.bets, todaySession.initialCapital);
      filtered = [
        {
          date: todayDateStr,
          initialCapital: todaySession.initialCapital,
          totalCost: sum.totalCost,
          totalPayout: sum.totalPayout,
          totalProfit: sum.totalProfit,
          remainingCapital: sum.remainingCapital,
          betsCount: todaySession.bets.length,
          winCount: todaySession.bets.filter((b) => b.result === 'win').length,
          lossCount: todaySession.bets.filter((b) => b.result === 'loss').length,
          pendingCount: todaySession.bets.filter((b) => b.result === 'pending').length,
          bets: todaySession.bets,
        },
      ];
    }
  } else if (period === '7days') {
    filtered = allHistory.slice(0, 7);
  } else if (period === '30days') {
    filtered = allHistory.slice(0, 30);
  } else {
    filtered = allHistory;
  }

  let totalBetsCost = 0;
  let totalPayout = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winDaysCount = 0;
  let lossDaysCount = 0;
  let evenDaysCount = 0;

  // Đảo ngược để vẽ biểu đồ theo thứ tự thời gian từ cũ tới mới
  const chartData = [...filtered].reverse().map((item) => {
    const dParts = item.date.split('-');
    const displayDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}` : item.date;

    totalBetsCost += item.totalCost;
    totalPayout += item.totalPayout;

    if (item.totalProfit > 0) {
      grossProfit += item.totalProfit;
      winDaysCount++;
    } else if (item.totalProfit < 0) {
      grossLoss += Math.abs(item.totalProfit);
      lossDaysCount++;
    } else if (item.betsCount > 0) {
      evenDaysCount++;
    }

    return {
      date: item.date,
      displayDate,
      cost: item.totalCost,
      payout: item.totalPayout,
      profit: item.totalProfit,
    };
  });

  const totalProfit = totalPayout - totalBetsCost;
  const totalEvaluatedDays = winDaysCount + lossDaysCount;
  const winRate = totalEvaluatedDays > 0 ? Math.round((winDaysCount / totalEvaluatedDays) * 100) : 0;

  return {
    period,
    totalBetsCost,
    totalPayout,
    totalProfit,
    grossProfit,
    grossLoss,
    winDaysCount,
    lossDaysCount,
    evenDaysCount,
    winRate,
    chartData,
  };
}

/**
 * Xuất toàn bộ dữ liệu ra JSON để tải về máy
 */
export function exportDataAsJSON(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: getSavedSettings(),
    sessions: getAllSessions(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Nhập dữ liệu từ chuỗi JSON
 */
export function importDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.settings) {
      saveSettings(parsed.settings);
    }
    if (parsed.sessions && typeof parsed.sessions === 'object') {
      saveAllSessions(parsed.sessions);
    }
    return true;
  } catch (e) {
    console.error('Lỗi phân tích JSON khi import:', e);
    return false;
  }
}

/**
 * Xóa sạch toàn bộ dữ liệu
 */
export function clearAllData(): void {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SESSIONS_KEY);
}

/**
 * Tiện ích lấy chuỗi ngày hôm nay YYYY-MM-DD theo giờ địa phương
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
