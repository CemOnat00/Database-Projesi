/* ============================================================
   pages/admin/users.js — Kullanıcı listesi (placeholder)
   Backend endpoint hazır olunca burası /admin/kullanicilar'ı çekecek.
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(async function () {
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/users.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }
    
    let users = [];
    try { users = await GALLERY.api.adminListele.kullanicilar(); }
    catch (e) { console.warn('admin/users failed', e); }

    const tbody = Utils.qs('#users-tbody');
    const empty = Utils.qs('#users-empty');

    if (users.length === 0) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    if (tbody) {
      tbody.innerHTML = users.map(u => {
        const roleClass = u.role === 'admin' ? 'text-brand border-brand/30' : 'text-ink-muted border-line';
        return `
          <tr>
            <td class="px-5 py-4">#${Utils.escapeHTML(String(u.id))}</td>
            <td class="font-display text-ink-strong">${Utils.escapeHTML(u.name || '—')}</td>
            <td class="text-ink-muted">${Utils.escapeHTML(u.email || '—')}</td>
            <td><span class="text-[10px] uppercase tracking-lux ${roleClass} border px-2 py-1">${Utils.escapeHTML(u.role || 'user')}</span></td>
            <td class="text-ink-muted">${Utils.escapeHTML(u.joined ? new Date(u.joined).toLocaleDateString('en-US') : '—')}</td>
          </tr>`;
      }).join('');
    }
  });
})();
