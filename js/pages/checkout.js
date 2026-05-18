/* ============================================================
   pages/checkout.js — Sepetten oku, kupon uygula, sipariş ver
   Backend-ready: GALLERY.api.createOrder & validateCoupon.
   ============================================================ */

(function () {
  'use strict';

  const state = { discountPct: 0, discountCode: null, paymentMethod: 'card' };

  Utils.onReady(function () {
    prefillFromUser();
    renderItems();
    bindPromo();
    bindPaymentMethod();
    bindSubmit();
    refresh();
    refreshUI();
    Store.subscribe('cart', () => { renderItems(); refresh(); refreshUI(); });
  });

  function prefillFromUser() {
    const user = Store.User.get();
    if (!user) return;
    const set = (sel, val) => { const el = Utils.qs(sel); if (el && val) el.value = val; };
    set('input[type="email"]', user.email);
    set('input[type="tel"]', user.phone);
    if (user.name) {
      const [first, ...rest] = user.name.split(' ');
      set('input[name="firstName"], section:nth-of-type(2) .grid > div:nth-child(1) input', first);
      set('input[name="lastName"], section:nth-of-type(2) .grid > div:nth-child(2) input', rest.join(' '));
    }
    if (user.address) set('section:nth-of-type(2) .grid > div:nth-child(3) input', user.address);
  }

  function renderItems() {
    const root = Utils.qs('#cart-items');
    const items = Store.Cart.items();
    if (items.length === 0) {
      root.innerHTML = '';
      return;
    }
    root.innerHTML = items.map(it => `
      <li class="flex gap-4 py-1">
        <div class="w-20 h-20 overflow-hidden bg-bg-image"><img src="${Utils.img(it.image, 200)}" alt="" class="w-full h-full object-cover" /></div>
        <div class="flex-1">
          <p class="font-display text-ink-strong">${Utils.escapeHTML(it.title)}</p>
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">${Utils.escapeHTML(it.artist)}</p>
          <p class="text-[11px] uppercase tracking-lux text-ink-muted mt-1">${it.type === 'workshop' ? (it.qty || 1) + ' participants' : 'Qty 1'}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-ink-strong">${Utils.fmtMoney(it.price * (it.qty || 1))}</p>
          <button class="mt-2 text-[10px] uppercase tracking-lux text-accent hover:text-brand" onclick="removeCartItem('${it.refId}', '${it.sessionDate || ''}')">Remove</button>
        </div>
      </li>
    `).join('');
  }

  function refreshUI() {
    // Toggle the "empty cart" panel + disable submit when nothing to buy
    const items = Store.Cart.items();
    const empty = Utils.qs('#empty-cart');
    const formArea = Utils.qs('#checkout-form');
    const submitBtn = Utils.qs('#place-order');
    if (items.length === 0) {
      if (empty) empty.classList.remove('hidden');
      if (formArea) formArea.classList.add('opacity-40','pointer-events-none');
      if (submitBtn) submitBtn.disabled = true;
    } else {
      if (empty) empty.classList.add('hidden');
      if (formArea) formArea.classList.remove('opacity-40','pointer-events-none');
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function bindPaymentMethod() {
    Utils.qsa('input[name="pay"]').forEach(r => r.addEventListener('change', () => {
      state.paymentMethod = r.value;
      const cardFields = Utils.qs('#card-fields');
      const bankNotice = Utils.qs('#bank-notice');
      const paypalNotice = Utils.qs('#paypal-notice');
      if (cardFields) cardFields.classList.toggle('hidden', r.value !== 'card');
      if (bankNotice) bankNotice.classList.toggle('hidden', r.value !== 'bank');
      if (paypalNotice) paypalNotice.classList.toggle('hidden', r.value !== 'paypal');
    }));
  }

  function bindPromo() {
    Utils.qs('#promo-apply').addEventListener('click', applyPromo);
    Utils.qs('#promo-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); applyPromo(); }
    });
  }

  async function applyPromo() {
    const code = Utils.qs('#promo-input').value.trim();
    const msg = Utils.qs('#promo-msg');
    if (!code) { state.discountPct = 0; state.discountCode = null; msg.textContent = ''; refresh(); return; }
    const result = await GALLERY.api.validateCoupon(code);
    if (result.ok) {
      state.discountPct = result.pct;
      state.discountCode = result.code;
      msg.textContent = `Applied — ${state.discountPct}% off subtotal.`;
      msg.className = 'mt-2 text-[11px] min-h-[1rem] text-brand';
    } else {
      state.discountPct = 0; state.discountCode = null;
      msg.textContent = 'This code is not recognised.';
      msg.className = 'mt-2 text-[11px] min-h-[1rem] text-accent';
    }
    refresh();
  }

  function bindSubmit() {
    Utils.qs('#checkout-form').addEventListener('submit', async e => {
      e.preventDefault();
      const items = Store.Cart.items();
      if (items.length === 0) { Utils.toast('Cart is empty'); return; }

      const subtotal = Store.Cart.subtotal();
      const discount = Math.round(subtotal * state.discountPct / 100);
      const tax = Math.round((subtotal - discount + GALLERY.SITE.shippingFee) * GALLERY.SITE.taxRate);
      const total = subtotal - discount + GALLERY.SITE.shippingFee + tax;

      const result = await GALLERY.api.createOrder({
        items: items.slice(),
        subtotal,
        shipping: GALLERY.SITE.shippingFee,
        discount,
        discountCode: state.discountCode,
        tax,
        total,
        paymentMethod: state.paymentMethod,
        customer: collectCustomer(),
      });

      if (!result.ok) {
        Utils.toast('Could not place order — please try again.');
        return;
      }
      Store.LastOrder.set(result.order);
      Store.Cart.clear();
      location.href = 'confirmation.html?id=' + encodeURIComponent(result.order.id);
    });
  }

  function collectCustomer() {
    const fd = new FormData(Utils.qs('#checkout-form'));
    return {
      email: Utils.qs('#checkout-form input[type="email"]')?.value,
      phone: Utils.qs('#checkout-form input[type="tel"]')?.value,
    };
  }

  function refresh() {
    const subtotal = Store.Cart.subtotal();
    const discount = Math.round(subtotal * state.discountPct / 100);
    const shipping = subtotal > 0 ? GALLERY.SITE.shippingFee : 0;
    const tax = Math.round((subtotal - discount + shipping) * GALLERY.SITE.taxRate);
    const total = subtotal - discount + shipping + tax;

    Utils.qs('#subtotal').textContent = Utils.fmtMoney(subtotal);
    Utils.qs('#shipping').textContent = shipping ? Utils.fmtMoney(shipping) : 'Free';
    Utils.qs('#tax').textContent = Utils.fmtMoney(tax);
    Utils.qs('#total').innerHTML = Utils.fmtMoney(total) + ' <span class="text-sm text-ink-muted">USD</span>';

    const row = Utils.qs('#disc-row');
    if (discount > 0) {
      row.classList.remove('hidden');
      Utils.qs('#disc-code').textContent = state.discountCode;
      Utils.qs('#disc-amt').textContent = '−' + Utils.fmtMoney(discount);
    } else {
      row.classList.add('hidden');
    }
  }

  window.removeCartItem = function (refId, sessionDate) {
    Store.Cart.remove(refId, sessionDate || null);
    Utils.toast('Removed from cart');
  };
})();
