/* ══════════════════════════════════════════════════════════
   ABMATO — AboutView
   "ABMATO hakkında / Her Çocuk Matematik Öğrenebilir platformu" tanıtım sayfası.
   Hedef: uygulamanın misyonunu (her genç öğrenen için evde
   matematik desteği) tek bir profesyonel sayfada toplamak.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

const PILLARS = [
  { icon: '🔬', baslik: 'Bilim ile',  metin: 'İçeriğimiz uluslararası araştırmalara dayanır.' },
  { icon: '🤝', baslik: 'Aile ile',   metin: 'Ev ortamı, çocuğun matematik tutumunu biçimlendirir.' },
  { icon: '🏫', baslik: 'Okul ile',   metin: 'Öğretmen-aile köprüsü erken desteğin temelidir.' },
  { icon: '🌍', baslik: 'Herkes için', metin: 'Hem zorlanan hem normal gelişen her çocuk içindir.' },
];

export class AboutView extends BaseView {
  static render(app){
    const el = document.getElementById('about-body');
    if(!el) return;
    el.innerHTML = `
      <!-- HÇMÖ / ABMATO Hero -->
      <div style="background:linear-gradient(160deg,#388E3C 0%,#1B5E20 100%);color:#fff;border-radius:var(--r-lg);padding:1.6rem 1.2rem 1.4rem;margin-bottom:1rem;text-align:center;position:relative;overflow:hidden;box-shadow:0 6px 18px rgba(46,125,50,.25)">
        <div style="position:absolute;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.06);top:-90px;right:-80px"></div>
        <div style="position:absolute;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.04);bottom:-60px;left:-50px"></div>
        <div style="position:relative;z-index:1">
          <img src="./icons/acm-mark.svg" alt="ABMATO — Üçlü Kod işareti" width="96" height="96"
               style="width:96px;height:96px;border-radius:18px;background:#fff;padding:8px;margin-bottom:.7rem;box-shadow:0 4px 12px rgba(0,0,0,.18)">
          <h2 style="color:#fff;margin:0;font-size:1.35rem;letter-spacing:.02em">ABMATO</h2>
          <p style="color:rgba(255,255,255,.85);font-size:.9rem;margin:.35rem 0 0;font-style:italic">"Herkes Matematik Öğrenebilir"</p>
          <p style="color:rgba(255,255,255,.6);font-size:.7rem;margin:.4rem 0 0;letter-spacing:.06em">Her Çocuk Matematik Öğrenebilir erken matematik platformu</p>
        </div>
      </div>

      <!-- Misyon -->
      <div class="card" style="margin-bottom:1rem">
        <div class="card-body">
          <h3 style="color:var(--teal-d);margin-bottom:.45rem">🎯 Misyonumuz</h3>
          <p style="font-size:var(--t-md);line-height:1.65">
            Okul öncesi ve ilkokul çağındaki çocuklara — hem matematikte zorlanan hem de
            normal gelişen her çocuğa — bilimsel, erişilebilir ve kaygısız evde matematik
            desteği sunmak. <strong>ABMATO</strong>, <strong>Her Çocuk Matematik Öğrenebilir</strong> erken matematik
            öğrenme platformunun ev tarafıdır.
          </p>
        </div>
      </div>

      <!-- Dört sütun -->
      <div style="margin-bottom:1.2rem">
        <div class="sec-header"><span class="sec-title">Yaklaşımımız</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.55rem">
          ${PILLARS.map(p => `
            <div class="card card-sm">
              <div class="card-body" style="padding:.75rem .85rem">
                <div style="font-size:1.6rem;margin-bottom:.3rem">${p.icon}</div>
                <strong style="font-size:var(--t-md);display:block">${p.baslik}</strong>
                <p class="muted" style="font-size:var(--t-xs);margin-top:.2rem;line-height:1.5">${p.metin}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Ücretsiz uygulama bilgisi -->
      <div style="background:linear-gradient(135deg,rgba(46,125,50,.1),rgba(46,125,50,.04));border-radius:var(--r-lg);padding:1.1rem 1.2rem;margin-bottom:1.2rem;border:1.5px solid rgba(46,125,50,.25)">
        <div style="display:flex;align-items:center;gap:.8rem">
          <span style="font-size:2rem">💚</span>
          <div>
            <strong style="font-size:var(--t-lg);color:var(--teal-d);display:block">Tamamen Ücretsiz</strong>
            <p style="font-size:var(--t-sm);color:var(--text2);margin-top:.15rem;line-height:1.55">ABMATO; üyelik, kayıt veya ödeme şartı olmaksızın herkesin kullanımına açıktır. Amacımız ev tabanlı matematik desteğini ve fırsat eşitliğini yaygınlaştırmaktır.</p>
          </div>
        </div>
      </div>

      <!-- ABMATO Künye -->
      <div class="card" style="margin-bottom:1rem">
        <div class="card-body">
          <h3 style="color:var(--teal-d);margin-bottom:.45rem">📱 Bu Uygulama Hakkında</h3>
          <p style="font-size:var(--t-md);line-height:1.65;margin-bottom:.5rem">
            <strong>ABMATO — Anne-Baba Matematik Okulu</strong>, okul öncesi ve ilkokul çocukları
            için kanıt-temelli, kaygı dostu, TYMM (MEB 2024) müfredatı uyumlu matematik etkinlikleri sunar.
          </p>
          <p style="font-size:var(--t-sm);line-height:1.6;color:var(--text2);margin-bottom:.4rem">
            <strong>Geliştiren:</strong> Prof. Dr. Yılmaz Mutlu<br>
            <strong>Platform:</strong> Her Çocuk Matematik Öğrenebilir erken matematik öğrenme platformu
          </p>
          <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.55">
            Tüm veriler cihazınızda saklanır. Sunucuya hiçbir bilgi gönderilmez.
            Açık kaynak ve sürekli geliştirilmektedir.
          </p>
        </div>
      </div>

      <!-- Bilimsel temel -->
      <div style="background:rgba(245,158,11,.08);border-left:4px solid var(--amber);border-radius:0 var(--r-sm) var(--r-sm) 0;padding:.9rem 1rem;margin-bottom:1rem">
        <strong style="color:#92600A;font-size:var(--t-md)">📚 Bilimsel Temel</strong>
        <p style="font-size:var(--t-sm);line-height:1.55;margin-top:.3rem;color:var(--text2)">
          Butterworth, Dehaene, Fischer, Wilson, Siegler ve diğer alanın önde gelen
          araştırmacılarının çalışmalarını referans alır. Beceri Köprüsü, Subitizing,
          Sayı Doğrusu ve Embodied Number Line modülleri ilgili kanıt makalelere bağlanmıştır.
        </p>
      </div>

      <p style="text-align:center;font-size:var(--t-xs);color:var(--muted);margin-top:1.4rem;line-height:1.6">
        © ${new Date().getFullYear()} ABMATO · HÇMÖ<br>
        "Herkes Matematik Öğrenebilir"
      </p>
    `;
  }
}
