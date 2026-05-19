/* ============================================================
   pages/admin/artworks.js — Eser listesi + CRUD aksiyonları
   • Liste backend'den (GET /eserler — gerçek)
   • Delete: GALLERY.api.adminEser.sil (demo stub)
   • Edit/Add: artwork-edit.html sayfasına yönlendir
   ============================================================ */

(function () {
  'use strict';

  let artworks = [];
  const state = { search: '', category: 'all' };

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/artworks.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    bindFilters();
    await loadArtworks();
    render();
  });

  async function loadArtworks() {
    try {
      artworks = await GALLERY.api.listArtworks();
    } catch (e) {
      console.warn('admin/artworks: load failed', e);
      artworks = [];
    }
  }

  function bindFilters() {
    Utils.qs('#art-search')?.addEventListener('input', Utils.debounce(e => {
      state.search = e.target.value.trim().toLowerCase();
      render();
    }, 200));
    Utils.qs('#art-category')?.addEventListener('change', e => {
      state.category = e.target.value;
      render();
    });
  }

  function filtered() {
    let out = artworks.slice();
    if (state.search) {
      out = out.filter(a =>
        a.title.toLowerCase().includes(state.search) ||
        a.artist.toLowerCase().includes(state.search));
    }
    if (state.category !== 'all') {
      out = out.filter(a => a.category === state.category);
    }
    return out;
  }

  function render() {
    const tbody = Utils.qs('#artworks-tbody');
    const empty = Utils.qs('#artworks-empty');
    const counter = Utils.qs('#art-counter');
    if (!tbody) return;

    const list = filtered();
    if (counter) counter.textContent = `${list.length} of ${artworks.length} ${artworks.length === 1 ? 'artwork' : 'artworks'} in catalogue`;

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = list.map(a => `
      <tr>
        <td class="px-5 py-4 text-ink-muted">#${a.id}</td>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 overflow-hidden bg-bg-image flex-shrink-0">
              <img src="${Utils.img(a.image || (a.images && a.images[0]), 80)}" alt="" class="w-full h-full object-cover" />
            </div>
            <span class="font-display text-ink-strong">${Utils.escapeHTML(a.title)}</span>
          </div>
        </td>
        <td>${Utils.escapeHTML(a.artist)}</td>
        <td class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(a.category || '—')}</td>
        <td class="text-right">${Utils.fmtMoney(a.price)}</td>
        <td class="text-right ${a.stock === 0 ? 'text-accent' : 'text-ink-strong'}">${a.stock != null ? a.stock : '—'}</td>
        <td class="text-right pr-5 whitespace-nowrap">
          <a href="artwork-edit.html?id=${a.id}" class="text-[11px] uppercase tracking-lux text-brand border-b border-brand/40 hover:border-brand pb-0.5 mr-3">Edit</a>
          <button data-id="${a.id}" data-title="${Utils.escapeHTML(a.title)}" class="art-delete text-[11px] uppercase tracking-lux text-accent border-b border-accent/40 hover:border-accent pb-0.5">Delete</button>
        </td>
      </tr>
    `).join('');

    Utils.qsa('.art-delete', tbody).forEach(b => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      const title = b.getAttribute('data-title');
      if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
      try {
        const result = await GALLERY.api.adminEser.sil(id);
        if (!result.ok) throw new Error('Delete failed');
        Utils.toast('Artwork deleted');
        await loadArtworks();
        render();
      } catch (e) {
        Utils.toast(e.message || 'Could not delete artwork');
      }
    }));
  }
})();
