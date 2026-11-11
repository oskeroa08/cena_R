/* ЦЕНА РЕШЕНИЯ — скрипты. Чистый JS, без библиотек. */
(function () {
  'use strict';

  /* ===== НАСТРОЙКИ (меняются в одном месте) ===== */
  // Адрес, на который уходят заявки. Позже вместо почты можно подключить CRM (см. submitToCrm ниже).
  var CONTACT_EMAIL = 'oskeroa08@gmail.com';
  // Ссылка на политику обработки персональных данных (пока страница-заглушка).
  // Яндекс Метрика: добавьте счётчик в <head> и укажите ID, цели вызываются через reachGoal.
  var METRIKA_ID = 0;

  function goal(name) {
    try { if (METRIKA_ID && window.ym) window.ym(METRIKA_ID, 'reachGoal', name); } catch (e) {}
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Год в подвале ===== */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ===== Мобильное меню ===== */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Закрыть' : 'Меню';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Меню';
      }
    });
  }

  /* ===== Появление блоков ===== */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ===== Ось «Ход»: подсветка шага при прокрутке ===== */
  var steps = document.querySelectorAll('.axis li');
  if (steps.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('on'); });
    }, { rootMargin: '0px 0px -35% 0px', threshold: 0.1 });
    steps.forEach(function (s) { so.observe(s); });
  } else {
    steps.forEach(function (s) { s.classList.add('on'); });
  }

  /* ===== Цифры плана/факта: плавный переход от плана к факту ===== */
  function fmt(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  document.querySelectorAll('[data-from][data-to]').forEach(function (el) {
    var from = parseFloat(el.getAttribute('data-from'));
    var to = parseFloat(el.getAttribute('data-to'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || !('IntersectionObserver' in window)) { el.textContent = fmt(to) + suffix; return; }
    el.textContent = fmt(from) + suffix;
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      var start = null, dur = 1400;
      setTimeout(function () {
        requestAnimationFrame(function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(from + (to - from) * e) + suffix;
          if (p < 1) requestAnimationFrame(step);
        });
      }, 500);
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  /* ===== Цели аналитики ===== */
  document.querySelectorAll('[data-goal]').forEach(function (el) {
    el.addEventListener('click', function () { goal(el.getAttribute('data-goal')); });
  });

  /* ===== Форма обращения ===== */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var note = document.getElementById('form-note');
  var consent = document.getElementById('consent');
  var submit = document.getElementById('submit-btn');
  var formatSelect = document.getElementById('format');

  // Предвыбор формата со страницы продукта
  var pre = form.getAttribute('data-format');
  if (pre && formatSelect) formatSelect.value = pre;

  function setNote(text, cls) {
    note.textContent = text;
    note.className = 'form-note' + (cls ? ' ' + cls : '');
  }
  function setError(id, msg) {
    var f = document.getElementById(id);
    var er = document.getElementById(id + '-error');
    if (er) er.textContent = msg || '';
    if (f) { f.classList.toggle('invalid', !!msg); f.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
  }

  // Кнопка активна только при согласии
  function syncSubmit() { submit.disabled = !consent.checked; }
  consent.addEventListener('change', syncSubmit);
  syncSubmit();

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validContact(v) {
    v = v.trim();
    if (emailRe.test(v)) return true;
    var digits = v.replace(/\D/g, '');
    return /^[+\d][\d\s()\-+]*$/.test(v) && digits.length >= 10 && digits.length <= 15;
  }

  // Точка подключения CRM: заменить тело функции на fetch() к вашей CRM / обработчику.
  // Должна вернуть Promise<boolean>. Пока заявка отправляется через почтовую программу посетителя.
  function submitToCrm(data) {
    return Promise.resolve(false);
  }

  function buildBody(d) {
    return [
      'Заявка с сайта «ЦЕНА РЕШЕНИЯ»',
      '',
      'Имя: ' + d.name,
      'Компания: ' + d.company,
      'Должность: ' + (d.position || '—'),
      'Контакт: ' + d.contact,
      'Формат: ' + d.format,
      'Задача: ' + (d.message || '—'),
      '',
      'Согласие на обработку персональных данных: получено (' + new Date().toLocaleString('ru-RU') + ')'
    ].join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements['website'] && form.elements['website'].value) return; // антиспам-ловушка

    var d = {
      name: form.elements['name'].value.trim(),
      company: form.elements['company'].value.trim(),
      position: form.elements['position'].value.trim(),
      contact: form.elements['contact'].value.trim(),
      format: form.elements['format'].value,
      message: form.elements['message'].value.trim()
    };

    var ok = true;
    setError('name', ''); setError('company', ''); setError('contact', '');
    if (d.name.length < 2) { setError('name', 'Укажите имя'); ok = false; }
    if (d.company.length < 2) { setError('company', 'Укажите компанию'); ok = false; }
    if (!validContact(d.contact)) { setError('contact', 'Укажите телефон или e-mail в корректном формате'); ok = false; }
    if (!consent.checked) { setNote('Для отправки нужно согласие на обработку персональных данных.', 'err'); ok = false; }
    if (!ok) {
      var first = form.querySelector('.invalid');
      if (first) first.focus();
      return;
    }

    goal('form_submit');
    submit.disabled = true;

    submitToCrm(d).then(function (sent) {
      if (sent) return done();
      var subject = encodeURIComponent('Заявка: ' + d.format + ' — ' + d.company);
      var body = encodeURIComponent(buildBody(d));
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
      done('Открылась ваша почтовая программа с готовым письмом — осталось нажать «Отправить». Если письмо не открылось, напишите на ' + CONTACT_EMAIL + '.');
    });

    function done(msg) {
      setNote(msg || 'Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'ok');
      form.reset();
      if (pre && formatSelect) formatSelect.value = pre;
      syncSubmit();
    }
  });
})();
