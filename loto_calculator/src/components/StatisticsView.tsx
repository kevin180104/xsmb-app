import React, { useState } from 'react';
import { Statistics } from '../types';
import { getStatistics, getTodayDateString } from '../utils/storage';
import { formatVND, formatVNDWithSign } from '../utils/calculator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BarChart3, CheckCircle2, XCircle } from 'lucide-react';

interface StatisticsViewProps {
  currentDate: string;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ currentDate }) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  const stats: Statistics = getStatistics(period, currentDate || getTodayDateString());
  const isNetProfit = stats.totalProfit > 0;
  const isNetLoss = stats.totalProfit < 0;

  // Custom tooltip cho biểu đồ Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="font-bold text-white border-b border-slate-700 pb-1 mb-1">
            Ngày: {data.date}
          </div>
          <div className="flex justify-between gap-4 text-amber-300">
            <span>Tiền đánh:</span>
            <span className="font-bold">{formatVND(data.cost)}</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-300">
            <span>Tiền trúng:</span>
            <span className="font-bold">{formatVND(data.payout)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
            <span className="text-slate-300">Lãi / Lỗ:</span>
            <span
              className={`font-black ${
                data.profit > 0 ? 'text-emerald-400' : data.profit < 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {formatVNDWithSign(data.profit)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-5">
      {/* Thanh chọn thời gian */}
      <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-700/70">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            Thống Kê Hiệu Quả & Biểu Đồ Lãi Lỗ
          </h3>
        </div>

        {/* Nút lọc kỳ */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              period === 'today' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              period === '7days' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            7 ngày gần nhất
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              period === '30days' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            30 ngày
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              period === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* 6 Khối KPI Thống Kê theo Mục 9 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Tổng tiền đánh */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng Tiền Đánh
          </div>
          <div className="text-base font-extrabold text-amber-400">
            {formatVND(stats.totalBetsCost)}
          </div>
        </div>

        {/* Tổng tiền trúng */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng Tiền Trúng
          </div>
          <div className="text-base font-extrabold text-emerald-400">
            {formatVND(stats.totalPayout)}
          </div>
        </div>

        {/* Tổng lãi */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng Các Khoản Lãi
          </div>
          <div className="text-base font-extrabold text-emerald-300">
            +{formatVND(stats.grossProfit)}
          </div>
        </div>

        {/* Tổng lỗ */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng Các Khoản Lỗ
          </div>
          <div className="text-base font-extrabold text-rose-400">
            -{formatVND(stats.grossLoss)}
          </div>
        </div>

        {/* Lãi / Lỗ ròng */}
        <div
          className={`glass-card p-3.5 rounded-xl border col-span-2 md:col-span-1 ${
            isNetProfit
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : isNetLoss
              ? 'border-rose-500/40 bg-rose-950/20'
              : 'border-slate-700/60'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Lãi / Lỗ Ròng
          </div>
          <div
            className={`text-base font-black ${
              isNetProfit ? 'text-emerald-400' : isNetLoss ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {formatVNDWithSign(stats.totalProfit)}
          </div>
        </div>

        {/* Số ngày lãi */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Số Ngày Lãi
          </div>
          <div className="text-base font-extrabold text-emerald-400">
            {stats.winDaysCount} ngày
          </div>
        </div>

        {/* Số ngày lỗ */}
        <div className="glass-card p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Số Ngày Lỗ
          </div>
          <div className="text-base font-extrabold text-rose-400">
            {stats.lossDaysCount} ngày
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ RECHARTS THỂ HIỆN LÃI / LỖ THEO NGÀY */}
      <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-700/70 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
              Biểu Đồ Lãi / Lỗ Theo Từng Ngày
            </h4>
            <p className="text-xs text-slate-400">
              Cột màu xanh lá = Ngày có lãi | Cột màu đỏ = Ngày lỗ vốn
            </p>
          </div>
        </div>

        {stats.chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Chưa có đủ dữ liệu để vẽ biểu đồ
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}Tr`;
                    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                <Bar
                  dataKey="profit"
                  name="Lãi / Lỗ"
                  shape={(props: any) => {
                    const { x, y, width, height, value } = props;
                    const barFill = value >= 0 ? '#10b981' : '#f43f5e';
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={barFill}
                        rx={3}
                        ry={3}
                      />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
