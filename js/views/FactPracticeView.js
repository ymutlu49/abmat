/* ══════════════════════════════════════════════════════════
   ABMATO — FactPracticeView
   Spaced retrieval practice (Leitner) UI'sı.
   Çocuk vadesi gelen olgu kartlarını cevaplar; doğru → kutu+1,
   yanlış → kutu=1 (yarın yine). Mezun olan kartlar 30 gün sonra döner.

   Zaman baskısı YOK (a11y mode aktif olsa da olmasa da).
   Cevap input olarak rakam veya seçenek (4 şık) — yaşa göre.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class FactPracticeView extends BaseView {
  static render(app){
    const el = document.getElementById('fact-body');
    if(!el) return;
    const decks = Object.values(app._spaced.decks());
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(13,148,136,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(13,148,136,.2)">
        <h3 style="margin-bottom:.4rem">⏰ Aralıklı Tekrar (Leitner)</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Sayı olgularını uzun vadeli akıcılığa taşır. Doğru cevaplanan kart bir sonraki tekrara: 1 → 2 → 4 → 7 → 14 → 30 gün. <em style="font-size:var(--t-xs)">(Roediger; Ophuis-Cox 2023)</em></p>
      </div>

      <div style="display:flex;flex-direction:column;gap:.6rem">
        ${decks.map(d => {
          const sum = app._spaced.summary(d.id);
          return `
            <div class="card" onclick="App._factOpen('${d.id}')" style="cursor:pointer">
              <div class="card-body" style="display:flex;align-items:center;gap:.85rem">
                <span style="font-size:2rem">${d.emoji}</span>
                <div style="flex:1">
                  <strong style="font-size:var(--t-lg);display:block">${d.ad}</strong>
                  <p class="muted" style="font-size:var(--t-sm);margin-top:.2rem">
                    Mezun: <strong>${sum.mastered}/${sum.total}</strong> (%${sum.masteryPct}) ·
                    Bugün: <strong>${sum.dueNow}</strong> kart
                  </p>
                  <div class="progress" style="height:6px;margin-top:.4rem">
                    <div class="progress-fill" style="width:${sum.masteryPct}%;background:var(--teal)"></div>
                  </div>
                </div>
                <span style="font-size:1.4rem;color:var(--muted)">→</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <p class="muted" style="font-size:var(--t-sm);margin-top:1rem;line-height:1.55">
        💡 <strong>Strateji öncelikli:</strong> Çocuğunuz bir olguyu hatırlamıyorsa, "10'a tamamlama" veya "ikileme" stratejisini hatırlatın. Asla saymadan ezber zorlamayın.
      </p>
    `;
  }

  static openDeck(app, deckId){
    const el = document.getElementById('fact-body');
    if(!el) return;
    const cards = app._spaced.dueCards(deckId, 8);
    if(!cards.length){
      el.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem">
          <div style="font-size:3rem;margin-bottom:.5rem">🌟</div>
          <h3>Bugünkü kartlar bitti!</h3>
          <p class="muted" style="font-size:var(--t-md);margin-bottom:1rem">Bu deste için yarın yeni kartlar hazır olacak.</p>
          <button class="btn btn-primary btn-sm" onclick="App._factHome()">← Destelere dön</button>
        </div>
      `;
      return;
    }
    app._factSession = { deckId, cards, idx: 0, correct: 0, startedAt: 0 };
    FactPracticeView._renderCard(app);
  }

  static _renderCard(app){
    const sess = app._factSession;
    if(!sess) return;
    const el = document.getElementById('fact-body');
    const card = sess.cards[sess.idx];
    if(!card){ FactPracticeView._finish(app); return; }
    sess.startedAt = Date.now();
    // 4 seçenek üret: doğru + 3 yakın
    const opts = new Set([card.a]);
    while(opts.size < 4){
      const delta = (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 4));
      const cand = Math.max(0, card.a + delta);
      if(cand !== card.a) opts.add(cand);
    }
    const shuffled = [...opts].sort(() => Math.random() - .5);
    const ttsBtn = app._a11y ? app._a11y.ttsButton(`${card.q} kaç eder?`, { cls:'tts-btn' }) : '';
    el.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="App._factHome()" style="margin-bottom:.6rem">← Destelere dön</button>
      <div class="card">
        <div class="card-body" style="text-align:center;padding:var(--s-lg)">
          <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.4rem">
            ${sess.idx + 1} / ${sess.cards.length}
          </p>
          <div style="font-size:3rem;font-weight:900;margin-bottom:.5rem;font-feature-settings:'tnum';color:var(--teal-d)">
            ${card.q} = ?
          </div>
          ${ttsBtn ? `<div style="margin-bottom:.5rem">${ttsBtn}</div>` : ''}
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;max-width:320px;margin:0 auto">
            ${shuffled.map(v => `
              <button class="btn btn-soft" style="font-size:var(--t-xl);font-weight:900;padding:1rem .5rem;font-feature-settings:'tnum'"
                onclick="App._factAnswer(${v})">${v}</button>
            `).join('')}
          </div>
          <p class="muted" style="font-size:.7rem;margin-top:.7rem;line-height:1.5">
            Cevabı bilmiyorsan tahmin et — yanlış cevap = bu kartı yarın yine göreceğiz.
          </p>
        </div>
      </div>
    `;
  }

  static answer(app, value){
    const sess = app._factSession;
    if(!sess) return;
    const card = sess.cards[sess.idx];
    const elapsed = Date.now() - sess.startedAt;
    const isCorrect = (Number(value) === Number(card.a));
    app._spaced.recordAnswer(sess.deckId, card.q, isCorrect);
    if(isCorrect) sess.correct++;
    if(app._errPatterns){
      app._errPatterns.logAnswer({
        gameId: 'fact-' + sess.deckId, q: card.q,
        expected: card.a, given: value, elapsedMs: elapsed, timedOut: false,
      });
    }
    if(!isCorrect && app._subtype){
      app._subtype.addScores({ fact_retrieval: 1 }, 'fact_practice');
    }
    // Inline feedback
    const el = document.getElementById('fact-body');
    const fbColor = isCorrect ? 'var(--success)' : 'var(--danger)';
    const fbText = isCorrect ? '✓ Doğru!' : `✗ Doğrusu: ${card.a}`;
    el.querySelectorAll('button').forEach(b => b.disabled = true);
    const fb = document.createElement('div');
    fb.style.cssText = `text-align:center;font-size:var(--t-lg);font-weight:800;color:${fbColor};margin-top:.7rem`;
    fb.textContent = fbText;
    el.querySelector('.card .card-body')?.appendChild(fb);
    setTimeout(() => {
      sess.idx++;
      FactPracticeView._renderCard(app);
    }, 1100);
  }

  static _finish(app){
    const sess = app._factSession;
    if(!sess) return;
    app._spaced.finishSession(sess.deckId);
    const el = document.getElementById('fact-body');
    const pct = Math.round(sess.correct * 100 / sess.cards.length);
    el.innerHTML = `
      <div style="text-align:center;padding:1.5rem 1rem">
        <div style="font-size:3.5rem;margin-bottom:.4rem">${pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '💪'}</div>
        <h3>Oturum Tamamlandı</h3>
        <p class="muted" style="font-size:var(--t-md);margin-bottom:1rem">Doğru: <strong>${sess.correct}/${sess.cards.length}</strong> (%${pct})</p>
        <button class="btn btn-primary btn-sm" onclick="App._factHome()">← Destelere dön</button>
      </div>
    `;
    app._factSession = null;
  }
}
