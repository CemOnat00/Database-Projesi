/* ============================================================
   Tailwind CDN config — extend with site design tokens so we can
   use class names like `bg-brand`, `text-ink`, `font-display`.
   Must run BEFORE the Tailwind CDN script tag in each page.
   ============================================================ */

window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        bg:          '#f9f8f6',
        'bg-soft':   '#f4f3f0',
        'bg-image':  '#efeae3',
        surface:     '#ffffff',
        ink: {
          DEFAULT:  '#1a1a1a',
          strong:   '#2a1b15',
          muted:    '#5a4a42',
          faint:    '#bdb3a7',
        },
        brand:       '#3a1a0f',
        'brand-hover': '#4a2418',
        accent:      '#944925',
        line:        '#e5e1db',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'lux':        '0.28em',
        'lux-medium': '0.18em',
      },
      borderRadius: {
        DEFAULT: '0',
        sm: '2px',
        lg: '6px',
        full: '9999px',
      },
      maxWidth: {
        '7xl': '80rem',
      },
    },
  },
};

/* Build constants used across pages */
window.GALLERY = window.GALLERY || {};
window.GALLERY.SITE = {
  name: 'The Curated Gallery',
  copyrightYear: 2026,
  currency: 'USD',
  taxRate: 0.18,
  shippingFee: 120,
  cancellationWindowHours: 48,
};
