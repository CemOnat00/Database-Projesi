/* ============================================================
   pages/admin/insights.js — Admin Insights (KPI + raporlar)
   Backend bağlı: GET /admin/rapor + /eserler + /etkinlikler + /istatistik/*
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    // ── Admin guard ────────────────────────────────────────────
    if (!Store.User.isAuthed()) {
      Utils.toast('Admin access requires sign-in');
      setTimeout(() => location.href = '../auth.html?next=admin/index.html', 600);
      return;
    }
    if (!Store.User.isAdmin()) {
      try {
        const profile = await GALLERY.api.getProfile();
        Store.User.set({
          id: profile.id, name: profile.ad_soyad, email: profile.email,
          role: profile.rol, rol: profile.rol, kayitTarihi: profile.kayit_tarihi,
        }, Store.User.token());
      } catch (_) {}
      if (!Store.User.isAdmin()) { renderAccessDenied(); return; }
    }

    try { await renderKPIs(); } catch (e) { renderApiError(e); }
    renderChart();
    try { await renderTopArtworks(); } catch (e) { console.warn('top-artworks', e); }
    try { await renderTopWorkshops(); } catch (e) { console.warn('top-workshops', e); }
    renderActivity();
    try { await renderSummaryReport(); } catch (e) { console.warn('summary', e); }
    bindExport();
  });

  function renderAccessDenied() {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `
      <section class="max-w-3xl mx-auto px-6 lg:px-12 py-32 text-center">
        <p class="text-[11px] uppercase tracking-lux text-ink-muted mb-4">Restricted</p>
        <h1 class="font-display text-5xl text-ink-strong">Admin only.</h1>
        <p class="mt-6 text-ink-muted">Your account does not have access to the curator console.</p>
        <div class="mt-10 flex justify-center gap-3">
          <a href="../auth.html" class="bg-brand hover:bg-brand-hover text-white px-8 py-4 text-[11px] uppercase tracking-lux transition-colors">Sign In as Admin</a>
          <a href="../dashboard.html" class="border border-ink-strong/30 px-8 py-4 text-[11px] uppercase tracking-lux text-ink-strong hover:bg-ink-strong hover:text-white transition-colors">Back to Dashboard</a>
        </div>
      </section>`;
  }

  function renderApiError(e) {
    const root = document.querySelector('main');
    if (!root) return;
    const banner = document.createElement('div');
    banner.className = 'bg-accent/10 border border-accent text-ink-strong p-4 mb-6 text-sm';
    banner.textContent = e && e.code === 'network'
      ? 'Backend offline — start the Go server'
      : ('Could not load admin report: ' + (e && e.message || 'unknown error'));
    root.insertBefore(banner, root.firstChild);
  }

  async function renderKPIs() {
    const r = await GALLERY.api.getAdminReport();
    if (Utils.qs('#kpi-orders'))       Utils.qs('#kpi-orders').textContent       = r.toplam_siparis ?? 0;
    if (Utils.qs('#kpi-reservations')) Utils.qs('#kpi-reservations').textContent = r.toplam_rezervasyon ?? 0;
    if (Utils.qs('#kpi-revenue')) {
      const approxRevenue = (r.toplam_siparis || 0) * 1250;
      Utils.qs('#kpi-revenue').textContent = '$' + Math.round(approxRevenue / 1000) + 'K';
    }
    if (Utils.qs('#kpi-rating')) Utils.qs('#kpi-rating').textContent = '—';
  }

  function renderChart() {
    const data = [32, 45, 54, 62, 48, 71, 82, 64, 58, 73, 88, 95];
    const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const max = Math.max(...data);
    const root = Utils.qs('#chart');
    if (!root) return;
    root.innerHTML = data.map((d, i) => `
      <div class="flex-1 h-full flex flex-col justify-end items-center gap-2">
        <div class="bar" style="height:${(d / max * 100).toFixed(1)}%"></div>
        <p class="text-[10px] ${i === labels.length - 1 ? 'text-ink-strong font-medium' : 'text-ink-muted'}">${labels[i]}</p>
      </div>
    `).join('');
  }

  async function renderTopArtworks() {
    const root = Utils.qs('#top-artworks');
    if (!root) return;
    const artworks = await GALLERY.api.listArtworks();
    const enriched = await Promise.all(artworks.map(async a => {
      const stat = await GALLERY.api.getArtworkStats(a.id);
      return Object.assign({}, a, { _stat: stat || {} });
    }));
    const sorted = enriched
      .sort((a, b) => (b._stat.toplam_favori || 0) - (a._stat.toplam_favori || 0))
      .slice(0, 5);
    root.innerHTML = sorted.map(a => `
      <tr>
        <td class="px-6 py-3 font-display">${Utils.escapeHTML(a.title)}</td>
        <td class="text-right">${a._stat.toplam_favori ?? 0}</td>
        <td class="text-right">${(a._stat.toplam_yorum || 0).toLocaleString()}</td>
        <td class="text-right pr-6">${(a._stat.ortalama_puan || 0).toFixed(1)}</td>
      </tr>`).join('');
  }

  async function renderTopWorkshops() {
    const root = Utils.qs('#top-workshops');
    if (!root) return;
    const ws = await GALLERY.api.listWorkshops();
    const enriched = await Promise.all(ws.map(async w => {
      const stat = await GALLERY.api.getWorkshopStats(w.id);
      return Object.assign({}, w, { _stat: stat || {} });
    }));
    const sorted = enriched
      .sort((a, b) => (b._stat.doluluk_orani || 0) - (a._stat.doluluk_orani || 0))
      .slice(0, 5);
    root.innerHTML = sorted.map(w => `
      <tr>
        <td class="px-6 py-3 font-display">${Utils.escapeHTML(w.title)}</td>
        <td class="text-right">${Math.round((w._stat.doluluk_orani || 0) * 100)}%</td>
        <td class="text-right">${(w._stat.ortalama_puan || 0).toFixed(1)}</td>
        <td class="text-right">—</td>
        <td class="text-right pr-6">${w._stat.toplam_rezervasyon ?? 0}</td>
      </tr>`).join('');
  }

  function renderActivity() {
    const root = Utils.qs('#activity');
    if (!root) return;
    root.innerHTML = `
      <li class="flex items-center gap-5 py-4">
        <span class="w-2 h-2 bg-brand rounded-full flex-shrink-0"></span>
        <div class="flex-1"><p class="text-sm text-ink-strong">Live activity feed will appear here as backend events stream in.</p></div>
        <span class="text-[11px] uppercase tracking-lux text-ink-muted">—</span>
      </li>`;
  }

  async function renderSummaryReport() {
    const root = Utils.qs('#summary-report');
    if (!root) return;
    const r = await GALLERY.api.getAdminReport();
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 0;border-bottom:1px solid #f1f4f9">
          <span style="font-size:.8rem;color:#8492a6">Registered Users</span>
          <span style="font-weight:600;color:#1a1d2e;font-size:1.1rem">${(r.toplam_kullanici || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 0;border-bottom:1px solid #f1f4f9">
          <span style="font-size:.8rem;color:#8492a6">Total Orders</span>
          <span style="font-weight:600;color:#1a1d2e;font-size:1.1rem">${(r.toplam_siparis || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 0;border-bottom:1px solid #f1f4f9">
          <span style="font-size:.8rem;color:#8492a6">Total Reservations</span>
          <span style="font-weight:600;color:#1a1d2e;font-size:1.1rem">${(r.toplam_rezervasyon || 0).toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 0">
          <span style="font-size:.8rem;color:#8492a6">Catalogue Stats</span>
          <span style="font-weight:600;color:#1a1d2e;font-size:0.9rem">${(r.toplam_eser || 0)} Art / ${(r.toplam_etkinlik || 0)} Event</span>
        </div>
      </div>`;
  }

  function bindExport() {
    Utils.qs('#export-btn')?.addEventListener('click', () => {
      Utils.toast('CSV export — endpoint not enabled on this backend');
    });
  }
})();
