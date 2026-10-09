import React, { useState } from 'react';
import { Settings } from '../types';
import { DEFAULT_SETTINGS, formatMoneyInput, parseSmartMoney } from '../utils/calculator';
import { exportDataAsJSON, importDataFromJSON, clearAllData } from '../utils/storage';
import { Settings as SettingsIcon, RotateCcw, Download, Upload, Trash2, Check } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSaveSettings: (newSettings: Settings) => void;
  onDataReload: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onDataReload,
}) => {
  // Trạng thái form cài đặt tỷ lệ
  const [loCost, setLoCost] = useState(formatMoneyInput(settings.loCostPerPoint));
  const [loPayout, setLoPayout] = useState(formatMoneyInput(settings.loPayoutPerPoint));
  const [deMultiplier, setDeMultiplier] = useState(settings.dePayoutMultiplier.toString());
  const [xien2Multiplier, setXien2Multiplier] = useState(settings.xien2PayoutMultiplier.toString());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Lưu cài đặt
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: Settings = {
      loCostPerPoint: parseSmartMoney(loCost) || DEFAULT_SETTINGS.loCostPerPoint,
      loPayoutPerPoint: parseSmartMoney(loPayout) || DEFAULT_SETTINGS.loPayoutPerPoint,
      dePayoutMultiplier: parseInt(deMultiplier, 10) || DEFAULT_SETTINGS.dePayoutMultiplier,
      xien2PayoutMultiplier: parseInt(xien2Multiplier, 10) || DEFAULT_SETTINGS.xien2PayoutMultiplier,
    };

    onSaveSettings(newSettings);
    setSaveSuccessMsg('Đã lưu cấu hình tỷ lệ cược thành công! Các phép tính sẽ áp dụng mức mới.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Khôi phục mặc định
  const handleResetDefault = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục toàn bộ tỷ lệ cược về mặc định không?')) {
      onSaveSettings(DEFAULT_SETTINGS);
      setLoCost(formatMoneyInput(DEFAULT_SETTINGS.loCostPerPoint));
      setLoPayout(formatMoneyInput(DEFAULT_SETTINGS.loPayoutPerPoint));
      setDeMultiplier(DEFAULT_SETTINGS.dePayoutMultiplier.toString());
      setXien2Multiplier(DEFAULT_SETTINGS.xien2PayoutMultiplier.toString());
      setSaveSuccessMsg('Đã khôi phục cài đặt về mặc định chuẩn!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  // Xuất file JSON
  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MayTinhLoDe_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nhập file JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataFromJSON(content);
        if (ok) {
          alert('Nhập dữ liệu thành công!');
          onDataReload();
        } else {
          alert('Tệp dữ liệu không hợp lệ. Vui lòng kiểm tra lại!');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Xóa sạch toàn bộ dữ liệu
  const handleClearAll = () => {
    if (
      window.confirm(
        'CẢNH BÁO: Toàn bộ lịch sử đánh các ngày và cấu hình sẽ bị xóa vĩnh viễn! Bạn có chắc chắn muốn xóa không?'
      )
    ) {
      clearAllData();
      alert('Đã xóa toàn bộ dữ liệu máy tính!');
      onDataReload();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Form Cài đặt tỷ lệ cược */}
      <div className="glass-card p-5 md:p-6 rounded-2xl border border-slate-700/70 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Cài Đặt Tỷ Lệ Trả Thưởng & Giá Đánh
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục mặc định
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Giá 1 điểm lô */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Giá 1 Điểm Lô (VNĐ):
              </label>
              <div className="text-[11px] text-slate-500 mb-2">Mặc định thông thường: 23.000 đ/điểm</div>
              <input
                type="text"
                value={loCost}
                onChange={(e) => setLoCost(formatMoneyInput(e.target.value))}
                placeholder="23.000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Tiền trúng 1 điểm lô */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tiền Trúng 1 Điểm Lô (VNĐ):
              </label>
              <div className="text-[11px] text-slate-500 mb-2">Mặc định: 80.000 đ/điểm khi về 1 nháy</div>
              <input
                type="text"
                value={loPayout}
                onChange={(e) => setLoPayout(formatMoneyInput(e.target.value))}
                placeholder="80.000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Hệ số trả thưởng Đề */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Hệ Số Trả Thưởng Đề (x lần):
              </label>
              <div className="text-[11px] text-slate-500 mb-2">
                Mặc định: x60 (đánh 10.000 đ trúng nhận 600.000 đ)
              </div>
              <input
                type="number"
                min={1}
                max={1000}
                value={deMultiplier}
                onChange={(e) => setDeMultiplier(e.target.value)}
                placeholder="60"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Hệ số trả thưởng Xiên 2 */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Hệ Số Trả Thưởng Xiên 2 (x lần):
              </label>
              <div className="text-[11px] text-slate-500 mb-2">
                Mặc định: x10 (đánh 50.000 đ trúng nhận 500.000 đ)
              </div>
              <input
                type="number"
                min={1}
                max={1000}
                value={xien2Multiplier}
                onChange={(e) => setXien2Multiplier(e.target.value)}
                placeholder="10"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Lưu Cài Đặt Tỷ Lệ
            </button>
          </div>
        </form>
      </div>

      {/* Quản lý Sao Lưu & Phục Hồi Dữ Liệu theo Mục 13 */}
      <div className="glass-card p-5 md:p-6 rounded-2xl border border-slate-700/70 shadow-lg space-y-4">
        <div className="border-b border-slate-700/70 pb-3">
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            Sao Lưu & Quản Lý Dữ Liệu (Không Mất Dữ Liệu)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu được lưu an toàn trực tiếp trên trình duyệt của bạn (LocalStorage). Bạn có thể sao lưu thành file JSON để chuyển đổi giữa máy tính và điện thoại.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Xuất dữ liệu */}
          <button
            onClick={handleExportJSON}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition flex items-center gap-3 group"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Xuất Dữ Liệu (JSON)</div>
              <div className="text-[11px] text-slate-400">Tải file backup về máy</div>
            </div>
          </button>

          {/* Nhập dữ liệu */}
          <label className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition flex items-center gap-3 group cursor-pointer">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Nhập Dữ Liệu (JSON)</div>
              <div className="text-[11px] text-slate-400">Phục hồi từ file backup</div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          {/* Xóa toàn bộ dữ liệu */}
          <button
            onClick={handleClearAll}
            className="p-4 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/40 rounded-xl text-left transition flex items-center gap-3 group"
          >
            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-300">Xóa Sạch Dữ Liệu</div>
              <div className="text-[11px] text-rose-400/70">Xóa toàn bộ lịch sử</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
