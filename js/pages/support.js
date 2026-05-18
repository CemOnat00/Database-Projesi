/* ============================================================
   pages/support.js — Contact form + tickets + live chat widget
   Backend-ready: tüm yazma/okuma GALLERY.api.* üzerinden.
   ============================================================ */

(function () {
  'use strict';

  Utils.onReady(function () {
    prefillFromUser();
    renderTickets();
    bindForm();
    bindLiveChat();
    renderChatMessages();
    Store.subscribe('support_tickets', renderTickets);
    Store.subscribe('chat_messages',  renderChatMessages);
  });

  function prefillFromUser() {
    const user = Store.User.get();
    if (!user) return;
    const form = Utils.qs('#support-form');
    if (!form) return;
    const set = (n, v) => { const el = form.querySelector(`[name="${n}"]`); if (el && v) el.value = v; };
    set('name',  user.name);
    set('email', user.email);
  }

  async function renderTickets() {
    const root = Utils.qs('#tickets-tbody');
    if (!root) return;
    const tickets = await GALLERY.api.listSupportTickets();
    if (tickets.length === 0) {
      root.innerHTML = '<tr><td colspan="4" class="px-5 py-6 text-center text-ink-muted italic">No support requests yet.</td></tr>';
      return;
    }
    root.innerHTML = tickets.map(t => `
      <tr>
        <td class="px-5 py-4">#${t.id}</td>
        <td>${Utils.escapeHTML(t.subject)}</td>
        <td>${Utils.escapeHTML(t.date)}</td>
        <td><span class="text-[10px] uppercase tracking-lux ${t.status === 'Resolved' ? 'text-brand border-brand/30' : 'text-accent border-accent/30'} border px-2 py-1">${Utils.escapeHTML(t.status)}</span></td>
      </tr>
    `).join('');
  }

  function bindForm() {
    Utils.qs('#support-form').addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const msg = Utils.qs('#support-msg');
      const payload = {
        name:    (data.get('name') || '').trim(),
        email:   (data.get('email') || '').trim(),
        topic:   data.get('topic') || 'General Inquiry',
        subject: (data.get('subject') || '').trim(),
        message: (data.get('message') || '').trim(),
      };
      const result = await GALLERY.api.submitSupportTicket(payload);
      if (!result.ok) {
        msg.textContent = result.error === 'missing_fields' ? 'Please complete every field.' : 'Could not submit — please try again.';
        msg.className = 'mt-4 text-[11px] uppercase tracking-lux min-h-[1rem] text-accent';
        return;
      }
      msg.textContent = `Submitted — ticket #${result.ticket.id}. We will reply within one working day.`;
      msg.className = 'mt-4 text-[11px] uppercase tracking-lux min-h-[1rem] text-brand';
      Utils.toast(`Ticket #${result.ticket.id} opened`);
      // Reset only the editable fields; keep prefilled name/email if user is signed in
      const user = Store.User.get();
      e.target.reset();
      if (user) {
        e.target.querySelector('[name="name"]').value = user.name || '';
        e.target.querySelector('[name="email"]').value = user.email || '';
      }
    });
  }

  /* ---- Live chat ---- */
  function bindLiveChat() {
    const open = () => {
      const panel = Utils.qs('#chat-panel');
      if (!panel) return;
      panel.classList.remove('hidden');
      panel.classList.add('flex');
      // Seed welcome message if empty
      if (Store.ChatMessages.list().length === 0) {
        Store.ChatMessages.add({
          from: 'curator',
          text: 'Welcome to The Curated Gallery. How can I help — an artwork, a workshop, or an order?',
        });
      }
      setTimeout(() => Utils.qs('#chat-input')?.focus(), 50);
    };

    Utils.qs('#live-chat')?.addEventListener('click', open);

    Utils.qs('#chat-close')?.addEventListener('click', () => {
      const panel = Utils.qs('#chat-panel');
      panel.classList.add('hidden');
      panel.classList.remove('flex');
    });

    Utils.qs('#chat-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const input = Utils.qs('#chat-input');
      const text = input.value;
      input.value = '';
      await GALLERY.api.sendChatMessage(text);
    });

    // Open via URL ?chat=open
    if (new URLSearchParams(location.search).get('chat') === 'open') open();
  }

  function renderChatMessages() {
    const list = Utils.qs('#chat-messages');
    if (!list) return;
    const msgs = Store.ChatMessages.list();
    list.innerHTML = msgs.map(m => {
      const isUser = m.from === 'user';
      return `
        <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] px-3 py-2 text-sm ${isUser ? 'bg-brand text-white' : 'bg-bg-soft border border-line text-ink-strong'}">
            ${Utils.escapeHTML(m.text)}
          </div>
        </div>`;
    }).join('');
    list.scrollTop = list.scrollHeight;
  }
})();
