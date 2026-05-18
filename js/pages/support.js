/* ============================================================
   pages/support.js — Form submit, ticket listele, accordion
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(function () {
    renderTickets();
    bindForm();
    bindLiveChat();
  });

  function renderTickets() {
    const root = Utils.qs('#tickets-tbody');
    root.innerHTML = GALLERY.SUPPORT_TICKETS.map(t => `
      <tr>
        <td class="px-5 py-4">#${t.id}</td>
        <td>${Utils.escapeHTML(t.subject)}</td>
        <td>${Utils.escapeHTML(t.date)}</td>
        <td><span class="text-[10px] uppercase tracking-lux ${t.status === 'Resolved' ? 'text-brand border-brand/30' : 'text-accent border-accent/30'} border px-2 py-1">${t.status}</span></td>
      </tr>
    `).join('');
  }

  function bindForm() {
    Utils.qs('#support-form').addEventListener('submit', e => {
      e.preventDefault();
      const ticket = '#' + Math.floor(3900 + Math.random() * 100);
      Utils.toast(`Submitted — ticket ${ticket}`);
      e.target.reset();
    });
  }

  function bindLiveChat() {
    Utils.qs('#live-chat')?.addEventListener('click', () => {
      Utils.toast('Live chat — connecting you with a curator');
    });
  }
})();
