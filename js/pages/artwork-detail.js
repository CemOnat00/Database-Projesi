/* ============================================================
   pages/artwork-detail.js — URL ?id= ile eser yükle, favori,
   thumbnail değiştir, yorum ekle.
   ============================================================ */

(function () {
  'use strict';

  let artwork = null;
  let userRating = 0;
  let reviewSort = 'recent'; // 'recent' | 'rating' | 'helpful'

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

    // Reviews — sorted via API, sort select hooked up, helpful clickable
    renderReviewList();

    // Bind the sort dropdown (Req 13)
    const sortEl = Utils.qs('#review-sort');
    if (sortEl) {
      sortEl.addEventListener('change', e => {
        reviewSort = ({ 'Most Recent': 'recent', 'Highest Rated': 'rating', 'Most Helpful': 'helpful' })[e.target.value] || 'recent';
        renderReviewList();
      });
    }
  }

  async function renderReviewList() {
    const reviews = await GALLERY.api.listReviews(artwork.id, reviewSort);
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    Utils.qs('#rev-stars').innerHTML = `<div class="flex items-center gap-1 text-accent">${Utils.stars(Math.round(avg), 16)}</div>`;
    Utils.qs('#rev-summary').innerHTML = `<strong>${avg}</strong> <span class="text-ink-muted">· ${reviews.length} reviews</span>`;

    const list = Utils.qs('#review-list');
    if (reviews.length === 0) {
      list.innerHTML = `<p class="text-ink-muted italic">No reviews yet — be the first to share an impression.</p>`;
      return;
    }
    // We need indexes that map back into GALLERY.REVIEWS[artwork.id] so the helpful
    // counter increments the correct record regardless of current sort order.
    const original = GALLERY.getReviews(artwork.id);
    list.innerHTML = reviews.map(r => {
      const realIdx = original.indexOf(r);
      return reviewCard(r, realIdx);
    }).join('');

    Utils.qsa('.helpful-btn', list).forEach(b => b.addEventListener('click', async () => {
      const idx = Number(b.getAttribute('data-idx'));
      const result = await GALLERY.api.toggleReviewHelpful(artwork.id, idx);
      if (!result.ok) return;
      Utils.toast(result.on ? 'Marked helpful' : 'Vote removed');
      renderReviewList();
    }));

    // Admin reply toggle
    Utils.qsa('.reply-toggle', list).forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('[data-review-idx]');
        const form = card.querySelector('.reply-form');
        if (!form) return;
        form.classList.toggle('hidden');
        if (!form.classList.contains('hidden')) {
          const input = form.querySelector('.reply-input');
          if (input) input.focus();
        }
      });
    });

    // Admin reply save
    Utils.qsa('.reply-save', list).forEach(btn => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('[data-review-idx]');
        const idx = Number(btn.getAttribute('data-idx'));
        const input = card.querySelector('.reply-input');
        const text = (input ? input.value : '').trim();
        if (!text) { Utils.toast('Reply text is required'); return; }
        const result = await GALLERY.api.replyToReview(artwork.id, idx, text);
        if (!result.ok) { Utils.toast('Could not save reply'); return; }
        Utils.toast('Curator reply saved');
        renderReviewList();
      });
    });

    // Admin reply cancel
    Utils.qsa('.reply-cancel', list).forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('[data-review-idx]');
        card.querySelector('.reply-form')?.classList.add('hidden');
      });
    });
  }

  function reviewCard(r, idx) {
    const voted = Store.ReviewVotes.has(`${artwork.id}:${idx}`);
    const isAdmin = Store.User.isAdmin();
    const hasReply = !!r.reply;
    return `
      <article class="bg-surface border border-line p-7" data-review-idx="${idx}">
        <header class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-display text-lg text-ink-strong">${Utils.escapeHTML(r.author)}</h3>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(r.date)}</p>
          </div>
          ${r.verified ? '<span class="text-[10px] uppercase tracking-lux text-accent border border-accent/30 px-2 py-1">Verified Buyer</span>' : ''}
        </header>
        <div class="flex gap-0.5 text-accent mb-3">${Utils.stars(r.rating, 13)}</div>
        <p class="font-display italic text-ink-strong leading-relaxed">${Utils.escapeHTML(r.body)}</p>
        ${hasReply ? `
          <div class="reply-display mt-5 bg-bg-soft border-l-2 border-brand p-4">
            <p class="text-[10px] uppercase tracking-lux text-ink-muted mb-1">Curator's Response</p>
            <p class="text-sm text-ink-strong">${Utils.escapeHTML(r.reply)}</p>
          </div>` : `<div class="reply-display hidden mt-5 bg-bg-soft border-l-2 border-brand p-4"><p class="text-[10px] uppercase tracking-lux text-ink-muted mb-1">Curator's Response</p><p class="text-sm text-ink-strong reply-text"></p></div>`
        }
        ${isAdmin ? `
          <div class="reply-form hidden mt-4 bg-bg-soft border border-line p-4">
            <textarea class="reply-input w-full text-sm border border-line p-2 bg-transparent focus:outline-none focus:border-brand resize-none" rows="2" placeholder="Write a curator's response…">${hasReply ? Utils.escapeHTML(r.reply) : ''}</textarea>
            <div class="flex gap-2 mt-2">
              <button type="button" class="reply-save bg-brand hover:bg-brand-hover text-white px-4 py-2 text-[11px] uppercase tracking-lux transition-colors" data-idx="${idx}">Save Reply</button>
              <button type="button" class="reply-cancel border border-line px-4 py-2 text-[11px] uppercase tracking-lux text-ink-muted hover:border-brand" data-idx="${idx}">Cancel</button>
            </div>
          </div>` : ''}
        <div class="mt-4 flex gap-4 text-[11px] uppercase tracking-lux text-ink-muted">
          <button class="helpful-btn hover:text-brand ${voted ? 'text-brand' : ''}" data-idx="${idx}">▲ Helpful (${r.helpful || 0})</button>
          ${isAdmin ? `<button class="reply-toggle hover:text-brand" data-idx="${idx}">${hasReply ? 'Edit Reply' : '↳ Reply'}</button>` : ''}
        </div>
      </article>`;
  }

  // Check if current user has purchased this artwork (local orders + demo orders)
  function userHasBought() {
    const allOrders = Store.Orders.list().concat(GALLERY.ORDERS);
    return allOrders.some(o => (o.items || []).some(it => it.type === 'artwork' && it.refId === artwork.id));
  }

  // Show/hide the review form based on auth state and purchase verification (Req 15)
  function renderReviewFormGate() {
    const form = Utils.qs('#review-form');
    const gateMsg = Utils.qs('#review-gate-msg');
    if (!form) return;

    const submitBtn = form.querySelector('[type=submit]');
    const user = Store.User.get();

    if (!user) {
      if (submitBtn) submitBtn.disabled = true;
      if (gateMsg) {
        gateMsg.innerHTML = `<a href="auth.html?next=${encodeURIComponent(location.pathname + location.search)}" class="text-brand hover:underline">Sign in</a> to review. Only verified buyers may write a review.`;
        gateMsg.className = 'text-sm text-ink-muted mb-6';
      }
      return;
    }

    if (!userHasBought()) {
      if (submitBtn) submitBtn.disabled = true;
      if (gateMsg) {
        gateMsg.innerHTML = `Reviews are open to verified buyers only. If you own this work, <a href="support.html" class="text-brand hover:underline">contact us</a> to verify your purchase.`;
        gateMsg.className = 'text-sm text-ink-muted mb-6';
      }
      return;
    }

    // Authed verified buyer — unlock the form
    if (submitBtn) submitBtn.disabled = false;
    if (gateMsg) {
      gateMsg.textContent = 'You own this work — your review will be marked as Verified Buyer.';
      gateMsg.className = 'text-[11px] uppercase tracking-lux text-brand mb-6';
    }
  }

  function bindForms() {
    renderReviewFormGate();
    Store.subscribe('user', renderReviewFormGate);

    // Star rating
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
      // Req 15: enforce verified-buyer gate on submit too
      if (!userHasBought()) {
        Utils.toast('Only verified buyers may review this work');
        return;
      }
      const fd = new FormData(e.target);
      const author = (fd.get('display') || Store.User.get().name || 'Anonymous').toString().trim();
      const body = (fd.get('body') || '').toString().trim();
      if (!body) { Utils.toast('Please share a few words'); return; }

      const result = await GALLERY.api.createReview(artwork.id, {
        author, body, rating: userRating, verified: true,
      });
      if (!result.ok) { Utils.toast('Could not submit review'); return; }
      Utils.toast('Review submitted — marked as Verified Buyer');
      e.target.reset();
      userRating = 0;
      Utils.qsa('.star').forEach(x => { x.classList.remove('text-accent'); x.classList.add('text-line'); });
      renderReviewList();
    });
  }
})();
