/* ============================================================
   pages/home.js — Anasayfa: trending + koleksiyon (backend bağlı)
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    try {
      const artworks = await GALLERY.api.listArtworks();
      renderTrending(artworks);
      renderCollection(artworks);
    } catch (e) {
      console.warn('home: artworks load failed', e);
      showOffline();
    }
  });

  function showOffline() {
    const trending = Utils.qs('#trending-grid');
    const collection = Utils.qs('#collection-grid');
    const html = '<p class="md:col-span-12 text-ink-muted italic py-12 text-center">Backend offline — start the Go server to see the collection.</p>';
    if (trending) trending.innerHTML = html;
    if (collection) collection.innerHTML = html;
  }

  function renderTrending(artworks) {
    const root = Utils.qs('#trending-grid');
    if (!root) return;
    if (!artworks.length) { root.innerHTML = '<p class="md:col-span-12 text-ink-muted italic">Collection is empty.</p>'; return; }
    const featured = artworks[0];
    const secondary = artworks[1] || artworks[0];
    root.innerHTML = cardLarge(featured) + (secondary ? cardMedium(secondary) : '');
  }

  function cardLarge(a) {
    return `
      <a href="artwork-detail.html?id=${a.id}" class="md:col-span-7 group block">
        <div class="overflow-hidden bg-bg-image aspect-[4/3] relative">
          <span class="absolute top-4 left-4 bg-bg/90 px-3 py-1 text-[10px] uppercase tracking-lux z-10">${Utils.escapeHTML(a.mediumShort || a.category || '')}</span>
          <img src="${Utils.img(a.image || (a.images && a.images[0]), 1200)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom" />
        </div>
        <div class="mt-5 flex justify-between items-start">
          <div>
            <h3 class="font-display text-2xl text-ink-strong">${Utils.escapeHTML(a.title)}</h3>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
          </div>
          <p class="text-brand text-lg">${Utils.fmtMoney(a.price)}</p>
        </div>
      </a>`;
  }

  function cardMedium(a) {
    return `
      <a href="artwork-detail.html?id=${a.id}" class="md:col-span-5 group block">
        <div class="overflow-hidden bg-bg-image aspect-[3/4]">
          <img src="${Utils.img(a.image || (a.images && a.images[0]), 900)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom" />
        </div>
        <div class="mt-5 flex justify-between items-start">
          <div>
            <h3 class="font-display text-xl text-ink-strong">${Utils.escapeHTML(a.title)}</h3>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
          </div>
          <p class="text-brand">${Utils.fmtMoney(a.price)}</p>
        </div>
      </a>`;
  }

  function renderCollection(artworks) {
    const root = Utils.qs('#collection-grid');
    if (!root) return;
    const list = artworks.slice(2, 8);
    if (!list.length) { root.innerHTML = ''; return; }
    const offsets = ['', 'md:mt-24', 'md:mt-12', '', 'md:mt-24', 'md:mt-12'];

    root.innerHTML = list.map((a, i) => `
      <a href="artwork-detail.html?id=${a.id}" class="group block ${offsets[i] || ''}">
        <div class="overflow-hidden bg-bg-image ${a.aspect || 'aspect-[4/5]'} relative">
          ${a.sold ? '<span class="absolute top-4 right-4 bg-ink-strong text-white px-3 py-1 text-[10px] uppercase tracking-lux z-10">Sold Out</span>' : ''}
          <img src="${Utils.img(a.image || (a.images && a.images[0]), 900)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom ${a.sold ? 'opacity-70' : ''}" />
        </div>
        <h3 class="font-display text-2xl text-ink-strong mt-5 ${a.sold ? 'opacity-70' : ''}">${Utils.escapeHTML(a.title)}</h3>
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-2">${Utils.escapeHTML(a.artist)}</p>
        <p class="mt-3 ${a.sold ? 'text-ink-muted line-through' : 'text-brand'}">${Utils.fmtMoney(a.price)}</p>
      </a>
    `).join('');
  }
})();
