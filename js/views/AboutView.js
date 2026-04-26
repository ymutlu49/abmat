/* ══════════════════════════════════════════════════════════
   ABMAT — AboutView
   Diskalkuli Derneği tanıtım & ABMAT hakkında.
   Hedef: derneği görünür kılmak, üyelik & destek davetlerini
   tek bir profesyonel sayfada toplamak.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

const DERNEK_URL = 'https://www.diskalkulidernegi.org';

const PILLARS = [
  { icon: '🔬', baslik: 'Bilim ile',     metin: 'Çalışmalarımız uluslararası araştırmalara dayanır.' },
  { icon: '🤝', baslik: 'Aile ile',      metin: 'Ev ortamı, çocuğun matematik kaygısını biçimlendirir.' },
  { icon: '🏫', baslik: 'Okul ile',      metin: 'Öğretmen-aile köprüsü erken müdahalenin temelidir.' },
  { icon: '🌍', baslik: 'Toplum ile',    metin: 'Diskalkuli farkındalığı yaymak ortak sorumluluktur.' },
];

const SOSYAL = [
  { ad: 'Web Sitesi',  url: DERNEK_URL,                          icon: '🌐', label: 'diskalkulidernegi.org' },
  { ad: 'Üye Ol',      url: DERNEK_URL + '/uye-ol',              icon: '✍️', label: 'Üyelik Başvurusu' },
  { ad: 'Bağış Yap',   url: DERNEK_URL + '/bagis',               icon: '💚', label: 'Çalışmalarımıza destek' },
  { ad: 'İletişim',    url: 'mailto:info@diskalkulidernegi.org', icon: '✉️', label: 'info@diskalkulidernegi.org' },
];

export class AboutView extends BaseView {
  static render(app){
    const el = document.getElementById('about-body');
    if(!el) return;
    el.innerHTML = `
      <!-- Dernek Hero -->
      <div style="background:linear-gradient(160deg,#388E3C 0%,#1B5E20 100%);color:#fff;border-radius:var(--r-lg);padding:1.6rem 1.2rem 1.4rem;margin-bottom:1rem;text-align:center;position:relative;overflow:hidden;box-shadow:0 6px 18px rgba(46,125,50,.25)">
        <div style="position:absolute;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.06);top:-90px;right:-80px"></div>
        <div style="position:absolute;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.04);bottom:-60px;left:-50px"></div>
        <div style="position:relative;z-index:1">
          <img src="./icons/dernek-logo.png" alt="Diskalkuli Derneği" width="96" height="96"
               style="width:96px;height:96px;border-radius:50%;background:#fff;padding:6px;margin-bottom:.7rem;box-shadow:0 4px 12px rgba(0,0,0,.18)">
          <h2 style="color:#fff;margin:0;font-size:1.35rem;letter-spacing:.02em">Diskalkuli Derneği</h2>
          <p style="color:rgba(255,255,255,.85);font-size:.9rem;margin:.35rem 0 0;font-style:italic">"Herkes Matematik Öğrenebilir"</p>
          <p style="color:rgba(255,255,255,.55);font-size:.7rem;margin:.4rem 0 0;letter-spacing:.06em">Kuruluş 2017</p>
        </div>
      </div>

      <!-- Misyon -->
      <div class="card" style="margin-bottom:1rem">
        <div class="card-body">
          <h3 style="color:var(--teal-d);margin-bottom:.45rem">🎯 Misyonumuz</h3>
          <p style="font-size:var(--t-md);line-height:1.65">
            Diskalkulili (sayısal öğrenme güçlüğü olan) bireylere ve ailelerine bilimsel,
            erişilebilir ve kaygısız matematik destek modelleri sunmak; diskalkuli farkındalığını
            Türkiye'de yaygınlaştırmak. <strong>ABMAT</strong> bu vizyonun ev tarafıdır.
          </p>
        </div>
      </div>

      <!-- Dört sütun -->
      <div style="margin-bottom:1.2rem">
        <div class="sec-header"><span class="sec-title">Çalışma Alanlarımız</span></div>
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

      <!-- Üyelik / Destek CTA -->
      <div style="background:linear-gradient(135deg,rgba(46,125,50,.1),rgba(46,125,50,.04));border-radius:var(--r-lg);padding:1.1rem 1.2rem;margin-bottom:1.2rem;border:1.5px solid rgba(46,125,50,.25)">
        <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:.5rem">
          <span style="font-size:2rem">💚</span>
          <div>
            <strong style="font-size:var(--t-lg);color:var(--teal-d);display:block">Bize Katılın</strong>
            <p style="font-size:var(--t-sm);color:var(--text2);margin-top:.15rem">Diskalkuli Derneği üyeliği veya bağış ile çalışmalarımıza destek olabilirsiniz.</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.6rem">
          <a href="${DERNEK_URL}/uye-ol" target="_blank" rel="noopener" class="btn btn-primary"
             style="text-decoration:none;text-align:center;padding:.7rem;font-size:var(--t-sm);font-weight:800">
            ✍️ Üye Ol
          </a>
          <a href="${DERNEK_URL}/bagis" target="_blank" rel="noopener" class="btn"
             style="background:rgba(46,125,50,.08);color:var(--teal-d);border:1.5px solid rgba(46,125,50,.3);text-decoration:none;text-align:center;padding:.7rem;font-size:var(--t-sm);font-weight:800;border-radius:var(--r-md)">
            💚 Bağış
          </a>
        </div>
      </div>

      <!-- İletişim & Sosyal -->
      <div style="margin-bottom:1.2rem">
        <div class="sec-header"><span class="sec-title">İletişim & Bağlantılar</span></div>
        <div style="display:flex;flex-direction:column;gap:.45rem">
          ${SOSYAL.map(s => `
            <a href="${s.url}" target="_blank" rel="noopener"
               style="display:flex;align-items:center;gap:.7rem;padding:.7rem .85rem;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);text-decoration:none;color:var(--text);transition:var(--t)"
               onmouseover="this.style.borderColor='var(--teal-l)'"
               onmouseout="this.style.borderColor='var(--border)'">
              <span style="font-size:1.4rem;flex-shrink:0">${s.icon}</span>
              <div style="flex:1;min-width:0">
                <strong style="font-size:var(--t-md);display:block">${s.ad}</strong>
                <span class="muted" style="font-size:var(--t-xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${s.label}</span>
              </div>
              <span style="color:var(--muted);flex-shrink:0">↗</span>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- ABMAT Künye -->
      <div class="card" style="margin-bottom:1rem">
        <div class="card-body">
          <h3 style="color:var(--teal-d);margin-bottom:.45rem">📱 Bu Uygulama Hakkında</h3>
          <p style="font-size:var(--t-md);line-height:1.65;margin-bottom:.5rem">
            <strong>ABMAT — Anne-Baba Matematik Okulu</strong>, okul öncesi ve ilkokul çocukları
            için kanıt-temelli, kaygı dostu, TYMM (MEB 2024) müfredatı uyumlu matematik etkinlikleri sunar.
          </p>
          <p style="font-size:var(--t-sm);line-height:1.6;color:var(--text2);margin-bottom:.4rem">
            <strong>Geliştiren:</strong> Prof. Dr. Yılmaz Mutlu<br>
            <strong>İş birliği:</strong> Diskalkuli Derneği
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
        © Diskalkuli Derneği · 2017–${new Date().getFullYear()}<br>
        <a href="${DERNEK_URL}" target="_blank" rel="noopener" style="color:var(--teal);text-decoration:none">${DERNEK_URL.replace('https://','')}</a>
      </p>
    `;
  }
}
