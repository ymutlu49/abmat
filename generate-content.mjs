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
    return `<a class="ac-card" href="/etkinlikler/${a.id}" data-cat="${a.category}" data-age="${ages}" data-text="${text}">
      <span class="ac-emoji" aria-hidden="true">${a.emoji}</span>
      <span class="ac-cat">${CAT[a.category]?.emoji || ''} ${escH(CAT[a.category]?.ad || a.category)}</span>
      <h3>${escH(a.title)}</h3>
      <p>${escH(a.desc)}</p>
      <div class="ac-meta">${a.ageGroups.map((g) => `<span class="tag">${AGE_SHORT[g] || g}</span>`).join('')}<span class="tag">⏱ ${a.dur} dk</span>${a.anxFriendly ? '<span class="tag tag-ok">🌿 kaygı dostu</span>' : ''}</div>
    </a>`;
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
        <p class="lead">Her etkinlik; malzeme listesi, adım adım yönerge, “nasıl soracağım?” ipucu ve TYMM kazanım etiketleriyle. Çoğu evde bulunan malzemelerle, 5–20 dakikada.</p>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:1.5rem">
    <div class="container">
      <div class="filterbar">
        <input type="search" id="ac-search" class="fsearch" placeholder="🔎 Etkinlik ara… (ör. kesir, market, sayma)" aria-label="Etkinlik ara">
        <div class="fchips" role="group" aria-label="Kategori filtresi">
          <button type="button" class="fchip is-active" data-filter-cat="all">Tümü</button>
          ${catButtons}
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
    var grid=document.getElementById('ac-grid'), cards=[].slice.call(grid.querySelectorAll('.ac-card'));
    var search=document.getElementById('ac-search'), count=document.getElementById('ac-count'), empty=document.getElementById('ac-empty');
    var cat='all';
    function apply(){
      var q=(search.value||'').trim().toLowerCase(), n=0;
      cards.forEach(function(c){
        var okCat = cat==='all' || c.getAttribute('data-cat')===cat;
        var okText = !q || c.getAttribute('data-text').indexOf(q)>-1;
        var show = okCat && okText;
        c.style.display = show ? '' : 'none';
        if(show) n++;
      });
      count.textContent = n + ' etkinlik gösteriliyor';
      empty.style.display = n? 'none':'block';
    }
    document.querySelectorAll('[data-filter-cat]').forEach(function(b){
      b.addEventListener('click', function(){
        document.querySelectorAll('[data-filter-cat]').forEach(function(x){x.classList.remove('is-active')});
        b.classList.add('is-active'); cat=b.getAttribute('data-filter-cat'); apply();
      });
    });
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
        <a class="btn btn-primary btn-lg" href="/app/">Uygulamada interaktif aç →</a>
        <a class="btn btn-ghost btn-lg" href="/etkinlikler">← Tüm etkinlikler</a>
      </div>

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

  await mkdir(join(DIST, 'etkinlikler'), { recursive: true });
  for (let i = 0; i < ACTIVITIES.length; i++) {
    const a = ACTIVITIES[i];
    await write(`etkinlikler/${a.id}.html`, activityDetail(a, ACTIVITIES[i - 1], ACTIVITIES[i + 1]));
    routes.push(`/etkinlikler/${a.id}`);
  }

  return routes;
}
