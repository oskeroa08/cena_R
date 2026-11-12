/* ЦЕНА РЕШЕНИЯ — скрипты. Чистый JS, без библиотек. */
(function () {
  'use strict';

  /* ===== НАСТРОЙКИ (меняются в одном месте) ===== */
  // Адрес, на который уходят заявки. Позже вместо почты можно подключить CRM (см. submitToCrm ниже).
  var CONTACT_EMAIL = 'oskeroa08@gmail.com';
  // Ссылка на чат в MAX (пока не задана). Если указать, при выборе MAX под полем контакта появится ссылка перехода в чат.
  var MAX_CHAT_URL = '';
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

  var E = form.elements;
  var $ = function (id) { return document.getElementById(id); };
  var note = $('form-note'), consent = $('consent'), submit = $('submit-btn');
  var formatSelect = $('format'), msg = E['message'], counter = $('message-count');
  var contact = E['contact'], contactLabel = $('contact-label'), contactHint = $('contact-hint'), maxLink = $('max-link');
  var CONSENT_VERSION = form.getAttribute('data-consent-version') || '';
  var LIMITS = { name: 60, company: 100, position: 80, contact: 120, message: 1000 };
  var FIELD_ID = { name: 'name', company: 'company', position: 'position', contact: 'contact-way', message: 'message' };

  // Управляющие и невидимые символы, которые не должны попадать в заявку
  var RE_CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠﻿]/g;
  var RE_NAME_BAD = /[^\p{L}\p{M}\s.'’-]/gu;
  var RE_ORG_BAD = /[^\p{L}\p{N}\p{M}\s.,'’"«»()&+\/№#:;-]/gu;
  var RE_ORG_OK = /^[\p{L}\p{N}\p{M}\s.,'’"«»()&+\/№#:;-]+$/u;

  var pre = form.getAttribute('data-format');
  if (pre && formatSelect) formatSelect.value = pre;
  if (maxLink && MAX_CHAT_URL) maxLink.href = MAX_CHAT_URL;

  function channel() { return E['channel'].value === 'max' ? 'max' : 'email'; }

  function setNote(text, cls) {
    note.textContent = text;
    note.className = 'form-note' + (cls ? ' ' + cls : '');
  }
  function setError(key, text) {
    var f = $(FIELD_ID[key] || key);
    var er = $(key + '-error');
    if (er) er.textContent = text || '';
    if (f) { f.classList.toggle('invalid', !!text); f.setAttribute('aria-invalid', text ? 'true' : 'false'); }
  }

  /* --- очистка значений --- */
  function cleanLine(v) { return String(v).replace(RE_CTRL, '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim(); }
  function cleanText(v) {
    return String(v).replace(/\r\n?/g, '\n').replace(RE_CTRL, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* --- проверки --- */
  function vName(v) {
    if (v.length < 2) return 'Укажите имя (не короче двух букв)';
    if (v.length > LIMITS.name) return 'Слишком длинное имя (не более ' + LIMITS.name + ' символов)';
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(v) || (v.match(/\p{L}/gu) || []).length < 2) return 'Имя: только буквы, пробел, дефис и апостроф';
    return '';
  }
  function vOrg(v, what, max) {
    if (!v) return '';
    if (v.length < 2) return what + ': слишком коротко';
    if (v.length > max) return what + ': не более ' + max + ' символов';
    if (!RE_ORG_OK.test(v) || !/[\p{L}\p{N}]/u.test(v)) return what + ': допустимы буквы, цифры и знаки . , - « » ( ) & + / №';
    return '';
  }
  var RE_EMAIL = /^[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)*\.[\p{L}]{2,}$/u;
  function vContact(v, ch) {
    if (!v) return ch === 'max' ? 'Укажите номер телефона или имя пользователя в MAX' : 'Укажите e-mail';
    if (v.length > LIMITS.contact) return 'Слишком длинное значение';
    if (ch === 'email') {
      if (/\.\./.test(v) || v.indexOf('@') !== v.lastIndexOf('@') || !RE_EMAIL.test(v)) return 'Введите e-mail в формате name@domain.ru';
      return '';
    }
    var digits = v.replace(/\D/g, '');
    if (/^\+?[\d\s()-]{10,20}$/.test(v) && digits.length >= 10 && digits.length <= 15) return '';
    if (/^@?[A-Za-z0-9_.]{3,32}$/.test(v)) return '';
    return 'Укажите телефон (например, +7 999 123-45-67) или имя пользователя в MAX (@name)';
  }
  function vMessage(v) {
    if (!v) return '';
    if (v.length < 10) return 'Опишите запрос подробнее (от 10 символов) или оставьте поле пустым';
    if (v.length > LIMITS.message) return 'Не более ' + LIMITS.message + ' символов';
    if (!/\p{L}/u.test(v)) return 'Комментарий должен содержать текст';
    if ((v.match(/https?:\/\/|www\.|t\.me\//gi) || []).length > 2) return 'Уберите лишние ссылки (допустимо не более двух)';
    if (/(.)\1{9,}/su.test(v)) return 'Уберите длинные повторы одного символа';
    return '';
  }

  function value(key) { return key === 'message' ? cleanText(E[key].value) : cleanLine(E[key].value); }
  function check(key) {
    var v = value(key), e = '';
    if (key === 'name') e = vName(v);
    else if (key === 'company') e = vOrg(v, 'Компания', LIMITS.company);
    else if (key === 'position') e = vOrg(v, 'Должность', LIMITS.position);
    else if (key === 'contact') e = vContact(v, channel());
    else if (key === 'message') e = vMessage(v);
    setError(key, e);
    return !e;
  }

  /* --- ввод в реальном времени: фильтр символов и лимиты --- */
  function live(key, fn) {
    var el = E[key];
    el.addEventListener('input', function () {
      var v = el.value, n = fn(v);
      if (n !== v) el.value = n;
      if (el.getAttribute('aria-invalid') === 'true') check(key);
    });
    el.addEventListener('blur', function () {
      if (key === 'message') { var c = cleanText(el.value); if (c !== el.value) el.value = c; }
      else { var l = cleanLine(el.value); if (l !== el.value) el.value = l; }
      if (el.value || el.hasAttribute('aria-required') || el.getAttribute('aria-invalid') === 'true') check(key);
      updateCount();
    });
  }
  live('name', function (v) { return v.replace(RE_CTRL, '').replace(RE_NAME_BAD, '').replace(/\s{2,}/g, ' ').slice(0, LIMITS.name); });
  live('company', function (v) { return v.replace(RE_CTRL, '').replace(RE_ORG_BAD, '').replace(/\s{2,}/g, ' ').slice(0, LIMITS.company); });
  live('position', function (v) { return v.replace(RE_CTRL, '').replace(RE_ORG_BAD, '').replace(/\s{2,}/g, ' ').slice(0, LIMITS.position); });
  live('contact', function (v) {
    v = v.replace(RE_CTRL, '');
    v = channel() === 'email' ? v.replace(/\s/g, '') : v.replace(/[^\p{L}\p{N}\s@_.+()-]/gu, '').replace(/\s{2,}/g, ' ');
    return v.slice(0, LIMITS.contact);
  });
  live('message', function (v) {
    return v.replace(/\r\n?/g, '\n').replace(RE_CTRL, '').replace(/\n{3,}/g, '\n\n').slice(0, LIMITS.message);
  });
  msg.addEventListener('input', updateCount);

  function updateCount() {
    var n = msg.value.length;
    counter.textContent = n + ' / ' + LIMITS.message;
    counter.parentNode.className = 'count' + (n >= LIMITS.message * 0.9 ? ' near' : '');
  }

  /* --- способ связи --- */
  function applyChannel() {
    var ch = channel();
    if (ch === 'max') {
      contactLabel.textContent = 'Номер телефона или имя пользователя в MAX';
      contact.setAttribute('autocomplete', 'tel');
      contact.setAttribute('inputmode', 'text');
      contactHint.textContent = 'Например: +7 999 123-45-67 или @name';
    } else {
      contactLabel.textContent = 'E-mail';
      contact.setAttribute('autocomplete', 'email');
      contact.setAttribute('inputmode', 'email');
      contactHint.textContent = '';
    }
    if (maxLink) maxLink.hidden = !(ch === 'max' && MAX_CHAT_URL);
    setError('contact', '');
    contact.value = '';
  }
  Array.prototype.forEach.call(form.querySelectorAll('input[name=channel]'), function (r) { r.addEventListener('change', applyChannel); });

  /* --- согласие: кнопка недоступна без отметки --- */
  function syncSubmit() { submit.disabled = !consent.checked; if (consent.checked) setError('consent', ''); }
  consent.addEventListener('change', syncSubmit);

  // Точка подключения CRM: заменить тело на fetch() к проверенному обработчику. Должна вернуть Promise<boolean>.
  function submitToCrm() { return Promise.resolve(false); }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) {
    var off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-', a = Math.abs(off);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' (UTC' + sign + pad(Math.floor(a / 60)) + ':' + pad(a % 60) + ')';
  }
  function buildBody(d) {
    return [
      'Заявка с сайта «ЦЕНА РЕШЕНИЯ»', '',
      'Имя: ' + d.name,
      'Способ связи: ' + (d.channel === 'max' ? 'MAX' : 'Электронная почта'),
      'Контакт: ' + d.contact,
      'Компания: ' + (d.company || '—'),
      'Должность: ' + (d.position || '—'),
      'Формат: ' + d.format,
      'Комментарий / задача:', d.message || '—', '',
      '--- Сведения о согласии на обработку персональных данных ---',
      'Согласие дано: пользователь самостоятельно отметил отдельный чекбокс',
      'Версия текста согласия: ' + CONSENT_VERSION,
      'Дата и время отправки: ' + stamp(new Date()),
      'Страница: ' + location.href,
      'Браузер: ' + navigator.userAgent
    ].join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (E['website'] && E['website'].value) return; // антиспам-ловушка

    var ok = true;
    ['name', 'contact', 'company', 'position', 'message'].forEach(function (k) { if (!check(k)) ok = false; });
    if (!consent.checked) { setError('consent', 'Для отправки отметьте согласие на обработку персональных данных'); ok = false; }
    if (!ok) {
      setNote('Проверьте выделенные поля.', 'err');
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }

    var d = {
      name: value('name'), channel: channel(), contact: value('contact'),
      company: value('company'), position: value('position'),
      format: formatSelect.value, message: value('message')
    };

    goal('form_submit');
    submit.disabled = true;

    submitToCrm(d).then(function (sent) {
      if (sent) return done();
      var body = buildBody(d);
      var url = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Заявка: ' + d.format) + '&body=' + encodeURIComponent(body);
      var long = url.length > 7000;
      if (long && navigator.clipboard && navigator.clipboard.writeText) { try { navigator.clipboard.writeText(body); } catch (err) {} }
      window.location.href = url;
      done('Открылась ваша почтовая программа с готовым письмом — заявка уйдёт после того, как вы нажмёте «Отправить».' +
        (long ? ' Текст длинный: он также скопирован в буфер обмена — при необходимости вставьте его в письмо.' : '') +
        ' Если письмо не открылось, напишите на ' + CONTACT_EMAIL + '.');
    });

    function done(text) {
      setNote(text || 'Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'ok');
      form.reset();
      if (pre && formatSelect) formatSelect.value = pre;
      applyChannel(); updateCount(); syncSubmit();
    }
  });

  applyChannel(); updateCount(); syncSubmit();
})();
