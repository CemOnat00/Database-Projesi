/* ============================================================
   pages/compare.js — Karşılaştırma (backend bağlı)
   • Liste backend'den GET /eserler veya /etkinlikler ile çekilir.
   • Save → POST /karsilastir/eserler|etkinlikler + local Store.
   ============================================================ */

(function () {
  'use strict';

  let artworks = [];
  let events = [];
  let activeTab = 'artworks';

  Utils.onReady(async function () {
    initFromURL();
    bindTabs();
    bindSave();
    await loadFromIds();
    renderAll();
  });

  function initFromURL() {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'events') activeTab = 'events';
  }

  async function loadFromIds() {
    const params = new URLSearchParams(location.search);
    const ids = (params.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean);

    if (ids.length === 0) {
      // Default seed: first 3 of each from backend
      try {
        const [a, w] = await Promise.all([
          GALLERY.api.listArtworks(),
          GALLERY.api.listWorkshops(),
        ]);
        artworks = a.slice(0, 3);
        events = w.slice(0, 3);
      } catch (e) { console.warn('compare default load failed', e); }
      return;
    }

    try {
      if (activeTab === 'events') {
        const list = await Promise.all(ids.slice(0, 3).map(id => GALLERY.api.getWorkshop(id).catch(() => null)));
        events = list.filter(Boolean);
        // Diğer sekme için demo
        try { artworks = (await GALLERY.api.listArtworks()).slice(0, 3); } catch (_) { artworks = []; }
      } else {
        const list = await Promise.all(ids.slice(0, 3).map(id => GALLERY.api.getArtwork(id).catch(() => null)));
        artworks = list.filter(Boolean);
        try { events = (await GALLERY.api.listWorkshops()).slice(0, 3); } catch (_) { events = []; }
      }
    } catch (e) { console.warn('compare load failed', e); }
  }

  function bindTabs() {
    Utils.qsa('.tab-btn').forEach(b => b.addEventListener('click', () => {
      Utils.qsa('.tab-btn').forEach(x => {
        x.classList.remove('border-brand','text-ink-strong');
        x.classList.add('border-transparent','text-ink-muted');
      });
      b.classList.add('border-brand','text-ink-strong');
      b.classList.remove('border-transparent','text-ink-muted');
      activeTab = b.getAttribute('data-tab');
      Utils.qsa('.tab-pane').forEach(p => p.classList.add('hidden'));
      Utils.qs(`#tab-${activeTab}`).classList.remove('hidden');
    }));
    const btn = Utils.qs(`.tab-btn[data-tab="${activeTab}"]`);
    if (btn) btn.click();
  }

  function bindSave() {
    Utils.qs('#save-btn').addEventListener('click', async () => {
      if (!Store.User.isAuthed()) {
        Utils.toast('Sign in to save comparisons');
        setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent(location.pathname + location.search), 600);
        return;
      }
      const ids = activeTab === 'events' ? events.map(e => e.id) : artworks.map(a => a.id);
      if (ids.length < 2) { Utils.toast('Pick at least 2 items to compare'); return; }
      try {
        await GALLERY.api.saveComparison(activeTab, ids);
        Utils.toast('Comparison saved to your profile');
      } catch (e) {
        Utils.toast(e.message || 'Could not save comparison');
      }
    });
  }

  function renderAll() {
    renderArtCards();
    renderEventCards();
    renderArtAttrs();
    renderEventAttrs();
  }

  function renderArtCards() {
    const root = Utils.qs('#art-grid');
    root.innerHTML = artworks.map((a, i) => `
      <div class="bg-surface border border-line p-5">
        <a href="artwork-detail.html?id=${a.id}" class="block overflow-hidden bg-bg-image aspect-[4/3] mb-4"><img src="${Utils.img(a.image, 600)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover" /></a>
        <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(a.mediumShort || a.category)}</p>
        <h3 class="font-display text-xl text-ink-strong mt-1">${Utils.escapeHTML(a.title)}</h3>
        <p class="text-sm text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
        <p class="text-brand mt-2">${Utils.fmtMoney(a.price)}</p>
        <button onclick="removeArt(${i})" class="mt-4 text-[10px] uppercase tracking-lux text-accent border-b border-accent/40 pb-0.5 hover:text-brand">Remove</button>
      </div>
    `).join('') + emptyPlaceholders(3 - artworks.length, 'art');
  }

  function renderEventCards() {
    const root = Utils.qs('#ev-grid');
    root.innerHTML = events.map((w, i) => `
      <div class="bg-surface border border-line p-5">
        <a href="workshop-detail.html?id=${w.id}" class="block overflow-hidden bg-bg-image aspect-[4/3] mb-4"><img src="${Utils.img(w.image, 600)}" alt="${Utils.escapeHTML(w.title)}" class="w-full h-full object-cover" /></a>
        <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(w.level)}</p>
        <h3 class="font-display text-xl text-ink-strong mt-1">${Utils.escapeHTML(w.title)}</h3>
        <p class="text-sm text-ink-muted mt-1">${Utils.escapeHTML(w.instructor)}</p>
        <p class="text-brand mt-2">${w.price ? Utils.fmtMoney(w.price) : 'Complimentary'}</p>
        <button onclick="removeEvent(${i})" class="mt-4 text-[10px] uppercase tracking-lux text-accent border-b border-accent/40 pb-0.5 hover:text-brand">Remove</button>
      </div>
    `).join('') + emptyPlaceholders(3 - events.length, 'ev');
  }

  function emptyPlaceholders(n, kind) {
    if (n <= 0) return '';
    const href  = kind === 'ev' ? 'workshops.html' : 'gallery.html';
    const label = kind === 'ev' ? 'Add a workshop to compare' : 'Add an artwork to compare';
    return Array(n).fill(`
      <a href="${href}" class="group bg-surface border border-line border-dashed p-5 flex flex-col items-center justify-center text-ink-faint hover:border-brand hover:text-brand transition-colors min-h-[280px]">
        <span class="w-10 h-10 rounded-full border border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        </span>
        <p class="text-[11px] uppercase tracking-lux">${label}</p>
      </a>`).join('');
  }

  function cap(s) { return String(s || '').replace(/^./, c => c.toUpperCase()); }

  function renderArtAttrs() {
    const fields = [
      { label: 'Artist',     get: a => Utils.escapeHTML(a.artist) },
      { label: 'Category',   get: a => Utils.escapeHTML(cap(a.category)) },
      { label: 'Medium',     get: a => Utils.escapeHTML(a.medium) },
      { label: 'Year',       get: a => a.year },
      { label: 'Price',      get: a => a.sold
          ? `<span class="line-through text-ink-muted">${Utils.fmtMoney(a.price)}</span> · Sold`
          : Utils.fmtMoney(a.price) },
    ];
    Utils.qs('#art-attrs').innerHTML = fields.map(f => `
      <div class="grid grid-cols-4 border-b border-line">
        <div class="p-4 text-[11px] uppercase tracking-lux text-ink-muted bg-bg">${f.label}</div>
        ${artworks.map(a => `<div class="p-4 text-sm text-ink-strong">${f.get(a)}</div>`).join('')}
        ${Array(3 - artworks.length).fill('<div class="p-4 text-ink-faint">—</div>').join('')}
      </div>
    `).join('');
  }

  function renderEventAttrs() {
    const fields = [
      { label: 'Instructor', get: w => Utils.escapeHTML(w.instructor) },
      { label: 'Level',      get: w => Utils.escapeHTML(w.level) },
      { label: 'Date',       get: w => Utils.escapeHTML((w.sessions && w.sessions[0] && w.sessions[0].dateLong) || '—') },
      { label: 'Time',       get: w => Utils.escapeHTML((w.sessions && w.sessions[0] && w.sessions[0].time) || '—') },
      { label: 'Capacity',   get: w => `${w.spotsLeft} of ${w.capacity} seats` },
      { label: 'Price',      get: w => w.complimentary || !w.price ? 'Complimentary' : Utils.fmtMoney(w.price) },
    ];
    Utils.qs('#ev-attrs').innerHTML = fields.map(f => `
      <div class="grid grid-cols-4 border-b border-line">
        <div class="p-4 text-[11px] uppercase tracking-lux text-ink-muted bg-bg">${f.label}</div>
        ${events.map(w => `<div class="p-4 text-sm text-ink-strong">${f.get(w)}</div>`).join('')}
        ${Array(3 - events.length).fill('<div class="p-4 text-ink-faint">—</div>').join('')}
      </div>
    `).join('');
  }

  window.removeArt = function (i) { artworks.splice(i, 1); renderAll(); };
  window.removeEvent = function (i) { events.splice(i, 1); renderAll(); };
})();
