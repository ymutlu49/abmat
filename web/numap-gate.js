/*!
 * numap-gate.js — NuMap MERKEZLİ erişim kapısı (sayfalara build-zamanı enjekte edilir).
 * Kaynak (tek doğruluk): numap/public/sso/ — DokunSay ve ABMATO'ya birebir kopyalanır.
 *
 * İki mod (window.NUMAP_GATE_MODE ile sayfa başına ayarlanır):
 *   'chip' → AÇILIŞ/SİTE sayfaları: içerik GÖRÜNÜR; köşede giriş daveti (giriş yoksa) ya da
 *            kimlik rozeti (giriş varsa). ENGELLEMEZ.
 *   'gate' → İÇERİK/ARAÇ sayfaları (varsayılan): giriş yapılmadan içerik GİZLİ + tam-ekran kapı.
 *
 * Kimlik: NuMap (getnumap.com) TEK MERKEZ. Token localStorage 'numap_token'da; her istek
 *   Authorization: Bearer ile (çerez YOK → CSRF yüzeyi yok). NuMap'ten ?sso=<bilet> ile gelen
 *   ziyaretçi otomatik giriş yapar (bilet /api/auth/sso/exchange'e doğrulatılır). Giriş yoksa
 *   gate modunda "NuMap ile giriş yap" kapısı; chip modunda köşe giriş daveti.
 * NuMap'a ulaşılamazsa: gate modunda AÇIK-BAŞARISIZ (kilitlemez), chip modunda rozet çizmez.
 */
(function () {
  var MODE = window.NUMAP_GATE_MODE || 'gate';
  var BRAND = window.NUMAP_GATE_BRAND || 'NuMap';
  var BRAND_SUB = window.NUMAP_GATE_SUB || 'Matematik Öğretim Araçları';
  var ACCENT = window.NUMAP_GATE_ACCENT || '#15803d';
  var INK = window.NUMAP_GATE_INK || (function (hex) {
    var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var r = parseInt(h.substr(0, 2), 16) || 0, g = parseInt(h.substr(2, 2), 16) || 0, b = parseInt(h.substr(4, 2), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#241a05' : '#ffffff';
  })(ACCENT);
  var API = 'https://getnumap.com/api';
  var LOGIN = 'https://getnumap.com/';
  var TOKEN_KEY = 'numap_token', USER_KEY = 'numap_user';
  var d = document, de = d.documentElement, ov, st, done = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function cachedUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; } }
  function setSession(token, user) { try { if (token) localStorage.setItem(TOKEN_KEY, token); if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) {} }
  function clearSession() { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch (e) {} }
  function readTicket() { try { return new URLSearchParams(location.search).get('sso') || null; } catch (e) { return null; } }
  function stripTicket() { try { var u = new URL(location.href); u.searchParams.delete('sso'); history.replaceState({}, d.title, u.pathname + u.search + u.hash); } catch (e) {} }
  function goLogin() { location.href = LOGIN + (LOGIN.indexOf('?') >= 0 ? '&' : '?') + 'sso_return=' + encodeURIComponent(location.href); }
  function logout() { var t = getToken(); clearSession(); if (t) { try { fetch(API + '/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + t } }); } catch (e) {} } }

  // Kimliği çöz → cb(user|null). Önce ?sso= bileti (varsa), sonra saklı token doğrulaması.
  function resolve(cb) {
    var ticket = readTicket();
    if (ticket) {
      fetch(API + '/auth/sso/exchange', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ticket: ticket }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { stripTicket(); if (j && j.token) { setSession(j.token, j.user); cb(j.user || {}); } else { validateStored(cb); } })
        .catch(function () { stripTicket(); validateStored(cb); });
      return;
    }
    validateStored(cb);
  }
  function validateStored(cb) {
    var t = getToken();
    if (!t) { cb(null); return; }
    fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + t } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { clearSession(); cb(null); return; }
        if (r.ok) { r.json().then(function (j) { if (j && j.user) { setSession(t, j.user); cb(j.user); } else { cb(cachedUser()); } }).catch(function () { cb(cachedUser()); }); return; }
        cb(cachedUser()); // diğer hata (5xx/ağ) → önbellekli kullanıcıyla devam (açık-başarısız)
      })
      .catch(function () { cb(cachedUser()); });
  }

  // Kimlik rozeti (giriş varsa) — #numapAuth varsa doldurur, yoksa köşede yüzer
  function renderChip(user) {
    var name = (user && user.name) || (user && user.email) || 'Kullanıcı';
    var box = d.getElementById('numapAuth'), floating = false;
    if (!box) { box = d.createElement('div'); box.id = 'numap-chip'; floating = true; }
    box.innerHTML = '<span>👋 <span class="nm">' + esc(name) + '</span></span> <button type="button" id="numap-out">Çıkış</button>';
    if (floating) {
      box.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483000;display:flex;align-items:center;gap:9px;' +
        'background:rgba(18,24,48,.92);color:#e7ecff;border:1px solid rgba(255,255,255,.14);border-radius:999px;' +
        'padding:5px 7px 5px 14px;font:600 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.32)';
      var nm = box.querySelector('.nm'); if (nm) nm.style.color = '#7fdca0';
      var bt = box.querySelector('#numap-out');
      if (bt) bt.style.cssText = 'cursor:pointer;border:0;border-radius:999px;background:' + ACCENT + ';color:' + INK + ';font:700 12px system-ui;padding:6px 12px';
      (d.body || de).appendChild(box);
    }
    var out = d.getElementById('numap-out');
    if (out) out.onclick = function () { logout(); setTimeout(function () { location.reload(); }, 150); };
  }

  // Giriş daveti (chip modu, giriş yok)
  function renderLogin() {
    var box = d.getElementById('numapAuth'), floating = false;
    if (!box) { box = d.createElement('div'); box.id = 'numap-login'; floating = true; }
    box.innerHTML = '<a href="#" id="numap-in">🔑 NuMap ile giriş</a>';
    if (floating) {
      box.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483000;display:flex;align-items:center;gap:10px;' +
        'background:rgba(18,24,48,.9);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:8px 14px;' +
        'font:700 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3)';
      var a = box.querySelector('#numap-in'); if (a) a.style.cssText = 'color:#7fdca0;text-decoration:none;cursor:pointer';
      (d.body || de).appendChild(box);
    }
    var e1 = d.getElementById('numap-in');
    if (e1) e1.onclick = function (e) { e.preventDefault(); goLogin(); };
  }

  // ── CHIP MODU: içerik görünür; yalnız giriş daveti / kimlik rozeti (engellemez) ──
  if (MODE === 'chip') {
    resolve(function (user) { if (user) renderChip(user); else renderLogin(); });
    return;
  }

  // ── GATE MODU: giriş yapılmadan içerik GİZLİ + tam-ekran giriş kapısı ──
  de.classList.add('numap-gated');
  st = d.createElement('style');
  st.id = 'numap-gate-style';
  st.textContent =
    'html.numap-gated body>*:not(#numap-gate){visibility:hidden!important}' +
    '#numap-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;' +
    'background:radial-gradient(1200px 800px at 50% -10%,#13351f 0%,#0b1020 60%,#070a16 100%);' +
    "font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#e7ecff}" +
    '#numap-gate .g-card{width:min(440px,100%);background:rgba(18,28,22,.86);border:1px solid rgba(255,255,255,.12);' +
    'border-radius:22px;padding:34px 30px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.5)}' +
    '#numap-gate .g-logo{width:60px;height:60px;margin:0 auto 12px;display:block}' +
    '#numap-gate .g-brand{font-weight:800;font-size:1.16rem;letter-spacing:.2px}' +
    '#numap-gate .g-brand small{display:block;font-weight:600;font-size:.72rem;color:#b9eecb;opacity:.85;margin-top:3px}' +
    '#numap-gate h1{font-size:1.16rem;margin:18px 0 8px;font-weight:750}' +
    '#numap-gate p{font-size:.92rem;line-height:1.55;color:#c3f0d3;margin:0 0 22px}' +
    '#numap-gate .g-btns{display:flex;flex-direction:column;gap:10px}' +
    '#numap-gate button{appearance:none;border:0;cursor:pointer;border-radius:13px;padding:13px 16px;font-size:.96rem;font-weight:700;font-family:inherit;transition:filter .15s,transform .15s}' +
    '#numap-gate .g-in{background:' + ACCENT + ';color:' + INK + '}' +
    '#numap-gate button:hover{filter:brightness(1.07);transform:translateY(-1px)}' +
    '#numap-gate button:active{transform:translateY(0)}' +
    '#numap-gate .g-back{display:inline-block;margin-top:16px;font-size:.82rem;color:#9fe0b6;text-decoration:none}' +
    '#numap-gate .g-back:hover{color:#e7ecff}' +
    '#numap-gate .g-spin{width:34px;height:34px;margin:6px auto 0;border:3px solid rgba(255,255,255,.2);border-top-color:' + ACCENT + ';border-radius:50%;animation:numap-spin .8s linear infinite}' +
    '@keyframes numap-spin{to{transform:rotate(360deg)}}';
  (d.head || de).appendChild(st);

  ov = d.createElement('div');
  ov.id = 'numap-gate';
  ov.setAttribute('role', 'dialog');
  ov.innerHTML = '<div class="g-card"><div class="g-spin"></div><p style="margin-top:16px">Yükleniyor…</p></div>';
  function mount() { if (ov && !ov.parentNode) (d.body || de).appendChild(ov); }
  mount();
  if (d.addEventListener) d.addEventListener('DOMContentLoaded', mount);

  function finish(fn) { if (done) return; done = true; fn(); }
  function reveal(user) {
    finish(function () {
      de.classList.remove('numap-gated');
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      if (st && st.parentNode) st.parentNode.removeChild(st);
      if (user) renderChip(user);
    });
  }
  function gate() {
    finish(function () {
      mount();
      ov.innerHTML =
        '<div class="g-card">' +
        '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true">' +
        '<circle cx="24" cy="24" r="22" fill="' + ACCENT + '"/>' +
        '<circle cx="16" cy="20" r="3.4" fill="' + INK + '"/>' +
        '<circle cx="32" cy="20" r="3.4" fill="' + INK + '"/>' +
        '<circle cx="24" cy="31" r="3.4" fill="' + INK + '"/></svg>' +
        '<div class="g-brand">' + esc(BRAND) + '<small>' + esc(BRAND_SUB) + '</small></div>' +
        '<h1>Bu içerik giriş gerektirir</h1>' +
        '<p>Bu uygulamanın içeriğine erişmek için NuMap hesabınızla giriş yapın.</p>' +
        '<div class="g-btns">' +
        '<button class="g-in" id="numap-g-in">🔑 NuMap ile giriş yap</button>' +
        '</div><a class="g-back" href="/">← Ana sayfaya dön</a></div>';
      var e1 = d.getElementById('numap-g-in');
      if (e1) e1.onclick = function () { goLogin(); };
    });
  }

  resolve(function (user) { if (user) reveal(user); else gate(); });
  setTimeout(function () { if (!done) reveal(); }, 8000); // çözüm hiç dönmezse açık-başarısız
})();
