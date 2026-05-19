/* ============================================================
   pages/admin/reservations.js — Tüm rezervasyonlar (demo)
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/reservations.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    let reservations = [];
    try { reservations = await GALLERY.api.adminListele.rezervasyonlar(); }
    catch (e) { console.warn('admin/reservations failed', e); }

    const tbody = Utils.qs('#res-tbody');
    const empty = Utils.qs('#res-empty');
    const counter = Utils.qs('#res-counter');
    if (counter) counter.textContent = `${reservations.length} ${reservations.length === 1 ? 'reservation' : 'reservations'} in the system`;

    if (reservations.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = reservations.map(r => {
      const statusClass = r.status === 'Confirmed' ? 'text-brand border-brand/30'
                        : r.status === 'Cancelled' ? 'text-ink-muted border-line'
                        : 'text-accent border-accent/30';
      return `
        <tr>
          <td class="px-5 py-4">#${Utils.escapeHTML(String(r.id))}</td>
          <td><span class="font-display text-ink-strong">${Utils.escapeHTML(r.workshopTitle || '—')}</span></td>
          <td class="text-ink-strong">${Utils.escapeHTML(r.customer?.name || '—')}</td>
          <td class="text-ink-muted">${Utils.escapeHTML(r.sessionLabel || '')} ${r.sessionTime ? '· ' + Utils.escapeHTML(r.sessionTime) : ''}</td>
          <td class="text-right">${r.participants || 1}</td>
          <td class="pl-3"><span class="text-[10px] uppercase tracking-lux ${statusClass} border px-2 py-1">${Utils.escapeHTML(r.status || '—')}</span></td>
        </tr>`;
    }).join('');
  });
})();
