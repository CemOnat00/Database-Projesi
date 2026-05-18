/* ============================================================
   js/utils.js — Yardımcı fonksiyonlar
   ============================================================ */

(function (global) {
  'use strict';

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function fmtUSD(n) {
    if (typeof n !== 'number' || isNaN(n)) n = 0;
    return '$' + Math.round(n).toLocaleString('en-US') + ' USD';
  }
  function fmtMoney(n) {
    if (typeof n !== 'number' || isNaN(n)) n = 0;
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function paramId(key) {
    return new URLSearchParams(location.search).get(key || 'id');
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
    })[c]);
  }

  /* ---- Toast ---- */
  let toastEl = null, toastTimer = null;
  function toast(msg, opts) {
    opts = opts || {};
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), opts.duration || 2400);
  }

  /* ---- Star SVG helper ---- */
  function stars(rating, size) {
    size = size || 14;
    const out = [];
    for (let i = 1; i <= 5; i++) {
      out.push(
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${i <= rating ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>`
      );
    }
    return out.join('');
  }

  /* ---- Arrow SVG ---- */
  function arrowRight() {
    return `<svg width="16" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" stroke-width="1.5" class="motion-safe:transition-transform group-hover:translate-x-1"><path d="M1 5h15M12 1l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  /* ---- Heart SVG ---- */
  function heart(filled) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  /* ---- Image URL helper (Unsplash) ---- */
  function img(base, w) {
    if (!base) return '';
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}q=80&w=${w || 900}&auto=format&fit=crop`;
  }

  /* ---- Debounce ---- */
  function debounce(fn, ms) {
    let t; return function () {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), ms);
    };
  }

  /* ---- DOM ready ---- */
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  global.Utils = { qs, qsa, fmtUSD, fmtMoney, paramId, el, escapeHTML, toast, stars, arrowRight, heart, img, debounce, onReady };
})(window);
