/* ============================================================
   pages/support.js — Destek talebi + canlı chat (backend bağlı)
   • POST /destek → ticket aç
   • GET /destek → ticket listesi
   • POST /destek/:id/mesaj → mesaj gönder
   • GET /destek/:id/mesaj → mesajları çek (polling 3sn)
   ============================================================ */

(function () {
  'use strict';

  let activeTicketId = null;
  let pollTimer = null;

  Utils.onReady(function () {
    prefillFromUser();
    renderTickets();
    bindForm();
    bindLiveChat();
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
    if (!Store.User.isAuthed()) {
      root.innerHTML = '<tr><td colspan="4" class="px-5 py-6 text-center text-ink-muted italic"><a href="auth.html?next=support.html" class="underline text-brand">Sign in</a> to see your support history.</td></tr>';
      return;
    }
    let tickets = [];
    try { tickets = await GALLERY.api.listSupportTickets(); }
    catch (e) { console.warn('tickets load failed', e); }

    if (tickets.length === 0) {
      root.innerHTML = '<tr><td colspan="4" class="px-5 py-6 text-center text-ink-muted italic">No support requests yet.</td></tr>';
      return;
    }
    root.innerHTML = tickets.map(t => `
      <tr data-ticket="${t.id}" class="ticket-row cursor-pointer hover:bg-bg-soft">
        <td class="px-5 py-4">#${t.id}</td>
        <td>${Utils.escapeHTML(t.subject)}</td>
        <td>${Utils.escapeHTML(t.date)}</td>
        <td><span class="text-[10px] uppercase tracking-lux ${t.status === 'Resolved' || t.status === 'Cevaplandi' ? 'text-brand border-brand/30' : 'text-accent border-accent/30'} border px-2 py-1">${Utils.escapeHTML(t.status)}</span></td>
      </tr>
    `).join('');

    Utils.qsa('.ticket-row', root).forEach(tr => tr.addEventListener('click', () => {
      const id = Number(tr.getAttribute('data-ticket'));
      openChat(id);
    }));
  }

  function bindForm() {
    Utils.qs('#support-form').addEventListener('submit', async e => {
      e.preventDefault();
      if (!Store.User.isAuthed()) {
        Utils.toast('Sign in to open a support ticket');
        setTimeout(() => location.href = 'auth.html?next=support.html', 600);
        return;
      }
      const data = new FormData(e.target);
      const msg = Utils.qs('#support-msg');
      const payload = {
        subject: (data.get('subject') || '').trim(),
        message: (data.get('message') || '').trim(),
      };
      if (payload.subject.length < 5) {
        msg.textContent = 'Subject must be at least 5 characters.';
        msg.className = 'mt-4 text-[11px] uppercase tracking-lux min-h-[1rem] text-accent';
        return;
      }
      if (payload.message.length < 10) {
        msg.textContent = 'Please describe your request in more detail.';
        msg.className = 'mt-4 text-[11px] uppercase tracking-lux min-h-[1rem] text-accent';
        return;
      }
      try {
        const result = await GALLERY.api.submitSupportTicket(payload);
        msg.textContent = `Submitted — ticket #${result.ticket.id}. We will reply within one working day.`;
        msg.className = 'mt-4 text-[11px] uppercase tracking-lux min-h-[1rem] text-brand';
        Utils.toast(`Ticket #${result.ticket.id} opened`);
        const user = Store.User.get();
        e.target.reset();
        if (user) {
          e.target.querySelector('[name="name"]').value = user.name || '';
          e.target.querySelector('[name="email"]').value = user.email || '';
        }
        renderTickets();
      } catch (err) {
        msg.textContent = err.message || 'Could not submit — please try again.';
        msg.className = 'mt-4 text-[11px] uppercase tracking-lux min-h-[1rem] text-accent';
      }
    });
  }

  /* ---- Live chat ---- */
  function bindLiveChat() {
    const openBtn = Utils.qs('#live-chat');

    openBtn?.addEventListener('click', async () => {
      if (!Store.User.isAuthed()) {
        Utils.toast('Sign in to chat with the curator');
        setTimeout(() => location.href = 'auth.html?next=support.html', 600);
        return;
      }
      // Eğer en az bir ticket varsa onu aç; yoksa kullanıcıya bir tane açmasını söyle
      try {
        const tickets = await GALLERY.api.listSupportTickets();
        if (tickets.length === 0) {
          Utils.toast('Open a ticket first using the form on the left');
          return;
        }
        openChat(tickets[0].id);
      } catch (e) {
        Utils.toast('Backend offline');
      }
    });

    Utils.qs('#chat-close')?.addEventListener('click', closeChat);

    Utils.qs('#chat-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const input = Utils.qs('#chat-input');
      const text = (input.value || '').trim();
      input.value = '';
      if (!text || !activeTicketId) return;
      try {
        await GALLERY.api.sendChatMessage(text, activeTicketId);
        await refreshMessages();
      } catch (err) {
        Utils.toast(err.message || 'Could not send message');
      }
    });

    if (new URLSearchParams(location.search).get('chat') === 'open') {
      // Defer until tickets render
      setTimeout(() => openBtn?.click(), 300);
    }
  }

  async function openChat(ticketId) {
    activeTicketId = ticketId;
    const panel = Utils.qs('#chat-panel');
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.classList.add('flex');

    // Panel header (ticket numarası)
    const title = panel.querySelector('header .font-display');
    if (title) title.textContent = `Ticket #${ticketId}`;

    await refreshMessages();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshMessages, 3000);
    setTimeout(() => Utils.qs('#chat-input')?.focus(), 50);
  }

  function closeChat() {
    const panel = Utils.qs('#chat-panel');
    panel?.classList.add('hidden');
    panel?.classList.remove('flex');
    activeTicketId = null;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  async function refreshMessages() {
    if (!activeTicketId) return;
    const list = Utils.qs('#chat-messages');
    if (!list) return;
    try {
      const msgs = await GALLERY.api.listChatMessages(activeTicketId);
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
    } catch (e) {
      console.warn('refreshMessages failed', e);
    }
  }
})();
