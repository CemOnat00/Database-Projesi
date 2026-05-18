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
    root.innerHTML = sorted.map(w => `
      <tr>
        <td class="px-6 py-3 font-display">${Utils.escapeHTML(w.title)}</td>
        <td class="text-right">${Math.round((w.stats?.occupancy || 0) * 100)}%</td>
        <td class="text-right">${w.stats?.rating ?? '—'}</td>
        <td class="text-right pr-6">${w.stats?.reviewCount ?? 0}</td>
      </tr>`).join('');
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

  function bindExport() {
    Utils.qs('#export-btn')?.addEventListener('click', () => {
      Utils.toast('Generating CSV export…');
    });
  }
})();
