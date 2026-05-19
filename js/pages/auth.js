/* ============================================================
   pages/auth.js — Sign-in / Sign-up (Go backend bağlı)
   • POST /api/v1/auth/giris  → token + kullanici
   • POST /api/v1/auth/kayit  → token + kullanici
   • Token Store.User.set(profile, token) ile kaydedilir
   • Admin (rol === 'admin') → admin.html
   • Standart kullanıcı → dashboard.html (veya ?next=)
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(function () {
    bindTabs();
    bindSignIn();
    bindSignUp();
    bindGoogle();

    // If already signed in, hint that
    const user = Store.User.get();
    if (user) {
      const banner = document.createElement('p');
      banner.className = 'mb-6 text-[11px] uppercase tracking-lux text-brand border-b border-brand/40 pb-2';
      banner.innerHTML = `You are signed in as ${Utils.escapeHTML(user.email)}. <a href="${user.role === 'admin' ? 'admin/index.html' : 'dashboard.html'}" class="underline">Go to ${user.role === 'admin' ? 'admin panel' : 'dashboard'}</a> or sign in with a different account below.`;
      const formWrap = Utils.qs('#form-signin')?.parentElement;
      if (formWrap) formWrap.insertBefore(banner, formWrap.firstChild.nextSibling);
    }

    if (new URLSearchParams(location.search).get('tab') === 'signup') {
      Utils.qs('.tab-btn[data-tab="signup"]')?.click();
    }
  });

  function bindTabs() {
    Utils.qsa('.tab-btn').forEach(b => b.addEventListener('click', () => {
      Utils.qsa('.tab-btn').forEach(x => {
        x.classList.remove('border-brand', 'text-ink-strong');
        x.classList.add('border-transparent', 'text-ink-muted');
      });
      b.classList.add('border-brand', 'text-ink-strong');
      b.classList.remove('border-transparent', 'text-ink-muted');
      const tab = b.getAttribute('data-tab');
      Utils.qs('#form-signin').classList.toggle('hidden', tab !== 'signin');
      Utils.qs('#form-signup').classList.toggle('hidden', tab !== 'signup');
      Utils.qs('#signin-msg').textContent = '';
      Utils.qs('#signup-msg').textContent = '';
    }));
  }

  function bindSignIn() {
    Utils.qs('#form-signin').addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const email = (data.get('email') || '').trim();
      const password = data.get('password') || '';
      const msg = Utils.qs('#signin-msg');

      if (!email || !password) {
        showMsg(msg, 'Please enter both email and password.', 'accent');
        return;
      }

      try {
        const result = await GALLERY.api.login({ email, password });
        const k = result.kullanici;
        Store.User.set({
          id: k.id,
          name: k.ad_soyad,
          email: k.email,
          role: k.rol,
          rol: k.rol,
          kayitTarihi: k.kayit_tarihi,
        }, result.token);

        showMsg(msg, 'Signed in — redirecting…', 'brand');
        Utils.toast('Signed in — welcome back');

        // Admin için ?next= görmezden gelinir (her zaman admin paneline gider)
        const nextParam = new URLSearchParams(location.search).get('next');
        const dest = k.rol === 'admin' ? 'admin/index.html' : (nextParam || 'dashboard.html');
        setTimeout(() => { location.href = dest; }, 600);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          showMsg(msg, 'Incorrect email or password.', 'accent');
        } else if (err.code === 'network') {
          showMsg(msg, 'Backend offline — please start the server.', 'accent');
        } else {
          showMsg(msg, err.message || 'Could not sign you in. Please try again.', 'accent');
        }
      }
    });
  }

  function bindSignUp() {
    Utils.qs('#form-signup').addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const name = (data.get('name') || '').trim();
      const email = (data.get('email') || '').trim();
      const password = data.get('password') || '';
      const password2 = data.get('password2') || '';
      const msg = Utils.qs('#signup-msg');

      if (password !== password2) {
        showMsg(msg, 'Passwords do not match.', 'accent');
        return;
      }
      if (password.length < 6) {
        showMsg(msg, 'Password must be at least 6 characters.', 'accent');
        return;
      }

      try {
        const result = await GALLERY.api.register({ name, email, password });
        const k = result.kullanici;
        Store.User.set({
          id: k.id,
          name: k.ad_soyad,
          email: k.email,
          role: k.rol,
          rol: k.rol,
          kayitTarihi: k.kayit_tarihi,
        }, result.token);

        showMsg(msg, 'Welcome to The Curated Gallery', 'brand');
        Utils.toast('Account created — welcome');

        const dest = k.rol === 'admin' ? 'admin/index.html' : 'dashboard.html';
        setTimeout(() => { location.href = dest; }, 700);
      } catch (err) {
        if (err.status === 409 || /already|var|mevcut/i.test(err.message || '')) {
          showMsg(msg, 'An account with that email already exists. Try signing in.', 'accent');
        } else if (err.status === 422) {
          showMsg(msg, 'Please complete every field correctly.', 'accent');
        } else if (err.code === 'network') {
          showMsg(msg, 'Backend offline — please start the server.', 'accent');
        } else {
          showMsg(msg, err.message || 'Could not create account.', 'accent');
        }
      }
    });
  }

  function showMsg(el, text, tone) {
    el.textContent = text;
    el.className = 'text-[11px] uppercase tracking-lux mt-2 min-h-[1rem] text-' + (tone || 'ink-muted');
  }

  function bindGoogle() {
    Utils.qs('#google-btn')?.addEventListener('click', () => {
      Utils.toast('Google OAuth — not enabled on this backend');
    });
  }
})();
