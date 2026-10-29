(() => {
  'use strict';
  const header = document.querySelector('.header');
  const contact = header?.querySelector('.header-contact');
  if (!contact) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let point = null;
  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; point = null;
    contact.style.removeProperty('--magnet-x');
    contact.style.removeProperty('--magnet-y');
  };
  function paint() {
    frame = 0;
    if (!point || !fine.matches || reduce.matches || document.hidden || contact.matches(':focus-visible') || getSelection()?.type === 'Range') {
      reset(); return;
    }
    // The anchor stays still. Only its visible inner surface moves, by at most 5px.
    const rect = contact.getBoundingClientRect();
    const dx = point.x - (rect.left + rect.width / 2);
    const dy = point.y - (rect.top + rect.height / 2);
    const outside = Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2));
    const strength = Math.max(0, 1 - outside / 64);
    contact.style.setProperty('--magnet-x', `${(Math.tanh(dx / 45) * 5 * strength).toFixed(2)}px`);
    contact.style.setProperty('--magnet-y', `${(Math.tanh(dy / 35) * 4 * strength).toFixed(2)}px`);
  }
  header.addEventListener('pointermove', event => {
    if (!fine.matches || reduce.matches || event.pointerType === 'touch') return;
    point = {x: event.clientX, y: event.clientY};
    if (!frame) frame = requestAnimationFrame(paint);
  }, {passive: true});
  header.addEventListener('pointerleave', reset);
  header.addEventListener('pointercancel', reset);
  contact.addEventListener('focus', reset);
  contact.addEventListener('click', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('scroll', reset, {passive: true});
  document.addEventListener('visibilitychange', reset);
  fine.addEventListener('change', reset);
  reduce.addEventListener('change', reset);
})();
