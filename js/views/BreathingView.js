/* ══════════════════════════════════════════════════════════
   ABMATO — BreathingView
   Kaygı yönetimi / 4-4-6 nefes tekniği sayfası.
   Örnek / ref: App.js monolitinden çıkarılan ilk view.

   Kontrat:
     - render(app) → #breathing-body içine innerHTML yazar
     - onclick'ler global `App.xxx()` çağırmaya devam eder
     - Tüm bağımlılıklar app instance üzerinden okunur
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class BreathingView extends BaseView {
  static render(app){
    const el = document.getElementById('breathing-body');
    if(!el) return;

    const anxHistory = app._anxTracker.getHistory();
    const trend = app._anxTracker.getTrend();
    const p = app._parent;
    const score = p?.anxietyProfile?.score || 0;

    const scoreBg = score < 35 ? 'rgba(34,197,94,.08)'
                  : score < 65 ? 'rgba(245,158,11,.08)'
                               : 'rgba(239,68,68,.08)';
    const scoreBorder = score < 35 ? 'rgba(34,197,94,.25)'
                      : score < 65 ? 'rgba(245,158,11,.25)'
                                   : 'rgba(239,68,68,.25)';
    const scoreEmoji = score < 35 ? '😌' : score < 65 ? '🤔' : '😰';
    const trendLabel = trend === 'improving' ? '📉 İyileşiyor'
                     : trend === 'worsening' ? '📈 Yükseliyor'
                     : '➡️ Stabil';

    el.innerHTML = `
      <!-- Kaygı durumu -->
      <div style="background:${scoreBg};border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1.4rem;border:1.5px solid ${scoreBorder}">
        <div style="display:flex;align-items:center;gap:1rem">
          <div style="font-size:2.5rem" aria-hidden="true">${scoreEmoji}</div>
          <div>
            <h3>Kaygı Skoru: ${score}%</h3>
            <p class="muted" style="font-size:var(--t-md);margin-top:.2rem">
              Trend: ${trendLabel}
              ${anxHistory.length < 2 ? ' (Henüz yeterli veri yok)' : ''}
            </p>
          </div>
        </div>
        ${anxHistory.length >= 2 ? `
        <div style="margin-top:.9rem">
          <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:.4rem">Son ${anxHistory.length} ölçüm</p>
          <div style="display:flex;gap:.25rem;align-items:flex-end;height:36px" role="img" aria-label="Kaygı geçmişi grafiği">
            ${anxHistory.map(h => `
              <div style="flex:1;background:${h.score < 35 ? 'var(--success)' : h.score < 65 ? 'var(--amber)' : 'var(--danger)'};border-radius:3px 3px 0 0;height:${Math.round(h.score * 36 / 100)}px;opacity:.75" title="${h.score}%"></div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>

      <!-- Nefes egzersizi -->
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">🧘 4-4-6 Nefes Tekniği</span></div>
        <div class="card">
          <div class="card-body" style="text-align:center;padding:1.5rem">
            <div id="breath-icon" style="font-size:4rem;margin-bottom:.5rem;transition:transform .5s ease" aria-hidden="true">🫁</div>
            <h3 id="breath-label" style="font-size:1.2rem;margin-bottom:.4rem">Hazır mısınız?</h3>
            <p id="breath-instruction" class="muted" style="font-size:var(--t-lg);line-height:1.55;min-height:3rem">Bu egzersiz matematik stresi sırasında zihni sakinleştirmek için tasarlanmıştır.</p>
            <div id="breath-progress" style="margin:.9rem 0">
              <div class="progress" style="height:6px"><div class="progress-fill" id="breath-bar" style="width:0%;transition:width linear"></div></div>
            </div>
            <div id="breath-phase" class="muted" style="font-size:var(--t-sm);margin-bottom:1rem" aria-live="polite">3 tekrar · ~42 saniye</div>
            <button id="breath-btn" class="btn btn-primary" onclick="App._startBreathing()" style="min-width:160px">Başlat</button>
          </div>
        </div>
      </div>

      <!-- Araştırma notu -->
      <div style="background:rgba(255,209,102,.15);border-radius:var(--r-md);padding:var(--s-md) var(--s-lg);border:1.5px solid rgba(255,209,102,.3);margin-bottom:1.4rem">
        <strong style="font-size:var(--t-md);color:#92600A">💡 Neden işe yarıyor?</strong>
        <p style="font-size:var(--t-md);line-height:1.6;margin-top:.35rem;color:var(--text2)">Cosso ve arkadaşları (2023): Ebeveyn kaygısı azaltılmadan ev matematik ortamının etkisi sınırlı kalıyor. Çocuğunuza yardım etmeden önce kendi zihinsel durumunuzu yönetmek en kritik adımdır.</p>
      </div>

      <!-- Kaygı haftalık check-in bağlantısı -->
      <div style="background:linear-gradient(135deg,var(--teal-d) 0%,var(--teal-l) 100%);border-radius:var(--r-lg);padding:1.1rem 1.3rem;color:#fff;display:flex;align-items:center;gap:.9rem;cursor:pointer" onclick="App._openCheckIn()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App._openCheckIn();}">
        <div style="font-size:1.8rem" aria-hidden="true">📋</div>
        <div style="flex:1">
          <strong style="display:block">Haftalık kaygı takibi</strong>
          <p style="font-size:var(--t-sm);opacity:.85;margin-top:.1rem">Check-in yaparak kaygı grafiğinizi güncel tutun</p>
        </div>
        <span style="font-size:1.2rem;opacity:.8" aria-hidden="true">→</span>
      </div>
    `;
  }
}
