/* ============================================================
   pages/admin/orders.js — Tüm siparişler (demo: kullanıcı endpoint)
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/orders.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    let orders = [];
    try { orders = await GALLERY.api.adminListele.siparisler(); }
    catch (e) { console.warn('admin/orders failed', e); }

    const tbody = Utils.qs('#orders-tbody');
    const empty = Utils.qs('#orders-empty');
    const counter = Utils.qs('#orders-counter');
    if (counter) counter.textContent = `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} in the system`;

    if (orders.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = orders.map(o => {
      const statusClass = o.status === 'Delivered' || o.status === 'Completed' ? 'text-brand border-brand/30'
                        : o.status === 'Cancelled' ? 'text-ink-muted border-line'
                        : 'text-accent border-accent/30';
      const payLabel = ({ card: 'Card', paypal: 'PayPal', bank: 'Bank' })[o.paymentMethod] || (o.paymentMethod || '—');
      return `
        <tr>
          <td class="px-5 py-4">#${Utils.escapeHTML(String(o.id))}</td>
          <td class="text-ink-strong">${Utils.escapeHTML(o.customer?.name || '—')}</td>
          <td>${(o.items || []).length} item${(o.items || []).length > 1 ? 's' : ''}</td>
          <td class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(payLabel)}</td>
          <td class="text-ink-muted">${Utils.escapeHTML(o.date || '')}</td>
          <td class="text-right">${Utils.fmtMoney(o.total || 0)}</td>
          <td class="pl-3"><span class="text-[10px] uppercase tracking-lux ${statusClass} border px-2 py-1">${Utils.escapeHTML(o.status || '—')}</span></td>
          <td class="text-right pr-5"><a href="../confirmation.html?id=${encodeURIComponent(o.id)}" class="text-[11px] uppercase tracking-lux border-b border-ink-strong/30 hover:border-brand">View</a></td>
        </tr>`;
    }).join('');
  });
})();
