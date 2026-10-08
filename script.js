/* ISNTTHATMOMO — internal training page. No dependencies. */

document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll progress ---------- */
const scrollBar = document.getElementById('scrollProgressBar');
function onScroll() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + '%';
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Reveal on scroll (content never waits on this) ---------- */
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  revealEls.forEach(el => io.observe(el));
  // Safety net: if anything is still hidden after a few seconds, show it.
  setTimeout(() => revealEls.forEach(el => el.classList.add('is-revealed')), 4000);
} else {
  revealEls.forEach(el => el.classList.add('is-revealed'));
}

/* ---------- Active section in the sticky nav ---------- */
const navScroll = document.getElementById('secnavScroll');
const navLinks = [...navScroll.querySelectorAll('a')];
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

function setActive(id) {
  navLinks.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    if (on) {
      // Keep the active chip visible inside the nav strip without moving the page.
      const left = a.offsetLeft - 16;
      const right = a.offsetLeft + a.offsetWidth + 16;
      if (left < navScroll.scrollLeft) navScroll.scrollTo({ left, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      else if (right > navScroll.scrollLeft + navScroll.clientWidth) navScroll.scrollTo({ left: right - navScroll.clientWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });
}

function updateActive() {
  const topbarH = document.getElementById('topbar').offsetHeight;
  const line = topbarH + 80;
  let current = null;
  sections.forEach(s => { if (s.getBoundingClientRect().top <= line) current = s.id; });
  if (current) setActive(current); else navLinks.forEach(a => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
}
updateActive();
window.addEventListener('scroll', updateActive, { passive: true });
window.addEventListener('resize', updateActive);

/* ---------- Copy to clipboard ---------- */
const statusEl = document.getElementById('copyStatus');

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { /* fall through to legacy path */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

document.querySelectorAll('[data-copy], [data-copy-from]').forEach(btn => {
  const idleLabel = btn.dataset.label || btn.textContent.trim();
  let timer;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy
      ?? document.querySelector(btn.dataset.copyFrom)?.textContent.trim()
      ?? '';
    const ok = await copyText(text);
    clearTimeout(timer);
    btn.classList.toggle('is-copied', ok);
    btn.textContent = ok ? 'Copied ✓' : 'Press Ctrl+C to copy';
    statusEl.textContent = ok ? 'Copied to clipboard' : 'Copy failed — select the text and copy it manually';
    if (!ok) {
      const target = btn.dataset.copyFrom && document.querySelector(btn.dataset.copyFrom);
      if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
    timer = setTimeout(() => { btn.classList.remove('is-copied'); btn.textContent = idleLabel; statusEl.textContent = ''; }, 2000);
  });
});
