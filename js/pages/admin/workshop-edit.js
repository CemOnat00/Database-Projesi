/* ============================================================
   pages/admin/workshop-edit.js — Atölye ekle/düzenle formu
   ============================================================ */

(function () {
  'use strict';

  let editingId = null;

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/workshop-edit.html', 400);
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
      Utils.qs('#page-title').textContent = 'Edit Workshop';
      Utils.qs('#submit-label').textContent = 'Update Workshop';
      document.title = 'Edit Workshop — The Curated Gallery · Admin';
      await prefill(editingId);
    }

    bindSubmit();
  });

  async function prefill(id) {
    try {
      const w = await GALLERY.api.getWorkshop(id);
      if (!w) return;
      const form = Utils.qs('#workshop-form');
      form.querySelector('[name="baslik"]').value = w.title || '';
      form.querySelector('[name="aciklama"]').value = w.description || '';
      const session = (w.sessions && w.sessions[0]) || {};
      if (session.date) form.querySelector('[name="etkinlik_tarihi"]').value = session.date;
      if (session.time) form.querySelector('[name="baslangic_saati"]').value = session.time;
      form.querySelector('[name="kontenjan"]').value = w.capacity || 8;
      form.querySelector('[name="ucret"]').value = w.price || 0;
      form.querySelector('[name="gorsel_url"]').value = w.image || '';
    } catch (e) {
      console.warn('prefill failed', e);
    }
  }

  function bindSubmit() {
    Utils.qs('#workshop-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = Utils.qs('#form-msg');
      const btn = Utils.qs('#submit-btn');

      const data = new FormData(e.target);
      const dateStr = data.get('etkinlik_tarihi');
      const timeStr = data.get('baslangic_saati') || '00:00';

      const payload = {
        baslik:          (data.get('baslik') || '').trim(),
        aciklama:        (data.get('aciklama') || '').trim(),
        etkinlik_tarihi: dateStr ? new Date(dateStr + 'T' + timeStr + ':00').toISOString() : null,
        baslangic_saati: timeStr,
        kontenjan:       Number(data.get('kontenjan')),
        ucret:           Number(data.get('ucret') || 0),
        gorsel_url:      (data.get('gorsel_url') || '').trim(),
      };

      if (!payload.baslik || payload.baslik.length < 2) {
        showMsg(msg, 'Title is required.', 'accent'); return;
      }
      if (!payload.etkinlik_tarihi) {
        showMsg(msg, 'Date is required.', 'accent'); return;
      }
      if (!(payload.kontenjan >= 1)) {
        showMsg(msg, 'Capacity must be at least 1.', 'accent'); return;
      }

      btn.disabled = true;
      Utils.qs('#submit-label').textContent = 'Saving…';

      try {
        const result = editingId
          ? await GALLERY.api.adminEtkinlik.guncelle(editingId, payload)
          : await GALLERY.api.adminEtkinlik.olustur(payload);

        if (!result.ok) throw new Error('Save failed');

        Utils.toast(editingId ? 'Workshop updated' : 'Workshop created');
        showMsg(msg, (editingId ? 'Updated' : 'Saved') + ' — returning to list…', 'brand');
        setTimeout(() => location.href = 'workshops.html', 800);
      } catch (err) {
        showMsg(msg, err.message || 'Could not save', 'accent');
        btn.disabled = false;
        Utils.qs('#submit-label').textContent = editingId ? 'Update Workshop' : 'Save Workshop';
      }
    });
  }

  function showMsg(el, text, tone) {
    el.textContent = text;
    el.className = 'text-[11px] uppercase tracking-lux min-h-[1rem] text-' + (tone || 'ink-muted');
  }
})();
