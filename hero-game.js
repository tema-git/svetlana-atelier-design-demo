(() => {
  'use strict';
  const root = document.querySelector('#hero-color-game');
  if (!root) return;

  const garments = [
    { id: 'shirt', name: 'Рубашка' },
    { id: 'trousers', name: 'Брюки' },
    { id: 'dress', name: 'Платье' },
    { id: 'tank', name: 'Майка' },
    { id: 'skirt', name: 'Юбка' },
    { id: 'scarf', name: 'Шарф' },
    { id: 'coat', name: 'Пальто' },
    { id: 'fur-coat', name: 'Шуба' },
    { id: 'jacket', name: 'Пиджак' }
  ];
  const form = root.querySelector('#hg-form');
  const sliders = ['hue', 'saturation', 'lightness'].map(name => form.elements[name]);
  const outputs = ['hue', 'saturation', 'lightness'].map(name => root.querySelector(`#hg-${name}-value`));
  const replay = root.querySelector('#hg-replay');
  const result = root.querySelector('#hg-result');
  const scoreOutput = root.querySelector('#hg-score');
  const targetArt = root.querySelector('#hg-target-art');
  const ownArt = root.querySelector('#hg-own-art');
  let target = [229, 58, 48];
  let lastPairKey = '';
  let checked = false;

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const hsl = values => `hsl(${values[0]} ${values[1]}% ${values[2]}%)`;
  const values = () => sliders.map(slider => Number(slider.value));

  // D65 CIELAB: compare perceived colour distance rather than raw slider offsets.
  // The result is deliberately a game score, not a fabric or display calibration.
  function lab(hslValues) {
    const [degrees, percentage, lightness] = hslValues;
    const h = ((degrees % 360) + 360) % 360 / 360;
    const s = percentage / 100;
    const l = lightness / 100;
    const a = s * Math.min(l, 1 - l);
    const channel = offset => {
      const k = (offset + h * 12) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
    };
    const r = channel(0), g = channel(8), b = channel(4);
    const x = (r * .4124564 + g * .3575761 + b * .1804375) / .95047;
    const y = r * .2126729 + g * .7151522 + b * .0721750;
    const z = (r * .0193339 + g * .1191920 + b * .9503041) / 1.08883;
    const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  }
  function distance(first, second) {
    const a = lab(first), b = lab(second);
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
  function accuracy() {
    const difference = distance(target, values());
    // A gentle curve rewards near matches without giving unrelated colours a high score.
    return Math.round(100 / (1 + Math.pow(difference / 45, 2)));
  }

  function setArt(svg, garment, suffix) {
    svg.querySelector('use').setAttribute('href', `assets/garments.svg?v=20261030-sync1#${garment.id}`);
    svg.setAttribute('aria-label', `${garment.name}: ${suffix}`);
  }

  function paint() {
    const current = values();
    root.style.setProperty('--hg-own', hsl(current));
    outputs.forEach((output, index) => { output.value = `${current[index]}${index === 0 ? '°' : '%'}`; });
    sliders[0].style.setProperty('--hg-track', 'linear-gradient(90deg, #d95353, #d6cf50, #69b55c, #53b8bd, #616bd2, #ca5aac, #d95353)');
    sliders[1].style.setProperty('--hg-track', `linear-gradient(90deg, hsl(${current[0]} 0% 55%), hsl(${current[0]} 90% 55%))`);
    sliders[2].style.setProperty('--hg-track', `linear-gradient(90deg, hsl(${current[0]} ${current[1]}% 13%), hsl(${current[0]} ${current[1]}% 86%))`);
    if (checked) {
      checked = false;
      scoreOutput.textContent = '';
      result.textContent = 'Цвет изменился. Нажмите «Проверить», чтобы увидеть точность.';
    }
  }

  function newRound(moveFocus) {
    let first, second, key;
    // Build eligible pairs explicitly: no retry loop can hang on rapid replay.
    const pairs = [];
    garments.forEach((left, i) => garments.forEach((right, j) => {
      if (i !== j && [left.id, right.id].sort().join('|') !== lastPairKey) pairs.push([left, right]);
    }));
    [first, second] = pairs[randomInt(0, pairs.length - 1)];
    key = [first.id, second.id].sort().join('|');
    lastPairKey = key;
    const previousTarget = target;
    const nextHue = (previousTarget[0] + randomInt(28, 330)) % 360;
    target = [nextHue, randomInt(28, 76), randomInt(32, 68)];
    const initial = [(target[0] + randomInt(65, 285)) % 360, randomInt(25, 78), randomInt(30, 72)];
    // Ensure the starting sample visibly differs even near low-saturation tones.
    if (distance(target, initial) < 22) initial[2] = target[2] > 50 ? 25 : 78;
    sliders.forEach((slider, index) => { slider.value = initial[index]; });
    root.style.setProperty('--hg-target', hsl(target));
    setArt(targetArt, first, 'цвет, который нужно повторить');
    setArt(ownArt, second, 'настройте оттенок ползунками ниже');
    checked = false;
    scoreOutput.textContent = '';
    result.textContent = '';
    replay.hidden = true;
    paint();
    if (moveFocus) sliders[0].focus({ preventScroll: true });
  }

  form.addEventListener('input', paint);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const score = accuracy();
    checked = true;
    scoreOutput.textContent = `${score}%`;
    const message = score >= 95 ? 'Отличное попадание. Сыграем ещё?' : score >= 75 ? 'Очень близко. Можно уточнить оттенок или сыграть снова.' : score >= 45 ? 'Направление найдено. Уточните цвет или попробуйте новую пару.' : 'Оттенки пока отличаются. Попробуйте ещё раз или начните новую пару.';
    result.textContent = `Точность попадания — ${score}%. ${message}`;
    replay.hidden = false;
  });
  replay.addEventListener('click', () => newRound(true));
  newRound(false);
})();
