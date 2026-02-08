// Goal Muse landing — mobile menu, header scroll, download modal
const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-btn');
const navMobile = document.querySelector('.nav-mobile');
const modal = document.getElementById('download-modal');
const openModalTriggers = document.querySelectorAll('.js-open-download-modal');
const closeModalTriggers = document.querySelectorAll('[data-close-modal]');

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

function openDownloadModal() {
  modal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  (modal?.querySelector('.modal-close') as HTMLElement)?.focus();
}

function closeDownloadModal() {
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function handleModalKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  if (modal?.getAttribute('aria-hidden') === 'false') {
    closeDownloadModal();
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

menuBtn?.addEventListener('click', toggleMenu);

navMobile?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

openModalTriggers.forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    openDownloadModal();
  });
});

closeModalTriggers.forEach((el) => {
  el.addEventListener('click', closeDownloadModal);
});

document.addEventListener('keydown', handleModalKeydown);

window.addEventListener('resize', () => {
  if (window.matchMedia('(min-width: 768px)').matches) {
    closeMenu();
  }
});
