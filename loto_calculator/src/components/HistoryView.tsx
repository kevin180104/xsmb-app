import React, { useState } from 'react';
import { DayHistoryRecord } from '../types';
import { formatVND, formatVNDWithSign } from '../utils/calculator';
import { Calendar, ChevronDown, ChevronUp, ExternalLink, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface HistoryViewProps {
  historyList: DayHistoryRecord[];
  onSelectDate: (date: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ historyList, onSelectDate }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  if (historyList.length === 0) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-slate-700/70">
        <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-300">Chưa Có Dữ Liệu Lịch Sử</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Khi bạn thêm các khoản đánh ở tab "Hôm Nay", lịch sử từng ngày sẽ tự động được lưu và hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            Lịch Sử Đánh Theo Ngày ({historyList.length} Ngày Đã Lưu)
          </h3>
          <p className="text-xs text-slate-400">
            Xem lại chi tiết từng ngày, số tiền đánh, số trúng và biến động vốn
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {historyList.map((item) => {
          const isExpanded = expandedDate === item.date;
          const isProfit = item.totalProfit > 0;
          const isLoss = item.totalProfit < 0;

          // Format ngày DD/MM/YYYY
          const parts = item.date.split('-');
          const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;

          return (
            <div
              key={item.date}
              className={`glass-card rounded-2xl border transition overflow-hidden shadow-sm ${
                isProfit
                  ? 'border-emerald-500/30'
                  : isLoss
                  ? 'border-rose-500/30'
                  : 'border-slate-700/60'
              }`}
            >
              {/* Header dòng ngày */}
              <div
                onClick={() => toggleExpand(item.date)}
                className="p-4 cursor-pointer hover:bg-slate-800/40 transition flex flex-wrap items-center justify-between gap-3"
              >
                {/* Ngày và Vốn */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                      isProfit
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isLoss
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isProfit ? <TrendingUp className="w-5 h-5" /> : isLoss ? <TrendingDown className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{formattedDate}</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.betsCount} khoản cược
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Vốn: <strong className="text-slate-200">{formatVND(item.initialCapital)}</strong>
                    </div>
                  </div>
                </div>

                {/* Các chỉ số tài chính */}
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Tiền đánh */}
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Đánh</div>
                    <div className="text-sm font-bold text-amber-400">{formatVND(item.totalCost)}</div>
                  </div>

                  {/* Tiền trúng */}
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Trúng</div>
                    <div className="text-sm font-bold text-emerald-400">{formatVND(item.totalPayout)}</div>
                  </div>

                  {/* Lãi / Lỗ */}
                  <div className="text-right min-w-[90px]">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Lãi / Lỗ</div>
                    <div
                      className={`text-sm md:text-base font-black ${
                        isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {formatVNDWithSign(item.totalProfit)}
                    </div>
                  </div>

                  {/* Nút đóng/mở */}
                  <div className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Phần mở rộng chi tiết các khoản đánh */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-300">
                      Chi tiết {item.bets.length} khoản đánh ngày {formattedDate}:
                    </div>
                    <button
                      onClick={() => onSelectDate(item.date)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Mở ngày này để sửa
                    </button>
                  </div>

                  {item.bets.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">Không có khoản cược nào</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                          <tr>
                            <th className="py-2 px-2.5">Loại</th>
                            <th className="py-2 px-2.5">Số</th>
                            <th className="py-2 px-2.5">Mức Đánh</th>
                            <th className="py-2 px-2.5 text-right">Thành Tiền</th>
                            <th className="py-2 px-2.5 text-center">Kết Quả</th>
                            <th className="py-2 px-2.5 text-right">Tiền Trúng</th>
                            <th className="py-2 px-2.5 text-right">Lãi / Lỗ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {item.bets.map((bet) => (
                            <tr key={bet.id} className="hover:bg-slate-800/30">
                              <td className="py-2 px-2.5 font-semibold">
                                {bet.type === 'lo' ? (
                                  <span className="text-blue-400">🎱 Lô</span>
                                ) : bet.type === 'de' ? (
                                  <span className="text-amber-400">🎯 Đề</span>
                                ) : (
                                  <span className="text-purple-400">🔗 Xiên 2</span>
                                )}
                              </td>
                              <td className="py-2 px-2.5 font-mono font-bold text-yellow-300">
                                {bet.numbers}
                              </td>
                              <td className="py-2 px-2.5 text-slate-300">
                                {bet.type === 'lo' ? `${bet.amount} điểm` : formatVND(bet.amount)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-medium text-amber-300">
                                {formatVND(bet.cost)}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                {bet.result === 'win' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                    Trúng {bet.hits > 0 && `(${bet.hits} nháy)`}
                                  </span>
                                ) : bet.result === 'loss' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                    Trượt
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-yellow-300">
                                    Chờ KQ
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2.5 text-right font-semibold text-emerald-300">
                                {formatVND(bet.payout)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-black">
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
