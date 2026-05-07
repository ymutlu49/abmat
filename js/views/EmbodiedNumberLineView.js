/* ══════════════════════════════════════════════════════════
   ABMATO — EmbodiedNumberLineView
   "Yer sayı doğrusu" etkinlik kartı: çocuk yere çizilmiş sayı
   doğrusu üzerinde fiziksel olarak yürüyerek tahmin yapar.
   Kanıt: Fischer vd. (2011); Walk the Number Line — embodied
   training ile diskalkulili çocukların aktivasyon paterni
   tipik gelişen çocuklara yaklaşıyor.

   Bu sayfa interaktif değil — yapılandırılmış ev etkinliği rehberi.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

const STAGES = [
  {
    no: 1,
    baslik: 'Hazırlık (5 dk)',
    icon: '📏',
    adimlar: [
      'Koridor veya geniş bir oda seçin (en az 4 metre).',
      'Tebeşir, kâğıt bant veya halat ile yere uzun bir çizgi çekin.',
      'Sol ucuna 0, sağ ucuna 10 (ileride 100) yazın.',
      'Ortayı (5) işaretleyin. Çocuğa "ortası nerede?" diye sorun.',
    ],
  },
  {
    no: 2,
    baslik: 'Beden ile Tanıma (5 dk)',
    icon: '🚶',
    adimlar: [
      'Çocuk 0\'dan başlasın. "1\'e gel" deyin — yürüsün.',
      '"Şimdi 5\'e git" — çocuk büyük adımlarla orta noktaya gitsin.',
      '"6 ile 7 arasında dur" — kademe kavrama.',
      'Her durakta "neredesin?" sorun, çocuk söylesin.',
    ],
  },
  {
    no: 3,
    baslik: 'Tahmin Oyunu (10 dk)',
    icon: '🎯',
    adimlar: [
      'Bir sayı seçin (örn. 7). "Sence 7 nerede?" — çocuk yürüyüp dursun.',
      'Hata olursa düzeltmeyin. "Kontrol edelim mi?" deyin, birlikte sayın.',
      '8-10 farklı sayı tekrarlayın.',
      'Geri dönerken sayıları tersten söyleyin (10, 9, 8...) — esnek sayma.',
    ],
  },
  {
    no: 4,
    baslik: 'Genişletme: 0-100 (15 dk)',
    icon: '📐',
    adimlar: [
      'Çizgiyi yeniden çizin: 0 ve 100 uçlara, 50 orta.',
      '10\'ar aralıklarla işaretleyin (10, 20, 30...).',
      '"23 nerede?" gibi sorular sorun. Çocuk 20 ile 30 arası bir noktaya gitsin.',
      'Çocuk 23\'ü bulduktan sonra "neden orada?" deyin — referans noktalarını söyletin.',
    ],
  },
  {
    no: 5,
    baslik: 'Pekiştirme (her hafta)',
    icon: '🔄',
    adimlar: [
      'Bu etkinlik haftada 2-3 kez tekrarlanmalı.',
      'Her seferinde "yeni kural" ekleyin: tek sayılar, çift sayılar, 5\'in katları.',
      'İleri seviye: "5+3 nerededir?" → çocuk 5\'e gidip 3 adım daha atar.',
      'Sayı doğrusunu tahta veya kâğıda da çizin — embodied → görsel transfer.',
    ],
  },
];

export class EmbodiedNumberLineView extends BaseView {
  static render(app){
    const el = document.getElementById('embodied-body');
    if(!el) return;
    const ttsBtn = app._a11y ? app._a11y.ttsButton('Yer sayı doğrusu etkinliği. Çocuğunuz yere çizilmiş bir sayı doğrusunda yürüyerek tahmin yapar.') : '';
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.1),rgba(13,148,136,.04));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(13,148,136,.25)">
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem">
          <span style="font-size:2rem">🚶‍♂️</span>
          <h3 style="margin:0">Yer Sayı Doğrusu (Embodied)</h3>
          ${ttsBtn}
        </div>
        <p style="font-size:var(--t-md);line-height:1.6">Yere çizilmiş sayı doğrusunda çocuk fiziksel olarak yürür. Beden + zihin birlikte çalışır — bilişsel kalıcılık artar. Diskalkulili çocuklarda en güçlü etki gözlenen yöntemlerden biri. <em style="font-size:var(--t-xs)">(Fischer vd., 2011; ScienceDirect, 2013)</em></p>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.55rem">
          <span class="chip chip-blue">5-9 yaş</span>
          <span class="chip chip-green">35-40 dk toplam</span>
          <span class="chip chip-orange">Haftada 2-3 kez</span>
          <span class="chip">Materyal: tebeşir/bant + alan</span>
        </div>
      </div>

      <!-- Aşamalar -->
      <div style="display:flex;flex-direction:column;gap:.7rem;margin-bottom:1rem">
        ${STAGES.map(s => `
          <div class="card">
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:.7rem;margin-bottom:.55rem">
                <span style="background:var(--teal);color:#fff;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center">${s.no}</span>
                <span style="font-size:1.4rem">${s.icon}</span>
                <strong style="font-size:var(--t-lg);flex:1">${s.baslik}</strong>
              </div>
              <ul style="padding-left:1.2rem;display:flex;flex-direction:column;gap:.35rem">
                ${s.adimlar.map(a => `<li style="font-size:var(--t-sm);line-height:1.55">${a}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="background:rgba(255,209,102,.15);border-radius:var(--r-md);padding:.8rem 1rem;border:1.5px solid rgba(255,209,102,.3);margin-bottom:1rem">
        <strong style="color:#92600A;font-size:var(--t-md)">⚠️ Önemli</strong>
        <p style="font-size:var(--t-sm);line-height:1.55;margin-top:.3rem">
          Yanlış tahminde "düzeltme" yerine "kontrol et" deyin. Süreç, sonuçtan önemlidir.
          Çocuk kendi hatasını bulduğunda öğrenme kalıcı olur.
        </p>
      </div>

      <button class="btn btn-blue btn-block" onclick="App._embodiedComplete()">✓ Bu Etkinliği Yaptık</button>
    `;
  }
}
