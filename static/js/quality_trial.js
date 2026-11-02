(() => {
    const el = id => document.getElementById(id);
    const labels = {skip: 'Bỏ ngày', pending: 'Chờ đủ 2 ngày', win: 'Trúng', lose: 'Trượt'};
    const messages = {
        saved: 'Đã ghi nhận và cố định quyết định mới.',
        already_saved: 'Đã ghi nhận trước đó; quyết định được giữ nguyên.',
        insufficient_history: 'Chưa đủ 60 kỳ để ghi nhận.',
        stale_history: 'Kết quả chưa cập nhật đến kỳ cần thiết; chưa ghi nhận.',
        closed: 'Đã qua giờ ghi nhận hoặc đã có kết quả; không tạo bù.',
        missing_draw: 'Lịch sử thiếu kỳ quay; chưa ghi nhận.',
        incomplete_draw: 'Kỳ quay chưa đủ 27 số; chưa ghi nhận.'
    };
    let query = '';
    function line(table, values) {
        const tr = document.createElement('tr');
        values.forEach(value => {
            const td = document.createElement('td');
            td.className = 'p-2 border-t border-neutral-800'; td.textContent = value;
            tr.appendChild(td);
        });
        table.appendChild(tr);
        return tr;
    }
    function draw(data, message) {
        el('trial-summary').replaceChildren(); el('trial-history').replaceChildren();
        [['Bộ lọc v1', data.filtered], ['Top 1 mỗi ngày', data.baseline],
         ['Top 1 cùng ngày chọn', data.baseline_same_days]].forEach(([name, s]) => {
            line(el('trial-summary'), [name, `${s.selected} / ${s.skipped} / ${s.pending}`,
                `${s.wins} / ${s.completed}`, s.hit_rate === null ? 'Chưa có' : `${s.hit_rate}%`,
                s.max_miss_streak, s.money ? s.money.net.toLocaleString('vi-VN') : 'Chưa nhập mức tiền']);
            line(el('trial-summary'), [`Khung 1 số / 2 số (${name})`, `${s.single_windows} / ${s.pair_windows}`, '', '', '', '']);
        });
        data.rows.forEach(r => {
            const f = r.filtered, b = r.baseline;
            const reason = r.decision.selected ? `Cầu hạng ${r.decision.selected.rank}, đạt đủ điều kiện` : r.decision.reason;
            const tr = line(el('trial-history'), [r.target_date,
                `${f.numbers.join(' - ') || '—'} · ${labels[f.status]} · ${reason}`,
                `${b.numbers.join(' - ') || '—'} · ${labels[b.status]}`,
                new Date(r.created_at).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})]);
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = `Xem ${r.decision.candidates.length} cầu đã xét`;
            summary.className = 'cursor-pointer text-teal-300 mt-2';
            details.appendChild(summary);
            r.decision.candidates.forEach(c => {
                const p = document.createElement('p');
                p.className = 'mt-2 text-xs';
                const m = c.metrics;
                p.textContent = `#${c.rank} ${c.numbers.join(' - ')} · ${c.name || ''} · ${c.occurrences} kỳ · Kiểm tra: ${m.testHitRate == null ? 'thiếu' : (100 * m.testHitRate).toFixed(1) + '%'} · ${c.reasons.join('; ') || 'Đạt đủ điều kiện'}`;
                details.appendChild(p);
            });
            tr.children[1].appendChild(details);
        });
        const next = data.rows.find(r => r.baseline.status === 'pending');
        el('trial-next').textContent = next ? `Khung đang chờ ${next.target_date}: ${next.decision.selected ? next.filtered.numbers.join(' - ') : 'Bỏ ngày'} · ${next.decision.reason}` : '';
        el('trial-status').textContent = message || (data.total_days ?
            `Đã ghi ${data.total_days} ngày kể từ khi bật tính năng. Không bao gồm dự đoán tạo lại trong quá khứ.` :
            'Chưa có ngày theo dõi thử. Bấm “Ghi nhận & làm mới” để kiểm tra điều kiện; không tính lịch sử cũ thành dự đoán mới.');
    }
    async function load(capture = false) {
        const buttons = [el('trial-refresh'), el('trial-money')];
        buttons.forEach(b => b.disabled = true);
        try {
            let message = '';
            if (capture) {
                const response = await fetch('/api/quality-trial/capture', {method: 'POST'});
                if (!response.ok) throw new Error('Không thể ghi nhận. Vui lòng thử lại.');
                message = messages[(await response.json()).status] || 'Chưa thể ghi nhận.';
            }
            const response = await fetch(`/api/quality-trial${query}`, {cache: 'no-store'});
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Không tải được theo dõi thử.');
            draw(data, message);
        } catch (error) { el('trial-status').textContent = error.message; }
        finally { buttons.forEach(b => b.disabled = false); }
    }
    document.addEventListener('DOMContentLoaded', () => {
        if (!el('quality-trial')) return;
        el('trial-refresh').addEventListener('click', () => load(true));
        el('trial-money').addEventListener('click', () => {
            const stake = el('trial-stake').value, payout = el('trial-payout').value;
            if (!stake && !payout) { query = ''; load(); return; }
            if (![stake, payout].every(v => v && Number.isFinite(Number(v)) && Number(v) > 0 && Number(v) <= 1e12)) {
                el('trial-status').textContent = 'Nhập cả hai mức tiền lớn hơn 0 và không quá 1.000 tỷ.';
                return;
            }
            query = `?${new URLSearchParams({stake, payout})}`; load();
        });
        load();
    });
})();
