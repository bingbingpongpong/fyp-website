// public/js/promo.js
// POTENTIALLY VULNERABLE (for lab demonstration)
// DOM-based XSS via unsanitized innerHTML usage.

document.addEventListener('DOMContentLoaded', () => {
  const applyBtn = document.getElementById('applyCodeBtn');
  const input = document.getElementById('promoCode');
  const message = document.getElementById('promoMessage');

  if (!applyBtn || !input || !message) return;

  applyBtn.addEventListener('click', () => {
    const code = input.value;

    // Developer assumed promo codes are plain text
    // POTENTIALLY VULNERABLE: no HTML escaping here, so scripts/HTML will be interpreted.
    message.innerHTML = 'Applied: ' + code;

    // TODO: Escape or sanitize HTML before rendering user-controlled input.
  });
});


