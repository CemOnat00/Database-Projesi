/* ============================================================
   pages/workshop-detail.js — Atölye detayı + rezervasyon akışı
   Backend-ready: veri GALLERY.api.getWorkshop / createReservation
   / joinWaitlist üzerinden çekilir.

   Üç farklı UI durumu:
     • book      → normal rezervasyon formu
     • waitlist  → email ile waitlist'e katılma formu
     • sold-out  → kapanış mesajı + diğer oturumlara link
     • no-sessions → "Notify me" mesajı
   ============================================================ */

(function () {
  'use strict';

  let workshop = null;
  let availableSessions = []; // bugünden sonraki oturumlar
  const state = {
    participants: 1,
    selectedSlot: 0,
    discountPct: 0,
    discountCode: null,
  };

  Utils.onReady(init);

  async function init() {
    const idParam = Utils.paramId('id');
    const id = idParam || 'advanced-oil-textures';

    workshop = await GALLERY.api.getWorkshop(id);
    if (!workshop) {
      renderNotFound(idParam || id);
      return;
    }

    document.title = `${workshop.title} — ${workshop.instructor} | The Curated Gallery`;

    // Filter to upcoming sessions only (UTC midnight today)
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
    bindGlobals();
    refresh();
  }

  /* ---- MODE: pick which form/block to show ------------------- */
  function selectMode() {
    const bookingForm   = Utils.qs('#booking-form');
    const waitlistForm  = Utils.qs('#waitlist-form');
    const soldOutBlock  = Utils.qs('#sold-out-block');
    const noSessions    = Utils.qs('#no-sessions-block');

    // Default: all hidden
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

    // spotsLeft === 0 below
    if (workshop.waitlist) {
      waitlistForm?.classList.remove('hidden');
      bindWaitlistForm();
      return;
    }

    soldOutBlock?.classList.remove('hidden');
  }

  function configureBookingForm() {
    // Tailor titles & buttons to free vs paid
    const title = Utils.qs('#form-title');
    const label = Utils.qs('#submit-label');
    if (workshop.complimentary) {
      title.textContent = 'Reserve Your Spot';
      label.textContent = 'Reserve';
    } else {
      title.textContent = 'Reserve Your Seat';
      label.textContent = 'Book Now';
    }

    // Hide discount block when complimentary
    const discountBlock = Utils.qs('#discount-input')?.closest('.mb-7');
    if (discountBlock) discountBlock.classList.toggle('hidden', !!workshop.complimentary);

    // Hide totals when complimentary
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
    const imgs = (workshop.images && workshop.images.length > 0)
      ? workshop.images.slice(0, 4)
      : [workshop.image];
    if (imgs.length <= 1) { tg.classList.add('hidden'); return; }
    tg.classList.remove('hidden');
    tg.className = `grid gap-3 grid-cols-${Math.min(imgs.length, 3)}`;
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
      Utils.qs('#m-time').textContent = `${first.time} – ${addHours(first.time, parseDurationHours(workshop.duration))}`;
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

    const others = GALLERY.WORKSHOPS.filter(w => w.instructor === workshop.instructor && w.id !== workshop.id).slice(0, 3);
    const otherRoot = Utils.qs('#instructor-other');
    if (others.length === 0) {
      Utils.qs('#instructor-other-wrap')?.classList.add('hidden');
    } else {
      Utils.qs('#instructor-other-wrap')?.classList.remove('hidden');
      otherRoot.innerHTML = others.map(o => `
        <a href="workshop-detail.html?id=${o.id}" class="group block">
          <div class="overflow-hidden bg-bg-image aspect-square"><img src="${Utils.img(o.image, 600)}" alt="${Utils.escapeHTML(o.title)}" class="w-full h-full object-cover img-zoom" /></div>
          <p class="font-display text-sm text-ink-strong mt-3">${Utils.escapeHTML(o.title)}</p>
          <p class="text-[10px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(o.level)}</p>
        </a>`).join('');
    }
  }

  function parseDurationHours(s) {
    const m = (s || '').match(/(\d+)/);
    return m ? Number(m[1]) : 6;
  }

  function addHours(time, h) {
    const [hh, mm] = (time || '00:00').split(':').map(Number);
    const t = (hh + h) % 24;
    return String(t).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }

  /* ---- BOOKING form ------------------------------------------ */
  function buildSlots() {
    const grid = Utils.qs('#slot-grid');
    if (!grid) return;
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
      Utils.qs('#m-time').textContent = `${sel.time} – ${addHours(sel.time, parseDurationHours(workshop.duration))}`;
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

  /* ---- WAITLIST form ----------------------------------------- */
  function bindWaitlistForm() {
    const user = Store.User.get();
    if (user) {
      const name = Utils.qs('#wl-name'); if (name) name.value = user.name || '';
      const em   = Utils.qs('#wl-email'); if (em && user.email) em.value = user.email;
    }
    Utils.qs('#waitlist-form').addEventListener('submit', async e => {
      e.preventDefault();
      const name = Utils.qs('#wl-name').value.trim();
      const email = Utils.qs('#wl-email').value.trim();
      const msg = Utils.qs('#wl-msg');
      if (!email) { msg.textContent = 'Please share your email.'; msg.className = 'mb-4 text-[11px] min-h-[1rem] text-accent'; return; }

      const result = await GALLERY.api.joinWaitlist({ workshopId: workshop.id, name, email });
      if (!result.ok) {
        if (result.error === 'already_on_waitlist') msg.textContent = "You're already on the waitlist — we'll be in touch.";
        else msg.textContent = 'Could not add you to the waitlist — please try again.';
        msg.className = 'mb-4 text-[11px] min-h-[1rem] text-accent';
        return;
      }
      msg.textContent = 'You\'re on the list. We\'ll write to ' + email + ' the moment a seat opens.';
      msg.className = 'mb-4 text-[11px] min-h-[1rem] text-brand';
      e.target.querySelector('button[type=submit]').disabled = true;
    });
  }

  /* ---- Modal & global -------------------------------------- */
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
      state.discountPct = result.pct;
      state.discountCode = result.code;
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
    // Spots badge (informs the user regardless of form state)
    const badge = Utils.qs('#spots-badge');
    const left = workshop.spotsLeft;
    if (workshop.complimentary) {
      badge.textContent = 'Open Daily'; badge.className = 'bg-brand text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
    } else if (availableSessions.length === 0) {
      badge.textContent = 'Off Programme'; badge.className = 'bg-ink-strong text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
    } else if (left <= 0 && workshop.waitlist) {
      badge.textContent = 'Waitlist Open'; badge.className = 'bg-accent text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
    } else if (left <= 0) {
      badge.textContent = 'Sold Out'; badge.className = 'bg-ink-strong text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
    } else if (left <= 3) {
      badge.textContent = left + (left === 1 ? ' Spot Left' : ' Spots Left'); badge.className = 'bg-accent text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
    } else {
      badge.textContent = left + ' Spots Left'; badge.className = 'bg-brand text-white text-[10px] uppercase tracking-lux px-3 py-1.5';
    }

    // Booking-form bits (only meaningful if form is visible)
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

    const m = Utils.qs('#m-capacity');
    if (m) m.textContent = workshop.complimentary
      ? `${workshop.capacity} guests welcome`
      : `${workshop.spotsLeft} of ${workshop.capacity} seats available`;
  }

  async function bookNow() {
    const session = availableSessions[state.selectedSlot];
    if (!session) { Utils.toast('Pick a session first'); return; }

    const result = await GALLERY.api.createReservation({
      workshopId: workshop.id,
      sessionDate: session.date,
      participants: state.participants,
      discountCode: state.discountCode,
    });

    if (!result.ok) {
      if (result.error === 'no_capacity') Utils.toast('Not enough seats remain');
      else if (result.error === 'session_past') Utils.toast('That session is in the past');
      else Utils.toast('Could not book — please try again');
      return;
    }

    const subtotal = (workshop.price || 0) * state.participants;
    const discount = Math.round(subtotal * state.discountPct / 100);
    const total = subtotal - discount;

    Store.Reservations.add({
      id: result.reservationId,
      workshopId: workshop.id,
      workshopTitle: workshop.title,
      instructor: workshop.instructor,
      sessionDate: session.date,
      sessionLabel: session.dateLong,
      sessionTime: session.time,
      participants: state.participants,
      total,
      discountCode: state.discountCode,
      status: 'Confirmed',
    });

    // Update local in-memory copy so the page refreshes accurately
    if (!workshop.complimentary) {
      workshop.spotsLeft = Math.max(0, workshop.spotsLeft - state.participants);
    }

    const user = Store.User.get();
    const email = (user && user.email) || 'your inbox';

    Utils.qs('#modal-resid').textContent = result.reservationId;
    Utils.qs('#modal-session').textContent = `${session.dateLong} · ${session.time}`;
    Utils.qs('#modal-participants').textContent = state.participants + (state.participants === 1 ? ' guest' : ' guests');
    Utils.qs('#modal-total').textContent = workshop.complimentary ? 'Complimentary' : Utils.fmtMoney(total) + ' USD';
    Utils.qs('#modal-email-note').textContent = `A confirmation with calendar invite is on its way to ${email}.`;
    Utils.qs('#modal').classList.remove('hidden');
    Utils.qs('#modal').classList.add('flex');
    document.body.style.overflow = 'hidden';

    // If we just filled the last seat → switch the page to sold-out mode
    if (!workshop.complimentary && workshop.spotsLeft === 0) {
      selectMode();
    }
    refresh();
  }

  function closeModal() {
    Utils.qs('#modal').classList.add('hidden');
    Utils.qs('#modal').classList.remove('flex');
    document.body.style.overflow = '';
  }

  /* ---- Reviews ---------------------------------------------- */
  async function renderReviews() {
    const list = Utils.qs('#review-list');
    const reviews = await GALLERY.api.listReviews(workshop.id);
    if (reviews.length === 0) {
      list.innerHTML = '<p class="md:col-span-2 text-ink-muted italic">No reviews yet for this workshop.</p>';
      Utils.qs('#review-summary').innerHTML = '<p class="text-sm text-ink-muted">Be the first to attend.</p>';
      return;
    }
    list.innerHTML = reviews.map(r => `
      <article class="bg-surface border border-line p-8">
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
      </article>`).join('');

    const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    Utils.qs('#review-summary').innerHTML = `<div class="flex items-center gap-1 text-accent">${Utils.stars(Math.round(avg), 18)}</div><p class="text-sm text-ink-strong"><strong>${avg}</strong> <span class="text-ink-muted">· based on ${reviews.length} reviews</span></p>`;
  }
})();
