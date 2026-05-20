/* ============================================================
   pages/admin/support.js — Admin support management & chat
   ============================================================ */

(function () {
  'use strict';

  let tickets = [];
  let activeTicketId = null;
  let pollInterval = null;

  Utils.onReady(async function () {
    // 1. Auth & Role check
    if (!Store.User.isAuthed()) {
      setTimeout(() => location.href = '../auth.html?next=admin/support.html', 400);
      return;
    }
    if (!Store.User.isAdmin()) {
      Utils.toast('Admin access required');
      setTimeout(() => location.href = '../dashboard.html', 600);
      return;
    }

    // 2. Render navigation
    renderAdminHeader('support');

    // 3. Initial load
    await loadTickets();

    // 4. Bind events
    bindEvents();
  });

  async function loadTickets() {
    try {
      tickets = await GALLERY.api.adminListele.destekTalepleri();
      renderTicketsList();
    } catch (e) {
      console.error('Could not load support tickets:', e);
      Utils.toast('Failed to load tickets');
    }
  }

  function renderTicketsList() {
    const listRoot = Utils.qs('#tickets-list');
    const emptyRoot = Utils.qs('#tickets-empty');
    if (!listRoot) return;

    const searchQuery = (Utils.qs('#search-tickets')?.value || '').toLowerCase().trim();
    const statusFilter = Utils.qs('#status-filter')?.value || 'all';

    // Filter tickets
    const filtered = tickets.filter(t => {
      // Status filter
      if (statusFilter !== 'all') {
        const ticketStatus = (t.status || '').toLowerCase();
        if (statusFilter === 'acik' && ticketStatus !== 'open' && ticketStatus !== 'acik') return false;
        if (statusFilter === 'kapali' && ticketStatus !== 'closed' && ticketStatus !== 'kapali') return false;
      }

      // Search query
      if (searchQuery) {
        const subject = (t.subject || '').toLowerCase();
        const userName = (t.userName || '').toLowerCase();
        const userEmail = (t.userEmail || '').toLowerCase();
        const ticketId = String(t.id);

        if (!subject.includes(searchQuery) && 
            !userName.includes(searchQuery) && 
            !userEmail.includes(searchQuery) && 
            !ticketId.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      listRoot.innerHTML = '';
      emptyRoot?.classList.remove('hidden');
      return;
    }
    emptyRoot?.classList.add('hidden');

    listRoot.innerHTML = filtered.map(t => {
      const isActive = t.id === activeTicketId;
      const isClosed = (t.status || '').toLowerCase() === 'closed' || (t.status || '').toLowerCase() === 'kapali';
      const statusClass = isClosed 
        ? 'text-ink-muted border-line' 
        : 'text-brand border-brand/30';
      
      const statusLabel = isClosed ? 'CLOSED' : 'OPEN';
      const initial = (t.userName || 'U')[0].toUpperCase();

      return `
        <div data-id="${t.id}" class="ticket-card bg-surface border ${isActive ? 'border-ink-strong ring-1 ring-ink-strong' : 'border-line'} p-4 cursor-pointer hover:bg-bg-soft transition-all">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-xs font-mono text-ink-muted">#${t.id}</span>
            <span class="text-[9px] uppercase tracking-lux border px-2 py-0.5 ${statusClass}">${statusLabel}</span>
          </div>
          <h4 class="font-display text-base text-ink-strong truncate mb-3">${Utils.escapeHTML(t.subject)}</h4>
          <div class="flex items-center justify-between text-xs text-ink-muted">
            <div class="flex items-center gap-1.5 truncate max-w-[70%]">
              <span class="w-4 h-4 rounded-full bg-ink-strong/5 flex items-center justify-center text-[9px] font-bold text-ink-strong">${initial}</span>
              <span class="truncate">${Utils.escapeHTML(t.userName || t.userEmail || 'User')}</span>
            </div>
            <span>${Utils.escapeHTML(t.date)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    Utils.qsa('.ticket-card', listRoot).forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.getAttribute('data-id'));
        selectTicket(id);
      });
    });
  }

  async function selectTicket(ticketId) {
    if (activeTicketId === ticketId) return;
    
    // Clear previous poll
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    activeTicketId = ticketId;
    renderTicketsList(); // Refresh active state classes

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Show detail panel
    Utils.qs('#detail-panel-empty')?.classList.add('hidden');
    const panel = Utils.qs('#detail-panel');
    if (!panel) return;
    panel.classList.remove('hidden');

    // Populate metadata
    const isClosed = (ticket.status || '').toLowerCase() === 'closed' || (ticket.status || '').toLowerCase() === 'kapali';
    const statusLabel = isClosed ? 'CLOSED' : 'OPEN';
    const statusClass = isClosed ? 'text-ink-muted border-line' : 'text-brand border-brand/30';
    
    const idEl = Utils.qs('#detail-ticket-id');
    const statusEl = Utils.qs('#detail-ticket-status');
    const subjectEl = Utils.qs('#detail-ticket-subject');
    const messageEl = Utils.qs('#detail-ticket-message');
    const dateEl = Utils.qs('#detail-ticket-date');

    const custAvatar = Utils.qs('#detail-customer-avatar');
    const custName = Utils.qs('#detail-customer-name');
    const custEmail = Utils.qs('#detail-customer-email');

    const toggleStatusBtn = Utils.qs('#toggle-status-btn');

    if (idEl) idEl.textContent = `TICKET #${ticket.id}`;
    if (statusEl) {
      statusEl.textContent = statusLabel;
      statusEl.className = `text-[10px] uppercase tracking-lux border px-2 py-0.5 rounded-none font-medium ${statusClass}`;
    }
    if (subjectEl) subjectEl.textContent = ticket.subject;
    if (messageEl) messageEl.textContent = ticket.message;
    if (dateEl) dateEl.textContent = ticket.date;

    if (custName) custName.textContent = ticket.userName || '—';
    if (custEmail) custEmail.textContent = ticket.userEmail || '—';
    if (custAvatar) {
      custAvatar.textContent = (ticket.userName || 'U')[0].toUpperCase();
    }

    if (toggleStatusBtn) {
      toggleStatusBtn.style.display = 'none'; // Since backend currently does not support status updates via API
    }

    // Load and poll chat messages
    await refreshMessages();
    pollInterval = setInterval(refreshMessages, 3000);

    // Auto scroll chat to bottom
    setTimeout(() => {
      const container = Utils.qs('#chat-messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 150);
  }

  async function refreshMessages() {
    if (!activeTicketId) return;
    const container = Utils.qs('#chat-messages-container');
    if (!container) return;

    try {
      const msgs = await GALLERY.api.listChatMessages(activeTicketId);
      
      if (msgs.length === 0) {
        container.innerHTML = `
          <div class="text-center py-6 text-xs text-ink-muted italic">
            No replies yet. Use the response form below to respond.
          </div>
        `;
        return;
      }

      const previousScrollHeight = container.scrollHeight;
      const previousScrollTop = container.scrollTop;
      const isAtBottom = previousScrollTop + container.clientHeight >= previousScrollHeight - 10;

      container.innerHTML = msgs.map(m => {
        const isCurator = m.from === 'curator';
        const bubbleBg = isCurator 
          ? 'bg-ink-strong text-bg' 
          : 'bg-surface border border-line text-ink-strong';
        const alignClass = isCurator ? 'justify-end' : 'justify-start';
        const initial = isCurator ? 'C' : 'U';

        return `
          <div class="flex ${alignClass} gap-2 items-start">
            ${!isCurator ? `
              <span class="w-6 h-6 rounded-full bg-ink-strong/5 flex items-center justify-center text-[9px] font-bold text-ink-strong shrink-0 mt-1">U</span>
            ` : ''}
            <div class="max-w-[75%] flex flex-col ${isCurator ? 'items-end' : 'items-start'}">
              <div class="px-4 py-2.5 text-sm ${bubbleBg} leading-relaxed whitespace-pre-wrap">
                ${Utils.escapeHTML(m.text)}
              </div>
              <span class="text-[9px] text-ink-muted mt-1 px-1">
                ${m.at ? new Date(m.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            ${isCurator ? `
              <span class="w-6 h-6 rounded-full bg-ink-strong/90 flex items-center justify-center text-[9px] font-bold text-bg shrink-0 mt-1">C</span>
            ` : ''}
          </div>
        `;
      }).join('');

      // Auto scroll if was at bottom or if it is the first load
      if (isAtBottom || previousScrollHeight === 0) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (e) {
      console.error('Could not refresh support messages:', e);
    }
  }

  function bindEvents() {
    // Search input
    Utils.qs('#search-tickets')?.addEventListener('input', Utils.debounce(() => {
      renderTicketsList();
    }, 250));

    // Status filter
    Utils.qs('#status-filter')?.addEventListener('change', () => {
      renderTicketsList();
    });

    // Reply form submit
    Utils.qs('#reply-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!activeTicketId) return;

      const textarea = Utils.qs('#reply-text');
      const text = (textarea.value || '').trim();
      if (!text) return;

      try {
        await GALLERY.api.sendChatMessage(text, activeTicketId);
        textarea.value = '';
        await refreshMessages();
        
        // Scroll to bottom
        const container = Utils.qs('#chat-messages-container');
        if (container) container.scrollTop = container.scrollHeight;
      } catch (err) {
        console.error('Could not send response:', err);
        Utils.toast(err.message || 'Failed to send response');
      }
    });
  }

})();
