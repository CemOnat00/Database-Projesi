/* ============================================================
   js/api.js — Tek noktadan HTTP istemcisi.
   • Bearer token otomatik header'a eklenir (Store.User.token()).
   • Envelope ({success, message, data, error}) açılır.
   • 401 → oturum temizlenir, auth.html'e yönlendirilir.
   • Hata → throw new Error(message)
   ============================================================ */

(function (global) {
  'use strict';

  const DEFAULT_BASE = 'http://localhost:8080/api/v1';
  // İsterseniz HTML'lerden override: <script>window.GALLERY_BASE_URL='...'</script>
  function baseURL() { return (global.GALLERY_BASE_URL || DEFAULT_BASE).replace(/\/+$/, ''); }

  function token() {
    try {
      return localStorage.getItem('tcg.token') || null;
    } catch (_) { return null; }
  }

  async function request(method, path, body, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    const tk = token();
    if (tk) headers['Authorization'] = 'Bearer ' + tk;

    let payload = undefined;
    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(baseURL() + path, { method, headers, body: payload, credentials: 'omit' });
    } catch (e) {
      // Network error — backend down etc.
      console.warn('[API]', method, path, 'network error:', e.message);
      const err = new Error('Backend offline');
      err.code = 'network';
      throw err;
    }

    // 204 No Content
    if (res.status === 204) return null;

    let json = null;
    try { json = await res.json(); } catch (_) { /* non-JSON body */ }

    if (res.status === 401) {
      // Sessizce çıkış ve auth'a yönlendir (login/register sayfalarında değilse)
      try { localStorage.removeItem('tcg.token'); localStorage.removeItem('tcg.user'); } catch (_) {}
      if (!/auth\.html/.test(location.pathname)) {
        const next = encodeURIComponent(location.pathname + location.search);
        setTimeout(() => { location.href = 'auth.html?next=' + next; }, 200);
      }
      const err = new Error((json && json.error) || 'Yetkisiz');
      err.code = 'unauthorized';
      err.status = 401;
      throw err;
    }

    if (!res.ok) {
      const msg = (json && (json.error || json.message)) || ('HTTP ' + res.status);
      console.warn('[API]', method, path, '→', res.status, msg);
      const err = new Error(msg);
      err.code = 'http';
      err.status = res.status;
      err.body = json;
      throw err;
    }

    // Başarılı envelope → data döner
    if (json && Object.prototype.hasOwnProperty.call(json, 'data')) return json.data;
    return json;
  }

  global.Api = {
    baseURL,
    token,
    get:    (path, opts)        => request('GET',    path, undefined, opts),
    post:   (path, body, opts)  => request('POST',   path, body,      opts),
    put:    (path, body, opts)  => request('PUT',    path, body,      opts),
    del:    (path, opts)        => request('DELETE', path, undefined, opts),
    isAuthed: () => !!token(),
  };
})(window);
