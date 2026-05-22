/* SiteCare — vanilla JS interactions */

const BOT_TELEGRAM_LINK = 'https://t.me/sitecare_neshcol_bot';

/* --------------------------------------------------
   HEADER scroll state
   -------------------------------------------------- */
const header = document.getElementById('site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* --------------------------------------------------
   MOBILE NAV
   -------------------------------------------------- */
const burger = document.querySelector('.nav-burger');
const mobileNav = document.getElementById('nav-mobile');

burger?.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  mobileNav.setAttribute('aria-hidden', !open);
});

mobileNav?.querySelectorAll('a').forEach(link =>
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  })
);

/* --------------------------------------------------
   SMOOTH SCROLL
   -------------------------------------------------- */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  const top = target.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
});

/* --------------------------------------------------
   MODAL
   -------------------------------------------------- */
const modalOverlay = document.getElementById('modal-contact');
let lastFocused = null;

function openModal(plan = '') {
  lastFocused = document.activeElement;
  modalOverlay.classList.add('is-open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (plan) {
    document.getElementById('modal-plan').value = plan;
  }
  setTimeout(() => modalOverlay.querySelector('input, textarea, button:not(.modal-close)')?.focus(), 80);
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocused?.focus();
}

document.querySelectorAll('[data-modal="contact"]').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.plan || ''));
});

document.querySelector('.modal-close')?.addEventListener('click', closeModal);

modalOverlay?.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
});

/* --------------------------------------------------
   FORM SUBMIT — modal
   -------------------------------------------------- */
const modalForm = document.getElementById('modal-form');
const modalSuccess = document.getElementById('modal-success');

modalForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(modalForm));

  if (!data.site_url || !data.task || !data.contact) {
    showFormError(modalForm, 'Пожалуйста, заполните все поля.');
    return;
  }

  const submitBtn = modalForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправляем…';

  try {
    await sendToTelegram(data);
  } finally {
    modalForm.style.display = 'none';
    modalSuccess.hidden = false;
  }
});

/* --------------------------------------------------
   FORM SUBMIT — CTA
   -------------------------------------------------- */
const ctaForm = document.getElementById('cta-form');
const ctaSuccess = document.getElementById('cta-success');

ctaForm?.addEventListener('submit', e => {
  e.preventDefault();
  const url = ctaForm.querySelector('#cta-url')?.value?.trim();
  if (!url) return;

  const telegramUrl = `${BOT_TELEGRAM_LINK}?start=lead_${encodeURIComponent(url)}`;
  window.open(telegramUrl, '_blank', 'noopener');

  ctaForm.style.display = 'none';
  ctaSuccess.hidden = false;
});

/* --------------------------------------------------
   SEND TO TELEGRAM
   Opens bot link with encoded lead data.
   Replace with real webhook POST when bot is hosted.
   -------------------------------------------------- */
async function sendToTelegram(data) {
  const params = new URLSearchParams({
    site: data.site_url || '',
    contact: data.contact || '',
    plan: data.plan || '',
  });
  const startParam = btoa(params.toString()).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' })[c]);
  const url = `${BOT_TELEGRAM_LINK}?start=${startParam.slice(0, 60)}`;
  window.open(url, '_blank', 'noopener');
}

/* --------------------------------------------------
   REVEAL ON SCROLL
   -------------------------------------------------- */
const revealObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* --------------------------------------------------
   HELPERS
   -------------------------------------------------- */
function showFormError(form, msg) {
  let err = form.querySelector('.form-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error';
    err.style.cssText = 'color:#ff6b6b;font-size:13px;margin-top:-8px;';
    form.prepend(err);
  }
  err.textContent = msg;
}
