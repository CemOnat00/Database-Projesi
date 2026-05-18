/* ============================================================
   pages/artwork-detail.js — URL ?id= ile eser yükle, favori,
   thumbnail değiştir, yorum ekle.
   ============================================================ */

(function () {
  'use strict';

  let artwork = null;
  let userRating = 0;

  Utils.onReady(function () {
    const idParam = Utils.paramId('id');
    const id = idParam || 'midnight-resonance';

    // If URL has an id but it's not in the dataset → show not-found and stop
    if (idParam && !GALLERY.ARTWORKS.some(a => a.id === idParam)) {
      renderNotFound(idParam);
      return;
    }

    artwork = GALLERY.getArtwork(id);
    document.title = `${artwork.title} — ${artwork.artist} | The Curated Gallery`;
    renderHero();
    renderInfo();
    renderArtistAndReviews();
    bindForms();

    // Increment view count locally (simulates analytics)
    artwork.stats.views = (artwork.stats.views || 0) + 1;
    Utils.qs('#stat-views').textContent = artwork.stats.views.toLocaleString();
  });

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
    hero.src = Utils.img(artwork.images[0], 1600);
    hero.alt = artwork.title;

    const tg = Utils.qs('#thumb-grid');
    // Show only the artwork's own images — no padding from unrelated pieces
    const imgs = artwork.images.slice(0, 4);
    if (imgs.length <= 1) {
      tg.classList.add('hidden');
    } else {
      tg.classList.remove('hidden');
      // Adjust grid columns to actual count so thumbs sit comfortably
      tg.className = `grid gap-3 grid-cols-${Math.min(imgs.length, 4)}`;
      tg.innerHTML = imgs.map((src, i) => `
        <button class="thumb overflow-hidden aspect-square ${i === 0 ? 'ring-1 ring-ink-strong ring-offset-2 ring-offset-bg' : ''}" data-src="${Utils.img(src, 1600)}" aria-label="View image ${i + 1}">
          <img src="${Utils.img(src, 200)}" alt="${Utils.escapeHTML(artwork.title)} — view ${i + 1}" class="w-full h-full object-cover" />
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

    // Details table
    Utils.qs('#det-medium').textContent = artwork.medium;
    Utils.qs('#det-dim').textContent = artwork.dimensions;
    Utils.qs('#det-year').textContent = artwork.year;
    Utils.qs('#det-edition').textContent = artwork.edition || 'Unique work';
    Utils.qs('#det-auth').textContent = artwork.authenticity || 'Certificate included';
    Utils.qs('#det-shipping').textContent = artwork.shipping || 'Worldwide · insured';

    // Stats
    Utils.qs('#stat-likes').textContent = artwork.stats.likes;
    Utils.qs('#stat-views').textContent = artwork.stats.views.toLocaleString();
    Utils.qs('#stat-reviews').textContent = artwork.stats.reviewCount;

    // Favorite button (backend-ready via GALLERY.api.favorites)
    updateFavButton();
    Utils.qs('#fav-btn').addEventListener('click', async () => {
      const wasOn = Store.Favorites.has(artwork.id);
      const result = await GALLERY.api.favorites.toggle(artwork.id);
      updateFavButton();
      Utils.toast(result.on ? 'Added to favorites' : 'Removed from favorites');
    });
    // Sync if another tab/page edits favorites
    Store.subscribe('favorites', updateFavButton);

    // Add to cart
    Utils.qs('#add-cart-btn').addEventListener('click', () => {
      if (artwork.sold) { Utils.toast('This work is sold.'); return; }
      Store.Cart.add({
        type: 'artwork',
        refId: artwork.id,
        title: artwork.title,
        artist: artwork.artist,
        image: artwork.images[0],
        price: artwork.price,
      });
      Utils.toast('Added to cart');
    });
  }

  function updateFavButton() {
    const fav = Store.Favorites.has(artwork.id);
    const btn = Utils.qs('#fav-btn');
    Utils.qs('#fav-icon').outerHTML = Utils.heart(fav).replace('<svg', '<svg id="fav-icon"');
    Utils.qs('#fav-label').textContent = fav ? 'In Favorites' : 'Add to Favorites';
    btn.classList.toggle('text-accent', fav);
  }

  function renderArtistAndReviews() {
    Utils.qs('#artist-name').textContent = artwork.artist;
    Utils.qs('#artist-bio').textContent = artwork.artistBio
      || 'Biographical details for this artist are being prepared. Write to the curator for an introduction.';

    // Other works by same artist (excluding current). If none, fall back to gallery picks
    // with a different heading so the section stays honest.
    const others = GALLERY.ARTWORKS.filter(a => a.artist === artwork.artist && a.id !== artwork.id).slice(0, 3);
    const heading = Utils.qs('#artist-other-heading');
    let otherList = others;
    if (others.length === 0) {
      otherList = GALLERY.ARTWORKS.filter(a => a.id !== artwork.id).slice(0, 3);
      if (heading) heading.textContent = 'You may also like';
    } else {
      if (heading) heading.textContent = `More by ${artwork.artist}`;
    }

    Utils.qs('#artist-other').innerHTML = otherList.map(o => `
      <a href="artwork-detail.html?id=${o.id}" class="group block">
        <div class="overflow-hidden bg-bg-image aspect-square"><img src="${Utils.img(o.images[0], 600)}" alt="${Utils.escapeHTML(o.title)}" class="w-full h-full object-cover img-zoom" /></div>
        <p class="font-display text-sm text-ink-strong mt-3">${Utils.escapeHTML(o.title)}</p>
        <p class="text-[10px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(o.artist)}</p>
      </a>
    `).join('');

    // Reviews
    const reviews = GALLERY.getReviews(artwork.id);
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    Utils.qs('#rev-stars').innerHTML = `<div class="flex items-center gap-1 text-accent">${Utils.stars(Math.round(avg), 16)}</div>`;
    Utils.qs('#rev-summary').innerHTML = `<strong>${avg}</strong> <span class="text-ink-muted">· ${reviews.length} reviews</span>`;

    const list = Utils.qs('#review-list');
    if (reviews.length === 0) {
      list.innerHTML = `<p class="text-ink-muted italic">No reviews yet — be the first to share an impression.</p>`;
    } else {
      list.innerHTML = reviews.map(reviewCard).join('');
    }
  }

  function reviewCard(r) {
    return `
      <article class="bg-surface border border-line p-7">
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
          </div>` : ''
        }
        <div class="mt-4 flex gap-4 text-[11px] uppercase tracking-lux text-ink-muted">
          <button class="hover:text-brand">▲ Helpful (${r.helpful || 0})</button>
          <button class="hover:text-brand">Reply</button>
        </div>
      </article>`;
  }

  function bindForms() {
    // Star rating
    Utils.qsa('.star').forEach(s => s.addEventListener('click', () => {
      userRating = Number(s.getAttribute('data-r'));
      Utils.qsa('.star').forEach(x => {
        const r = Number(x.getAttribute('data-r'));
        x.classList.toggle('text-accent', r <= userRating);
        x.classList.toggle('text-line', r > userRating);
      });
    }));

    Utils.qs('#review-form').addEventListener('submit', e => {
      e.preventDefault();
      if (userRating === 0) { Utils.toast('Please pick a star rating'); return; }
      if (!Store.User.isAuthed()) {
        // Hint at requirement #15 (only signed-in users)
        Utils.toast('Sign-in required — opening login');
        setTimeout(() => location.href = 'auth.html', 800);
        return;
      }
      Utils.toast('Review submitted for moderation');
      e.target.reset();
      userRating = 0;
      Utils.qsa('.star').forEach(x => { x.classList.remove('text-accent'); x.classList.add('text-line'); });
    });
  }
})();
