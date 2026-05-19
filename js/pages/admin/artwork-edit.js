/* ============================================================
   pages/admin/artwork-edit.js — Eser ekle/düzenle formu
   • ?id=X varsa Edit modu (mevcut veriyle doldur)
   • Yoksa New modu
   • Sanatçı dropdown'u GET /sanatcilar ile doldurulur (gerçek)
   • Submit → GALLERY.api.adminEser.olustur/guncelle (DEMO stub)
   ============================================================ */

(function () {
  'use strict';

  let editingId = null;

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/artwork-edit.html', 400);
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
      Utils.qs('#page-title').textContent = 'Edit Artwork';
      Utils.qs('#submit-label').textContent = 'Update Artwork';
      document.title = 'Edit Artwork — The Curated Gallery · Admin';
    }

    await loadArtistsDropdown();
    if (editingId) await prefillForEdit(editingId);
    bindSubmit();
  });

  async function loadArtistsDropdown() {
    const sel = Utils.qs('select[name="sanatci_id"]');
    if (!sel) return;
    try {
      const artists = await GALLERY.api.adminSanatci.listele();
      if (artists.length === 0) {
        sel.innerHTML = '<option value="">No artists yet — add one first</option>';
        return;
      }
      sel.innerHTML = '<option value="">Select an artist…</option>' +
        artists.map(s => `<option value="${s.id}">${Utils.escapeHTML(s.name)}</option>`).join('');
    } catch (e) {
      console.warn('artists dropdown failed', e);
      sel.innerHTML = '<option value="">Backend offline — artists unavailable</option>';
    }
  }

  async function prefillForEdit(id) {
    try {
      const a = await GALLERY.api.getArtwork(id);
      if (!a) return;
      const form = Utils.qs('#artwork-form');
      form.querySelector('[name="baslik"]').value = a.title || '';
      form.querySelector('[name="aciklama"]').value = a.description || '';
      form.querySelector('[name="gorsel_url"]').value = a.image || '';
      form.querySelector('[name="kategori"]').value = a.category || 'painting';
      form.querySelector('[name="fiyat"]').value = a.price || 0;
      form.querySelector('[name="stok_adedi"]').value = a.stock != null ? a.stock : 1;
      if (a.artistId) {
        const sel = form.querySelector('[name="sanatci_id"]');
        if (sel) sel.value = a.artistId;
      }
    } catch (e) {
      console.warn('prefill failed', e);
      Utils.toast('Could not load artwork for editing');
    }
  }

  function bindSubmit() {
    Utils.qs('#artwork-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = Utils.qs('#form-msg');
      const btn = Utils.qs('#submit-btn');

      const data = new FormData(e.target);
      const payload = {
        sanatci_id: Number(data.get('sanatci_id')) || null,
        baslik:     (data.get('baslik') || '').trim(),
        aciklama:   (data.get('aciklama') || '').trim(),
        gorsel_url: (data.get('gorsel_url') || '').trim(),
        kategori:   data.get('kategori'),
        fiyat:      Number(data.get('fiyat')),
        stok_adedi: Number(data.get('stok_adedi')),
      };

      if (!payload.baslik || payload.baslik.length < 2) {
        showMsg(msg, 'Title is required.', 'accent'); return;
      }
      if (!payload.sanatci_id) {
        showMsg(msg, 'Please select an artist.', 'accent'); return;
      }
      if (!payload.gorsel_url) {
        showMsg(msg, 'Image URL is required.', 'accent'); return;
      }
      if (!(payload.fiyat > 0)) {
        showMsg(msg, 'Price must be greater than 0.', 'accent'); return;
      }

      btn.disabled = true;
      Utils.qs('#submit-label').textContent = 'Saving…';

      try {
        const result = editingId
          ? await GALLERY.api.adminEser.guncelle(editingId, payload)
          : await GALLERY.api.adminEser.olustur(payload);

        if (!result.ok) throw new Error('Save failed');

        Utils.toast(editingId ? 'Artwork updated' : 'Artwork created');
        showMsg(msg, (editingId ? 'Updated' : 'Saved') + ' — returning to list…', 'brand');
        setTimeout(() => location.href = 'artworks.html', 800);
      } catch (err) {
        showMsg(msg, err.message || 'Could not save', 'accent');
        btn.disabled = false;
        Utils.qs('#submit-label').textContent = editingId ? 'Update Artwork' : 'Save Artwork';
      }
    });
  }

  function showMsg(el, text, tone) {
    el.textContent = text;
    el.className = 'text-[11px] uppercase tracking-lux min-h-[1rem] text-' + (tone || 'ink-muted');
  }
})();
