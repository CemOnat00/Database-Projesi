/* ============================================================
   pages/admin/workshop-edit.js — Atölye ekle/düzenle formu
   • Çoklu görsel: drag-drop + file picker → bilgisayardan dosya seç
     ▸ Preview grid: "★ Set primary" ve "Remove"
     ▸ İlk görsel = primary (kapak); detay sayfasında sırayla gösterilir
   • Submit → etkinliği oluşturur/günceller, ardından dosyaları multipart yükler
   ============================================================ */

(function () {
  'use strict';

  let editingId = null;

  // { kind:'file', file, src, primary } | { kind:'existing', id, src, primary }
  const images = [];
  const removedExistingIds = [];

  const ACCEPTED = /^image\/(png|jpe?g|webp|gif)$/i;
  const MAX_SIZE = 5 * 1024 * 1024;

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

    bindFilePicker();
    bindDragDrop();
    bindSubmit();
    renderPreviewGrid();
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

      const ham = w.gorseller || [];
      if (ham.length > 0) {
        ham.slice().sort((x, y) => (x.sira || 0) - (y.sira || 0)).forEach(g => {
          images.push({
            kind: 'existing',
            id: g.id,
            src: GALLERY.mediaURL(g.url),
            primary: !!g.primary_mi,
          });
        });
      } else if (w.image) {
        images.push({ kind: 'existing', id: null, src: w.image, primary: true });
      }
      if (images.length && !images.some(im => im.primary)) images[0].primary = true;
    } catch (e) {
      console.warn('prefill failed', e);
    }
  }

  /* ---- File picker + drag-drop ---- */
  function bindFilePicker() {
    Utils.qs('#img-file').addEventListener('change', e => {
      handleFiles(Array.from(e.target.files || []));
      e.target.value = '';
    });
  }

  function bindDragDrop() {
    const zone = Utils.qs('#drop-zone');
    if (!zone) return;
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => {
      e.preventDefault();
      zone.classList.add('border-brand', 'bg-brand/5');
    }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => {
      e.preventDefault();
      zone.classList.remove('border-brand', 'bg-brand/5');
    }));
    zone.addEventListener('drop', e => {
      handleFiles(Array.from(e.dataTransfer?.files || []));
    });
  }

  function handleFiles(files) {
    let rejected = 0;
    files.forEach(f => {
      if (!ACCEPTED.test(f.type) || f.size > MAX_SIZE) { rejected++; return; }
      const reader = new FileReader();
      reader.onload = () => {
        images.push({
          kind: 'file',
          file: f,
          src: reader.result,
          primary: images.length === 0,
        });
        renderPreviewGrid();
      };
      reader.readAsDataURL(f);
    });
    if (rejected > 0) {
      Utils.toast(`${rejected} file${rejected > 1 ? 's' : ''} rejected — PNG/JPG/WebP, max 5MB`);
    }
  }

  /* ---- Preview grid ---- */
  function renderPreviewGrid() {
    const grid = Utils.qs('#img-preview-grid');
    const count = Utils.qs('#img-count');
    if (!grid) return;

    if (count) count.textContent = images.length + (images.length === 1 ? ' image' : ' images');

    if (images.length === 0) {
      grid.classList.add('hidden');
      grid.innerHTML = '';
      return;
    }
    if (!images.some(im => im.primary)) images[0].primary = true;

    grid.classList.remove('hidden');
    grid.innerHTML = images.map((im, i) => `
      <div class="relative border ${im.primary ? 'border-brand ring-2 ring-brand/20' : 'border-line'} bg-bg overflow-hidden">
        <div class="aspect-square overflow-hidden bg-bg-image">
          <img src="${Utils.escapeHTML(im.src)}" alt="" class="w-full h-full object-cover" />
        </div>
        ${im.primary ? '<span class="absolute top-2 left-2 bg-brand text-white text-[9px] uppercase tracking-lux px-2 py-1">Primary</span>' : ''}
        <span class="absolute top-2 right-2 bg-bg/90 text-ink-muted text-[9px] uppercase tracking-lux px-2 py-1">${im.kind === 'file' ? 'New' : 'Saved'}</span>
        <div class="p-2 bg-bg-soft border-t border-line flex items-center justify-between gap-1">
          ${im.primary
            ? '<span class="text-[10px] uppercase tracking-lux text-ink-muted">★ Cover</span>'
            : `<button type="button" data-action="primary" data-idx="${i}" class="text-[10px] uppercase tracking-lux text-brand hover:text-brand-hover">★ Set primary</button>`
          }
          <button type="button" data-action="remove" data-idx="${i}" class="text-[10px] uppercase tracking-lux text-accent hover:text-brand">Remove</button>
        </div>
      </div>
    `).join('');

    Utils.qsa('button[data-action]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (btn.getAttribute('data-action') === 'primary') setPrimary(idx);
        else removeImage(idx);
      });
    });
  }

  function setPrimary(idx) {
    const [chosen] = images.splice(idx, 1);
    images.forEach(im => { im.primary = false; });
    chosen.primary = true;
    images.unshift(chosen);
    renderPreviewGrid();
  }

  function removeImage(idx) {
    const removed = images[idx];
    if (removed.kind === 'existing' && removed.id != null) {
      removedExistingIds.push(removed.id);
    }
    const wasPrimary = removed.primary;
    images.splice(idx, 1);
    if (wasPrimary && images.length > 0) images[0].primary = true;
    renderPreviewGrid();
  }

  /* ---- Submit ---- */
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
      };

      if (!payload.baslik || payload.baslik.length < 2) {
        return showMsg(msg, 'Title is required.', 'accent');
      }
      if (!payload.etkinlik_tarihi) {
        return showMsg(msg, 'Date is required.', 'accent');
      }
      if (!(payload.kontenjan >= 1)) {
        return showMsg(msg, 'Capacity must be at least 1.', 'accent');
      }
      if (images.length === 0) {
        return showMsg(msg, 'Please add at least one image from your computer.', 'accent');
      }

      const newFiles = images.filter(im => im.kind === 'file').map(im => im.file);
      let primaryIndex = 0;
      const primaryItem = images.find(im => im.primary);
      if (primaryItem && primaryItem.kind === 'file') {
        primaryIndex = newFiles.indexOf(primaryItem.file);
      }

      btn.disabled = true;
      Utils.qs('#submit-label').textContent = 'Saving…';

      try {
        let result;
        if (editingId) {
          for (const gid of removedExistingIds) {
            if (gid != null) {
              try { await GALLERY.api.adminEtkinlik.gorselSil(editingId, gid); }
              catch (err) { console.warn('gorselSil failed', gid, err); }
            }
          }
          result = await GALLERY.api.adminEtkinlik.guncelle(editingId, payload, newFiles, Math.max(0, primaryIndex));
        } else {
          result = await GALLERY.api.adminEtkinlik.olustur(payload, newFiles, Math.max(0, primaryIndex));
        }

        // Etkinlik kaydedildi; görsel yüklemesi ayrı adım — başarısızsa net uyarı.
        if (result && result.gorselUyari) {
          Utils.toast('Saved — but images failed to upload');
          showMsg(msg, (editingId ? 'Updated' : 'Saved') + ', but image upload failed — returning to list…', 'accent');
        } else {
          Utils.toast(editingId ? 'Workshop updated' : 'Workshop created');
          showMsg(msg, (editingId ? 'Updated' : 'Saved') + ' — returning to list…', 'brand');
        }
        setTimeout(() => location.href = 'workshops.html', 1100);
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
