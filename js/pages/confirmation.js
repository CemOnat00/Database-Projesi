/* ============================================================
   pages/confirmation.js — URL ?id= ile sipariş yükler;
   yoksa LastOrder veya en yeni statik siparişi gösterir.
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    const idParam = Utils.paramId('id');
    let order = null;

    if (idParam) {
      order = await GALLERY.api.getOrder(idParam);
      if (!order) {
        renderNotFound(idParam);
        return;
      }
    } else {
      order = Store.LastOrder.get() || (await GALLERY.api.listOrders())[0];
    }
    if (!order) {
      renderEmpty();
      return;
    }

    document.title = `Order ${order.id} — The Curated Gallery`;

    Utils.qs('#order-id').textContent = '#' + order.id;
    Utils.qs('#order-total').innerHTML = Utils.fmtMoney(order.total) + ' <span class="text-base text-ink-muted">USD</span>';

    Utils.qs('#order-items').innerHTML = (order.items || []).map(it => `
      <li class="flex gap-5 py-5">
        <div class="w-24 h-24 overflow-hidden bg-bg-image"><img src="${Utils.img(it.image || pickFallbackImage(it), 300)}" alt="" class="w-full h-full object-cover" /></div>
        <div class="flex-1">
          <p class="font-display text-lg text-ink-strong">${Utils.escapeHTML(it.title)}</p>
          <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${Utils.escapeHTML(it.artist || '')}${it.type === 'artwork' ? ' · ' + (GALLERY.getArtwork(it.refId)?.mediumShort || '') : ''}</p>
          <p class="text-sm text-ink-muted mt-2">${it.type === 'workshop' ? `${it.qty || 1} participants · The Atelier, 2nd Floor` : 'Estimated delivery: 14–21 days · Insured'}</p>
        </div>
        <p class="text-ink-strong">${Utils.fmtMoney((it.price || 0) * (it.qty || 1))}</p>
      </li>
    `).join('');

    // Optional meta-detail strip (payment + status + date)
    const meta = Utils.qs('#order-meta');
    if (meta) {
      const payLabel = ({ card: 'Credit / Debit Card', paypal: 'PayPal', bank: 'Bank Transfer' })[order.paymentMethod] || '—';
      meta.innerHTML = `
        <div><dt class="text-[11px] uppercase tracking-lux text-ink-muted">Status</dt><dd class="text-sm text-ink-strong mt-1">${Utils.escapeHTML(order.status || 'Preparing')}</dd></div>
        <div><dt class="text-[11px] uppercase tracking-lux text-ink-muted">Payment</dt><dd class="text-sm text-ink-strong mt-1">${payLabel}</dd></div>
        <div><dt class="text-[11px] uppercase tracking-lux text-ink-muted">Placed</dt><dd class="text-sm text-ink-strong mt-1">${Utils.escapeHTML(order.date || '—')}</dd></div>
      `;
    }
  });

  function pickFallbackImage(it) {
    if (it.type === 'workshop') return GALLERY.getWorkshop(it.refId)?.image || '';
    return GALLERY.getArtwork(it.refId)?.images?.[0] || '';
  }

  function renderNotFound(id) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
      <section class="max-w-3xl mx-auto px-6 lg:px-12 py-32 text-center">
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-4">Not Found</p>
        <h1 class="font-display text-5xl text-ink-strong">We could not find that order.</h1>
        <p class="mt-6 text-ink-muted">Reference <code class="text-brand">${Utils.escapeHTML(id)}</code> is not in our records. If you believe this is an error, write to the curator.</p>
        <div class="mt-10 flex justify-center gap-3">
          <a href="dashboard.html?pane=orders" class="bg-brand hover:bg-brand-hover text-white px-8 py-4 text-[11px] uppercase tracking-lux transition-colors">View My Orders</a>
          <a href="support.html" class="border border-ink-strong/30 px-8 py-4 text-[11px] uppercase tracking-lux text-ink-strong hover:bg-ink-strong hover:text-white transition-colors">Ask the Curator</a>
        </div>
      </section>`;
  }

  function renderEmpty() {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
      <section class="max-w-3xl mx-auto px-6 lg:px-12 py-32 text-center">
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-4">Nothing yet</p>
        <h1 class="font-display text-5xl text-ink-strong italic">No orders to confirm.</h1>
        <p class="mt-6 text-ink-muted">Place an order from the gallery to see its confirmation here.</p>
        <a href="gallery.html" class="mt-10 inline-block bg-brand hover:bg-brand-hover text-white px-8 py-4 text-[11px] uppercase tracking-lux transition-colors">Browse the Collection</a>
      </section>`;
  }
})();
