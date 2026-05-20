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

  /* ---- Admin Sidebar Navigation -------------------------------- */
  function renderAdminHeader(activeKey) {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    const user   = (global.Store && Store.User.get()) || {};
    const name   = user.name || 'Admin';
    const email  = user.email || '';
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    // Apply sidebar body class
    document.body.classList.add('admin-page');

    const NAV = [
      { key: 'insights',     label: 'Dashboard',     href: 'index.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>` },
      { key: 'artworks',     label: 'Artworks',      href: 'artworks.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>` },
      { key: 'workshops',    label: 'Workshops',      href: 'workshops.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
      { key: 'artists',      label: 'Artists',        href: 'artists.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
      { key: 'orders',       label: 'Orders',         href: 'orders.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>` },
      { key: 'reservations', label: 'Reservations',   href: 'reservations.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>` },
      { key: 'reviews',      label: 'Reviews',        href: 'reviews.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
      { key: 'users',        label: 'Users',           href: 'users.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
      { key: 'support',      label: 'Support',         href: 'support.html',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
    ];

    root.innerHTML = `
      <aside class="admin-sidebar" id="admin-sidebar">
        <!-- Logo -->
        <div class="admin-sidebar-logo">
          <a href="index.html">
            <span class="admin-logo-text">The Curated Gallery</span>
            <span class="admin-logo-badge">Admin</span>
          </a>
        </div>

        <!-- Navigation -->
        <nav class="admin-sidebar-nav" aria-label="Admin navigation">
          <p class="admin-nav-group-label">Management</p>
          <ul>
            ${NAV.map(it => `
              <li>
                <a href="${it.href}" class="admin-nav-item ${it.key === activeKey ? 'active' : ''}">
                  <span class="admin-nav-icon">${it.icon}</span>
                  <span>${it.label}</span>
                  ${it.key === activeKey ? '' : ''}
                </a>
              </li>`).join('')}
          </ul>

          <p class="admin-nav-group-label" style="margin-top:1.5rem">Site</p>
          <ul>
            <li>
              <a href="../index.html" class="admin-nav-item" target="_blank">
                <span class="admin-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </span>
                <span>View Live Site</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- User -->
        <div class="admin-sidebar-user">
          <div class="admin-user-avatar">${Utils.escapeHTML(initials)}</div>
          <div class="admin-user-info">
            <p class="admin-user-name">${Utils.escapeHTML(name)}</p>
            <p class="admin-user-email">${Utils.escapeHTML(email)}</p>
          </div>
          <button id="admin-signout" class="admin-signout-btn" title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>
    `;

    document.getElementById('admin-signout')?.addEventListener('click', async () => {
      try { if (global.GALLERY && GALLERY.api && GALLERY.api.logout) await GALLERY.api.logout(); } catch (_) {}
      Store.User.clear();
      Utils.toast('Signed out');
      setTimeout(() => location.href = '../auth.html', 500);
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

      // Background sync favorites if authed
      if (Store.User.isAuthed() && global.GALLERY && GALLERY.api && GALLERY.api.favorites) {
        GALLERY.api.favorites.list().catch(e => console.warn('Could not sync favorites:', e));
      }
    }
  });

  global.Components = { renderNavbar, renderFooter, renderSlimHeader, renderAdminHeader, renderAdminFooter };
})(window);
