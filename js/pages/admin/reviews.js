/* ============================================================
   pages/admin/reviews.js — Yorum moderasyonu (Req 14)
   Backend bağlı: tüm eser/etkinlik yorumları dolaşılır,
   yanıtsızlara curator reply atılabilir (POST /admin/yorumlar/:id/yanit).
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/reviews.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    await renderReviewsManagement();
  });

  async function renderReviewsManagement() {
    const root = Utils.qs('#reviews-mgmt-list');
    const badge = Utils.qs('#reviews-pending-badge');
    const counter = Utils.qs('#rev-counter');
    if (!root) return;

    root.innerHTML = '<p class="p-6 text-ink-muted italic">Loading reviews…</p>';

    const [artworks, workshops] = await Promise.all([
      GALLERY.api.listArtworks().catch(() => []),
      GALLERY.api.listWorkshops().catch(() => []),
    ]);

    const tasks = [];
    artworks.forEach(a => tasks.push(GALLERY.api.listReviews(a.id, 'recent', 'eser').then(list => list.map(y => ({ y, target: a, type: 'Artwork' }))).catch(() => [])));
    workshops.forEach(w => tasks.push(GALLERY.api.listReviews(w.id, 'recent', 'etkinlik').then(list => list.map(y => ({ y, target: w, type: 'Workshop' }))).catch(() => [])));
    const buckets = await Promise.all(tasks);
    const items = buckets.flat();

    if (counter) counter.textContent = `${items.length} ${items.length === 1 ? 'review' : 'reviews'} across catalogue`;

    const pending = items.filter(it => !it.y.reply).length;
    if (badge) {
      if (items.length === 0) badge.classList.add('hidden');
      else {
        badge.classList.remove('hidden');
        badge.textContent = pending > 0 ? `${pending} Awaiting Reply` : 'All Replied';
        badge.className = pending > 0
          ? 'text-[10px] uppercase tracking-lux text-white bg-accent px-3 py-1.5'
          : 'text-[10px] uppercase tracking-lux text-white bg-brand px-3 py-1.5';
      }
    }

    if (items.length === 0) {
      root.innerHTML = '<p class="p-6 text-ink-muted italic">No reviews yet.</p>';
      return;
    }

    root.innerHTML = items.map(({ y, target, type }) => {
      const hasReply = !!y.reply;
      return `
        <div class="border-b border-line p-6" data-review-id="${y.id}">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="min-w-0">
              <span class="text-[10px] uppercase tracking-lux text-ink-muted">${type} · ${Utils.escapeHTML(target.title)}</span>
              <p class="font-display text-base text-ink-strong mt-1 truncate">${Utils.escapeHTML(y.author)} <span class="font-normal text-ink-muted text-sm">· ${Utils.escapeHTML(y.date)}</span></p>
              <div class="flex gap-0.5 text-accent mt-1">${Utils.stars(y.rating, 11)}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              ${y.verified ? '<span class="text-[10px] uppercase tracking-lux text-accent border border-accent/30 px-2 py-1">Verified</span>' : ''}
              <span class="text-[10px] uppercase tracking-lux px-2 py-1 border ${hasReply ? 'text-brand border-brand/30' : 'text-ink-muted border-line'}">${hasReply ? 'Replied' : 'No Reply'}</span>
            </div>
          </div>
          <p class="text-sm text-ink-muted italic mb-4">"${Utils.escapeHTML(y.body)}"</p>
          ${hasReply ? `<div class="bg-bg-soft border-l-2 border-brand p-3 mb-4"><p class="text-[10px] uppercase tracking-lux text-ink-muted mb-1">Current Reply</p><p class="text-sm text-ink-strong">${Utils.escapeHTML(y.reply)}</p></div>` : ''}
          <div>
            <textarea class="admin-reply-input w-full border border-line p-3 text-sm bg-transparent focus:outline-none focus:border-brand resize-none" rows="2" placeholder="Write a curator's response…"></textarea>
            <div class="mt-2 flex items-center justify-between gap-3">
              <button type="button" class="admin-reply-save bg-brand hover:bg-brand-hover text-white px-5 py-2.5 text-[11px] uppercase tracking-lux transition-colors" data-review-id="${y.id}">${hasReply ? 'Replace Reply' : 'Post Reply'}</button>
              <button type="button" class="admin-review-delete text-[11px] uppercase tracking-lux text-accent border-b border-accent/40 hover:border-accent pb-0.5" data-review-id="${y.id}">Delete Review</button>
            </div>
          </div>
        </div>`;
    }).join('');

    Utils.qsa('.admin-reply-save', root).forEach(btn => {
      btn.addEventListener('click', async () => {
        const reviewId = Number(btn.getAttribute('data-review-id'));
        const card = btn.closest('.border-b');
        const input = card.querySelector('.admin-reply-input');
        const text = (input ? input.value : '').trim();
        if (text.length < 5) { Utils.toast('Reply must be at least 5 characters'); return; }
        btn.disabled = true; btn.textContent = 'Saving…';
        try {
          await GALLERY.api.replyToReview(reviewId, text);
          Utils.toast('Reply posted');
          renderReviewsManagement();
        } catch (e) {
          Utils.toast(e.message || 'Could not save reply');
          btn.disabled = false; btn.textContent = 'Post Reply';
        }
      });
    });

    Utils.qsa('.admin-review-delete', root).forEach(btn => {
      btn.addEventListener('click', async () => {
        const reviewId = Number(btn.getAttribute('data-review-id'));
        if (!confirm('Delete this review? This permanently removes the review and any curator reply.')) return;
        btn.disabled = true; btn.textContent = 'Deleting…';
        try {
          await GALLERY.api.deleteReview(reviewId);
          Utils.toast('Review deleted');
          renderReviewsManagement();
        } catch (e) {
          Utils.toast(e.message || 'Could not delete review');
          btn.disabled = false; btn.textContent = 'Delete Review';
        }
      });
    });
  }
})();
