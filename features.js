// ============================================================
// FEATURES.JS — Food Management System
// Dark Mode | Wastage Analytics | Keyboard Shortcuts
// ============================================================

// ============================================================
// 1. DARK MODE
// ============================================================

const DARK_MODE_KEY = 'fms_dark_mode';

function initDarkMode() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const enabled = saved !== null ? saved === 'true' : prefersDark;
    applyDarkMode(enabled, false);

    // Listen for OS dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem(DARK_MODE_KEY) === null) applyDarkMode(e.matches, false);
    });
}

function applyDarkMode(enabled, save = true) {
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    if (save) localStorage.setItem(DARK_MODE_KEY, enabled);

    // Update toggle button icon + tooltip
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.innerHTML = enabled
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        btn.title = enabled ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }

    // Reload charts so their colors match
    if (typeof updateCharts === 'function') {
        try { updateCharts(); } catch(e) {}
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyDarkMode(!isDark);
}

window.toggleDarkMode = toggleDarkMode;




// ============================================================
// 3. WASTAGE TREND ANALYTICS (enhanced panel)
// ============================================================

function renderWastageAnalytics() {
    const container = document.getElementById('wastageAnalyticsPanel');
    if (!container) return;

    if (wastageRecords.length === 0) {
        container.innerHTML = '<p style="color:var(--color-text-secondary);font-size:13px;padding:12px 0">No wastage records yet.</p>';
        return;
    }

    const today = new Date(); today.setHours(0,0,0,0);

    // ── KPIs ──────────────────────────────────
    const totalCost     = wastageRecords.reduce((s, r) => s + (r.costImpact || 0), 0);
    const totalQty      = wastageRecords.reduce((s, r) => s + (r.quantityWasted || 0), 0);
    const last30        = wastageRecords.filter(r => {
        const d = new Date(r.wastageDate); return (today - d) / 86400000 <= 30;
    });
    const cost30        = last30.reduce((s, r) => s + (r.costImpact || 0), 0);

    // ── Top wasted items ──────────────────────
    const itemMap = {};
    wastageRecords.forEach(r => {
        if (!itemMap[r.itemName]) itemMap[r.itemName] = { qty: 0, cost: 0 };
        itemMap[r.itemName].qty  += r.quantityWasted || 0;
        itemMap[r.itemName].cost += r.costImpact || 0;
    });
    const topItems = Object.entries(itemMap)
        .sort((a, b) => b[1].cost - a[1].cost)
        .slice(0, 5);

    // ── Reason breakdown ──────────────────────
    const reasonMap = {};
    wastageRecords.forEach(r => {
        reasonMap[r.reason] = (reasonMap[r.reason] || 0) + (r.costImpact || 0);
    });
    const totalReasonCost = Object.values(reasonMap).reduce((s, v) => s + v, 0) || 1;

    // ── Monthly trend (last 6 months) ─────────
    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7);
        monthMap[key] = 0;
    }
    wastageRecords.forEach(r => {
        const m = r.wastageDate ? r.wastageDate.slice(0, 7) : null;
        if (m && monthMap.hasOwnProperty(m)) monthMap[m] += r.costImpact || 0;
    });
    const monthLabels = Object.keys(monthMap).map(m => {
        const [y, mo] = m.split('-');
        return new Date(y, mo - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    });
    const monthValues = Object.values(monthMap);
    const maxMonthVal = Math.max(...monthValues, 1);

    const reasonColors = { Expired:'#E24B4A', Damaged:'#EF9F27', Spoiled:'#1D9E75', 'Over-preparation':'#378ADD', Others:'#888780' };

    container.innerHTML = `
        <div class="wa-kpis">
            <div class="wa-kpi">
                <span class="wa-kpi-val">₹${totalCost.toLocaleString('en-IN')}</span>
                <span class="wa-kpi-label">Total Wastage Cost</span>
            </div>
            <div class="wa-kpi">
                <span class="wa-kpi-val">${wastageRecords.length}</span>
                <span class="wa-kpi-label">Total Records</span>
            </div>
            <div class="wa-kpi wa-kpi--warn">
                <span class="wa-kpi-val">₹${cost30.toLocaleString('en-IN')}</span>
                <span class="wa-kpi-label">Last 30 Days</span>
            </div>
            <div class="wa-kpi">
                <span class="wa-kpi-val">${last30.length}</span>
                <span class="wa-kpi-label">Events (30 days)</span>
            </div>
        </div>

        <div class="wa-panels">
            <div class="wa-panel">
                <div class="wa-panel-title"><i class="fas fa-chart-bar"></i> Monthly Cost Trend (Last 6 Months)</div>
                <div class="wa-bar-chart">
                    ${monthValues.map((val, i) => `
                        <div class="wa-bar-col">
                            <div class="wa-bar-wrap">
                                <div class="wa-bar" style="height:${Math.round((val/maxMonthVal)*100)}%" title="₹${val.toLocaleString('en-IN')}">
                                    ${val > 0 ? `<span class="wa-bar-val">₹${val >= 1000 ? Math.round(val/1000)+'k' : val}</span>` : ''}
                                </div>
                            </div>
                            <span class="wa-bar-label">${monthLabels[i]}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="wa-panel">
                <div class="wa-panel-title"><i class="fas fa-trophy"></i> Top 5 Wasted Items (by Cost)</div>
                <div class="wa-top-list">
                    ${topItems.map(([name, data], i) => {
                        const pct = Math.round((data.cost / totalCost) * 100);
                        return `
                        <div class="wa-top-item">
                            <span class="wa-rank">${i+1}</span>
                            <div class="wa-top-info">
                                <div class="wa-top-name">${name}</div>
                                <div class="wa-top-bar-wrap">
                                    <div class="wa-top-bar-fill" style="width:${pct}%"></div>
                                </div>
                            </div>
                            <div class="wa-top-stats">
                                <span class="wa-cost">₹${data.cost.toLocaleString('en-IN')}</span>
                                <span class="wa-pct">${pct}%</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="wa-panel">
                <div class="wa-panel-title"><i class="fas fa-pie-chart"></i> Wastage by Reason</div>
                <div class="wa-reasons">
                    ${Object.entries(reasonMap).sort((a,b)=>b[1]-a[1]).map(([reason, cost]) => {
                        const pct = Math.round((cost / totalReasonCost) * 100);
                        const color = reasonColors[reason] || '#888780';
                        return `
                        <div class="wa-reason-row">
                            <div class="wa-reason-dot" style="background:${color}"></div>
                            <span class="wa-reason-name">${reason}</span>
                            <div class="wa-reason-bar-wrap">
                                <div class="wa-reason-bar-fill" style="width:${pct}%;background:${color}"></div>
                            </div>
                            <span class="wa-reason-pct">${pct}%</span>
                            <span class="wa-reason-cost">₹${cost.toLocaleString('en-IN')}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

window.renderWastageAnalytics = renderWastageAnalytics;


// ============================================================
// 4. KEYBOARD SHORTCUTS
// ============================================================

const SHORTCUTS = [
    { keys: ['Ctrl','N'],  label: 'New inventory item',     action: () => { navigatePageFeature('inventory'); setTimeout(() => openAddItemModal(), 300); } },
    { keys: ['Ctrl','F'],  label: 'Focus search bar',       action: () => { const s = document.getElementById('inventorySearch'); if (s) { navigatePageFeature('inventory'); setTimeout(() => { s.focus(); s.select(); }, 300); } } },
    { keys: ['Ctrl','D'],  label: 'Go to Dashboard',        action: () => navigatePageFeature('dashboard') },
    { keys: ['Ctrl','I'],  label: 'Go to Inventory',        action: () => navigatePageFeature('inventory') },
    { keys: ['Ctrl','W'],  label: 'Go to Wastage',          action: () => navigatePageFeature('wastage') },
    { keys: ['Ctrl','H'],  label: 'Go to HACCP',            action: () => navigatePageFeature('haccp') },
    { keys: ['Ctrl','R'],  label: 'Go to Reports',          action: () => navigatePageFeature('reports') },
    { keys: ['Ctrl','\\'], label: 'Toggle Dark Mode',       action: () => toggleDarkMode() },
    { keys: ['Ctrl','K'],  label: 'Show Keyboard Shortcuts',action: () => showShortcutsHelp() },
    { keys: ['Escape'],    label: 'Close modal / panel',    action: () => {
        const modal = document.getElementById('modal');
        if (modal && modal.classList.contains('active')) { closeModal(); return; }
        if (typeof closeAlertPanel === 'function') closeAlertPanel();
        closeScanner();
    }},
];

function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Don't fire shortcuts when typing in inputs
        const tag = document.activeElement.tagName;
        if (['INPUT','TEXTAREA','SELECT'].includes(tag)) {
            // Allow Escape even in inputs
            if (e.key !== 'Escape') return;
        }

        for (const shortcut of SHORTCUTS) {
            const needsCtrl = shortcut.keys.includes('Ctrl');
            const key       = shortcut.keys.find(k => k !== 'Ctrl' && k !== 'Shift');

            const ctrlMatch = !needsCtrl || (e.ctrlKey || e.metaKey);
            const keyMatch  = e.key === key ||
                              e.key.toLowerCase() === key.toLowerCase() ||
                              e.key === key.replace('\\', '\\');

            if (ctrlMatch && keyMatch) {
                // Only fire if user is logged in
                if (!isLoggedIn && shortcut.keys[0] !== 'Escape') continue;
                e.preventDefault();
                shortcut.action();
                return;
            }
        }
    });
}

function navigatePageFeature(page) {
    const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
    if (link) link.click();
}

function showShortcutsHelp() {
    const old = document.getElementById('shortcutsHelpOverlay');
    if (old) { old.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id    = 'shortcutsHelpOverlay';
    overlay.innerHTML = `
        <div class="shortcuts-modal">
            <div class="shortcuts-header">
                <span><i class="fas fa-keyboard"></i> Keyboard Shortcuts</span>
                <button onclick="document.getElementById('shortcutsHelpOverlay').remove()" class="scanner-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="shortcuts-body">
                <div class="shortcuts-grid">
                    ${SHORTCUTS.map(s => `
                        <div class="shortcut-row">
                            <span class="shortcut-label">${s.label}</span>
                            <span class="shortcut-keys">
                                ${s.keys.map(k => `<kbd>${k}</kbd>`).join(' + ')}
                            </span>
                        </div>
                    `).join('')}
                </div>
                <p class="shortcuts-tip">
                    <i class="fas fa-lightbulb"></i>
                    Shortcuts are disabled when typing in an input field (except Escape).
                </p>
            </div>
        </div>
    `;
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('scanner-overlay--visible'));
}

window.showShortcutsHelp = showShortcutsHelp;


// ============================================================
// INIT ALL FEATURES
// ============================================================

function initFeatures() {
    initDarkMode();
    initKeyboardShortcuts();
    // Wastage analytics renders when wastage page is visited (hooked in navigation)
}

window.initFeatures = initFeatures;
