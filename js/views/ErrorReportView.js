/* ══════════════════════════════════════════════════════════
   ABMAT — ErrorReportView
   ErrorPatternService analiz çıktısını ekrana basar.
   Anlamlı desen yoksa "yeterli veri yok" mesajı.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class ErrorReportView extends BaseView {
  static render(app){
    const el = document.getElementById('errreport-body');
    if(!el) return;
    const a = app._errPatterns.analyze(80);
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(239,68,68,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(239,68,68,.2)">
        <h3 style="margin-bottom:.4rem">🔍 Hata Deseni Analizi</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Son ${a.totalSeen} cevaptan ${a.totalErrors} yanlış incelendi. Sistem rastgele hatayı değil <strong>tekrarlayan kalıpları</strong> arar. <em style="font-size:var(--t-xs)">(VanLehn, 1990)</em></p>
      </div>

      ${a.significant.length ? `
        <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1rem">
          ${a.significant.map(s => `
            <div class="card">
              <div class="card-body">
                <div style="display:flex;align-items:flex-start;gap:.85rem">
                  <span style="font-size:2rem">${s.icon}</span>
                  <div style="flex:1">
                    <strong style="font-size:var(--t-lg);display:block">${s.ad}</strong>
                    <p class="muted" style="font-size:var(--t-sm);margin-top:.2rem">${s.aciklama}</p>
                    <div style="background:rgba(13,148,136,.08);border-left:3px solid var(--teal);padding:.5rem .75rem;border-radius:0 var(--r-sm) var(--r-sm) 0;margin-top:.5rem">
                      <p style="font-size:var(--t-sm);line-height:1.55"><strong style="color:var(--teal-d)">💡 Öneri:</strong> ${s.oneri}</p>
                    </div>
                    <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.4rem">Tespit sayısı: <strong>${s.count}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:1.4rem">
            <div style="font-size:2.5rem;margin-bottom:.4rem">${a.totalSeen < 10 ? '🌱' : '🌟'}</div>
            <p style="font-size:var(--t-md);line-height:1.55">
              ${a.totalSeen < 10
                ? 'Henüz yeterli veri yok. Birkaç oyun oynadıktan sonra tekrar bakın.'
                : 'Anlamlı hata deseni yok. Çocuğunuzun hataları rastgele görünüyor — bu iyi bir işaret.'}
            </p>
          </div>
        </div>
      `}

      <div style="display:flex;gap:.5rem;margin-top:1rem">
        <button class="btn btn-ghost btn-sm" onclick="App._errReset()">🗑️ Geçmişi Sil</button>
        <button class="btn btn-soft btn-sm" onclick="App._exportSummary()">📤 Rapor Olarak Yazdır</button>
      </div>
    `;
  }
}
