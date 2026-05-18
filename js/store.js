/* ============================================================
   js/store.js — localStorage tabanlı state yönetimi
   Sepet, favoriler, karşılaştırma, oturum simülasyonu.
   ============================================================ */

(function (global) {
  'use strict';

  const NS = 'tcg.';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); }
    catch (_) { /* quota or private mode */ }
  }

  /* ---- Pub/Sub ----------------------------------------------- */
  const subs = {};
  function subscribe(channel, fn) {
    (subs[channel] = subs[channel] || []).push(fn);
    return () => { subs[channel] = (subs[channel] || []).filter(x => x !== fn); };
  }
  function emit(channel, payload) {
    (subs[channel] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } });
  }

  /* ---- Cart -------------------------------------------------- */
  const Cart = {
    items() { return read('cart', []); },
    count() { return Cart.items().reduce((n, it) => n + (it.qty || 1), 0); },
    subtotal() { return Cart.items().reduce((s, it) => s + it.price * (it.qty || 1), 0); },
    add(item) {
      const items = Cart.items();
      // For artwork: collapse to qty=1 (each piece is unique); for workshop: store sessionId
      const idx = items.findIndex(x =>
        x.refId === item.refId && x.type === item.type && (x.sessionDate || '') === (item.sessionDate || '')
      );
      if (idx >= 0) {
        if (item.type === 'workshop') items[idx].qty = (items[idx].qty || 1) + (item.qty || 1);
      } else {
        items.push(Object.assign({ qty: 1 }, item));
      }
      write('cart', items); emit('cart', items);
    },
    remove(refId, sessionDate) {
      const items = Cart.items().filter(x => !(x.refId === refId && (x.sessionDate || '') === (sessionDate || '')));
      write('cart', items); emit('cart', items);
    },
    update(refId, qty) {
      const items = Cart.items().map(x => x.refId === refId ? Object.assign({}, x, { qty }) : x);
      write('cart', items); emit('cart', items);
    },
    clear() { write('cart', []); emit('cart', []); },
  };

  /* ---- Favorites --------------------------------------------- */
  const Favorites = {
    list() { return read('favorites', []); },
    count() { return Favorites.list().length; },
    has(id) { return Favorites.list().includes(id); },
    add(id) {
      if (Favorites.has(id)) return false;
      const list = Favorites.list();
      list.push(id);
      write('favorites', list); emit('favorites', list);
      return true;
    },
    remove(id) {
      if (!Favorites.has(id)) return false;
      const list = Favorites.list().filter(x => x !== id);
      write('favorites', list); emit('favorites', list);
      return true;
    },
    toggle(id) {
      // Returns true if just added, false if just removed
      return Favorites.has(id) ? (Favorites.remove(id), false) : (Favorites.add(id), true);
    },
    clear() { write('favorites', []); emit('favorites', []); },
  };

  /* ---- Reservations ------------------------------------------ */
  const Reservations = {
    list() { return read('reservations', []); },
    listIncludingHistory() { return read('reservations', []).concat(read('reservations_history', [])); },
    add(reservation) {
      const list = Reservations.list();
      list.push(Object.assign({ id: 'R' + Date.now(), createdAt: new Date().toISOString() }, reservation));
      write('reservations', list); emit('reservations', list);
      return list[list.length - 1];
    },
    cancel(id) {
      const list = Reservations.list();
      const target = list.find(r => r.id === id);
      if (target) {
        // Move to history with cancelled status (no destruction)
        const history = read('reservations_history', []);
        history.unshift(Object.assign({}, target, { status: 'Cancelled', cancelledAt: new Date().toISOString() }));
        write('reservations_history', history);
      }
      const remaining = list.filter(r => r.id !== id);
      write('reservations', remaining); emit('reservations', remaining);
    },
    update(id, patch) {
      const list = Reservations.list().map(r => r.id === id ? Object.assign({}, r, patch) : r);
      write('reservations', list); emit('reservations', list);
    },
  };

  /* ---- Orders ------------------------------------------------ */
  const Orders = {
    list() { return read('orders', []); },
    add(order) {
      const list = Orders.list();
      list.unshift(order); // newest first
      write('orders', list); emit('orders', list);
      return order;
    },
    find(id) { return Orders.list().find(o => o.id === id); },
  };

  /* ---- Users (registered) ----------------------------------- */
  const Users = {
    list() { return read('users', []); },
    find(email) {
      const e = (email || '').toLowerCase();
      return Users.list().find(u => (u.email || '').toLowerCase() === e);
    },
    add(profile) {
      const list = Users.list();
      list.push(Object.assign({}, profile, { email: (profile.email || '').toLowerCase() }));
      write('users', list); emit('users', list);
      return list[list.length - 1];
    },
    update(email, patch) {
      const e = (email || '').toLowerCase();
      const list = Users.list().map(u => (u.email || '').toLowerCase() === e ? Object.assign({}, u, patch) : u);
      write('users', list); emit('users', list);
    },
  };

  // Seed a default account so the demo works without first registering.
  (function seedDefaultUser() {
    if (Users.list().length === 0) {
      Users.add({
        name: 'Cem Yıldız',
        email: 'cem@example.com',
        password: 'curated123',
        phone: '+90 532 000 0000',
        address: 'Bağdat Cad. 184, İstanbul',
      });
    }
  })();

  /* ---- Waitlist ---------------------------------------------- */
  const Waitlist = {
    list() { return read('waitlist', []); },
    add(entry) {
      const list = Waitlist.list();
      list.push(Object.assign({ id: 'W' + Date.now(), createdAt: new Date().toISOString() }, entry));
      write('waitlist', list); emit('waitlist', list);
      return list[list.length - 1];
    },
    has(workshopId, email) {
      return Waitlist.list().some(w => w.workshopId === workshopId && w.email === email);
    },
  };

  /* ---- Comparisons ------------------------------------------- */
  const Comparisons = {
    save(label, payload) {
      const list = read('comparisons', []);
      list.push({ id: 'C' + Date.now(), label, payload, savedAt: new Date().toISOString() });
      write('comparisons', list); emit('comparisons', list);
    },
    list() { return read('comparisons', []); },
  };

  /* ---- User session simulation ------------------------------- */
  const User = {
    get() { return read('user', null); },
    set(profile) { write('user', profile); emit('user', profile); },
    clear() { write('user', null); emit('user', null); },
    isAuthed() { return !!User.get(); },
  };

  /* ---- Last order (for confirmation page) -------------------- */
  const LastOrder = {
    set(order) { write('lastOrder', order); },
    get() { return read('lastOrder', null); },
  };

  global.Store = { subscribe, emit, Cart, Favorites, Reservations, Waitlist, Orders, Users, Comparisons, User, LastOrder };
})(window);
