/* ============================================================
   pages/admin/artist-edit.js — Sanatçı ekle/düzenle formu
   ============================================================ */

(function () {
  'use strict';

  let editingId = null;

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/artist-edit.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    editingId = Utils.paramId('id');
    if (editingId) {
      Utils.qs('#page-mode').textContent = 'Edit';
      Utils.qs('#page-title').textContent = 'Edit Artist';
      Utils.qs('#submit-label').textContent = 'Update Artist';
      document.title = 'Edit Artist — The Curated Gallery · Admin';
      await prefill(editingId);
    }

    bindSubmit();
  });

  async function prefill(id) {
    try {
      const s = await GALLERY.api.adminSanatci.detay(id);
      if (!s) return;
      const form = Utils.qs('#artist-form');
      form.querySelector('[name="ad_soyad"]').value = s.name || '';
      form.querySelector('[name="biyografi"]').value = s.biography || '';
    } catch (e) {
      console.warn('prefill failed', e);
    }
  }

  function bindSubmit() {
    Utils.qs('#artist-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = Utils.qs('#form-msg');
      const btn = Utils.qs('#submit-btn');

      const data = new FormData(e.target);
      const payload = {
        ad_soyad:  (data.get('ad_soyad') || '').trim(),
        biyografi: (data.get('biyografi') || '').trim(),
      };

      if (!payload.ad_soyad || payload.ad_soyad.length < 2) {
        showMsg(msg, 'Name is required.', 'accent'); return;
      }

      btn.disabled = true;
      Utils.qs('#submit-label').textContent = 'Saving…';

      try {
        const result = editingId
          ? await GALLERY.api.adminSanatci.guncelle(editingId, payload)
          : await GALLERY.api.adminSanatci.olustur(payload);

        if (!result.ok) throw new Error('Save failed');

        Utils.toast(editingId ? 'Artist updated' : 'Artist added');
        showMsg(msg, (editingId ? 'Updated' : 'Saved') + ' — returning to list…', 'brand');
        setTimeout(() => location.href = 'artists.html', 800);
      } catch (err) {
        showMsg(msg, err.message || 'Could not save', 'accent');
        btn.disabled = false;
        Utils.qs('#submit-label').textContent = editingId ? 'Update Artist' : 'Save Artist';
      }
    });
  }

  function showMsg(el, text, tone) {
    el.textContent = text;
    el.className = 'text-[11px] uppercase tracking-lux min-h-[1rem] text-' + (tone || 'ink-muted');
  }
})();
