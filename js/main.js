/* ═══════════════════════════════════════════════════════
   Матвей & Самира — интерактив
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     ОТПРАВКА В GOOGLE-ТАБЛИЦУ
     Вставьте сюда адрес Apps Script Web App (инструкция в README).
     Пока строка пустая — данные пишутся только в консоль,
     а гость всё равно видит благодарность.
     ═══════════════════════════════════════════════════ */
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbxl6LCKNKEFHpak85Qno9auCopxiJgEVTipUUTO4xr0Ck7EgJBs5UJVXHbIhOsr9iUe/exec';

  function sendToSheet(payload) {
    if (!SHEET_URL) {
      console.log('[' + payload.sheet + ']', payload);
      return Promise.resolve();
    }
    return fetch(SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(function (e) { console.warn('Не удалось отправить:', e); });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ─────────── 1. ПРЕЛОАДЕР ─────────── */
  (function preloader() {
    var el = $('#preloader'), num = $('#preloaderNum');
    if (!el) return;
    var done = false, v = 0;

    var timer = setInterval(function () {
      v = Math.min(100, v + Math.random() * 9 + 3);
      if (num) num.textContent = Math.floor(v);
      if (v >= 100) clearInterval(timer);
    }, 70);

    function hide() {
      if (done) return;
      done = true;
      clearInterval(timer);
      if (num) num.textContent = '100';
      setTimeout(function () {
        el.classList.add('is-hidden');
        document.body.classList.remove('is-locked');
        startHero();
      }, reduced ? 0 : 420);
    }

    document.body.classList.add('is-locked');
    if (document.readyState === 'complete') setTimeout(hide, reduced ? 0 : 900);
    else window.addEventListener('load', function () { setTimeout(hide, reduced ? 0 : 900); });
    setTimeout(hide, 4200);
  })();

  /* ─────────── 2. КУРСОР ─────────── */
  (function cursor() {
    if (!finePointer || reduced) return;
    var root = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    if (!root) return;

    var mx = innerWidth / 2, my = innerHeight / 2;
    var dx = mx, dy = my, rx = mx, ry = my, shown = false, down = false;

    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; root.style.opacity = '1'; dx = rx = mx; dy = ry = my; }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { root.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { root.style.opacity = '1'; });
    addEventListener('mousedown', function () { down = true; });
    addEventListener('mouseup',   function () { down = false; });

    (function raf() {
      dx = lerp(dx, mx, .35); dy = lerp(dy, my, .35);
      rx = lerp(rx, mx, .14); ry = lerp(ry, my, .14);
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)' + (down ? ' scale(.82)' : '');
      requestAnimationFrame(raf);
    })();

    var sel = 'a, button, label, input, textarea, [data-cursor]';
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest(sel) : null;
      root.classList.remove('is-link', 'is-button');
      if (!t) return;
      var kind = t.getAttribute('data-cursor');
      if (kind === 'button' || t.tagName === 'BUTTON' || t.classList.contains('btn')) root.classList.add('is-button');
      else root.classList.add('is-link');
    });
  })();

  /* ─────────── 3. ИМЕНА ПО БУКВАМ ─────────── */
  $$('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    el.textContent = '';
    text.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.transitionDelay = (i * 55) + 'ms';
      el.appendChild(s);
    });
  });

  function startHero() {
    $$('[data-split]').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('is-in'); }, 150 + i * 320);
    });
    $$('.hero [data-reveal]').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('is-in'); }, 500 + i * 130);
    });
  }

  /* ─────────── 3b. ДЛИНА ЛИНИЙ В ИЛЛЮСТРАЦИЯХ ─────────── */
  /* Каждая линия получает собственную длину штриха. При общем значении
     длинные контуры (рамки ковра) не дорисовывались: остаток пути попадал
     в разрыв штриха и оставался невидимым. */
  (function artLengths() {
    $$('.culture-card__art').forEach(function (box) {
      $$('path,circle,rect,ellipse,line,polyline,polygon', box).forEach(function (el) {
        var len = 0;
        try { len = el.getTotalLength(); } catch (e) { return; }
        if (!len || !isFinite(len)) return;
        el.style.setProperty('--len', Math.ceil(len) + 2);
      });
    });
  })();

  /* ─────────── 3c. ОТСЫЛКА ПОД СТИХОМ ─────────── */
  /* Строки стиха выровнены по длине (text-wrap: balance), поэтому блок шире
     самой длинной строки. Отсылку сдвигаем так, чтобы она заканчивалась
     ровно под правым краем текста, а не у края пустого блока. */
  (function verseRef() {
    var text = $('.verse__text'), ref = $('.verse__ref');
    if (!text || !ref) return;
    function align() {
      ref.style.marginRight = '0px';
      var rg = document.createRange(); rg.selectNodeContents(text);
      var right = -Infinity;
      [].forEach.call(rg.getClientRects(), function (r) { if (r.right > right) right = r.right; });
      var gap = ref.getBoundingClientRect().right - right;
      if (gap > 0) ref.style.marginRight = gap + 'px';
    }
    align();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
    addEventListener('load', align);
    /* пересчёт только при смене ширины: в Safari при прокрутке прячется
       адресная строка, меняется высота окна — и выравнивание дёргало раскладку */
    var t, w = text.parentNode.parentNode.clientWidth;
    var later = function () {
      var nw = text.parentNode.parentNode.clientWidth;
      if (nw === w) return;
      w = nw; clearTimeout(t); t = setTimeout(align, 120);
    };
    addEventListener('resize', later);
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(text.parentNode.parentNode);
  })();

  /* ─────────── 4. ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ ─────────── */
  /* Считаем положение блоков сами, а не через IntersectionObserver:
     наблюдатель молчит в скрытой вкладке и срабатывает раньше, чем нужно.
     Блок начинает проявляться, когда его верх поднялся выше отметки
     TRIGGER от высоты экрана, то есть он уже заметно вошёл в кадр. */
  (function reveal() {
    var TRIGGER = 0.78;
    var items = $$('[data-reveal]').filter(function (el) { return !el.closest('.hero'); });
    if (!items.length) return;

    if (reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var pending = items.slice();
    var first = true;
    var ticking = false;

    function show(el, delay) {
      el.style.setProperty('--d', delay + 'ms');
      el.classList.add('is-in');
    }

    function check() {
      var line = innerHeight * TRIGGER;
      var shownNow = 0;
      var rest = [];

      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        var r = el.getBoundingClientRect();
        /* верх блока поднялся выше отметки и блок ещё не ушёл вверх за экран */
        if (r.top < line && r.bottom > -80) {
          /* каскад внутри одной пачки: соседние блоки идут друг за другом */
          show(el, first ? Math.min(shownNow, 5) * 90 : Math.min(shownNow, 4) * 100);
          shownNow++;
        } else {
          rest.push(el);
        }
      }
      pending = rest;
      first = false;
      if (!pending.length) removeEventListener('scroll', onScroll);
    }

    /* без requestAnimationFrame: он замирает в неактивной вкладке,
       и блоки остались бы прозрачными. Простой троттлинг по времени. */
    var last = 0;
    function onScroll() {
      var now = Date.now();
      if (now - last < 60) {
        if (ticking) return;
        ticking = true;
        setTimeout(function () { ticking = false; last = Date.now(); check(); }, 60);
        return;
      }
      last = now;
      check();
    }

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    /* первый расчёт после того, как шрифт применён и высоты устоялись */
    check();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(check);
    addEventListener('load', check);
    setTimeout(check, 400);
  })();

  /* ─────────── 5. ШАПКА ─────────── */
  (function nav() {
    var nav = $('#nav'), burger = $('#navBurger'), links = $$('#navMenu a');
    if (!nav) return;

    var stuck = null;
    var onScroll = function () {
      var s = scrollY > 60;
      if (s !== stuck) { stuck = s; nav.classList.toggle('is-stuck', s); }
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });

    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      /* на телефоне меню во весь экран — фон под ним не должен прокручиваться */
      document.body.classList.toggle('is-locked', open);
    }
    if (burger) burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    links.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    /* при повороте экрана или переходе на широкий экран меню закрываем */
    addEventListener('resize', function () { if (innerWidth > 820) setMenu(false); });

    /* активный пункт меню: та секция, в которой мы сейчас находимся.
       На самом верху страницы подсвечивается «Начало». */
    var sections = links.map(function (a) {
      return { link: a, el: $(a.getAttribute('href')) };
    }).filter(function (x) { return x.el; });

    /* позиции секций запоминаем заранее и обновляем только когда меняется
       размер страницы — на каждом шаге прокрутки ничего не измеряем */
    var tops = [], pageH = 0;
    function measure() {
      tops = sections.map(function (x) { return x.el.offsetTop; });
      pageH = document.body.scrollHeight;
    }
    measure();
    addEventListener('load', measure);
    if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); markActive(); }).observe(document.body);

    var currentId = null;
    function markActive() {
      var line = scrollY + innerHeight * 0.35;
      var found = sections[0];
      sections.forEach(function (x, i) {
        if (tops[i] <= line) found = x;
      });
      /* у самого низа страницы подсвечиваем последнюю секцию */
      if (scrollY + innerHeight >= pageH - 4) found = sections[sections.length - 1];
      if (!found || found.el.id === currentId) return;
      currentId = found.el.id;
      sections.forEach(function (x) { x.link.classList.toggle('is-active', x === found); });
    }
    if (sections.length) {
      markActive();
      addEventListener('scroll', markActive, { passive: true });
      addEventListener('resize', function () { measure(); markActive(); });
    }
  })();

  /* ─────────── 6. ПАРАЛЛАКС ФОНА ─────────── */
  (function parallax() {
    if (reduced) return;
    var items = $$('[data-parallax]');
    if (!items.length) return;
    var y = scrollY, cur = y, ticking = false;

    addEventListener('scroll', function () {
      y = scrollY;
      if (!ticking) { ticking = true; requestAnimationFrame(run); }
    }, { passive: true });

    function run() {
      cur = lerp(cur, y, .12);
      items.forEach(function (el) {
        var k = parseFloat(el.getAttribute('data-parallax')) || .05;
        el.style.transform = 'translate3d(0,' + (-cur * k).toFixed(2) + 'px,0)';
      });
      if (Math.abs(cur - y) > .4) requestAnimationFrame(run);
      else ticking = false;
    }
    run();
  })();

  /* ─────────── 7. МАГНИТНЫЕ КНОПКИ ─────────── */
  (function magnetic() {
    if (reduced || !finePointer) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .28;
        var y = (e.clientY - r.top - r.height / 2) * .28;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  })();

  /* ─────────── 8. НАКЛОН КАРТОЧЕК ─────────── */
  (function tilt() {
    if (reduced || !finePointer) return;
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 4).toFixed(2) + 'deg) rotateY(' + (px * 4).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  })();

  /* ─────────── 9. ОБРАТНЫЙ ОТСЧЁТ ─────────── */
  (function countdown() {
    var box = $('#countdown');
    if (!box) return;

    /* 24 октября 2026, 11:30 — сбор гостей (месяц с нуля: 9 = октябрь) */
    var target = new Date(2026, 9, 24, 11, 30, 0);

    var out = { d: $('[data-cd="d"]', box), h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    $$('b', box).forEach(function (b) { b.style.transition = 'transform .18s var(--ease), opacity .18s'; });

    function set(node, val) {
      if (!node || node.textContent === val) return;
      node.textContent = val;
      node.style.transform = 'translateY(-4px)';
      node.style.opacity = '.6';
      setTimeout(function () { node.style.transform = ''; node.style.opacity = ''; }, 180);
    }
    function tick() {
      var sec = Math.floor(Math.max(0, target - new Date()) / 1000);
      set(out.d, String(Math.floor(sec / 86400)));
      set(out.h, pad(Math.floor(sec / 3600) % 24));
      set(out.m, pad(Math.floor(sec / 60) % 60));
      set(out.s, pad(sec % 60));
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ─────────── 10. МИНИ-КАРТА ─────────── */
  (function map() {
    var embed = $('#mapEmbed'), frame = $('#mapFrame');
    if (!embed || !frame) return;
    /* карта и метка проявляются поверх запасной карточки только после загрузки */
    embed.addEventListener('load', function () { frame.classList.add('is-loaded'); });
  })();

  /* ─────────── 11. РАСКРЫВАЮЩИЕСЯ БЛОКИ ─────────── */
  /* Анимируем высоту один раз, а по окончании снимаем ограничение (none):
     дальше блок растёт вместе с содержимым сам, без повторных пересчётов,
     которые на телефоне давали второй рывок. */
  var touch = !finePointer;

  function openBody(body) {
    body.style.maxHeight = body.scrollHeight + 'px';
    var done = function (e) {
      if (e && e.target !== body) return;
      body.removeEventListener('transitionend', done);
      if (body.parentNode.classList.contains('is-open')) body.style.maxHeight = 'none';
    };
    body.addEventListener('transitionend', done);
    setTimeout(done, 700);                          // страховка, если transitionend не придёт
  }

  function closeBody(body) {
    body.style.maxHeight = body.scrollHeight + 'px'; // с «none» закрытие не анимируется
    body.offsetHeight;
    body.style.maxHeight = '0px';
  }

  (function toggles() {
    $$('[data-toggle]').forEach(function (block) {
      var input = $('input[type="checkbox"]', block);
      var body = $('.toggle-block__body', block);
      if (!input || !body) return;

      input.addEventListener('change', function () {
        block.classList.toggle('is-open', input.checked);
        if (input.checked) {
          if (block.dataset.onopen === 'kid' && !$('.kid', body)) addKid(false);
          openBody(body);
          /* Фокус ставим только с мышью. На телефоне фокус открывает клавиатуру
             посреди анимации, браузер прокручивает страницу к полю — это и был
             главный рывок. Гость сам нажмёт на поле, когда блок раскроется. */
          if (!touch) {
            var first = $('input[type="text"], input[type="number"]', body);
            if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 260);
          }
        } else {
          closeBody(body);
        }
      });
    });
  })();

  /* ─────────── 12. ДЕТИ ─────────── */
  var seq = 0;

  function renumber() {
    $$('#kidsList .kid').forEach(function (row, i) {
      var n = $('.kid__num', row);
      if (n) n.textContent = (i + 1) + '.';
    });
  }

  function addKid(focus) {
    var list = $('#kidsList');
    if (!list) return;
    seq++;

    var row = document.createElement('div');
    row.className = 'kid';
    row.innerHTML =
      '<span class="kid__num"></span>' +
      '<div class="field kid__name">' +
        '<input type="text" id="kid_n_' + seq + '" class="field__input" name="kid_name_' + seq + '" placeholder=" " autocomplete="off">' +
        '<label for="kid_n_' + seq + '" class="field__label">Имя и фамилия ребёнка</label>' +
        '<span class="field__line"></span>' +
      '</div>' +
      '<div class="field kid__age">' +
        '<input type="number" id="kid_a_' + seq + '" class="field__input" name="kid_age_' + seq + '" placeholder=" " min="0" max="18" inputmode="numeric">' +
        '<label for="kid_a_' + seq + '" class="field__label">Возраст</label>' +
        '<span class="field__line"></span>' +
      '</div>' +
      '<button type="button" class="kid__del" data-cursor="button" aria-label="Убрать ребёнка">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>';

    list.appendChild(row);
    renumber();

    if (focus !== false && !touch) {
      var first = $('input', row);
      if (first) first.focus({ preventScroll: true });
    }

    $('.kid__del', row).addEventListener('click', function () {
      row.classList.add('is-out');
      setTimeout(function () {
        row.remove();
        renumber();
      }, 360);
    });
  }

  (function kids() {
    var list = $('#kidsList');
    var addBtn = $('#addKid');
    if (!list || !addBtn) return;
    var block = list.closest('.toggle-block');
    if (block) block.dataset.onopen = 'kid';
    addBtn.addEventListener('click', function () { addKid(true); });
  })();

  /* ─────────── 13. АНКЕТА ─────────── */
  (function form() {
    var form = $('#rsvpForm');
    var box = $('#rsvpBox');
    var thanks = $('#rsvpThanks');
    var submit = $('#rsvpSubmit');
    if (!form || !box) return;

    /* снимаем подсветку ошибки при вводе */
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('has-error');
    });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'attend') {
        var fs = e.target.closest('.choice');
        if (fs) fs.classList.remove('has-error');
      }
    });

    function fail(el, scroll) {
      el.classList.add('has-error');
      if (el.animate) {
        el.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
           { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
          { duration: 320, easing: 'ease-in-out' }
        );
      }
      if (scroll) {
        /* клавиатура открыта — сначала убираем её, иначе прокрутка и
           изменение высоты экрана дерутся друг с другом */
        var wasFocused = touch && document.activeElement && document.activeElement.tagName === 'INPUT';
        if (wasFocused) document.activeElement.blur();
        setTimeout(function () {
          el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }, wasFocused ? 350 : 0);
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var problems = [];

      var fio = $('#fio');
      if (!fio.value.trim()) problems.push(fio.closest('.field'));

      var attend = form.querySelector('input[name="attend"]:checked');
      if (!attend) problems.push(form.querySelector('.choice'));

      var withSpouse = $('#withSpouse');
      var spouse = $('#spouse');
      if (withSpouse && withSpouse.checked && !spouse.value.trim()) problems.push(spouse.closest('.field'));

      var withKids = $('#withKids');
      var kidRows = $$('#kidsList .kid');
      /* поля детей учитываем только при отмеченной галочке: гость мог
         заполнить их, а потом передумать и снять её */
      var kids = (withKids && withKids.checked ? kidRows : []).map(function (row) {
        return {
          name: ($('input[type="text"]', row).value || '').trim(),
          age:  ($('input[type="number"]', row).value || '').trim()
        };
      }).filter(function (k) { return k.name; });

      if (withKids && withKids.checked && !kids.length) {
        var firstKid = kidRows[0];
        problems.push(firstKid ? $('.kid__name', firstKid) : withKids.closest('.toggle-block'));
      }

      if (problems.length) {
        problems.forEach(function (el, i) { fail(el, i === 0); });
        return;
      }

      /* всё заполнено — отправляем */
      submit.classList.add('is-busy');

      var data = {
        sheet:  'Гости',
        fio:    fio.value.trim(),
        attend: attend.value,
        spouse: (withSpouse && withSpouse.checked) ? spouse.value.trim() : '',
        kids:   kids,
        kidsText: kids.map(function (k) { return k.age ? k.name + ' (' + k.age + ')' : k.name; }).join(', '),
        date:   new Date().toISOString()
      };

      sendToSheet(data);

      /* Компьютер: форма гаснет на месте → одним кадром меняется на благодарность.
         Телефон: сначала убираем клавиатуру и гасим весь блок целиком (это делает
         видеокарта, раскладка не трогается). Ждём, пока клавиатура доедет и экран
         перестанет менять высоту, — и только тогда, пока блок невидим, меняем
         форму на благодарность и ставим прокрутку. Потом блок проявляется.
         Так прыжок высоты и прокрутки происходит «за шторкой». */
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      box.classList.add(touch ? 'is-hiding' : 'is-leaving');

      function swap() {
        if (thanks) thanks.hidden = false;
        /* кнопка календаря — только тем, кто придёт или ещё решает */
        var cal = $('#rsvpCal');
        if (cal) cal.hidden = attend.value === 'no';
        box.classList.add('is-done');
        box.classList.remove('is-leaving');

        var navH = (($('#nav') || {}).offsetHeight || 0) + 16;
        var top = box.getBoundingClientRect().top + scrollY - navH;
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });

        if (touch) {
          box.offsetHeight;                   // зафиксировать новое положение до проявления
          setTimeout(function () { box.classList.remove('is-hiding'); }, 40);
        }
      }

      if (!touch) { setTimeout(swap, 320); return; }   // таймер, а не rAF: работает и в фоновой вкладке

      /* ждём, пока клавиатура уедет: высота видимой области не менялась 150 мс,
         но не меньше 320 мс (время угасания) и не больше 900 мс */
      var vv = window.visualViewport, started = Date.now(), lastH = vv ? vv.height : innerHeight, stableSince = started;
      (function wait() {
        var h = vv ? vv.height : innerHeight, now = Date.now();
        if (Math.abs(h - lastH) > 1) { lastH = h; stableSince = now; }
        if ((now - started >= 320 && now - stableSince >= 150) || now - started >= 900) swap();
        else setTimeout(wait, 50);
      })();
    });
  })();

  /* ─────────── 13b. «ЗАПЛАНИРОВАТЬ» — В КАЛЕНДАРЬ УСТРОЙСТВА ─────────── */
  /* iPhone / iPad: обычная ссылка на .ics открывает карточку события внутри
     Safari, а событие попадает в «календарь по умолчанию», который часто скрыт.
     Поэтому открываем приложение «Календарь» напрямую (webcal://) — оно
     предлагает добавить отдельный календарь «Матвей & Самира», и событие сразу
     видно. Если приложение не открылось (например, встроенный браузер
     мессенджера не пускает такие ссылки) — через пару секунд откроем .ics.
     Android: .ics там обычно просто скачивается — открываем Google Календарь.
     Компьютеры: скачивается .ics и открывается в календаре системы. */
  (function calendar() {
    var btn = $('#addToCalendar');
    if (!btn) return;
    var EVENT = {
      title:    'Матвей & Самира | Венчание',
      start:    '20261024T083000Z',   // 11:30 по Москве
      end:      '20261024T120000Z',   // 15:00 по Москве
      location: 'Англиканская церковь Святого Андрея, Вознесенский пер., 8/5, Москва',
      details:  'Сбор гостей в 11:30, венчание в 12:00.\nКарта: https://yandex.ru/maps/-/CTdBfW3r'
    };
    var ua = navigator.userAgent;
    var isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var isAndroid = /android/i.test(ua);

    btn.addEventListener('click', function (e) {
      if (isAndroid) {
        e.preventDefault();
        location.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
          '&text='     + encodeURIComponent(EVENT.title) +
          '&dates='    + EVENT.start + '/' + EVENT.end +
          '&ctz=Europe/Moscow' +
          '&location=' + encodeURIComponent(EVENT.location) +
          '&details='  + encodeURIComponent(EVENT.details);
        return;
      }
      if (!isIOS || location.protocol !== 'https:') return;   // локально webcal не сработает

      e.preventDefault();
      var ics = btn.href;                                     // абсолютный https-адрес файла
      var left = false;
      var onHide = function () { if (document.hidden) left = true; };
      document.addEventListener('visibilitychange', onHide);
      addEventListener('pagehide', onHide);
      addEventListener('blur', function () { left = true; }, { once: true });
      location.href = ics.replace(/^https:/, 'webcal:');
      setTimeout(function () {
        document.removeEventListener('visibilitychange', onHide);
        if (!left) location.href = ics;
      }, 2000);
    });
  })();

  /* ─────────── 14. ПЛАВНАЯ ПРОКРУТКА ПО ЯКОРЯМ ─────────── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

})();
