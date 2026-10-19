/**
 * =========================================================================
 * PATTERN DISCOVERY & SVG VISUALIZATION ENGINE (CLIENT-SIDE)
 * Quản lý giao diện quét pattern, thống kê, bảng vẽ đường cầu SVG & xuất ảnh PNG
 * =========================================================================
 */

let CURRENT_SCAN_DATA = null;
let CURRENT_ACTIVE_PATTERN = null;
let CURRENT_GRAPH_DATA = null;
let SVG_RESIZE_OBSERVER = null;
let CURRENT_DISPLAY_DRAWS = 8;
let CURRENT_ZOOM_LEVEL = 1.0;
window.ALL_LOADED_PATTERNS = {};

let CURRENT_STREAK_RESPONSE = null;
let CURRENT_STREAK_FILTER = 'all';
window.CURRENT_AUTO_PATTERN_DATE = null;
let CACHED_DRAW_RESULTS = null;
// State dành riêng cho Tab Vẽ đường cầu (Tuyệt đối không dùng chung với Top 3 hay ngày dự đoán)
window.SELECTED_DRAW_DATE = null;

// Helper cập nhật text an toàn không bao giờ throw lỗi nếu ID không tồn tại
function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = val !== undefined && val !== null ? val : '--';
    }
}

// Định dạng hiển thị Ngày - tháng - năm (DD - MM - YYYY)
function formatToDayMonthYear(isoDateStr) {
    if (!isoDateStr) return '-- - -- - ----';
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return isoDateStr;
    return `${parts[2]} - ${parts[1]} - ${parts[0]}`;
}

// -------------------------------------------------------------------------
// CÁC HÀM XỬ LÝ THỜI GIAN CHUẨN MÚI GIỜ VIỆT NAM (Asia/Ho_Chi_Minh)
// -------------------------------------------------------------------------

// Lấy ngày hôm nay theo múi giờ Việt Nam Asia/Ho_Chi_Minh (YYYY-MM-DD)
function getVietnamTodayDate() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(now);
}

// Lấy ngày mai (hôm nay + 1 ngày) xử lý an toàn chuyển tháng / chuyển năm
function getVietnamTomorrowDate() {
    const todayStr = getVietnamTodayDate();
    const parts = todayStr.split('-').map(Number);
    // Dùng giờ giữa trưa (12:00:00) để không bị xê dịch múi giờ khi add day
    const dt = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    dt.setDate(dt.getDate() + 1);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Lấy kỳ quay gần nhất ĐÃ CÓ KẾT QUẢ THỰC TẾ trong dữ liệu
function getLatestAvailableDrawDate(draws) {
    if (draws && draws.length > 0 && draws[0].draw_date) {
        return draws[0].draw_date;
    }
    return getVietnamTodayDate();
}

// Lấy danh sách kết quả mở thưởng có cache
async function getCachedDrawResults() {
    if (CACHED_DRAW_RESULTS && CACHED_DRAW_RESULTS.length > 0) {
        return CACHED_DRAW_RESULTS;
    }
    try {
        const res = await fetch('/api/results');
        const data = await res.json();
        CACHED_DRAW_RESULTS = data;
        return data;
    } catch (e) {
        console.error('Lỗi tải kết quả mở thưởng:', e);
        return [];
    }
}

// Đồng bộ ô input text hiển thị Ngày - tháng - năm
function syncDrawBridgeDateDisplay(isoDateStr) {
    const dispEl = document.getElementById('auto-pattern-custom-date-display');
    if (dispEl && isoDateStr) {
        dispEl.value = formatToDayMonthYear(isoDateStr);
    }
}

// Mở bảng lịch chọn ngày native khi nhấn vào icon lịch vàng hoặc ô nhập
function openDrawBridgeDatePicker() {
    const input = document.getElementById('auto-pattern-custom-date');
    if (input) {
        if (typeof input.showPicker === 'function') {
            try {
                input.showPicker();
            } catch (err) {
                input.focus();
            }
        } else {
            input.focus();
        }
    }
}

// Cập nhật trạng thái active cho 3 nút chọn nhanh [Kỳ mới nhất] [Hôm nay] [Ngày mai]
function updateDrawBridgeQuickDateButtons(currentDateVal, draws) {
    const btnLatest = document.getElementById('btn-auto-quick-latest');
    const btnToday = document.getElementById('btn-auto-quick-today');
    const btnTomorrow = document.getElementById('btn-auto-quick-tomorrow');

    const latestStr = getLatestAvailableDrawDate(draws);
    const todayStr = getVietnamTodayDate();
    const tomorrowStr = getVietnamTomorrowDate();

    const activeCls = 'px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500/25 text-amber-300 border border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition cursor-pointer';
    const inactiveCls = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer';

    if (btnLatest) btnLatest.className = (currentDateVal === latestStr) ? activeCls : inactiveCls;
    if (btnToday) btnToday.className = (currentDateVal === todayStr) ? activeCls : inactiveCls;
    if (btnTomorrow) btnTomorrow.className = (currentDateVal === tomorrowStr) ? activeCls : inactiveCls;
}

// -------------------------------------------------------------------------
// ĐIỀU HƯỚNG MỐC THỜI GIAN CHO TAB "VẼ ĐƯỜNG CẦU"
// Chỉ tác động đến tab Vẽ đường cầu, KHÔNG tính lại công thức, KHÔNG tạo lại Top 3
// -------------------------------------------------------------------------
async function updateDrawBridgeDate(dateVal) {
    if (!dateVal) return;
    window.SELECTED_DRAW_DATE = dateVal;

    // Cập nhật giá trị input native và display
    const dateInput = document.getElementById('auto-pattern-custom-date');
    if (dateInput && dateInput.value !== dateVal) {
        dateInput.value = dateVal;
    }
    syncDrawBridgeDateDisplay(dateVal);

    // Cập nhật text nhãn mốc ngày đang vẽ
    const activeDateText = document.getElementById('draw-bridge-active-date-text');
    if (activeDateText) {
        const parts = dateVal.split('-');
        if (parts.length === 3) {
            activeDateText.innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
            activeDateText.innerText = dateVal;
        }
    }

    // Cập nhật trạng thái active của 3 nút
    const draws = await getCachedDrawResults();
    updateDrawBridgeQuickDateButtons(dateVal, draws);

    // CHỈ CẬP NHẬT TAB VẼ ĐƯỜNG CẦU
    if (CURRENT_ACTIVE_PATTERN) {
        selectPatternForVisualization(CURRENT_ACTIVE_PATTERN, false, dateVal);
    } else {
        const patterns = CURRENT_SCAN_DATA?.patterns || Object.values(window.ALL_LOADED_PATTERNS || {});
        if (patterns.length > 0) {
            selectPatternForVisualization(patterns[0], false, dateVal);
        }
    }
}

// Bắt sự kiện khi người dùng chọn ngày từ Date Picker native
function onDrawBridgeDateNativeChange(val) {
    if (!val) return;
    updateDrawBridgeDate(val);
}

// Chọn nhanh mốc thời gian vẽ đường cầu: latest, today, tomorrow
async function quickSelectDrawBridgeDate(type) {
    const draws = await getCachedDrawResults();
    let targetDateStr = '';

    if (type === 'latest') {
        // Kỳ quay gần nhất ĐÃ CÓ KẾT QUẢ THỰC TẾ trong dữ liệu
        targetDateStr = getLatestAvailableDrawDate(draws);
    } else if (type === 'today') {
        // Hôm nay theo múi giờ Việt Nam
        targetDateStr = getVietnamTodayDate();
    } else if (type === 'tomorrow') {
        // Ngày mai (Hôm nay + 1 ngày, chuẩn chuyển tháng/năm)
        targetDateStr = getVietnamTomorrowDate();
    }

    if (targetDateStr) {
        await updateDrawBridgeDate(targetDateStr);
    }
}

// Bật/tắt dải tham số đào tìm nâng cao
function togglePatternAdvancedSettings() {
    const wrapper = document.getElementById('pattern-advanced-settings-wrapper');
    const icon = document.getElementById('icon-toggle-pattern-settings');
    if (!wrapper) return;
    const isHidden = wrapper.classList.contains('hidden');
    if (isHidden) {
        wrapper.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        wrapper.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

// Khởi tạo tab Auto Pattern & Vẽ đường cầu
async function initAutoPatternTab() {
    console.log('[Pattern Visualizer] initAutoPatternTab triggered');
    // Tự động tải bảng cầu 4 ngày thông hôm qua nếu chưa có
    if (!CURRENT_STREAK_RESPONSE) {
        loadStreakBridges('yesterday', 4, true);
    }

    const draws = await getCachedDrawResults();
    const latestRealDate = getLatestAvailableDrawDate(draws);

    // 1. Khởi tạo mốc thời gian cho tab Vẽ đường cầu: mặc định chọn Kỳ mới nhất có kết quả thực tế
    const dateInput = document.getElementById('auto-pattern-custom-date');
    const initDate = (dateInput && dateInput.value) ? dateInput.value : latestRealDate;
    if (dateInput) {
        dateInput.value = initDate;
    }
    window.SELECTED_DRAW_DATE = initDate;
    syncDrawBridgeDateDisplay(initDate);

    const activeDateText = document.getElementById('draw-bridge-active-date-text');
    if (activeDateText) {
        const parts = initDate.split('-');
        if (parts.length === 3) {
            activeDateText.innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }
    updateDrawBridgeQuickDateButtons(initDate, draws);

    await loadPredictionHistory(true);

    // 2. Tải Top 3 đề xuất theo snapshot cố định của ngày hiện tại (nếu chưa tải)
    // 2. Khởi tạo bộ chọn ngày cho Top 3
    initTop3DateSelector();

    // 3. Tải bảng lịch sử dự đoán Top 3 các kỳ trước
    loadTop3HistoryTable();

    // 4. Tải Top 3 đề xuất theo snapshot cố định của ngày hiện tại (nếu chưa tải)
    if (!CURRENT_SCAN_DATA) {
        await triggerAutoDiscovery(null, false);
    } else {
        setTimeout(redrawCurrentSvg, 150);
    }
}

// =========================================================================
// QUẢN LÝ MỐC NGÀY XEM TOP 3 ĐỀ XUẤT & LỊCH SỬ KẾT QUẢ ĐỐI CHIẾU
// =========================================================================

// Khởi tạo danh sách ngày vào dropdown Top 3
async function initTop3DateSelector() {
    const selectEl = document.getElementById('top3-date-select');
    if (!selectEl) return;

    try {
        const res = await fetch('/api/patterns/top3-history?limit=all');
        const data = await res.json();

        const draws = await getCachedDrawResults();
        const latestRealDate = getLatestAvailableDrawDate(draws);
        const tomorrowStr = getVietnamTomorrowDate();

        let optionsHtml = '';

        // 1. Mặc định: Kỳ mới nhất (Dự đoán ngày tiếp theo)
        optionsHtml += `<option value="latest" selected>🌟 Kỳ mới nhất (Dự đoán ${formatToDayMonthYear(tomorrowStr)})</option>`;

        // 2. Hôm qua (Kỳ đã mở thưởng gần nhất)
        if (latestRealDate) {
            optionsHtml += `<option value="${latestRealDate}">📅 Hôm qua (${formatToDayMonthYear(latestRealDate)})</option>`;
        }

        // 3. Danh sách các ngày trong lịch sử từ snapshots
        if (data && data.history && data.history.length > 0) {
            data.history.forEach(item => {
                if (item.targetDate === latestRealDate) return;

                let statusLabel = '';
                if (item.isPending) {
                    statusLabel = '⏳ Chờ KQ';
                } else if (item.summary?.isWin) {
                    statusLabel = `🎯 Nổ ${item.summary.hitPairs}/3 cặp (${item.summary.totalHits} nháy)`;
                } else {
                    statusLabel = '❌ Chưa về';
                }

                optionsHtml += `<option value="${item.targetDate}">${formatToDayMonthYear(item.targetDate)} - ${statusLabel}</option>`;
            });
        }

        selectEl.innerHTML = optionsHtml;
    } catch (e) {
        console.error('Lỗi khi nạp danh sách ngày Top 3:', e);
    }
}

// Cập nhật trạng thái nút bấm nhanh Top 3
function updateTop3QuickButtons(currentVal, latestDate, yesterdayDate) {
    const btnLatest = document.getElementById('btn-top3-quick-latest');
    const btnYesterday = document.getElementById('btn-top3-quick-yesterday');

    const activeCls = 'px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/25 text-amber-300 border border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition cursor-pointer';
    const inactiveCls = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer';

    if (btnLatest) {
        btnLatest.className = (currentVal === 'latest') ? activeCls : inactiveCls;
    }
    if (btnYesterday) {
        btnYesterday.className = (currentVal === 'yesterday' || currentVal === yesterdayDate) ? activeCls : inactiveCls;
    }
}

// Chuyển mốc thời gian xem Top 3
async function selectTop3Date(dateVal) {
    if (!dateVal) return;

    const draws = await getCachedDrawResults();
    const latestRealDate = getLatestAvailableDrawDate(draws);

    let targetDate = null;
    let valForDropdown = dateVal;

    if (dateVal === 'latest') {
        targetDate = null;
        window.CURRENT_AUTO_PATTERN_DATE = null;
    } else if (dateVal === 'yesterday') {
        targetDate = latestRealDate;
        window.CURRENT_AUTO_PATTERN_DATE = latestRealDate;
        valForDropdown = latestRealDate;
    } else {
        targetDate = dateVal;
        window.CURRENT_AUTO_PATTERN_DATE = dateVal;
    }

    updateTop3QuickButtons(dateVal, 'latest', latestRealDate);
    const selectEl = document.getElementById('top3-date-select');
    if (selectEl) {
        selectEl.value = valForDropdown;
    }

    await triggerAutoDiscovery(targetDate, false, dateVal !== 'latest');
}

// Mở Modal Lịch Sử Top 3
async function openTop3HistoryModal() {
    const modal = document.getElementById('top3-history-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const loadingEl = document.getElementById('top3-history-modal-loading');
    const listEl = document.getElementById('top3-history-modal-list');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (listEl) listEl.innerHTML = '';

    try {
        const res = await fetch('/api/patterns/top3-history?limit=all');
        const data = await res.json();

        if (loadingEl) loadingEl.classList.add('hidden');

        if (data.status === 'SUCCESS' && data.history) {
            renderTop3HistoryModal(data);
        } else {
            if (listEl) {
                listEl.innerHTML = '<div class="p-6 text-center text-neutral-400">Chưa có dữ liệu lịch sử Top 3.</div>';
            }
        }
    } catch (e) {
        console.error('Lỗi khi tải lịch sử Top 3:', e);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (listEl) {
            listEl.innerHTML = '<div class="p-6 text-center text-red-400">Lỗi khi tải dữ liệu từ máy chủ.</div>';
        }
    }
}

// Đóng Modal Lịch Sử Top 3
function closeTop3HistoryModal() {
    const modal = document.getElementById('top3-history-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Render dữ liệu Modal Lịch Sử Top 3
function renderTop3HistoryModal(data) {
    const history = data.history || [];

    // Tính KPI
    const totalDays = history.length;
    const completedDays = history.filter(h => !h.isPending);
    const winDays = completedDays.filter(h => h.summary?.isWin).length;
    const totalHits = completedDays.reduce((acc, h) => acc + (h.summary?.totalHits || 0), 0);
    const winRate = completedDays.length > 0 ? ((winDays / completedDays.length) * 100).toFixed(1) : '0.0';

    setElText('modal-top3-stat-total', `${totalDays} kỳ`);
    setElText('modal-top3-stat-wins', `${winDays}/${completedDays.length} kỳ`);
    setElText('modal-top3-stat-rate', `${winRate}%`);
    setElText('modal-top3-stat-hits', `${totalHits} nháy`);

    const listEl = document.getElementById('top3-history-modal-list');
    if (!listEl) return;

    if (history.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-neutral-400">Không có bản ghi nào.</div>';
        return;
    }

    listEl.innerHTML = history.map(item => {
        const formattedDate = formatToDayMonthYear(item.targetDate);
        const sourceFormatted = formatToDayMonthYear(item.sourceDate);

        let statusBadge = '';
        if (item.isPending) {
            statusBadge = `
                <span class="px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <i class="fa-solid fa-clock text-amber-400"></i> Đang chờ mở thưởng 18h15
                </span>
            `;
        } else if (item.summary?.isWin) {
            statusBadge = `
                <span class="px-3 py-1 rounded-full text-xs font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <i class="fa-solid fa-circle-check text-emerald-400"></i> NỔ ${item.summary.hitPairs}/3 CẶP (${item.summary.totalHits} NHÁY)
                </span>
            `;
        } else {
            statusBadge = `
                <span class="px-3 py-1 rounded-full text-xs font-semibold text-neutral-400 bg-neutral-900 border border-neutral-700 flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-xmark text-red-400"></i> Chưa về kỳ này
                </span>
            `;
        }

        const renderPairBadge = (topObj, label, colorCls, borderCls) => {
            const pair = topObj?.pair || '--';
            const isHit = topObj?.eval?.hit;
            const hitsCount = topObj?.eval?.hits_count || 0;
            const matchedStr = topObj?.eval?.matched?.join(', ') || '';

            let hitIndicator = '';
            if (isHit) {
                hitIndicator = `<span class="ml-1 text-[10px] font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/50">Nổ ${matchedStr} (${hitsCount}n)</span>`;
            }

            return `
                <div class="p-2.5 rounded-xl bg-black/60 border ${borderCls} flex flex-col justify-between">
                    <div class="text-[10px] uppercase font-bold text-neutral-400">${label}</div>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-sm font-black font-mono ${colorCls}">${pair}</span>
                        ${hitIndicator}
                    </div>
                </div>
            `;
        };

        return `
            <div class="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 transition space-y-3 shadow-md">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-800/80 pb-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm sm:text-base font-black text-white font-mono flex items-center gap-1.5">
                                <i class="fa-solid fa-calendar-day text-amber-400"></i> Kỳ dự đoán: ${formattedDate}
                            </span>
                            <span class="text-[11px] text-neutral-400 font-mono hidden sm:inline">(Soi từ kỳ: ${sourceFormatted})</span>
                        </div>
                    </div>
                    <div>
                        ${statusBadge}
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    ${renderPairBadge(item.top1, '🏆 TOP #1', 'text-yellow-300', 'border-yellow-500/40')}
                    ${renderPairBadge(item.top2, 'TOP #2', 'text-cyan-400', 'border-cyan-500/40')}
                    ${renderPairBadge(item.top3, 'TOP #3', 'text-emerald-400', 'border-emerald-500/40')}
                </div>

                <div class="flex justify-end pt-1">
                    <button type="button" onclick="applyHistoryDateToTop3('${item.targetDate}')"
                            class="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow transition hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-eye text-yellow-300"></i>
                        <span>Xem Lại Kỳ Này Trên Trang Chủ</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Nạp một ngày từ lịch sử vào trang chủ và cuộn đến khu vực Top 3
async function applyHistoryDateToTop3(targetDate) {
    closeTop3HistoryModal();
    await selectTop3Date(targetDate);
    const topSection = document.getElementById('pattern-top-section');
    if (topSection) {
        topSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// =========================================================================
// QUẢN LÝ BẢNG LỊCH SỬ DỰ ĐOÁN TOP 3 TRÊN TRANG CHỦ (IN-PAGE TABLE)
// =========================================================================

let CURRENT_TOP3_HISTORY_DATA = [];
let CURRENT_TOP3_HISTORY_FILTER = 'all';

// Hàm tải dữ liệu bảng lịch sử Top 3
async function loadTop3HistoryTable(forceReload = false) {
    const tableBody = document.getElementById('top3-history-table-body');
    if (!tableBody) return;

    if (forceReload || !CURRENT_TOP3_HISTORY_DATA || CURRENT_TOP3_HISTORY_DATA.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-neutral-400">
                    <i class="fa-solid fa-spinner fa-spin text-xl text-amber-400 mb-2"></i>
                    <p class="font-bold text-xs text-neutral-300">Đang tải dữ liệu lịch sử các kỳ...</p>
                </td>
            </tr>
        `;
        try {
            const res = await fetch('/api/patterns/top3-history?limit=100');
            const data = await res.json();
            if (data.status === 'SUCCESS' && data.history) {
                CURRENT_TOP3_HISTORY_DATA = data.history;
            } else {
                CURRENT_TOP3_HISTORY_DATA = [];
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử Top 3:', err);
            CURRENT_TOP3_HISTORY_DATA = [];
        }
    }

    renderTop3HistoryTableContent();
}

// Cập nhật thống kê và render nội dung bảng
function renderTop3HistoryTableContent() {
    const history = CURRENT_TOP3_HISTORY_DATA || [];
    const tableBody = document.getElementById('top3-history-table-body');
    const summaryEl = document.getElementById('top3-history-table-summary');
    if (!tableBody) return;

    // Tính KPI tổng
    const totalDays = history.length;
    const completedDays = history.filter(h => !h.isPending);
    const winDays = completedDays.filter(h => h.summary?.isWin).length;
    const totalHits = completedDays.reduce((acc, h) => acc + (h.summary?.totalHits || 0), 0);
    const winRate = completedDays.length > 0 ? ((winDays / completedDays.length) * 100).toFixed(1) : '0.0';

    setElText('table-top3-stat-total', `${totalDays} kỳ`);
    setElText('table-top3-stat-wins', `${winDays}/${completedDays.length} kỳ`);
    setElText('table-top3-stat-rate', `${winRate}%`);
    setElText('table-top3-stat-hits', `${totalHits} nháy`);

    // Cập nhật số đếm trên các nút filter
    const countAll = totalDays;
    const countWin = winDays;
    const countLose = completedDays.filter(h => !h.summary?.isWin).length;
    const countPending = history.filter(h => h.isPending).length;

    setElText('cnt-flt-all', countAll);
    setElText('cnt-flt-win', countWin);
    setElText('cnt-flt-lose', countLose);
    setElText('cnt-flt-pending', countPending);

    // Lọc theo search keyword
    const searchVal = document.getElementById('top3-history-search-input')?.value?.trim().toLowerCase() || '';

    // Lọc theo status filter
    let filtered = history.filter(item => {
        if (CURRENT_TOP3_HISTORY_FILTER === 'win') return !item.isPending && item.summary?.isWin;
        if (CURRENT_TOP3_HISTORY_FILTER === 'lose') return !item.isPending && !item.summary?.isWin;
        if (CURRENT_TOP3_HISTORY_FILTER === 'pending') return item.isPending;
        return true;
    });

    if (searchVal) {
        filtered = filtered.filter(item => {
            const dateStr = item.targetDate || '';
            const p1 = item.top1?.pair || '';
            const p2 = item.top2?.pair || '';
            const p3 = item.top3?.pair || '';
            return dateStr.includes(searchVal) || p1.includes(searchVal) || p2.includes(searchVal) || p3.includes(searchVal);
        });
    }

    if (summaryEl) {
        summaryEl.innerHTML = `Hiển thị <b>${filtered.length}</b> / <b>${totalDays}</b> kỳ dự đoán lịch sử`;
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-neutral-400">
                    <i class="fa-solid fa-filter-circle-xmark text-2xl text-neutral-600 mb-2"></i>
                    <p class="text-sm font-bold text-neutral-300">Không tìm thấy bản ghi nào phù hợp với bộ lọc.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map((item, idx) => {
        const formattedTarget = formatToDayMonthYear(item.targetDate);
        const formattedSource = formatToDayMonthYear(item.sourceDate);

        // Render từng Top
        const renderCellTop = (topObj, label, textColor) => {
            const pair = topObj?.pair || '--';
            const isHit = topObj?.eval?.hit;
            const hitsCount = topObj?.eval?.hits_count || 0;
            const matchedList = topObj?.eval?.matched || [];

            let badgeHtml = '';
            if (item.isPending) {
                badgeHtml = `<span class="text-[10px] text-neutral-500 font-mono">Đang chờ</span>`;
            } else if (isHit) {
                badgeHtml = `<span class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.3)]">Nổ ${matchedList.join(', ')} (${hitsCount}n)</span>`;
            } else {
                badgeHtml = `<span class="text-[10px] text-neutral-500 font-mono">Xịt</span>`;
            }

            return `
                <div class="text-center py-1">
                    <div class="font-black text-sm ${textColor}">${pair}</div>
                    <div class="mt-0.5">${badgeHtml}</div>
                </div>
            `;
        };

        // Cột Kết quả nổ trúng
        let resultColHtml = '';
        if (item.isPending) {
            resultColHtml = `
                <span class="text-xs font-bold text-amber-300 flex items-center justify-center gap-1">
                    <i class="fa-solid fa-clock text-amber-400"></i> Chờ mở thưởng 18h15
                </span>
            `;
        } else if (item.summary?.isWin) {
            resultColHtml = `
                <div class="text-center">
                    <span class="text-xs font-black text-emerald-400 font-mono">Nổ ${item.summary.hitPairs}/3 cặp</span>
                    <div class="text-[11px] text-yellow-300 font-bold font-mono">Tổng: ${item.summary.totalHits} nháy</div>
                </div>
            `;
        } else {
            resultColHtml = `
                <span class="text-xs font-semibold text-neutral-500 font-mono">Gãy cả 3 cặp</span>
            `;
        }

        // Cột Đánh giá (Badge Win/Lose/Pending)
        let evalBadgeHtml = '';
        if (item.isPending) {
            evalBadgeHtml = `<span class="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50">⏳ CHỜ KQ</span>`;
        } else if (item.summary?.isWin) {
            evalBadgeHtml = `<span class="px-2.5 py-1 rounded-lg text-[11px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]">🎯 THẮNG (WIN)</span>`;
        } else {
            evalBadgeHtml = `<span class="px-2.5 py-1 rounded-lg text-[11px] font-bold text-neutral-400 bg-neutral-900 border border-neutral-700">❌ TRƯỢT</span>`;
        }

        return `
            <tr class="hover:bg-neutral-800/40 transition border-b border-neutral-800/60">
                <td class="p-3 text-center text-neutral-400 font-bold">${idx + 1}</td>
                <td class="p-3">
                    <div class="font-black text-white text-xs">${formattedTarget}</div>
                    <div class="text-[10px] text-neutral-500 font-mono">Soi: ${formattedSource}</div>
                </td>
                <td class="p-2.5">${renderCellTop(item.top1, 'Top 1', 'text-yellow-400 font-mono text-base')}</td>
                <td class="p-2.5">${renderCellTop(item.top2, 'Top 2', 'text-cyan-400 font-mono text-base')}</td>
                <td class="p-2.5">${renderCellTop(item.top3, 'Top 3', 'text-emerald-400 font-mono text-base')}</td>
                <td class="p-3 text-center">${resultColHtml}</td>
                <td class="p-3 text-center">${evalBadgeHtml}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button type="button" onclick="applyHistoryDateToTop3('${item.targetDate}')" 
                                class="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition cursor-pointer shadow-sm"
                                title="Nạp lại kết quả ngày này lên 3 Card Top 3">
                            <i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>Xem lại
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Chuyển tab lọc trong bảng
function filterTop3HistoryTable(filterKey) {
    CURRENT_TOP3_HISTORY_FILTER = filterKey;

    const btns = {
        all: document.getElementById('btn-flt-top3-all'),
        win: document.getElementById('btn-flt-top3-win'),
        lose: document.getElementById('btn-flt-top3-lose'),
        pending: document.getElementById('btn-flt-top3-pending')
    };

    const activeCls = 'px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/25 text-amber-300 border border-amber-500/70 transition cursor-pointer';
    const inactiveCls = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer';

    Object.keys(btns).forEach(k => {
        if (btns[k]) btns[k].className = (k === filterKey) ? activeCls : inactiveCls;
    });

    renderTop3HistoryTableContent();
}

// Tìm kiếm trong bảng
function onTop3HistorySearchChange() {
    renderTop3HistoryTableContent();
}

// Xuất file Excel / CSV cho bảng lịch sử Top 3
function exportTop3HistoryExcel() {
    const history = CURRENT_TOP3_HISTORY_DATA || [];
    if (history.length === 0) {
        alert('Không có dữ liệu lịch sử để xuất file.');
        return;
    }

    let csvContent = '\uFEFF'; // BOM UTF-8 để mở tiếng Việt trên Excel không bị lỗi font
    csvContent += 'STT,Ky Mo Thuong,Ngay Soi Cau,Top 1 De Xuat,Ket Qua Top 1,Top 2 De Xuat,Ket Qua Top 2,Top 3 De Xuat,Ket Qua Top 3,So Cap No,Tong So Nhay,Danh Gia,Trang Thai\n';

    history.forEach((item, idx) => {
        const targetDate = item.targetDate;
        const sourceDate = item.sourceDate;
        const top1Pair = `"${item.top1?.pair || ''}"`;
        const top1Res = item.top1?.eval?.hit ? `"No ${item.top1.eval.matched.join(' ')} (${item.top1.eval.hits_count} nhay)"` : (item.isPending ? '"Dang cho"' : '"Xit"');
        const top2Pair = `"${item.top2?.pair || ''}"`;
        const top2Res = item.top2?.eval?.hit ? `"No ${item.top2.eval.matched.join(' ')} (${item.top2.eval.hits_count} nhay)"` : (item.isPending ? '"Dang cho"' : '"Xit"');
        const top3Pair = `"${item.top3?.pair || ''}"`;
        const top3Res = item.top3?.eval?.hit ? `"No ${item.top3.eval.matched.join(' ')} (${item.top3.eval.hits_count} nhay)"` : (item.isPending ? '"Dang cho"' : '"Xit"');
        const hitPairs = item.summary?.hitPairs || 0;
        const totalHits = item.summary?.totalHits || 0;
        const evalStr = item.isPending ? '"Dang cho mo thuong"' : (item.summary?.isWin ? `"Thang (No ${hitPairs}/3 cap)"` : '"Truot"');
        const statusStr = item.isPending ? '"PENDING"' : (item.summary?.isWin ? '"WIN"' : '"LOSE"');

        csvContent += `${idx + 1},${targetDate},${sourceDate},${top1Pair},${top1Res},${top2Pair},${top2Res},${top3Pair},${top3Res},${hitPairs},${totalHits},${evalStr},${statusStr}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lich_Su_Du_Doan_Top3_XSMB_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Aliases toàn cục an toàn
window.initTop3DateSelector = initTop3DateSelector;
window.selectTop3Date = selectTop3Date;
window.openTop3HistoryModal = openTop3HistoryModal;
window.closeTop3HistoryModal = closeTop3HistoryModal;
window.applyHistoryDateToTop3 = applyHistoryDateToTop3;
window.loadTop3HistoryTable = loadTop3HistoryTable;
window.filterTop3HistoryTable = filterTop3HistoryTable;
window.onTop3HistorySearchChange = onTop3HistorySearchChange;
window.exportTop3HistoryExcel = exportTop3HistoryExcel;

// Aliases tương thích ngược an toàn
window.openAutoPatternDatePicker = openDrawBridgeDatePicker;
window.onAutoPatternDateNativeChange = onDrawBridgeDateNativeChange;
window.quickSelectAutoPatternDate = quickSelectDrawBridgeDate;
window.calculateAutoPatternDate = () => {
    const input = document.getElementById('auto-pattern-custom-date');
    if (input && input.value) updateDrawBridgeDate(input.value);
};

// Kích hoạt quét tự động [TỰ TÌM ĐƯỜNG CẦU]
// forceRefresh: false (mặc định) => Ưu tiên đọc snapshot cố định theo ngày đã lưu trong DB
// forceRefresh: true => Chủ động quét lại và ghi đè/cập nhật snapshot
async function triggerAutoDiscovery(anchorDateOverride = null, forceRefresh = false, savedOnly = false) {
    const rangeDays = document.getElementById('pattern-range-select')?.value || '60';
    const minOcc = document.getElementById('pattern-min-occ')?.value || '10';
    const minConf = document.getElementById('pattern-min-conf')?.value || '0.40';
    const minStreak = document.getElementById('pattern-min-streak')?.value || '0';
    const targetType = document.getElementById('pattern-target-type')?.value || 'loto_2digit';

    const anchorDate = anchorDateOverride || window.CURRENT_AUTO_PATTERN_DATE || null;

    const scanBtn = document.getElementById('btn-run-auto-discovery');
    const loadingEl = document.getElementById('pattern-scan-loading');
    const resultsContainer = document.getElementById('pattern-scan-results');

    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> ${forceRefresh ? 'Đang Tính Lại Pattern...' : 'Đang Tải Snapshot Đề Xuất...'}`;
    }
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultsContainer) resultsContainer.classList.add('opacity-40');

    try {
        let url = `/api/patterns/scan?days=${encodeURIComponent(rangeDays)}&min_occurrences=${minOcc}&min_confidence=${minConf}&min_streak=${minStreak}&exact_streak=4&target_type=${targetType}&top_n=50`;
        if (anchorDate) {
            url += `&anchor_date=${encodeURIComponent(anchorDate)}`;
        }
        if (savedOnly) url += '&saved_only=true';
        if (forceRefresh) {
            url += `&force_refresh=true`;
        }
        console.log('[Pattern Visualizer] Fetching:', url);
        const res = await fetch(url);
        const data = await res.json();
        console.log('[Pattern Visualizer] Response received:', data.status, 'patterns count:', data.patterns?.length, 'isSnapshot:', data.isSnapshot);

        if (data.status === 'SUCCESS') {
            CURRENT_SCAN_DATA = data;
            window.CURRENT_AUTO_PATTERN_DATE = data.targetDate;

            // Lưu vào map toàn cục để tránh lỗi JSON stringify trong HTML onclick
            window.ALL_LOADED_PATTERNS = {};
            if (data.patterns) {
                data.patterns.forEach(p => {
                    window.ALL_LOADED_PATTERNS[p.patternId] = p;
                });
            }

            renderScanSummary(data.scanSummary);
            renderTopHighlightCards(data.patterns);
            renderPatternsTable(data.patterns);

            // Mặc định nạp pattern xếp hạng #1 (cầu ăn thông 4 ngày) vào bảng vẽ SVG tại anchorDate
            const streak4List = (data.patterns || []).filter(p => p.currentStreak === 4);
            const chosenList = streak4List.length > 0 ? streak4List : (data.patterns || []);
            if (chosenList.length > 0) {
                const topP = chosenList[0];
                selectPatternForVisualization(topP, false, anchorDate);
            }
        } else {
            alert(data.message || 'Lỗi khi quét pattern.');
        }
    } catch (err) {
        console.error('[Pattern Visualizer] Lỗi khi gọi API scan pattern:', err);
    } finally {
        if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-300"></i> TỰ TÌM ĐƯỜNG CẦU (QUÉT LẠI)`;
        }
        if (loadingEl) loadingEl.classList.add('hidden');
        if (resultsContainer) resultsContainer.classList.remove('opacity-40');
    }
}

// Hiển thị thanh tóm tắt tiến trình đào dữ liệu (Section XX)
function renderScanSummary(summary) {
    if (!summary) return;
    setElText('sum-candidates-checked', summary.candidatesChecked?.toLocaleString() || '0');
    setElText('sum-rejected-count', summary.rejectedCount?.toLocaleString() || '0');
    setElText('sum-passed-count', summary.passedCount?.toLocaleString() || '0');
    setElText('sum-strong-count', summary.strongCount || '0');
    setElText('sum-medium-count', summary.mediumCount || '0');
    setElText('sum-weak-count', summary.weakCount || '0');
    setElText('sum-overfit-count', summary.overfitCount || '0');
    setElText('sum-elapsed-time', `${summary.elapsedSeconds}s`);
    setElText('sum-draws-analyzed', `${summary.drawsAnalyzed} kỳ`);
}

// Hiển thị các thẻ Top 3 nổi bật (Lùi lại dự đoán tới ngày activeDate)
// Hiển thị các thẻ Top 3 nổi bật (Chỉ xếp hạng cho cầu ăn thông 4 ngày)
function renderTopHighlightCards(patterns) {
    const container = document.getElementById('pattern-top-cards-container');
    if (!container) return;

    const activeDate = window.CURRENT_AUTO_PATTERN_DATE || CURRENT_SCAN_DATA?.anchorDate || null;
    const activeDateFormatted = activeDate ? formatToDayMonthYear(activeDate) : 'Kỳ mới nhất';

    // Cập nhật nhãn dự đoán tới ngày trên tiêu đề
    const topDateInd = document.getElementById('pattern-top-date-indicator');
    if (topDateInd) {
        let lockBadge = '';
        if (CURRENT_SCAN_DATA?.isSnapshot) {
            lockBadge = `<span class="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-black text-amber-300 bg-amber-950/80 border border-amber-500/60 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.3)]"><i class="fa-solid fa-lock text-amber-400"></i> Snapshot Cố Định</span>`;
        }
        topDateInd.innerHTML = `Dự đoán tới ngày: <b class="text-amber-400 font-bold">${activeDateFormatted}</b>${lockBadge}`;
    }

    // Lọc xếp hạng CHỈ CHO CẦU ĂN THÔNG 4 NGÀY theo đúng yêu cầu người dùng
    const streak4Patterns = (patterns || []).filter(p => p.currentStreak === 4);

    if (streak4Patterns.length === 0) {
        container.innerHTML = `
            <div class="col-span-full p-8 text-center text-neutral-400 bg-neutral-900/80 rounded-2xl border border-neutral-800 space-y-2">
                <i class="fa-solid fa-circle-exclamation text-amber-400 text-2xl mb-1"></i>
                <p class="text-sm font-bold text-white">Không có đường cầu nào đang ăn thông đúng 4 ngày tính đến ngày ${activeDateFormatted}.</p>
                <p class="text-xs text-neutral-400">Bạn có thể chọn ngày khác ([Hôm qua], [Kỳ mới nhất]...) để xem các đường cầu 4 ngày thông tương ứng.</p>
            </div>
        `;
        return;
    }

    const top3 = streak4Patterns.slice(0, 3);
    const badges = [
        { label: '🏆 TOP #1 CẦU 4 NGÀY THÔNG', border: 'border-yellow-500/80', bg: 'bg-yellow-500/15', text: 'text-yellow-300', glow: 'shadow-[0_0_25px_rgba(234,179,8,0.4)]' },
        { label: 'TOP #2 CẦU 4 NGÀY THÔNG', border: 'border-cyan-500/70', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
        { label: 'TOP #3 CẦU 4 NGÀY THÔNG', border: 'border-emerald-500/70', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
    ];

    container.innerHTML = top3.map((p, idx) => {
        const b = badges[idx] || badges[0];
        const hitRatePct = (p.metrics.rawHitRate * 100).toFixed(1);
        const confPct = (p.metrics.confidenceScore * 100).toFixed(1);

        // Trích xuất bản ghi dự đoán lùi lại tới ngày activeDate
        const targetHist = (activeDate && p.recentHistory)
            ? (p.recentHistory.find(h => h.targetDate === activeDate) || p.recentHistory[0])
            : null;

        let displayPredNumbers = '';
        let targetLabel = '';
        let outcomeBadgeHtml = '';

        if (targetHist && targetHist.targetDate === activeDate) {
            displayPredNumbers = targetHist.predictedNumbers.join(' - ');
            targetLabel = `Dự đoán tới ngày ${targetHist.targetDateDisplay || activeDateFormatted}:`;
            if (targetHist.hit) {
                const hitsCount = targetHist.hitLocations?.length || targetHist.matchedNumbers?.length || 1;
                outcomeBadgeHtml = `
                    <div class="mt-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xl flex items-center justify-between shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        <span class="flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check text-emerald-400"></i> ĐÃ NỔ NGÀY ${targetHist.targetDateDisplay || activeDateFormatted}
                        </span>
                        <span class="font-mono font-black text-yellow-300">${targetHist.matchedNumbers.join(', ')} (${hitsCount} nháy)</span>
                    </div>
                `;
            } else {
                outcomeBadgeHtml = `
                    <div class="mt-2 text-xs font-semibold text-neutral-400 bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-xmark text-red-400"></i> Chưa về ngày ${targetHist.targetDateDisplay || activeDateFormatted}
                    </div>
                `;
            }
        } else {
            displayPredNumbers = p.nextPrediction?.join(' - ') || '--';
            targetLabel = `Dự đoán tới ngày ${activeDateFormatted}:`;
            outcomeBadgeHtml = `
                <div class="mt-2 text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <i class="fa-solid fa-clock text-amber-400"></i> Đang chờ kết quả mở thưởng
                </div>
            `;
        }

        const streakBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">Ăn thông 4 ngày</span>`;

        return `
            <div class="pattern-draw-card p-5 border-2 ${b.border} ${b.bg} ${b.glow} rounded-2xl flex flex-col justify-between transition hover:scale-[1.02]">
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-neutral-900 border ${b.border} ${b.text}">${b.label}</span>
                        ${streakBadge}
                    </div>
                    <h4 class="text-sm font-black text-white mb-1 line-clamp-1">${p.name}</h4>
                    <p class="text-xs text-neutral-400 mb-4 font-mono">${p.formula}</p>

                    <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/60 border border-neutral-800 mb-4">
                        <div>
                            <div class="text-[10px] text-neutral-400 uppercase">Tỷ lệ trúng</div>
                            <div class="text-base font-black text-emerald-400 font-mono">${hitRatePct}% <span class="text-xs text-neutral-500">(${p.hits}/${p.occurrences})</span></div>
                        </div>
                        <div>
                            <div class="text-[10px] text-neutral-400 uppercase">Điểm tin cậy (Wilson)</div>
                            <div class="text-base font-black text-yellow-400 font-mono">${confPct}%</div>
                        </div>
                        <div>
                            <div class="text-[10px] text-neutral-400 uppercase">Lift (vs Baseline)</div>
                            <div class="text-sm font-bold text-cyan-300 font-mono">${p.metrics.lift}x</div>
                        </div>
                        <div>
                            <div class="text-[10px] text-neutral-400 uppercase">Ăn dài nhất</div>
                            <div class="text-sm font-bold text-white font-mono">${p.maxHitStreak} kỳ liên tiếp</div>
                        </div>
                    </div>

                    <div class="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 mb-4">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-red-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-bullseye text-red-400"></i> ${targetLabel}
                            </span>
                            <span class="text-base font-black font-mono text-yellow-300 tracking-wider">${displayPredNumbers}</span>
                        </div>
                        ${outcomeBadgeHtml}
                    </div>
                </div>

                <div class="flex gap-2 pt-2 border-t border-neutral-800">
                    <button onclick="selectPatternById('${p.patternId}', true)" class="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition shadow flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-bezier-curve"></i> Xem Đường Cầu
                    </button>
                    <button onclick="openPatternDetailDrawerById('${p.patternId}')" class="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs transition">
                        Chi tiết
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Hiển thị bảng thống kê chi tiết (Section XI)
function renderPatternsTable(patterns) {
    const tbody = document.getElementById('patterns-table-body');
    if (!tbody) return;

    if (!patterns || patterns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="p-6 text-center text-neutral-400">Không có pattern nào.</td></tr>`;
        return;
    }

    const activeDate = window.CURRENT_AUTO_PATTERN_DATE || CURRENT_SCAN_DATA?.anchorDate || null;

    tbody.innerHTML = patterns.map((p, idx) => {
        const hitRatePct = (p.metrics.rawHitRate * 100).toFixed(1);
        const confPct = (p.metrics.confidenceScore * 100).toFixed(1);
        const strengthClass = {
            'STRONG': 'bg-emerald-950 text-emerald-300 border-emerald-700',
            'MEDIUM': 'bg-cyan-950 text-cyan-300 border-cyan-700',
            'WEAK': 'bg-neutral-800 text-neutral-400 border-neutral-700',
            'OVERFIT': 'bg-red-950 text-red-400 border-red-700'
        }[p.metrics.statisticalStrength] || 'bg-neutral-800 text-neutral-400';

        // Lùi lại dự đoán tới activeDate
        const targetHist = (activeDate && p.recentHistory)
            ? (p.recentHistory.find(h => h.targetDate === activeDate) || p.recentHistory[0])
            : null;

        let tablePredHtml = '';
        if (targetHist && targetHist.targetDate === activeDate) {
            const hitBadge = targetHist.hit
                ? `<span class="ml-1 text-[10px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500/60 px-1.5 py-0.5 rounded">Nổ</span>`
                : `<span class="ml-1 text-[10px] font-bold text-neutral-500 bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded">Xịt</span>`;
            tablePredHtml = `<span class="text-yellow-300 font-mono font-bold">${targetHist.predictedNumbers.join('-')}</span> ${hitBadge}`;
        } else {
            const nextPred = p.nextPrediction?.join(' - ') || '--';
            tablePredHtml = `<span class="text-yellow-400 font-mono font-black">${nextPred}</span>`;
        }

        return `
            <tr class="border-b border-neutral-800 hover:bg-neutral-800/40 transition">
                <td class="p-3 font-mono font-black text-yellow-400 text-xs text-center">#${idx + 1}</td>
                <td class="p-3">
                    <div class="font-bold text-white text-xs mb-0.5 line-clamp-1">${p.name}</div>
                    <div class="text-[11px] text-neutral-400 font-mono">${p.formula}</div>
                </td>
                <td class="p-3 font-mono text-center font-bold text-xs">${p.occurrences}</td>
                <td class="p-3 font-mono text-center text-emerald-400 font-bold text-xs">${p.hits}</td>
                <td class="p-3 font-mono text-center text-neutral-400 text-xs">${p.misses}</td>
                <td class="p-3 font-mono text-center font-bold text-xs text-white">${hitRatePct}%</td>
                <td class="p-3 font-mono text-center font-black text-xs text-yellow-300">${confPct}%</td>
                <td class="p-3 font-mono text-center text-xs text-cyan-300">${p.metrics.lift}x</td>
                <td class="p-3 text-center">
                    ${p.currentStreak > 0
                        ? `<span class="px-2 py-0.5 rounded-full font-mono text-xs font-black bg-red-600 text-white">${p.currentStreak}</span>`
                        : `<span class="text-neutral-500 font-mono text-xs">0</span>`}
                </td>
                <td class="p-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black border uppercase ${strengthClass}">
                        ${p.metrics.statisticalStrength}
                    </span>
                </td>
                <td class="p-3 text-center font-mono text-xs">${tablePredHtml}</td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="selectPatternById('${p.patternId}', true)" class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow" title="Vẽ đường cầu">
                            <i class="fa-solid fa-bezier-curve"></i>
                        </button>
                        <button onclick="openPatternDetailDrawerById('${p.patternId}')" class="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition" title="Xem chi tiết">
                            <i class="fa-solid fa-circle-info"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Lọc bảng thống kê
function filterPatternsTable() {
    if (!CURRENT_SCAN_DATA || !CURRENT_SCAN_DATA.patterns) return;
    const searchVal = document.getElementById('pattern-search-input')?.value.toLowerCase().trim() || '';
    const strengthVal = document.getElementById('pattern-filter-strength')?.value || 'ALL';
    const minStreakVal = parseInt(document.getElementById('pattern-filter-streak')?.value || '0', 10);
    const sortBy = document.getElementById('pattern-sort-select')?.value || 'hitRate';

    let filtered = CURRENT_SCAN_DATA.patterns.filter(p => {
        if (searchVal && !p.name.toLowerCase().includes(searchVal) && !p.formula.toLowerCase().includes(searchVal)) {
            return false;
        }
        if (strengthVal !== 'ALL' && p.metrics.statisticalStrength !== strengthVal) {
            return false;
        }
        if (minStreakVal > 0 && p.currentStreak < minStreakVal) {
            return false;
        }
        return true;
    });

    // Sắp xếp tương ứng theo chuẩn Cầu Thứ: Độ % ổn định -> Chuỗi ăn thông -> Độ tin cậy -> Lượt nổ
    filtered.sort((a, b) => {
        if (sortBy === 'hitRate') {
            return (b.metrics.rawHitRate - a.metrics.rawHitRate) ||
                   (b.currentStreak - a.currentStreak) ||
                   (b.metrics.confidenceScore - a.metrics.confidenceScore) ||
                   (b.hits - a.hits);
        }
        if (sortBy === 'streak') return (b.currentStreak - a.currentStreak) || (b.metrics.rawHitRate - a.metrics.rawHitRate);
        if (sortBy === 'confidence') return b.metrics.confidenceScore - a.metrics.confidenceScore;
        if (sortBy === 'lift') return b.metrics.lift - a.metrics.lift;
        if (sortBy === 'occurrences') return b.occurrences - a.occurrences;
        return 0;
    });

    renderPatternsTable(filtered);
}

// Truy cập theo patternId an toàn
function selectPatternById(patternId, shouldScroll = false) {
    const pattern = window.ALL_LOADED_PATTERNS[patternId];
    if (pattern) {
        const anchorDate = window.SELECTED_DRAW_DATE || window.CURRENT_AUTO_PATTERN_DATE || null;
        selectPatternForVisualization(pattern, shouldScroll, anchorDate);
    }
}

function openPatternDetailDrawerById(patternId) {
    const pattern = window.ALL_LOADED_PATTERNS[patternId];
    if (pattern) {
        openPatternDetailDrawer(pattern);
    }
}

// Chọn một pattern để trực quan hóa (Section IX)
async function selectPatternForVisualization(pattern, shouldScroll = false, anchorDate = null) {
    if (!pattern) return;
    CURRENT_ACTIVE_PATTERN = pattern;

    // Ưu tiên mốc thời gian vẽ đường cầu độc lập SELECTED_DRAW_DATE
    const targetAnchorDate = anchorDate || window.SELECTED_DRAW_DATE || CURRENT_ACTIVE_PATTERN.anchorDate || null;
    if (targetAnchorDate) {
        CURRENT_ACTIVE_PATTERN.anchorDate = targetAnchorDate;
    }

    // Cập nhật tiêu đề và công thức trong khu vực Visualization
    setElText('vis-pattern-title', pattern.name);
    setElText('vis-pattern-formula', pattern.formula);

    const activeDate = targetAnchorDate;
    let visPredStr = pattern.nextPrediction?.join(' - ') || '--';
    if (activeDate && pattern.recentHistory) {
        const hist = pattern.recentHistory.find(h => h.targetDate === activeDate);
        if (hist) {
            visPredStr = hist.predictedNumbers.join(' - ');
            if (hist.hit) {
                visPredStr += ' (Trúng)';
            }
        }
    }
    setElText('vis-pattern-pred', visPredStr);
    setElText('vis-pattern-streak', pattern.currentStreak > 0
        ? `Chuỗi ăn: ${pattern.currentStreak} kỳ liên tiếp`
        : `Lần nổ gần nhất: ${pattern.lastSeenDaysAgo} kỳ trước`
    );

    const pa = pattern.sources[0].globalIndex;
    const pb = pattern.sources[1].globalIndex;
    const op = pattern.operation;
    const targetType = pattern.target.type;
    const dayOffset = pattern.target.dayOffset || 1;

    const container = document.getElementById('pattern-draws-container');
    if (container) {
        container.innerHTML = `
            <div class="p-12 text-center text-neutral-400">
                <i class="fa-solid fa-spinner fa-spin text-3xl mb-3 text-red-500"></i>
                <p class="text-sm font-semibold">Đang chuẩn bị dữ liệu lưới số & đường nối SVG...</p>
            </div>
        `;
    }

    try {
        let url = `/api/patterns/details?pos_a=${pa}&pos_b=${pb}&op=${op}&target_type=${targetType}&day_offset=${dayOffset}&draws=${CURRENT_DISPLAY_DRAWS}`;
        if (targetAnchorDate) {
            url += `&anchor_date=${encodeURIComponent(targetAnchorDate)}`;
        }
        console.log('[Pattern Visualizer] Loading details:', url);
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'SUCCESS') {
            CURRENT_GRAPH_DATA = data;
            renderDrawCardsLayout(data.drawCards, data.upcomingCard);
            // Đợi layout DOM ổn định rồi vẽ SVG overlay
            setTimeout(() => {
                drawSvgOverlay(data.graph);
            }, 120);

            if (shouldScroll) {
                document.getElementById('pattern-visualization-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            if (container) container.innerHTML = `<div class="p-6 text-red-400">${data.message || 'Lỗi nạp đồ thị'}</div>`;
        }
    } catch (err) {
        console.error('[Pattern Visualizer] Lỗi nạp visualization details:', err);
    }
}

// Render các thẻ kỳ quay liên tiếp dạng xếp dọc: Ngày gần nhất ở TRÊN CÙNG và Thẻ dự đoán kỳ sắp xổ
function renderDrawCardsLayout(drawCards, upcomingCard) {
    const container = document.getElementById('pattern-draws-container');
    if (!container) return;

    if (!drawCards || drawCards.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-neutral-400">Không có dữ liệu kỳ quay.</div>`;
        return;
    }

    let upcomingHtml = '';
    if (upcomingCard) {
        upcomingHtml = `
            <div class="pattern-draw-card p-5 border-2 border-red-500 bg-gradient-to-r from-red-950/90 via-[#0a0f1d] to-amber-950/90 rounded-2xl relative shadow-[0_0_35px_rgba(239,68,68,0.45)]">
                <!-- Header kỳ sắp xổ -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-red-500/40 pb-3 mb-4 gap-2">
                    <div class="flex items-center gap-2.5">
                        <span class="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-0.5 rounded text-[11px] font-black bg-red-600 text-white uppercase tracking-wider">KỲ QUAY KẾ TIẾP (SẮP MỞ THƯỞNG)</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black uppercase">DỰ ĐOÁN ĐƯỜNG CẦU VIP</span>
                            </div>
                            <h4 class="text-base font-black text-white mt-1">${upcomingCard.dayOfWeek} Ngày ${upcomingCard.dateDisplay}</h4>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-mono text-yellow-300 bg-black/80 px-3.5 py-1.5 rounded-xl border border-yellow-500/40 shadow">
                        <i class="fa-solid fa-clock text-yellow-400 animate-pulse"></i>
                        <span>Chờ mở thưởng 18h15 hôm nay</span>
                    </div>
                </div>

                <!-- Hộp Dự Đoán Cặp VIP Đích Đến Của Cầu -->
                <div class="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/85 border border-red-500/50">
                    <div>
                        <div class="text-xs font-bold text-red-300 flex items-center gap-2">
                            <i class="fa-solid fa-wand-magic-sparkles text-yellow-400 text-sm"></i>
                            <span class="uppercase">CẦU CHỈ ĐIỂM CẶP SONG THỦ ĐẮC LỘC:</span>
                        </div>
                        <p class="text-xs text-neutral-300 mt-1 font-mono">
                            Khởi nguồn ghép từ: <b class="text-yellow-400">${upcomingCard.sourceValues}</b> (kỳ ${upcomingCard.sourceDateDisplay})
                        </p>
                        ${upcomingCard.formulaExplain ? `
                            <p class="text-[11px] text-amber-300/90 mt-1 font-mono">
                                <i class="fa-solid fa-calculator text-[10px] mr-1 text-amber-400"></i>${upcomingCard.formulaExplain}
                            </p>
                        ` : ''}
                    </div>

                    <div id="${upcomingCard.targetDomId}" class="flex items-center gap-3">
                        ${upcomingCard.prediction.map(n => `
                            <div class="px-6 py-2 rounded-2xl bg-gradient-to-b from-yellow-400 via-amber-400 to-yellow-500 text-black font-black font-mono text-3xl shadow-[0_0_25px_rgba(250,204,21,0.8)] border-2 border-white scale-105">
                                ${n}
                            </div>
                        `).join('')}
                        <span class="px-3 py-1.5 rounded-xl font-mono text-sm font-black bg-red-600 text-white border border-red-400 shadow animate-pulse">VIP</span>
                    </div>
                </div>
            </div>
        `;
    }

    // SVG container overlay được đặt phủ lên toàn bộ danh sách card
    container.innerHTML = `
        <svg id="pattern-svg-canvas" class="pattern-svg-overlay">
            <defs>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker id="arrow-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15" />
                </marker>
            </defs>
        </svg>
        <div id="pattern-cards-stack" class="space-y-5 relative z-10">
            ${upcomingHtml}
            ${drawCards.map(d => renderSingleDrawCardHtml(d)).join('')}
        </div>
    `;

    // Cài đặt ResizeObserver để tự vẽ lại SVG khi kích thước container thay đổi
    if (SVG_RESIZE_OBSERVER) SVG_RESIZE_OBSERVER.disconnect();
    SVG_RESIZE_OBSERVER = new ResizeObserver(() => {
        if (CURRENT_GRAPH_DATA) {
            drawSvgOverlay(CURRENT_GRAPH_DATA.graph);
        }
    });
    SVG_RESIZE_OBSERVER.observe(container);
}

// Sinh HTML cho 1 kỳ quay: Cột Trái là Bảng Giải, Cột Phải là Đầu Lô Tô (Như hình minh họa)
function renderSingleDrawCardHtml(card) {
    const prizes = card.prizes;
    const dt = card.drawDate;
    const incoming = card.incoming || {};
    const outgoing = card.outgoing || {};

    // Helper render row giải
    function renderPrizeRow(label, items) {
        if (!items || items.length === 0) return '';
        return `
            <div class="prize-row-grid">
                <div class="prize-label-col">${label}</div>
                <div class="prize-digits-col">
                    ${items.map(sub => `
                        <div class="prize-sub-group">
                            ${sub.digits.map(d => {
                                const cls = d.isSourceA ? 'source-highlight-a' : d.isSourceB ? 'source-highlight-b' : '';
                                const tagTitle = d.isSourceA ? `Vị trí A [${outgoing.labelA}] = ${d.char}` : d.isSourceB ? `Vị trí B [${outgoing.labelB}] = ${d.char}` : `Vị trí #${d.globalIndex}`;
                                return `<span id="${d.domId}" class="pattern-digit-cell ${cls}" title="${tagTitle}">${d.char}</span>`;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Cột Phải: Bảng Lô Tô Đầu (0..9)
    const lotoHeadsHtml = card.lotoHeads.map(h => {
        const numsHtml = h.numbers.length > 0
            ? h.numbers.map(n => `<span id="${n.domId}" class="pattern-loto-cell ${n.isHit ? 'hit-highlight' : ''}">${n.number}</span>`).join('')
            : '<span class="text-neutral-600 text-xs italic">--</span>';
        return `
            <div class="flex items-center text-xs border-b border-neutral-800 py-1">
                <div class="w-7 font-black font-mono text-center text-yellow-400 bg-neutral-900 rounded border border-neutral-800 mr-2 flex-shrink-0">${h.head}</div>
                <div class="flex flex-wrap gap-1 flex-1">${numsHtml}</div>
            </div>
        `;
    }).join('');

    // Badge 1: Đối chiếu kết quả từ kỳ trước báo sang (Nhận cầu)
    let incomingHtml = '';
    if (incoming.hasIncoming) {
        if (incoming.isHit) {
            incomingHtml = `
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/70 shadow-sm">
                    <span class="text-xs text-neutral-300">Từ kỳ ${incoming.prevDateDisplay}:</span>
                    <span class="px-2 py-0.5 rounded text-xs font-black bg-emerald-600 text-white animate-pulse">
                        <i class="fa-solid fa-check mr-1"></i>ĂN LÔ [${incoming.matchedNumbers.join(', ')}]
                    </span>
                </div>
            `;
        } else {
            incomingHtml = `
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                    <span class="text-xs">Từ kỳ ${incoming.prevDateDisplay}:</span>
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-neutral-800 text-neutral-400">
                        <i class="fa-solid fa-xmark mr-1"></i>TRƯỢT [${incoming.predictedByPrev.join(', ')}]
                    </span>
                </div>
            `;
        }
    } else {
        incomingHtml = `
            <div class="px-2.5 py-1 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-500 italic">
                Kỳ gốc bắt đầu chuỗi phân tích
            </div>
        `;
    }

    // Badge 2: Cầu báo kỳ này cho kỳ kế tiếp (Phát cầu)
    let outgoingHtml = '';
    if (outgoing.predictedNumbers && outgoing.predictedNumbers.length > 0) {
        const predStr = outgoing.predictedNumbers.join(' - ');
        outgoingHtml = `
            <div class="flex items-center flex-wrap gap-2 px-3 py-1 rounded-xl bg-black/80 border border-red-500/40">
                <span class="text-xs font-bold text-red-300 flex items-center gap-1">
                    <i class="fa-solid fa-arrow-turn-up text-red-400"></i> Cầu báo cho ${outgoing.targetDateDisplay}:
                </span>
                <span class="font-mono font-black text-yellow-300 text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-yellow-500/60 shadow">
                    [${predStr}]
                </span>
                ${outgoing.formulaExplain ? `
                    <span class="text-[11px] text-amber-200/80 font-mono hidden md:inline">
                        (${outgoing.formulaExplain})
                    </span>
                ` : ''}
            </div>
        `;
    }

    return `
        <div class="pattern-draw-card p-4 border border-neutral-800 bg-[#090e1a]/95 rounded-2xl relative shadow-xl">
            <!-- Header Ngày & Dự đoán 2 chiều minh bạch (Kết quả từ hôm trước vs Cầu báo hôm nay) -->
            <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-neutral-800 pb-3 mb-3 gap-3">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span class="font-black text-sm text-white">${card.dayOfWeek} Ngày ${card.dateDisplay}</span>
                    <span class="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">${dt}</span>
                </div>

                <div class="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
                    ${incomingHtml}
                    ${outgoingHtml}
                </div>
            </div>

            <!-- Khối Hai Cột: Trái Bảng Giải, Phải Đầu Lô Tô -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <!-- CỘT TRÁI: Bảng Kết Quả Xổ Số -->
                <div class="lg:col-span-8 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 space-y-0.5">
                    ${renderPrizeRow('Đặc biệt', prizes.special_prize)}
                    ${renderPrizeRow('Giải Nhất', prizes.prize_1)}
                    ${renderPrizeRow('Giải Nhì', prizes.prize_2)}
                    ${renderPrizeRow('Giải Ba', prizes.prize_3)}
                    ${renderPrizeRow('Giải Tư', prizes.prize_4)}
                    ${renderPrizeRow('Giải Năm', prizes.prize_5)}
                    ${renderPrizeRow('Giải Sáu', prizes.prize_6)}
                    ${renderPrizeRow('Giải Bảy', prizes.prize_7)}
                </div>

                <!-- CỘT PHẢI: Bảng Đầu Lô Tô (0..9) -->
                <div class="lg:col-span-4 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                    <div class="text-[11px] font-black text-neutral-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                        <span>ĐẦU</span>
                        <span>LÔ TÔ 2 SỐ</span>
                    </div>
                    <div class="space-y-0.5">
                        ${lotoHeadsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Vẽ lớp SVG Overlay (Nối điểm Source A -> B và nối cầu sang Target ngày kế tiếp)
function drawSvgOverlay(graph) {
    const svg = document.getElementById('pattern-svg-canvas');
    const container = document.getElementById('pattern-draws-container');
    if (!svg || !container || !graph) return;

    const containerRect = container.getBoundingClientRect();
    const w = containerRect.width || container.clientWidth || 800;
    const h = containerRect.height || container.clientHeight || 1200;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';

    // Giữ lại thẻ defs
    const defs = svg.querySelector('defs')?.outerHTML || '';
    let svgContent = defs;

    // Helper lấy tọa độ tâm của một element DOM theo ID
    function getCenter(elId) {
        const el = document.getElementById(elId);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return null;
        return {
            x: (rect.left + rect.right) / 2 - containerRect.left,
            y: (rect.top + rect.bottom) / 2 - containerRect.top,
            radius: Math.max(rect.width, rect.height) / 2
        };
    }

    // 1. Vẽ các vòng tròn khoanh quanh Node Source và Target Trúng
    const showHighlightLayer = document.getElementById('chk-layer-highlight')?.checked ?? true;
    if (showHighlightLayer && graph.nodes) {
        graph.nodes.forEach(n => {
            // Không khoanh tròn hộp dự đoán lớn của ngày kế tiếp
            if (n.skipCircle || n.role === 'upcoming_box' || n.role === 'upcoming_target') {
                return;
            }
            const pt = getCenter(n.id);
            if (pt) {
                const strokeColor = n.role === 'source_a' ? '#ef4444' : n.role === 'source_b' ? '#f97316' : '#ef4444';
                svgContent += `
                    <circle cx="${pt.x}" cy="${pt.y}" r="${pt.radius + 3}" class="svg-node-ring" stroke="${strokeColor}" />
                `;
            }
        });
    }

    // 2. Vẽ các đường cạnh Edges (Hỗ trợ hiệu ứng dòng điện Neon chạy)
    const showBridgesLayer = document.getElementById('chk-layer-bridges')?.checked ?? true;
    const showElectricFlow = document.getElementById('chk-layer-electric')?.checked ?? true;

    if (showBridgesLayer && graph.edges) {
        graph.edges.forEach(e => {
            const p1 = getCenter(e.from);
            const p2 = getCenter(e.to);
            if (!p1 || !p2) return;

            if (e.type === 'source_pair') {
                // Đường nối ngang giữa 2 source trên cùng kỳ
                svgContent += `
                    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="svg-bridge-line halo-red" />
                    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="svg-bridge-line dashed" />
                `;
                if (showElectricFlow) {
                    svgContent += `
                        <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="svg-bridge-line electric-pulse-beam red" />
                    `;
                }
            } else if (e.type === 'bridge_hit') {
                // Đường nối từ kỳ dưới (p1) LÊN kỳ trên (p2)
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y; // dy < 0 vì p2 ở bên trên p1

                // Bézier hướng lên mượt mà
                const cx1 = p1.x + dx * 0.15;
                const cy1 = p1.y + dy * 0.45;
                const cx2 = p2.x - dx * 0.15;
                const cy2 = p2.y - dy * 0.45;
                const pathD = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

                svgContent += `
                    <path d="${pathD}" class="svg-bridge-line halo-green" />
                    <path d="${pathD}" class="svg-bridge-line hit" marker-end="url(#arrow-green)" />
                `;
                if (showElectricFlow) {
                    svgContent += `
                        <path d="${pathD}" class="svg-bridge-line electric-pulse-beam green" />
                    `;
                }
            } else if (e.type === 'bridge_upcoming') {
                // Đường cong vút chỉ thẳng lên hộp dự đoán của kỳ mở thưởng tiếp theo (màu vàng kim VIP)
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y; // dy < 0

                const cx1 = p1.x + dx * 0.15;
                const cy1 = p1.y + dy * 0.45;
                const cx2 = p2.x - dx * 0.15;
                const cy2 = p2.y - dy * 0.45;
                const pathD = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;

                svgContent += `
                    <path d="${pathD}" class="svg-bridge-line halo-gold" />
                    <path d="${pathD}" class="svg-bridge-line upcoming" stroke-dasharray="6, 4" marker-end="url(#arrow-gold)" />
                `;
                if (showElectricFlow) {
                    svgContent += `
                        <path d="${pathD}" class="svg-bridge-line electric-pulse-beam gold" />
                    `;
                }
            }
        });
    }

    svg.innerHTML = svgContent;
}

// Vẽ lại SVG khi resize hoặc toggle layer
function redrawCurrentSvg() {
    if (CURRENT_GRAPH_DATA && CURRENT_GRAPH_DATA.graph) {
        drawSvgOverlay(CURRENT_GRAPH_DATA.graph);
    }
}

// Thay đổi số lượng kỳ hiển thị trên bản đồ (3, 5, 8, 12 kỳ)
function changeDisplayDraws(drawsCount) {
    CURRENT_DISPLAY_DRAWS = parseInt(drawsCount, 10) || 8;
    console.log('[Pattern Visualizer] Changing display draws count to:', CURRENT_DISPLAY_DRAWS);
    if (CURRENT_ACTIVE_PATTERN) {
        selectPatternForVisualization(CURRENT_ACTIVE_PATTERN, false, CURRENT_ACTIVE_PATTERN.anchorDate);
    }
}

// Phóng to / Thu nhỏ bản đồ đường cầu
function zoomPatternMap(delta) {
    let newZoom = Math.round((CURRENT_ZOOM_LEVEL + delta) * 10) / 10;
    if (newZoom < 0.6) newZoom = 0.6;
    if (newZoom > 1.6) newZoom = 1.6;
    CURRENT_ZOOM_LEVEL = newZoom;

    const indicator = document.getElementById('pattern-zoom-indicator');
    if (indicator) {
        indicator.innerText = `${Math.round(CURRENT_ZOOM_LEVEL * 100)}%`;
    }

    const container = document.getElementById('pattern-draws-container');
    if (container) {
        container.style.zoom = CURRENT_ZOOM_LEVEL;
    }

    // Đợi layout resize ổn định rồi vẽ lại SVG overlay khớp từng tọa độ
    setTimeout(() => {
        redrawCurrentSvg();
    }, 60);
}

// Khôi phục tỉ lệ ban đầu 100%
function resetPatternZoom() {
    CURRENT_ZOOM_LEVEL = 1.0;
    const indicator = document.getElementById('pattern-zoom-indicator');
    if (indicator) indicator.innerText = '100%';
    const container = document.getElementById('pattern-draws-container');
    if (container) container.style.zoom = 1.0;
    setTimeout(() => {
        redrawCurrentSvg();
    }, 60);
}

// Xem toàn màn hình (Fullscreen)
function togglePatternFullscreen() {
    const section = document.getElementById('pattern-visualization-section');
    if (!section) return;

    if (!document.fullscreenElement) {
        section.requestFullscreen().then(() => {
            setTimeout(redrawCurrentSvg, 150);
        }).catch(err => {
            console.warn('[Pattern Visualizer] Không thể kích hoạt Fullscreen:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            setTimeout(redrawCurrentSvg, 150);
        }).catch(err => {
            console.warn('[Pattern Visualizer] Không thể thoát Fullscreen:', err);
        });
    }
}

// Mở Drawer chi tiết Pattern bên phải (Section XII & VIII)
function openPatternDetailDrawer(pattern) {
    if (!pattern) return;
    const drawer = document.getElementById('pattern-detail-drawer');
    if (!drawer) return;

    setElText('drawer-pattern-id', pattern.patternId);
    setElText('drawer-pattern-name', pattern.name);
    setElText('drawer-pattern-formula', pattern.formula);
    setElText('drawer-pattern-occ', pattern.occurrences);
    setElText('drawer-pattern-hits', pattern.hits);
    setElText('drawer-pattern-misses', pattern.misses);
    setElText('drawer-pattern-hitrate', `${(pattern.metrics.rawHitRate * 100).toFixed(1)}%`);
    setElText('drawer-pattern-conf', `${(pattern.metrics.confidenceScore * 100).toFixed(1)}%`);
    setElText('drawer-pattern-lift', `${pattern.metrics.lift}x`);
    setElText('drawer-pattern-streak', `${pattern.currentStreak} kỳ`);
    setElText('drawer-pattern-maxstreak', `${pattern.maxHitStreak} kỳ`);
    setElText('drawer-pattern-nextpred', pattern.nextPrediction?.join(' - ') || '--');

    // Lịch sử gần đây (Sắp xếp theo thứ tự ngày mới nhất lên đầu)
    const historyList = document.getElementById('drawer-history-list');
    if (historyList && pattern.recentHistory) {
        // Đảm bảo luôn sắp xếp ngày mới nhất lên trên cùng
        const sortedHistory = [...pattern.recentHistory].sort((a, b) => {
            const dateA = a.targetDate || a.sourceDate || '';
            const dateB = b.targetDate || b.sourceDate || '';
            return dateB.localeCompare(dateA);
        });

        historyList.innerHTML = sortedHistory.map((h, idx) => {
            const st = h.hit
                ? `<span class="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"><i class="fa-solid fa-check mr-1"></i>TRÚNG (${h.matchedNumbers.join(', ')})</span>`
                : `<span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700"><i class="fa-solid fa-xmark mr-1"></i>TRƯỢT</span>`;

            const isLatest = idx === 0;
            return `
                <div class="p-3 rounded-xl ${isLatest ? 'bg-neutral-900 border-2 border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-neutral-900/90 border border-neutral-800'} flex justify-between items-center text-xs transition hover:border-neutral-700">
                    <div>
                        <div class="font-bold text-white flex items-center gap-2 mb-0.5">
                            <span>${h.sourceDateDisplay} ➔ ${h.targetDateDisplay}</span>
                            ${isLatest ? '<span class="px-1.5 py-0.5 text-[9px] font-black bg-yellow-500 text-black rounded font-mono uppercase tracking-wider">Mới nhất</span>' : ''}
                        </div>
                        <div class="text-[11px] text-neutral-400 font-mono">Dự đoán: <b class="text-yellow-300 font-bold">[${h.predictedNumbers.join(', ')}]</b></div>
                    </div>
                    <div>${st}</div>
                </div>
            `;
        }).join('');
    }

    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');
}

function closePatternDetailDrawer() {
    const drawer = document.getElementById('pattern-detail-drawer');
    if (drawer) {
        drawer.classList.remove('drawer-open');
        drawer.classList.add('drawer-closed');
    }
}

// XUẤT ẢNH ĐƯỜNG CẦU (Section XIX)
async function exportPatternInfographicImage() {
    const exportWrapper = document.getElementById('pattern-export-wrapper');
    const exportBtn = document.getElementById('btn-export-pattern-img');
    if (!exportWrapper) return;

    if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang kết xuất ảnh...`;
    }

    try {
        if (typeof html2canvas === 'undefined') {
            alert('Thư viện tạo ảnh html2canvas đang tải, vui lòng thử lại sau giây lát.');
            return;
        }

        // Đảm bảo SVG hiển thị đầy đủ
        redrawCurrentSvg();

        const canvas = await html2canvas(exportWrapper, {
            scale: 2, // Đảm bảo độ nét cao 2x Retina
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#030712',
            logging: false
        });

        const link = document.createElement('a');
        const patId = CURRENT_ACTIVE_PATTERN?.patternId || 'duong_cau';
        link.download = `duong_cau_${patId}_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('[Pattern Visualizer] Lỗi khi xuất ảnh đường cầu:', err);
        alert('Không thể tạo file ảnh: ' + err.message);
    } finally {
        if (exportBtn) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = `<i class="fa-solid fa-image mr-1 text-cyan-400"></i> Xuất Ảnh Đường Cầu (PNG)`;
        }
    }
}

// =========================================================================
// MODULE TRA CỨU CẦU ĂN THÔNG THEO NGÀY & ĐỐI CHIẾU KẾT QUẢ KỲ KẾ TIẾP
// =========================================================================

// Nạp danh sách cầu ăn thông theo ngày
async function loadStreakBridges(dateVal = 'yesterday', streakVal = 4, exactVal = true) {
    const loadingEl = document.getElementById('streak-loading-indicator');
    const resultsWrapper = document.getElementById('streak-results-wrapper');
    const searchBtn = document.getElementById('btn-fetch-streak-bridges');
    const targetType = document.getElementById('streak-target-type')?.value || 'loto_2digit';

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultsWrapper) resultsWrapper.classList.add('opacity-40');
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang Tra Cứu...`;
    }

    try {
        const url = `/api/patterns/streak-bridges?date=${encodeURIComponent(dateVal)}&streak=${streakVal}&exact=${exactVal}&target_type=${targetType}&op=CONCAT_PAIR&limit=300`;
        console.log('[Streak Explorer] Fetching:', url);
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'SUCCESS') {
            CURRENT_STREAK_RESPONSE = data;

            // 1. Cập nhật dropdown ngày nếu có
            populateStreakDatesDropdown(data.availableDates, data.queryDate);

            // 2. Cập nhật nút chọn nhanh Hôm qua / Mới nhất
            updateQuickDateButtons(data.queryDate, data.availableDates);

            // 3. Cập nhật các thẻ KPI tổng quan
            renderStreakKpis(data);

            // 4. Render danh sách bảng
            renderStreakTable();
        } else {
            alert(data.message || 'Lỗi khi tra cứu cầu thông.');
        }
    } catch (err) {
        console.error('[Streak Explorer] Lỗi gọi API streak bridges:', err);
    } finally {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (resultsWrapper) resultsWrapper.classList.remove('opacity-40');
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass-chart mr-1 text-yellow-300"></i> TRA CỨU CẦU THÔNG`;
        }
    }
}

// Điền danh sách ngày vào dropdown
function populateStreakDatesDropdown(datesList, selectedDate) {
    const sel = document.getElementById('streak-date-select');
    if (!sel || !datesList) return;

    sel.innerHTML = datesList.map(d => {
        let tag = '';
        if (d.isLatest) tag = ' (Kỳ mới nhất)';
        else if (d.isYesterday) tag = ' (Hôm qua)';
        const isSelected = (d.drawDate === selectedDate) ? 'selected' : '';
        return `<option value="${d.drawDate}" ${isSelected}>${d.dayOfWeek}, ${d.dateDisplay}${tag}</option>`;
    }).join('');
}

// Đổi màu active cho nút Hôm qua / Mới nhất
function updateQuickDateButtons(currentDate, datesList) {
    const btnYest = document.getElementById('btn-quick-yesterday');
    const btnLatest = document.getElementById('btn-quick-latest');
    if (!datesList || datesList.length === 0) return;

    const latestObj = datesList.find(d => d.isLatest);
    const yesterdayObj = datesList.find(d => d.isYesterday);

    if (btnYest) {
        if (yesterdayObj && yesterdayObj.drawDate === currentDate) {
            btnYest.className = 'px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white transition hover:bg-red-500 cursor-pointer shadow-sm';
        } else {
            btnYest.className = 'px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-300 transition hover:bg-neutral-700 hover:text-white cursor-pointer';
        }
    }

    if (btnLatest) {
        if (latestObj && latestObj.drawDate === currentDate) {
            btnLatest.className = 'px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white transition hover:bg-red-500 cursor-pointer shadow-sm';
        } else {
            btnLatest.className = 'px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-300 transition hover:bg-neutral-700 hover:text-white cursor-pointer';
        }
    }
}

// Khi người dùng bấm nút nhanh Hôm qua hoặc Kỳ mới nhất
function quickSelectStreakDate(type) {
    const streakVal = parseInt(document.getElementById('streak-length-select')?.value || '4', 10);
    const exactVal = document.getElementById('streak-exact-select')?.value === 'true';
    loadStreakBridges(type, streakVal, exactVal);
}

// Khi đổi ngày từ select dropdown
function onStreakDateSelectChange() {
    const sel = document.getElementById('streak-date-select');
    if (!sel) return;
    const dateVal = sel.value;
    const streakVal = parseInt(document.getElementById('streak-length-select')?.value || '4', 10);
    const exactVal = document.getElementById('streak-exact-select')?.value === 'true';
    loadStreakBridges(dateVal, streakVal, exactVal);
}

// Kích hoạt tìm kiếm thủ công
function triggerStreakSearch() {
    const dateVal = document.getElementById('streak-date-select')?.value || 'yesterday';
    const streakVal = parseInt(document.getElementById('streak-length-select')?.value || '4', 10);
    const exactVal = document.getElementById('streak-exact-select')?.value === 'true';
    loadStreakBridges(dateVal, streakVal, exactVal);
}

// Cập nhật các chỉ số KPI
function renderStreakKpis(data) {
    setElText('streak-total-count', data.totalBridges?.toLocaleString() || '0');
    setElText('streak-count-desc', `${data.exactStreak ? 'đúng' : 'từ'} ${data.streak} ngày thông`);
    setElText('streak-selected-badge', `Ngày soi: ${data.queryDayOfWeek} ${data.queryDateDisplay}`);

    const iconBox = document.getElementById('streak-outcome-icon');

    if (data.isTargetPending) {
        setElText('streak-win-rate', 'Chờ Xổ');
        setElText('streak-win-detail', 'Chưa có kết quả');
        setElText('streak-target-badge', `Mở thưởng 18h15: ${data.targetDayOfWeek} ${data.targetDateDisplay}`);
        if (iconBox) {
            iconBox.className = 'w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 text-xl font-black flex-shrink-0 animate-pulse';
            iconBox.innerHTML = '<i class="fa-solid fa-clock"></i>';
        }
    } else {
        setElText('streak-win-rate', `${data.winRate}%`);
        setElText('streak-win-detail', `${data.winCount} thắng / ${data.loseCount} gãy`);
        setElText('streak-target-badge', `Kỳ đối chiếu: ${data.targetDayOfWeek} ${data.targetDateDisplay}`);
        if (iconBox) {
            if (data.winRate >= 30) {
                iconBox.className = 'w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xl font-black flex-shrink-0';
                iconBox.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            } else {
                iconBox.className = 'w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 text-xl font-black flex-shrink-0';
                iconBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            }
        }
    }

    // Top các con số nổ
    const topNumContainer = document.getElementById('streak-top-numbers');
    if (topNumContainer) {
        if (!data.topNumbers || data.topNumbers.length === 0) {
            topNumContainer.innerHTML = `<span class="text-xs text-neutral-500 italic">Không có số nào</span>`;
        } else {
            topNumContainer.innerHTML = data.topNumbers.slice(0, 6).map(n => {
                const isHitCls = n.isHit
                    ? 'bg-emerald-600 text-white font-black shadow-[0_0_10px_rgba(16,185,129,0.5)] border-emerald-400'
                    : 'bg-neutral-800 text-neutral-300 font-bold border-neutral-700';
                return `
                    <span class="px-2 py-0.5 rounded-lg text-xs font-mono border ${isHitCls} flex items-center gap-1" title="${n.bridgesCount} cầu báo, ${n.hitBridgesCount} cầu nổ">
                        ${n.number} <span class="text-[10px] opacity-80">(${n.bridgesCount}c${n.hitBridgesCount > 0 ? `•${n.hitBridgesCount}n` : ''})</span>
                    </span>
                `;
            }).join('');
        }
    }

    // Cập nhật số lượng trên các nút lọc
    setElText('count-filter-all', data.totalBridges || 0);
    setElText('count-filter-win', data.winCount || 0);
    setElText('count-filter-lose', data.loseCount || 0);
}

// Chuyển tab lọc kết quả: all, win, lose
function setStreakStatusFilter(status) {
    CURRENT_STREAK_FILTER = status;
    ['all', 'win', 'lose'].forEach(st => {
        const btn = document.getElementById(`btn-streak-filter-${st}`);
        if (btn) {
            if (st === status) {
                btn.className = 'px-3 py-1 rounded-lg text-xs font-black bg-neutral-800 text-white border border-neutral-700 transition cursor-pointer';
            } else {
                let textCol = 'text-neutral-400 hover:text-white';
                if (st === 'win') textCol = 'text-emerald-400 hover:bg-emerald-950/40';
                if (st === 'lose') textCol = 'text-red-400 hover:bg-red-950/40';
                btn.className = `px-3 py-1 rounded-lg text-xs font-bold ${textCol} border border-transparent transition cursor-pointer`;
            }
        }
    });
    renderStreakTable();
}

function filterStreakTableRows() {
    renderStreakTable();
}

function getFilteredStreakBridges() {
    if (!CURRENT_STREAK_RESPONSE || !CURRENT_STREAK_RESPONSE.bridges) return [];
    const searchVal = document.getElementById('streak-search-input')?.value.toLowerCase().trim() || '';
    return CURRENT_STREAK_RESPONSE.bridges.filter(b => {
        if (CURRENT_STREAK_FILTER === 'win' && b.isHit !== true) return false;
        if (CURRENT_STREAK_FILTER === 'lose' && b.isHit !== false) return false;
        if (searchVal) {
            const matchPred = b.predictedNumbers.some(p => p.includes(searchVal));
            const matchA = b.labelA.toLowerCase().includes(searchVal) || b.displayPrizeA.toLowerCase().includes(searchVal);
            const matchB = b.labelB.toLowerCase().includes(searchVal) || b.displayPrizeB.toLowerCase().includes(searchVal);
            if (!matchPred && !matchA && !matchB) return false;
        }
        return true;
    });
}

// Hiển thị bảng chi tiết các cầu thông
function renderStreakTable() {
    const tbody = document.getElementById('streak-table-body');
    if (!tbody || !CURRENT_STREAK_RESPONSE) return;

    const data = CURRENT_STREAK_RESPONSE;
    const list = getFilteredStreakBridges();

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-neutral-400 italic">Không có cầu nào thỏa mãn điều kiện lọc.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((b, idx) => {
        // Cột kết quả
        let outcomeBadge = '';
        if (b.isHit === true) {
            const locInfo = b.hitLocations && b.hitLocations.length > 0
                ? b.hitLocations.map(l => l.prize).slice(0, 2).join(', ')
                : '';
            outcomeBadge = `
                <div class="flex flex-col items-center">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                        <i class="fa-solid fa-check"></i> ĂN LÔ [${b.matchedNumbers.join(', ')}] (${b.hitCount} nháy)
                    </span>
                    ${locInfo ? `<span class="text-[10px] text-emerald-300/80 mt-0.5">${locInfo}</span>` : ''}
                </div>
            `;
        } else if (b.isHit === false) {
            outcomeBadge = `
                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/70 text-red-400 border border-red-800/60 inline-flex items-center gap-1">
                    <i class="fa-solid fa-xmark"></i> GÃY CẦU (Trượt)
                </span>
            `;
        } else {
            outcomeBadge = `
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-950/80 text-yellow-300 border border-yellow-700/60 inline-flex items-center gap-1">
                    <i class="fa-solid fa-clock animate-pulse"></i> Chờ mở thưởng
                </span>
            `;
        }

        return `
            <tr class="hover:bg-neutral-800/40 transition border-b border-neutral-800/60">
                <td class="p-3 font-mono font-bold text-center text-neutral-500 text-xs">#${idx + 1}</td>
                <td class="p-3">
                    <div class="font-bold text-white text-xs mb-0.5">
                        <span class="text-red-400">${b.displayPrizeA}</span> [${b.labelA}]
                        <span class="text-neutral-500 mx-1">ghép</span>
                        <span class="text-amber-400">${b.displayPrizeB}</span> [${b.labelB}]
                    </div>
                    <div class="text-[10px] text-neutral-500 font-mono">Vị trí #${b.posA} & #${b.posB}</div>
                </td>
                <td class="p-3 text-center font-mono font-black text-xs text-cyan-300">
                    <span class="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded">
                        ${b.digits[0]} &amp; ${b.digits[1]}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <span class="px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/50 text-yellow-300 font-black font-mono text-sm tracking-wider">
                        ${b.predictionDisplay}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600/90 text-white font-mono shadow-sm">
                        Ăn ${b.streak} ngày
                    </span>
                </td>
                <td class="p-3 text-center">
                    ${outcomeBadge}
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="openStreakDetailModalByIndex(${idx})"
                                class="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-xs transition border border-neutral-700 flex items-center gap-1 shadow cursor-pointer active:scale-95"
                                title="Xem chi tiết kết quả trúng hay xịt của cầu này">
                            <i class="fa-solid fa-circle-info text-cyan-400"></i> Chi Tiết
                        </button>
                        <button onclick="visualizeStreakBridgeByIndex(${idx})"
                                class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs transition shadow flex items-center justify-center gap-1 cursor-pointer border border-red-400/50 active:scale-95"
                                title="Vẽ sơ đồ cầu SVG này tại ngày soi">
                            <i class="fa-solid fa-bezier-curve"></i> Vẽ Cầu
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Bấm Vẽ Cầu từ bảng Streak Explorer theo index
function visualizeStreakBridgeByIndex(idx) {
    const list = getFilteredStreakBridges();
    const b = list[idx];
    if (!b || !CURRENT_STREAK_RESPONSE) return;
    const data = CURRENT_STREAK_RESPONSE;
    visualizeStreakBridge(b.posA, b.posB, b.operation, data.targetType, data.queryDate, b.labelA, b.labelB, b.displayPrizeA, b.displayPrizeB, b.predictedNumbers, b.streak);
}

// Bấm Vẽ Cầu từ bảng Streak Explorer
function visualizeStreakBridge(posA, posB, op, targetType, anchorDate, labelA, labelB, dispA, dispB, predStrs, streak) {
    const patternObj = {
        patternId: `P_${op}_${posA}_${posB}`,
        name: `Cầu ${dispA} [${labelA}] ghép ${dispB} [${labelB}]`,
        formula: `${labelA} & ${labelB} (${op})`,
        nextPrediction: predStrs,
        currentStreak: streak,
        lastSeenDaysAgo: 0,
        sources: [{ globalIndex: posA }, { globalIndex: posB }],
        operation: op,
        target: { type: targetType, dayOffset: 1 }
    };
    selectPatternForVisualization(patternObj, true, anchorDate);
}

// =========================================================================
// MODAL CHI TIẾT CẦU ĂN THÔNG & ĐỐI CHIẾU KẾT QUẢ TRÚNG HAY XỊT
// =========================================================================

let CURRENT_MODAL_BRIDGE = null;

function openStreakDetailModalByIndex(idx) {
    const list = getFilteredStreakBridges();
    const b = list[idx];
    if (!b || !CURRENT_STREAK_RESPONSE) return;
    openStreakDetailModal(b);
}

function openStreakDetailModal(b) {
    CURRENT_MODAL_BRIDGE = b;
    const data = CURRENT_STREAK_RESPONSE;
    const modal = document.getElementById('streak-detail-modal');
    if (!modal) return;

    setElText('streak-modal-badge', b.patternId);
    setElText('streak-modal-streak-badge', `Ăn thông ${b.streak} ngày liên tiếp`);
    setElText('streak-modal-title', `Cầu ${b.displayPrizeA} [${b.labelA}] ghép ${b.displayPrizeB} [${b.labelB}]`);
    setElText('streak-modal-formula', `Vị trí #${b.posA} & #${b.posB} • Phép ghép ${b.operation}`);

    // Banner Kết Quả Kỳ Đối Chiếu: Trúng hay Xịt
    const bannerEl = document.getElementById('streak-modal-outcome-banner');
    if (bannerEl) {
        if (b.isHit === true) {
            const locDetails = (b.hitLocations && b.hitLocations.length > 0)
                ? b.hitLocations.map(l => `<span class="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/50 text-white font-mono font-bold text-[11px]">${l.prize}: <b class="text-yellow-300">${l.value}</b> (đuôi ${l.hitNumber})</span>`).join(' ')
                : '';
            bannerEl.className = 'p-4 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950/90 via-neutral-900 to-emerald-950/90 shadow-[0_0_25px_rgba(16,185,129,0.3)] space-y-2';
            bannerEl.innerHTML = `
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <span class="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-base"></i> KẾT QUẢ ĐỐI CHIẾU KỲ ${data.targetDateDisplay} (${data.targetDayOfWeek})
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white animate-pulse shadow">
                        TRÚNG ${b.hitCount} NHÁY
                    </span>
                </div>
                <div class="text-xl font-black text-white">
                    🎉 KẾT QUẢ: <span class="text-emerald-400">TRÚNG</span> (ĂN LÔ <span class="text-yellow-300 font-mono">[${b.matchedNumbers.join(', ')}]</span>)
                </div>
                <p class="text-xs text-neutral-300">
                    Cầu lấy 2 chữ số <b class="text-yellow-400 font-mono">[${b.digits.join(' & ')}]</b> từ ngày <b class="text-white">${data.queryDateDisplay}</b> báo cặp số <b class="text-yellow-300 font-mono">[${b.predictionDisplay}]</b> đã nổ chính xác trên bảng kết quả ngày <b class="text-white">${data.targetDateDisplay}</b>! Cầu tiếp tục ăn thông sang ngày thứ <b>${b.streak + 1}</b>!
                </p>
                ${locDetails ? `
                    <div class="pt-2 border-t border-emerald-500/30 flex flex-wrap items-center gap-1.5">
                        <span class="text-[11px] text-emerald-300 font-bold">Vị trí nổ giải:</span>
                        ${locDetails}
                    </div>
                ` : ''}
            `;
        } else if (b.isHit === false) {
            bannerEl.className = 'p-4 rounded-2xl border-2 border-red-500/80 bg-gradient-to-r from-red-950/90 via-neutral-900 to-red-950/90 shadow-[0_0_25px_rgba(239,68,68,0.3)] space-y-2';
            bannerEl.innerHTML = `
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <span class="text-xs font-black uppercase text-red-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-xmark text-base"></i> KẾT QUẢ ĐỐI CHIẾU KỲ ${data.targetDateDisplay} (${data.targetDayOfWeek})
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow">
                        GÃY CẦU (XỊT)
                    </span>
                </div>
                <div class="text-xl font-black text-white">
                    ❌ KẾT QUẢ: <span class="text-red-400">XỊT</span> (Cặp số <span class="text-yellow-300 font-mono">[${b.predictionDisplay}]</span> không về)
                </div>
                <p class="text-xs text-neutral-300">
                    Cầu lấy 2 chữ số <b class="text-yellow-400 font-mono">[${b.digits.join(' & ')}]</b> từ kỳ <b class="text-white">${data.queryDateDisplay}</b> dự đoán cặp số <b class="text-yellow-300 font-mono">[${b.predictionDisplay}]</b>. Cả 2 con số đều không xuất hiện trong 27 giải mở thưởng ngày <b class="text-white">${data.targetDateDisplay}</b>. Chuỗi ăn thông dừng lại ở <b>${b.streak} ngày</b> liên tiếp.
                </p>
            `;
        } else {
            bannerEl.className = 'p-4 rounded-2xl border-2 border-yellow-500/80 bg-gradient-to-r from-yellow-950/90 via-neutral-900 to-amber-950/90 shadow-[0_0_25px_rgba(234,179,8,0.3)] space-y-2';
            bannerEl.innerHTML = `
                <div class="flex items-center justify-between flex-wrap gap-2">
                    <span class="text-xs font-black uppercase text-yellow-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-clock text-base animate-pulse"></i> ĐANG CHỜ MỞ THƯỞNG 18H15 HÔM NAY (${data.targetDateDisplay})
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-500 text-black">
                        CHỜ KẾT QUẢ
                    </span>
                </div>
                <div class="text-xl font-black text-white">
                    🎯 CẶP SỐ BÁO VIP: <span class="text-yellow-300 font-mono text-2xl">[${b.predictionDisplay}]</span>
                </div>
                <p class="text-xs text-neutral-300">
                    Đường cầu đã ăn thông liên tiếp <b class="text-emerald-400">${b.streak} ngày</b> tính đến kỳ <b class="text-white">${data.queryDateDisplay}</b>. Hôm nay báo cặp song thủ <b class="text-yellow-300 font-mono">[${b.predictionDisplay}]</b> cho kỳ mở thưởng ngày <b class="text-white">${data.targetDateDisplay}</b>.
                </p>
            `;
        }
    }

    // Lịch sử chuỗi ăn thông từng ngày
    const historyListEl = document.getElementById('streak-modal-history-list');
    if (historyListEl) {
        const hist = b.streakHistory || [];
        if (hist.length === 0) {
            historyListEl.innerHTML = `<div class="p-4 text-center text-neutral-500 italic">Không có dữ liệu lịch sử chuỗi.</div>`;
        } else {
            // Sắp xếp ngày mới nhất lên đầu
            const sortedHist = [...hist].reverse();
            historyListEl.innerHTML = sortedHist.map(h => {
                let statusBadge = '';
                if (h.isPending) {
                    statusBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-950/80 text-yellow-300 border border-yellow-700/60 flex items-center gap-1"><i class="fa-solid fa-clock animate-pulse"></i> Chờ xổ</span>`;
                } else if (h.isHit) {
                    const locsText = h.hitLocations && h.hitLocations.length > 0
                        ? h.hitLocations.map(l => l.prize).slice(0, 2).join(', ')
                        : '';
                    statusBadge = `
                        <div class="text-right">
                            <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1 justify-end">
                                <i class="fa-solid fa-check"></i> TRÚNG [${h.matchedNumbers.join(', ')}] (${h.hitCount} nháy)
                            </span>
                            ${locsText ? `<div class="text-[10px] text-emerald-300/80 mt-0.5">${locsText}</div>` : ''}
                        </div>
                    `;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/60 flex items-center gap-1"><i class="fa-solid fa-xmark"></i> TRƯỢT (XỊT)</span>`;
                }

                const isOutcome = h.isOutcomeDay;
                const borderCls = isOutcome
                    ? (h.isHit ? 'border-2 border-emerald-500/80 bg-emerald-950/30' : h.isPending ? 'border-2 border-yellow-500/80 bg-yellow-950/30' : 'border-2 border-red-500/80 bg-red-950/30')
                    : 'border border-neutral-800 bg-neutral-900/60';

                return `
                    <div class="p-3 rounded-xl ${borderCls} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition hover:bg-neutral-800/40">
                        <div>
                            <div class="font-bold text-white flex items-center gap-2 flex-wrap mb-1">
                                <span class="font-mono text-cyan-300">${h.sourceDateDisplay} ➔ ${h.targetDateDisplay}</span>
                                ${isOutcome ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase font-mono tracking-wider shadow">KỲ ĐỐI CHIẾU</span>' : `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400 font-mono">Ăn thông</span>`}
                            </div>
                            <div class="text-[11px] text-neutral-400 flex items-center gap-3">
                                <span>Chữ số ghép: <b class="text-white font-mono font-bold">${h.digits ? h.digits.join(' & ') : '--'}</b></span>
                                <span>Báo cặp số: <b class="text-yellow-300 font-mono font-bold">[${h.predictionDisplay}]</b></span>
                            </div>
                        </div>
                        <div>
                            ${statusBadge}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    modal.classList.remove('hidden');
}

function closeStreakDetailModal() {
    const modal = document.getElementById('streak-detail-modal');
    if (modal) modal.classList.add('hidden');
}

function visualizeFromStreakModal() {
    if (!CURRENT_MODAL_BRIDGE || !CURRENT_STREAK_RESPONSE) return;
    const b = CURRENT_MODAL_BRIDGE;
    const data = CURRENT_STREAK_RESPONSE;
    closeStreakDetailModal();
    visualizeStreakBridge(b.posA, b.posB, b.operation, data.targetType, data.queryDate, b.labelA, b.labelB, b.displayPrizeA, b.displayPrizeB, b.predictedNumbers, b.streak);
}



let predictionHistoryCursor = null;
let predictionHistoryLoading = false;
let predictionHistoryFilters = {};
async function loadPredictionHistory(reset = true) {
    if (predictionHistoryLoading) return;
    const select = document.getElementById('prediction-history-date');
    const message = document.getElementById('prediction-history-message');
    const more = document.getElementById('prediction-history-more');
    if (!select) return;
    predictionHistoryLoading = true;
    more.disabled = true;
    message.textContent = 'Đang tải lịch sử…';
    try {
        const filters = reset ? {
            start: document.getElementById('prediction-history-start').value,
            end: document.getElementById('prediction-history-end').value
        } : predictionHistoryFilters;
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
        if (!reset && predictionHistoryCursor) params.set('before', predictionHistoryCursor);
        const response = await fetch('/api/patterns/history?' + params);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không tải được lịch sử.');
        if (reset) {
            select.replaceChildren(new Option('Chọn ngày đã lưu', ''));
            predictionHistoryFilters = filters;
        }
        for (const row of data.dates) select.add(new Option(formatToDayMonthYear(row.target_date), row.target_date));
        predictionHistoryCursor = data.next_before;
        more.hidden = !predictionHistoryCursor;
        message.textContent = select.options.length > 1 ? `Đã tải ${select.options.length - 1} ngày dự đoán đã lưu.` : 'Chưa có dự đoán được lưu trong khoảng ngày này.';
    } catch (error) {
        message.textContent = error.message || 'Không tải được lịch sử. Vui lòng thử lại.';
    } finally {
        predictionHistoryLoading = false;
        more.disabled = false;
    }
}
async function openPredictionHistory() {
    const select = document.getElementById('prediction-history-date');
    if (!select.value) return;
    select.disabled = true;
    try {
        await triggerAutoDiscovery(select.value, false, true);
    } finally {
        select.disabled = false;
    }
}
