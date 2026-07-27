// =============================================
// ALERT SYSTEM — Food Management System
// BCA Minor Project 2025
// =============================================

// ── Config ────────────────────────────────────
const ALERT_CONFIG = {
    expiryWarnDays:   7,   // show expiry alert within N days
    overstockFactor:  3,   // quantity > minimumStock * factor → overstock
    wasteThreshold:   5,   // ≥ N wastage records in rolling 30 days → waste alert
    lowStockBuffer:   0,   // quantity <= minimumStock + buffer → low stock
};

// Persisted dismissed-alert keys
const DISMISSED_KEY = 'fms_dismissed_alerts';

function getDismissed() {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); }
    catch(e) { return []; }
}
function saveDismissed(arr) {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr)); } catch(e) {}
}
function dismissAlert(alertId) {
    const d = getDismissed();
    if (!d.includes(alertId)) { d.push(alertId); saveDismissed(d); }
    // remove from panel
    const el = document.getElementById('alert-' + alertId);
    if (el) {
        el.style.animation = 'alertSlideOut 0.3s ease forwards';
        setTimeout(() => { el.remove(); syncAlertBadge(); }, 300);
    }
}

// ── Alert generation ──────────────────────────

function generateAlerts() {
    const today      = new Date();
    today.setHours(0, 0, 0, 0);
    const dismissed  = getDismissed();
    const alerts     = [];

    foodItems.forEach(item => {
        const expiry    = new Date(item.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const daysLeft  = Math.ceil((expiry - today) / 86400000);
        const qty       = item.quantity;
        const minStock  = item.minimumStock || 0;

        // ── Expiry alert ──────────────────────
        if (daysLeft < 0) {
            alerts.push({
                id:       `expiry-expired-${item.id}`,
                type:     'expiry',
                severity: 'critical',
                icon:     'fa-skull-crossbones',
                title:    'Item Expired',
                message:  `<strong>${item.name}</strong> expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft)!==1?'s':''} ago.`,
                detail:   `Storage: ${item.storageLocation} · Category: ${item.category} · Qty: ${qty} ${item.unit}`,
                action:   `onclick="navigateToItem(${item.id})"`,
                actionLabel: 'View Item',
                item,
                daysLeft,
            });
        } else if (daysLeft <= ALERT_CONFIG.expiryWarnDays) {
            alerts.push({
                id:       `expiry-soon-${item.id}`,
                type:     'expiry',
                severity: daysLeft <= 2 ? 'high' : 'medium',
                icon:     'fa-clock',
                title:    `Expiring ${daysLeft === 0 ? 'Today' : `in ${daysLeft} Day${daysLeft!==1?'s':''}`}`,
                message:  `<strong>${item.name}</strong> expires on ${formatDate(item.expiryDate)}.`,
                detail:   `Storage: ${item.storageLocation} · Qty: ${qty} ${item.unit}`,
                action:   `onclick="navigateToItem(${item.id})"`,
                actionLabel: 'View Item',
                item,
                daysLeft,
            });
        }

        // ── Low stock alert ───────────────────
        if (qty === 0) {
            alerts.push({
                id:       `lowstock-${item.id}`,
                type:     'lowstock',
                severity: 'critical',
                icon:     'fa-battery-empty',
                title:    'Out of Stock',
                message:  `<strong>${item.name}</strong> is completely out of stock.`,
                detail:   `Supplier: ${item.supplier} · Location: ${item.storageLocation} · Min: ${minStock} ${item.unit}`,
                action:   `onclick="openAddItemModal(${item.id})"`,
                actionLabel: 'Update Stock',
                item,
            });
        } else if (minStock > 0 && qty <= minStock) {
            const pct = Math.round((qty / minStock) * 100);
            alerts.push({
                id:       `lowstock-${item.id}`,
                type:     'lowstock',
                severity: qty < minStock * 0.5 ? 'high' : 'medium',
                icon:     'fa-battery-quarter',
                title:    'Low Stock',
                message:  `<strong>${item.name}</strong> is at <strong>${qty} ${item.unit}</strong> — only ${pct}% of minimum stock (${minStock} ${item.unit}).`,
                detail:   `Supplier: ${item.supplier} · Location: ${item.storageLocation}`,
                action:   `onclick="openAddItemModal(${item.id})"`,
                actionLabel: 'Update Stock',
                item,
            });
        }

        // ── Overstock alert — uses maximumStock if set, else falls back to factor ──
        const maxStock = item.maximumStock || 0;
        if (maxStock > 0 && qty > maxStock) {
            const overBy = qty - maxStock;
            alerts.push({
                id:       `overstock-${item.id}`,
                type:     'overstock',
                severity: qty > maxStock * 1.5 ? 'high' : 'low',
                icon:     'fa-layer-group',
                title:    'Overstock Detected',
                message:  `<strong>${item.name}</strong> has <strong>${qty} ${item.unit}</strong> — exceeds max of ${maxStock} ${item.unit} by ${overBy.toFixed(1)}.`,
                detail:   `Storage: ${item.storageLocation} · Min: ${minStock} ${item.unit} · Max: ${maxStock} ${item.unit}`,
                action:   `onclick="navigateToItem(${item.id})"`,
                actionLabel: 'Review',
                item,
            });
        } else if (maxStock === 0 && minStock > 0 && qty > minStock * ALERT_CONFIG.overstockFactor) {
            // Fallback when no max stock is set
            alerts.push({
                id:       `overstock-${item.id}`,
                type:     'overstock',
                severity: 'low',
                icon:     'fa-layer-group',
                title:    'Possible Overstock',
                message:  `<strong>${item.name}</strong> has ${qty} ${item.unit} (${Math.round(qty/minStock)}× above minimum). Set a max stock level for precise alerts.`,
                detail:   `Storage: ${item.storageLocation} · Min: ${minStock} ${item.unit} · No max set`,
                action:   `onclick="openAddItemModal(${item.id})"`,
                actionLabel: 'Set Max Stock',
                item,
            });
        }
    });

    // ── Waste alert ───────────────────────────
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWaste = wastageRecords.filter(r => new Date(r.wastageDate) >= thirtyDaysAgo);
    if (recentWaste.length >= ALERT_CONFIG.wasteThreshold) {
        const totalCost = recentWaste.reduce((s, r) => s + (r.costImpact || 0), 0);
        const topItem   = getMostWastedItem(recentWaste);
        alerts.push({
            id:       `waste-high-${Math.floor(Date.now() / 86400000)}`, // resets daily
            type:     'waste',
            severity: recentWaste.length >= 10 ? 'high' : 'medium',
            icon:     'fa-recycle',
            title:    'High Wastage Rate',
            message:  `<strong>${recentWaste.length} wastage events</strong> in the last 30 days (₹${totalCost.toFixed(0)} cost impact).`,
            detail:   topItem ? `Highest: ${topItem.itemName} · ${topItem.total} ${topItem.unit}` : '',
            action:   `onclick="navigatePage('wastage')"`,
            actionLabel: 'View Wastage',
        });
    }

    // ── Smart suggestions ─────────────────────
    generateSmartSuggestions(alerts, today);

    // Filter dismissed
    return alerts.filter(a => !dismissed.includes(a.id));
}

function getMostWastedItem(records) {
    const map = {};
    records.forEach(r => {
        if (!map[r.itemName]) map[r.itemName] = { itemName: r.itemName, total: 0, unit: r.unit };
        map[r.itemName].total += r.quantityWasted;
    });
    return Object.values(map).sort((a,b) => b.total - a.total)[0] || null;
}

function generateSmartSuggestions(alerts, today) {
    // Suggest reorder for items expiring soon that also have low stock of same category
    const expiring = foodItems.filter(item => {
        const d = Math.ceil((new Date(item.expiryDate) - today) / 86400000);
        return d >= 0 && d <= ALERT_CONFIG.expiryWarnDays;
    });

    expiring.forEach(item => {
        const sameCategory = foodItems.filter(f =>
            f.category === item.category && f.id !== item.id && f.quantity > f.minimumStock
        );
        if (sameCategory.length === 0) {
            alerts.push({
                id:       `suggest-reorder-${item.id}`,
                type:     'suggestion',
                severity: 'info',
                icon:     'fa-lightbulb',
                title:    'Smart Suggestion',
                message:  `Consider reordering <strong>${item.category}</strong> — <strong>${item.name}</strong> is expiring and no backup stock exists.`,
                detail:   `Supplier: ${item.supplier}`,
                action:   `onclick="navigatePage('suppliers')"`,
                actionLabel: 'Contact Supplier',
                item,
            });
        }
    });

    // Suggest logging wastage for expired items
    const expiredItems = foodItems.filter(item =>
        Math.ceil((new Date(item.expiryDate) - today) / 86400000) < 0
    );
    expiredItems.forEach(item => {
        const alreadyLogged = wastageRecords.some(w =>
            w.itemName === item.name && w.reason === 'Expired' &&
            Math.abs(new Date(w.wastageDate) - today) < 7 * 86400000
        );
        if (!alreadyLogged) {
            alerts.push({
                id:       `suggest-log-waste-${item.id}`,
                type:     'suggestion',
                severity: 'info',
                icon:     'fa-clipboard-list',
                title:    'Log Wastage Suggested',
                message:  `<strong>${item.name}</strong> is expired — log it as wastage to maintain accurate records.`,
                detail:   `Qty: ${item.quantity} ${item.unit}`,
                action:   `onclick="openAddWastageModal()"`,
                actionLabel: 'Log Wastage',
                item,
            });
        }
    });

    // Suggest HACCP inspection if last inspection was > 14 days ago
    if (haccpRecords.length > 0) {
        const lastInspection = haccpRecords
            .map(r => new Date(r.inspectionDate))
            .sort((a,b) => b - a)[0];
        const daysSince = Math.ceil((today - lastInspection) / 86400000);
        if (daysSince > 14) {
            alerts.push({
                id:       `suggest-haccp-${Math.floor(daysSince/7)}`,
                type:     'suggestion',
                severity: 'info',
                icon:     'fa-search',
                title:    'HACCP Inspection Due',
                message:  `Last HACCP inspection was <strong>${daysSince} days ago</strong>. Schedule a new inspection soon.`,
                detail:   `Regular inspections maintain food safety compliance.`,
                action:   `onclick="navigatePage('haccp')"`,
                actionLabel: 'Schedule Inspection',
            });
        }
    }
}

// ── Rendering ─────────────────────────────────

const SEVERITY_META = {
    critical: { label: 'Critical', cls: 'alert-item--critical', badgeCls: 'alert-badge--critical' },
    high:     { label: 'High',     cls: 'alert-item--high',     badgeCls: 'alert-badge--high'     },
    medium:   { label: 'Medium',   cls: 'alert-item--medium',   badgeCls: 'alert-badge--medium'   },
    low:      { label: 'Low',      cls: 'alert-item--low',      badgeCls: 'alert-badge--low'      },
    info:     { label: 'Info',     cls: 'alert-item--info',     badgeCls: 'alert-badge--info'     },
};

const TYPE_META = {
    expiry:     { label: 'Expiry',     filterIcon: 'fa-clock'          },
    lowstock:   { label: 'Low Stock',  filterIcon: 'fa-battery-quarter'},
    overstock:  { label: 'Overstock',  filterIcon: 'fa-layer-group'    },
    waste:      { label: 'Waste',      filterIcon: 'fa-recycle'        },
    suggestion: { label: 'Suggestion', filterIcon: 'fa-lightbulb'      },
};

let alertPanelOpen  = false;
let alertTypeFilter = 'all';

function renderAlertPanel() {
    const alerts = generateAlerts();
    const panel  = document.getElementById('alertPanel');
    if (!panel) return;

    syncAlertBadge(alerts);

    // Counts per type
    const counts = { all: alerts.length };
    Object.keys(TYPE_META).forEach(t => {
        counts[t] = alerts.filter(a => a.type === t).length;
    });

    // Filter
    const filtered = alertTypeFilter === 'all'
        ? alerts
        : alerts.filter(a => a.type === alertTypeFilter);

    // Sort: critical → high → medium → low → info
    const severityOrder = { critical:0, high:1, medium:2, low:3, info:4 };
    filtered.sort((a,b) => severityOrder[a.severity] - severityOrder[b.severity]);

    panel.innerHTML = `
        <div class="alert-panel__header">
            <div class="alert-panel__title">
                <i class="fas fa-bell"></i>
                <span>Smart Alerts</span>
                ${alerts.length > 0 ? `<span class="alert-count-badge">${alerts.length}</span>` : ''}
            </div>
            <div class="alert-panel__header-actions">
                <button class="alert-tg-btn" onclick="openAlarmSettings()" title="Alarm Settings">
                    <i class="fas fa-sliders-h"></i>
                </button>
                ${alerts.length > 0 ? `<button class="alert-dismiss-all-btn" onclick="dismissAllAlerts()"><i class="fas fa-check-double"></i> Clear All</button>` : ''}
                <button class="alert-panel__close" onclick="closeAlertPanel()"><i class="fas fa-times"></i></button>
            </div>
        </div>

        <div class="alert-filter-tabs">
            ${buildFilterTabs(counts)}
        </div>

        <div class="alert-panel__body" id="alertPanelBody">
            ${filtered.length === 0 ? renderEmptyState() : filtered.map(renderAlertItem).join('')}
        </div>
    `;
}

function buildFilterTabs(counts) {
    const tabs = [
        { key: 'all', label: 'All', icon: 'fa-th-list' },
        ...Object.entries(TYPE_META).map(([k,v]) => ({ key: k, label: v.label, icon: v.filterIcon }))
    ];
    return tabs.map(t => `
        <button class="alert-filter-tab ${alertTypeFilter === t.key ? 'active' : ''}"
                onclick="setAlertFilter('${t.key}')">
            <i class="fas ${t.icon}"></i>
            <span>${t.label}</span>
            ${counts[t.key] > 0 ? `<span class="tab-count">${counts[t.key]}</span>` : ''}
        </button>
    `).join('');
}

function renderAlertItem(alert) {
    const sm = SEVERITY_META[alert.severity] || SEVERITY_META.info;
    return `
        <div class="alert-item ${sm.cls}" id="alert-${alert.id}">
            <div class="alert-item__icon-wrap">
                <i class="fas ${alert.icon}"></i>
            </div>
            <div class="alert-item__content">
                <div class="alert-item__header-row">
                    <span class="alert-severity-badge ${sm.badgeCls}">${sm.label}</span>
                    <span class="alert-type-label">${TYPE_META[alert.type]?.label || ''}</span>
                </div>
                <div class="alert-item__title">${alert.title}</div>
                <div class="alert-item__message">${alert.message}</div>
                ${alert.detail ? `<div class="alert-item__detail">${alert.detail}</div>` : ''}
                <div class="alert-item__actions">
                    <button class="alert-action-btn" ${alert.action}>${alert.actionLabel}</button>
                    <button class="alert-dismiss-btn" onclick="dismissAlert('${alert.id}')">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderEmptyState() {
    return `
        <div class="alert-empty-state">
            <i class="fas fa-check-circle"></i>
            <p>No alerts</p>
            <span>Everything looks good!</span>
        </div>
    `;
}

// ── Panel toggle ─────────────────────────────

function toggleAlertPanel() {
    alertPanelOpen = !alertPanelOpen;
    const panel    = document.getElementById('alertPanel');
    const overlay  = document.getElementById('alertOverlay');
    if (!panel) return;
    if (alertPanelOpen) {
        renderAlertPanel();
        panel.classList.add('open');
        overlay.classList.add('active');
        document.getElementById('alertBellBtn').classList.add('active');
    } else {
        closeAlertPanel();
    }
}

function closeAlertPanel() {
    alertPanelOpen = false;
    const panel    = document.getElementById('alertPanel');
    const overlay  = document.getElementById('alertOverlay');
    if (panel)   panel.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    const btn = document.getElementById('alertBellBtn');
    if (btn) btn.classList.remove('active');
}

function setAlertFilter(type) {
    alertTypeFilter = type;
    renderAlertPanel();
}

function dismissAllAlerts() {
    const alerts    = generateAlerts();
    const dismissed = getDismissed();
    alerts.forEach(a => { if (!dismissed.includes(a.id)) dismissed.push(a.id); });
    saveDismissed(dismissed);
    renderAlertPanel();
}

// ── Badge sync ────────────────────────────────

function syncAlertBadge(alerts) {
    if (!alerts) alerts = generateAlerts();
    const badge    = document.getElementById('alertBadge');
    const critical = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
    const total    = alerts.length;
    if (!badge) return;
    if (total === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'flex';
        badge.textContent   = total > 99 ? '99+' : total;
        badge.className     = 'alert-badge ' + (critical > 0 ? 'alert-badge--pulse' : '');
    }
}

// ── Navigation helpers ────────────────────────

function navigatePage(page) {
    closeAlertPanel();
    const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
    if (link) link.click();
}

function navigateToItem(itemId) {
    closeAlertPanel();
    navigatePage('inventory');
    // Brief delay then highlight
    setTimeout(() => {
        const rows = document.querySelectorAll('#inventoryTableBody tr');
        rows.forEach(row => {
            if (row.innerHTML.includes(`editItem(${itemId})`)) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('row-highlight');
                setTimeout(() => row.classList.remove('row-highlight'), 2500);
            }
        });
    }, 400);
}

// ── Dashboard alert summary widget ───────────

function renderDashboardAlertSummary() {
    const container = document.getElementById('dashboardAlertSummary');
    if (!container) return;

    const alerts = generateAlerts();
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="dash-alert-all-clear">
                <i class="fas fa-shield-alt"></i>
                <span>All systems normal — no active alerts</span>
            </div>`;
        return;
    }

    // Group by type
    const groups = {};
    alerts.forEach(a => {
        if (!groups[a.type]) groups[a.type] = [];
        groups[a.type].push(a);
    });

    const severityOrder = { critical:0, high:1, medium:2, low:3, info:4 };
    const topAlerts = alerts
        .filter(a => a.severity !== 'info')
        .sort((a,b) => severityOrder[a.severity] - severityOrder[b.severity])
        .slice(0, 3);

    container.innerHTML = `
        <div class="dash-alert-stats">
            ${Object.entries(TYPE_META).map(([type, meta]) => {
                const count = (groups[type] || []).length;
                if (count === 0) return '';
                const hasCritical = (groups[type] || []).some(a => a.severity === 'critical' || a.severity === 'high');
                return `
                    <div class="dash-alert-stat ${hasCritical ? 'dash-alert-stat--urgent' : ''}" onclick="openAlertPanelWithFilter('${type}')">
                        <i class="fas ${meta.filterIcon}"></i>
                        <span class="dash-stat-count">${count}</span>
                        <span class="dash-stat-label">${meta.label}</span>
                    </div>
                `;
            }).join('')}
        </div>
        ${topAlerts.length > 0 ? `
        <div class="dash-alert-top">
            ${topAlerts.map(a => {
                const sm = SEVERITY_META[a.severity];
                return `
                <div class="dash-alert-row ${sm.cls}" onclick="openAlertPanelWithFilter('${a.type}')">
                    <i class="fas ${a.icon}"></i>
                    <span>${a.title}: ${a.item ? a.item.name : ''}</span>
                    <span class="dash-alert-chip ${sm.badgeCls}">${sm.label}</span>
                </div>`;
            }).join('')}
            ${alerts.length > 3 ? `
            <button class="dash-view-all-btn" onclick="openAlertPanelWithFilter('all')">
                View all ${alerts.length} alerts <i class="fas fa-arrow-right"></i>
            </button>` : ''}
        </div>` : ''}
    `;
}

function openAlertPanelWithFilter(type) {
    alertTypeFilter = type;
    if (!alertPanelOpen) toggleAlertPanel();
    else renderAlertPanel();
}


// ── Browser Alarm System ──────────────────────
// Pure browser alarms — sound + popup overlay on laptop.
// No third-party apps needed.

const ALARM_CONFIG_KEY = 'fms_alarm_config';

function getAlarmConfig() {
    try { return JSON.parse(localStorage.getItem(ALARM_CONFIG_KEY) || 'null'); }
    catch(e) { return null; }
}
function saveAlarmConfig(cfg) {
    localStorage.setItem(ALARM_CONFIG_KEY, JSON.stringify(cfg));
}

// ── AudioContext beep (no audio file needed) ──
function playAlarmSound(severity) {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const cfg  = { critical:{ freq:880, reps:4, gap:0.18 },
                       high:    { freq:660, reps:3, gap:0.22 },
                       default: { freq:440, reps:2, gap:0.28 } };
        const p    = cfg[severity] || cfg.default;
        let time   = ctx.currentTime;
        for (let i = 0; i < p.reps; i++) {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type      = 'sine';
            osc.frequency.setValueAtTime(p.freq, time);
            gain.gain.setValueAtTime(0.0, time);
            gain.gain.linearRampToValueAtTime(0.5, time + 0.04);
            gain.gain.linearRampToValueAtTime(0.0, time + 0.14);
            osc.start(time);
            osc.stop(time + 0.18);
            time += p.gap;
        }
        // Auto-close ctx after beeps finish
        setTimeout(() => ctx.close(), (p.reps * p.gap + 0.5) * 1000);
    } catch(e) { /* AudioContext blocked — skip sound */ }
}

// ── Alarm popup overlay ───────────────────────
function showAlarmPopup(alerts) {
    // Remove any existing
    const old = document.getElementById('fmsAlarmOverlay');
    if (old) old.remove();

    const critical = alerts.filter(a => a.severity === 'critical');
    const high     = alerts.filter(a => a.severity === 'high');
    const topSeverity = critical.length ? 'critical' : (high.length ? 'high' : 'medium');

    // Play sound
    const cfg = getAlarmConfig();
    if (!cfg || cfg.sound !== false) playAlarmSound(topSeverity);

    const severityLabel = { critical:'🔴 CRITICAL', high:'🟠 HIGH', medium:'🟡 MEDIUM' };
    const topAlerts = alerts.slice(0, 5);

    const overlay = document.createElement('div');
    overlay.id    = 'fmsAlarmOverlay';
    overlay.innerHTML = `
        <div class="alarm-popup alarm-popup--${topSeverity}" id="fmsAlarmPopup">
            <div class="alarm-popup__pulse-ring"></div>
            <div class="alarm-popup__header">
                <span class="alarm-severity-pill">${severityLabel[topSeverity] || '⚠️'}</span>
                <button class="alarm-popup__close" onclick="dismissAlarmPopup()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="alarm-popup__icon">
                <i class="fas fa-bell alarm-popup__bell"></i>
            </div>
            <h2 class="alarm-popup__title">
                ${alerts.length} Active Alert${alerts.length !== 1 ? 's' : ''}
            </h2>
            <p class="alarm-popup__subtitle">Food Management System requires your attention</p>
            <div class="alarm-popup__list">
                ${topAlerts.map(a => `
                    <div class="alarm-popup__item alarm-popup__item--${a.severity}">
                        <i class="fas ${a.icon}"></i>
                        <div>
                            <strong>${a.title}</strong>
                            <span>${a.message.replace(/<[^>]+>/g, '')}</span>
                        </div>
                    </div>
                `).join('')}
                ${alerts.length > 5 ? `<p class="alarm-popup__more">+${alerts.length - 5} more alerts</p>` : ''}
            </div>
            <div class="alarm-popup__actions">
                <button class="alarm-btn alarm-btn--primary" onclick="dismissAlarmPopup(); toggleAlertPanel();">
                    <i class="fas fa-list"></i> View All Alerts
                </button>
                <button class="alarm-btn alarm-btn--ghost" onclick="snoozeAlarm()">
                    <i class="fas fa-clock"></i> Snooze 30 min
                </button>
            </div>
        </div>
    `;

    // Click outside to close
    overlay.addEventListener('click', e => {
        if (e.target === overlay) dismissAlarmPopup();
    });

    document.body.appendChild(overlay);
    // Animate in
    requestAnimationFrame(() => overlay.classList.add('alarm-overlay--visible'));

    // Also fire a browser notification if permission granted
    fireBrowserNotification(alerts, topSeverity);
}

function dismissAlarmPopup() {
    const overlay = document.getElementById('fmsAlarmOverlay');
    if (!overlay) return;
    overlay.classList.remove('alarm-overlay--visible');
    setTimeout(() => overlay.remove(), 300);
}

function snoozeAlarm() {
    dismissAlarmPopup();
    const snoozeUntil = Date.now() + 30 * 60 * 1000;
    localStorage.setItem('fms_alarm_snoozed_until', snoozeUntil);
    showToast('Alarm snoozed for 30 minutes.', 'info');
}

// ── Browser Notification (shows in OS notification tray) ──
function fireBrowserNotification(alerts, severity) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const critical = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    if (critical.length === 0) return;
    const first = critical[0];
    new Notification('🍽 FMS — ' + (severity === 'critical' ? 'Critical Alert' : 'Alert'), {
        body: first.message.replace(/<[^>]+>/g, '') + (critical.length > 1 ? ` (+${critical.length-1} more)` : ''),
        tag:  'fms-alarm',
        renotify: true,
        requireInteraction: true,
    });
}

// ── Alarm scheduler ───────────────────────────
let _alarmTimer = null;

function scheduleAlarms() {
    if (_alarmTimer) clearInterval(_alarmTimer);
    const cfg      = getAlarmConfig();
    const interval = cfg ? (cfg.intervalMinutes || 30) * 60 * 1000 : 30 * 60 * 1000;
    _alarmTimer    = setInterval(runAlarmCheck, interval);
}

function runAlarmCheck() {
    // Check snooze
    const snoozeUntil = parseInt(localStorage.getItem('fms_alarm_snoozed_until') || '0');
    if (Date.now() < snoozeUntil) return;

    const cfg     = getAlarmConfig();
    if (cfg && cfg.enabled === false) return;

    const alerts  = generateAlerts();
    const minSeverity = cfg ? cfg.minSeverity || 'high' : 'high';
    const order   = { critical:0, high:1, medium:2, low:3, info:4 };
    const minRank = order[minSeverity] ?? 1;
    const urgent  = alerts.filter(a => (order[a.severity] ?? 99) <= minRank);

    if (urgent.length === 0) return;
    showAlarmPopup(urgent);
}

// ── Notification permission request ───────────
function requestBrowserNotifPermission(callback) {
    if (!('Notification' in window)) { callback && callback(false); return; }
    if (Notification.permission === 'granted') { callback && callback(true); return; }
    Notification.requestPermission().then(p => callback && callback(p === 'granted'));
}

// ── Alarm Settings UI ─────────────────────────
function openAlarmSettings() {
    const cfg  = getAlarmConfig() || {};
    const perm = ('Notification' in window) ? Notification.permission : 'unavailable';

    const old = document.getElementById('alarmSettingsOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id    = 'alarmSettingsOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;';

    overlay.innerHTML = `
        <div class="alarm-settings-modal">
            <div class="alarm-settings-header">
                <span><i class="fas fa-bell"></i> Alarm Settings</span>
                <button onclick="document.getElementById('alarmSettingsOverlay').remove()" class="tg-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="alarm-settings-body">

                <div class="alarm-setting-row">
                    <div>
                        <strong>Enable Alarms</strong>
                        <p>Show popup + play sound when critical alerts fire</p>
                    </div>
                    <label class="alarm-toggle">
                        <input type="checkbox" id="alarmEnabled" ${cfg.enabled !== false ? 'checked' : ''}>
                        <span class="alarm-toggle-slider"></span>
                    </label>
                </div>

                <div class="alarm-setting-row">
                    <div>
                        <strong>Alarm Sound</strong>
                        <p>Play beep when alarm fires</p>
                    </div>
                    <label class="alarm-toggle">
                        <input type="checkbox" id="alarmSound" ${cfg.sound !== false ? 'checked' : ''}>
                        <span class="alarm-toggle-slider"></span>
                    </label>
                </div>

                <div class="alarm-setting-row">
                    <div>
                        <strong>Check Every</strong>
                        <p>How often to check for critical alerts</p>
                    </div>
                    <select id="alarmInterval" class="form-control" style="width:130px">
                        <option value="5"  ${cfg.intervalMinutes==5?'selected':''}>5 minutes</option>
                        <option value="15" ${cfg.intervalMinutes==15?'selected':''}>15 minutes</option>
                        <option value="30" ${(!cfg.intervalMinutes||cfg.intervalMinutes==30)?'selected':''}>30 minutes</option>
                        <option value="60" ${cfg.intervalMinutes==60?'selected':''}>1 hour</option>
                    </select>
                </div>

                <div class="alarm-setting-row">
                    <div>
                        <strong>Alert Level</strong>
                        <p>Minimum severity to trigger alarm</p>
                    </div>
                    <select id="alarmMinSeverity" class="form-control" style="width:130px">
                        <option value="critical" ${cfg.minSeverity==='critical'?'selected':''}>Critical only</option>
                        <option value="high"     ${(!cfg.minSeverity||cfg.minSeverity==='high')?'selected':''}>High &amp; above</option>
                        <option value="medium"   ${cfg.minSeverity==='medium'?'selected':''}>Medium &amp; above</option>
                    </select>
                </div>

                <div class="alarm-setting-row">
                    <div>
                        <strong>OS Notifications</strong>
                        <p>Show in Windows/Mac notification tray too</p>
                    </div>
                    ${perm === 'granted'
                        ? '<span class="alarm-perm-badge alarm-perm-badge--on"><i class="fas fa-check"></i> Allowed</span>'
                        : perm === 'denied'
                        ? '<span class="alarm-perm-badge alarm-perm-badge--off"><i class="fas fa-times"></i> Blocked in browser</span>'
                        : '<button class="alarm-btn alarm-btn--outline" onclick="requestBrowserNotifPermission(ok => { showToast(ok?\'Notifications allowed!\':\'Blocked — allow in browser settings.\', ok?\'success\':\'error\'); document.getElementById(\'alarmSettingsOverlay\').remove(); openAlarmSettings(); })">Allow</button>'
                    }
                </div>

                <div class="alarm-settings-actions">
                    <button class="alarm-btn alarm-btn--outline" onclick="previewAlarm()">
                        <i class="fas fa-play"></i> Preview Alarm
                    </button>
                    <button class="alarm-btn alarm-btn--primary" onclick="saveAlarmSettings()">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
        </div>
    `;

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function saveAlarmSettings() {
    const cfg = {
        enabled:         document.getElementById('alarmEnabled').checked,
        sound:           document.getElementById('alarmSound').checked,
        intervalMinutes: parseInt(document.getElementById('alarmInterval').value),
        minSeverity:     document.getElementById('alarmMinSeverity').value,
    };
    saveAlarmConfig(cfg);
    document.getElementById('alarmSettingsOverlay').remove();
    scheduleAlarms();
    updateAlarmSettingsBadge();
    showToast('Alarm settings saved!', 'success');
}

function previewAlarm() {
    document.getElementById('alarmSettingsOverlay').remove();
    const mockAlerts = [{
        severity: 'critical', icon: 'fa-skull-crossbones',
        title: 'Preview — Item Expired',
        message: 'This is what a critical alarm looks like.',
        type: 'expiry',
    }, {
        severity: 'high', icon: 'fa-battery-quarter',
        title: 'Preview — Low Stock',
        message: 'Rice is at 2 kg — below minimum of 10 kg.',
        type: 'lowstock',
    }];
    showAlarmPopup(mockAlerts);
}

function updateAlarmSettingsBadge() {
    const badge = document.getElementById('alarmSettingsBadge');
    if (!badge) return;
    const cfg = getAlarmConfig();
    const on  = !cfg || cfg.enabled !== false;
    badge.textContent = on ? '✓ Active' : 'Off';
    badge.className   = on ? 'tg-settings-badge tg-settings-badge--on' : 'tg-settings-badge';
}

// ── Init ──────────────────────────────────────

function initAlertSystem() {
    syncAlertBadge();
    renderDashboardAlertSummary();
    // Refresh badge + summary every 5 minutes
    setInterval(() => {
        syncAlertBadge();
        renderDashboardAlertSummary();
    }, 5 * 60 * 1000);
    // Start alarm scheduler
    scheduleAlarms();
    // Update settings badge
    setTimeout(updateAlarmSettingsBadge, 500);
    // Run first check after 10 seconds (after data loads)
    setTimeout(runAlarmCheck, 10000);
}

// Expose to window
window.dismissAlert             = dismissAlert;
window.dismissAllAlerts         = dismissAllAlerts;
window.toggleAlertPanel         = toggleAlertPanel;
window.closeAlertPanel          = closeAlertPanel;
window.setAlertFilter           = setAlertFilter;
window.navigatePage             = navigatePage;
window.navigateToItem           = navigateToItem;
window.openAlertPanelWithFilter = openAlertPanelWithFilter;
window.dismissAlarmPopup        = dismissAlarmPopup;
window.snoozeAlarm              = snoozeAlarm;
window.openAlarmSettings        = openAlarmSettings;
window.saveAlarmSettings        = saveAlarmSettings;
window.previewAlarm             = previewAlarm;
window.requestBrowserNotifPermission = requestBrowserNotifPermission;

// Make alertPanelOpen readable by inline scripts
Object.defineProperty(window, 'alertPanelOpen', {
    get: () => alertPanelOpen,
    set: v => { alertPanelOpen = v; },
});
