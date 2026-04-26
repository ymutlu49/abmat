/* ══════════════════════════════════════════════════════════
   ABMAT — StrategyView
   Diskalkuli için kanıt-temelli strateji modülleri:
     • make10        — 10'a tamamlama (toplama olgu hatırlama)
     • doubles       — İkilemeler ve neredeyse ikilemeler
     • finger_count  — Yapılandırılmış parmak sayma (5-6 yaş)
     • chunking      — Çalışma belleği için parçalama
     • count_on      — Daha büyük sayıdan başlayarak sayma
   Her modül: kısa açıklama, adım adım uygulama, ebeveyn ipucu,
   "şimdi dene" interaktif mini görev.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

const STRATEGIES = [
  {
    id: 'make10',
    emoji: '🔟',
    title: '10\'a Tamamlama',
    sub: 'Toplama olgularını ezbersiz hatırlama',
    target: 'fact_retrieval',
    age: '6-9 yaş',
    why: 'Çocuk 8+5 sorusunu, 8+2+3 olarak parçalayıp önce 10\'a, sonra 13\'e ulaşır. Bu zihinsel yeniden yapılandırma, her olguyu ezberlemekten daha az bellek yükü gerektirir.',
    evidence: 'Fuson (1992); Singapore Math metodolojisi; NCTM Strategy-First.',
    steps: [
      { eylem: 'Onluk çerçeve (10\'luk yumurta kartonu) çıkarın. Üst sıra 5, alt sıra 5.', ipucu: 'Görsel anchor önemli — her sayıyı görerek öğrensin.' },
      { eylem: 'Çocuğa "8 + 5 = ?" sorusunu yazın. 8 boncuğu çerçeveye yerleştirin (üst sıra dolu, alt sırada 3).', ipucu: 'Soruyu görsel olarak temsil edin.' },
      { eylem: '"5\'i nasıl bölelim ki 10\'a tamamlayalım?" diye sorun. Çocuk 2+3 olduğunu görsün.', ipucu: 'Cevabı söylemeyin — çocuk 5\'in 2 ve 3\'e bölünebileceğini fark etsin.' },
      { eylem: '2 boncuğu üst sıraya, 3 boncuğu alt sıraya yerleştirin. "Şimdi 10 ve 3 var = 13" deyin.', ipucu: 'Toplam sembolik olarak yazın.' },
      { eylem: '6+7, 9+4, 8+6 ile tekrarlayın. Her seferinde önce çerçeve, sonra zihin.', ipucu: '5 örnek sonra çerçeveyi kaldırın — zihinsel görselleştirme yeterli.' },
    ],
    practice: { type: 'make10', items: [[8,5],[7,5],[9,4],[8,6],[7,6]] },
    parentTip: 'Bu beceri 4-5 hafta sürer. Her gün 5 dakika yeterli. Hızlanma istemek yerine "nasıl yaptın?" sorusunu sorun.',
  },
  {
    id: 'doubles',
    emoji: '👥',
    title: 'İkilemeler ve Yakın İkilemeler',
    sub: 'Aynı sayının kendisiyle toplamı + 1',
    target: 'fact_retrieval',
    age: '6-8 yaş',
    why: '4+4=8, 5+5=10, 6+6=12 gibi ikilemeler en kolay öğrenilen olgulardır. Sonra 4+5 = (4+4)+1 olarak çıkarılır. Çocuk az sayıda olguyu ezberleyip diğerlerini türetir.',
    evidence: 'Baroody (2006); Carpenter & Moser (1984).',
    steps: [
      { eylem: 'Aynı renk iki kart serisi (1+1, 2+2, ..., 10+10) hazırlayın. Her gün 3 tanesini gösterin.', ipucu: 'Görsel olarak simetrik temsil edin.' },
      { eylem: 'Çocuk ikilemeleri akıcı söyleyince "yakın ikileme" tanıtın: 4+5 nedir? "4+4 ne?" diye sorun.', ipucu: 'Bağlantıyı kuran soruyu sorun.' },
      { eylem: '"4+4 = 8 ise, 4+5 = 8+1 = 9" diyaloğunu kurun. Zihinsel matematiği sesli düşünün.', ipucu: 'Stratejiyi sesli düşünme ile modelleyin.' },
      { eylem: '5 yakın-ikileme örneği yapın: 3+4, 5+6, 6+7, 7+8, 8+9.', ipucu: 'Aynı oturumda her tipten az.' },
    ],
    practice: { type: 'doubles', items: [[4,4],[3,4],[5,5],[6,7],[8,9]] },
    parentTip: 'İkileme bilmesi diğer toplam olgularını "türetmesini" sağlar — 100 olguyu ezberleme yükü %50 azalır.',
  },
  {
    id: 'finger_count',
    emoji: '🖐️',
    title: 'Yapılandırılmış Parmak Sayma',
    sub: 'Parmaklar matematiğin ilk somut aracı',
    target: 'number_sense',
    age: '4-7 yaş',
    why: 'Araştırma: Açık parmak sayma eğitimi alan 5-6 yaş çocukların aritmetik başarısı %33\'ten %75\'e çıkıyor (SRCD, 2024). Parmak NumNum, sayı temsilinin doğal somut aracıdır.',
    evidence: 'Berteletti & Booth (2024); Reeve & Humberstone (2011).',
    steps: [
      { eylem: 'Çocuğun her iki elini düz tutmasını sağlayın. "Bu beş, bu da beş, toplam on" deyin.', ipucu: '5 anchor olarak görmesini sağlayın.' },
      { eylem: '"3 göster" deyin. Sol elden 3 parmak. "Şimdi 2 daha ekle". Toplamı parmaklara bakarak söylesin.', ipucu: 'Parmaktan parmağa geçişi gösterin.' },
      { eylem: 'Sol el = ilk sayı, sağ el = eklenen. Toplam = açık parmak sayısı. Bu kuralı tekrarlayın.', ipucu: 'Düzenli yapı kural haline gelir.' },
      { eylem: '"5\'ten büyük" durumlarda anchor: 7 = "tam el (5) + 2 parmak". Bu chunking subitizing\'i destekler.', ipucu: '5\'i tam el olarak gösterin — kademe atlamasını öğretin.' },
    ],
    practice: { type: 'finger', items: [[3,2],[4,3],[5,4],[6,2],[3,5]] },
    parentTip: 'Parmak sayma "geride kalmak" değil — ZORUNLU bir ara basamaktır. Çocuk 8 yaşında bile parmağa ihtiyaç duyabilir; yasaklamayın.',
  },
  {
    id: 'count_on',
    emoji: '➕',
    title: 'Büyükten Saymaya Başla',
    sub: '3+8, "8\'den başlayıp 3 ekle" mantığı',
    target: 'fact_retrieval',
    age: '5-7 yaş',
    why: 'Toplamada büyük sayıdan başlamak (count-on) sayma adımını azaltır. 8+3 için 1\'den 11\'e saymak yerine 8 → 9, 10, 11 demek (3 adım). Bilişsel yük yarıya iner.',
    evidence: 'Carpenter & Moser (1984); Geary (2011).',
    steps: [
      { eylem: '3+8 sorusunda "hangi sayı daha büyük?" diye sorun. Çocuk 8\'i seçsin.', ipucu: 'Karar vermeyi çocuğa bırakın.' },
      { eylem: '"8\'den başlayalım. 8... 9, 10, 11. Demek ki 3+8=11" sürecini sesli yapın.', ipucu: 'Parmak veya boncukla destekleyin.' },
      { eylem: 'Tersini deneyin: 1+9. Çocuk büyüğünden başlasın: 9, 10. Cevap 10.', ipucu: '"Başlamak için en kolay yer neresi?" sorun.' },
    ],
    practice: { type: 'count_on', items: [[2,9],[3,8],[1,7],[4,6],[3,5]] },
    parentTip: '"Önce büyük, sonra say" kuralı oldukça kalıcıdır. Ev içi rutinde tekrarlayın.',
  },
  {
    id: 'chunking',
    emoji: '🧩',
    title: 'Çalışma Belleği için Parçalama',
    sub: 'Adım adım yaz, kafanda tutma',
    target: 'working_memory',
    age: '7-10 yaş',
    why: 'Diskalkuli görsel-uzamsal çalışma belleği zayıflığıyla ilişkilidir. Adımları yazılı olarak parçalamak, ara sonuçları "kafada tutma" yükünü kaldırır.',
    evidence: 'Raghubar et al. (2010); CRA metodolojisi.',
    steps: [
      { eylem: '47+28 problemini al. Tek satıra yazma; iki satıra basamak ayrı yaz: birler altta, onlar üstte.', ipucu: 'Sütunları renklendirebilirsiniz.' },
      { eylem: 'Önce birler: 7+8=15. "5 yaz, 1 elde." 1\'i onlar sütununun üstüne koyun.', ipucu: 'Eldeyi farklı renkle yazın.' },
      { eylem: 'Sonra onlar: 4+2+1 (elde) = 7. Cevap: 75.', ipucu: 'Adımları seslendirin.' },
      { eylem: '3-4 örnek tekrarlayın. Kademeli olarak yazma yükünü azaltın (önce sütun, sonra zihinsel).', ipucu: 'Asla zaman baskısı koymayın.' },
    ],
    parentTip: 'Bu strateji çalışma belleği zayıflığını telafi eder — yazılı destek yardım değil, gerekli iskelet.',
  },
];

export class StrategyView extends BaseView {
  static all(){ return STRATEGIES; }
  static get(id){ return STRATEGIES.find(s => s.id === id); }

  static render(app){
    const el = document.getElementById('strategies-body');
    if(!el) return;
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(13,148,136,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(13,148,136,.2)">
        <h3 style="margin-bottom:.4rem">🛠️ Strateji Kütüphanesi</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Ezber yerine strateji. Diskalkuli için araştırma kanıtı en güçlü yaklaşım: az sayıda olguyu öğrenip diğerlerini stratejiyle türetmek. <em style="font-size:var(--t-xs)">(Baroody, 2006; NCTM)</em></p>
      </div>

      <div style="display:flex;flex-direction:column;gap:.6rem">
        ${STRATEGIES.map(s => `
          <div class="card">
            <div class="card-body">
              <div style="display:flex;align-items:flex-start;gap:.85rem;margin-bottom:.5rem">
                <span style="font-size:2rem">${s.emoji}</span>
                <div style="flex:1">
                  <strong style="font-size:var(--t-lg);display:block">${s.title}</strong>
                  <p class="muted" style="font-size:var(--t-sm);margin-top:.15rem">${s.sub} · ${s.age}</p>
                </div>
                <button class="btn btn-soft btn-sm" onclick="App._strategyOpen('${s.id}')" aria-label="Aç ${s.title}">Aç →</button>
              </div>
              <p style="font-size:var(--t-sm);color:var(--text2);line-height:1.55">${s.why}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /** Tek bir stratejiyi modal/inline detay olarak aç */
  static renderDetail(app, id){
    const s = STRATEGIES.find(x => x.id === id);
    const el = document.getElementById('strategies-body');
    if(!s || !el) return;
    const ttsBtn = app._a11y ? app._a11y.ttsButton(s.title + '. ' + s.why) : '';
    el.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="App._strategyClose()" style="margin-bottom:.6rem">← Geri</button>
      <div class="card">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:.85rem;margin-bottom:.6rem">
            <span style="font-size:2.5rem">${s.emoji}</span>
            <div style="flex:1"><h3 style="margin:0">${s.title}</h3><p class="muted" style="font-size:var(--t-sm);margin:.1rem 0 0">${s.sub}</p></div>
            ${ttsBtn}
          </div>
          <p style="font-size:var(--t-md);line-height:1.65;margin-bottom:.8rem">${s.why}</p>
          <p class="muted" style="font-size:var(--t-xs);margin-bottom:.8rem"><strong>Kanıt:</strong> ${s.evidence}</p>

          <div class="sec-header"><span class="sec-title">📋 Adım Adım</span></div>
          <ol style="padding-left:1.2rem;display:flex;flex-direction:column;gap:.6rem;margin-bottom:.9rem">
            ${s.steps.map(st => `
              <li style="line-height:1.55">
                <strong>${st.eylem}</strong>
                ${st.ipucu ? `<p class="muted" style="font-size:var(--t-sm);margin:.2rem 0 0">💡 ${st.ipucu}</p>` : ''}
              </li>
            `).join('')}
          </ol>

          ${s.practice ? `
            <div class="sec-header"><span class="sec-title">🎯 Şimdi Dene</span></div>
            <p class="muted" style="font-size:var(--t-sm);margin-bottom:.5rem">Bu stratejiyle çocuğunuzla aşağıdaki örnekleri çözün.</p>
            <div style="display:flex;flex-wrap:wrap;gap:.45rem;margin-bottom:.85rem">
              ${s.practice.items.map(([a,b]) => `<span class="chip" style="font-size:var(--t-md);padding:.5rem .7rem;font-weight:800;font-feature-settings:'tnum'">${a} + ${b} = ?</span>`).join('')}
            </div>
          ` : ''}

          <div style="background:rgba(255,209,102,.15);border-radius:var(--r-md);padding:.7rem .9rem;border:1.5px solid rgba(255,209,102,.3)">
            <strong style="color:#92600A;font-size:var(--t-md)">👨‍👩‍👧 Ebeveyn İpucu</strong>
            <p style="font-size:var(--t-sm);line-height:1.55;margin-top:.3rem">${s.parentTip}</p>
          </div>

          <button class="btn btn-blue btn-block" style="margin-top:.85rem" onclick="App._strategyComplete('${s.id}')">✓ Bu Stratejiyi Denedim</button>
        </div>
      </div>
    `;
  }
}
