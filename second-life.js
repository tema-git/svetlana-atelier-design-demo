(() => {
  'use strict';
  const root = document.querySelector('#second-life');
  if (!root) return;
  const garments = {
    shirt: {name: 'Рубашка', before: 'old-shirt', routes: [
      {id: 'shirt-crop', label: 'Укоротить силуэт', detail: 'Более короткая длина, прежний характер.', title: 'Рубашка с новой длиной', copy: 'Укороченный низ меняет пропорции. Рукава и воротник сохраняют знакомый характер вещи.'},
      {id: 'shirt-vest', label: 'Убрать рукава', detail: 'Лёгкий жилет для многослойных образов.', title: 'Из рубашки — в жилет', copy: 'Рукава уходят, воротник и планка остаются. Получается новая вещь для сочетания с футболкой или тонким джемпером.'},
      {id: 'shirt-waist', label: 'Выделить талию', detail: 'Мягкая сборка и пояс из ткани.', title: 'Больше формы', copy: 'Пояс и мягкая сборка задают новую линию талии. Вещь сохраняет свободный верх и становится более собранной.'}
    ]},
    jeans: {name: 'Джинсы', before: 'old-jeans', routes: [
      {id: 'jeans-shorts', label: 'Сделать шорты', detail: 'Другая длина для тёплых дней.', title: 'Из джинсов — в шорты', copy: 'Новая длина и аккуратно оформленный низ меняют назначение вещи. Карманы и характер денима остаются.'},
      {id: 'jeans-taper', label: 'Изменить посадку', detail: 'Более узкая линия и аккуратный отворот.', title: 'Новый силуэт джинсов', copy: 'Линия брючин становится уже, а отворот подчёркивает низ. Конкретную посадку подбирают на примерке.'},
      {id: 'jeans-skirt', label: 'Превратить в юбку', detail: 'Знакомый деним в другой форме.', title: 'Джинсовая юбка', copy: 'Брючный силуэт превращается в юбку. Пояс и карманы сохраняются, а новую форму задают соединительные швы.'}
    ]},
    coat: {name: 'Пальто', before: 'old-coat', routes: [
      {id: 'coat-vest', label: 'Сделать жилет', detail: 'Убрать рукава, сохранить длину.', title: 'Длинный жилет из пальто', copy: 'Без рукавов пальто становится основой многослойного образа. Длина, карманы и выразительный воротник сохраняются.'},
      {id: 'coat-short', label: 'Укоротить пальто', detail: 'Лаконичная длина и новые пропорции.', title: 'Короткое пальто', copy: 'Новый уровень низа делает силуэт компактнее. Расположение карманов и запас ткани мастер оценит до переделки.'},
      {id: 'coat-accent', label: 'Добавить акцент', detail: 'Контрастные лацканы и пояс.', title: 'Детали меняют всё', copy: 'Контрастные лацканы и пояс добавляют выразительность. Основа пальто остаётся узнаваемой, но образ меняется.'}
    ]}
  };
  const radios = [...root.querySelectorAll('[name="uc-garment"]')];
  const routeButtons = [...root.querySelectorAll('[data-uc-route]')];
  const beforeArt = root.querySelector('#uc-before-art');
  const afterArt = root.querySelector('#uc-after-art');
  const slider = root.querySelector('#uc-compare');
  const compare = root.querySelector('.uc-compare');
  const dragHandle = root.querySelector('.uc-drag-handle');
  const resultTitle = root.querySelector('#uc-result-title');
  const resultCopy = root.querySelector('#uc-result-copy');
  const artworkUrl = 'assets/upcycle.svg?v=20261030-sync1';
  let garment = 'shirt', routeIndex = 0;
  let drag = null;

  const clamp = amount => Math.max(0, Math.min(100, Math.round(amount)));

  function stopDrag() {
    if (!drag) return;
    const pointerId = drag.pointerId;
    drag = null;
    compare.classList.remove('is-dragging');
    if (dragHandle?.hasPointerCapture?.(pointerId)) dragHandle.releasePointerCapture(pointerId);
  }

  // Selection updates remain local. Refreshing the page-wide pinned timeline
  // here used to restore its scroll position and could jump to the page top.
  function updateInPlace(update) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    update();
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
      window.scrollTo({left: scrollX, top: scrollY, behavior: 'instant'});
    }
  }

  function paintComparison() {
    const amount = clamp(Number(slider.value));
    slider.value = String(amount);
    compare.style.setProperty('--uc-split', `${amount}%`);
    compare.classList.toggle('uc-show-before', amount === 100);
    compare.classList.toggle('uc-show-after', amount === 0);
    slider.setAttribute('aria-valuetext', `До: ${amount}%, после: ${100 - amount}%`);
    dragHandle?.setAttribute('aria-valuenow', String(amount));
    dragHandle?.setAttribute('aria-valuetext', `До: ${amount}%, после: ${100 - amount}%`);
  }

  function render(resetComparison = true) {
    stopDrag();
    const selected = garments[garment], route = selected.routes[routeIndex];
    radios.forEach(input => { input.checked = input.value === garment; });
    beforeArt.querySelector('use').setAttribute('href', `${artworkUrl}#${selected.before}`);
    afterArt.querySelector('use').setAttribute('href', `${artworkUrl}#${route.id}`);
    beforeArt.setAttribute('aria-label', `${selected.name} до переделки`);
    afterArt.setAttribute('aria-label', route.title);
    routeButtons.forEach((button, index) => {
      button.querySelector('.uc-route-title').textContent = selected.routes[index].label;
      button.querySelector('.uc-route-detail').textContent = selected.routes[index].detail;
      button.setAttribute('aria-pressed', String(index === routeIndex));
    });
    root.querySelector('#uc-before-caption').textContent = selected.name;
    root.querySelector('#uc-after-caption').textContent = route.title;
    resultTitle.textContent = route.title;
    resultCopy.textContent = route.copy;
    if (resetComparison) slider.value = 50;
    paintComparison();
  }

  radios.forEach(input => input.addEventListener('change', () => {
    if (!input.checked) return;
    updateInPlace(() => { garment = input.value; routeIndex = 0; render(); });
  }));
  routeButtons.forEach((button, index) => button.addEventListener('click', () => {
    updateInPlace(() => { routeIndex = index; render(); });
  }));
  slider.addEventListener('input', () => { stopDrag(); paintComparison(); });

  if (dragHandle) {
    dragHandle.setAttribute('aria-orientation', 'horizontal');
    dragHandle.addEventListener('pointerdown', event => {
      if (event.isPrimary === false || event.button !== 0 || drag) return;
      const bounds = compare.getBoundingClientRect();
      if (bounds.width <= 0) return;
      if (event.pointerType !== 'touch') event.preventDefault();
      dragHandle.focus({preventScroll: true});
      drag = {pointerId: event.pointerId, startX: event.clientX, startAmount: Number(slider.value), width: bounds.width};
      dragHandle.setPointerCapture(event.pointerId);
      compare.classList.add('is-dragging');
    });
    dragHandle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      // Captured geometry keeps the line stable when grabbed off-centre.
      slider.value = String(clamp(drag.startAmount + (event.clientX - drag.startX) / drag.width * 100));
      paintComparison();
    });
    const finishPointer = event => {
      if (drag && event.pointerId === drag.pointerId) stopDrag();
    };
    dragHandle.addEventListener('pointerup', finishPointer);
    dragHandle.addEventListener('pointercancel', finishPointer);
    dragHandle.addEventListener('lostpointercapture', finishPointer);
    window.addEventListener('blur', stopDrag);
    window.addEventListener('pagehide', stopDrag);
    window.addEventListener('resize', stopDrag);
    dragHandle.addEventListener('keydown', event => {
      const step = event.shiftKey ? 10 : 1;
      const amount = Number(slider.value);
      const next = {
        ArrowLeft: amount - step, ArrowDown: amount - step,
        ArrowRight: amount + step, ArrowUp: amount + step,
        PageDown: amount - 10, PageUp: amount + 10,
        Home: 0, End: 100
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      event.stopPropagation();
      stopDrag();
      slider.value = String(clamp(next));
      paintComparison();
    });
  }
  root.querySelector('#uc-discuss').addEventListener('click', () => {
    const selected = garments[garment], route = selected.routes[routeIndex];
    document.dispatchEvent(new CustomEvent('atelier:idea', {detail: `${selected.name}: ${route.label.toLowerCase()}. Идея — «${route.title}».`}));
  });
  render();
})();
