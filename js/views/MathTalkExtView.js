/* ══════════════════════════════════════════════════════════
   ABMAT — MathTalkExtView (Genişletilmiş Math Talk Sözlüğü)
   60+ tetikleyici cümle, 6 bağlamda. Filtreleyip rastgele
   soru çıkarır. Math-talk-extended.js verisi üzerine inşa.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';
import { MATH_TALK_CONTEXTS, MATH_TALK_EXTENDED, pickRandomTalk } from '../data/math-talk-extended.js';

export class MathTalkExtView extends BaseView {
  static render(app){
    const el = document.getElementById('mtext-body');
    if(!el) return;
    const filter = app._mtFilter || { ctx: null, age: null };
    const filtered = MATH_TALK_EXTENDED.filter(t =>
      (!filter.ctx || t.ctx === filter.ctx) &&
      (!filter.age || t.age === filter.age)
    );
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(13,148,136,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(13,148,136,.2)">
        <h3 style="margin-bottom:.4rem">💬 Sayı Sohbet Sözlüğü</h3>
        <p style="font-size:var(--t-md);line-height:1.6">${MATH_TALK_EXTENDED.length} tetikleyici cümle. Günün herhangi bir anında çocuğunuzla matematik konuşmasını başlatabilirsiniz. <em style="font-size:var(--t-xs)">(Levine ve ark., 2010)</em></p>
      </div>

      <!-- Bağlam filtreleri -->
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.7rem">
        <button class="btn btn-soft btn-sm" onclick="App._mtFilterCtx(null)" style="${!filter.ctx?'background:var(--teal);color:#fff':''}">🔄 Tümü</button>
        ${MATH_TALK_CONTEXTS.map(c => `
          <button class="btn btn-soft btn-sm" onclick="App._mtFilterCtx('${c.id}')"
            style="${filter.ctx===c.id?`background:${c.renk};color:#fff`:''}">${c.emoji} ${c.ad}</button>
        `).join('')}
      </div>

      <!-- Yaş filtreleri -->
      <div style="display:flex;gap:.4rem;margin-bottom:1rem">
        <button class="btn btn-ghost btn-sm" onclick="App._mtFilterAge(null)" style="${!filter.age?'background:var(--teal-a);font-weight:800':''}">Tüm yaş</button>
        ${['3-5','5-7','7-10'].map(a => `
          <button class="btn btn-ghost btn-sm" onclick="App._mtFilterAge('${a}')" style="${filter.age===a?'background:var(--teal-a);font-weight:800':''}">${a} yaş</button>
        `).join('')}
      </div>

      <!-- Rastgele bir soru çek -->
      <div class="card" style="margin-bottom:1rem">
        <div class="card-body" style="text-align:center;background:linear-gradient(135deg,#0F8C82,#085049);color:#fff;border-radius:var(--r-lg);padding:1.2rem">
          <div style="font-size:1.5rem;margin-bottom:.4rem">🎲 Rastgele Soru</div>
          <p id="mt-random-q" style="font-size:1.2rem;font-weight:700;line-height:1.5;margin-bottom:.5rem">${(pickRandomTalk(filter).soru)}</p>
          <button class="btn" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3)" onclick="App._mtRandom()">🎲 Yenile</button>
        </div>
      </div>

      <!-- Soru listesi -->
      <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.5rem">
        <strong>${filtered.length}</strong> soru gösteriliyor
      </p>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${filtered.map(t => {
          const ctx = MATH_TALK_CONTEXTS.find(c => c.id === t.ctx);
          const ttsBtn = app._a11y ? app._a11y.ttsButton(t.soru) : '';
          return `
            <div class="card card-sm">
              <div class="card-body" style="padding:.7rem .85rem">
                <div style="display:flex;align-items:flex-start;gap:.6rem">
                  <span style="font-size:1.4rem;flex-shrink:0">${ctx?.emoji || '💬'}</span>
                  <div style="flex:1">
                    <p style="font-size:var(--t-md);font-weight:700;line-height:1.5">${t.soru}</p>
                    <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.35rem">
                      <span class="chip" style="font-size:.65rem;background:${ctx?.renk}15;color:${ctx?.renk}">${ctx?.ad}</span>
                      <span class="chip" style="font-size:.65rem">${t.age} yaş</span>
                      <span class="chip" style="font-size:.65rem">${t.kategori}</span>
                    </div>
                    <p class="muted" style="font-size:var(--t-xs);margin-top:.3rem;font-style:italic">💡 ${t.neden}</p>
                  </div>
                  ${ttsBtn}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}
