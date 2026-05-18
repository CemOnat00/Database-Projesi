/* ============================================================
   pages/dashboard.js — Sidebar tab + rezervasyon yönet + favori liste
   Backend-ready: tüm yazma/okuma GALLERY.api.* üzerinden.
   ============================================================ */

(function () {
  'use strict';

  let updateContext = null; // { reservationId, mode, draft }

  Utils.onReady(function () {
    const user = Store.User.get();
    if (user) {
      Utils.qs('#user-name').textContent = (user.name || 'Friend').split(' ')[0];
    } else {
      // Soft hint — not blocking, lets demo work without login
      const banner = document.createElement('div');
      banner.className = 'mb-8 bg-surface border border-line p-4 text-[11px] uppercase tracking-lux text-ink-muted flex justify-between items-center';
      banner.innerHTML = 'You are viewing as a guest. <a href="auth.html?next=dashboard.html" class="text-brand border-b border-brand/40 pb-0.5">Sign in to save changes →</a>';
      document.querySelector('main')?.insertBefore(banner, document.querySelector('main').firstChild);
    }

    bindSidebar();
    fillProfileForm();
    renderOverview();
    renderOrders();
    renderReservations();
    renderFavorites();
    renderOffers();
    renderComparisons();
    bindForms();
    bindUpdateModal();

    Store.subscribe('favorites',    () => { renderFavorites(); renderOverview(); });
    Store.subscribe('reservations', () => { renderReservations(); renderOverview(); });
    Store.subscribe('orders',       () => { renderOrders(); renderOverview(); });
    Store.subscribe('user',         () => { renderOffers(); });
    Store.subscribe('comparisons',  renderComparisons);

    const want = new URLSearchParams(location.search).get('pane');
    if (want) {
      const btn = Utils.qs(`.side-btn[data-pane="${want}"]`);
      if (btn) btn.click();
    }
  });

  function fillProfileForm() {
    const user = Store.User.get();
    if (!user) return;
    const [first, ...rest] = (user.name || '').split(' ');
    const set = (sel, val) => { const el = Utils.qs(sel); if (el) el.value = val || ''; };
    set('input[name="firstName"]', first);
    set('input[name="lastName"]',  rest.join(' '));
    set('input[name="email"]',     user.email);
    set('input[name="phone"]',     user.phone);
    set('input[name="address"]',   user.address);
  }

  function bindSidebar() {
    Utils.qsa('.side-btn').forEach(b => b.addEventListener('click', () => {
      Utils.qsa('.side-btn').forEach(x => {
        x.classList.remove('border-brand','bg-bg-soft','text-ink-strong');
        x.classList.add('border-transparent','text-ink-muted');
      });
      b.classList.add('border-brand','bg-bg-soft','text-ink-strong');
      b.classList.remove('border-transparent','text-ink-muted');
      Utils.qsa('.pane').forEach(p => p.classList.add('hidden'));
      Utils.qs(`.pane[data-pane="${b.getAttribute('data-pane')}"]`).classList.remove('hidden');
    }));
  }

  async function renderOverview() {
    const orders = await GALLERY.api.listOrders();
    const reservations = Store.Reservations.list();
    const favorites = Store.Favorites.list();

    Utils.qs('#stat-orders').textContent = orders.length;
    Utils.qs('#stat-reservations').textContent = reservations.length;
    Utils.qs('#stat-favorites').textContent = favorites.length;

    const lastOrder = Store.LastOrder.get() || Store.Orders.list()[0] || orders[0];
    if (lastOrder) {
      const items = (lastOrder.items || []).map(i => i.title).join(' + ');
      Utils.qs('#last-order').innerHTML = `
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-3">Latest Order</p>
        <h3 class="font-display text-2xl text-ink-strong">#${lastOrder.id} · ${Utils.escapeHTML(items || 'Order')}</h3>
        <p class="text-sm text-ink-muted mt-2">${Utils.escapeHTML(lastOrder.status)} · Total ${Utils.fmtMoney(lastOrder.total)}</p>
        <a href="confirmation.html" class="mt-4 inline-block text-[11px] uppercase tracking-lux text-brand border-b border-brand/40 pb-0.5">View Details →</a>
      `;
    }

    const upcoming = reservations[0];
    if (upcoming) {
      Utils.qs('#upcoming').innerHTML = `
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-3">Upcoming in the Atelier</p>
        <h3 class="font-display text-2xl text-ink-strong">${Utils.escapeHTML(upcoming.workshopTitle)}</h3>
        <p class="text-sm text-ink-muted mt-2">${Utils.escapeHTML(upcoming.sessionLabel || '')} · ${Utils.escapeHTML(upcoming.sessionTime || '')} · ${upcoming.participants} participants</p>
      `;
    } else {
      Utils.qs('#upcoming').innerHTML = `
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-3">Upcoming</p>
        <p class="font-display italic text-ink-muted">No reservations yet — <a href="workshops.html" class="underline">browse workshops</a>.</p>
      `;
    }
  }

  async function renderOrders() {
    const root = Utils.qs('#orders-tbody');
    const empty = Utils.qs('#orders-empty');
    if (!root) return;
    const orders = await GALLERY.api.listOrders();

    if (orders.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = orders.map(o => {
      const statusClass =
        o.status === 'Delivered' ? 'text-brand border-brand/30' :
        o.status === 'Shipped'   ? 'text-brand border-brand/30' :
        o.status === 'Cancelled' ? 'text-ink-muted border-line' :
        'text-accent border-accent/30';
      return `
        <tr>
          <td class="px-5 py-4">${Utils.escapeHTML(o.id)}</td>
          <td>${(o.items || []).length} item${(o.items || []).length > 1 ? 's' : ''}</td>
          <td>${Utils.escapeHTML(o.date || '')}</td>
          <td>${Utils.fmtMoney(o.total || 0)}</td>
          <td><span class="text-[10px] uppercase tracking-lux ${statusClass} border px-2 py-1">${Utils.escapeHTML(o.status || '—')}</span></td>
          <td class="text-right pr-5"><a href="confirmation.html?id=${encodeURIComponent(o.id)}" class="text-[11px] uppercase tracking-lux border-b border-ink-strong/30 hover:border-brand">View</a></td>
        </tr>`;
    }).join('');
  }

  /* ============================================================
     RESERVATIONS — list, edit date, edit participants, cancel
     ============================================================ */

  async function renderReservations() {
    const root = Utils.qs('#reservations-list');
    const empty = Utils.qs('#reservations-empty');
    const header = Utils.qs('#reservations-header');
    if (!root) return;

    const reservations = await GALLERY.api.listReservations();
    const history = (Store.Reservations.listIncludingHistory ? Store.Reservations.listIncludingHistory() : reservations)
      .filter(r => r.status === 'Cancelled');

    if (header) {
      const live = reservations.length;
      const past = history.length;
      header.textContent = `${live} ${live === 1 ? 'session' : 'sessions'} held${past ? ` · ${past} cancelled` : ''}`;
    }

    if (reservations.length === 0 && history.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    const liveCards = reservations.map(r => {
      const w = GALLERY.getWorkshop(r.workshopId);
      const locked = isLocked(r);
      return `
        <article class="bg-surface border border-line p-6 flex flex-col md:flex-row gap-5">
          <div class="md:w-32 h-32 overflow-hidden bg-bg-image flex-shrink-0">
            <img src="${Utils.img(w.image, 300)}" alt="" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1">
            <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(w.category)} · ${Utils.escapeHTML(r.status || 'Confirmed')}</p>
            <h3 class="font-display text-2xl text-ink-strong mt-1">${Utils.escapeHTML(r.workshopTitle)}</h3>
            <p class="text-sm text-ink-muted mt-1">${Utils.escapeHTML(r.sessionLabel || '')} · ${Utils.escapeHTML(r.sessionTime || '')}</p>
            <p class="text-sm text-ink-muted">${r.participants} participant${r.participants > 1 ? 's' : ''} · ${r.total ? Utils.fmtMoney(r.total) : 'Complimentary'}</p>
            ${locked ? '<p class="mt-3 text-[11px] text-accent uppercase tracking-lux">Changes locked — within 48 hours of session.</p>' : ''}
          </div>
          <div class="flex flex-col gap-2 md:items-end">
            <button data-action="edit-date" data-id="${r.id}" ${locked ? 'disabled' : ''} class="res-btn text-[11px] uppercase tracking-lux text-brand border border-brand/30 px-4 py-2 hover:bg-brand hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-brand">Edit Date</button>
            <button data-action="edit-participants" data-id="${r.id}" ${locked ? 'disabled' : ''} class="res-btn text-[11px] uppercase tracking-lux text-brand border border-brand/30 px-4 py-2 hover:bg-brand hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-brand">Participants</button>
            <button data-action="cancel" data-id="${r.id}" ${locked ? 'disabled' : ''} class="res-btn text-[11px] uppercase tracking-lux text-accent border border-accent/30 px-4 py-2 hover:bg-accent hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-accent">Cancel</button>
          </div>
        </article>`;
    }).join('');

    const historyCards = history.length ? `
      <details class="mt-8 bg-surface border border-line p-6">
        <summary class="cursor-pointer flex items-center justify-between">
          <span class="text-[11px] uppercase tracking-lux text-ink-muted">Past &amp; cancelled reservations</span>
          <span class="text-[11px] uppercase tracking-lux text-ink-muted">${history.length}</span>
        </summary>
        <div class="mt-5 space-y-3">
          ${history.map(h => `
            <div class="flex items-center justify-between py-2 border-b border-line last:border-b-0">
              <div>
                <p class="font-display text-ink-strong">${Utils.escapeHTML(h.workshopTitle || '')}</p>
                <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(h.sessionLabel || '')} · ${h.participants} participant${h.participants > 1 ? 's' : ''}</p>
              </div>
              <span class="text-[10px] uppercase tracking-lux text-ink-muted border border-line px-2 py-1">${h.status}</span>
            </div>`).join('')}
        </div>
      </details>` : '';

    root.innerHTML = liveCards + historyCards;

    Utils.qsa('.res-btn', root).forEach(btn => btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit-date') openUpdateModal(id, 'date');
      else if (action === 'edit-participants') openUpdateModal(id, 'participants');
      else if (action === 'cancel') cancelReservation(id);
    }));
  }

  function isLocked(reservation) {
    if (!reservation.sessionDate) return false;
    const hoursUntil = (new Date(reservation.sessionDate) - new Date()) / 36e5;
    return hoursUntil < (GALLERY.SITE.cancellationWindowHours || 48);
  }

  async function cancelReservation(reservationId) {
    if (!confirm('Cancel this reservation? This cannot be undone, but your refund will be issued automatically.')) return;
    const result = await GALLERY.api.cancelReservation(reservationId);
    if (!result.ok) {
      if (result.error === 'window_closed') Utils.toast('Cancellation window has closed (within 48 hours).');
      else Utils.toast('Could not cancel — please try again.');
      return;
    }
    Utils.toast(result.refund > 0 ? `Cancelled — refund of ${Utils.fmtMoney(result.refund)} issued.` : 'Reservation cancelled.');
  }

  /* ---- Update modal ----------------------------------------- */

  function openUpdateModal(reservationId, mode) {
    const reservation = Store.Reservations.list().find(r => r.id === reservationId);
    if (!reservation) return;
    const workshop = GALLERY.getWorkshop(reservation.workshopId);

    updateContext = {
      reservationId,
      mode,
      draft: { participants: reservation.participants, sessionDate: reservation.sessionDate },
    };

    const modeLabel = Utils.qs('#update-mode-label');
    const title = Utils.qs('#update-title');
    const current = Utils.qs('#update-current');
    const datePicker = Utils.qs('#update-date-picker');
    const partBlock = Utils.qs('#update-participants-block');
    const msg = Utils.qs('#update-msg');

    title.textContent = reservation.workshopTitle;
    current.textContent = `Currently: ${reservation.sessionLabel} · ${reservation.sessionTime} · ${reservation.participants} participant${reservation.participants > 1 ? 's' : ''}`;
    msg.textContent = '';

    if (mode === 'date') {
      modeLabel.textContent = 'Reschedule Session';
      datePicker.classList.remove('hidden');
      partBlock.classList.add('hidden');

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const upcoming = (workshop.sessions || []).filter(s => new Date(s.date) >= today);

      if (upcoming.length === 0) {
        datePicker.innerHTML = '<p class="text-ink-muted italic text-sm">No upcoming sessions to switch to.</p>';
      } else {
        datePicker.innerHTML = upcoming.map(s => `
          <label class="flex items-center justify-between border border-line p-4 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-bg-soft">
            <div>
              <span class="block text-[11px] uppercase tracking-lux text-ink-muted">${s.label}</span>
              <span class="block text-ink-strong mt-1">${s.dateLong} · ${s.time}</span>
            </div>
            <input type="radio" name="new-date" value="${s.date}" ${s.date === reservation.sessionDate ? 'checked' : ''} class="accent-brand" />
          </label>
        `).join('');
      }
    } else if (mode === 'participants') {
      modeLabel.textContent = 'Update Participants';
      datePicker.classList.add('hidden');
      partBlock.classList.remove('hidden');
      refreshParticipantsDraft();
    }

    const modal = Utils.qs('#update-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function refreshParticipantsDraft() {
    const ctx = updateContext;
    if (!ctx) return;
    const reservation = Store.Reservations.list().find(r => r.id === ctx.reservationId);
    const workshop = GALLERY.getWorkshop(reservation.workshopId);
    const maxAvailable = workshop.complimentary
      ? workshop.capacity
      : workshop.spotsLeft + reservation.participants;

    Utils.qs('#upd-value').textContent = ctx.draft.participants;
    Utils.qs('#upd-hint').textContent = `Up to ${maxAvailable} participant${maxAvailable > 1 ? 's' : ''} for this session`;
    Utils.qs('#upd-dec').disabled = ctx.draft.participants <= 1;
    Utils.qs('#upd-inc').disabled = ctx.draft.participants >= maxAvailable;
  }

  function bindUpdateModal() {
    Utils.qs('#upd-dec')?.addEventListener('click', () => {
      if (!updateContext) return;
      if (updateContext.draft.participants > 1) {
        updateContext.draft.participants--;
        refreshParticipantsDraft();
      }
    });
    Utils.qs('#upd-inc')?.addEventListener('click', () => {
      if (!updateContext) return;
      updateContext.draft.participants++;
      refreshParticipantsDraft();
    });

    Utils.qs('#update-discard')?.addEventListener('click', closeUpdateModal);
    Utils.qs('#update-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeUpdateModal();
    });
    document.addEventListener('keydown', e => {
      const m = Utils.qs('#update-modal');
      if (e.key === 'Escape' && m && !m.classList.contains('hidden')) closeUpdateModal();
    });

    Utils.qs('#update-save')?.addEventListener('click', saveUpdate);
  }

  async function saveUpdate() {
    if (!updateContext) return;
    const ctx = updateContext;
    const msg = Utils.qs('#update-msg');
    const patch = {};

    if (ctx.mode === 'date') {
      const picked = Utils.qs('input[name="new-date"]:checked');
      if (!picked) { msg.textContent = 'Please pick a session.'; msg.className = 'text-[11px] min-h-[1rem] mb-4 text-accent'; return; }
      patch.sessionDate = picked.value;
    } else if (ctx.mode === 'participants') {
      patch.participants = ctx.draft.participants;
    }

    const result = await GALLERY.api.updateReservation(ctx.reservationId, patch);
    if (!result.ok) {
      if (result.error === 'window_closed') msg.textContent = 'Changes locked — sessions within 48 hours cannot be edited.';
      else if (result.error === 'no_capacity') msg.textContent = 'Not enough seats for that party size.';
      else if (result.error === 'session_past') msg.textContent = 'That session is in the past.';
      else msg.textContent = 'Could not update — please try again.';
      msg.className = 'text-[11px] min-h-[1rem] mb-4 text-accent';
      return;
    }
    Utils.toast(ctx.mode === 'date' ? 'Reservation rescheduled' : 'Participants updated');
    closeUpdateModal();
  }

  function closeUpdateModal() {
    const modal = Utils.qs('#update-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    updateContext = null;
  }

  /* ============================================================
     COMPARISONS — kullanıcının kaydettiği karşılaştırmalar (Req 11)
     ============================================================ */

  function renderComparisons() {
    const root = Utils.qs('#comparisons-list');
    const empty = Utils.qs('#comparisons-empty');
    const header = Utils.qs('#comparisons-header');
    if (!root) return;

    const items = Store.Comparisons.list();
    if (header) header.textContent = `${items.length} ${items.length === 1 ? 'comparison' : 'comparisons'} saved`;

    if (items.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = items.map(c => {
      const ids = (c.payload && c.payload.ids) || [];
      const type = (c.payload && c.payload.type) || 'artworks';
      const names = ids.map(id => {
        const it = type === 'events' ? GALLERY.getWorkshop(id) : GALLERY.getArtwork(id);
        return it && it.title ? it.title : id;
      });
      const href = `compare.html?tab=${type}&ids=${ids.join(',')}`;
      const saved = c.savedAt ? new Date(c.savedAt).toLocaleString() : '';
      return `
        <article class="bg-surface border border-line p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div class="flex-1 min-w-0">
            <p class="text-[11px] uppercase tracking-lux text-ink-muted">${type === 'events' ? 'Workshops & Events' : 'Artworks'} · ${ids.length} items</p>
            <h3 class="font-display text-xl text-ink-strong mt-1 truncate">${names.map(Utils.escapeHTML).join(' · ')}</h3>
            <p class="text-[11px] text-ink-muted mt-1">${Utils.escapeHTML(saved)}</p>
          </div>
          <div class="flex gap-2 md:items-end">
            <a href="${href}" class="text-[11px] uppercase tracking-lux text-brand border border-brand/30 px-4 py-2 hover:bg-brand hover:text-white transition-colors">Reopen</a>
            <button data-id="${c.id}" class="cmp-remove text-[11px] uppercase tracking-lux text-accent border border-accent/30 px-4 py-2 hover:bg-accent hover:text-white transition-colors">Remove</button>
          </div>
        </article>`;
    }).join('');

    Utils.qsa('.cmp-remove', root).forEach(b => b.addEventListener('click', () => {
      Store.Comparisons.remove(b.getAttribute('data-id'));
      Utils.toast('Comparison removed');
    }));
  }

  /* ============================================================
     OFFERS — kullanıcıya özel ve genel indirim kuponları (Req 9)
     ============================================================ */

  async function renderOffers() {
    const root = Utils.qs('#offers-list');
    const empty = Utils.qs('#offers-empty');
    const header = Utils.qs('#offers-header');
    if (!root) return;

    const user = Store.User.get();
    const offers = await GALLERY.api.listOffers(user && user.email);

    if (header) header.textContent = `${offers.length} ${offers.length === 1 ? 'offer' : 'offers'} available`;

    if (offers.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    const personalCodes = new Set();
    if (user && GALLERY.OFFERS[user.email.toLowerCase()]) {
      GALLERY.OFFERS[user.email.toLowerCase()].forEach(o => personalCodes.add(o.code));
    }

    root.innerHTML = offers.map(o => {
      const personal = personalCodes.has(o.code);
      const scopeLabel = ({ workshops: 'Workshops only', all: 'Artworks & Workshops', public: 'Public offer' })[o.scope] || o.scope;
      return `
        <article class="bg-surface border ${personal ? 'border-brand' : 'border-line'} p-6 relative">
          ${personal ? '<span class="absolute -top-3 left-6 bg-brand text-white px-3 py-1 text-[10px] uppercase tracking-lux">For You</span>' : ''}
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(scopeLabel)}</p>
          <h3 class="font-display text-2xl text-ink-strong mt-2">${Utils.escapeHTML(o.label)}</h3>
          <p class="text-sm text-ink-muted mt-2 leading-relaxed">${Utils.escapeHTML(o.description || '')}</p>
          <div class="mt-5 flex items-center gap-3">
            <code class="font-mono text-base tracking-wider text-brand bg-bg-soft border border-dashed border-brand/40 px-4 py-2">${Utils.escapeHTML(o.code)}</code>
            <button data-code="${Utils.escapeHTML(o.code)}" class="copy-offer text-[11px] uppercase tracking-lux text-ink-muted hover:text-brand border-b border-line hover:border-brand pb-0.5 transition-colors">Copy Code</button>
          </div>
        </article>`;
    }).join('');

    Utils.qsa('.copy-offer', root).forEach(b => b.addEventListener('click', async () => {
      const code = b.getAttribute('data-code');
      try {
        await navigator.clipboard.writeText(code);
        Utils.toast(`${code} copied`);
      } catch (_) {
        Utils.toast(code);
      }
    }));
  }

  /* ============================================================
     FAVORITES
     ============================================================ */

  async function renderFavorites() {
    const root = Utils.qs('#favorites-grid');
    const empty = Utils.qs('#favorites-empty');
    const header = Utils.qs('#favorites-header');
    if (!root) return;

    const ids = await GALLERY.api.favorites.list();
    const list = ids.map(id => GALLERY.getArtwork(id)).filter(Boolean);

    if (header) header.textContent = `${list.length} ${list.length === 1 ? 'work' : 'works'} you are keeping in mind`;

    if (list.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = list.map(a => `
      <div class="bg-surface border border-line group">
        <a href="artwork-detail.html?id=${a.id}" class="block overflow-hidden bg-bg-image aspect-[4/5]">
          <img src="${Utils.img(a.images[0], 600)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom" />
        </a>
        <div class="p-5">
          <h3 class="font-display text-lg text-ink-strong">${Utils.escapeHTML(a.title)}</h3>
          <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
          <p class="text-brand mt-2">${a.sold ? '<span class="line-through text-ink-muted">' + Utils.fmtMoney(a.price) + '</span> · Sold' : Utils.fmtMoney(a.price)}</p>
          <div class="mt-4 flex items-center justify-between">
            <a href="artwork-detail.html?id=${a.id}" class="text-[10px] uppercase tracking-lux text-brand border-b border-brand/40 pb-0.5 hover:text-brand-hover">View Work →</a>
            <button data-id="${a.id}" class="remove-fav text-[10px] uppercase tracking-lux text-accent hover:text-brand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="inline-block mr-1 -mt-0.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Remove
            </button>
          </div>
        </div>
      </div>`).join('');

    Utils.qsa('.remove-fav', root).forEach(b => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      await GALLERY.api.favorites.remove(id);
      Utils.toast('Removed from favorites');
    }));
  }

  function bindForms() {
    Utils.qs('#profile-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const result = await GALLERY.api.updateProfile({
        name:  (data.get('firstName') || '').trim() + ' ' + (data.get('lastName') || '').trim(),
        email: (data.get('email') || '').trim(),
        phone: (data.get('phone') || '').trim(),
        address: (data.get('address') || '').trim(),
      });
      if (!result.ok) {
        Utils.toast(result.error === 'not_authed' ? 'Sign in to save profile' : 'Could not save profile');
        return;
      }
      Utils.toast('Profile saved');
      Utils.qs('#user-name').textContent = (result.user.name || 'Friend').split(' ')[0];
    });

    Utils.qs('#security-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const inputs = e.target.querySelectorAll('input[type=password]');
      const current = inputs[0].value;
      const next = inputs[1].value;
      const confirm = inputs[2].value;
      const msg = e.target.querySelector('.form-msg') || (() => {
        const p = document.createElement('p');
        p.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux min-h-[1rem]';
        e.target.insertBefore(p, e.target.querySelector('button').parentElement);
        return p;
      })();
      if (next.length < 8) { msg.textContent = 'New password must be at least 8 characters.'; msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]'; return; }
      if (next !== confirm) { msg.textContent = 'New passwords do not match.'; msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]'; return; }

      const result = await GALLERY.api.changePassword(current, next);
      if (!result.ok) {
        if (result.error === 'wrong_password') msg.textContent = 'Current password is incorrect.';
        else if (result.error === 'not_authed') msg.textContent = 'Sign in to change your password.';
        else if (result.error === 'weak_password') msg.textContent = 'Password must be at least 8 characters.';
        else msg.textContent = 'Could not update password.';
        msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]';
        return;
      }
      msg.textContent = 'Password updated successfully.';
      msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-brand min-h-[1rem]';
      Utils.toast('Password updated');
      e.target.reset();
    });

    Utils.qs('#signout-btn')?.addEventListener('click', async () => {
      await GALLERY.api.logout();
      Utils.toast('Signed out');
      setTimeout(() => location.href = 'index.html', 600);
    });
  }
})();
