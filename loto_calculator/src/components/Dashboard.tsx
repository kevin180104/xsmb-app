import React, { useState } from 'react';
import { DailySummary } from '../types';
import { formatVND, formatVNDWithSign, parseSmartMoney, formatMoneyInput } from '../utils/calculator';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Award, Edit3, Check, X } from 'lucide-react';

interface DashboardProps {
  initialCapital: number;
  summary: DailySummary;
  onUpdateCapital: (newCapital: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialCapital,
  summary,
  onUpdateCapital,
}) => {
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(formatMoneyInput(initialCapital));

  const handleSaveCapital = () => {
    const parsed = parseSmartMoney(capitalInput);
    if (parsed > 0) {
      onUpdateCapital(parsed);
    }
    setIsEditingCapital(false);
  };

  const handleCancelCapital = () => {
    setCapitalInput(formatMoneyInput(initialCapital));
    setIsEditingCapital(false);
  };

  const isProfit = summary.totalProfit > 0;
  const isLoss = summary.totalProfit < 0;

  return (
    <div className="w-full space-y-4">
      {/* 5 Card KPI hiển thị theo yêu cầu */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Ô 1: VỐN HÔM NAY */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition shadow-sm relative group">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              Vốn Hôm Nay
            </span>
            {!isEditingCapital && (
              <button
                onClick={() => {
                  setCapitalInput(formatMoneyInput(initialCapital));
                  setIsEditingCapital(true);
                }}
                title="Chỉnh sửa vốn ban đầu"
                className="opacity-70 group-hover:opacity-100 hover:text-blue-400 p-0.5 rounded transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isEditingCapital ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={capitalInput}
                onChange={(e) => setCapitalInput(formatMoneyInput(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCapital();
                  if (e.key === 'Escape') handleCancelCapital();
                }}
                autoFocus
                className="w-full bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none"
                placeholder="5.000.000"
              />
              <button
                onClick={handleSaveCapital}
                className="p-1 bg-blue-600 hover:bg-blue-500 rounded text-white"
                title="Lưu vốn"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancelCapital}
                className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                title="Hủy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-lg md:text-xl font-extrabold text-blue-400 tracking-tight">
              {formatVND(initialCapital)}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1">Vốn khởi điểm ngày</div>
        </div>

        {/* Ô 2: TIỀN ĐÃ ĐÁNH */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Tiền Đã Đánh
          </div>
          <div className="text-lg md:text-xl font-extrabold text-amber-400 tracking-tight">
            {formatVND(summary.totalCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tổng tiền cược hôm nay</div>
        </div>

        {/* Ô 3: TIỀN TRÚNG */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Tiền Trúng
          </div>
          <div className="text-lg md:text-xl font-extrabold text-emerald-400 tracking-tight">
            {formatVND(summary.totalPayout)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tổng tiền ăn cược</div>
        </div>

        {/* Ô 4: LÃI / LỖ */}
        <div
          className={`glass-card p-4 rounded-xl border transition shadow-sm ${
            isProfit
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : isLoss
              ? 'border-rose-500/40 bg-rose-950/20'
              : 'border-slate-700/50'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">
            {isProfit ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : isLoss ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            )}
            Lãi / Lỗ Thực Tế
          </div>
          <div
            className={`text-lg md:text-xl font-black tracking-tight ${
              isProfit
                ? 'text-emerald-400'
                : isLoss
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {formatVNDWithSign(summary.totalProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isProfit ? 'Đang có lãi 🎉' : isLoss ? 'Đang bị thâm hụt ⚠️' : 'Hòa vốn'}
          </div>
        </div>

        {/* Ô 5: VỐN CÒN LẠI */}
        <div className="col-span-2 md:col-span-1 glass-card p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            Vốn Còn Lại
          </div>
          <div
            className={`text-lg md:text-xl font-extrabold tracking-tight ${
              summary.remainingCapital >= 0 ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            {formatVND(summary.remainingCapital)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vốn đầu ngày - Đã đánh</div>
        </div>
      </div>

      {/* Progress Bar quản lý vốn */}
      <div className="glass-card p-3 rounded-xl border border-slate-700/50">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 mb-1.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Tỷ lệ vốn đã sử dụng:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                summary.capitalUsageRate > 80
                  ? 'bg-rose-500/20 text-rose-300'
                  : summary.capitalUsageRate > 50
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {summary.capitalUsageRate}%
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              Vốn: <strong className="text-slate-200">{formatVND(initialCapital)}</strong>
            </span>
            <span>•</span>
            <span>
              Đã đánh: <strong className="text-amber-300">{formatVND(summary.totalCost)}</strong>
            </span>
            <span>•</span>
            <span>
              Còn lại: <strong className="text-cyan-300">{formatVND(summary.remainingCapital)}</strong>
            </span>
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              summary.capitalUsageRate > 80
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : summary.capitalUsageRate > 50
                ? 'bg-gradient-to-r from-blue-500 to-amber-500'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, summary.capitalUsageRate))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
