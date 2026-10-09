import React, { useState } from 'react';
import { Settings, BetType } from '../types';
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
import { Zap } from 'lucide-react';

interface QuickCalculatorProps {
  settings: Settings;
}

export const QuickCalculator: React.FC<QuickCalculatorProps> = ({ settings }) => {
  const [selectedType, setSelectedType] = useState<BetType>('lo');
  const [inputVal, setInputVal] = useState('100'); // Mặc định 100 điểm với lô, 50.000 với đề/xiên

  const handleSelectType = (type: BetType) => {
    setSelectedType(type);
    if (type === 'lo') {
      setInputVal('100');
    } else {
      setInputVal('50.000');
    }
  };

  const parsedVal = parseSmartMoney(inputVal);

  return (
    <div className="w-full space-y-5">
      {/* Khối tiêu đề */}
      <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-700/70 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            Máy Tính Nhanh Kịch Bản Lãi / Lỗ
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Ước tính ngay tức thì số tiền đánh, số tiền trúng và lãi/lỗ theo từng trường hợp số nháy nổ
        </p>

        {/* Nút chọn loại */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 max-w-md mt-4">
          <button
            type="button"
            onClick={() => handleSelectType('lo')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition ${
              selectedType === 'lo'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎱 Tính Lô
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('de')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition ${
              selectedType === 'de'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Tính Đề
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('xien2')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs md:text-sm font-bold transition ${
              selectedType === 'xien2'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔗 Tính Xiên 2
          </button>
        </div>

        {/* Ô nhập mức cược */}
        <div className="mt-4 max-w-lg">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {selectedType === 'lo' ? 'Nhập số điểm lô muốn đánh:' : 'Nhập số tiền muốn đánh (VNĐ):'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(formatMoneyInput(e.target.value))}
              placeholder={selectedType === 'lo' ? 'VD: 100' : 'VD: 50.000'}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-extrabold text-base focus:outline-none focus:border-emerald-500"
            />
            {selectedType === 'lo' ? (
              <span className="text-sm font-bold text-slate-300 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700">
                Điểm
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-300 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700">
                VNĐ
              </span>
            )}
          </div>

          {/* Nút bấm nhanh */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedType === 'lo'
              ? [10, 20, 50, 100, 200, 500].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setInputVal(pts.toString())}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    {pts} điểm
                  </button>
                ))
              : [10000, 20000, 50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInputVal(formatMoneyInput(amt))}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* HIỂN THỊ KỊCH BẢN KẾT QUẢ */}
      {selectedType === 'lo' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-700/70 shadow-lg space-y-4">
          {/* Thông tin tiền đánh */}
          {(() => {
            const cost = calculateLoCost(parsedVal, settings.loCostPerPoint);
            return (
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-blue-200">
                  Tiền đánh: <strong className="font-mono text-white">{parsedVal} điểm × {formatVND(settings.loCostPerPoint)}</strong>
                </span>
                <span className="text-base font-extrabold text-amber-400">
                  = {formatVND(cost)}
                </span>
              </div>
            );
          })()}

          {/* Bảng kịch bản số nháy */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-800/90 text-slate-300 uppercase text-[11px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Kịch Bản</th>
                  <th className="py-2.5 px-3">Cách Tính</th>
                  <th className="py-2.5 px-3 text-right">Tiền Trúng</th>
                  <th className="py-2.5 px-3 text-right">Lãi / Lỗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {/* 0 nháy: Trượt */}
                {(() => {
                  const cost = calculateLoCost(parsedVal, settings.loCostPerPoint);
                  const payout = 0;
                  const profit = calculateProfit(payout, cost);
                  return (
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-rose-400">
                        ❌ Trượt (0 nháy)
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        Không về nháy nào
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 đ</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        {formatVNDWithSign(profit)}
                      </td>
                    </tr>
                  );
                })()}

                {/* 1, 2, 3, 4, 5 nháy */}
                {[1, 2, 3, 4, 5].map((hits) => {
                  const cost = calculateLoCost(parsedVal, settings.loCostPerPoint);
                  const payout = calculateLoPayout(parsedVal, settings.loPayoutPerPoint, hits);
                  const profit = calculateProfit(payout, cost);
                  return (
                    <tr key={hits} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        🎯 Về {hits} nháy
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {parsedVal} đ × {formatVND(settings.loPayoutPerPoint)} × {hits}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                        {formatVND(payout)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        {formatVNDWithSign(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedType === 'de' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-700/70 shadow-lg space-y-4">
          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber-200">
              Tiền cược Đề: <strong className="font-mono text-white">{formatVND(parsedVal)}</strong> (Tỷ lệ trả thưởng: <strong className="text-yellow-400">x{settings.dePayoutMultiplier}</strong>)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-800/90 text-slate-300 uppercase text-[11px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Kịch Bản</th>
                  <th className="py-2.5 px-3">Cách Tính</th>
                  <th className="py-2.5 px-3 text-right">Tiền Trúng</th>
                  <th className="py-2.5 px-3 text-right">Lãi / Lỗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {/* Trượt */}
                {(() => {
                  const cost = parsedVal;
                  const payout = 0;
                  const profit = calculateProfit(payout, cost);
                  return (
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-rose-400">
                        ❌ Trượt Đề
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">Không nổ giải Đặc Biệt</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 đ</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        {formatVNDWithSign(profit)}
                      </td>
                    </tr>
                  );
                })()}

                {/* Trúng */}
                {(() => {
                  const cost = parsedVal;
                  const payout = calculateDePayout(cost, settings.dePayoutMultiplier, true);
                  const profit = calculateProfit(payout, cost);
                  return (
                    <tr className="hover:bg-slate-800/40 bg-emerald-950/10">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        🎉 Nổ Trúng Đề
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatVND(cost)} × {settings.dePayoutMultiplier}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                        {formatVND(payout)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        {formatVNDWithSign(profit)}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedType === 'xien2' && (
        <div className="glass-card p-4 md:p-5 rounded-2xl border border-slate-700/70 shadow-lg space-y-4">
          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-purple-200">
              Tiền cược Xiên 2: <strong className="font-mono text-white">{formatVND(parsedVal)}</strong> (Tỷ lệ trả thưởng: <strong className="text-yellow-400">x{settings.xien2PayoutMultiplier}</strong>)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-800/90 text-slate-300 uppercase text-[11px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Kịch Bản</th>
                  <th className="py-2.5 px-3">Cách Tính</th>
                  <th className="py-2.5 px-3 text-right">Tiền Trúng</th>
                  <th className="py-2.5 px-3 text-right">Lãi / Lỗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {/* Trượt */}
                {(() => {
                  const cost = parsedVal;
                  const payout = 0;
                  const profit = calculateProfit(payout, cost);
                  return (
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-rose-400">
                        ❌ Trượt Xiên 2
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">Có ít nhất 1 con không về</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0 đ</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        {formatVNDWithSign(profit)}
                      </td>
                    </tr>
                  );
                })()}

                {/* Trúng */}
                {(() => {
                  const cost = parsedVal;
                  const payout = calculateXien2Payout(cost, settings.xien2PayoutMultiplier, true);
                  const profit = calculateProfit(payout, cost);
                  return (
                    <tr className="hover:bg-slate-800/40 bg-emerald-950/10">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        🎉 Nổ Cả 2 Con
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatVND(cost)} × {settings.xien2PayoutMultiplier}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                        {formatVND(payout)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        {formatVNDWithSign(profit)}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
