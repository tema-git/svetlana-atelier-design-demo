(() => {
  'use strict';
  const scene = document.querySelector('#atelier-motion');
  if (!scene || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const rail = scene.querySelector('.am-rail');
  const sticky = scene.querySelector('.am-sticky');
  const svg = scene.querySelector('.am-svg');
  const header = document.querySelector('.header');
  const parts = [...scene.querySelectorAll('.am-part')];
  const seams = [...scene.querySelectorAll('.am-seam')];
  const steps = [...scene.querySelectorAll('.am-step')];
  const needle = scene.querySelector('.am-needle');
  const travel = scene.querySelector('.am-travel-thread');
  const progressFill = scene.querySelector('.am-progress-fill');
  const media = gsap.matchMedia();
  const measureHeader = () => {
    const height = Math.ceil(header?.getBoundingClientRect().height || 0);
    if (!height || scene.style.getPropertyValue('--am-header-height') === `${height}px`) return false;
    scene.style.setProperty('--am-header-height', `${height}px`);
    return true;
  };
  measureHeader();
  const headerObserver = window.ResizeObserver && header ? new ResizeObserver(() => {
    if (measureHeader()) ScrollTrigger.refresh();
  }) : null;
  headerObserver?.observe(header);

  media.add('(prefers-reduced-motion: no-preference)', () => {
    // The unenhanced document shows the complete garment. Only enable the
    // longer sticky rail once a matching GSAP context is ready to animate it.
    scene.classList.add('am-enhanced');
    const accent = getComputedStyle(scene).getPropertyValue('--accent').trim() || '#782f45';
    const length = travel.getTotalLength();
    const seamLengths = seams.map(path => path.getTotalLength());
    const states = parts.map(part => ({
      x: Number(part.dataset.amX), y: Number(part.dataset.amY),
      rotation: Number(part.dataset.amRotation)
    }));
    let activeStep = -1;
    const setStep = progress => {
      const index = progress < .35 ? 0 : progress < .74 ? 1 : 2;
      if (index !== activeStep) {
        steps.forEach((step, item) => step.classList.toggle('is-active', item === index));
        activeStep = index;
      }
    };
    const updateNeedle = progress => {
      const position = Math.max(0, Math.min(1, (progress - .42) / .36));
      const point = travel.getPointAtLength(length * position);
      const nearby = travel.getPointAtLength(Math.min(length, length * position + 1));
      const angle = Math.atan2(nearby.y - point.y, nearby.x - point.x) * 180 / Math.PI;
      needle.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
    };

    parts.forEach((part, index) => gsap.set(part, states[index]));
    gsap.set(svg, { attr: { viewBox: '0 -50 1000 750' } });
    gsap.set(scene.querySelectorAll('.am-cloth'), { fill: '#ede4e6', stroke: '#a9828e' });
    gsap.set(scene.querySelectorAll('.am-cloth-texture, .am-detail, .am-fold, .am-finish-details, .am-hanger'), { autoAlpha: 0 });
    gsap.set(scene.querySelector('.am-lining'), { fill: '#f1e6e9' });
    gsap.set(scene.querySelector('.am-ground-shadow'), { opacity: .04, scaleX: .7, transformOrigin: 'center' });
    gsap.set(progressFill, { scaleX: 0 });
    seams.forEach((seam, index) => gsap.set(seam, { strokeDasharray: seamLengths[index], strokeDashoffset: seamLengths[index] }));
    gsap.set(travel, { strokeDasharray: length, strokeDashoffset: length, opacity: 0 });

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: function () { setStep(this.progress()); updateNeedle(this.progress()); },
      scrollTrigger: {
        trigger: rail,
        start: () => `top top+=${parseFloat(getComputedStyle(sticky).top) || 120}`,
        end: () => `+=${Math.max(300, rail.offsetHeight - sticky.offsetHeight)}`,
        scrub: .35,
        invalidateOnRefresh: true
      }
    });
    timeline.to(scene.querySelectorAll('.am-pattern-notes'), { opacity: .15, duration: .22 }, 0);
    timeline.to(parts, { x: 0, y: 0, rotation: 0, duration: .42, stagger: .025, ease: 'power1.inOut' }, .08);
    timeline.to(scene.querySelectorAll('.am-cloth'), { fill: accent, stroke: '#582033', duration: .25 }, .25);
    timeline.to(svg, { attr: { viewBox: '210 50 580 570' }, duration: .4, ease: 'power1.inOut' }, .3);
    timeline.to(scene.querySelector('.am-lining'), { fill: '#dac1ca', duration: .2 }, .35);
    timeline.to(scene.querySelectorAll('.am-fold, .am-cloth-texture'), { autoAlpha: 1, duration: .22 }, .38);
    timeline.to(scene.querySelectorAll('.am-finish-details'), { autoAlpha: 1, duration: .01 }, .43);
    timeline.to(travel, { opacity: .85, strokeDashoffset: 0, duration: .34 }, .42);
    timeline.to(needle, { opacity: 1, duration: .035 }, .42);
    timeline.to(seams, { strokeDashoffset: 0, duration: .32, stagger: .025 }, .44);
    timeline.to(scene.querySelectorAll('.am-detail'), { autoAlpha: 1, duration: .17, stagger: .014 }, .62);
    timeline.to(needle, { opacity: 0, duration: .04 }, .78);
    timeline.to(travel, { opacity: 0, duration: .1 }, .78);
    timeline.to(scene.querySelector('.am-hanger'), { autoAlpha: 1, duration: .15 }, .75);
    timeline.to(scene.querySelector('.am-pattern-notes'), { opacity: 0, duration: .15 }, .76);
    timeline.to(scene.querySelector('.am-assembly'), { y: -12, scale: 1.045, duration: .18 }, .8);
    timeline.to(scene.querySelector('.am-ground-shadow'), { opacity: .18, scaleX: 1.1, duration: .18 }, .8);
    timeline.to(progressFill, { scaleX: 1, duration: 1 }, 0);
    setStep(timeline.progress());
    updateNeedle(timeline.progress());

    return () => {
      scene.classList.remove('am-enhanced');
      steps.forEach(step => step.classList.remove('is-active'));
      needle.removeAttribute('transform');
    };
  }, scene);

  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  // pagehide with bfcache is not an unmount: the same document may return.
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { media.revert(); headerObserver?.disconnect(); }
  }, { once: true });
})();
