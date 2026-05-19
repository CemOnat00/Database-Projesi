/* ============================================================
   pages/gallery.js — Eser listeleme (backend bağlı):
     • GALLERY.api.listArtworks() → /eserler
     • Filtre/sort client-side
     • Favori toggle → POST/DELETE /favoriler
   ============================================================ */

(function () {
  'use strict';

  const state = { search: '', medium: 'all', price: 'all', sort: 'curators' };
  let artworks = [];      // mapped list
  let favoriteIds = new Set();

  Utils.onReady(async function () {
    bindFilters();
    await Promise.all([loadArtworks(), loadFavoritesIfAuthed()]);
    render();
    Store.subscribe('favorites', render); // local sync (e.g., toggled elsewhere)
  });

  async function loadArtworks() {
    try {
      artworks = await GALLERY.api.listArtworks();
    } catch (e) {
      console.warn('gallery: artworks failed', e);
      artworks = [];
    }
  }

  async function loadFavoritesIfAuthed() {
    if (!Store.User.isAuthed()) return;
    try {
      const ids = await GALLERY.api.favorites.list();
      favoriteIds = new Set(ids.map(Number));
    } catch (e) {
      console.warn('gallery: favorites failed', e);
    }
  }

  function bindFilters() {
    const s = Utils.qs('#flt-search');
    const m = Utils.qs('#flt-medium');
    const p = Utils.qs('#flt-price');
    const o = Utils.qs('#flt-sort');
    if (s) s.addEventListener('input', Utils.debounce(e => { state.search = e.target.value.trim().toLowerCase(); render(); }, 200));
    if (m) m.addEventListener('change', e => { state.medium = e.target.value; render(); });
    if (p) p.addEventListener('change', e => { state.price = e.target.value; render(); });
    if (o) o.addEventListener('change', e => { state.sort = e.target.value; render(); });
  }

  function applyFilters(arr) {
    let out = arr.slice();
    if (state.search) {
      out = out.filter(a =>
        a.title.toLowerCase().includes(state.search) ||
        a.artist.toLowerCase().includes(state.search) ||
        (a.mediumShort || '').toLowerCase().includes(state.search));
    }
    if (state.medium !== 'all') out = out.filter(a => a.category === state.medium);
    if (state.price !== 'all') {
      const buckets = {
        under1k:  a => a.price < 1000,
        '1k-3k':  a => a.price >= 1000 && a.price < 3000,
        '3k-10k': a => a.price >= 3000 && a.price < 10000,
        over10k:  a => a.price >= 10000,
      };
      out = out.filter(buckets[state.price]);
    }
    if (state.sort === 'newest') out.sort((a, b) => b.year - a.year);
    else if (state.sort === 'asc')  out.sort((a, b) => a.price - b.price);
    else if (state.sort === 'desc') out.sort((a, b) => b.price - a.price);
    return out;
  }

  function render() {
    const grid = Utils.qs('#artworks-grid');
    const empty = Utils.qs('#empty-state');
    if (!grid) return;
    const arr = applyFilters(artworks);
    if (arr.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    grid.innerHTML = arr.map(card).join('');

    Utils.qsa('.fav-btn', grid).forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        if (!Store.User.isAuthed()) {
          Utils.toast('Sign in to save favorites');
          setTimeout(() => location.href = 'auth.html?next=gallery.html', 600);
          return;
        }
        const id = Number(btn.getAttribute('data-id'));
        try {
          const isFav = favoriteIds.has(id);
          if (isFav) {
            await GALLERY.api.favorites.remove(id);
            favoriteIds.delete(id);
            Utils.toast('Removed from favorites');
          } else {
            await GALLERY.api.favorites.add(id);
            favoriteIds.add(id);
            Utils.toast('Added to favorites');
          }
          render();
        } catch (err) {
          Utils.toast(err.message || 'Could not update favorites');
        }
      });
    });
  }

  function card(a) {
    const fav = favoriteIds.has(Number(a.id));
    return `
      <a href="artwork-detail.html?id=${a.id}" class="group block">
        <div class="relative overflow-hidden bg-bg-image ${a.aspect || 'aspect-[4/5]'}">
          ${a.sold ? '<span class="absolute top-4 right-4 bg-ink-strong text-white px-3 py-1 text-[10px] uppercase tracking-lux z-10">Sold</span>' : ''}
          <span class="absolute top-4 left-4 bg-bg/90 px-3 py-1 text-[10px] uppercase tracking-lux z-10">${Utils.escapeHTML(a.mediumShort || a.category || '')}</span>
          <img src="${Utils.img(a.image || (a.images && a.images[0]), 900)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom ${a.sold ? 'opacity-70' : ''}" />
          <button data-id="${a.id}" aria-label="Toggle favorite" class="fav-btn absolute bottom-4 right-4 w-10 h-10 bg-bg/90 hover:bg-white flex items-center justify-center transition-colors ${fav ? 'text-accent' : 'text-ink-strong'}">
            ${Utils.heart(fav)}
          </button>
        </div>
        <div class="mt-5 flex justify-between items-start">
          <div>
            <h3 class="font-display text-xl text-ink-strong">${Utils.escapeHTML(a.title)}</h3>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
          </div>
          <p class="${a.sold ? 'text-ink-muted line-through' : 'text-brand'}">${Utils.fmtMoney(a.price)}</p>
        </div>
      </a>`;
  }
})();
