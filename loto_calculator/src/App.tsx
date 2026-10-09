import { useState, useEffect } from 'react';
import { Settings, DailySession, Bet } from './types';
import {
  getSavedSettings,
  saveSettings,
  getSessionByDate,
  saveSession,
  getHistoryList,
  getTodayDateString,
} from './utils/storage';
import { calculateDailyTotal } from './utils/calculator';
import { Dashboard } from './components/Dashboard';
import { TodayBets } from './components/TodayBets';
import { QuickCalculator } from './components/QuickCalculator';
import { HistoryView } from './components/HistoryView';
import { StatisticsView } from './components/StatisticsView';
import { SettingsView } from './components/SettingsView';
import {
  CalendarDays,
  Zap,
  History,
  BarChart3,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'quick' | 'history' | 'stats' | 'settings'>('today');
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [settings, setSettingsState] = useState<Settings>(getSavedSettings());
  const [session, setSession] = useState<DailySession>(() => getSessionByDate(getTodayDateString()));

  // Khi đổi ngày, nạp session tương ứng
  useEffect(() => {
    const loaded = getSessionByDate(currentDate);
    setSession(loaded);
  }, [currentDate]);

  // Lưu session khi session thay đổi
  const handleUpdateSession = (updatedSession: DailySession) => {
    setSession(updatedSession);
    saveSession(updatedSession);
  };

  // Cập nhật Vốn ban đầu
  const handleUpdateCapital = (newCapital: number) => {
    const updated: DailySession = {
      ...session,
      initialCapital: newCapital,
    };
    handleUpdateSession(updated);
  };

  // Thêm một khoản cược mới
  const handleAddBet = (newBet: Bet) => {
    const updatedBets = [newBet, ...session.bets];
    const updated: DailySession = {
      ...session,
      bets: updatedBets,
    };
    handleUpdateSession(updated);
  };

  // Cập nhật một khoản cược (ví dụ: đổi trạng thái Trúng/Trượt/Nháy)
  const handleUpdateBet = (updatedBet: Bet) => {
    const updatedBets = session.bets.map((b) => (b.id === updatedBet.id ? updatedBet : b));
    const updated: DailySession = {
      ...session,
      bets: updatedBets,
    };
    handleUpdateSession(updated);
  };

  // Xóa một khoản cược
  const handleDeleteBet = (betId: string) => {
    const updatedBets = session.bets.filter((b) => b.id !== betId);
    const updated: DailySession = {
      ...session,
      bets: updatedBets,
    };
    handleUpdateSession(updated);
  };

  // Xóa toàn bộ các khoản cược của ngày đang chọn
  const handleClearBets = () => {
    const updated: DailySession = {
      ...session,
      bets: [],
    };
    handleUpdateSession(updated);
  };

  // Lưu cài đặt tỷ lệ
  const handleSaveSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  // Tải lại toàn bộ dữ liệu (sau khi import JSON hoặc xóa sạch)
  const handleDataReload = () => {
    setSettingsState(getSavedSettings());
    setSession(getSessionByDate(currentDate));
  };

  // Chuyển sang ngày được chọn từ tab Lịch sử
  const handleSelectHistoryDate = (date: string) => {
    setCurrentDate(date);
    setActiveTab('today');
  };

  // Tính summary của ngày hiện tại
  const summary = calculateDailyTotal(session.bets, session.initialCapital);
  const historyList = getHistoryList();

  // Kiểm tra nếu chạy trong iframe để đóng modal cha
  const handleCloseModal = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage('close-loto-calculator-modal', '*');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* HEADER ỨNG DỤNG */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Logo & Tiêu đề */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
              🧮
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                <span>Máy Tính Lô Đề</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  Quản Lý Vốn & Lãi Lỗ
                </span>
              </h1>
              <div className="text-[11px] text-slate-400 hidden xs:block">
                Tối ưu cho Máy tính & Điện thoại • Tự động tính toán chuẩn xác
              </div>
            </div>
          </div>

          {/* Nút đóng (cho popup modal) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseModal}
              title="Đóng cửa sổ máy tính"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* THANH MENU ĐIỀU HƯỚNG TỔNG QUAN (Theo mục 14) */}
        <div className="border-t border-slate-800/80 bg-slate-900/70 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 sm:gap-2 py-1.5 whitespace-nowrap">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'today'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Hôm Nay Đánh Gì?</span>
              {session.bets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-800 text-emerald-200">
                  {session.bets.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('quick')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'quick'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Tính Nhanh</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch Sử Ngày</span>
              {historyList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300">
                  {historyList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'stats'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Thống Kê & Biểu Đồ</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Cài Đặt Tỷ Lệ</span>
            </button>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* DASHBOARD 5 Ô VỐN & LÃI LỖ (Luôn hiển thị ở tab Hôm nay và Tổng quan) */}
        {(activeTab === 'today' || activeTab === 'quick') && (
          <Dashboard
            initialCapital={session.initialCapital}
            summary={summary}
            onUpdateCapital={handleUpdateCapital}
          />
        )}

        {/* TAB 1: HÔM NAY ĐÁNH GÌ? */}
        {activeTab === 'today' && (
          <TodayBets
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            bets={session.bets}
            settings={settings}
            onAddBet={handleAddBet}
            onUpdateBet={handleUpdateBet}
            onDeleteBet={handleDeleteBet}
            onClearBets={handleClearBets}
          />
        )}

        {/* TAB 2: TÍNH NHANH */}
        {activeTab === 'quick' && <QuickCalculator settings={settings} />}

        {/* TAB 3: LỊCH SỬ THEO NGÀY */}
        {activeTab === 'history' && (
          <HistoryView
            historyList={historyList}
            onSelectDate={handleSelectHistoryDate}
          />
        )}

        {/* TAB 4: THỐNG KÊ */}
        {activeTab === 'stats' && <StatisticsView currentDate={currentDate} />}

        {/* TAB 5: CÀI ĐẶT TỶ LỆ */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onDataReload={handleDataReload}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <div>MÁY TÍNH LÔ ĐỀ • Ứng dụng hỗ trợ thống kê vốn, tiền đánh và lãi lỗ chuẩn xác</div>
        <div className="text-[11px] text-slate-600 mt-1">
          Dữ liệu lưu an toàn trên máy cục bộ (LocalStorage) • Không làm mất dữ liệu khi tải lại
        </div>
      </footer>
    </div>
  );
}
