let currentLenis = null;

export function setLenisInstance(lenis) {
  currentLenis = lenis;
}

export function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  if (currentLenis) currentLenis.scrollTo(target, { offset: -16 });
  else target.scrollIntoView({ behavior: 'smooth' });
}
