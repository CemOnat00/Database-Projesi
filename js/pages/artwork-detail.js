/* ============================================================
   pages/artwork-detail.js — URL ?id= ile eser yükle (backend bağlı)
     • GET /eserler/:id          → detay
     • GET /yorumlar/:id?tip=eser → yorumlar (sort param)
     • POST /yorumlar             → yorum gönder (giriş gerekli)
     • POST /yorumlar/:id/faydali → helpful oy
     • POST /favoriler / DELETE /favoriler/:id → favori toggle
     • POST /admin/yorumlar/:id/yanit → admin yanıtı (yalnızca admin)
   ============================================================ */

(function () {
  'use strict';

  let artwork = null;
  let allArtworks = [];   // sanatçının diğer eserleri için
  let userRating = 0;
  let reviewSort = 'recent';
  let isFavorite = false;

  Utils.onReady(init);

  async function init() {
    const idParam = Utils.paramId('id');
    const id = idParam || null;
    if (!id) { renderNotFound('—'); return; }

    try {
      artwork = await GALLERY.api.getArtwork(id);
    } catch (e) {
      console.warn('artwork-detail: load failed', e);
      renderNotFound(id);
      return;
    }
    if (!artwork) { renderNotFound(id); return; }

    document.title = `${artwork.title} — ${artwork.artist} | The Curated Gallery`;

    renderHero();
    renderInfo();
    await loadFavoriteState();
    updateFavButton();
    bindActions();

    // Diğer eserler (sanatçıya göre)
    try { allArtworks = await GALLERY.api.listArtworks(); } catch (_) { allArtworks = []; }
    renderArtistAndReviews();
    bindForms();
  }

  async function loadFavoriteState() {
    if (!Store.User.isAuthed()) { isFavorite = false; return; }
    try {
      const ids = await GALLERY.api.favorites.list();
      isFavorite = ids.includes(Number(artwork.id));
    } catch (_) { isFavorite = false; }
  }

  function renderNotFound(id) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
      <section class="max-w-3xl mx-auto px-6 lg:px-12 py-32 text-center">
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-4">Not Found</p>
        <h1 class="font-display text-5xl text-ink-strong">This work is no longer on view.</h1>
        <p class="mt-6 text-ink-muted">We could not find an artwork with the reference <code class="text-brand">${Utils.escapeHTML(id)}</code> in the current collection.</p>
        <div class="mt-10 flex justify-center gap-3">
          <a href="gallery.html" class="bg-brand hover:bg-brand-hover text-white px-8 py-4 text-[11px] uppercase tracking-lux transition-colors">Browse the Collection</a>
          <a href="support.html" class="border border-ink-strong/30 px-8 py-4 text-[11px] uppercase tracking-lux text-ink-strong hover:bg-ink-strong hover:text-white transition-colors">Ask the Curator</a>
        </div>
      </section>`;
  }

  function renderHero() {
    Utils.qs('#bc-medium').textContent = artwork.mediumShort;
    Utils.qs('#bc-title').textContent = artwork.title;

    const hero = Utils.qs('#hero-image');
    hero.src = Utils.img(artwork.images[0] || artwork.image, 1600);
    hero.alt = artwork.title;

    const tg = Utils.qs('#thumb-grid');
    // Tüm görseller sırayla — admin'in yüklediği sırada (4'ten fazlası alt satıra geçer)
    const imgs = (artwork.images || []);
    if (imgs.length <= 1) {
      tg.classList.add('hidden');
    } else {
      tg.classList.remove('hidden');
      tg.className = 'grid gap-3 grid-cols-4';
      tg.innerHTML = imgs.map((src, i) => `
        <button class="thumb overflow-hidden aspect-square ${i === 0 ? 'ring-1 ring-ink-strong ring-offset-2 ring-offset-bg' : ''}" data-src="${Utils.img(src, 1600)}" aria-label="View image ${i + 1}">
          <img src="${Utils.img(src, 300)}" alt="${Utils.escapeHTML(artwork.title)} — view ${i + 1}" class="w-full h-full object-cover" />
        </button>
      `).join('');
      Utils.qsa('.thumb', tg).forEach(b => b.addEventListener('click', () => {
        hero.src = b.getAttribute('data-src');
        Utils.qsa('.thumb', tg).forEach(x => x.classList.remove('ring-1','ring-ink-strong','ring-offset-2','ring-offset-bg'));
        b.classList.add('ring-1','ring-ink-strong','ring-offset-2','ring-offset-bg');
      }));
    }
  }

  function renderInfo() {
    Utils.qs('#a-meta-line').textContent = `${artwork.mediumShort} · ${artwork.year}`;
    Utils.qs('#a-title').textContent = artwork.title;
    Utils.qs('#a-artist').textContent = `by ${artwork.artist}`;
    Utils.qs('#a-desc').textContent = artwork.description;
    Utils.qs('#a-price').innerHTML = `${Utils.fmtMoney(artwork.price)} <span class="text-base text-ink-muted">USD</span>`;

    Utils.qs('#det-medium').textContent = artwork.medium;
    Utils.qs('#det-dim').textContent = artwork.dimensions || '—';
    Utils.qs('#det-year').textContent = artwork.year;
    Utils.qs('#det-edition').textContent = artwork.edition || 'Unique work';
    Utils.qs('#det-auth').textContent = artwork.authenticity || 'Certificate included';
    Utils.qs('#det-shipping').textContent = artwork.shipping || 'Worldwide · insured';

    Utils.qs('#stat-likes').textContent = artwork.stats.likes || 0;
    Utils.qs('#stat-views').textContent = (artwork.stats.views || 0).toLocaleString();
    Utils.qs('#stat-reviews').textContent = artwork.stats.reviewCount || 0;
  }

  function bindActions() {
    Utils.qs('#fav-btn').addEventListener('click', async () => {
      if (!Store.User.isAuthed()) {
        Utils.toast('Sign in to save favorites');
        setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent(location.pathname + location.search), 600);
        return;
      }
      try {
        if (isFavorite) {
          await GALLERY.api.favorites.remove(artwork.id);
          isFavorite = false;
          Utils.toast('Removed from favorites');
        } else {
          await GALLERY.api.favorites.add(artwork.id);
          isFavorite = true;
          Utils.toast('Added to favorites');
        }
        updateFavButton();
      } catch (e) {
        Utils.toast(e.message || 'Could not update favorite');
      }
    });
    Store.subscribe('favorites', (list) => {
      const ids = Array.isArray(list) ? list.map(Number) : Store.Favorites.list().map(Number);
      isFavorite = ids.includes(Number(artwork.id));
      updateFavButton();
    });

    Utils.qs('#add-cart-btn').addEventListener('click', () => {
      if (artwork.sold) { Utils.toast('This work is sold.'); return; }
      Store.Cart.add({
        type: 'artwork',
        refId: artwork.id,
        title: artwork.title,
        artist: artwork.artist,
        image: artwork.images[0] || artwork.image,
        price: artwork.price,
      });
      Utils.toast('Added to cart');
    });
  }

  function updateFavButton() {
    const btn = Utils.qs('#fav-btn');
    if (!btn) return;
    Utils.qs('#fav-icon').outerHTML = Utils.heart(isFavorite).replace('<svg', '<svg id="fav-icon"');
    Utils.qs('#fav-label').textContent = isFavorite ? 'In Favorites' : 'Add to Favorites';
    btn.classList.toggle('text-accent', isFavorite);
  }

  function renderArtistAndReviews() {
    Utils.qs('#artist-name').textContent = artwork.artist;
    Utils.qs('#artist-bio').textContent = artwork.artistBio
      || 'Biographical details for this artist are being prepared. Write to the curator for an introduction.';

    const others = allArtworks.filter(a => a.artistId === artwork.artistId && a.id !== artwork.id).slice(0, 3);
    const heading = Utils.qs('#artist-other-heading');
    let otherList = others;
    if (others.length === 0) {
      otherList = allArtworks.filter(a => a.id !== artwork.id).slice(0, 3);
      if (heading) heading.textContent = 'You may also like';
    } else if (heading) {
      heading.textContent = `More by ${artwork.artist}`;
    }

    Utils.qs('#artist-other').innerHTML = otherList.map(o => `
      <a href="artwork-detail.html?id=${o.id}" class="group block">
        <div class="overflow-hidden bg-bg-image aspect-square"><img src="${Utils.img(o.images[0] || o.image, 600)}" alt="${Utils.escapeHTML(o.title)}" class="w-full h-full object-cover img-zoom" /></div>
        <p class="font-display text-sm text-ink-strong mt-3">${Utils.escapeHTML(o.title)}</p>
        <p class="text-[10px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(o.artist)}</p>
      </a>
    `).join('');

    renderReviewList();

    const sortEl = Utils.qs('#review-sort');
    if (sortEl) {
      sortEl.addEventListener('change', e => {
        reviewSort = ({ 'Most Recent': 'recent', 'Highest Rated': 'rating', 'Most Helpful': 'helpful' })[e.target.value] || 'recent';
        renderReviewList();
      });
    }
  }

  async function renderReviewList() {
    const list = Utils.qs('#review-list');
    list.innerHTML = '<p class="md:col-span-2 text-ink-muted italic">Loading reviews…</p>';

    let reviews = [];
    let meta = { average: 0, total: 0 };
    try {
      reviews = await GALLERY.api.listReviews(artwork.id, reviewSort, 'eser');
      meta = reviews.meta || meta;
    } catch (e) {
      console.warn('listReviews failed', e);
      list.innerHTML = '<p class="md:col-span-2 text-ink-muted italic">Reviews unavailable right now.</p>';
      return;
    }

    const avg = reviews.length
      ? (meta.average || (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)).toFixed(1)
      : '0.0';
    Utils.qs('#rev-stars').innerHTML = `<div class="flex items-center gap-1 text-accent">${Utils.stars(Math.round(Number(avg)), 16)}</div>`;
    Utils.qs('#rev-summary').innerHTML = `<strong>${avg}</strong> <span class="text-ink-muted">· ${meta.total || reviews.length} reviews</span>`;

    if (reviews.length === 0) {
      list.innerHTML = `<p class="md:col-span-2 text-ink-muted italic">No reviews yet — be the first to share an impression.</p>`;
      return;
    }

    const isAdmin = Store.User.isAdmin();
    list.innerHTML = reviews.map((r, idx) => reviewCard(r, idx, isAdmin)).join('');

    Utils.qsa('.helpful-btn', list).forEach(b => b.addEventListener('click', async () => {
      if (!Store.User.isAuthed()) {
        Utils.toast('Sign in to vote');
        setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent(location.pathname + location.search), 600);
        return;
      }
      const idx = Number(b.getAttribute('data-idx'));
      const reviewId = Number(b.getAttribute('data-rid'));
      try {
        await GALLERY.api.toggleReviewHelpful(artwork.id, idx, reviewId);
        Utils.toast('Vote recorded');
        renderReviewList();
      } catch (e) {
        Utils.toast(e.message || 'Could not vote');
      }
    }));

    if (isAdmin) {
      Utils.qsa('.admin-reply-save', list).forEach(b => b.addEventListener('click', async () => {
        const reviewId = Number(b.getAttribute('data-rid'));
        const card = b.closest('[data-rid]');
        const input = card.querySelector('.admin-reply-input');
        const text = (input ? input.value : '').trim();
        if (text.length < 5) { Utils.toast('Reply must be at least 5 characters'); return; }
        try {
          await GALLERY.api.replyToReview(reviewId, text);
          Utils.toast('Reply posted');
          renderReviewList();
        } catch (e) {
          Utils.toast(e.message || 'Could not post reply');
        }
      }));
    }
  }

  function reviewCard(r, idx, isAdmin) {
    const adminBox = isAdmin && !r.reply ? `
      <div class="mt-5 bg-bg border border-line border-dashed p-4" data-rid="${r.id}">
        <p class="text-[10px] uppercase tracking-lux text-ink-muted mb-2">Curator Reply (admin)</p>
        <textarea class="admin-reply-input w-full border border-line p-2 text-sm bg-transparent focus:outline-none focus:border-brand resize-none" rows="2" placeholder="Write a curator's response…"></textarea>
        <button type="button" class="admin-reply-save mt-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 text-[10px] uppercase tracking-lux" data-rid="${r.id}">Post Reply</button>
      </div>` : '';
    return `
      <article class="bg-surface border border-line p-7" data-rid="${r.id}">
        <header class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-display text-lg text-ink-strong">${Utils.escapeHTML(r.author)}</h3>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(r.date)}</p>
          </div>
          ${r.verified ? '<span class="text-[10px] uppercase tracking-lux text-accent border border-accent/30 px-2 py-1">Verified Buyer</span>' : ''}
        </header>
        <div class="flex gap-0.5 text-accent mb-3">${Utils.stars(r.rating, 13)}</div>
        <p class="font-display italic text-ink-strong leading-relaxed">${Utils.escapeHTML(r.body)}</p>
        ${r.reply ? `
          <div class="mt-5 bg-bg-soft border-l-2 border-brand p-4">
            <p class="text-[10px] uppercase tracking-lux text-ink-muted mb-1">Curator's Response</p>
            <p class="text-sm text-ink-strong">${Utils.escapeHTML(r.reply)}</p>
          </div>` : ''}
        ${adminBox}
        <div class="mt-4 flex gap-4 text-[11px] uppercase tracking-lux text-ink-muted">
          <button class="helpful-btn hover:text-brand" data-idx="${idx}" data-rid="${r.id}">▲ Helpful (${r.helpful || 0})</button>
        </div>
      </article>`;
  }

  function bindForms() {
    Utils.qsa('.star').forEach(s => s.addEventListener('click', () => {
      userRating = Number(s.getAttribute('data-r'));
      Utils.qsa('.star').forEach(x => {
        const r = Number(x.getAttribute('data-r'));
        x.classList.toggle('text-accent', r <= userRating);
        x.classList.toggle('text-line', r > userRating);
      });
    }));

    Utils.qs('#review-form').addEventListener('submit', async e => {
      e.preventDefault();
      if (userRating === 0) { Utils.toast('Please pick a star rating'); return; }
      if (!Store.User.isAuthed()) {
        Utils.toast('Sign-in required — opening login');
        setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent(location.pathname + location.search), 800);
        return;
      }
      const fd = new FormData(e.target);
      const body = (fd.get('body') || '').toString().trim();
      if (body.length < 10) { Utils.toast('Please share at least 10 characters'); return; }

      try {
        await GALLERY.api.createReview(artwork.id, { rating: userRating, body }, 'eser');
        Utils.toast('Review submitted');
        e.target.reset();
        userRating = 0;
        Utils.qsa('.star').forEach(x => { x.classList.remove('text-accent'); x.classList.add('text-line'); });
        renderReviewList();
      } catch (err) {
        Utils.toast(err.message || 'Could not submit review');
      }
    });
  }
})();
