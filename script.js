/* ЦЕНА РЕШЕНИЯ — скрипты. Чистый JS, без библиотек. */
(function () {
  'use strict';

  /* ===== НАСТРОЙКИ ===== */
  // Яндекс Метрика: добавьте счётчик в <head> и укажите ID — цели (нажатия на кнопки связи) вызываются через reachGoal.
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
})();
