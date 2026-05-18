/* ============================================================
   pages/home.js — Anasayfa: featured, trending, koleksiyon
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(function () {
    renderTrending();
    renderCollection();
  });

  function renderTrending() {
    const root = Utils.qs('#trending-grid');
    if (!root) return;
    const featured = GALLERY.ARTWORKS.find(a => a.featured) || GALLERY.ARTWORKS[0];
    const secondary = GALLERY.ARTWORKS[7] || GALLERY.ARTWORKS[1];
    root.innerHTML = `
      ${cardLarge(featured)}
      ${cardMedium(secondary)}
    `;
  }

  function cardLarge(a) {
    return `
      <a href="artwork-detail.html?id=${a.id}" class="md:col-span-7 group block">
        <div class="overflow-hidden bg-bg-image aspect-[4/3] relative">
          <span class="absolute top-4 left-4 bg-bg/90 px-3 py-1 text-[10px] uppercase tracking-lux z-10">${Utils.escapeHTML(a.mediumShort)}</span>
          <img src="${Utils.img(a.images[0], 1200)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom" />
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
          <img src="${Utils.img(a.images[0], 900)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom" />
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

  function renderCollection() {
    const root = Utils.qs('#collection-grid');
    if (!root) return;
    const list = GALLERY.ARTWORKS.slice(2, 8);
    const offsets = ['', 'md:mt-24', 'md:mt-12', '', 'md:mt-24', 'md:mt-12'];

    root.innerHTML = list.map((a, i) => `
      <a href="artwork-detail.html?id=${a.id}" class="group block ${offsets[i] || ''}">
        <div class="overflow-hidden bg-bg-image ${a.aspect} relative">
          ${a.sold ? '<span class="absolute top-4 right-4 bg-ink-strong text-white px-3 py-1 text-[10px] uppercase tracking-lux z-10">Sold Out</span>' : ''}
          <img src="${Utils.img(a.images[0], 900)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom ${a.sold ? 'opacity-70' : ''}" />
        </div>
        <h3 class="font-display text-2xl text-ink-strong mt-5 ${a.sold ? 'opacity-70' : ''}">${Utils.escapeHTML(a.title)}</h3>
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-2">${Utils.escapeHTML(a.artist)}</p>
        <p class="mt-3 ${a.sold ? 'text-ink-muted line-through' : 'text-brand'}">${Utils.fmtMoney(a.price)}</p>
      </a>
    `).join('');
  }
})();
