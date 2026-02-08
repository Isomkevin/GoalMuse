// Goal Muse landing — mobile menu & header scroll
const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-btn');
const navMobile = document.querySelector('.nav-mobile');

function onScroll() {
  if (window.scrollY > 20) {
    header?.classList.add('scrolled');
  } else {
    header?.classList.remove('scrolled');
  }
}

function toggleMenu() {
  const expanded = menuBtn?.getAttribute('aria-expanded') === 'true';
  menuBtn?.setAttribute('aria-expanded', String(!expanded));
  navMobile?.classList.toggle('open', !expanded);
  document.body.style.overflow = expanded ? '' : 'hidden';
}

function closeMenu() {
  menuBtn?.setAttribute('aria-expanded', 'false');
  navMobile?.classList.remove('open');
  document.body.style.overflow = '';
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

menuBtn?.addEventListener('click', toggleMenu);

navMobile?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
  if (window.matchMedia('(min-width: 768px)').matches) {
    closeMenu();
  }
});
