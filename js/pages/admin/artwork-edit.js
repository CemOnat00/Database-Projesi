/* ============================================================
   pages/admin/artwork-edit.js — Eser ekle/düzenle formu
   • ?id=X varsa Edit modu (mevcut veriyle doldur)
   • Sanatçı dropdown'u GET /sanatcilar ile doldurulur
   • Çoklu görsel: drag-drop + file picker → bilgisayardan dosya seç
     ▸ Preview grid: her görselde "★ Set primary" ve "Remove"
     ▸ İlk görsel = primary (kapak); detay sayfasında sırayla gösterilir
   • Submit → eseri oluşturur/günceller, ardından dosyaları multipart yükler
   ============================================================ */

(function () {
  'use strict';

  let editingId = null;

  // Görsel listesi — her öğe:
  //   { kind:'file',     file:File, src:dataURL, primary:bool }
  //   { kind:'existing', id:uint,  src:url,     primary:bool }
  const images = [];
  const removedExistingIds = [];

  const ACCEPTED = /^image\/(png|jpe?g|webp|gif)$/i;
  const MAX_SIZE = 5 * 1024 * 1024;

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

    bindFilePicker();
    bindDragDrop();
    bindSubmit();
    renderPreviewGrid();
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
      form.querySelector('[name="kategori"]').value = a.category || 'painting';
      form.querySelector('[name="fiyat"]').value = a.price || 0;
      form.querySelector('[name="stok_adedi"]').value = a.stock != null ? a.stock : 1;
      if (a.artistId) {
        const sel = form.querySelector('[name="sanatci_id"]');
        if (sel) sel.value = a.artistId;
      }
      // Mevcut görseller — gorseller dizisi {id,url,sira,primary_mi}
      const ham = a.gorseller || [];
      if (ham.length > 0) {
        ham.slice().sort((x, y) => (x.sira || 0) - (y.sira || 0)).forEach(g => {
          images.push({
            kind: 'existing',
            id: g.id,
            src: GALLERY.mediaURL(g.url),
            primary: !!g.primary_mi,
          });
        });
      } else if (a.image) {
        // Eski tek-görsel kaydı
        images.push({ kind: 'existing', id: null, src: a.image, primary: true });
      }
      if (images.length && !images.some(im => im.primary)) images[0].primary = true;
    } catch (e) {
      console.warn('prefill failed', e);
      Utils.toast('Could not load artwork for editing');
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
          primary: images.length === 0, // ilk görsel otomatik primary
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
    // primary garantisi: hiçbiri primary değilse ilkini primary yap
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

  // Set primary — seçilen görseli listenin başına taşır (sıra = görüntüleme sırası)
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
    Utils.qs('#artwork-form').addEventListener('submit', async e => {
      e.preventDefault();
      const msg = Utils.qs('#form-msg');
      const btn = Utils.qs('#submit-btn');

      const data = new FormData(e.target);
      const payload = {
        sanatci_id: Number(data.get('sanatci_id')) || null,
        baslik:     (data.get('baslik') || '').trim(),
        aciklama:   (data.get('aciklama') || '').trim(),
        kategori:   data.get('kategori'),
        fiyat:      Number(data.get('fiyat')),
        stok_adedi: Number(data.get('stok_adedi')),
      };

      if (!payload.baslik || payload.baslik.length < 2) {
        return showMsg(msg, 'Title is required.', 'accent');
      }
      if (!payload.sanatci_id) {
        return showMsg(msg, 'Please select an artist.', 'accent');
      }
      if (images.length === 0) {
        return showMsg(msg, 'Please add at least one image from your computer.', 'accent');
      }
      if (!(payload.fiyat > 0)) {
        return showMsg(msg, 'Price must be greater than 0.', 'accent');
      }

      // Yeni dosyalar (sıralı) + primary index'i
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
          // 1) kaldırılan mevcut görselleri sil
          for (const gid of removedExistingIds) {
            if (gid != null) {
              try { await GALLERY.api.adminEser.gorselSil(editingId, gid); }
              catch (err) { console.warn('gorselSil failed', gid, err); }
            }
          }
          // 2) eseri güncelle + yeni dosyaları yükle
          result = await GALLERY.api.adminEser.guncelle(editingId, payload, newFiles, Math.max(0, primaryIndex));
        } else {
          result = await GALLERY.api.adminEser.olustur(payload, newFiles, Math.max(0, primaryIndex));
        }

        // Eser kaydedildi. Görsel yüklemesi ayrı bir adım — başarısız olsa bile
        // "kaydedilemedi" demek yanlış olur; net bir uyarı gösterilir.
        if (result && result.gorselUyari) {
          Utils.toast('Saved — but images failed to upload');
          showMsg(msg, (editingId ? 'Updated' : 'Saved') + ', but image upload failed — returning to list…', 'accent');
        } else {
          Utils.toast(editingId ? 'Artwork updated' : 'Artwork created');
          showMsg(msg, (editingId ? 'Updated' : 'Saved') + ' — returning to list…', 'brand');
        }
        setTimeout(() => location.href = 'artworks.html', 1100);
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
