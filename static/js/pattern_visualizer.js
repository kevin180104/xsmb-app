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
window.ALL_LOADED_PATTERNS = {};

// Helper cập nhật text an toàn không bao giờ throw lỗi nếu ID không tồn tại
function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = val !== undefined && val !== null ? val : '--';
    }
}

// Khởi tạo tab Auto Pattern
function initAutoPatternTab() {
    console.log('[Pattern Visualizer] initAutoPatternTab triggered');
    if (!CURRENT_SCAN_DATA) {
        triggerAutoDiscovery();
    } else {
        setTimeout(redrawCurrentSvg, 150);
    }
}

// Kích hoạt quét tự động [TỰ TÌM ĐƯỜNG CẦU]
async function triggerAutoDiscovery() {
    const rangeDays = document.getElementById('pattern-range-select')?.value || '60';
    const minOcc = document.getElementById('pattern-min-occ')?.value || '10';
    const minConf = document.getElementById('pattern-min-conf')?.value || '0.40';
    const minStreak = document.getElementById('pattern-min-streak')?.value || '0';
    const targetType = document.getElementById('pattern-target-type')?.value || 'loto_2digit';

    const scanBtn = document.getElementById('btn-run-auto-discovery');
    const loadingEl = document.getElementById('pattern-scan-loading');
    const resultsContainer = document.getElementById('pattern-scan-results');

    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang Đào Tìm Pattern...`;
    }
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultsContainer) resultsContainer.classList.add('opacity-40');

    try {
        const url = `/api/patterns/scan?days=${encodeURIComponent(rangeDays)}&min_occurrences=${minOcc}&min_confidence=${minConf}&min_streak=${minStreak}&target_type=${targetType}&top_n=50`;
        console.log('[Pattern Visualizer] Fetching:', url);
        const res = await fetch(url);
        const data = await res.json();
        console.log('[Pattern Visualizer] Response received:', data.status, 'patterns count:', data.patterns?.length);

        if (data.status === 'SUCCESS') {
            CURRENT_SCAN_DATA = data;
            
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

            // Mặc định nạp pattern xếp hạng #1 vào bảng vẽ SVG
            if (data.patterns && data.patterns.length > 0) {
                const topP = data.patterns[0];
                selectPatternForVisualization(topP, false);
            }
        } else {
            alert(data.message || 'Lỗi khi quét pattern.');
        }
    } catch (err) {
        console.error('[Pattern Visualizer] Lỗi khi gọi API scan pattern:', err);
    } finally {
        if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles mr-2 text-yellow-300"></i> TỰ TÌM ĐƯỜNG CẦU`;
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

// Hiển thị các thẻ Top 3 nổi bật
function renderTopHighlightCards(patterns) {
    const container = document.getElementById('pattern-top-cards-container');
    if (!container) return;

    if (!patterns || patterns.length === 0) {
        container.innerHTML = `
            <div class="col-span-full p-6 text-center text-neutral-400 bg-neutral-900/60 rounded-xl border border-neutral-800">
                Không tìm thấy pattern nào thỏa mãn ngưỡng lọc hiện tại. Hãy thử giảm Độ Tin Cậy hoặc Số lần xuất hiện tối thiểu.
            </div>
        `;
        return;
    }

    const top3 = patterns.slice(0, 3);
    const badges = [
        { label: 'TOP #1 VIP', border: 'border-yellow-500/70', bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]' },
        { label: 'TOP #2', border: 'border-cyan-500/70', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]' },
        { label: 'TOP #3', border: 'border-emerald-500/70', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
    ];

    container.innerHTML = top3.map((p, idx) => {
        const b = badges[idx] || badges[0];
        const nextPred = p.nextPrediction?.join(' - ') || '--';
        const hitRatePct = (p.metrics.rawHitRate * 100).toFixed(1);
        const confPct = (p.metrics.confidenceScore * 100).toFixed(1);
        const streakBadge = p.currentStreak > 0
            ? `<span class="px-2 py-0.5 rounded-full text-xs font-black bg-red-600/90 text-white animate-pulse">Ăn thông ${p.currentStreak} ngày</span>`
            : `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400">Nghỉ ${p.lastSeenDaysAgo} ngày</span>`;

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

                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 mb-4">
                        <span class="text-xs font-bold text-red-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-bullseye text-red-400"></i> Dự đoán kỳ tới:
                        </span>
                        <span class="text-base font-black font-mono text-yellow-300 tracking-wider">${nextPred}</span>
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

    tbody.innerHTML = patterns.map((p, idx) => {
        const hitRatePct = (p.metrics.rawHitRate * 100).toFixed(1);
        const confPct = (p.metrics.confidenceScore * 100).toFixed(1);
        const strengthClass = {
            'STRONG': 'bg-emerald-950 text-emerald-300 border-emerald-700',
            'MEDIUM': 'bg-cyan-950 text-cyan-300 border-cyan-700',
            'WEAK': 'bg-neutral-800 text-neutral-400 border-neutral-700',
            'OVERFIT': 'bg-red-950 text-red-400 border-red-700'
        }[p.metrics.statisticalStrength] || 'bg-neutral-800 text-neutral-400';

        const nextPred = p.nextPrediction?.join(' - ') || '--';

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
                <td class="p-3 text-center font-mono font-black text-yellow-400 text-xs">${nextPred}</td>
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
    const sortBy = document.getElementById('pattern-sort-select')?.value || 'confidence';

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

    // Sắp xếp
    filtered.sort((a, b) => {
        if (sortBy === 'confidence') return b.metrics.confidenceScore - a.metrics.confidenceScore;
        if (sortBy === 'hitRate') return b.metrics.rawHitRate - a.metrics.rawHitRate;
        if (sortBy === 'streak') return b.currentStreak - a.currentStreak;
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
        selectPatternForVisualization(pattern, shouldScroll);
    }
}

function openPatternDetailDrawerById(patternId) {
    const pattern = window.ALL_LOADED_PATTERNS[patternId];
    if (pattern) {
        openPatternDetailDrawer(pattern);
    }
}

// Chọn một pattern để trực quan hóa (Section IX)
async function selectPatternForVisualization(pattern, shouldScroll = false) {
    if (!pattern) return;
    CURRENT_ACTIVE_PATTERN = pattern;

    // Cập nhật tiêu đề và công thức trong khu vực Visualization
    setElText('vis-pattern-title', pattern.name);
    setElText('vis-pattern-formula', pattern.formula);
    setElText('vis-pattern-pred', pattern.nextPrediction?.join(' - ') || '--');
    setElText('vis-pattern-streak', pattern.currentStreak > 0
        ? `Chuỗi ăn hiện tại: ${pattern.currentStreak} kỳ liên tiếp`
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
        const url = `/api/patterns/details?pos_a=${pa}&pos_b=${pb}&op=${op}&target_type=${targetType}&day_offset=${dayOffset}&draws=8`;
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

    // 2. Vẽ các đường cạnh Edges
    const showBridgesLayer = document.getElementById('chk-layer-bridges')?.checked ?? true;
    if (showBridgesLayer && graph.edges) {
        graph.edges.forEach(e => {
            const p1 = getCenter(e.from);
            const p2 = getCenter(e.to);
            if (!p1 || !p2) return;

            if (e.type === 'source_pair') {
                // Đường nối ngang giữa 2 source trên cùng kỳ
                svgContent += `
                    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="svg-bridge-line dashed" stroke="#ef4444" stroke-width="2.5" />
                `;
            } else if (e.type === 'bridge_hit') {
                // Đường nối từ kỳ dưới (p1) LÊN kỳ trên (p2)
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y; // dy < 0 vì p2 ở bên trên p1
                
                // Bézier hướng lên mượt mà:
                // cy1 đi lên từ p1, cy2 ở phía dưới p2 một khoảng
                const cx1 = p1.x + dx * 0.15;
                const cy1 = p1.y + dy * 0.45;
                const cx2 = p2.x - dx * 0.15;
                const cy2 = p2.y - dy * 0.45;

                svgContent += `
                    <path d="M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}" class="svg-bridge-line hit" stroke="#ef4444" stroke-width="3" marker-end="url(#arrow-red)" />
                `;
            } else if (e.type === 'bridge_upcoming') {
                // Đường cong vút chỉ thẳng lên hộp dự đoán của kỳ mở thưởng tiếp theo (màu vàng kim VIP)
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y; // dy < 0
                
                const cx1 = p1.x + dx * 0.15;
                const cy1 = p1.y + dy * 0.45;
                const cx2 = p2.x - dx * 0.15;
                const cy2 = p2.y - dy * 0.45;

                svgContent += `
                    <path d="M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}" class="svg-bridge-line" stroke="#facc15" stroke-width="3.5" stroke-dasharray="6, 4" marker-end="url(#arrow-gold)" />
                `;
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

    // Lịch sử gần đây
    const historyList = document.getElementById('drawer-history-list');
    if (historyList && pattern.recentHistory) {
        historyList.innerHTML = pattern.recentHistory.map(h => {
            const st = h.hit
                ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">TRÚNG (${h.matchedNumbers.join(', ')})</span>`
                : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400">TRƯỢT</span>`;
            return `
                <div class="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex justify-between items-center text-xs">
                    <div>
                        <div class="font-bold text-white">${h.sourceDateDisplay} -> ${h.targetDateDisplay}</div>
                        <div class="text-[11px] text-neutral-400 font-mono">Dự đoán: [${h.predictedNumbers.join(', ')}]</div>
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
