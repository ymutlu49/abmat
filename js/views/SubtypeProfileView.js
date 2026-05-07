/* ══════════════════════════════════════════════════════════
   ABMATO — SubtypeProfileView
   Diskalkuli alt-tip profilini gösterir + dominant alt-tipe
   göre özelleştirilmiş öneriler.
   Birikimli skor: SubtypeService.profile.scores
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class SubtypeProfileView extends BaseView {
  static render(app){
    const el = document.getElementById('subtype-body');
    if(!el) return;
    const profile = app._subtype.profile;
    const allMeta = app._subtype.allMeta();
    const dom = app._subtype.dominant();
    const recommendedIds = app._subtype.recommendedIds();

    const totalScore = Object.values(profile.scores).reduce((s,v)=>s+v,0);
    const hasData = totalScore > 0;

    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(13,148,136,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(13,148,136,.2)">
        <h3 style="margin-bottom:.4rem">🎯 Alt-Tip Profili</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Diskalkuli homojen değil — alt-tipler farklı yaklaşım gerektirir. Bu profil çocuğunuzun mini gözlem oyunu, oyun sonuçları ve kontrol listesinden birikimli olarak oluşur. <em style="font-size:var(--t-xs)">(Butterworth, 2019)</em></p>
      </div>

      ${hasData ? `
        <div style="margin-bottom:1.2rem">
          <div class="sec-header"><span class="sec-title">📊 Skorlar (kümülatif)</span></div>
          <div style="display:flex;flex-direction:column;gap:.55rem">
            ${Object.entries(profile.scores).map(([k, v]) => {
              const meta = allMeta[k];
              if(!meta) return '';
              const pct = Math.min(100, Math.round(v * 100 / Math.max(totalScore, 5)));
              const isDom = dom.includes(k);
              return `
                <div style="border:1.5px solid ${isDom ? meta.renk : 'var(--border)'};background:${isDom ? meta.renk + '12' : 'var(--surface)'};border-radius:var(--r-md);padding:.7rem .9rem">
                  <div style="display:flex;align-items:center;gap:.55rem;margin-bottom:.35rem">
                    <span style="font-size:1.2rem">${meta.icon}</span>
                    <strong style="flex:1;color:${meta.renk}">${meta.ad}</strong>
                    <span style="font-size:var(--t-md);font-weight:800;color:${meta.renk}">${v}</span>
                  </div>
                  <div class="progress" style="height:6px"><div class="progress-fill" style="width:${pct}%;background:${meta.renk}"></div></div>
                  <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.3rem;line-height:1.45">${meta.aciklama}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${dom.length ? `
          <div style="margin-bottom:1.2rem">
            <div class="sec-header"><span class="sec-title">🚀 Sizin İçin Öneriler</span></div>
            <p class="muted" style="font-size:var(--t-sm);line-height:1.55;margin-bottom:.6rem">Dominant alana göre özelleştirilmiş etkinlik ve oyunlar:</p>
            <div style="display:flex;flex-direction:column;gap:.55rem">
              ${dom.map(k => {
                const meta = allMeta[k];
                return `
                  <div style="border:1.5px solid ${meta.renk};border-radius:var(--r-md);background:${meta.renk}10;padding:.85rem 1rem">
                    <strong style="color:${meta.renk};font-size:var(--t-md)">${meta.icon} ${meta.ad}</strong>
                    <p style="font-size:var(--t-sm);line-height:1.55;margin:.35rem 0 .5rem"><strong>Yaklaşım:</strong> ${meta.yaklasim}</p>
                  </div>
                `;
              }).join('')}
            </div>

            ${recommendedIds.length ? `
              <p style="font-size:var(--t-sm);color:var(--muted);margin-top:.7rem">Önerilen etkinlik/oyun ID'leri: <code style="background:var(--teal-a);padding:.1rem .35rem;border-radius:3px;font-family:monospace;font-size:var(--t-xs)">${recommendedIds.slice(0, 8).join(', ')}</code></p>
              <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.6rem">
                <button class="btn btn-primary btn-sm" onclick="App._openMagnitude()">⚖️ Magnitude</button>
                <button class="btn btn-primary btn-sm" onclick="App._openStructSub()">🎲 Subitizing</button>
                <button class="btn btn-primary btn-sm" onclick="App._openCorsi()">🧠 Corsi</button>
                <button class="btn btn-primary btn-sm" onclick="App._openFact()">⏰ Olgular</button>
                <button class="btn btn-primary btn-sm" onclick="App._openStrategies()">🛠️ Stratejiler</button>
              </div>
            ` : ''}
          </div>
        ` : ''}
      ` : `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:1.4rem">
            <div style="font-size:2.5rem;margin-bottom:.4rem">🌱</div>
            <p style="font-size:var(--t-md);line-height:1.6">Henüz yeterli veri yok. Profili oluşturmak için Diskalkuli sayfasındaki <strong>mini gözlem oyununu</strong> oynayın ve yeni oyunlardan birkaç tur deneyin.</p>
          </div>
        </div>
      `}

      ${profile.history?.length ? `
        <div style="margin-top:1.2rem">
          <div class="sec-header"><span class="sec-title">📜 Son Güncellemeler</span></div>
          <div style="display:flex;flex-direction:column;gap:.35rem">
            ${profile.history.slice(-6).reverse().map(h => `
              <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:.5rem .75rem;font-size:var(--t-xs)">
                <span class="muted">${new Date(h.at).toLocaleString('tr-TR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                · <strong>${h.source}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:flex;gap:.5rem;margin-top:1.4rem">
        <button class="btn btn-ghost btn-sm" onclick="App._subtypeReset()">🗑️ Profili Sıfırla</button>
        <button class="btn btn-soft btn-sm" onclick="App._openErrorReport()">🔍 Hata Deseni Raporu</button>
      </div>
    `;
  }
}
