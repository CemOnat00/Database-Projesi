/* ============================================================
   pages/admin/artists.js — Sanatçı listesi + CRUD
   • Liste: GET /sanatcilar (gerçek)
   • Delete: adminSanatci.sil (demo stub)
   ============================================================ */

(function () {
  'use strict';

  let artists = [];

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/artists.html', 400);
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
    try { artists = await GALLERY.api.adminSanatci.listele(); }
    catch (e) { console.warn('admin/artists: load failed', e); artists = []; }
  }

  function render() {
    const tbody = Utils.qs('#artists-tbody');
    const empty = Utils.qs('#artists-empty');
    const counter = Utils.qs('#art-counter');
    if (!tbody) return;

    if (counter) counter.textContent = `${artists.length} ${artists.length === 1 ? 'artist' : 'artists'} on the roster`;

    if (artists.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = artists.map(a => {
      const bio = (a.biography || '').slice(0, 120);
      const truncated = (a.biography || '').length > 120 ? '…' : '';
      return `
        <tr>
          <td class="px-5 py-4 text-ink-muted">#${a.id}</td>
          <td><span class="font-display text-ink-strong">${Utils.escapeHTML(a.name)}</span></td>
          <td class="text-ink-muted">${Utils.escapeHTML(bio + truncated) || '<span class="italic">No biography</span>'}</td>
          <td class="text-right pr-5 whitespace-nowrap">
            <a href="artist-edit.html?id=${a.id}" class="text-[11px] uppercase tracking-lux text-brand border-b border-brand/40 hover:border-brand pb-0.5 mr-3">Edit</a>
            <button data-id="${a.id}" data-name="${Utils.escapeHTML(a.name)}" class="ar-delete text-[11px] uppercase tracking-lux text-accent border-b border-accent/40 hover:border-accent pb-0.5">Delete</button>
          </td>
        </tr>`;
    }).join('');

    Utils.qsa('.ar-delete', tbody).forEach(b => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const name = b.getAttribute('data-name');
      if (!confirm(`Delete "${name}"? Their artworks will lose their author reference.`)) return;
      try {
        const result = await GALLERY.api.adminSanatci.sil(id);
        if (!result.ok) throw new Error('Delete failed');
        Utils.toast('Artist deleted');
        await load();
        render();
      } catch (e) {
        Utils.toast(e.message || 'Could not delete artist');
      }
    }));
  }
})();
