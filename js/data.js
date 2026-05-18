/* ============================================================
   js/data.js — Mock data (eserler, atölyeler, yorumlar)
   Tek veri kaynağı; tüm sayfalar buradan beslenir.
   ============================================================ */

(function (global) {
  'use strict';

  const ARTWORKS = [
    {
      id: 'midnight-resonance',
      title: 'Midnight Resonance',
      artist: 'David K. Chen',
      artistBio: 'Born in Vancouver, working between Lisbon and Berlin. Chen\'s practice centres on the long, quiet conversation between artist and medium.',
      price: 4200,
      medium: 'Oil on Belgian linen',
      mediumShort: 'Oil on Canvas',
      year: 2024,
      dimensions: '120 × 90 cm',
      edition: 'Unique work · signed verso',
      authenticity: 'Certificate included',
      shipping: 'Worldwide · insured crating',
      category: 'painting',
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
        'https://images.unsplash.com/photo-1549289524-06cf8837ace5',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
      ],
      description: 'A nocturnal study of light\'s quiet reverberation across linen — built in eighteen layers of slow-drying oil. Chen\'s hand is unhurried; the canvas breathes between each glaze.',
      aspect: 'aspect-[4/5]',
      stats: { likes: 312, views: 8412, reviewCount: 14 },
    },
    {
      id: 'ochre-study',
      title: 'Ochre Study No. 4',
      artist: 'Elena Rostova',
      artistBio: 'Painter celebrated for her tactile, light-bearing canvases.',
      price: 3200,
      medium: 'Oil on Canvas',
      mediumShort: 'Oil on Canvas',
      year: 2025,
      dimensions: '90 × 110 cm',
      edition: 'Unique work',
      category: 'painting',
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1549289524-06cf8837ace5',
        'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
      ],
      description: 'Soft ochre over warm ground — a slow tonal exercise built up across twelve sittings, with the brush rests visible if you stand close.',
      aspect: 'aspect-[4/5]',
      stats: { likes: 281, views: 6940, reviewCount: 9 },
    },
    {
      id: 'roots-of-antiquity',
      title: 'Roots of Antiquity',
      artist: 'Sophia Lin',
      artistBio: 'Working on heavy paper with charcoal and graphite.',
      price: 850,
      medium: 'Charcoal on heavy paper',
      mediumShort: 'Charcoal',
      year: 2023,
      dimensions: '50 × 70 cm',
      edition: 'Unique work',
      category: 'drawing',
      images: [
        'https://images.unsplash.com/photo-1577720580479-7d839d829c73',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
      ],
      description: 'Charcoal sketch of a twisted ancient olive tree on heavy textured paper. The branches are drawn with a single, unbroken hand — the page wears every hesitation.',
      aspect: 'aspect-[4/5]',
      stats: { likes: 255, views: 5238, reviewCount: 12 },
    },
    {
      id: 'mirage-protocol',
      title: 'Mirage Protocol',
      artist: 'Alex Mercer',
      artistBio: 'Digital surrealist exploring the geometry of dreams.',
      price: 1200,
      medium: 'Digital print on archival paper',
      mediumShort: 'Digital',
      year: 2025,
      dimensions: '60 × 60 cm',
      edition: 'Edition of 12',
      category: 'digital',
      images: [
        'https://images.unsplash.com/photo-1536924940846-227afb31e2a5',
        'https://images.unsplash.com/photo-1502691876148-a84978e59af8',
      ],
      description: 'Vibrant surrealist digital artwork featuring floating geometric shapes in a desert landscape at dusk. Procedural color, printed on archival paper, signed and numbered by the artist.',
      aspect: 'aspect-square',
      stats: { likes: 228, views: 4891, reviewCount: 8 },
    },
    {
      id: 'oxidation-study',
      title: 'Oxidation Study #1',
      artist: 'Marcus Vance',
      artistBio: 'Fine-art photographer working in macro and texture.',
      price: 600,
      medium: 'Archival pigment print',
      mediumShort: 'Photography',
      year: 2024,
      dimensions: '40 × 40 cm',
      edition: 'Edition of 25',
      category: 'photography',
      images: [
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
        'https://images.unsplash.com/photo-1578321272176-b7bbc0679853',
      ],
      description: 'Close-up macro photography of rusted metal, oxidised in salt air over a decade. The print preserves every flake of pigment; framed in raw white oak.',
      aspect: 'aspect-square',
      stats: { likes: 142, views: 3120, reviewCount: 5 },
    },
    {
      id: 'convergence',
      title: 'Convergence',
      artist: 'Elena Rostova',
      artistBio: 'Painter celebrated for her tactile, light-bearing canvases — moving between watercolor and oil with equal patience.',
      price: 1100,
      medium: 'Watercolor on paper',
      mediumShort: 'Watercolor',
      year: 2023,
      dimensions: '40 × 50 cm',
      category: 'painting',
      sold: true,
      images: [
        'https://images.unsplash.com/photo-1578926375605-eaf7559b1458',
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
      ],
      description: 'Two overlapping translucent circles in soft grey and dusty pink — a minimalist watercolor exercise on the language of nearness without contact.',
      aspect: 'aspect-[4/5]',
      stats: { likes: 99, views: 2210, reviewCount: 4 },
    },
    {
      id: 'electric-youth',
      title: 'Electric Youth',
      artist: 'Studio Kilo',
      artistBio: 'A two-person silkscreen studio in Berlin, known for high-contrast palettes and heavy halftone patterns.',
      price: 2500,
      medium: 'Silkscreen on archival paper',
      mediumShort: 'Print',
      year: 2025,
      dimensions: '70 × 100 cm',
      edition: 'Edition of 30',
      category: 'print',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
        'https://images.unsplash.com/photo-1536924940846-227afb31e2a5',
      ],
      description: 'Bold pop-art inspired portrait using bright neon colors and heavy halftone patterns. Hand-pulled across six screens, signed and numbered in the lower margin.',
      aspect: 'aspect-[4/5]',
      stats: { likes: 191, views: 4012, reviewCount: 6 },
    },
    {
      id: 'surface-tension',
      title: 'Surface Tension',
      artist: 'Nora Hale',
      artistBio: 'A fine-art photographer who waits for stillness — long-exposure water and light studies shot in silver gelatin.',
      price: 950,
      medium: 'Silver gelatin print',
      mediumShort: 'Photography',
      year: 2024,
      dimensions: '50 × 50 cm',
      edition: 'Edition of 15',
      category: 'photography',
      images: [
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
      ],
      description: 'Fine-art black and white photography of ripples on dark water reflecting minimal light — a long exposure printed in silver gelatin on baryta paper.',
      aspect: 'aspect-square',
      stats: { likes: 194, views: 4213, reviewCount: 7 },
    },
    {
      id: 'structural-integrity-2',
      title: 'Structural Integrity II',
      artist: 'Lumia Studio',
      artistBio: 'A small Helsinki-based sculpture studio working with brushed bronze, raw concrete and other industrial materials at a domestic scale.',
      price: 1850,
      medium: 'Brushed bronze and concrete',
      mediumShort: 'Sculpture',
      year: 2025,
      dimensions: '40 × 30 × 30 cm',
      category: 'sculpture',
      images: [
        'https://images.unsplash.com/photo-1578321272176-b7bbc0679853',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
      ],
      description: 'Modern geometric sculpture made of brushed bronze and raw concrete — a study of the meeting between industrial weight and gentle proportion.',
      aspect: 'aspect-[3/4]',
      stats: { likes: 121, views: 2840, reviewCount: 4 },
    },
    {
      id: 'north-window',
      title: 'North Window',
      artist: 'Iliana Berg',
      artistBio: 'Painter working from a converted printworks in Stockholm — quiet interiors, soft northern light, oil on linen.',
      price: 3200,
      medium: 'Oil on Canvas',
      mediumShort: 'Oil on Canvas',
      year: 2025,
      dimensions: '80 × 100 cm',
      category: 'painting',
      images: [
        'https://images.unsplash.com/photo-1549289524-06cf8837ace5',
        'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
      ],
      description: 'Soft light through the studio\'s north-facing window — a quiet interior in oil on linen, painted across two winter mornings.',
      aspect: 'aspect-[4/5]',
      stats: { likes: 89, views: 1820, reviewCount: 3 },
    },
  ];

  const WORKSHOPS = [
    {
      id: 'advanced-oil-textures',
      title: 'Advanced Oil Textures',
      instructor: 'Elena Rostova',
      instructorBio: 'Painter celebrated for her tactile, light-bearing canvases. Has taught masterclasses at The Curated Gallery since 2019.',
      category: 'Masterclass',
      level: 'Masterclass',
      mediumTag: 'Painting',
      price: 450,
      capacity: 8,
      spotsLeft: 7,
      duration: '6 hours',
      location: 'The Atelier, 2nd Floor',
      description: 'A six-hour atelier intensive on building luminous impasto surfaces. Working alongside Elena Rostova — a painter celebrated for her tactile, light-bearing canvases — you will explore palette knife technique, glazing rhythms, and the architecture of slow-drying mediums.',
      summary: 'A six-hour intensive on impasto technique and luminous glazing layers, for experienced painters.',
      image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
      images: [
        'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
      ],
      featured: true,
      sessions: [
        { date: '2026-06-14', time: '10:00', label: 'Jun 14', dateLong: 'Saturday, June 14, 2026' },
        { date: '2026-06-28', time: '10:00', label: 'Jun 28', dateLong: 'Saturday, June 28, 2026' },
        { date: '2026-07-12', time: '10:00', label: 'Jul 12', dateLong: 'Saturday, July 12, 2026' },
        { date: '2026-07-26', time: '10:00', label: 'Jul 26', dateLong: 'Saturday, July 26, 2026' },
      ],
      stats: { rating: 4.9, reviewCount: 38, occupancy: 0.94 },
    },
    {
      id: 'form-and-clay',
      title: 'Introduction to Form & Clay',
      instructor: 'Hans Reiter',
      instructorBio: 'Sculptor and ceramicist based in Hamburg. Teaches an unhurried, hands-on approach to material.',
      category: 'Sculpture',
      level: 'Beginner',
      mediumTag: 'Sculpture',
      price: 85,
      capacity: 12,
      spotsLeft: 9,
      duration: '3 hours',
      location: 'Studio B',
      description: 'A relaxed evening introduction to hand-building with clay. No prior experience required.',
      summary: 'Hand-building with clay — relaxed, no experience required.',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261',
      images: [
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968',
      ],
      sessions: [
        { date: '2026-11-05', time: '18:00', label: 'Nov 5', dateLong: 'Thursday, November 5, 2026' },
      ],
      stats: { rating: 4.7, reviewCount: 32, occupancy: 0.85 },
    },
    {
      id: 'generative-art-code',
      title: 'Generative Art & Code',
      instructor: 'Mira Tan',
      instructorBio: 'Generative artist and creative technologist. Works at the seam between sketch and system.',
      category: 'Digital Art',
      level: 'Intermediate',
      mediumTag: 'Digital',
      price: 120,
      capacity: 10,
      spotsLeft: 0,
      duration: '4 hours',
      location: 'Studio C',
      description: 'An afternoon of generative composition using p5.js and procedural color systems.',
      summary: 'p5.js, procedural color, generative composition.',
      image: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8',
      images: [
        'https://images.unsplash.com/photo-1502691876148-a84978e59af8',
        'https://images.unsplash.com/photo-1536924940846-227afb31e2a5',
      ],
      waitlist: true,
      sessions: [
        { date: '2026-11-12', time: '14:00', label: 'Nov 12', dateLong: 'Thursday, November 12, 2026' },
      ],
      stats: { rating: 4.5, reviewCount: 22, occupancy: 1.0 },
    },
    {
      id: 'botanical-watercolors',
      title: 'Botanical Watercolors',
      instructor: 'Aiko Murata',
      instructorBio: 'Watercolorist working in Kyoto. Brings a patient, observational approach to florals.',
      category: 'Painting',
      level: 'Beginner',
      mediumTag: 'Painting',
      price: 95,
      capacity: 8,
      spotsLeft: 5,
      duration: '4 hours',
      location: 'The Atelier',
      description: 'A morning session on watercolor florals — quiet observation and patient layering.',
      summary: 'Watercolor florals — quiet observation, patient layering.',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
        'https://images.unsplash.com/photo-1577720580479-7d839d829c73',
      ],
      sessions: [
        { date: '2026-11-18', time: '10:00', label: 'Nov 18', dateLong: 'Wednesday, November 18, 2026' },
      ],
      stats: { rating: 4.7, reviewCount: 32, occupancy: 0.88 },
    },
    {
      id: 'curatorial-walk',
      title: 'Silence & Space — Curatorial Walk',
      instructor: 'Lina Verge',
      instructorBio: 'Curator of The Curated Gallery since 2014.',
      category: 'Exhibition',
      level: 'All Levels',
      mediumTag: 'Talk',
      price: 0,
      capacity: 20,
      spotsLeft: 12,
      duration: '1 hour',
      location: 'Main Gallery',
      description: 'A curator-led walking conversation through the current exhibition — slow looking, anchored by three central works.',
      summary: 'A curator-led walking conversation through the current exhibition.',
      image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853',
      images: [
        'https://images.unsplash.com/photo-1578321272176-b7bbc0679853',
        'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
      ],
      complimentary: true,
      sessions: [
        { date: '2026-12-01', time: '17:00', label: 'Dec 1', dateLong: 'Tuesday, December 1, 2026' },
      ],
      stats: { rating: 4.8, reviewCount: 18, occupancy: 0.62 },
    },
  ];

  const REVIEWS = {
    'midnight-resonance': [
      { author: 'Cordelia Marsh', date: 'February 2026', rating: 5, body: "Hangs above the hallway console — it changes hour by hour with the light. Crating and delivery were museum-grade.", verified: true, helpful: 24, reply: 'Thank you, Cordelia. We will pass on your kind words to David personally.' },
      { author: 'Anders Holm', date: 'January 2026', rating: 4, body: "Quiet and patient work. My one wish: a longer condition report — though staff were attentive over email when I asked.", verified: true, helpful: 9, reply: 'Noted — we have introduced extended condition reports for collectors as of March.' },
    ],
    'advanced-oil-textures': [
      { author: 'Margaux Hensley', date: 'Attended · March 2026', rating: 5, body: "Elena's eye for layered light changed how I prepare a canvas. The pacing was unhurried and the atelier itself feels like a quiet cathedral.", verified: true, helpful: 31, reply: 'Thank you, Margaux — Elena is preparing a follow-up on cold-wax mediums this autumn. We will save a seat for you.' },
      { author: 'Iliana Berg', date: 'Attended · February 2026', rating: 4, body: "A generous teacher. I left with three studies and a much steadier hand — the only note: I wished the day were two hours longer.", verified: true, helpful: 18, reply: 'Heard, with thanks. Our upcoming weekend intensive runs across two days — invitations go out to past attendees first.' },
      { author: 'Daniel Okafor', date: 'Attended · January 2026', rating: 5, body: "The materials provided were exceptional — Williamsburg oils, fine-weave linen. You feel the gallery\'s standards in every detail.", verified: true, helpful: 14, reply: 'Thank you, Daniel. We source linen from a small atelier in Belgium — we are glad it carried through.' },
      { author: 'Sébastien Roux', date: 'Attended · December 2025', rating: 5, body: "A patient, exact masterclass. Elena\'s demonstration of glazing rhythms alone was worth the journey from Lyon.", verified: true, helpful: 11, reply: 'Until next time, Sébastien — we are reserving the corner easel by the north window for your return.' },
    ],
  };

  const ORDERS = [
    {
      id: 'TCG-2026-0419',
      date: '2026-05-17',
      status: 'Preparing',
      items: [
        { type: 'artwork', refId: 'midnight-resonance', title: 'Midnight Resonance', artist: 'David K. Chen', qty: 1, price: 4200 },
        { type: 'workshop', refId: 'advanced-oil-textures', title: 'Advanced Oil Textures Masterclass', artist: 'Reservation · Jun 14, 2026 · 2 participants', qty: 1, price: 900 },
      ],
      subtotal: 5100, shipping: 120, discount: 0, tax: 918, total: 6138,
    },
    {
      id: 'TCG-2026-0312',
      date: '2026-03-22',
      status: 'Delivered',
      items: [{ type: 'artwork', refId: 'mirage-protocol', title: 'Mirage Protocol', artist: 'Alex Mercer', qty: 1, price: 1200 }],
      subtotal: 1200, shipping: 0, discount: 0, tax: 216, total: 1416,
    },
    {
      id: 'TCG-2025-1108',
      date: '2025-11-14',
      status: 'Delivered',
      items: [
        { type: 'artwork', refId: 'roots-of-antiquity', title: 'Roots of Antiquity', artist: 'Sophia Lin', qty: 1, price: 850 },
        { type: 'artwork', refId: 'oxidation-study', title: 'Oxidation Study #1', artist: 'Marcus Vance', qty: 1, price: 600 },
        { type: 'workshop', refId: 'botanical-watercolors', title: 'Botanical Watercolors', artist: 'Reservation · Nov 18, 2025', qty: 1, price: 95 },
      ],
      subtotal: 1545, shipping: 120, discount: 154, tax: 272, total: 1783,
    },
  ];

  const SUPPORT_TICKETS = [
    { id: 3812, subject: 'Condition report for Midnight Resonance', date: 'Today', status: 'Open' },
    { id: 3754, subject: 'Workshop rescheduling — Jun 14', date: 'Mar 30, 2026', status: 'Resolved' },
    { id: 3621, subject: 'Authentication certificate request', date: 'Mar 14, 2026', status: 'Resolved' },
  ];

  const COUPONS = { CURATED10: 10, FIRSTBRUSH: 15, ATELIER20: 20 };

  /* ---- Helper lookups ---------------------------------------- */
  function getArtwork(id) { return ARTWORKS.find(a => a.id === id) || ARTWORKS[0]; }
  function getWorkshop(id) { return WORKSHOPS.find(w => w.id === id) || WORKSHOPS[0]; }
  function getReviews(targetId) { return REVIEWS[targetId] || []; }
  function getOrder(id) { return ORDERS.find(o => o.id === id) || ORDERS[0]; }

  /* ---- API layer (backend-ready) ----------------------------
     Şu an in-memory. Backend bağlandığında her fonksiyonun gövdesi
     `fetch(...)` çağrısına çevrilir — sayfa JS'leri değişmez.
     -------------------------------------------------------------- */
  function delay(ms) { return new Promise(r => setTimeout(r, ms || 0)); }

  const api = {
    // Artworks
    async listArtworks(params) {
      // TODO(backend): return fetch('/api/artworks?' + qs).then(r => r.json());
      await delay(0);
      let arr = ARTWORKS.slice();
      if (params?.category) arr = arr.filter(a => a.category === params.category);
      if (params?.q) {
        const q = params.q.toLowerCase();
        arr = arr.filter(a =>
          a.title.toLowerCase().includes(q) ||
          a.artist.toLowerCase().includes(q) ||
          (a.mediumShort || '').toLowerCase().includes(q));
      }
      return arr;
    },
    async getArtwork(id) {
      // TODO(backend): return fetch(`/api/artworks/${id}`).then(r => r.json());
      await delay(0);
      return ARTWORKS.find(a => a.id === id) || null;
    },

    // Workshops
    async listWorkshops(params) {
      // TODO(backend): return fetch('/api/workshops?' + qs).then(r => r.json());
      await delay(0);
      let arr = WORKSHOPS.slice();
      if (params?.medium && params.medium !== 'all') {
        arr = arr.filter(w => (w.mediumTag || '').toLowerCase() === params.medium);
      }
      if (params?.level && params.level !== 'all') {
        arr = arr.filter(w => (w.level || '').toLowerCase() === params.level);
      }
      if (params?.dateRange && params.dateRange !== 'all') {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        arr = arr.filter(w => (w.sessions || []).some(s => {
          const d = new Date(s.date);
          if (params.dateRange === 'thismonth') {
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }
          if (params.dateRange === 'nextmonth') {
            const next = new Date(thisYear, thisMonth + 1, 1);
            return d.getMonth() === next.getMonth() && d.getFullYear() === next.getFullYear();
          }
          return true;
        }));
      }
      return arr;
    },
    async getWorkshop(id) {
      // TODO(backend): return fetch(`/api/workshops/${id}`).then(r => r.json());
      await delay(0);
      return WORKSHOPS.find(w => w.id === id) || null;
    },

    // Reservation (write op)
    async createReservation(payload) {
      // TODO(backend): return fetch('/api/reservations', { method: 'POST', body: JSON.stringify(payload) })
      await delay(0);
      const w = WORKSHOPS.find(x => x.id === payload.workshopId);
      if (!w) return { ok: false, error: 'workshop_not_found' };

      // Validate session date is in the future
      if (payload.sessionDate) {
        const sessionDay = new Date(payload.sessionDate);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (sessionDay < today) return { ok: false, error: 'session_past' };
      }

      const participants = payload.participants || 1;
      if (!w.complimentary && w.spotsLeft < participants) return { ok: false, error: 'no_capacity' };
      if (!w.complimentary) w.spotsLeft -= participants;
      return { ok: true, reservationId: 'R' + Date.now() };
    },

    async listReservations() {
      // TODO(backend): return fetch('/api/reservations').then(r => r.json());
      await delay(0);
      return window.Store.Reservations.list();
    },

    async updateReservation(reservationId, patch) {
      // TODO(backend): return fetch(`/api/reservations/${reservationId}`, { method: 'PATCH', body: JSON.stringify(patch) })
      await delay(0);
      const reservation = window.Store.Reservations.list().find(r => r.id === reservationId);
      if (!reservation) return { ok: false, error: 'not_found' };

      const workshop = WORKSHOPS.find(w => w.id === reservation.workshopId);
      if (!workshop) return { ok: false, error: 'workshop_not_found' };

      // 48-hour cancellation/edit window (only enforced if we have ISO date)
      if (reservation.sessionDate) {
        const sessionStart = new Date(reservation.sessionDate);
        const hoursUntil = (sessionStart - new Date()) / 36e5;
        const limitHours = (global.GALLERY && global.GALLERY.SITE && global.GALLERY.SITE.cancellationWindowHours) || 48;
        if (hoursUntil < limitHours) return { ok: false, error: 'window_closed' };
      }

      const apply = {};

      // ---- Date update ---------------------------------------
      if (patch.sessionDate) {
        const newSession = (workshop.sessions || []).find(s => s.date === patch.sessionDate);
        if (!newSession) return { ok: false, error: 'session_not_found' };
        const newDay = new Date(newSession.date); newDay.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (newDay < today) return { ok: false, error: 'session_past' };
        apply.sessionDate  = newSession.date;
        apply.sessionLabel = newSession.dateLong;
        apply.sessionTime  = newSession.time;
        // Same workshop: spotsLeft unchanged because seats just shift sessions
      }

      // ---- Participants update -------------------------------
      if (patch.participants != null) {
        const delta = Number(patch.participants) - reservation.participants;
        if (!workshop.complimentary) {
          if (delta > 0 && workshop.spotsLeft < delta) return { ok: false, error: 'no_capacity' };
          workshop.spotsLeft -= delta;
        }
        apply.participants = Number(patch.participants);
        // Recompute total
        const unit = workshop.price || 0;
        apply.total = unit * apply.participants - Math.round(unit * apply.participants * (reservation.discountPct || 0) / 100);
      }

      window.Store.Reservations.update(reservationId, apply);
      return { ok: true, reservation: window.Store.Reservations.list().find(r => r.id === reservationId) };
    },

    async cancelReservation(reservationId) {
      // TODO(backend): return fetch(`/api/reservations/${reservationId}`, { method: 'DELETE' })
      await delay(0);
      const reservation = window.Store.Reservations.list().find(r => r.id === reservationId);
      if (!reservation) return { ok: false, error: 'not_found' };

      if (reservation.sessionDate) {
        const sessionStart = new Date(reservation.sessionDate);
        const hoursUntil = (sessionStart - new Date()) / 36e5;
        const limitHours = (global.GALLERY && global.GALLERY.SITE && global.GALLERY.SITE.cancellationWindowHours) || 48;
        if (hoursUntil < limitHours) return { ok: false, error: 'window_closed' };
      }

      const workshop = WORKSHOPS.find(w => w.id === reservation.workshopId);
      if (workshop && !workshop.complimentary) {
        workshop.spotsLeft += (reservation.participants || 1);
      }

      global.Store.Reservations.cancel(reservationId);
      return { ok: true, refund: reservation.total || 0 };
    },

    async joinWaitlist(payload) {
      // TODO(backend): return fetch('/api/waitlist', { method: 'POST', body: JSON.stringify(payload) })
      await delay(0);
      const w = WORKSHOPS.find(x => x.id === payload.workshopId);
      if (!w) return { ok: false, error: 'workshop_not_found' };
      if (window.Store.Waitlist.has(payload.workshopId, payload.email)) {
        return { ok: false, error: 'already_on_waitlist' };
      }
      const entry = window.Store.Waitlist.add(payload);
      return { ok: true, waitlistId: entry.id };
    },

    // Reviews
    async listReviews(targetId) {
      // TODO(backend): return fetch(`/api/reviews?target=${targetId}`).then(r => r.json());
      await delay(0);
      return REVIEWS[targetId] || [];
    },
    async createReview(targetId, payload) {
      // TODO(backend): return fetch(`/api/reviews/${targetId}`, { method: 'POST', body: ... })
      await delay(0);
      if (!REVIEWS[targetId]) REVIEWS[targetId] = [];
      const review = Object.assign(
        { date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), helpful: 0, verified: false },
        payload
      );
      REVIEWS[targetId].unshift(review);
      return { ok: true, review };
    },

    // ---- Orders ------------------------------------------------
    async listOrders() {
      // TODO(backend): return fetch('/api/orders').then(r => r.json());
      await delay(0);
      // Merge user-placed orders with curated demo dataset
      const live = global.Store.Orders.list();
      return live.concat(ORDERS);
    },
    async getOrder(id) {
      // TODO(backend): return fetch(`/api/orders/${id}`).then(r => r.json());
      await delay(0);
      return global.Store.Orders.find(id) || ORDERS.find(o => o.id === id) || null;
    },
    async createOrder(order) {
      // TODO(backend): return fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) })
      await delay(0);
      const placed = Object.assign({
        id: 'TCG-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().split('T')[0],
        status: 'Preparing',
      }, order);
      global.Store.Orders.add(placed);
      return { ok: true, order: placed };
    },

    // ---- Auth --------------------------------------------------
    async register(profile) {
      // TODO(backend): POST /api/auth/register
      await delay(0);
      const email = (profile.email || '').toLowerCase();
      if (!email || !profile.password) return { ok: false, error: 'missing_fields' };
      if (global.Store.Users.find(email)) return { ok: false, error: 'email_taken' };
      const user = global.Store.Users.add(profile);
      global.Store.User.set({ name: user.name, email: user.email, phone: user.phone, address: user.address });
      return { ok: true, user: { name: user.name, email: user.email } };
    },
    async login(credentials) {
      // TODO(backend): POST /api/auth/login
      await delay(0);
      const email = (credentials.email || '').toLowerCase();
      const user = global.Store.Users.find(email);
      if (!user) return { ok: false, error: 'not_found' };
      if (user.password !== credentials.password) return { ok: false, error: 'wrong_password' };
      const session = { name: user.name, email: user.email, phone: user.phone, address: user.address };
      global.Store.User.set(session);
      return { ok: true, user: session };
    },
    async logout() {
      // TODO(backend): POST /api/auth/logout
      await delay(0);
      global.Store.User.clear();
      return { ok: true };
    },
    async updateProfile(patch) {
      // TODO(backend): PATCH /api/account/profile
      await delay(0);
      const session = global.Store.User.get();
      if (!session) return { ok: false, error: 'not_authed' };
      const next = Object.assign({}, session, patch);
      global.Store.User.set(next);
      global.Store.Users.update(session.email, patch);
      return { ok: true, user: next };
    },
    async changePassword(currentPw, newPw) {
      // TODO(backend): POST /api/account/change-password
      await delay(0);
      const session = global.Store.User.get();
      if (!session) return { ok: false, error: 'not_authed' };
      const user = global.Store.Users.find(session.email);
      if (!user) return { ok: false, error: 'not_found' };
      if (user.password !== currentPw) return { ok: false, error: 'wrong_password' };
      if (!newPw || newPw.length < 8) return { ok: false, error: 'weak_password' };
      global.Store.Users.update(session.email, { password: newPw });
      return { ok: true };
    },

    // Favorites — şu an Store.Favorites localStorage'a yazıyor. Backend geldiğinde
    // bu metotların gövdesi fetch çağrılarına çevrilir; sayfa kodu dokunulmaz.
    favorites: {
      async list() {
        // TODO(backend): return fetch('/api/favorites').then(r => r.json());
        await delay(0);
        return window.Store.Favorites.list();
      },
      async has(id) {
        // TODO(backend): return fetch(`/api/favorites/${id}`).then(r => r.json()).then(j => j.exists);
        await delay(0);
        return window.Store.Favorites.has(id);
      },
      async add(id) {
        // TODO(backend): return fetch('/api/favorites', { method: 'POST', body: JSON.stringify({id}) })
        await delay(0);
        const added = window.Store.Favorites.add(id);
        return { ok: true, added };
      },
      async remove(id) {
        // TODO(backend): return fetch(`/api/favorites/${id}`, { method: 'DELETE' })
        await delay(0);
        const removed = window.Store.Favorites.remove(id);
        return { ok: true, removed };
      },
      async toggle(id) {
        // TODO(backend): single endpoint that returns new state
        await delay(0);
        const nowOn = window.Store.Favorites.toggle(id);
        return { ok: true, on: nowOn };
      },
    },

    // Coupons
    async validateCoupon(code) {
      // TODO(backend): return fetch(`/api/coupons/${code}`).then(r => r.json());
      await delay(0);
      const pct = COUPONS[code.toUpperCase()];
      return pct ? { ok: true, code: code.toUpperCase(), pct } : { ok: false };
    },
  };

  global.GALLERY = Object.assign(global.GALLERY || {}, {
    ARTWORKS, WORKSHOPS, REVIEWS, ORDERS, SUPPORT_TICKETS, COUPONS,
    getArtwork, getWorkshop, getReviews, getOrder,
    api,
  });
})(window);
