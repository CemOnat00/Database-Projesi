/* ============================================================
   pages/dashboard.js — Kullanıcı paneli (backend bağlı)
   • GET /profil → form prefill
   • GET /siparisler → orders pane
   • GET /rezervasyonlar → reservations pane (edit/cancel)
   • GET /favoriler → favorites pane
   • GET /firsatlar → offers pane (kullanıcıya özel)
   • PUT /profil, PUT /profil/sifre
   ============================================================ */

(function () {
  'use strict';

  let updateContext = null; // { reservationId, mode, draft }
  let cachedWorkshops = null;

  Utils.onReady(async function () {
    // Guard: must be signed-in
    if (!Store.User.isAuthed()) {
      Utils.toast('Sign in to view your dashboard');
      setTimeout(() => location.href = 'auth.html?next=dashboard.html', 600);
      return;
    }

    // Admin müşteri paneline gelmesin → admin paneline yönlendir
    if (Store.User.isAdmin()) {
      Utils.toast('Opening admin panel…');
      setTimeout(() => location.href = 'admin/index.html', 500);
      return;
    }

    // Profil her zaman taze çekilir (rol değişmiş olabilir)
    try {
      const profile = await GALLERY.api.getProfile();
      Store.User.set({
        id: profile.id, name: profile.ad_soyad, email: profile.email,
        role: profile.rol, rol: profile.rol, kayitTarihi: profile.kayit_tarihi,
      }, Store.User.token());
    } catch (_) { /* offline → mevcut session ile devam */ }

    const user = Store.User.get();
    if (user) {
      Utils.qs('#user-name').textContent = (user.name || 'Friend').split(' ')[0];
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
    // Pre-fill hidden username for password manager in security form
    set('#security-form input[name="username"]', user.email);
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
    try {
      const [orders, reservations, favIds] = await Promise.all([
        GALLERY.api.listOrders().catch(() => []),
        GALLERY.api.listReservations().catch(() => []),
        GALLERY.api.favorites.list().catch(() => []),
      ]);

      Utils.qs('#stat-orders').textContent = orders.length;
      Utils.qs('#stat-reservations').textContent = reservations.length;
      Utils.qs('#stat-favorites').textContent = favIds.length;

      const lastOrder = orders[0];
      if (lastOrder) {
        const items = (lastOrder.items || []).map(i => i.title).join(' + ');
        Utils.qs('#last-order').innerHTML = `
          <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-3">Latest Order</p>
          <h3 class="font-display text-2xl text-ink-strong">#${Utils.escapeHTML(String(lastOrder.id))} · ${Utils.escapeHTML(items || 'Order')}</h3>
          <p class="text-sm text-ink-muted mt-2">${Utils.escapeHTML(lastOrder.status)} · Total ${Utils.fmtMoney(lastOrder.total)}</p>
          <a href="confirmation.html?id=${encodeURIComponent(lastOrder.id)}" class="mt-4 inline-block text-[11px] uppercase tracking-lux text-brand border-b border-brand/40 pb-0.5">View Details →</a>
        `;
      } else {
        Utils.qs('#last-order').innerHTML = `
          <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-3">Latest Order</p>
          <p class="font-display italic text-ink-muted">No orders yet — <a href="gallery.html" class="underline">browse the gallery</a>.</p>`;
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
          <p class="font-display italic text-ink-muted">No reservations yet — <a href="workshops.html" class="underline">browse workshops</a>.</p>`;
      }
    } catch (e) {
      console.warn('overview failed', e);
    }
  }

  async function renderOrders() {
    const root = Utils.qs('#orders-tbody');
    const empty = Utils.qs('#orders-empty');
    if (!root) return;

    let orders = [];
    try { orders = await GALLERY.api.listOrders(); }
    catch (e) { console.warn('orders load failed', e); }

    if (orders.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = orders.map(o => {
      const statusClass =
        o.status === 'Delivered' || o.status === 'Completed' || o.status === 'Tamamlandi' ? 'text-brand border-brand/30' :
        o.status === 'Cancelled' ? 'text-ink-muted border-line' :
        'text-accent border-accent/30';
      return `
        <tr>
          <td class="px-5 py-4">#${Utils.escapeHTML(String(o.id))}</td>
          <td>${(o.items || []).length} item${(o.items || []).length > 1 ? 's' : ''}</td>
          <td>${Utils.escapeHTML(o.date || '')}</td>
          <td>${Utils.fmtMoney(o.total || 0)}</td>
          <td><span class="text-[10px] uppercase tracking-lux ${statusClass} border px-2 py-1">${Utils.escapeHTML(o.status || '—')}</span></td>
          <td class="text-right pr-5"><a href="confirmation.html?id=${encodeURIComponent(o.id)}" class="text-[11px] uppercase tracking-lux border-b border-ink-strong/30 hover:border-brand">View</a></td>
        </tr>`;
    }).join('');
  }

  async function renderReservations() {
    const root = Utils.qs('#reservations-list');
    const empty = Utils.qs('#reservations-empty');
    const header = Utils.qs('#reservations-header');
    if (!root) return;

    let reservations = [];
    try { reservations = await GALLERY.api.listReservations(); }
    catch (e) { console.warn('reservations load failed', e); }

    if (header) header.textContent = `${reservations.length} ${reservations.length === 1 ? 'session' : 'sessions'} held`;

    if (reservations.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = reservations.map(r => {
      const w = r._workshop || {};
      const locked = isLocked(r);
      return `
        <article class="bg-surface border border-line p-6 flex flex-col md:flex-row gap-5">
          <div class="md:w-32 h-32 overflow-hidden bg-bg-image flex-shrink-0">
            <img src="${Utils.img(w.image, 300)}" alt="" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1">
            <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(w.category || 'Workshop')} · ${Utils.escapeHTML(r.status || 'Confirmed')}</p>
            <h3 class="font-display text-2xl text-ink-strong mt-1">${Utils.escapeHTML(r.workshopTitle)}</h3>
            <p class="text-sm text-ink-muted mt-1">${Utils.escapeHTML(r.sessionLabel || '')} · ${Utils.escapeHTML(r.sessionTime || '')}</p>
            <p class="text-sm text-ink-muted">${r.participants} participant${r.participants > 1 ? 's' : ''} · ${r.total ? Utils.fmtMoney(r.total) : 'Complimentary'}</p>
            ${locked ? '<p class="mt-3 text-[11px] text-accent uppercase tracking-lux">Changes locked — within 48 hours of session.</p>' : ''}
          </div>
          <div class="flex flex-col gap-2 md:items-end">
            <button data-action="edit-participants" data-id="${r.id}" ${locked ? 'disabled' : ''} class="res-btn text-[11px] uppercase tracking-lux text-brand border border-brand/30 px-4 py-2 hover:bg-brand hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Participants</button>
            <button data-action="cancel" data-id="${r.id}" ${locked ? 'disabled' : ''} class="res-btn text-[11px] uppercase tracking-lux text-accent border border-accent/30 px-4 py-2 hover:bg-accent hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Cancel</button>
          </div>
        </article>`;
    }).join('');

    Utils.qsa('.res-btn', root).forEach(btn => btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'edit-participants') openUpdateModal(id, 'participants', reservations);
      else if (action === 'cancel') cancelReservation(id);
    }));
  }

  function isLocked(reservation) {
    if (!reservation.sessionDate) return false;
    const hoursUntil = (new Date(reservation.sessionDate) - new Date()) / 36e5;
    return hoursUntil < (GALLERY.SITE.cancellationWindowHours || 48);
  }

  async function cancelReservation(reservationId) {
    if (!confirm('Cancel this reservation? This cannot be undone.')) return;
    try {
      await GALLERY.api.cancelReservation(reservationId);
      Utils.toast('Reservation cancelled');
      renderReservations();
      renderOverview();
    } catch (e) {
      Utils.toast(e.message || 'Could not cancel');
    }
  }

  /* ---- Update modal (participants only — backend tarih değişimi desteklemiyor) ---- */

  function openUpdateModal(reservationId, mode, reservations) {
    const reservation = (reservations || []).find(r => String(r.id) === String(reservationId));
    if (!reservation) return;

    updateContext = {
      reservationId,
      mode,
      draft: { participants: reservation.participants },
      reservation,
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

    // Backend currently supports participant update only
    modeLabel.textContent = 'Update Participants';
    datePicker.classList.add('hidden');
    partBlock.classList.remove('hidden');
    refreshParticipantsDraft();

    const modal = Utils.qs('#update-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function refreshParticipantsDraft() {
    const ctx = updateContext;
    if (!ctx) return;
    const w = (ctx.reservation && ctx.reservation._workshop) || {};
    const maxAvailable = w.complimentary
      ? (w.capacity || 99)
      : ((w.spotsLeft || 0) + (ctx.reservation.participants || 0));

    Utils.qs('#upd-value').textContent = ctx.draft.participants;
    Utils.qs('#upd-hint').textContent = `Up to ${maxAvailable} participant${maxAvailable > 1 ? 's' : ''} for this session`;
    Utils.qs('#upd-dec').disabled = ctx.draft.participants <= 1;
    Utils.qs('#upd-inc').disabled = ctx.draft.participants >= maxAvailable;
  }

  function bindUpdateModal() {
    Utils.qs('#upd-dec')?.addEventListener('click', () => {
      if (!updateContext) return;
      if (updateContext.draft.participants > 1) { updateContext.draft.participants--; refreshParticipantsDraft(); }
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
    try {
      await GALLERY.api.updateReservation(ctx.reservationId, { participants: ctx.draft.participants });
      Utils.toast('Participants updated');
      closeUpdateModal();
      renderReservations();
    } catch (e) {
      msg.textContent = e.message || 'Could not update — please try again.';
      msg.className = 'text-[11px] min-h-[1rem] mb-4 text-accent';
    }
  }

  function closeUpdateModal() {
    const modal = Utils.qs('#update-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    updateContext = null;
  }

  /* ---- Favorites ---- */
  async function renderFavorites() {
    const root = Utils.qs('#favorites-grid');
    const empty = Utils.qs('#favorites-empty');
    const header = Utils.qs('#favorites-header');
    if (!root) return;

    let list = [];
    try { list = await GALLERY.api.favorites.listFull(); }
    catch (e) { console.warn('favorites load failed', e); }

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
          <img src="${Utils.img(a.image || (a.images && a.images[0]), 600)}" alt="${Utils.escapeHTML(a.title)}" class="w-full h-full object-cover img-zoom" />
        </a>
        <div class="p-5">
          <h3 class="font-display text-lg text-ink-strong">${Utils.escapeHTML(a.title)}</h3>
          <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(a.artist)}</p>
          <p class="text-brand mt-2">${a.sold ? '<span class="line-through text-ink-muted">' + Utils.fmtMoney(a.price) + '</span> · Sold' : Utils.fmtMoney(a.price)}</p>
          <div class="mt-4 flex items-center justify-between">
            <a href="artwork-detail.html?id=${a.id}" class="text-[10px] uppercase tracking-lux text-brand border-b border-brand/40 pb-0.5">View Work →</a>
            <button data-id="${a.id}" class="remove-fav text-[10px] uppercase tracking-lux text-accent hover:text-brand">Remove</button>
          </div>
        </div>
      </div>`).join('');

    Utils.qsa('.remove-fav', root).forEach(b => b.addEventListener('click', async () => {
      try {
        await GALLERY.api.favorites.remove(b.getAttribute('data-id'));
        Utils.toast('Removed from favorites');
        renderFavorites();
      } catch (e) { Utils.toast(e.message || 'Could not remove'); }
    }));
  }

  /* ---- Offers ---- */
  async function renderOffers() {
    const root = Utils.qs('#offers-list');
    const empty = Utils.qs('#offers-empty');
    const header = Utils.qs('#offers-header');
    if (!root) return;

    let offers = [];
    try {
      const user = Store.User.get();
      offers = await GALLERY.api.listOffers(user && user.email);
    } catch (e) { console.warn('offers load failed', e); }

    if (header) header.textContent = `${offers.length} ${offers.length === 1 ? 'offer' : 'offers'} available`;

    if (offers.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = offers.map(o => {
      const personal = o.scope === 'all' || o.scope === 'personal';
      const scopeLabel = ({ workshops: 'Workshops only', all: 'Artworks & Workshops', public: 'Public offer', personal: 'For You' })[o.scope] || o.scope;
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
      try { await navigator.clipboard.writeText(code); Utils.toast(`${code} copied`); }
      catch (_) { Utils.toast(code); }
    }));
  }

  /* ---- Comparisons (local only — backend list endpoint yok) ---- */
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
      const href = `compare.html?tab=${type}&ids=${ids.join(',')}`;
      const saved = c.savedAt ? new Date(c.savedAt).toLocaleString() : '';
      return `
        <article class="bg-surface border border-line p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div class="flex-1 min-w-0">
            <p class="text-[11px] uppercase tracking-lux text-ink-muted">${type === 'events' ? 'Workshops & Events' : 'Artworks'} · ${ids.length} items</p>
            <h3 class="font-display text-xl text-ink-strong mt-1">IDs: ${Utils.escapeHTML(ids.join(', '))}</h3>
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

  /* ---- Forms (profile, security, signout) ---- */
  function bindForms() {
    Utils.qs('#profile-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const name = (data.get('firstName') || '').trim() + ' ' + (data.get('lastName') || '').trim();
      try {
        const result = await GALLERY.api.updateProfile({ name: name.trim() });
        Utils.toast('Profile saved');
        if (result && result.user) {
          Utils.qs('#user-name').textContent = ((result.user.ad_soyad || name) || 'Friend').split(' ')[0];
        }
      } catch (err) {
        Utils.toast(err.message || 'Could not save profile');
      }
    });

    Utils.qs('#security-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const current = data.get('current_password') || '';
      const next = data.get('new_password') || '';
      const confirmPw = data.get('confirm_password') || '';
      let msg = e.target.querySelector('.form-msg');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux min-h-[1rem]';
        e.target.insertBefore(msg, e.target.querySelector('button').parentElement);
      }
      if (!current) { msg.textContent = 'Please enter your current password.'; msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]'; return; }
      if (next.length < 6) { msg.textContent = 'New password must be at least 6 characters.'; msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]'; return; }
      if (next !== confirmPw) { msg.textContent = 'New passwords do not match.'; msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]'; return; }
      if (current === next) { msg.textContent = 'New password must be different from current password.'; msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]'; return; }

      try {
        const result = await GALLERY.api.changePassword(current, next);
        if (!result.ok) {
          if (result.error === 'wrong_password') msg.textContent = 'Current password is incorrect.';
          else if (result.error === 'weak_password') msg.textContent = 'Password must be at least 6 characters.';
          else msg.textContent = 'Could not update password.';
          msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]';
          return;
        }
        msg.textContent = 'Password updated successfully.';
        msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-brand min-h-[1rem]';
        Utils.toast('Password updated');
        e.target.reset();
      } catch (err) {
        msg.textContent = err.message || 'Could not update password.';
        msg.className = 'form-msg md:col-span-2 text-[11px] uppercase tracking-lux text-accent min-h-[1rem]';
      }
    });

    Utils.qs('#signout-btn')?.addEventListener('click', async () => {
      await GALLERY.api.logout();
      Utils.toast('Signed out');
      setTimeout(() => location.href = 'index.html', 600);
    });
  }
})();
