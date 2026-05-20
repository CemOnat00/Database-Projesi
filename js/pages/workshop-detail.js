/* ============================================================
   pages/workshop-detail.js — Atölye detay + rezervasyon
   • GET /etkinlikler/:id
   • POST /rezervasyonlar
   • GET /yorumlar/:id?tip=etkinlik / POST /yorumlar
   • POST /yorumlar/:id/faydali
   • POST /admin/yorumlar/:id/yanit (admin)
   ============================================================ */

(function () {
  'use strict';

  let workshop = null;
  let availableSessions = [];
  let userRating = 0;
  let reviewSort = 'recent';
  const state = {
    participants: 1,
    selectedSlot: 0,
    discountPct: 0,
    discountCode: null,
  };

  Utils.onReady(init);

  async function init() {
    const idParam = Utils.paramId('id');
    if (!idParam) { renderNotFound('—'); return; }

    try {
      workshop = await GALLERY.api.getWorkshop(idParam);
    } catch (e) {
      console.warn('workshop-detail: load failed', e);
      renderNotFound(idParam);
      return;
    }
    if (!workshop) { renderNotFound(idParam); return; }

    document.title = `${workshop.title} — The Curated Gallery`;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    availableSessions = (workshop.sessions || []).filter(s => {
      if (!s.date) return true;
      return new Date(s.date) >= today;
    });

    renderHero();
    renderMeta();
    renderInstructor();
    selectMode();
    renderReviews();
    bindReviewForm();
    bindReviewSort();
    bindGlobals();
    refresh();
  }

  function selectMode() {
    const bookingForm = Utils.qs('#booking-form');
    const waitlistForm = Utils.qs('#waitlist-form');
    const soldOutBlock = Utils.qs('#sold-out-block');
    const noSessions = Utils.qs('#no-sessions-block');

    [bookingForm, waitlistForm, soldOutBlock, noSessions].forEach(el => el?.classList.add('hidden'));

    if (availableSessions.length === 0) {
      noSessions?.classList.remove('hidden');
      return;
    }
    if (workshop.complimentary || workshop.spotsLeft > 0) {
      bookingForm?.classList.remove('hidden');
      configureBookingForm();
      buildSlots();
      bindBookingForm();
      return;
    }
    if (workshop.waitlist) {
      waitlistForm?.classList.remove('hidden');
      bindWaitlistForm();
      return;
    }
    soldOutBlock?.classList.remove('hidden');
  }

  function configureBookingForm() {
    const title = Utils.qs('#form-title');
    const label = Utils.qs('#submit-label');
    if (title) title.textContent = workshop.complimentary ? 'Reserve Your Spot' : 'Reserve Your Seat';
    if (label) label.textContent = workshop.complimentary ? 'Reserve' : 'Book Now';

    const discountBlock = Utils.qs('#discount-input')?.closest('.mb-7');
    if (discountBlock) discountBlock.classList.toggle('hidden', !!workshop.complimentary);

    const totalsBlock = Utils.qs('#sum-subtotal')?.closest('.border-t');
    if (totalsBlock) totalsBlock.classList.toggle('hidden', !!workshop.complimentary);
  }

  function renderNotFound(id) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
      <section class="max-w-3xl mx-auto px-6 lg:px-12 py-32 text-center">
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-4">Not Found</p>
        <h1 class="font-display text-5xl text-ink-strong">This session is no longer on the calendar.</h1>
        <p class="mt-6 text-ink-muted">We could not find a workshop with the reference <code class="text-brand">${Utils.escapeHTML(id)}</code> in the current programme.</p>
        <div class="mt-10 flex justify-center gap-3">
          <a href="workshops.html" class="bg-brand hover:bg-brand-hover text-white px-8 py-4 text-[11px] uppercase tracking-lux transition-colors">See This Season</a>
          <a href="support.html" class="border border-ink-strong/30 px-8 py-4 text-[11px] uppercase tracking-lux text-ink-strong hover:bg-ink-strong hover:text-white transition-colors">Ask the Curator</a>
        </div>
      </section>`;
  }

  function renderHero() {
    Utils.qs('#bc-title').textContent = workshop.title;
    const hero = Utils.qs('#hero-image');
    hero.src = Utils.img(workshop.image, 1600);
    hero.alt = workshop.title;

    const tg = Utils.qs('#thumb-grid');
    // Tüm görseller sırayla — admin'in yüklediği sırada
    const imgs = (workshop.images && workshop.images.length > 0) ? workshop.images : [workshop.image].filter(Boolean);
    if (imgs.length <= 1) { tg.classList.add('hidden'); return; }
    tg.classList.remove('hidden');
    tg.className = 'grid gap-3 grid-cols-4';
    tg.innerHTML = imgs.map((src, i) => `
      <button class="thumb overflow-hidden aspect-[4/3] ${i === 0 ? 'ring-1 ring-ink-strong ring-offset-2 ring-offset-bg' : ''}" data-src="${Utils.img(src, 1600)}" aria-label="View ${i + 1}">
        <img src="${Utils.img(src, 400)}" alt="${Utils.escapeHTML(workshop.title)} — view ${i + 1}" class="w-full h-full object-cover" />
      </button>
    `).join('');
    Utils.qsa('.thumb', tg).forEach(b => b.addEventListener('click', () => {
      hero.src = b.getAttribute('data-src');
      Utils.qsa('.thumb', tg).forEach(x => x.classList.remove('ring-1','ring-ink-strong','ring-offset-2','ring-offset-bg'));
      b.classList.add('ring-1','ring-ink-strong','ring-offset-2','ring-offset-bg');
    }));
  }

  function renderMeta() {
    Utils.qs('#cat-label').textContent = `${workshop.category} · ${workshop.level}`;
    Utils.qs('#w-title').innerHTML = `${Utils.escapeHTML(workshop.title)}<br/><span class="italic font-normal">with ${Utils.escapeHTML(workshop.instructor)}</span>`;
    Utils.qs('#w-desc').textContent = workshop.description;

    const first = availableSessions[0] || (workshop.sessions && workshop.sessions[0]);
    if (first) {
      Utils.qs('#m-date').textContent = first.dateLong;
      Utils.qs('#m-time').textContent = first.time || '—';
    } else {
      Utils.qs('#m-date').textContent = 'Date TBA';
      Utils.qs('#m-time').textContent = '—';
    }
    Utils.qs('#m-duration').textContent = workshop.duration || '—';
    Utils.qs('#m-location').textContent = workshop.location || '—';
    Utils.qs('#m-capacity').textContent = workshop.complimentary
      ? `${workshop.capacity} guests welcome`
      : `${workshop.spotsLeft} of ${workshop.capacity} seats available`;
    Utils.qs('#m-price').innerHTML = workshop.price
      ? `<span class="font-medium">${Utils.fmtMoney(workshop.price)} USD</span> <span class="text-ink-muted">/ person</span>`
      : `<span class="font-medium">Complimentary</span>`;
  }

  function renderInstructor() {
    const el = Utils.qs('#instructor-section');
    if (!el) return;
    if (!workshop.instructorBio) { el.classList.add('hidden'); return; }
    Utils.qs('#instructor-name').textContent = workshop.instructor;
    Utils.qs('#instructor-bio').textContent = workshop.instructorBio;
    Utils.qs('#instructor-other-wrap')?.classList.add('hidden');
  }

  function buildSlots() {
    const grid = Utils.qs('#slot-grid');
    if (!grid) return;
    if (availableSessions.length === 0) {
      grid.innerHTML = '<p class="text-ink-muted italic col-span-2">No upcoming sessions.</p>';
      return;
    }
    grid.innerHTML = availableSessions.map((s, i) => `
      <button type="button" role="radio" data-slot="${i}" class="slot-btn text-left p-4 border transition-colors">
        <span class="block text-[11px] uppercase tracking-lux opacity-70">${s.label}</span>
        <span class="block mt-1 text-base">${s.time}</span>
      </button>
    `).join('');
    grid.addEventListener('click', e => {
      const btn = e.target.closest('.slot-btn');
      if (!btn) return;
      state.selectedSlot = Number(btn.getAttribute('data-slot'));
      const sel = availableSessions[state.selectedSlot];
      Utils.qs('#m-date').textContent = sel.dateLong;
      Utils.qs('#m-time').textContent = sel.time;
      refresh();
    });
  }

  function bindBookingForm() {
    Utils.qs('#qty-dec').addEventListener('click', () => {
      if (state.participants > 1) { state.participants--; refresh(); }
    });
    Utils.qs('#qty-inc').addEventListener('click', () => {
      const max = workshop.complimentary ? workshop.capacity : workshop.spotsLeft;
      if (state.participants < max) { state.participants++; refresh(); }
    });

    Utils.qs('#discount-apply').addEventListener('click', applyDiscount);
    Utils.qs('#discount-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); applyDiscount(); }
    });

    Utils.qs('#booking-form').addEventListener('submit', e => {
      e.preventDefault();
      bookNow();
    });
  }

  function bindWaitlistForm() {
    const user = Store.User.get();
    if (user) {
      const name = Utils.qs('#wl-name'); if (name) name.value = user.name || '';
      const em   = Utils.qs('#wl-email'); if (em && user.email) em.value = user.email;
    }
    Utils.qs('#waitlist-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = Utils.qs('#wl-msg');
      msg.textContent = 'Added to waitlist locally — backend endpoint not enabled.';
      msg.className = 'mb-4 text-[11px] min-h-[1rem] text-brand';
    });
  }

  function bindGlobals() {
    Utils.qs('#modal-close')?.addEventListener('click', closeModal);
    Utils.qs('#modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });
    Utils.qs('#manage-link')?.addEventListener('click', () => {
      Utils.toast('Opening Profile → Reservations…');
      setTimeout(() => location.href = 'dashboard.html?pane=reservations', 700);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !Utils.qs('#modal').classList.contains('hidden')) closeModal();
    });
  }

  async function applyDiscount() {
    const code = Utils.qs('#discount-input').value.trim();
    const msg = Utils.qs('#discount-msg');
    if (!code) { state.discountPct = 0; state.discountCode = null; msg.textContent = ''; refresh(); return; }
    const result = await GALLERY.api.validateCoupon(code);
    if (result.ok) {
      state.discountPct = result.pct; state.discountCode = result.code;
      msg.textContent = `Applied — ${state.discountPct}% off your reservation.`;
      msg.className = 'mt-2 text-[11px] min-h-[1rem] text-brand';
    } else {
      state.discountPct = 0; state.discountCode = null;
      msg.textContent = 'This code is not recognised.';
      msg.className = 'mt-2 text-[11px] min-h-[1rem] text-accent';
    }
    refresh();
  }

  function refresh() {
    const badge = Utils.qs('#spots-badge');
    if (badge) {
      const left = workshop.spotsLeft;
      if (workshop.complimentary) {
        badge.textContent = 'Open'; badge.className = 'bg-brand text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
      } else if (availableSessions.length === 0) {
        badge.textContent = 'Off Programme'; badge.className = 'bg-ink-strong text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
      } else if (left <= 0) {
        badge.textContent = 'Sold Out'; badge.className = 'bg-ink-strong text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
      } else if (left <= 3) {
        badge.textContent = left + (left === 1 ? ' Spot Left' : ' Spots Left'); badge.className = 'bg-accent text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
      } else {
        badge.textContent = left + ' Spots Left'; badge.className = 'bg-brand text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
      }
    }

    if (!Utils.qs('#booking-form').classList.contains('hidden')) {
      Utils.qsa('.slot-btn').forEach(btn => {
        const i = Number(btn.getAttribute('data-slot'));
        const active = i === state.selectedSlot;
        btn.className = 'slot-btn text-left p-4 border transition-colors ' +
          (active ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-strong border-line hover:border-brand');
      });

      const max = workshop.complimentary ? workshop.capacity : workshop.spotsLeft;
      Utils.qs('#qty-value').textContent = state.participants;
      Utils.qs('#qty-hint').textContent = max;
      Utils.qs('#qty-dec').disabled = state.participants <= 1;
      Utils.qs('#qty-inc').disabled = state.participants >= max;

      const subtotal = (workshop.price || 0) * state.participants;
      const discount = Math.round(subtotal * state.discountPct / 100);
      const total = subtotal - discount;
      Utils.qs('#sum-subtotal').textContent = Utils.fmtMoney(subtotal) + ' USD';
      const row = Utils.qs('#sum-discount-row');
      if (discount > 0) {
        row.classList.remove('hidden');
        Utils.qs('#sum-discount-code').textContent = state.discountCode;
        Utils.qs('#sum-discount-amount').textContent = '−' + Utils.fmtMoney(discount) + ' USD';
      } else {
        row.classList.add('hidden');
      }
      Utils.qs('#sum-total').innerHTML = Utils.fmtMoney(total) + ' <span class="text-base text-ink-muted tracking-normal">USD</span>';
    }
  }

  async function bookNow() {
    if (!Store.User.isAuthed()) {
      Utils.toast('Sign in to reserve a seat');
      setTimeout(() => location.href = 'auth.html?next=' + encodeURIComponent(location.pathname + location.search), 600);
      return;
    }
    const session = availableSessions[state.selectedSlot];
    if (!session) { Utils.toast('Pick a session first'); return; }

    try {
      const result = await GALLERY.api.createReservation({
        workshopId: workshop.id,
        participants: state.participants,
      });

      const subtotal = (workshop.price || 0) * state.participants;
      const discount = Math.round(subtotal * state.discountPct / 100);
      const total = subtotal - discount;

      if (!workshop.complimentary) {
        workshop.spotsLeft = Math.max(0, workshop.spotsLeft - state.participants);
      }

      const user = Store.User.get();
      const email = (user && user.email) || 'your inbox';

      if (Utils.qs('#modal-resid')) Utils.qs('#modal-resid').textContent = '#' + (result.reservationId || '—');
      if (Utils.qs('#modal-session')) Utils.qs('#modal-session').textContent = `${session.dateLong} · ${session.time}`;
      if (Utils.qs('#modal-participants')) Utils.qs('#modal-participants').textContent = state.participants + (state.participants === 1 ? ' guest' : ' guests');
      if (Utils.qs('#modal-total')) Utils.qs('#modal-total').textContent = workshop.complimentary ? 'Complimentary' : Utils.fmtMoney(total) + ' USD';
      if (Utils.qs('#modal-email-note')) Utils.qs('#modal-email-note').textContent = `A confirmation is on its way to ${email}.`;
      Utils.qs('#modal').classList.remove('hidden');
      Utils.qs('#modal').classList.add('flex');
      document.body.style.overflow = 'hidden';

      if (!workshop.complimentary && workshop.spotsLeft === 0) selectMode();
      refresh();
    } catch (e) {
      if (e.status === 401) {
        Utils.toast('Session expired — please sign in again');
        setTimeout(() => location.href = 'auth.html', 600);
      } else {
        Utils.toast(e.message || 'Could not create reservation');
      }
    }
  }

  function closeModal() {
    Utils.qs('#modal').classList.add('hidden');
    Utils.qs('#modal').classList.remove('flex');
    document.body.style.overflow = '';
  }

  /* ---- Reviews ---- */
  async function renderReviews() {
    const list = Utils.qs('#review-list');
    if (!list) return;
    let reviews = [];
    let meta = { average: 0, total: 0 };
    try {
      reviews = await GALLERY.api.listReviews(workshop.id, reviewSort, 'etkinlik');
      meta = reviews.meta || meta;
    } catch (e) {
      list.innerHTML = '<p class="md:col-span-2 text-ink-muted italic">Reviews unavailable right now.</p>';
      return;
    }

    if (reviews.length === 0) {
      list.innerHTML = '<p class="md:col-span-2 text-ink-muted italic">No reviews yet for this workshop.</p>';
      Utils.qs('#review-summary').innerHTML = '<p class="text-sm text-ink-muted">Be the first to attend.</p>';
      return;
    }

    const isAdmin = Store.User.isAdmin();
    list.innerHTML = reviews.map((r, idx) => {
      const adminBox = isAdmin && !r.reply ? `
        <div class="mt-5 bg-bg border border-line border-dashed p-4" data-rid="${r.id}">
          <p class="text-[10px] uppercase tracking-lux text-ink-muted mb-2">Curator Reply (admin)</p>
          <textarea class="admin-reply-input w-full border border-line p-2 text-sm bg-transparent focus:outline-none focus:border-brand resize-none" rows="2" placeholder="Write a curator's response…"></textarea>
          <button type="button" class="admin-reply-save mt-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 text-[10px] uppercase tracking-lux" data-rid="${r.id}">Post Reply</button>
        </div>` : '';
      return `
        <article class="bg-surface border border-line p-8" data-rid="${r.id}">
          <header class="flex items-start justify-between mb-4">
            <div>
              <h3 class="font-display text-lg text-ink-strong">${Utils.escapeHTML(r.author)}</h3>
              <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(r.date)}</p>
            </div>
            ${r.verified ? '<span class="text-[10px] uppercase tracking-lux text-accent border border-accent/30 px-2 py-1">Verified Attendee</span>' : ''}
          </header>
          <div class="flex items-center gap-0.5 text-accent mb-4">${Utils.stars(r.rating, 14)}</div>
          <p class="font-display italic text-ink-strong leading-relaxed">"${Utils.escapeHTML(r.body)}"</p>
          ${r.reply ? `<div class="mt-6 bg-bg-soft border-l-2 border-brand p-4">
            <p class="text-[10px] uppercase tracking-lux text-ink-muted mb-2">Curator's Response</p>
            <p class="text-sm text-ink-strong leading-relaxed">${Utils.escapeHTML(r.reply)}</p>
          </div>` : ''}
          ${adminBox}
          <div class="mt-5 flex gap-4 text-[11px] uppercase tracking-lux text-ink-muted">
            <button class="helpful-btn hover:text-brand" data-idx="${idx}" data-rid="${r.id}">▲ Helpful (${r.helpful || 0})</button>
          </div>
        </article>`;
    }).join('');

    const avg = (meta.average || (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)).toFixed(1);
    Utils.qs('#review-summary').innerHTML = `<div class="flex items-center gap-1 text-accent">${Utils.stars(Math.round(Number(avg)), 18)}</div><p class="text-sm text-ink-strong"><strong>${avg}</strong> <span class="text-ink-muted">· based on ${meta.total || reviews.length} reviews</span></p>`;

    Utils.qsa('.helpful-btn', list).forEach(b => b.addEventListener('click', async () => {
      if (!Store.User.isAuthed()) { Utils.toast('Sign in to vote'); return; }
      const idx = Number(b.getAttribute('data-idx'));
      const reviewId = Number(b.getAttribute('data-rid'));
      try {
        await GALLERY.api.toggleReviewHelpful(workshop.id, idx, reviewId);
        Utils.toast('Vote recorded');
        renderReviews();
      } catch (e) { Utils.toast(e.message || 'Could not vote'); }
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
          renderReviews();
        } catch (e) { Utils.toast(e.message || 'Could not post reply'); }
      }));
    }
  }

  function bindReviewSort() {
    const sortEl = Utils.qs('#review-sort');
    if (!sortEl) return;
    sortEl.addEventListener('change', e => {
      reviewSort = ({ 'Most Recent': 'recent', 'Highest Rated': 'rating', 'Most Helpful': 'helpful' })[e.target.value] || 'recent';
      renderReviews();
    });
  }

  function bindReviewForm() {
    Utils.qsa('.star').forEach(s => s.addEventListener('click', () => {
      userRating = Number(s.getAttribute('data-r'));
      Utils.qsa('.star').forEach(x => {
        const r = Number(x.getAttribute('data-r'));
        x.classList.toggle('text-accent', r <= userRating);
        x.classList.toggle('text-line', r > userRating);
      });
    }));

    Utils.qs('#review-form')?.addEventListener('submit', async e => {
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
        await GALLERY.api.createReview(workshop.id, { rating: userRating, body }, 'etkinlik');
        Utils.toast('Review submitted');
        e.target.reset();
        userRating = 0;
        Utils.qsa('.star').forEach(x => { x.classList.remove('text-accent'); x.classList.add('text-line'); });
        renderReviews();
      } catch (err) {
        Utils.toast(err.message || 'Could not submit review');
      }
    });
  }
})();
