/* ============================================================
   pages/workshops.js — Atölye listeleme + filtre + compare seçimi
   Backend-ready: tüm veri GALLERY.api üzerinden async çekilir.
   ============================================================ */

(function () {
  'use strict';

  const state = { medium: 'all', level: 'all', dateRange: 'all' };
  const compareSelected = new Set();

  Utils.onReady(function () {
    bindFilters();
    bindViewToggle();
    render();
  });

  function bindFilters() {
    Utils.qs('#flt-medium')?.addEventListener('change', e => { state.medium = e.target.value; render(); });
    Utils.qs('#flt-level')?.addEventListener('change', e => { state.level = e.target.value; render(); });
    Utils.qs('#flt-date')?.addEventListener('change', e => { state.dateRange = e.target.value; render(); });
    Utils.qs('#compare-go')?.addEventListener('click', () => {
      if (compareSelected.size === 0) { Utils.toast('Pick at least one workshop to compare'); return; }
      location.href = 'compare.html?tab=events&ids=' + Array.from(compareSelected).join(',');
    });
  }

  function bindViewToggle() {
    // List view is the default; calendar is a stub for the assignment scope
    Utils.qs('#view-list')?.addEventListener('click', () => {
      Utils.qs('#view-list').className = 'px-5 py-3 bg-brand text-white text-[11px] uppercase tracking-lux';
      Utils.qs('#view-calendar').className = 'px-5 py-3 text-ink-strong text-[11px] uppercase tracking-lux hover:bg-bg-soft';
    });
    Utils.qs('#view-calendar')?.addEventListener('click', () => Utils.toast('Calendar view — coming soon'));
  }

  async function render() {
    const root = Utils.qs('#workshops-grid');
    const counter = Utils.qs('#result-count');
    const empty = Utils.qs('#empty-state');
    if (!root) return;

    // Backend-bound call (today: in-memory; tomorrow: HTTP)
    const list = await GALLERY.api.listWorkshops({
      medium: state.medium,
      level: state.level,
      dateRange: state.dateRange,
    });

    if (counter) counter.textContent = `${list.length} ${list.length === 1 ? 'session' : 'sessions'} on offer`;

    if (list.length === 0) {
      root.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    root.innerHTML = list.map((w, i) => i === 0 ? featured(w) : standard(w, i)).join('');

    // Restore checked state after re-render
    Utils.qsa('.compare-chk', root).forEach(chk => {
      if (compareSelected.has(chk.getAttribute('data-id'))) chk.checked = true;
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-id');
        if (chk.checked) compareSelected.add(id); else compareSelected.delete(id);
        Utils.qs('#compare-count').textContent = `(${compareSelected.size})`;
      });
    });
  }

  function spotsLabel(w) {
    if (w.complimentary) return '<span class="text-ink-strong">Open Daily</span>';
    if (w.spotsLeft === 0 && w.waitlist) return '<span class="text-accent">Waitlist Open</span>';
    if (w.spotsLeft === 0) return '<span class="text-ink-strong">Sold Out</span>';
    if (w.spotsLeft <= 3) return `<span class="text-accent">${w.spotsLeft} of ${w.capacity} left</span>`;
    return `<span class="text-ink-strong">${w.spotsLeft} of ${w.capacity} seats</span>`;
  }

  function priceLabel(w) {
    if (w.complimentary || !w.price) return 'Complimentary';
    return Utils.fmtMoney(w.price) + ' USD';
  }

  function bookButton(w, variant) {
    if (w.complimentary) {
      return `<a href="workshop-detail.html?id=${w.id}" class="group ${variant === 'primary' ? 'bg-brand hover:bg-brand-hover text-white' : 'border border-ink-strong/30 text-ink-strong hover:bg-ink-strong hover:text-white'} px-6 py-4 text-[11px] uppercase tracking-lux flex items-center justify-between transition-colors">Reserve a Walk<svg width="16" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" stroke-width="1.5" class="motion-safe:transition-transform group-hover:translate-x-1"><path d="M1 5h15M12 1l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
    }
    if (w.spotsLeft === 0 && w.waitlist) {
      return `<a href="workshop-detail.html?id=${w.id}" class="bg-bg-image hover:bg-bg-soft text-ink-strong px-6 py-4 text-[11px] uppercase tracking-lux flex items-center justify-center transition-colors">Join Waitlist</a>`;
    }
    if (w.spotsLeft === 0) {
      return `<button disabled class="bg-bg-image text-ink-muted px-6 py-4 text-[11px] uppercase tracking-lux cursor-not-allowed">Sold Out</button>`;
    }
    return `<a href="workshop-detail.html?id=${w.id}" class="group ${variant === 'primary' ? 'bg-brand hover:bg-brand-hover text-white' : 'border border-ink-strong/30 text-ink-strong hover:bg-ink-strong hover:text-white'} px-6 py-4 text-[11px] uppercase tracking-lux flex items-center justify-between transition-colors">Book Now<svg width="16" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" stroke-width="1.5" class="motion-safe:transition-transform group-hover:translate-x-1"><path d="M1 5h15M12 1l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
  }

  function featured(w) {
    const session = (w.sessions && w.sessions[0]) || { dateLong: 'Date TBA', time: '' };
    return `
      <article class="md:col-span-8 flex flex-col md:flex-row gap-8 lg:gap-12">
        <a href="workshop-detail.html?id=${w.id}" class="md:w-3/5 overflow-hidden bg-bg-image group">
          <img src="${Utils.img(w.image, 1200)}" alt="${Utils.escapeHTML(w.title)}" class="w-full aspect-[4/3] object-cover img-zoom" />
        </a>
        <div class="md:w-2/5 flex flex-col gap-4">
          <div class="flex justify-between text-[11px] uppercase tracking-lux">
            <span class="text-ink-muted">${Utils.escapeHTML(w.category)} · ${Utils.escapeHTML(w.level)}</span>
            ${spotsLabel(w)}
          </div>
          <h2 class="font-display text-3xl text-ink-strong leading-tight">${Utils.escapeHTML(w.title)} <span class="italic text-ink-muted">with ${Utils.escapeHTML(w.instructor)}</span></h2>
          <div class="text-sm text-ink-muted space-y-1">
            <p>${Utils.escapeHTML(session.dateLong)}${session.time ? ' · ' + session.time : ''}</p>
            <p>${Utils.escapeHTML(w.duration || '')} · ${Utils.escapeHTML(w.location || '')}</p>
            <p class="text-ink-strong font-medium">${priceLabel(w)}${w.price ? ' / person' : ''}</p>
          </div>
          <p class="text-ink-muted text-sm leading-relaxed">${Utils.escapeHTML(w.summary)}</p>
          <div class="flex flex-col gap-3 mt-2">
            ${bookButton(w, 'primary')}
            <label class="flex items-center gap-2 text-[11px] uppercase tracking-lux text-ink-muted cursor-pointer">
              <input type="checkbox" data-id="${w.id}" class="compare-chk accent-brand" /> Add to Compare
            </label>
          </div>
        </div>
      </article>`;
  }

  function standard(w, i) {
    const session = (w.sessions && w.sessions[0]) || { dateLong: 'Date TBA', time: '' };
    const layouts = [
      { col: 'md:col-span-4', aspect: 'aspect-square' },
      { col: 'md:col-span-5 md:col-start-2 mt-12 md:mt-24', aspect: 'aspect-[4/5]' },
      { col: 'md:col-span-4 md:col-start-8 mt-0 md:mt-12', aspect: 'aspect-square' },
      { col: 'md:col-span-6 mt-12', aspect: 'aspect-[4/3]' },
    ];
    const layout = layouts[(i - 1) % layouts.length];
    return `
      <article class="${layout.col} flex flex-col gap-4">
        <a href="workshop-detail.html?id=${w.id}" class="overflow-hidden bg-bg-image group block">
          <img src="${Utils.img(w.image, 900)}" alt="${Utils.escapeHTML(w.title)}" class="w-full ${layout.aspect} object-cover img-zoom" />
        </a>
        <div class="flex justify-between text-[11px] uppercase tracking-lux">
          <span class="text-ink-muted">${Utils.escapeHTML(w.category)} · ${Utils.escapeHTML(w.level)}</span>
          ${spotsLabel(w)}
        </div>
        <h2 class="font-display text-2xl text-ink-strong leading-tight">${Utils.escapeHTML(w.title)}</h2>
        <p class="text-sm text-ink-muted italic">with ${Utils.escapeHTML(w.instructor)}</p>
        <div class="text-sm text-ink-muted space-y-1">
          <p>${Utils.escapeHTML(session.dateLong)}${session.time ? ' · ' + session.time : ''}</p>
          <p class="text-ink-strong font-medium">${priceLabel(w)}</p>
        </div>
        ${bookButton(w, 'secondary')}
        <label class="flex items-center gap-2 text-[11px] uppercase tracking-lux text-ink-muted cursor-pointer">
          <input type="checkbox" data-id="${w.id}" class="compare-chk accent-brand" /> Add to Compare
        </label>
      </article>`;
  }
})();
