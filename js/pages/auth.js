/* ============================================================
   pages/auth.js — Sign-in / Sign-up
   Backend-ready: GALLERY.api.register / login üzerinden.
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
      banner.innerHTML = `You are signed in as ${Utils.escapeHTML(user.email)}. <a href="dashboard.html" class="underline">Go to dashboard</a> or sign in with a different account below.`;
      const formWrap = Utils.qs('#form-signin')?.parentElement;
      if (formWrap) formWrap.insertBefore(banner, formWrap.firstChild.nextSibling);
    }

    // Open signup tab if URL says so
    if (new URLSearchParams(location.search).get('tab') === 'signup') {
      Utils.qs('.tab-btn[data-tab="signup"]')?.click();
    }
  });

  function bindTabs() {
    Utils.qsa('.tab-btn').forEach(b => b.addEventListener('click', () => {
      Utils.qsa('.tab-btn').forEach(x => {
        x.classList.remove('border-brand','text-ink-strong');
        x.classList.add('border-transparent','text-ink-muted');
      });
      b.classList.add('border-brand','text-ink-strong');
      b.classList.remove('border-transparent','text-ink-muted');
      const tab = b.getAttribute('data-tab');
      Utils.qs('#form-signin').classList.toggle('hidden', tab !== 'signin');
      Utils.qs('#form-signup').classList.toggle('hidden', tab !== 'signup');
      // Clear messages on tab change
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
        msg.textContent = 'Please enter both email and password.';
        msg.className = 'text-[11px] uppercase tracking-lux text-accent mt-2';
        return;
      }

      const result = await GALLERY.api.login({ email, password });
      if (!result.ok) {
        if (result.error === 'not_found') msg.textContent = 'No account found for that email.';
        else if (result.error === 'wrong_password') msg.textContent = 'Incorrect password. Try again.';
        else msg.textContent = 'Could not sign you in — please try again.';
        msg.className = 'text-[11px] uppercase tracking-lux text-accent mt-2';
        return;
      }
      Utils.toast('Signed in — taking you to your dashboard');
      const next = new URLSearchParams(location.search).get('next') || 'dashboard.html';
      setTimeout(() => location.href = next, 700);
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
        msg.textContent = 'Passwords do not match.';
        msg.className = 'text-[11px] uppercase tracking-lux text-accent mt-2';
        return;
      }
      if (password.length < 8) {
        msg.textContent = 'Password must be at least 8 characters.';
        msg.className = 'text-[11px] uppercase tracking-lux text-accent mt-2';
        return;
      }

      const result = await GALLERY.api.register({ name, email, password });
      if (!result.ok) {
        if (result.error === 'email_taken') msg.textContent = 'An account with that email already exists. Try signing in.';
        else if (result.error === 'missing_fields') msg.textContent = 'Please complete every field.';
        else msg.textContent = 'Could not create account — please try again.';
        msg.className = 'text-[11px] uppercase tracking-lux text-accent mt-2';
        return;
      }
      Utils.toast('Welcome to The Curated Gallery');
      setTimeout(() => location.href = 'dashboard.html', 800);
    });
  }

  function bindGoogle() {
    Utils.qs('#google-btn')?.addEventListener('click', () => {
      Utils.toast('Google OAuth — simulated for the frontend mockup');
    });
  }
})();
