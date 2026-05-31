/* ═══════════════════════════════════════════════════════════
   ABMATO web sitesi — hafif etkileşim katmanı
   Bağımsız, framework yok. Progresif geliştirme:
   JS kapalıyken de sayfa tamamen okunur.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Mobil menü */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
    });
    nav.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Aktif menü bağlantısı (aria-current) */
  var path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (path === '') path = '/';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var hp = href.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (hp === path || (hp !== '/' && path.indexOf(hp) === 0)) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* Scroll ile beliren bölümler */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Yıl */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
