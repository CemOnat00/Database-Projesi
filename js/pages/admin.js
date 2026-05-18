/* ============================================================
   pages/admin.js — KPI'leri, top tabloları, grafik ve aktivite akışı
   dataset'ten hesaplar.
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(function () {
    renderKPIs();
    renderChart();
    renderTopArtworks();
    renderTopWorkshops();
    renderActivity();
    renderSummaryReport();
    renderReviewsManagement();
    bindExport();
  });

  function renderKPIs() {
    const totalOrders = GALLERY.ORDERS.length + 215;  // gerçek + simüle baz
    const revenue = GALLERY.ORDERS.reduce((s, o) => s + o.total, 0) + 275000;
    const reservations = Store.Reservations.list().length + 92;
    const ratings = [];
    GALLERY.ARTWORKS.forEach(a => { if (a.stats?.reviewCount) ratings.push(4.8); });
    GALLERY.WORKSHOPS.forEach(w => { if (w.stats?.rating) ratings.push(w.stats.rating); });
    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2) : '0.00';

    Utils.qs('#kpi-orders').textContent = totalOrders;
    Utils.qs('#kpi-reservations').textContent = reservations;
    Utils.qs('#kpi-revenue').textContent = '$' + Math.round(revenue / 1000) + 'K';
    Utils.qs('#kpi-rating').textContent = avgRating;
  }

  function renderChart() {
    const data = [32, 45, 54, 62, 48, 71, 82, 64, 58, 73, 88, 95];
    const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const max = Math.max(...data);
    Utils.qs('#chart').innerHTML = data.map((d, i) => `
      <div class="flex-1 flex flex-col items-center gap-2">
        <div class="bar" style="height:${(d / max * 100).toFixed(1)}%"></div>
        <p class="text-[10px] ${i === labels.length - 1 ? 'text-ink-strong font-medium' : 'text-ink-muted'}">${labels[i]}</p>
      </div>
    `).join('');
  }

  function renderTopArtworks() {
    const root = Utils.qs('#top-artworks');
    const sorted = GALLERY.ARTWORKS.slice().sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0)).slice(0, 5);
    root.innerHTML = sorted.map(a => `
      <tr>
        <td class="px-6 py-3 font-display">${Utils.escapeHTML(a.title)}</td>
        <td class="text-right">${a.stats?.likes ?? 0}</td>
        <td class="text-right">${(a.stats?.views ?? 0).toLocaleString()}</td>
        <td class="text-right pr-6">${a.stats?.reviewCount ?? 0}</td>
      </tr>`).join('');
  }

  function renderTopWorkshops() {
    const root = Utils.qs('#top-workshops');
    const sorted = GALLERY.WORKSHOPS.slice().sort((a, b) => (b.stats?.occupancy || 0) - (a.stats?.occupancy || 0));
    // Merge live reservations + simulated base from occupancy data
    const allRes = Store.Reservations.listIncludingHistory
      ? Store.Reservations.listIncludingHistory()
      : Store.Reservations.list();
    root.innerHTML = sorted.map(w => {
      const liveRes  = allRes.filter(r => r.workshopId === w.id).length;
      const baseRes  = Math.round((w.stats?.occupancy || 0) * (w.capacity || 10) * 6);
      const totalRes = liveRes + baseRes;
      return `<tr>
        <td class="px-6 py-3 font-display">${Utils.escapeHTML(w.title)}</td>
        <td class="text-right">${Math.round((w.stats?.occupancy || 0) * 100)}%</td>
        <td class="text-right">${w.stats?.rating ?? '—'}</td>
        <td class="text-right">${w.stats?.reviewCount ?? 0}</td>
        <td class="text-right pr-6">${totalRes}</td>
      </tr>`;
    }).join('');
  }

  function renderActivity() {
    const activity = [
      { dot: 'bg-brand', text: 'New order <strong>#TCG-2026-0419</strong> from Cem Yıldız — $6,138', when: '2 min ago' },
      { dot: 'bg-accent', text: 'Reservation cancelled · Iliana Berg · Generative Art', when: '1 hr ago' },
      { dot: 'bg-brand', text: 'New review (5★) on <em>Midnight Resonance</em> by Cordelia Marsh', when: '3 hr ago' },
      { dot: 'bg-brand', text: 'Support ticket <strong>#3812</strong> opened — Condition report request', when: '5 hr ago' },
      { dot: 'bg-brand', text: 'Workshop <em>Botanical Watercolors</em> · 2 new bookings', when: 'Yesterday' },
    ];
    Utils.qs('#activity').innerHTML = activity.map(a => `
      <li class="flex items-center gap-5 py-4">
        <span class="w-2 h-2 ${a.dot} rounded-full flex-shrink-0"></span>
        <div class="flex-1"><p class="text-sm text-ink-strong">${a.text}</p></div>
        <span class="text-[11px] uppercase tracking-lux text-ink-muted">${a.when}</span>
      </li>`).join('');
  }

  // Req 16: Summary report — aggregate stats across artworks and workshops
  function renderSummaryReport() {
    const root = Utils.qs('#summary-report');
    if (!root) return;

    const totalLikes   = GALLERY.ARTWORKS.reduce((s, a) => s + (a.stats?.likes || 0), 0);
    const totalViews   = GALLERY.ARTWORKS.reduce((s, a) => s + (a.stats?.views || 0), 0);
    const artworkRevs  = GALLERY.ARTWORKS.reduce((s, a) => s + ((GALLERY.REVIEWS[a.id] || []).length || a.stats?.reviewCount || 0), 0);
    const workshopRevs = GALLERY.WORKSHOPS.reduce((s, w) => s + ((GALLERY.REVIEWS[w.id] || []).length || w.stats?.reviewCount || 0), 0);
    const avgWsRating  = (GALLERY.WORKSHOPS.reduce((s, w) => s + (w.stats?.rating || 0), 0) / GALLERY.WORKSHOPS.length).toFixed(2);
    const allRes       = Store.Reservations.listIncludingHistory
      ? Store.Reservations.listIncludingHistory()
      : Store.Reservations.list();
    const baseRes      = GALLERY.WORKSHOPS.reduce((s, w) => s + Math.round((w.stats?.occupancy || 0) * (w.capacity || 10) * 6), 0);
    const totalRes     = allRes.length + baseRes;
    const soldArtworks = GALLERY.ARTWORKS.filter(a => a.sold).length;
    const activeArtworks = GALLERY.ARTWORKS.length - soldArtworks;

    root.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Total Likes</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${totalLikes.toLocaleString()}</p>
        </div>
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Total Views</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${totalViews.toLocaleString()}</p>
        </div>
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Artwork Reviews</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${artworkRevs}</p>
        </div>
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Workshop Reviews</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${workshopRevs}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Avg Workshop Rating</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${avgWsRating} <span class="text-accent text-xl">★</span></p>
        </div>
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Total Reservations</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${totalRes.toLocaleString()}</p>
        </div>
        <div class="bg-bg-soft border border-line p-5">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Active Artworks</p>
          <p class="font-display text-3xl text-ink-strong mt-2">${activeArtworks} <span class="text-sm text-ink-muted font-normal">/ ${GALLERY.ARTWORKS.length}</span></p>
        </div>
      </div>`;
  }

  // Req 14: Reviews management — list all reviews, allow admin to write/edit replies
  function renderReviewsManagement() {
    const root = Utils.qs('#reviews-mgmt-list');
    const badge = Utils.qs('#reviews-pending-badge');
    if (!root) return;

    const storedReplies = Store.ReviewReplies ? Store.ReviewReplies.map() : {};

    // Build flat list of all reviews with metadata
    const items = [];
    GALLERY.ARTWORKS.forEach(a => {
      (GALLERY.REVIEWS[a.id] || []).forEach((r, idx) => {
        const persisted = storedReplies[a.id] && storedReplies[a.id][String(idx)];
        items.push({
          targetId: a.id, targetTitle: a.title, targetType: 'Artwork',
          r, idx,
          reply: persisted !== undefined ? persisted : (r.reply || ''),
        });
      });
    });
    GALLERY.WORKSHOPS.forEach(w => {
      (GALLERY.REVIEWS[w.id] || []).forEach((r, idx) => {
        const persisted = storedReplies[w.id] && storedReplies[w.id][String(idx)];
        items.push({
          targetId: w.id, targetTitle: w.title, targetType: 'Workshop',
          r, idx,
          reply: persisted !== undefined ? persisted : (r.reply || ''),
        });
      });
    });

    const pending = items.filter(it => !it.reply).length;
    if (badge) {
      badge.textContent = pending > 0 ? `${pending} Awaiting Reply` : 'All Replied';
      badge.className = pending > 0
        ? 'text-[10px] uppercase tracking-lux text-white bg-accent px-3 py-1.5'
        : 'text-[10px] uppercase tracking-lux text-white bg-brand px-3 py-1.5';
    }

    if (items.length === 0) {
      root.innerHTML = '<p class="text-ink-muted italic p-6">No reviews yet.</p>';
      return;
    }

    root.innerHTML = items.map(({ targetId, targetTitle, targetType, r, idx, reply }) => {
      const hasReply = !!reply;
      return `
        <div class="border-b border-line p-6" data-target-id="${Utils.escapeHTML(targetId)}" data-idx="${idx}">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="min-w-0">
              <span class="text-[10px] uppercase tracking-lux text-ink-muted">${targetType} · ${Utils.escapeHTML(targetTitle)}</span>
              <p class="font-display text-base text-ink-strong mt-1 truncate">${Utils.escapeHTML(r.author)} <span class="font-normal text-ink-muted text-sm">· ${Utils.escapeHTML(r.date)}</span></p>
              <div class="flex gap-0.5 text-accent mt-1">${Utils.stars(r.rating, 11)}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              ${r.verified ? '<span class="text-[10px] uppercase tracking-lux text-accent border border-accent/30 px-2 py-1">Verified</span>' : ''}
              <span class="text-[10px] uppercase tracking-lux px-2 py-1 border ${hasReply ? 'text-brand border-brand/30' : 'text-ink-muted border-line'}">${hasReply ? 'Replied' : 'No Reply'}</span>
            </div>
          </div>
          <p class="text-sm text-ink-muted italic mb-4">"${Utils.escapeHTML(r.body)}"</p>
          ${hasReply ? `<div class="bg-bg-soft border-l-2 border-brand p-3 mb-4"><p class="text-[10px] uppercase tracking-lux text-ink-muted mb-1">Current Reply</p><p class="text-sm text-ink-strong">${Utils.escapeHTML(reply)}</p></div>` : ''}
          <div>
            <textarea class="admin-reply-input w-full border border-line p-3 text-sm bg-transparent focus:outline-none focus:border-brand resize-none" rows="2" placeholder="Write a curator's response…">${Utils.escapeHTML(reply)}</textarea>
            <button type="button" class="admin-reply-save mt-2 bg-brand hover:bg-brand-hover text-white px-5 py-2.5 text-[11px] uppercase tracking-lux transition-colors"
              data-target-id="${Utils.escapeHTML(targetId)}" data-idx="${idx}">${hasReply ? 'Update Reply' : 'Post Reply'}</button>
          </div>
        </div>`;
    }).join('');

    Utils.qsa('.admin-reply-save', root).forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target-id');
        const idx      = Number(btn.getAttribute('data-idx'));
        const card     = btn.closest('[data-target-id]');
        const input    = card.querySelector('.admin-reply-input');
        const text     = (input ? input.value : '').trim();
        if (!text) { Utils.toast('Reply cannot be empty'); return; }
        const result = await GALLERY.api.replyToReview(targetId, idx, text);
        if (!result.ok) { Utils.toast('Could not save reply'); return; }
        Utils.toast('Reply saved successfully');
        renderReviewsManagement();
      });
    });
  }

  function bindExport() {
    Utils.qs('#export-btn')?.addEventListener('click', () => {
      Utils.toast('Generating CSV export…');
    });
  }
})();
