import React, { useState } from 'react';
import { Bet, BetType, BetResultStatus, Settings } from '../types';
import {
  calculateLoCost,
  calculateLoPayout,
  calculateDePayout,
  calculateXien2Payout,
  calculateProfit,
  formatVND,
  formatVNDWithSign,
  formatMoneyInput,
  parseSmartMoney,
} from '../utils/calculator';
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TodayBetsProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  bets: Bet[];
  settings: Settings;
  onAddBet: (bet: Bet) => void;
  onUpdateBet: (updatedBet: Bet) => void;
  onDeleteBet: (betId: string) => void;
  onClearBets: () => void;
}

export const TodayBets: React.FC<TodayBetsProps> = ({
  currentDate,
  onDateChange,
  bets,
  settings,
  onAddBet,
  onUpdateBet,
  onDeleteBet,
  onClearBets,
}) => {
  // Form thêm khoản đánh
  const [betType, setBetType] = useState<BetType>('lo');
  const [numbersInput, setNumbersInput] = useState('');
  const [num2Input, setNum2Input] = useState(''); // Riêng cho Xiên 2
  const [amountInput, setAmountInput] = useState(''); // Điểm lô hoặc tiền đánh VNĐ
  const [errorMsg, setErrorMsg] = useState('');

  // Tính trước thành tiền dự kiến khi người dùng đang nhập form
  const parsedAmount = parseSmartMoney(amountInput);
  let previewCost = 0;
  if (betType === 'lo') {
    previewCost = calculateLoCost(parsedAmount, settings.loCostPerPoint);
  } else {
    previewCost = parsedAmount;
  }

  // Xử lý gửi form thêm cược
  const handleAddBetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let finalNumbers = numbersInput.trim();
    if (betType === 'xien2') {
      const n1 = numbersInput.trim();
      const n2 = num2Input.trim();
      if (!n1 || !n2) {
        setErrorMsg('Vui lòng nhập đủ 2 số cho cặp Xiên 2!');
        return;
      }
      finalNumbers = `${n1}-${n2}`;
    } else {
      if (!finalNumbers) {
        setErrorMsg('Vui lòng nhập con số muốn đánh!');
        return;
      }
    }

    if (parsedAmount <= 0) {
      setErrorMsg(betType === 'lo' ? 'Vui lòng nhập số điểm lô (> 0)!' : 'Vui lòng nhập số tiền cược (> 0 đ)!');
      return;
    }

    const cost = previewCost;
    // Mặc định ban đầu kết quả là 'pending' (Chưa có), trúng 0đ, lãi/lỗ = -cost
    const newBet: Bet = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      type: betType,
      numbers: finalNumbers,
      amount: parsedAmount,
      cost,
      result: 'pending',
      hits: 0,
      payout: 0,
      profit: calculateProfit(0, cost),
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    onAddBet(newBet);

    // Reset form
    setNumbersInput('');
    setNum2Input('');
    setAmountInput('');
  };

  // Cập nhật kết quả của một khoản cược trong danh sách
  const handleUpdateResult = (bet: Bet, newStatus: BetResultStatus, hits: number = 0) => {
    let payout = 0;
    let actualHits = 0;

    if (newStatus === 'win') {
      if (bet.type === 'lo') {
        actualHits = Math.max(1, hits);
        payout = calculateLoPayout(bet.amount, settings.loPayoutPerPoint, actualHits);
      } else if (bet.type === 'de') {
        actualHits = 1;
        payout = calculateDePayout(bet.amount, settings.dePayoutMultiplier, true);
      } else if (bet.type === 'xien2') {
        actualHits = 1;
        payout = calculateXien2Payout(bet.amount, settings.xien2PayoutMultiplier, true);
      }
    } else if (newStatus === 'loss') {
      actualHits = 0;
      payout = 0;
    } else {
      // Pending
      actualHits = 0;
      payout = 0;
    }

    const profit = calculateProfit(payout, bet.cost);

    onUpdateBet({
      ...bet,
      result: newStatus,
      hits: actualHits,
      payout,
      profit,
    });
  };

  const totalCost = bets.reduce((sum, b) => sum + (b.cost || 0), 0);

  return (
    <div className="w-full space-y-5">
      {/* Thanh chọn ngày */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 border border-slate-700/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-slate-200">Phiên Đánh Ngày:</span>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-800 text-emerald-300 font-semibold text-sm px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Tổng số khoản cược: <strong className="text-white">{bets.length}</strong></span>
          {bets.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa tất cả các khoản đánh của ngày này không?')) {
                  onClearBets();
                }
              }}
              className="text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa ngày này
            </button>
          )}
        </div>
      </div>

      {/* FORM THÊM KHOẢN ĐÁNH */}
      <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-700/70 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Thêm Khoản Đánh Hôm Nay
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            Tự động tính thành tiền & kết quả
          </div>
        </div>

        <form onSubmit={handleAddBetSubmit} className="space-y-4">
          {/* Chọn loại: Lô / Đề / Xiên 2 */}
          <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 max-w-md">
            <button
              type="button"
              onClick={() => setBetType('lo')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                betType === 'lo'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎱 Lô ({formatVND(settings.loCostPerPoint)}/đ)
            </button>
            <button
              type="button"
              onClick={() => setBetType('de')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                betType === 'de'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Đề (x{settings.dePayoutMultiplier})
            </button>
            <button
              type="button"
              onClick={() => setBetType('xien2')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                betType === 'xien2'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔗 Xiên 2 (x{settings.xien2PayoutMultiplier})
            </button>
          </div>

          {/* Ô nhập Số và Mức cược */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Nhập số */}
            {betType === 'xien2' ? (
              <div className="md:col-span-5 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Số thứ nhất</label>
                  <input
                    type="text"
                    value={numbersInput}
                    onChange={(e) => setNumbersInput(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                    placeholder="23"
                    maxLength={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold text-yellow-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Số thứ hai</label>
                  <input
                    type="text"
                    value={num2Input}
                    onChange={(e) => setNum2Input(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                    placeholder="51"
                    maxLength={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold text-yellow-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            ) : (
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {betType === 'lo' ? 'Con số Lô' : 'Con số Đề'}
                </label>
                <input
                  type="text"
                  value={numbersInput}
                  onChange={(e) => setNumbersInput(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                  placeholder={betType === 'lo' ? 'VD: 23' : 'VD: 51'}
                  maxLength={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold text-yellow-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Nhập mức đánh (Điểm đối với Lô, Tiền đối với Đề/Xiên) */}
            <div className={betType === 'xien2' ? 'md:col-span-4' : 'md:col-span-5'}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {betType === 'lo' ? 'Số Điểm Đánh' : 'Số Tiền Cược (VNĐ)'}
                </label>
                {previewCost > 0 && (
                  <span className="text-xs text-amber-400 font-semibold">
                    Thành tiền: {formatVND(previewCost)}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(formatMoneyInput(e.target.value))}
                placeholder={betType === 'lo' ? 'VD: 10, 50, 100 điểm' : 'VD: 10.000, 50.000 đ'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              {/* Nút bấm nhanh */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {betType === 'lo'
                  ? [10, 20, 50, 100].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setAmountInput(pts.toString())}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        +{pts}đ
                      </button>
                    ))
                  : [10000, 20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountInput(formatMoneyInput(amt))}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        +{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
              </div>
            </div>

            {/* Nút thêm cược */}
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Plus className="w-5 h-5" />
                Thêm Vào Danh Sách
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg">
              {errorMsg}
            </div>
          )}
        </form>
      </div>

      {/* DANH SÁCH CÁC KHOẢN ĐÁNH (BẢNG CHÍNH THEO MỤC 2) */}
      <div className="glass-card rounded-2xl border border-slate-700/70 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Danh Sách Khoản Đánh ({bets.length})
            </h4>
          </div>
          <div className="text-xs text-slate-400">
            Bấm chọn kết quả để tự động tính tiền trúng và lãi/lỗ
          </div>
        </div>

        {bets.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <div className="text-4xl mb-2">📋</div>
            <div className="font-semibold text-slate-300">Chưa có khoản đánh nào cho ngày này</div>
            <div className="text-xs mt-1 text-slate-500">
              Hãy nhập con số và mức cược ở form bên trên để bắt đầu theo dõi
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-800/90 text-slate-300 uppercase text-[11px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3">Loại</th>
                  <th className="py-3 px-3">Số</th>
                  <th className="py-3 px-3">Mức Đánh</th>
                  <th className="py-3 px-3 text-right">Thành Tiền</th>
                  <th className="py-3 px-3 text-center">Kết Quả</th>
                  <th className="py-3 px-3 text-right">Tiền Trúng</th>
                  <th className="py-3 px-3 text-right">Lãi / Lỗ</th>
                  <th className="py-3 px-2 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bets.map((bet) => {
                  const isWin = bet.result === 'win';
                  const isLoss = bet.result === 'loss';
                  const isPending = bet.result === 'pending';

                  return (
                    <tr
                      key={bet.id}
                      className={`hover:bg-slate-800/50 transition ${
                        isWin ? 'bg-emerald-950/10' : isLoss ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Cột Loại */}
                      <td className="py-3 px-3 font-semibold whitespace-nowrap">
                        {bet.type === 'lo' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            🎱 Lô
                          </span>
                        ) : bet.type === 'de' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🎯 Đề
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            🔗 Xiên 2
                          </span>
                        )}
                      </td>

                      {/* Cột Số */}
                      <td className="py-3 px-3 font-mono font-bold text-yellow-300 text-base whitespace-nowrap">
                        {bet.numbers}
                      </td>

                      {/* Cột Mức đánh */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {bet.type === 'lo' ? `${bet.amount} điểm` : formatVND(bet.amount)}
                      </td>

                      {/* Cột Thành tiền */}
                      <td className="py-3 px-3 text-right font-semibold text-amber-400 whitespace-nowrap">
                        {formatVND(bet.cost)}
                      </td>

                      {/* Cột Kết Quả (Nút bấm tương tác nhanh) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {bet.type === 'lo' ? (
                            // LÔ: Chọn số nháy
                            <div className="flex items-center gap-1">
                              {/* Nút Chưa có */}
                              <button
                                onClick={() => handleUpdateResult(bet, 'pending')}
                                title="Chưa có kết quả"
                                className={`px-1.5 py-1 rounded text-xs transition flex items-center gap-1 ${
                                  isPending
                                    ? 'bg-slate-700 text-yellow-300 ring-1 ring-yellow-400/50'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span className="hidden sm:inline">Chờ</span>
                              </button>

                              {/* Nút Trượt */}
                              <button
                                onClick={() => handleUpdateResult(bet, 'loss')}
                                title="Không trúng (Trượt)"
                                className={`px-1.5 py-1 rounded text-xs transition flex items-center gap-1 ${
                                  isLoss
                                    ? 'bg-rose-600 text-white font-bold ring-1 ring-rose-400'
                                    : 'bg-slate-800 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300'
                                }`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Trượt</span>
                              </button>

                              {/* Dropdown / Nút Nháy */}
                              <select
                                value={isWin ? bet.hits : 0}
                                onChange={(e) => {
                                  const hits = parseInt(e.target.value, 10);
                                  if (hits > 0) {
                                    handleUpdateResult(bet, 'win', hits);
                                  } else {
                                    handleUpdateResult(bet, 'loss', 0);
                                  }
                                }}
                                className={`text-xs px-2 py-1 rounded font-bold border transition ${
                                  isWin
                                    ? 'bg-emerald-600 text-white border-emerald-400'
                                    : 'bg-slate-800 text-emerald-400 border-slate-700 hover:border-emerald-500'
                                }`}
                              >
                                <option value={0}>Chọn nháy</option>
                                <option value={1}>1 nháy</option>
                                <option value={2}>2 nháy</option>
                                <option value={3}>3 nháy</option>
                                <option value={4}>4 nháy</option>
                                <option value={5}>5 nháy</option>
                              </select>
                            </div>
                          ) : (
                            // ĐỀ / XIÊN 2: Trúng / Trượt / Chờ
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateResult(bet, 'pending')}
                                title="Chưa có kết quả"
                                className={`px-2 py-1 rounded text-xs transition ${
                                  isPending
                                    ? 'bg-slate-700 text-yellow-300 ring-1 ring-yellow-400/50'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Chờ
                              </button>
                              <button
                                onClick={() => handleUpdateResult(bet, 'loss')}
                                title="Trượt"
                                className={`px-2 py-1 rounded text-xs transition ${
                                  isLoss
                                    ? 'bg-rose-600 text-white font-bold ring-1 ring-rose-400'
                                    : 'bg-slate-800 text-slate-400 hover:bg-rose-900/40 hover:text-rose-300'
                                }`}
                              >
                                Trượt
                              </button>
                              <button
                                onClick={() => handleUpdateResult(bet, 'win')}
                                title="Trúng thưởng"
                                className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                                  isWin
                                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                                    : 'bg-slate-800 text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Trúng
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột Tiền trúng */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                        {bet.payout > 0 ? (
                          <span>
                            {formatVND(bet.payout)}
                            {bet.hits > 1 && (
                              <span className="text-[10px] ml-1 bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-normal">
                                ({bet.hits} nháy)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500">0 đ</span>
                        )}
                      </td>

                      {/* Cột Lãi / Lỗ */}
                      <td className="py-3 px-3 text-right font-black whitespace-nowrap">
                        <span
                          className={
                            bet.profit > 0
                              ? 'text-emerald-400'
                              : bet.profit < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {formatVNDWithSign(bet.profit)}
                        </span>
                      </td>

                      {/* Cột Xóa */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => onDeleteBet(bet.id)}
                          title="Xóa khoản này"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Thanh chân bảng: TỔNG TIỀN ĐÁNH HÔM NAY (Theo mục 2) */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Tự động cập nhật tổng tiền & lãi/lỗ tức thì
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
              TỔNG TIỀN ĐÁNH HÔM NAY:
            </span>
            <span className="text-lg md:text-xl font-extrabold text-amber-400 font-mono">
              {formatVND(totalCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
