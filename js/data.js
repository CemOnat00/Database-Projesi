/* ============================================================
   js/data.js — Backend ile konuşan veri katmanı (GALLERY.api.*)
   • Tüm okuma/yazma operasyonları window.Api üzerinden gerçek
     HTTP çağrılarına gider.
   • Backend Türkçe field adları kullanır (baslik, fiyat…).
     Bu dosyadaki map* fonksiyonları cevabı frontend'in kullandığı
     İngilizce shape'e çevirir.
   • Mock dataset YOK — backend çalışmıyorsa hata yakalanır,
     sayfa kendi boş durumunu gösterir.
   ============================================================ */

(function (global) {
  'use strict';

  /* ---- Frontend-only sabitler ----------------------------- */
  const COUPONS = { CURATED10: 10, FIRSTBRUSH: 15, ATELIER20: 20 };
  const SITE = (global.GALLERY && global.GALLERY.SITE) || {
    shippingFee: 120,
    taxRate: 0.18,
    cancellationWindowHours: 48,
  };

  /* ---- Mapper'lar: backend → frontend shape ---------------- */

  function mapEser(e) {
    if (!e) return null;
    const stockSold = (e.stok_adedi != null && e.stok_adedi <= 0);
    const year = e.eklenme_tarihi ? new Date(e.eklenme_tarihi).getFullYear() : new Date().getFullYear();
    const cat = (e.kategori || '').toLowerCase();
    return {
      id: e.id,
      title: e.baslik || '',
      description: e.aciklama || '',
      artist: (e.sanatci && e.sanatci.ad_soyad) || 'Unknown',
      artistId: (e.sanatci && e.sanatci.id) || null,
      artistBio: (e.sanatci && e.sanatci.biyografi) || '',
      price: Number(e.fiyat || 0),
      stock: e.stok_adedi,
      sold: stockSold,
      image: e.gorsel_url || '',
      images: e.gorsel_url ? [e.gorsel_url] : [],
      category: cat,
      medium: e.kategori || '',
      mediumShort: e.kategori || '',
      year,
      dimensions: '—',
      edition: '—',
      authenticity: 'Certificate included',
      shipping: 'Worldwide · insured',
      aspect: 'aspect-[4/5]',
      stats: e.stats || { likes: 0, views: 0, reviewCount: 0 },
      campaign: e.kampanya || null,
      _raw: e,
    };
  }

  function mapEtkinlik(w) {
    if (!w) return null;
    const dateISO = (w.etkinlik_tarihi || '').slice(0, 10);
    const dateObj = w.etkinlik_tarihi ? new Date(w.etkinlik_tarihi) : null;
    const dateLong = dateObj
      ? dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Date TBA';
    const label = dateObj
      ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    const time = w.baslangic_saati ? String(w.baslangic_saati).slice(0, 5) : '';
    const free = Number(w.ucret || 0) === 0;
    return {
      id: w.id,
      title: w.baslik || '',
      description: w.aciklama || '',
      summary: (w.aciklama || '').slice(0, 140),
      instructor: w.egitmen || 'The Atelier',
      instructorBio: w.egitmen_bio || '',
      category: 'Workshop',
      level: 'All Levels',
      mediumTag: 'workshop',
      price: Number(w.ucret || 0),
      capacity: w.kontenjan || 0,
      spotsLeft: w.kalan_kontenjan != null ? w.kalan_kontenjan : (w.kontenjan || 0),
      duration: w.sure || '—',
      location: w.lokasyon || 'The Atelier',
      image: w.gorsel_url || '',
      images: w.gorsel_url ? [w.gorsel_url] : [],
      sessions: dateObj ? [{ date: dateISO, time, label, dateLong }] : [],
      complimentary: free,
      stats: w.stats || { rating: 0, reviewCount: 0, occupancy: 0 },
      campaign: w.kampanya || null,
      _raw: w,
    };
  }

  function mapYorum(y) {
    if (!y) return null;
    const dt = y.olusturma_tarihi ? new Date(y.olusturma_tarihi) : null;
    return {
      id: y.id,
      author: (y.kullanici && y.kullanici.ad_soyad) || 'Anonymous',
      authorId: (y.kullanici && y.kullanici.id) || null,
      date: dt ? dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
      dateISO: y.olusturma_tarihi,
      rating: y.puan || 0,
      body: y.metin || '',
      helpful: y.faydali_oy_sayisi || 0,
      verified: !!y.dogrulanmis_mi,
      reply: y.yanitlar && y.yanitlar.length ? y.yanitlar[0].yanit_metni : null,
      _raw: y,
    };
  }

  function mapRezervasyon(r) {
    if (!r) return null;
    const w = mapEtkinlik(r.etkinlik) || {};
    return {
      id: r.id,
      workshopId: r.etkinlik_id || (r.etkinlik && r.etkinlik.id) || null,
      workshopTitle: w.title || '',
      instructor: w.instructor || '',
      sessionDate: w.sessions && w.sessions[0] ? w.sessions[0].date : null,
      sessionLabel: w.sessions && w.sessions[0] ? w.sessions[0].dateLong : '',
      sessionTime: w.sessions && w.sessions[0] ? w.sessions[0].time : '',
      participants: r.katilimci_sayisi || 1,
      status: capStatus(r.durum),
      total: w.price ? Number(w.price) * (r.katilimci_sayisi || 1) : 0,
      createdAt: r.olusturma_tarihi,
      customer: r.kullanici ? {
        id: r.kullanici.id,
        name: r.kullanici.ad_soyad,
        email: r.kullanici.email,
      } : null,
      _workshop: w,
      _raw: r,
    };
  }

  function mapSiparis(s) {
    if (!s) return null;
    return {
      id: s.id,
      total: Number(s.toplam_tutar || 0),
      paymentMethod: s.odeme_yontemi || '',
      status: capStatus(s.durum),
      date: s.olusturma_tarihi ? new Date(s.olusturma_tarihi).toLocaleDateString('en-US') : '',
      customer: s.kullanici ? {
        id: s.kullanici.id,
        name: s.kullanici.ad_soyad,
        email: s.kullanici.email,
      } : null,
      items: (s.detaylar || []).map(d => ({
        type: 'artwork',
        refId: d.eser_id,
        title: (d.eser && d.eser.baslik) || ('Artwork #' + d.eser_id),
        artist: (d.eser && d.eser.sanatci && d.eser.sanatci.ad_soyad) || '',
        image: (d.eser && d.eser.gorsel_url) || '',
        price: Number(d.birim_fiyat || 0),
        qty: 1,
      })),
      _raw: s,
    };
  }

  function mapFavori(f) {
    if (!f) return null;
    const e = mapEser(f.eser) || { id: f.eser_id };
    e._favoriteSince = f.eklenme_tarihi;
    return e;
  }

  function mapDestek(t) {
    if (!t) return null;
    return {
      id: t.id,
      subject: t.konu || '',
      message: t.mesaj || '',
      status: capStatus(t.durum),
      date: t.olusturma_tarihi ? new Date(t.olusturma_tarihi).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      _raw: t,
    };
  }

  function mapDestekMesaj(m) {
    if (!m) return null;
    return {
      id: m.id,
      text: m.mesaj || '',
      from: (m.gonderen_tipi === 'admin' || m.gonderen_tipi === 'yonetici') ? 'curator' : 'user',
      at: m.olusturma_tarihi,
      _raw: m,
    };
  }

  function capStatus(s) {
    if (!s) return '—';
    const map = {
      'beklemede': 'Pending',
      'onaylandi': 'Confirmed',
      'tamamlandi': 'Completed',
      'iptal': 'Cancelled',
      'iptal_edildi': 'Cancelled',
      'acik': 'Open',
      'cevaplandi': 'Resolved',
      'kapali': 'Resolved',
    };
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ============================================================
     API katmanı — sayfa modüllerinin kullandığı public yüzey
     ============================================================ */

  const api = {
    /* ---- Artworks (eserler) ---- */
    async listArtworks(params) {
      const data = await global.Api.get('/eserler');
      const arr = (data && data.eserler) || [];
      let mapped = arr.map(mapEser);
      if (params && params.category) mapped = mapped.filter(a => a.category === params.category);
      if (params && params.q) {
        const q = params.q.toLowerCase();
        mapped = mapped.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.artist.toLowerCase().includes(q) ||
          a.mediumShort.toLowerCase().includes(q));
      }
      return mapped;
    },
    async getArtwork(id) {
      const data = await global.Api.get('/eserler/' + encodeURIComponent(id));
      return mapEser(data);
    },

    /* ---- Workshops (etkinlikler) ---- */
    async listWorkshops(params) {
      const data = await global.Api.get('/etkinlikler');
      const arr = (data && data.etkinlikler) || [];
      let mapped = arr.map(mapEtkinlik);
      if (params && params.medium && params.medium !== 'all') {
        mapped = mapped.filter(w => (w.mediumTag || '').toLowerCase() === params.medium);
      }
      if (params && params.dateRange && params.dateRange !== 'all') {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        mapped = mapped.filter(w => (w.sessions || []).some(s => {
          if (!s.date) return false;
          const d = new Date(s.date);
          if (params.dateRange === 'thismonth') return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          if (params.dateRange === 'nextmonth') {
            const next = new Date(thisYear, thisMonth + 1, 1);
            return d.getMonth() === next.getMonth() && d.getFullYear() === next.getFullYear();
          }
          return true;
        }));
      }
      return mapped;
    },
    async getWorkshop(id) {
      const data = await global.Api.get('/etkinlikler/' + encodeURIComponent(id));
      return mapEtkinlik(data);
    },

    /* ---- Reservations ---- */
    async listReservations() {
      const data = await global.Api.get('/rezervasyonlar');
      const arr = Array.isArray(data) ? data : (data && data.rezervasyonlar) || [];
      return arr.map(mapRezervasyon);
    },
    async createReservation(payload) {
      const body = {
        etkinlik_id: Number(payload.workshopId || payload.etkinlik_id),
        katilimci_sayisi: Number(payload.participants || 1),
      };
      const data = await global.Api.post('/rezervasyonlar', body);
      return { ok: true, reservationId: data && data.id, reservation: mapRezervasyon(data) };
    },
    async updateReservation(reservationId, patch) {
      const body = {};
      if (patch.participants != null) body.katilimci_sayisi = Number(patch.participants);
      if (patch.status) body.durum = patch.status.toLowerCase();
      const data = await global.Api.put('/rezervasyonlar/' + reservationId, body);
      return { ok: true, reservation: mapRezervasyon(data) };
    },
    async cancelReservation(reservationId) {
      await global.Api.del('/rezervasyonlar/' + reservationId);
      return { ok: true, refund: 0 };
    },

    /* ---- Orders ---- */
    async listOrders() {
      const data = await global.Api.get('/siparisler');
      const arr = Array.isArray(data) ? data : (data && data.siparisler) || [];
      return arr.map(mapSiparis);
    },
    async getOrder(id) {
      const data = await global.Api.get('/siparisler/' + encodeURIComponent(id));
      return mapSiparis(data);
    },
    async createOrder(order) {
      const body = {
        eser_idler: (order.items || []).filter(i => i.type === 'artwork').map(i => Number(i.refId)),
        odeme_yontemi: order.paymentMethod || 'card',
        kupon_kodu: order.discountCode || '',
      };
      const data = await global.Api.post('/siparisler', body);
      const mapped = mapSiparis(data);
      return { ok: true, order: mapped };
    },

    /* ---- Auth ---- */
    async register(profile) {
      const data = await global.Api.post('/auth/kayit', {
        ad_soyad: profile.name, email: profile.email, sifre: profile.password,
      });
      return { ok: true, token: data.token, kullanici: data.kullanici };
    },
    async login(credentials) {
      const data = await global.Api.post('/auth/giris', {
        email: credentials.email, sifre: credentials.password,
      });
      return { ok: true, token: data.token, kullanici: data.kullanici };
    },
    async logout() {
      // Sunucu tarafında stateless JWT — sadece local temizle
      global.Store.User.clear();
      return { ok: true };
    },
    async getProfile() {
      const data = await global.Api.get('/profil');
      return data; // {id, ad_soyad, email, rol, ...}
    },
    async updateProfile(patch) {
      const body = {};
      if (patch.name) body.ad_soyad = patch.name;
      const data = await global.Api.put('/profil', body);
      return { ok: true, user: data };
    },
    async changePassword(currentPw, newPw) {
      try {
        await global.Api.put('/profil/sifre', { eski_sifre: currentPw, yeni_sifre: newPw });
        return { ok: true };
      } catch (e) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('eski') || msg.includes('mevcut')) return { ok: false, error: 'wrong_password' };
        if (msg.includes('min') || (newPw || '').length < 6) return { ok: false, error: 'weak_password' };
        return { ok: false, error: 'unknown' };
      }
    },

    /* ---- Favorites ---- */
    favorites: {
      async list() {
        const data = await global.Api.get('/favoriler');
        const arr = Array.isArray(data) ? data : (data && data.favoriler) || [];
        return arr.map(f => f.eser_id || (f.eser && f.eser.id) || f.id);
      },
      async listFull() {
        const data = await global.Api.get('/favoriler');
        const arr = Array.isArray(data) ? data : (data && data.favoriler) || [];
        return arr.map(mapFavori);
      },
      async has(id) {
        const ids = await api.favorites.list();
        return ids.includes(Number(id));
      },
      async add(id) {
        await global.Api.post('/favoriler', { eser_id: Number(id) });
        global.Store.Favorites.add(String(id));
        return { ok: true, added: true };
      },
      async remove(id) {
        await global.Api.del('/favoriler/' + Number(id));
        global.Store.Favorites.remove(String(id));
        return { ok: true, removed: true };
      },
      async toggle(id) {
        const has = await api.favorites.has(id);
        if (has) {
          await api.favorites.remove(id);
          return { ok: true, on: false };
        }
        await api.favorites.add(id);
        return { ok: true, on: true };
      },
    },

    /* ---- Reviews ---- */
    async listReviews(targetId, sort, kind) {
      const siralama = ({ recent: 'en_yeni', rating: 'en_yuksek_puan', helpful: 'en_faydali' })[sort] || 'en_yeni';
      const tip = kind || 'eser';
      const data = await global.Api.get('/yorumlar/' + encodeURIComponent(targetId) +
        '?tip=' + tip + '&siralama=' + siralama);
      // data may be { ortalama_puan, toplam_yorum, yorumlar } or array
      const arr = (data && data.yorumlar) || (Array.isArray(data) ? data : []);
      const list = arr.map(mapYorum);
      // expose meta on array
      list.meta = {
        average: (data && data.ortalama_puan) || 0,
        total: (data && data.toplam_yorum) || list.length,
      };
      return list;
    },
    async createReview(targetId, payload, kind) {
      const body = {
        referans_id: Number(targetId),
        referans_tipi: kind || 'eser',
        puan: payload.rating,
        metin: payload.body,
      };
      const data = await global.Api.post('/yorumlar', body);
      return { ok: true, review: mapYorum(data) };
    },
    async toggleReviewHelpful(targetId, reviewIndex, reviewId) {
      const id = reviewId;
      if (id == null) return { ok: false };
      await global.Api.post('/yorumlar/' + Number(id) + '/faydali');
      const key = `${targetId}:${reviewIndex}`;
      const on = global.Store.ReviewVotes.toggle(key);
      return { ok: true, on };
    },
    async replyToReview(reviewId, text) {
      // Admin yanıtı
      await global.Api.post('/admin/yorumlar/' + Number(reviewId) + '/yanit', { yanit_metni: text });
      return { ok: true };
    },

    /* ---- Support ---- */
    async listSupportTickets() {
      const data = await global.Api.get('/destek');
      const arr = Array.isArray(data) ? data : (data && data.talepler) || [];
      return arr.map(mapDestek);
    },
    async submitSupportTicket(payload) {
      const body = {
        konu: (payload.subject || payload.topic || 'General Inquiry').slice(0, 150),
        mesaj: (payload.message || '').slice(0, 4000),
      };
      const data = await global.Api.post('/destek', body);
      return { ok: true, ticket: mapDestek(data) };
    },
    async listChatMessages(ticketId) {
      if (!ticketId) return [];
      const data = await global.Api.get('/destek/' + Number(ticketId) + '/mesaj');
      const arr = Array.isArray(data) ? data : (data && data.mesajlar) || [];
      return arr.map(mapDestekMesaj);
    },
    async sendChatMessage(text, ticketId) {
      if (!ticketId) return { ok: false, error: 'no_ticket' };
      const data = await global.Api.post('/destek/' + Number(ticketId) + '/mesaj', { mesaj: text });
      return { ok: true, message: mapDestekMesaj(data) };
    },

    /* ---- Comparisons ---- */
    async saveComparison(kind, ids) {
      const endpoint = kind === 'events' ? '/karsilastir/etkinlikler' : '/karsilastir/eserler';
      const key = kind === 'events' ? 'etkinlik_idler' : 'eser_idler';
      const body = { [key]: ids.map(Number), kaydet: true };
      await global.Api.post(endpoint, body);
      // Local de tutalım
      global.Store.Comparisons.save('Comparison · ' + new Date().toLocaleDateString(), { type: kind, ids });
      return { ok: true };
    },

    /* ---- Campaigns & Offers ---- */
    async listCampaignArtworks() {
      try {
        const data = await global.Api.get('/kampanya/eserler');
        const arr = Array.isArray(data) ? data : (data && data.eserler) || [];
        return arr.map(mapEser);
      } catch (_) { return []; }
    },
    async listCampaignWorkshops() {
      // Backend'de yok — boş döndür
      return [];
    },
    async listOffers(userEmail) {
      // Public + per-user
      const out = [];
      if (global.Api.isAuthed()) {
        try {
          const data = await global.Api.get('/firsatlar');
          const arr = Array.isArray(data) ? data : (data && data.firsatlar) || [];
          arr.forEach(o => out.push({
            code: o.kupon_kodu,
            label: (o.indirim_yuzdesi ? o.indirim_yuzdesi + '% off' : 'Special offer'),
            description: o.gecerlilik_tarihi ? ('Valid until ' + o.gecerlilik_tarihi) : '',
            scope: 'all',
          }));
        } catch (_) { /* ignore */ }
      }
      // Public statik kuponlar (frontend)
      out.push({ code: 'CURATED10',  label: '10% off your first purchase', description: 'Use at checkout. One-time application.', scope: 'public' });
      out.push({ code: 'FIRSTBRUSH', label: '15% off any workshop',         description: 'Newcomer offer for atelier sessions.',  scope: 'workshops' });
      return out;
    },

    /* ---- Coupons (frontend-only check) ---- */
    async validateCoupon(code) {
      const c = (code || '').toUpperCase();
      const pct = COUPONS[c];
      return pct ? { ok: true, code: c, pct } : { ok: false };
    },

    /* ---- Stats ---- */
    async getArtworkStats(id) {
      try { return await global.Api.get('/istatistik/eser/' + Number(id)); }
      catch (_) { return null; }
    },
    async getWorkshopStats(id) {
      try { return await global.Api.get('/istatistik/etkinlik/' + Number(id)); }
      catch (_) { return null; }
    },
    async getAdminReport() {
      return await global.Api.get('/admin/rapor');
    },

    /* ============================================================
       Admin CRUD (DEMO MODE — backend yarın bağlanacak)
       Şu an her metot console'a log atar, toast döndürür.
       Backend hazır olunca her metodun gövdesindeki TODO satırı
       açılır, demo bölümü silinir.
       ============================================================ */
    adminEser: {
      async olustur(payload) {
        return await global.Api.post('/admin/eserler', payload);
      },
      async guncelle(id, patch) {
        return await global.Api.put('/admin/eserler/' + id, patch);
      },
      async sil(id) {
        return await global.Api.del('/admin/eserler/' + id);
      },
    },

    adminEtkinlik: {
      async olustur(payload) {
        return await global.Api.post('/admin/etkinlikler', payload);
      },
      async guncelle(id, patch) {
        return await global.Api.put('/admin/etkinlikler/' + id, patch);
      },
      async sil(id) {
        return await global.Api.del('/admin/etkinlikler/' + id);
      },
    },

    adminSanatci: {
      async listele() {
        // Sanatçılar public — gerçek backend var
        try {
          const data = await global.Api.get('/sanatcilar');
          const arr = (data && data.sanatcilar) || (Array.isArray(data) ? data : []);
          return arr.map(s => ({
            id: s.id, name: s.ad_soyad, biography: s.biyografi || '', _raw: s,
          }));
        } catch (_) { return []; }
      },
      async detay(id) {
        try {
          const s = await global.Api.get('/sanatcilar/' + id);
          return { id: s.id, name: s.ad_soyad, biography: s.biyografi || '', _raw: s };
        } catch (_) { return null; }
      },
      async olustur(payload) {
        return await global.Api.post('/admin/sanatcilar', payload);
      },
      async guncelle(id, patch) {
        return await global.Api.put('/admin/sanatcilar/' + id, patch);
      },
      async sil(id) {
        return await global.Api.del('/admin/sanatcilar/' + id);
      },
    },

    adminListele: {
      async siparisler() {
        const data = await global.Api.get('/admin/siparisler');
        const arr = Array.isArray(data) ? data : (data && data.siparisler) || [];
        return arr.map(mapSiparis);
      },
      async rezervasyonlar() {
        const data = await global.Api.get('/admin/rezervasyonlar');
        const arr = Array.isArray(data) ? data : (data && data.rezervasyonlar) || [];
        return arr.map(mapRezervasyon);
      },
      async destekTalepleri() {
        const data = await global.Api.get('/admin/destek');
        const arr = Array.isArray(data) ? data : (data && data.talepler) || [];
        return arr.map(mapDestek);
      },
      async kullanicilar() {
        const data = await global.Api.get('/admin/kullanicilar');
        const arr = Array.isArray(data) ? data : (data && data.kullanicilar) || [];
        return arr.map(k => ({
          id: k.id,
          name: k.ad_soyad,
          email: k.email,
          role: k.rol,
          joined: k.kayit_tarihi,
          _raw: k,
        }));
      },
    },

    /* ---- Waitlist (frontend-only stub) ---- */
    async joinWaitlist(payload) {
      global.Store.Waitlist && global.Store.Waitlist.add && global.Store.Waitlist.add(payload);
      return { ok: true };
    },
  };

  /* ---- Public GALLERY namespace ---------------------------- */
  global.GALLERY = Object.assign(global.GALLERY || {}, {
    SITE,
    COUPONS,
    api,
    // Backwards-compat helpers (kept synchronous proxies returning Promise)
    getArtwork: (id) => api.getArtwork(id),
    getWorkshop: (id) => api.getWorkshop(id),
    getReviews: (id, kind) => api.listReviews(id, 'recent', kind),
    // Field mappers exposed for advanced page logic
    mapEser, mapEtkinlik, mapYorum, mapRezervasyon, mapSiparis, mapFavori, mapDestek, mapDestekMesaj,
  });
})(window);
