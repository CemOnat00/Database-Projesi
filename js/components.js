/* ============================================================
   js/components.js — Shared Navbar & Footer
   • body[data-nav] modları: "user" (default), "slim", "admin"
   • body[data-active] aktif menüyü işaretler
   • Admin sayfaları admin/*.html altında olduğundan tüm relative
     link'lere otomatik "../" prefix'i eklenir.
   ============================================================ */

(function (global) {
  'use strict';

  // ── URL prefix algıla ─────────────────────────────────────────
  // admin/foo.html → "../" gerekir kök sayfalara link verirken.
  // Kök sayfalardan admin'e gitmek için "admin/" gerekir.
  function inAdminDir() {
    return /\/admin\/[^\/]+$/.test(location.pathname);
  }
  function rootPrefix() { return inAdminDir() ? '../' : ''; }
  function adminPrefix() { return inAdminDir() ? '' : 'admin/'; }

  // ── User navbar items ────────────────────────────────────────
  const NAV_ITEMS = [
    { key: 'gallery',   label: 'Gallery',   href: 'gallery.html' },
    { key: 'workshops', label: 'Workshops', href: 'workshops.html' },
    { key: 'compare',   label: 'Compare',   href: 'compare.html' },
    { key: 'about',     label: 'About',     href: 'support.html' },
  ];

  // ── Admin navbar items ────────────────────────────────────────
  const ADMIN_ITEMS = [
    { key: 'insights',      label: 'Insights',     href: 'index.html' },
    { key: 'artworks',      label: 'Artworks',     href: 'artworks.html' },
    { key: 'workshops',     label: 'Workshops',    href: 'workshops.html' },
    { key: 'artists',       label: 'Artists',      href: 'artists.html' },
    { key: 'orders',        label: 'Orders',       href: 'orders.html' },
    { key: 'reservations',  label: 'Reservations', href: 'reservations.html' },
    { key: 'reviews',       label: 'Reviews',      href: 'reviews.html' },
    { key: 'users',         label: 'Users',        href: 'users.html' },
  ];

  function navItem(item, active, prefix) {
    const cls = active
      ? 'text-ink-strong border-b border-ink-strong pb-0.5'
      : 'text-ink-strong/70 hover:text-ink-strong transition-colors';
    return `<li><a href="${prefix}${item.href}" class="${cls}">${item.label}</a></li>`;
  }

  function renderNavbar(activeKey) {
    const root = document.getElementById('navbar-root');
    if (!root) return;

    const cartCount = (global.Store && Store.Cart.count()) || 0;
    const favCount  = (global.Store && Store.Favorites.count()) || 0;
    const isAuthed  = (global.Store && Store.User.isAuthed());
    const isAdmin   = (global.Store && Store.User.isAdmin());
    const rp = rootPrefix();
    const ap = adminPrefix();

    // Admin login olmuşsa user navbar'a "Admin Panel →" şeridi enjekte edilir
    const adminBanner = isAdmin
      ? `<div class="bg-ink-strong text-white text-[11px] uppercase tracking-lux py-2 px-6 lg:px-12 flex items-center justify-between">
           <span class="opacity-80">You are signed in as admin.</span>
           <a href="${ap}index.html" class="border-b border-white/50 pb-0.5 hover:border-white">Open Admin Panel →</a>
         </div>`
      : '';

    root.innerHTML = `
      ${adminBanner}
      <header class="sticky top-0 z-40 bg-bg/85 backdrop-blur border-b border-line/70">
        <nav class="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between" aria-label="Primary">
          <a href="${rp}index.html" class="font-display italic text-2xl text-ink-strong tracking-tight">The Curated Gallery</a>
          <ul class="hidden md:flex items-center gap-12 font-display italic text-[15px]">
            ${NAV_ITEMS.map(it => navItem(it, it.key === activeKey, rp)).join('')}
          </ul>
          <div class="flex items-center gap-2 text-ink-strong">
            <a href="${rp}dashboard.html?pane=favorites" aria-label="Favorites" class="relative p-2 hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span id="fav-badge" class="${favCount > 0 ? '' : 'hidden'} absolute -top-0 -right-0 bg-accent text-white text-[10px] tracking-[0.04em] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">${favCount}</span>
            </a>
            <a href="${rp}checkout.html" aria-label="Cart" class="relative p-2 hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span id="cart-badge" class="${cartCount > 0 ? '' : 'hidden'} absolute -top-0 -right-0 bg-accent text-white text-[10px] tracking-[0.04em] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">${cartCount}</span>
            </a>
            <a href="${isAuthed ? rp + 'dashboard.html' : rp + 'auth.html'}" aria-label="Account" class="p-2 hover:opacity-70 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>
          </div>
        </nav>
      </header>
    `;
  }

  function renderFooter() {
    const root = document.getElementById('footer-root');
    if (!root) return;
    const year = (global.GALLERY && GALLERY.SITE && GALLERY.SITE.copyrightYear) || new Date().getFullYear();
    const rp = rootPrefix();
    root.innerHTML = `
      <footer class="bg-bg-soft">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div class="col-span-2 md:col-span-1">
              <p class="font-display italic text-xl text-ink-strong">The Curated Gallery</p>
              <p class="mt-4 text-sm text-ink-muted max-w-xs leading-relaxed">
                A small, deliberate gallery and atelier — exhibiting paintings and teaching craft since 2014.
              </p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-lux text-ink-strong mb-4">Discover</p>
              <ul class="space-y-2 text-sm text-ink-muted">
                <li><a href="${rp}gallery.html" class="hover:text-ink-strong">Gallery</a></li>
                <li><a href="${rp}workshops.html" class="hover:text-ink-strong">Workshops</a></li>
                <li><a href="${rp}compare.html" class="hover:text-ink-strong">Compare</a></li>
              </ul>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-lux text-ink-strong mb-4">Account</p>
              <ul class="space-y-2 text-sm text-ink-muted">
                <li><a href="${rp}auth.html" class="hover:text-ink-strong">Sign In</a></li>
                <li><a href="${rp}dashboard.html" class="hover:text-ink-strong">My Profile</a></li>
                <li><a href="${rp}checkout.html" class="hover:text-ink-strong">Cart</a></li>
                <li><a href="${rp}support.html" class="hover:text-ink-strong">Support</a></li>
              </ul>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-lux text-ink-strong mb-4">Policies</p>
              <ul class="space-y-2 text-sm text-ink-muted">
                <li><a href="#" class="hover:text-ink-strong">Privacy Policy</a></li>
                <li><a href="#" class="hover:text-ink-strong">Terms of Service</a></li>
                <li><a href="#" class="hover:text-ink-strong">Shipping &amp; Returns</a></li>
              </ul>
            </div>
          </div>
          <div class="mt-12 pt-6 border-t border-line flex flex-col md:flex-row justify-between gap-3">
            <p class="text-[11px] uppercase tracking-lux text-ink-muted">© ${year} The Curated Gallery. All rights reserved.</p>
            <p class="text-[11px] uppercase tracking-lux text-ink-muted">Curated in the studio · Made with care</p>
          </div>
        </div>
      </footer>
    `;
  }

  /* ---- Slim header for checkout / auth / confirmation -------- */
  function renderSlimHeader(opts) {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    opts = opts || {};
    const rp = rootPrefix();
    const right = opts.right || `<a href="${rp}index.html" class="text-[11px] uppercase tracking-lux text-ink-muted hover:text-ink-strong">← Back to Gallery</a>`;
    const middle = opts.middle || '';
    root.innerHTML = `
      <header class="bg-bg border-b border-line">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <a href="${rp}index.html" class="font-display italic text-2xl text-ink-strong">The Curated Gallery</a>
          ${middle ? `<div class="hidden md:flex">${middle}</div>` : ''}
          ${right}
        </div>
      </header>
    `;
  }

  /* ---- Admin header (dark) ----------------------------------- */
  function renderAdminHeader(activeKey) {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    const user = (global.Store && Store.User.get()) || {};
    const displayName = (user.name || 'Admin').split(' ')[0];
    const rp = rootPrefix(); // admin sayfaları içinde "../" döner

    root.innerHTML = `
      <header class="sticky top-0 z-40 bg-ink-strong text-white">
        <nav class="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <a href="index.html" class="font-display italic text-2xl">The Curated Gallery</a>
            <span class="text-[10px] uppercase tracking-lux border border-white/30 px-2 py-1">Admin</span>
          </div>
          <ul class="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-lux">
            ${ADMIN_ITEMS.map(it => `<li><a href="${it.href}" class="${it.key === activeKey ? 'border-b border-white pb-0.5' : 'text-white/60 hover:text-white'}">${it.label}</a></li>`).join('')}
          </ul>
          <div class="flex items-center gap-4 text-[11px] uppercase tracking-lux">
            <span class="text-white/70">${Utils.escapeHTML(displayName)}</span>
            <button id="admin-signout" class="text-white/70 hover:text-white">Sign Out</button>
          </div>
        </nav>
      </header>
    `;

    document.getElementById('admin-signout')?.addEventListener('click', async () => {
      try { if (global.GALLERY && GALLERY.api && GALLERY.api.logout) await GALLERY.api.logout(); } catch (_) {}
      Store.User.clear();
      Utils.toast('Signed out');
      setTimeout(() => location.href = rp + 'index.html', 500);
    });
  }

  /* ---- Footer for admin pages (slim) ------------------------- */
  function renderAdminFooter() {
    const root = document.getElementById('footer-root');
    if (!root) return;
    const year = new Date().getFullYear();
    root.innerHTML = `
      <footer class="bg-bg-soft border-t border-line mt-20">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">© ${year} The Curated Gallery · Admin Console</p>
          <p class="text-[11px] uppercase tracking-lux text-ink-muted">Restricted Access</p>
        </div>
      </footer>
    `;
  }

  /* ---- Init ---- */
  Utils.onReady(function () {
    const variant = document.body.getAttribute('data-nav') || 'default';
    const active = document.body.getAttribute('data-active') || '';

    if (variant === 'slim') {
      const middle = document.body.getAttribute('data-slim-middle') || '';
      renderSlimHeader({ middle });
      renderFooter();
    } else if (variant === 'admin') {
      renderAdminHeader(active);
      renderAdminFooter();
    } else {
      renderNavbar(active);
      renderFooter();
    }

    // Live cart & favorite badge updates
    if (global.Store) {
      Store.subscribe('cart', () => {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;
        const n = Store.Cart.count();
        badge.textContent = n;
        badge.classList.toggle('hidden', n === 0);
      });
      Store.subscribe('favorites', () => {
        const badge = document.getElementById('fav-badge');
        if (!badge) return;
        const n = Store.Favorites.count();
        badge.textContent = n;
        badge.classList.toggle('hidden', n === 0);
      });
    }
  });

  global.Components = { renderNavbar, renderFooter, renderSlimHeader, renderAdminHeader, renderAdminFooter };
})(window);
