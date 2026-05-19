/* ============================================================
   pages/admin/workshops.js — Atölye listesi + CRUD aksiyonları
   ============================================================ */

(function () {
  'use strict';

  let workshops = [];

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/workshops.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    await load();
    render();
  });

  async function load() {
    try { workshops = await GALLERY.api.listWorkshops(); }
    catch (e) { console.warn('admin/workshops: load failed', e); workshops = []; }
  }

  function render() {
    const tbody = Utils.qs('#workshops-tbody');
    const empty = Utils.qs('#workshops-empty');
    const counter = Utils.qs('#ws-counter');
    if (!tbody) return;

    if (counter) counter.textContent = `${workshops.length} ${workshops.length === 1 ? 'workshop' : 'workshops'} on the calendar`;

    if (workshops.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = workshops.map(w => {
      const session = (w.sessions && w.sessions[0]) || { dateLong: '—', time: '—' };
      return `
        <tr>
          <td class="px-5 py-4 text-ink-muted">#${w.id}</td>
          <td>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 overflow-hidden bg-bg-image flex-shrink-0">
                <img src="${Utils.img(w.image, 80)}" alt="" class="w-full h-full object-cover" />
              </div>
              <span class="font-display text-ink-strong">${Utils.escapeHTML(w.title)}</span>
            </div>
          </td>
          <td class="text-ink-muted">${Utils.escapeHTML(session.dateLong)}</td>
          <td class="text-ink-muted">${Utils.escapeHTML(session.time || '—')}</td>
          <td class="text-right">${w.capacity || 0}</td>
          <td class="text-right">${w.complimentary || !w.price ? 'Free' : Utils.fmtMoney(w.price)}</td>
          <td class="text-right pr-5 whitespace-nowrap">
            <a href="workshop-edit.html?id=${w.id}" class="text-[11px] uppercase tracking-lux text-brand border-b border-brand/40 hover:border-brand pb-0.5 mr-3">Edit</a>
            <button data-id="${w.id}" data-title="${Utils.escapeHTML(w.title)}" class="ws-delete text-[11px] uppercase tracking-lux text-accent border-b border-accent/40 hover:border-accent pb-0.5">Delete</button>
          </td>
        </tr>`;
    }).join('');

    Utils.qsa('.ws-delete', tbody).forEach(b => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const title = b.getAttribute('data-title');
      if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
      try {
        const result = await GALLERY.api.adminEtkinlik.sil(id);
        if (!result.ok) throw new Error('Delete failed');
        Utils.toast('Workshop deleted');
        await load();
        render();
      } catch (e) {
        Utils.toast(e.message || 'Could not delete workshop');
      }
    }));
  }
})();
