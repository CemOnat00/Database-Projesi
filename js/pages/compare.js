/* ============================================================
   pages/compare.js — Karşılaştırma: tab + sütun + save
   ============================================================ */

(function () {
  'use strict';

  let artworks = [];
  let events = [];
  let activeTab = 'artworks';

  Utils.onReady(function () {
    initFromURL();
    bindTabs();
    bindSave();
    renderAll();
  });

  function initFromURL() {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'events') activeTab = 'events';

    const ids = (params.get('ids') || '').split(',').filter(Boolean);
    if (ids.length) {
      if (activeTab === 'events') {
        events = ids.map(GALLERY.getWorkshop).filter(Boolean).slice(0, 3);
      } else {
        artworks = ids.map(GALLERY.getArtwork).filter(Boolean).slice(0, 3);
      }
    }
    // Default seed if no URL params
    if (artworks.length === 0) artworks = GALLERY.ARTWORKS.slice(0, 3);
    if (events.length === 0) events = GALLERY.WORKSHOPS.slice(0, 3);
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
    // Initialize tab from URL
    const btn = Utils.qs(`.tab-btn[data-tab="${activeTab}"]`);
    if (btn) btn.click();
  }

  function bindSave() {
    Utils.qs('#save-btn').addEventListener('click', () => {
      const payload = activeTab === 'events'
        ? { type: 'events', ids: events.map(e => e.id) }
        : { type: 'artworks', ids: artworks.map(a => a.id) };
      Store.Comparisons.save(`Comparison · ${new Date().toLocaleDateString()}`, payload);
      Utils.toast('Comparison saved to your profile');
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
        <a href="artwork-detail.html?id=${a.id}" class="block overflow-hidden bg-bg-image aspect-[4/3] mb-4"><img src="${Utils.img(a.images[0], 600)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover" /></a>
        <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(a.mediumShort)}</p>
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

  function renderArtAttrs() {
    const fields = [
      { label: 'Artist',     key: 'artist' },
      { label: 'Medium',     key: 'medium' },
      { label: 'Dimensions', key: 'dimensions' },
      { label: 'Year',       key: 'year' },
      { label: 'Price',      key: 'price', fmt: v => Utils.fmtMoney(v) },
    ];
    Utils.qs('#art-attrs').innerHTML = fields.map(f => `
      <div class="grid grid-cols-4 border-b border-line">
        <div class="p-4 text-[11px] uppercase tracking-lux text-ink-muted bg-bg">${f.label}</div>
        ${artworks.map(a => `<div class="p-4 text-sm text-ink-strong">${f.fmt ? f.fmt(a[f.key]) : Utils.escapeHTML(String(a[f.key] ?? '—'))}</div>`).join('')}
        ${Array(3 - artworks.length).fill('<div class="p-4 text-ink-faint">—</div>').join('')}
      </div>
    `).join('');
  }

  function renderEventAttrs() {
    const fields = [
      { label: 'Instructor', key: 'instructor' },
      { label: 'Level',      key: 'level' },
      { label: 'Date',       key: 'sessions', fmt: v => (v && v[0] && v[0].dateLong) || '—' },
      { label: 'Capacity',   key: 'capacity' },
      { label: 'Rating',     key: 'stats', fmt: v => (v && v.rating) || '—' },
      { label: 'Price',      key: 'price', fmt: v => v ? Utils.fmtMoney(v) : 'Complimentary' },
    ];
    Utils.qs('#ev-attrs').innerHTML = fields.map(f => `
      <div class="grid grid-cols-4 border-b border-line">
        <div class="p-4 text-[11px] uppercase tracking-lux text-ink-muted bg-bg">${f.label}</div>
        ${events.map(w => `<div class="p-4 text-sm text-ink-strong">${f.fmt ? f.fmt(w[f.key]) : Utils.escapeHTML(String(w[f.key] ?? '—'))}</div>`).join('')}
        ${Array(3 - events.length).fill('<div class="p-4 text-ink-faint">—</div>').join('')}
      </div>
    `).join('');
  }

  // Expose for inline onclick
  window.removeArt = function (i) { artworks.splice(i, 1); renderAll(); };
  window.removeEvent = function (i) { events.splice(i, 1); renderAll(); };
})();
