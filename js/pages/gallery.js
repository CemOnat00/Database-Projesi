/* ============================================================
   pages/gallery.js — Eser listeleme: filtre + sort + favori toggle
   ============================================================ */

(function () {
  'use strict';

  const state = {
    search: '',
    medium: 'all',
    price: 'all',
    sort: 'curators',
  };

  Utils.onReady(function () {
    bindFilters();
    render();

    // Favori değişikliklerinde rozet/kalp güncellensin
    Store.subscribe('favorites', render);
  });

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
        (a.mediumShort || '').toLowerCase().includes(state.search)
      );
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
    const arr = applyFilters(GALLERY.ARTWORKS);
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
        const id = btn.getAttribute('data-id');
        const result = await GALLERY.api.favorites.toggle(id);
        Utils.toast(result.on ? 'Added to favorites' : 'Removed from favorites');
      });
    });
  }

  function card(a) {
    const fav = Store.Favorites.has(a.id);
    const camp = a.campaign;
    const campClass = camp && camp.type === 'sale' ? 'bg-accent text-white'
                    : camp && camp.type === 'new'  ? 'bg-brand text-white'
                    : 'bg-ink-strong text-white';
    const campaignBadge = camp
      ? `<span class="absolute top-4 right-4 ${campClass} px-3 py-1 text-[10px] uppercase tracking-lux z-10">${Utils.escapeHTML(camp.label)}</span>`
      : '';
    const soldBadge = a.sold
      ? '<span class="absolute top-4 right-4 bg-ink-strong text-white px-3 py-1 text-[10px] uppercase tracking-lux z-10">Sold</span>'
      : '';
    // sold overrides campaign on the same corner
    const cornerBadge = a.sold ? soldBadge : campaignBadge;

    // Compute campaign-discounted price
    const hasSale = camp && camp.type === 'sale' && camp.pct;
    const salePrice = hasSale ? Math.round(a.price * (100 - camp.pct) / 100) : null;

    return `
      <a href="artwork-detail.html?id=${a.id}" class="group block">
        <div class="relative overflow-hidden bg-bg-image ${a.aspect}">
          ${cornerBadge}
          <span class="absolute top-4 left-4 bg-bg/90 px-3 py-1 text-[10px] uppercase tracking-lux z-10">${Utils.escapeHTML(a.mediumShort)}</span>
          <img src="${Utils.img(a.images[0], 900)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom ${a.sold ? 'opacity-70' : ''}" />
          <button data-id="${a.id}" aria-label="Toggle favorite" class="fav-btn absolute bottom-4 right-4 w-10 h-10 bg-bg/90 hover:bg-white flex items-center justify-center transition-colors ${fav ? 'text-accent' : 'text-ink-strong'}">
            ${Utils.heart(fav)}
          </button>
        </div>
        <div class="mt-5 flex justify-between items-start">
          <div>
            <h3 class="font-display text-xl text-ink-strong">${Utils.escapeHTML(a.title)}</h3>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
          </div>
          <p class="${a.sold ? 'text-ink-muted line-through' : 'text-brand'}">
            ${hasSale && !a.sold
              ? `<span class="line-through text-ink-muted text-sm mr-1">${Utils.fmtMoney(a.price)}</span><span class="text-accent">${Utils.fmtMoney(salePrice)}</span>`
              : Utils.fmtMoney(a.price)}
          </p>
        </div>
      </a>`;
  }
})();
