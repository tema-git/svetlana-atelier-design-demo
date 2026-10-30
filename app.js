(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const refresh = () => window.ScrollTrigger?.refresh();
  const header = document.querySelector('.header');
  const setHeaderHeight = () => document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  setHeaderHeight();
  if (window.ResizeObserver) new ResizeObserver(setHeaderHeight).observe(header);
  else window.addEventListener('resize', setHeaderHeight, {passive: true});

  // All personal fields remain in the page's temporary form state only.
  const form = document.querySelector('#appointment-form');
  const name = form.elements.name;
  const phone = form.elements.phone;
  const success = document.querySelector('#appointment-success');
  form.noValidate = true;
  const ideaPanel = document.querySelector('#appointment-idea');
  document.addEventListener('atelier:idea', event => {
    if (typeof event.detail !== 'string') return;
    ideaPanel.textContent = `Ваша идея: ${event.detail}`;
    ideaPanel.hidden = false;
    success.hidden = true; form.hidden = false;
    name.setCustomValidity(''); phone.setCustomValidity('');
    document.querySelector('#appointment').scrollIntoView({block: 'start', behavior: reduce.matches ? 'instant' : 'smooth'});
    name.focus({preventScroll: true});
  });
  document.addEventListener('atelier:clear-idea', () => {
    ideaPanel.textContent = ''; ideaPanel.hidden = true;
  });
  const validateName = () => name.setCustomValidity(name.value.trim().length >= 2 ? '' : 'Введите имя: не менее двух символов.');
  const validatePhone = () => {
    const value = phone.value.trim();
    const digits = value.replace(/\D/g, '');
    const valid = /^\+?[\d\s()\-]+$/.test(value) && digits.length >= 10 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
    phone.setCustomValidity(valid ? '' : 'Введите корректный телефон: от 10 до 15 цифр, можно с +, пробелами и скобками.');
  };
  name.addEventListener('input', validateName);
  phone.addEventListener('input', validatePhone);
  form.addEventListener('submit', event => {
    event.preventDefault();
    validateName(); validatePhone();
    if (!form.reportValidity()) return;
    const callback = form.elements.request.value === 'callback';
    document.querySelector('#appointment-success-copy').textContent = callback
      ? 'Вы выбрали обратный звонок. Это демонстрация: заявка никуда не отправлена.'
      : 'Вы выбрали запись в ателье. Это демонстрация: реальная запись не создана.';
    form.reset(); name.setCustomValidity(''); phone.setCustomValidity('');
    form.hidden = true; success.hidden = false;
    success.focus({preventScroll: true});
    success.scrollIntoView({block: 'nearest', behavior: 'instant'});
  });
  form.querySelector('[type="submit"]').disabled = false;
  document.querySelector('#appointment-reset').addEventListener('click', () => {
    success.hidden = true; form.hidden = false; form.reset();
    name.setCustomValidity(''); phone.setCustomValidity('');
    name.focus({preventScroll: true});
    name.scrollIntoView({block: 'nearest', behavior: 'instant'});
  });

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) nav.querySelector('a').focus();
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.querySelector('.header-contact').addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu(); toggle.focus();
    }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);

  const dialog = document.querySelector('#demo-dialog');
  document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  // A single finite animation loop moves decorative layers, never the controls.
  const surfaces = [...document.querySelectorAll('[data-pointer-surface], .hero-game, .atelier-motion, .contact, .footer')];
  const states = surfaces.map(el => ({el, x: 0, y: 0, tx: 0, ty: 0, visible: false, rect: null}));
  const stateByElement = new Map(states.map(state => [state.el, state]));
  let frame = 0, lastTime = 0;
  const allowed = () => finePointer.matches && !reduce.matches && !document.hidden;
  const approachThread = document.querySelector('.approach-thread path');
  const contactThread = document.querySelector('.contact-thread path');
  const contactNeedle = document.querySelector('.contact-thread circle');
  function paint(state) {
    const {el, x, y} = state;
    el.style.setProperty('--pointer-x', `${(x + 1) * 50}%`);
    el.style.setProperty('--pointer-y', `${(y + 1) * 50}%`);
    el.style.setProperty('--shift-x', `${(x * 10).toFixed(2)}px`);
    el.style.setProperty('--shift-y', `${(y * 8).toFixed(2)}px`);
    el.style.setProperty('--tilt', `${(x * 2).toFixed(2)}deg`);
    if (el.id === 'hero-color-game') {
      el.style.setProperty('--hg-pointer-x', `${(x * 7).toFixed(2)}px`);
      el.style.setProperty('--hg-pointer-y', `${(y * 5).toFixed(2)}px`);
    }
    if (el.id === 'approach' && approachThread) {
      approachThread.setAttribute('d', `M0 62 C${180 + x * 85} ${62 + y * 20} ${190 + x * 65} ${10 - y * 14} ${350 + x * 40} ${20 + y * 14} S${540 - x * 80} ${90 - y * 20} 700 42 S925 8 1100 30`);
    }
    if (el.id === 'contact' && contactThread) {
      const cx = 230 + x * 85, cy = 65 + y * 32;
      contactThread.setAttribute('d', `M0 120 C100 120 ${125 + x * 70} ${15 - y * 25} ${cx} ${cy} S${360 - x * 70} ${160 - y * 30} 500 35`);
      contactNeedle.setAttribute('cx', cx); contactNeedle.setAttribute('cy', cy);
    }
  }
  function tick(time) {
    frame = 0;
    if (!allowed()) { reset(); return; }
    const delta = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
    lastTime = time;
    const blend = 1 - Math.pow(.80, delta);
    let unsettled = false;
    states.forEach(state => {
      if (!state.visible) return;
      state.x += (state.tx - state.x) * blend;
      state.y += (state.ty - state.y) * blend;
      if (Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) > .002) unsettled = true;
      else { state.x = state.tx; state.y = state.ty; }
      paint(state);
    });
    if (unsettled) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }
  function schedule() { if (!frame && allowed()) frame = requestAnimationFrame(tick); }
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0;
    states.forEach(state => {
      state.x = state.y = state.tx = state.ty = 0;
      state.el.classList.remove('has-pointer');
      paint(state);
    });
  }
  const observer = window.IntersectionObserver ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = stateByElement.get(entry.target);
      state.visible = entry.isIntersecting;
      if (!state.visible) { state.x = state.y = state.tx = state.ty = 0; state.el.classList.remove('has-pointer'); paint(state); }
    });
  }, {rootMargin: '60px'}) : null;
  states.forEach(state => {
    if (observer) observer.observe(state.el); else state.visible = true;
    const move = event => {
      if (!allowed() || !state.visible || event.pointerType === 'touch') return;
      state.rect ||= state.el.getBoundingClientRect();
      state.tx = Math.max(-1, Math.min(1, (event.clientX - state.rect.left) / state.rect.width * 2 - 1));
      state.ty = Math.max(-1, Math.min(1, (event.clientY - state.rect.top) / state.rect.height * 2 - 1));
      schedule();
    };
    state.el.addEventListener('pointerenter', event => { state.rect = state.el.getBoundingClientRect(); if (allowed()) state.el.classList.add('has-pointer'); move(event); });
    state.el.addEventListener('pointermove', move, {passive: true});
    state.el.addEventListener('pointerleave', () => { state.el.classList.remove('has-pointer'); state.tx = state.ty = 0; schedule(); });
    state.el.addEventListener('pointercancel', reset);
  });
  window.addEventListener('scroll', () => states.forEach(state => { state.rect = null; }), {passive: true});
  window.addEventListener('resize', () => { states.forEach(state => { state.rect = null; }); reset(); }, {passive: true});
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', reset);
  reduce.addEventListener('change', reset); finePointer.addEventListener('change', reset);
  reset();

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const thread = document.querySelector('.approach-thread path');
      const length = thread.getTotalLength();
      gsap.fromTo(thread, {strokeDasharray: length, strokeDashoffset: length}, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: {trigger: '#approach', start: 'top 85%', end: 'center 45%', scrub: .35}
      });
    });
    if (document.fonts) document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh, {once: true});
  }
})();
