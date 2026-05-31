/* ═══════════════════════════════════════════════════════════════
   ABMATO — İçerik Üreticisi (generate-content.mjs)
   Uygulamanın KENDİ veri modüllerinden web sayfaları üretir.
   Tek kaynak: js/data/* — uygulama güncellenince web de güncellenir.

   Üretilenler (dist/ içine):
     /etkinlikler            → 109 etkinlik kütüphanesi (filtreli)
     /etkinlikler/<id>       → her etkinliğe geniş detay sayfası
     /beceri-koprusu         → 20 CRA modülü
     /sayi-sohbeti           → sohbet kartları (6 bağlam)
     /icerik                 → içerik merkezi (hub)
   ═══════════════════════════════════════════════════════════════ */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ACTIVITIES } from './js/data/activities.js';
import { SB_MODULLER, SB_BOLUM_META } from './js/skill-bridge/data.js';
import { MATH_TALK_CONTEXTS, MATH_TALK_EXTENDED, ROUTINE_TRIGGERS } from './js/data/math-talk-extended.js';

const SITE = 'https://abmato.com';

const CAT = {
  number_sense:  { ad: 'Sayı & İşlem',        emoji: '🔢' },
  geometry:      { ad: 'Geometri',            emoji: '🔺' },
  measurement:   { ad: 'Ölçme',               emoji: '📏' },
  patterns:      { ad: 'Örüntü & Cebir',      emoji: '🔄' },
  problem_solving:{ ad: 'Problem Kurma',      emoji: '💡' },
  daily_life:    { ad: 'Günlük Hayat',        emoji: '🏠' },
  spatial_reasoning:{ ad: 'Uzamsal Düşünme',  emoji: '🧩' },
  kitchen:       { ad: 'Mutfak Lab',          emoji: '🍳' },
  market:        { ad: 'Market Matematiği',   emoji: '🛒' },
  time:          { ad: 'Zaman & Planlama',    emoji: '⏰' },
  game:          { ad: 'Aile Oyunları',       emoji: '🎲' },
  nature:        { ad: 'Doğa & Açık Hava',    emoji: '🌿' },
};
const AGE = { preschool: 'Okul Öncesi', grade_1: '1. Sınıf', grade_2: '2. Sınıf', grade_3: '3. Sınıf', grade_4: '4. Sınıf' };
const AGE_SHORT = { preschool: 'OÖ', grade_1: '1', grade_2: '2', grade_3: '3', grade_4: '4' };
const DIFF = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

const escH = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = (s) => escH(s).replace(/"/g, '&quot;');

/* HTML sayfa kabuğu — build-site.mjs ortak parçaları enjekte eder */
function page({ title, desc, canonical, body, jsonld, crumb }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<title>${escA(title)}</title>
<meta name="description" content="${escA(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escA(title)}">
<meta property="og:description" content="${escA(desc)}">
<meta property="og:url" content="${canonical}">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>\n` : ''}<!--#head-->
</head>
<body>
<a class="skip-link" href="#main">İçeriğe geç</a>
<!--#header-->
<main id="main">
${body}
</main>
<!--#footer-->
</body>
</html>`;
}

const ageChips = (ageGroups) => ageGroups.map((g) => `<span class="pill">${AGE[g] || g}</span>`).join(' ');

/* ── ETKİNLİKLER: kütüphane (filtreli) ───────────────────────── */
function activitiesIndex() {
  const cards = ACTIVITIES.map((a) => {
    const text = escA([a.title, a.desc, (a.tags || []).join(' ')].join(' ').toLowerCase());
    const ages = a.ageGroups.join(' ');
    return `<div class="ac-card-wrap" data-cat="${a.category}" data-age="${ages}" data-text="${text}">
      <a class="ac-card" href="/etkinlikler/${a.id}">
        <span class="ac-emoji" aria-hidden="true">${a.emoji}</span>
        <span class="ac-cat">${CAT[a.category]?.emoji || ''} ${escH(CAT[a.category]?.ad || a.category)}</span>
        <h3>${escH(a.title)}</h3>
        <p>${escH(a.desc)}</p>
        <div class="ac-meta">${a.ageGroups.map((g) => `<span class="tag">${AGE_SHORT[g] || g}</span>`).join('')}<span class="tag">⏱ ${a.dur} dk</span>${a.anxFriendly ? '<span class="tag tag-ok">🌿 kaygı dostu</span>' : ''}</div>
      </a>
      <a class="ac-pdf" href="/etkinlikler/${a.id}.pdf" download title="Bu etkinliği PDF indir" aria-label="PDF indir">PDF</a>
    </div>`;
  }).join('\n');

  const catButtons = Object.entries(CAT).map(([k, v]) =>
    `<button type="button" class="fchip" data-filter-cat="${k}">${v.emoji} ${escH(v.ad)}</button>`).join('');

  const body = `
  <section class="section section--tint" style="padding-block:clamp(2.2rem,5vw,3.2rem)">
    <div class="container">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › <a href="/icerik">İçerik</a> › Etkinlikler</nav>
      <div class="section-head" style="margin:1rem 0 0;max-width:820px">
        <span class="eyebrow">${ACTIVITIES.length} etkinlik · 12 kategori</span>
        <h1>Etkinlik kütüphanesi</h1>
        <p class="lead">Her etkinlik; malzeme listesi, adım adım yönerge, “nasıl soracağım?” ipucu ve TYMM kazanım etiketleriyle. Çoğu evde bulunan malzemelerle, 5–20 dakikada. <strong>Her birini yazdırılabilir PDF olarak indirebilirsiniz.</strong></p>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:1.5rem">
    <div class="container">
      <div class="filterbar">
        <input type="search" id="ac-search" class="fsearch" placeholder="🔎 Etkinlik ara… (ör. kesir, market, sayma, fasulye)" aria-label="Etkinlik ara">
        <div class="fchips" role="group" aria-label="Kategori filtresi">
          <span class="fchips-label">Kategori</span>
          <button type="button" class="fchip is-active" data-filter-cat="all">Tümü</button>
          ${catButtons}
        </div>
        <div class="fchips" role="group" aria-label="Yaş filtresi">
          <span class="fchips-label">Yaş</span>
          <button type="button" class="fchip fchip-age is-active" data-filter-age="all">Tümü</button>
          <button type="button" class="fchip fchip-age" data-filter-age="preschool">Okul Öncesi</button>
          <button type="button" class="fchip fchip-age" data-filter-age="grade_1">1. Sınıf</button>
          <button type="button" class="fchip fchip-age" data-filter-age="grade_2">2. Sınıf</button>
          <button type="button" class="fchip fchip-age" data-filter-age="grade_3">3. Sınıf</button>
          <button type="button" class="fchip fchip-age" data-filter-age="grade_4">4. Sınıf</button>
        </div>
      </div>
      <p class="muted mt-2" id="ac-count" aria-live="polite"></p>
      <div class="ac-grid" id="ac-grid">
${cards}
      </div>
      <p class="muted text-center mt-4" id="ac-empty" style="display:none">Bu filtreye uygun etkinlik bulunamadı.</p>
    </div>
  </section>

  <section class="section section--raised">
    <div class="container cta-band">
      <div class="card">
        <h2>İnteraktif sürüm uygulamada</h2>
        <p class="mt-2">Uygulamada yaşa göre otomatik öneri, ilerleme takibi ve haftalık plan da var — ücretsiz.</p>
        <div class="hero-cta jcc mt-3"><a class="btn btn-ondark btn-lg" href="/app/">Uygulamayı Aç →</a><a class="btn btn-outline-dark btn-lg" href="/beceri-koprusu">Beceri Köprüsü</a></div>
      </div>
    </div>
  </section>

  <script>
  (function(){
    var grid=document.getElementById('ac-grid'), cards=[].slice.call(grid.querySelectorAll('.ac-card-wrap'));
    var search=document.getElementById('ac-search'), count=document.getElementById('ac-count'), empty=document.getElementById('ac-empty');
    var cat='all', age='all';
    function apply(){
      var q=(search.value||'').trim().toLowerCase(), n=0;
      cards.forEach(function(c){
        var okCat = cat==='all' || c.getAttribute('data-cat')===cat;
        var okAge = age==='all' || c.getAttribute('data-age').split(' ').indexOf(age)>-1;
        var okText = !q || c.getAttribute('data-text').indexOf(q)>-1;
        var show = okCat && okAge && okText;
        c.style.display = show ? '' : 'none';
        if(show) n++;
      });
      count.textContent = n + ' etkinlik gösteriliyor';
      empty.style.display = n? 'none':'block';
    }
    function bind(sel, set){
      document.querySelectorAll(sel).forEach(function(b){
        b.addEventListener('click', function(){
          document.querySelectorAll(sel).forEach(function(x){x.classList.remove('is-active')});
          b.classList.add('is-active'); set(b); apply();
        });
      });
    }
    bind('[data-filter-cat]', function(b){ cat=b.getAttribute('data-filter-cat'); });
    bind('[data-filter-age]', function(b){ age=b.getAttribute('data-filter-age'); });
    search.addEventListener('input', apply); apply();
  })();
  </script>`;

  return page({
    title: 'Etkinlik Kütüphanesi — 109 Evde Matematik Etkinliği | ABMATO',
    desc: 'Okul öncesi ve ilkokul için 109 kanıt temelli, TYMM uyumlu evde matematik etkinliği. Kategori ve yaşa göre filtreleyin; malzeme, adımlar ve ipuçlarıyla.',
    canonical: SITE + '/etkinlikler',
    body,
  });
}

/* ── ETKİNLİK DETAY ──────────────────────────────────────────── */
function activityDetail(a, prev, next) {
  const c = CAT[a.category] || { ad: a.category, emoji: '' };
  const chips = [
    `<span class="pill">${c.emoji} ${escH(c.ad)}</span>`,
    ...a.ageGroups.map((g) => `<span class="pill pill--blue">${AGE[g] || g}</span>`),
    `<span class="pill pill--amber">⏱ ${a.dur} dakika</span>`,
    a.difficulty ? `<span class="pill">Zorluk: ${DIFF[a.difficulty] || a.difficulty}</span>` : '',
    a.anxFriendly ? `<span class="pill">🌿 Kaygı dostu</span>` : '',
    a.dysc ? `<span class="pill pill--purple">🧩 Diskalkuli dostu</span>` : '',
  ].filter(Boolean).join(' ');

  const steps = a.steps.map((s) => `<div class="step"><div class="step__n">•</div><div><p>${escH(s)}</p></div></div>`).join('\n');
  const materials = (a.materials || []).map((m) => `<li>${escH(m)}</li>`).join('');
  const outcomes = (a.tymm_outcomes || []).map((o) => `<span class="tag">${escH(o)}</span>`).join(' ');
  const tags = (a.tags || []).map((t) => `<span class="tag">#${escH(t)}</span>`).join(' ');

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: a.title,
    description: a.desc,
    totalTime: `PT${a.dur}M`,
    inLanguage: 'tr',
    supply: (a.materials || []).map((m) => ({ '@type': 'HowToSupply', name: m })),
    step: a.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  });

  const body = `
  <article class="section" style="padding-top:1.6rem">
    <div class="container container--narrow">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › <a href="/etkinlikler">Etkinlikler</a> › ${escH(a.title)}</nav>
      <div style="font-size:3.4rem;margin:1rem 0 .3rem" aria-hidden="true">${a.emoji}</div>
      <h1>${escH(a.title)}</h1>
      <p class="lead mt-2">${escH(a.desc)}</p>
      <div class="flex wrap gap mt-3">${chips}</div>

      <div class="grid grid-2 mt-4" style="align-items:start">
        <div class="card">
          <h3>🧰 Malzemeler</h3>
          ${materials ? `<ul class="prose mt-2">${materials}</ul>` : '<p class="muted mt-2">Özel malzeme gerekmez.</p>'}
          ${a.sesAlt ? `<div class="note note--green mt-3"><span class="ni" aria-hidden="true">♻️</span><div><strong>Her bütçeye uygun:</strong> ${escH(a.sesAlt)}</div></div>` : ''}
        </div>
        <div class="card">
          <h3>🎯 Nasıl yapılır?</h3>
          <div class="steps mt-2">${steps}</div>
        </div>
      </div>

      <div class="note note--amber mt-4"><span class="ni" aria-hidden="true">💡</span><div><strong>Koçluk ipucu:</strong> ${escH(a.tip)}</div></div>

      ${outcomes ? `<div class="mt-4"><div class="eyebrow">TYMM kazanımları</div><div class="flex wrap gap">${outcomes}</div></div>` : ''}
      ${tags ? `<div class="mt-3 flex wrap gap">${tags}</div>` : ''}

      <div class="hero-cta mt-4">
        <a class="btn btn-accent btn-lg" href="/etkinlikler/${a.id}.pdf" download><span aria-hidden="true">⬇</span> PDF olarak indir</a>
        <a class="btn btn-primary btn-lg" href="/app/">Uygulamada aç →</a>
        <a class="btn btn-ghost btn-lg" href="/etkinlikler">← Tüm etkinlikler</a>
      </div>
      <p class="muted mt-2" style="font-size:.85rem">Yazdırılabilir A4 etkinlik kartı — malzeme, adımlar ve ipucu tek sayfada.</p>

      <nav class="prevnext mt-4" aria-label="Etkinlikler arası gezinme">
        ${prev ? `<a href="/etkinlikler/${prev.id}" class="pn"><span class="muted">← Önceki</span><strong>${prev.emoji} ${escH(prev.title)}</strong></a>` : '<span></span>'}
        ${next ? `<a href="/etkinlikler/${next.id}" class="pn pn-r"><span class="muted">Sonraki →</span><strong>${next.emoji} ${escH(next.title)}</strong></a>` : '<span></span>'}
      </nav>
    </div>
  </article>`;

  return page({
    title: `${a.title} — Evde Matematik Etkinliği | ABMATO`,
    desc: `${a.desc} ${a.ageGroups.map((g) => AGE[g]).join(', ')} için, ${a.dur} dakika. Malzemeler, adım adım yönerge ve koçluk ipucu.`,
    canonical: `${SITE}/etkinlikler/${a.id}`,
    body,
    jsonld,
  });
}

/* ── BECERİ KÖPRÜSÜ ──────────────────────────────────────────── */
function skillBridge() {
  const byBolum = {};
  for (const m of SB_MODULLER) (byBolum[m.bolum] = byBolum[m.bolum] || []).push(m);

  const sections = Object.entries(SB_BOLUM_META).map(([key, meta]) => {
    const mods = (byBolum[key] || []).sort((a, b) => a.sira - b.sira);
    if (!mods.length) return '';
    const cards = mods.map((m) => {
      const adimlar = (m.adimlar || []).map((s) => `<div class="step"><div class="step__n">${s.no}</div><div><p>${escH(s.eylem)}</p></div></div>`).join('');
      const sorular = (m.sorular || []).map((q) => `<li>${escH(q)}</li>`).join('');
      const dikkat = (m.dikkatler || []).map((d) => `<li>${escH(d)}</li>`).join('');
      const zorunlu = (m.araclar?.zorunlu || []).map((x) => `<li>${escH(x)}</li>`).join('');
      return `<details class="acc">
        <summary><span>${m.emoji} ${escH(m.baslik)} <span class="muted" style="font-weight:600">· ${escH(m.altBaslik || '')}</span></span></summary>
        <div class="acc-body">
          <div class="flex wrap gap" style="margin-bottom:.8rem">
            <span class="pill">${(m.siniflar || []).join(', ')}</span>
            <span class="pill pill--amber">⏱ ${m.sure} dk</span>
            ${m.onKosul ? `<span class="pill pill--blue">Ön koşul gerektirir</span>` : ''}
          </div>
          <p><strong>Hedef:</strong> ${escH(m.hedef)}</p>
          ${zorunlu ? `<p class="mt-2"><strong>Malzemeler:</strong></p><ul class="prose">${zorunlu}</ul>` : ''}
          ${m.araclar?.evYapimi ? `<div class="note note--green mt-2"><span class="ni" aria-hidden="true">♻️</span><div><strong>Ev yapımı:</strong> ${escH(m.araclar.evYapimi)}</div></div>` : ''}
          ${adimlar ? `<p class="mt-3"><strong>Adımlar:</strong></p><div class="steps mt-1">${adimlar}</div>` : ''}
          ${sorular ? `<p class="mt-3"><strong>Sorabileceğiniz sorular:</strong></p><ul class="prose">${sorular}</ul>` : ''}
          ${dikkat ? `<p class="mt-3"><strong>Dikkat:</strong></p><ul class="prose">${dikkat}</ul>` : ''}
        </div>
      </details>`;
    }).join('\n');
    return `<section class="section" style="padding-block:2rem">
      <div class="container container--narrow">
        <div class="sb-sec" style="border-left:5px solid ${meta.renk}">
          <span class="eyebrow" style="color:${meta.renk}">${meta.emoji} Bölüm</span>
          <h2>${escH(meta.ad)}</h2>
        </div>
        <div class="mt-3">${cards}</div>
      </div>
    </section>`;
  }).join('\n');

  const body = `
  <section class="section section--tint" style="padding-block:clamp(2.2rem,5vw,3.2rem)">
    <div class="container">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › <a href="/icerik">İçerik</a> › Beceri Köprüsü</nav>
      <div class="section-head" style="margin:1rem 0 0;max-width:820px">
        <span class="eyebrow">${SB_MODULLER.length} modül · Somut → Soyut (CRA)</span>
        <h1>Beceri Köprüsü</h1>
        <p class="lead">Diskalkuli ve tüm öğrenenler için altın standart öğretim dizisi: önce <strong>somut</strong> (elle tutulur), sonra <strong>yarı-somut</strong> (resim), en son <strong>soyut</strong> (sembol). Her modül ev yapımı malzeme alternatifleriyle.</p>
      </div>
    </div>
  </section>
  ${sections}
  <section class="section section--raised">
    <div class="container cta-band"><div class="card">
      <h2>Adımları interaktif takip edin</h2>
      <p class="mt-2">Uygulamada ilerleme kaydı, ön koşul kilidi ve kişisel öneriler de var.</p>
      <div class="hero-cta jcc mt-3"><a class="btn btn-ondark btn-lg" href="/app/">Uygulamayı Aç →</a><a class="btn btn-outline-dark btn-lg" href="/etkinlikler">Etkinlikler</a></div>
    </div></div>
  </section>`;

  return page({
    title: 'Beceri Köprüsü — 20 Adımlı Matematik Modülü (CRA) | ABMATO',
    desc: 'Diskalkuli dostu, somuttan soyuta (CRA) 20 modüllü matematik destek programı: sayı hissi, beşlik/onluk kart, basamak değeri, sayı olguları. Ev yapımı malzemelerle.',
    canonical: SITE + '/beceri-koprusu',
    body,
  });
}

/* ── SAYI SOHBETİ ────────────────────────────────────────────── */
function mathTalk() {
  const sections = MATH_TALK_CONTEXTS.map((ctx) => {
    const items = MATH_TALK_EXTENDED.filter((t) => t.ctx === ctx.id);
    if (!items.length) return '';
    const cards = items.map((t) => `<div class="talk-card">
      <div class="talk-q">${escH(t.soru)}</div>
      <div class="talk-meta"><span class="tag">${escH(t.age)} yaş</span><span class="tag">${escH(t.kategori)}</span></div>
      ${t.neden ? `<div class="talk-why">💡 ${escH(t.neden)}</div>` : ''}
    </div>`).join('\n');
    return `<section class="section" style="padding-block:1.8rem">
      <div class="container">
        <div class="sb-sec" style="border-left:5px solid ${ctx.renk || 'var(--green)'}">
          <span class="eyebrow" style="color:${ctx.renk || 'var(--green-d)'}">${ctx.emoji} Bağlam</span>
          <h2>${escH(ctx.ad)}</h2>
        </div>
        <div class="grid grid-3 mt-3">${cards}</div>
      </div>
    </section>`;
  }).join('\n');

  const body = `
  <section class="section section--tint" style="padding-block:clamp(2.2rem,5vw,3.2rem)">
    <div class="container">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › <a href="/icerik">İçerik</a> › Sayı Sohbeti</nav>
      <div class="section-head" style="margin:1rem 0 0;max-width:820px">
        <span class="eyebrow">${MATH_TALK_EXTENDED.length}+ soru · 6 bağlam</span>
        <h1>Sayı Sohbeti</h1>
        <p class="lead">Matematiği bir “ders” değil, bir sohbet yapın. Mutfakta, yolda, markette — her an bir matematik fırsatı. İşte yaşa ve bağlama göre hazır sorular.</p>
      </div>
      <div class="note note--green reveal" style="max-width:820px"><span class="ni" aria-hidden="true">🧭</span><div><strong>3 adım:</strong> Sor → 3 saniye bekle → genişlet. Cevabı siz vermeyin; çocuk kendi keşfetsin.</div></div>
    </div>
  </section>
  ${sections}
  <section class="section section--raised">
    <div class="container cta-band"><div class="card">
      <h2>Doğru anda doğru soru</h2>
      <p class="mt-2">Uygulama, günün saatine ve bağlama göre size anında sohbet önerir.</p>
      <div class="hero-cta jcc mt-3"><a class="btn btn-ondark btn-lg" href="/app/">Uygulamayı Aç →</a><a class="btn btn-outline-dark btn-lg" href="/ebeveyn">Ebeveyn rehberi</a></div>
    </div></div>
  </section>`;

  return page({
    title: 'Sayı Sohbeti — Günlük Hayatta Matematik Soruları | ABMATO',
    desc: 'Mutfak, yol, market, yatma… 6 bağlamda 35+ hazır matematik sohbeti sorusu. Yaşa göre, “neden işe yarar” açıklamalarıyla. Sor-bekle-genişlet yöntemi.',
    canonical: SITE + '/sayi-sohbeti',
    body,
  });
}

/* ── İÇERİK MERKEZİ (hub) ────────────────────────────────────── */
function hub() {
  const body = `
  <section class="section section--tint" style="padding-block:clamp(2.2rem,5vw,3.2rem)">
    <div class="container">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › İçerik</nav>
      <div class="section-head" style="margin:1rem 0 0;max-width:820px">
        <span class="eyebrow">Tarayıcıda takip edin</span>
        <h1>İçerik merkezi</h1>
        <p class="lead">Uygulamayı indirmeden, doğrudan web sitesinde: etkinlikler, adım adım beceri modülleri ve günlük sohbet soruları — geniş, sade, okunabilir.</p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="grid grid-3">
        <a class="card card-hover" href="/etkinlikler"><div class="card__icon" aria-hidden="true">📚</div><h3>Etkinlik Kütüphanesi</h3><p>${ACTIVITIES.length} etkinlik, 12 kategori. Kategori ve yaşa göre filtreleyin; malzeme + adımlar + ipucu.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/beceri-koprusu"><div class="card__icon" aria-hidden="true">🧱</div><h3>Beceri Köprüsü</h3><p>${SB_MODULLER.length} modül, somuttan soyuta (CRA). Beşlik/onluk kart, basamak değeri, sayı olguları.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/sayi-sohbeti"><div class="card__icon" aria-hidden="true">💬</div><h3>Sayı Sohbeti</h3><p>${MATH_TALK_EXTENDED.length}+ hazır soru, 6 bağlam. Günlük anları matematik sohbetine dönüştürün.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/akademi"><div class="card__icon" aria-hidden="true">🎓</div><h3>Ebeveyn Akademisi</h3><p>${ACADEMY.length} kısa, kanıt temelli ders: kaygı, otonomi, CRA, çalışma belleği.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/hikayeler"><div class="card__icon" aria-hidden="true">🌟</div><h3>Başarı Hikayeleri</h3><p>${STORIES.length} gerçek ailenin evde matematik deneyimi — Erzurum'dan Van'a.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/diskalkuli"><div class="card__icon" aria-hidden="true">🔍</div><h3>Diskalkuli Rehberi</h3><p>Kırmızı bayraklar, alt-tipler ve RAMDEVU yönlendirmesi.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/ozellikler"><div class="card__icon" aria-hidden="true">🧠</div><h3>Tüm Özellikler</h3><p>Oyunlar, akademi, planlayıcı, öğretmen köprüsü ve daha fazlası.</p><p class="mt-2"><strong>Aç →</strong></p></a>
        <a class="card card-hover" href="/app/"><div class="card__icon" aria-hidden="true">📲</div><h3>Uygulama Olarak</h3><p>Telefona ekleyin: çevrimdışı çalışır, ilerleme takibi ve kişisel öneriler.</p><p class="mt-2"><strong>Uygulamayı Aç →</strong></p></a>
      </div>
    </div>
  </section>`;

  return page({
    title: 'İçerik Merkezi — Etkinlikler, Beceri Köprüsü, Sohbet | ABMATO',
    desc: 'ABMATO içeriğini tarayıcıda takip edin: 109 etkinlik, 20 beceri modülü ve sohbet kartları. İndirmeden, geniş ve sade web sayfalarıyla.',
    canonical: SITE + '/icerik',
    body,
  });
}

/* ── EBEVEYN AKADEMİSİ ───────────────────────────────────────
   Not: Bu içerik App.js içinde inline tanımlı (export edilmemiş);
   buraya birebir kopyalandı. Güncellenirse iki yerde de değişmeli. */
const ACADEMY = [
  { emoji: '💡', title: 'Matematik Neden Önemli?', sub: 'Günlük hayattan örnekler', dur: '8 dk', level: 1,
    text: `Matematik çocuğunuzun dünyayı anlamlandırma biçimidir — sınav notu değil. Araştırmalar, matematiği günlük bağlamda (mutfak, market, park) deneyimleyen çocukların okul matematiğinde çok daha güçlü bir temel kurduğunu göstermektedir (Lave, 1988; Freudenthal, 1991). Ebeveynin rolü öğretmek değil, merak ortamı oluşturmaktır. "Kaç tane?" diye soran bir ebeveyn, en etkili matematik eğitimini veriyordur.` },
  { emoji: '❤️', title: 'Kaygıyı Tanıyın', sub: 'Sizden çocuğunuza ne geçer?', dur: '10 dk', level: 1,
    text: `Ebeveyn matematik kaygısı çocuğa doğrudan geçmez — ama ebeveynin davranışları aracılığıyla etkiler. Beilock ve Maloney (2015), yüksek matematik kaygılı ebeveynlerin çocuklarıyla daha fazla ödev yardımı yaptıklarında çocukların daha düşük başarı gösterdiğini bulmuştur. Neden? Kaygılı ebeveyn, farkında olmadan kontrol edici ve olumsuz geri bildirim veriyor. Çözüm: Kendi kaygınızı çocuğunuza değil, bir not defterine söyleyin. "Ben de bazen matematikten çekiniyordum — ama birlikte bakalım" cümlesi, kaygıyı normalleştirir ve birlikteliği güçlendirir.` },
  { emoji: '🌱', title: 'Otonomi Destekleyici Olmak', sub: 'Baskı değil, keşif ortamı', dur: '12 dk', level: 2,
    text: `Özerklik destekleyici ebeveyn, cevabı değil soruyu sunar. "Kaç tane?" yerine "Nasıl buldun?" sorusu, çocuğun düşünme sürecini görünür kılar. Pomerantz ve arkadaşları (2005) şunu bulmuştur: Cevabı veren değil, süreci sorgulayan ebeveynlerin çocukları matematik öz-yeterliği açısından çok daha güçlüdür. Deneyin: Bu hafta matematikte tek bir şey söyleyin — "Hmm, emin misin?" Geri kalan her şeyi çocuğa bırakın.` },
  { emoji: '🏠', title: 'Ev Ortamı Nasıl Düzenlenmeli?', sub: 'Matematik köşesi oluşturun', dur: '8 dk', level: 2,
    text: `"Home Learning Environment" (HLE) araştırmaları, fiziksel düzenlemenin değil günlük etkileşim kalitesinin belirleyici olduğunu göstermektedir (Melhuish ve ark., 2008). Pahalı materyallere gerek yok. Sayıları günlük hayatta gösteren bir ebeveyn, özel ders veren bir ebeveynden çok daha etkilidir. Üç somut adım: (1) Sofrada takvimden gün sayın, (2) Markette fiyatları karşılaştırın, (3) Yatarken "bugün kaç tane... gördün?" diye sorun. Bu üç rutin, haftada 30 dakikada matematiksel ev ortamı oluşturur.` },
  { emoji: '🧘', title: 'Kaygıyı Yönetin: Nefes Tekniği', sub: 'Matematik yaparken sakin kalmak', dur: '6 dk', level: 1,
    text: `Çocuğunuzla matematik yaparken gerginleştiğinizde: Derin nefes alın (4 saniye), tutun (4 saniye), verin (6 saniye). Bu tekniği çocuğunuza da öğretin. Araştırma bulgusu: ebeveyn kaygısı azaltılmadan ev aktivitelerinin etkisi sınırlı kalıyor (Cosso et al., 2023).` },
  { emoji: '📱', title: 'Teknolojiyi Akıllıca Kullanın', sub: 'Uygulamalar ve sınırlılıkları', dur: '10 dk', level: 2,
    text: `Dijital matematik oyunları destekleyici olabilir ancak ebeveyn etkileşiminin yerini tutamaz. En etkili yaklaşım: somut deneyim + ebeveyn sorulaması + isteğe bağlı dijital araç. Khan Academy Kids ve Prodigy kanıt temelli seçenekler. Kural: ekrana bakarken ebeveyn yanında sorular sorsun.` },
  { emoji: '🤝', title: 'Öğretmenle İş Birliği', sub: 'Köprü nasıl kurulur?', dur: '8 dk', level: 2,
    text: `Sheldon ve Epstein (2005) aile-okul ortaklıklarının matematik başarısı üzerindeki boylamsal etkisini kanıtlamıştır. Üç somut adım: (1) Dönem başında öğretmene sorun: hangi konular zor, evde nasıl destekleyebilirim? (2) Haftalık kısa not ile iletişimi sürdürün. (3) Çocuğun başarısını değil çabasını paylaşın.` },
  { emoji: '🧭', title: 'Uzamsal Düşünme Neden Önemli?', sub: 'STEM başarısının gizli anahtarı', dur: '10 dk', level: 2,
    text: `5 yaşındaki bir çocuğun zihinsel döndürme becerisi, 6 yaşındaki sayı doğrusu başarısını öngörüyor (Gunderson et al., 2012). Blok oyunu, tangram, harita çizimi — bunların hepsi uzamsal düşünceyi besler. Çocuğun "matematik zekâsı" gerçekte büyük ölçüde uzamsal zekâdır.` },
  { emoji: '♻️', title: 'Her Bütçeye Uygun Matematik', sub: 'Fırsat eşitliği ve ev ortamı', dur: '7 dk', level: 1,
    text: `Düşük sosyoekonomik düzeyli ailelerin çocukları evde matematik desteği alınca başarı farkı kapanıyor (Verdine ve ark., 2014). Pahalı materyale gerek yok: kuru bakliyat, gazete, yumurta kartonları, kapak ve düğmeler sayma, sınıflama, örüntü ve ölçme için yeterli. En etkili materyal ebeveynin dikkatidir. 5 dakika kaliteli soru-cevap, 1 saatlik desteksiz çalışma kitabından daha etkilidir.` },
  { emoji: '🎯', title: 'Erken Tanılama ve RAM Süreci', sub: 'Ne zaman uzman desteği?', dur: '10 dk', level: 2,
    text: `Diskalkulik çocuklar ilkokuldan itibaren yaşıtlarının gerisinde kalır; zaman ilerledikçe fark artar (Mutlu & Olkun, 2019). Erken tanı bu farkın büyümesini önler. Süreç dört aşamada: (1) FARKINA VARMA — ebeveyn/öğretmen akranlara göre belirgin gerilik gözler. (2) İLK YÖNLENDİRME — sınıf öğretmeniyle konuşun, çocuğun günlük performansını kayıt altına aldırın. (3) RAM BAŞVURUSU — e-Devlet üzerinden Rehberlik ve Araştırma Merkezi'ne randevu alın. Süreç ücretsizdir, 60 gün içinde değerlendirme tamamlanır. (4) BİREYSEL EĞİTİM PLANI — tanı sonrası okuldaki destek eğitim odası ve özel eğitim hizmetlerinden yararlanılır. Tanı koyma yararı: çocuk yaşadığını anlar, ebeveyn nedenleri öğrenir, öğretmen gereksiz müdahalelerden kaçınır, depresyon riski azalır. Kaynak: Diskalkuli Derneği Ebeveyn Rehberi.` },
  { emoji: '🧱', title: 'Somut → Soyut: CRA Yaklaşımı', sub: 'En etkili öğretim sıralaması', dur: '12 dk', level: 2,
    text: `Bilimsel dayanaklı en güçlü yaklaşımlardan biri: Somut → Yarı-Somut → Soyut (CRA, Bruner). Üç aşamada öğretim:\n\n1) SOMUT: Yeni bir kavramı her zaman gerçek nesnelerle başlatın — fasulye, mercimek, lego, kapak, parmak. Örnek: "5+3" için 5 fasulye + 3 fasulye birleştirip sayalım.\n\n2) YARI-SOMUT: Aynı kavram resimlerle modellenir. "5+3" için kağıda 5 daire + 3 daire çizin, birleştirip sayın. Çocuk hem nesneyi görsel olarak hatırlar hem soyuta köprü kurar.\n\n3) SOYUT: Yalnızca sembollerle çalışın: "5 + 3 = 8". Çocuk bu noktaya rahat hissetmeden geçmesin.\n\nÖnemli: Soyuta geçerken bir önceki aşamayı yanında bulundurun — fasulye ve çizimle birlikte semboller. Bu, diskalkulik çocuklarda kalıcılığı önemli ölçüde artırır. Kaynak: Diskalkuli Derneği Ebeveyn Rehberi; Bruner, 1966.` },
  { emoji: '🧠', title: 'Çalışma Belleği Desteği', sub: 'Diskalkulinin merkezindeki zorluk', dur: '10 dk', level: 2,
    text: `Çalışma belleği, beynin "anlık not defteri"dir — bir bilgiyi (örn. 27) zihinde tutarken aynı anda başka bir şey yapma yeteneği (üzerine 8 ekleme). Araştırmalar diskalkulik çocuklarda bu belleğin akranlarından zayıf olduğunu gösteriyor (Geary ve ark., 2012). Bu yüzden çocuk basit gibi görünen işlemleri bile yapmakta zorlanır — sayıyı hatırlayamaz, ortada unutur.\n\nNe yapabilirsiniz?\n\n• İŞLEMİ GÖRSELLEŞTİRİN: "27 + 8" için 27'yi kağıda yazın, çocuk üzerine eklesin — bellek yükü dışarı çıkar.\n\n• PARÇALA: Tek bir uzun işlem yerine küçük parçalara bölün: "Önce 27 + 3 = 30, sonra +5 = 35".\n\n• PARMAKLA SAYMAYI DESTEKLEYİN: Diskalkulili çocuklar için parmak bir tercih değil, çalışma belleğinin yedeği. Engellemeyin.\n\n• TEKRARLAYIN: Aynı tür problemi 4-5 farklı bağlamda yapın (mutfak, market, oyun). Tekrar = pekiştirme = bellek genişletme.\n\n• ZAMAN BASKISI YAPMAYIN: Süre baskısı çalışma belleğini daha da daraltır. "Düşünmen için zamanın var" deyin.\n\nKaynak: Baddeley (2003), Geary ve ark. (2012); Diskalkuli Derneği Ebeveyn Rehberi.` },
];

const STORIES = [
  { emoji: '👩‍🍳', family: 'Erzurum — 2 çocuk', age: '36-48 ay', label: 'Sabırlı Başlangıç',
    story: 'Mutfakta pirinç tanelerini sayarken başladık. İlk hafta 5e kadar sayabiliyordu. Üç ay sonra 30a kadar kolayca sayıyor, beni sınıflandırma hakkında sorularla bunaltıyor.',
    lesson: 'Küçük, tekrarlayan anlar büyük farklılık yaratır.', tag: 'Sayma ve Günlük Hayat' },
  { emoji: '👨‍🔧', family: 'Ankara — 1 çocuk', age: '2. Sınıf', label: 'Market Keşfi',
    story: 'Fişleri birlikte kontrol etmeye başladık. Bir gün marketten 3 TL hata buldu. O günden beri aile muhasebecimiz oldu. Matematik dersindeki tutumu tamamen değişti.',
    lesson: 'Gerçek bağlam içsel motivasyonu besler.', tag: 'Market Matematiği' },
  { emoji: '👩‍🎓', family: 'İzmir — 3 çocuk', age: '48-60 ay', label: 'Farklı Hızlar',
    story: 'Üç çocuğum var, üçü de farklı hızda öğreniyor. Ölçme etkinliklerinde herkes aynı masada farklı şeyler keşfetti. En küçüğü kardeşini izleyerek öğrendi.',
    lesson: 'Karma yaş etkinlikleri herkese kazandırır.', tag: 'Ölçme ve Aile' },
  { emoji: '👨‍👩‍👧', family: 'Konya — Düşük bütçe', age: '1. Sınıf', label: 'Malzeme Değil, Dikkat',
    story: 'Tahta oyuncaklar yoktu. Kuru fasulyeyle saydık, gazete kesimleriyle şekil yaptık. En etkili materyal ebeveynin dikkatidir.',
    lesson: 'Pahalı araca gerek yok — merak her evde var.', tag: 'Her Bütçeye Uygun' },
  { emoji: '👩‍💼', family: 'İstanbul — Çalışan ebeveyn', age: '3. Sınıf', label: '5 Dakika Yeter',
    story: 'Sabah 5 dakikam vardı. Takvime baktık, haftaya kaç gün kaldı. Akşam 5 dakika: fişi kontrol ettik. Haftada 10 toplam dakika. Bir dönem sonra matematik notu 60dan 85e çıktı.',
    lesson: 'Rutinin süresi değil, kalitesi belirler.', tag: 'Zaman Yönetimi' },
  { emoji: '👴', family: 'Trabzon — Büyükbaba', age: 'Okul öncesi', label: 'Kuşaklar Arası',
    story: 'Torunumla bahçede sebze yetiştirdik. Büyüme günlüğü tuttuk, her gün cetvel koyduk. Ben matematik bilmiyorum ama sayıları ve ölçmeyi öğrettim. İkimiz de öğrendik.',
    lesson: 'Matematiği bilmek zorunda değilsiniz — merak etmeniz yeterli.', tag: 'Doğa ve Nesil' },
  { emoji: '👩‍👦', family: 'Diyarbakır — 2 çocuk', age: '1. ve 3. Sınıf', label: 'Dil Köprüsü',
    story: 'Evde Kürtçe konuşuyoruz, okulda Türkçe matematik öğreniyorlar. Sayıları her iki dilde birlikte saydık. Mutfakta ölçerken iki dilli konuştuk. Matematik dili ne olursa olsun aynı — bu bizi çok rahatlattı.',
    lesson: 'Matematik evrensel bir dil — anadil ne olursa desteklemek mümkün.', tag: 'Çok Dilli Aile' },
  { emoji: '👨‍👩‍👦‍👦', family: 'Van — 4 çocuk', age: 'Okul öncesi ve 2. Sınıf', label: 'Kış Matematiği',
    story: "Van'ın kışı uzun, çok dışarı çıkamıyoruz. Pencereden kar tanelerini saydık, sobanın odunlarını grupladık, yemek tariflerini ölçeklendirdik. Ev zaten bir matematik laboratuvarıymış.",
    lesson: 'Her koşulda, her evde matematik var — görmek yeterli.', tag: 'Ev Ortamı' },
];

const para = (text) => escH(text).split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

/* ── EBEVEYN AKADEMİSİ sayfası ───────────────────────────────── */
function academy() {
  const LV = { 1: 'Başlangıç', 2: 'Orta · İleri', 3: 'İleri' };
  const byLevel = { 1: [], 2: [], 3: [] };
  for (const l of ACADEMY) (byLevel[l.level] || (byLevel[l.level] = [])).push(l);

  const sections = [1, 2, 3].map((lvl) => {
    const items = byLevel[lvl] || [];
    if (!items.length) return '';
    const cards = items.map((l) => `<details class="acc">
      <summary><span>${l.emoji} ${escH(l.title)} <span class="muted" style="font-weight:600">· ${escH(l.sub)}</span></span></summary>
      <div class="acc-body">
        <div class="flex wrap gap" style="margin-bottom:.7rem"><span class="pill pill--amber">⏱ ${escH(l.dur)}</span><span class="pill">Seviye ${l.level}</span></div>
        <div class="prose">${para(l.text)}</div>
      </div>
    </details>`).join('\n');
    return `<section class="section" style="padding-block:1.6rem"><div class="container container--narrow">
      <div class="sb-sec" style="border-left:5px solid var(--green)"><span class="eyebrow">${LV[lvl]}</span><h2>${lvl === 1 ? 'Temeller' : lvl === 2 ? 'Derinleşme' : 'Uzmanlaşma'}</h2></div>
      <div class="mt-3">${cards}</div></div></section>`;
  }).join('\n');

  const body = `
  <section class="section section--tint" style="padding-block:clamp(2.2rem,5vw,3.2rem)">
    <div class="container">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › <a href="/icerik">İçerik</a> › Ebeveyn Akademisi</nav>
      <div class="section-head" style="margin:1rem 0 0;max-width:820px">
        <span class="eyebrow">${ACADEMY.length} mikro-ders · 5–12 dakika</span>
        <h1>Ebeveyn Akademisi</h1>
        <p class="lead">Çocuğunuza matematiği sevdiren ebeveyn olmanın kısa, kanıt temelli rehberleri: kaygıyı tanımak, özerklik desteklemek, somuttan soyuta öğretmek ve daha fazlası.</p>
      </div>
    </div>
  </section>
  ${sections}
  <section class="section">
    <div class="container container--narrow">
      <div class="section-head"><span class="eyebrow">Ayrıca</span><h2>İlgili bölümler</h2></div>
      <div class="grid grid-3">
        <a class="card card-hover" href="/diskalkuli"><div class="card__icon" aria-hidden="true">🔍</div><h3>Diskalkuli Rehberi</h3><p>Kırmızı bayraklar ve RAM süreci.</p></a>
        <a class="card card-hover" href="/sayi-sohbeti"><div class="card__icon" aria-hidden="true">💬</div><h3>Sayı Sohbeti</h3><p>Günlük hayatta hazır sorular.</p></a>
        <a class="card card-hover" href="/hikayeler"><div class="card__icon" aria-hidden="true">🌟</div><h3>Başarı Hikayeleri</h3><p>Gerçek ailelerden deneyimler.</p></a>
      </div>
    </div>
  </section>
  <section class="section section--raised">
    <div class="container cta-band"><div class="card">
      <h2>Uygulamada ilerlemeyi kaydedin</h2>
      <p class="mt-2">Tamamladığınız dersleri işaretleyin, kişisel öneriler alın.</p>
      <div class="hero-cta jcc mt-3"><a class="btn btn-ondark btn-lg" href="/app/">Uygulamayı Aç →</a><a class="btn btn-outline-dark btn-lg" href="/ebeveyn">Pratik rehber</a></div>
    </div></div>
  </section>`;

  return page({
    title: 'Ebeveyn Akademisi — Evde Matematik Mikro-Dersleri | ABMATO',
    desc: 'Matematik kaygısı, otonomi desteği, CRA yaklaşımı, çalışma belleği ve RAM süreci üzerine kısa, kanıt temelli ebeveyn dersleri. Tamamen ücretsiz.',
    canonical: SITE + '/akademi',
    body,
  });
}

/* ── BAŞARI HİKAYELERİ sayfası ───────────────────────────────── */
function storiesPage() {
  const cards = STORIES.map((s) => `<article class="card reveal">
    <div class="story__loc">${s.emoji} ${escH(s.family)} · ${escH(s.age)}</div>
    <h3 style="margin:.35rem 0 .55rem">${escH(s.label)}</h3>
    <p style="font-style:italic;color:var(--ink-2);line-height:1.6">“${escH(s.story)}”</p>
    <div class="note note--green mt-2" style="padding:.7rem .9rem"><span class="ni" aria-hidden="true">💡</span><div><strong>Çıkarım:</strong> ${escH(s.lesson)}</div></div>
    <div class="mt-2"><span class="tag">${escH(s.tag)}</span></div>
  </article>`).join('\n');

  const body = `
  <section class="section section--tint" style="padding-block:clamp(2.2rem,5vw,3.2rem)">
    <div class="container">
      <nav class="crumb" aria-label="Konum"><a href="/">Ana sayfa</a> › <a href="/icerik">İçerik</a> › Başarı Hikayeleri</nav>
      <div class="section-head" style="margin:1rem 0 0;max-width:820px">
        <span class="eyebrow">Sahadan · ${STORIES.length} aile</span>
        <h1>Başarı hikayeleri</h1>
        <p class="lead">Erzurum'dan Van'a, farklı bütçe ve dillerden ailelerin ortak keşfi: başarıyı getiren pahalı materyal ya da özel ders değil, ebeveynin tutumu ve merakı.</p>
      </div>
      <div class="note note--amber reveal" style="max-width:820px"><span class="ni" aria-hidden="true">📌</span><div>Hikayeler, alan araştırmalarından (Muir 2012; Skwarchuk 2009; Knapp ve ark. 2017) uyarlanmıştır; tipik aile deneyimlerini temsil eder.</div></div>
    </div>
  </section>
  <section class="section">
    <div class="container"><div class="grid grid-3">${cards}</div></div>
  </section>
  <section class="section section--green">
    <div class="container container--narrow text-center">
      <h2>Sıradaki hikaye sizinki olsun</h2>
      <p class="lead" style="margin-inline:auto">Bugün 5 dakika ayırın; gelir ya da eğitim düzeyinden bağımsız, her aile çocuğunda olumlu matematik tutumu geliştirebilir.</p>
      <div class="hero-cta jcc mt-3"><a class="btn btn-ondark btn-lg" href="/etkinlikler">İlk etkinliği seçin →</a><a class="btn btn-outline-dark btn-lg" href="/app/">Uygulamayı Aç</a></div>
    </div>
  </section>`;

  return page({
    title: 'Başarı Hikayeleri — Gerçek Ailelerden | ABMATO',
    desc: "Erzurum'dan Van'a 8 ailenin evde matematik deneyimi. Bütçe, dil ya da zaman fark etmeksizin: belirleyici olan ebeveynin tutumu.",
    canonical: SITE + '/hikayeler',
    body,
  });
}

/* ── Ana üretim fonksiyonu ───────────────────────────────────── */
export async function generateContent(DIST) {
  const routes = [];
  const write = async (rel, html) => { await writeFile(join(DIST, rel), html, 'utf8'); };

  await write('icerik.html', hub());
  routes.push('/icerik');
  await write('etkinlikler.html', activitiesIndex());
  routes.push('/etkinlikler');
  await write('beceri-koprusu.html', skillBridge());
  routes.push('/beceri-koprusu');
  await write('sayi-sohbeti.html', mathTalk());
  routes.push('/sayi-sohbeti');
  await write('akademi.html', academy());
  routes.push('/akademi');
  await write('hikayeler.html', storiesPage());
  routes.push('/hikayeler');

  await mkdir(join(DIST, 'etkinlikler'), { recursive: true });
  for (let i = 0; i < ACTIVITIES.length; i++) {
    const a = ACTIVITIES[i];
    await write(`etkinlikler/${a.id}.html`, activityDetail(a, ACTIVITIES[i - 1], ACTIVITIES[i + 1]));
    routes.push(`/etkinlikler/${a.id}`);
  }

  return routes;
}
