/* ══════════════════════════════════════════════════════════
   ABMATO — MagnitudeGameView
   "Hangisi daha büyük?" magnitude comparison oyunu.
   Kanıt: Butterworth (2010); Wilson & Dehaene (2006).
   Sayı hissi açığı (number sense) için tek tek en güçlü egzersiz.

   Gösterim modları:
     • symbolic    : iki sayı (rakam)
     • dot         : iki nokta kümesi
     • mixed       : sayı vs nokta
   Adaptif: doğru → yakın sayılar (oran 1.2), yanlış → uzak (oran 2.0)
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class MagnitudeGameView extends BaseView {
  static render(app){
    const el = document.getElementById('magnitude-body');
    if(!el) return;
    const noPressure = app._a11y?.prefs?.noPressure;
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(17,138,178,.08),rgba(17,138,178,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(17,138,178,.2)">
        <h3 style="color:var(--blue);margin-bottom:.4rem">⚖️ Hangisi Daha Büyük?</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Sayı hissinin temeli: iki miktarı karşılaştırma. Düşük diskalkuli riski olan çocukların en zayıf alanı. <em style="font-size:var(--t-xs)">(Butterworth, 2010)</em></p>
      </div>

      <div class="card">
        <div class="card-body" style="text-align:center;padding:var(--s-lg)">
          <div id="mag-hud" style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.6rem">
            Tur: <strong id="mag-turn">0</strong> · Doğru: <strong id="mag-correct">0</strong>
            ${noPressure ? '<span data-pressure-text>· Kendi hızınızda</span>' : '<span data-timer>· Hız: <strong id="mag-time">-</strong></span>'}
          </div>

          <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-bottom:.8rem">
            <button class="btn btn-soft btn-sm" id="mag-mode-symbolic" onclick="App._magSetMode('symbolic')">🔢 Sayılar</button>
            <button class="btn btn-soft btn-sm" id="mag-mode-dot" onclick="App._magSetMode('dot')">⚫ Noktalar</button>
            <button class="btn btn-soft btn-sm" id="mag-mode-mixed" onclick="App._magSetMode('mixed')">🔀 Karışık</button>
          </div>

          <div id="mag-question" style="display:flex;align-items:center;justify-content:center;gap:1.5rem;min-height:140px;background:linear-gradient(135deg,rgba(13,148,136,.05),rgba(13,148,136,.02));border-radius:var(--r-md);padding:1rem;margin-bottom:.8rem">
            <p class="muted" style="font-size:var(--t-md)">Başlamak için "Başla" düğmesine basın.</p>
          </div>

          <div id="mag-feedback" style="font-size:var(--t-md);font-weight:700;min-height:1.5rem;margin-bottom:.6rem"></div>

          <div style="display:flex;gap:.5rem;justify-content:center">
            <button id="mag-start-btn" class="btn btn-primary btn-sm" onclick="App._magStart()">Başla →</button>
            <button id="mag-reset-btn" class="btn btn-ghost btn-sm" onclick="App._magReset()" style="display:none">Sıfırla</button>
          </div>
          <p class="muted" style="font-size:.7rem;margin-top:.6rem;line-height:1.5">
            💡 Yakın sayılar zorlaşır. Çocuğun "neden?" sorusuna cevabını dinleyin — sezgi vs sayma.
          </p>
        </div>
      </div>
    `;
  }

  /* ─── Oyun mantığı (App.js'e bağlı) ────────────── */
  static start(app){
    app._mag = {
      turn: 0, correct: 0, total: 10,
      mode: app._mag?.mode || 'symbolic',
      ratio: 2.0,           // başlangıç oranı (1.2 zorlaşır, 2.0 kolay)
      current: null,
      startedAt: 0,
    };
    document.getElementById('mag-start-btn').style.display = 'none';
    document.getElementById('mag-reset-btn').style.display = 'inline-flex';
    MagnitudeGameView.next(app);
  }

  static setMode(app, mode){
    if(app._mag){ app._mag.mode = mode; }
    else { app._mag = { mode }; }
    ['symbolic','dot','mixed'].forEach(m => {
      const b = document.getElementById('mag-mode-' + m);
      if(b) b.style.background = (m === mode) ? 'var(--teal)' : '';
      if(b) b.style.color = (m === mode) ? '#fff' : '';
    });
  }

  static next(app){
    const g = app._mag;
    if(!g) return;
    if(g.turn >= g.total){ MagnitudeGameView.finish(app); return; }
    g.turn++;
    // Adaptive zorluk: doğruluk oranına göre ratio güncelle
    const prevAcc = g.turn > 1 ? g.correct / (g.turn - 1) : .5;
    if(prevAcc > .7) g.ratio = Math.max(1.15, g.ratio - .15);
    if(prevAcc < .3) g.ratio = Math.min(3.0, g.ratio + .25);
    // Sayı çiftini üret
    const small = 1 + Math.floor(Math.random() * 9);   // 1-9
    const big = Math.min(99, Math.max(small + 1, Math.round(small * g.ratio)));
    const arr = Math.random() < .5 ? [big, small] : [small, big];
    g.current = { left: arr[0], right: arr[1], correct: arr.indexOf(big) === 0 ? 'left' : 'right' };
    g.startedAt = Date.now();
    // Render
    MagnitudeGameView._renderQuestion(app, g);
    // HUD güncelle
    const t = document.getElementById('mag-turn'); if(t) t.textContent = g.turn;
    const fb = document.getElementById('mag-feedback'); if(fb){ fb.textContent = ''; }
  }

  static _renderQuestion(app, g){
    const q = document.getElementById('mag-question');
    if(!q) return;
    const useDotLeft = g.mode === 'dot' || (g.mode === 'mixed' && Math.random() < .5);
    const useDotRight = g.mode === 'dot' || (g.mode === 'mixed' && !useDotLeft);
    const renderSide = (n, isDot, side) => isDot
      ? `<button onclick="App._magAnswer('${side}')" style="background:transparent;border:2px dashed var(--border);border-radius:var(--r-md);padding:.6rem;min-width:120px;min-height:120px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px">
           ${'<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--teal)"></span>'.repeat(n)}
         </button>`
      : `<button onclick="App._magAnswer('${side}')" style="background:transparent;border:2px solid var(--border);border-radius:var(--r-md);padding:1rem 1.5rem;min-width:120px;min-height:120px;cursor:pointer;font-size:3rem;font-weight:900;color:var(--text);font-feature-settings:'tnum'">${n}</button>`;
    q.innerHTML = renderSide(g.current.left, useDotLeft, 'left') +
      `<div style="font-size:1.5rem;color:var(--muted);font-weight:800">vs</div>` +
      renderSide(g.current.right, useDotRight, 'right');
    // Sesli oku (ttsEnabled ise) — soru
    if(app._a11y?.prefs?.ttsEnabled){
      app._a11y.speak(`Hangisi daha büyük: ${g.current.left} mi, ${g.current.right} mi?`);
    }
  }

  static answer(app, side){
    const g = app._mag;
    if(!g || !g.current) return;
    const elapsed = Date.now() - g.startedAt;
    const isCorrect = (side === g.current.correct);
    if(isCorrect) g.correct++;
    // Hata logla
    if(app._errPatterns){
      const expected = g.current.correct === 'left' ? g.current.left : g.current.right;
      const given = side === 'left' ? g.current.left : g.current.right;
      app._errPatterns.logAnswer({
        gameId: 'magnitude', q: `${g.current.left} vs ${g.current.right}`,
        expected, given, elapsedMs: elapsed, timedOut: false,
      });
    }
    // Subtype skoru
    if(!isCorrect && app._subtype){
      app._subtype.addScores({ number_sense: 1 }, 'magnitude_game');
    }
    // Feedback
    const fb = document.getElementById('mag-feedback');
    if(fb){
      if(isCorrect){
        fb.textContent = elapsed < 1500 ? '⚡ Hızlı ve doğru!' : '✓ Doğru';
        fb.style.color = 'var(--success)';
      } else {
        const big = Math.max(g.current.left, g.current.right);
        fb.textContent = `Doğrusu: ${big} daha büyük`;
        fb.style.color = 'var(--danger)';
      }
    }
    document.getElementById('mag-correct').textContent = g.correct;
    setTimeout(() => MagnitudeGameView.next(app), 900);
  }

  static finish(app){
    const g = app._mag;
    const q = document.getElementById('mag-question');
    const fb = document.getElementById('mag-feedback');
    const pct = Math.round(g.correct * 100 / g.total);
    let msg, emoji;
    if(g.correct >= 8){ msg = 'Harika! Sayı hissi güçlü.'; emoji = '🌟'; }
    else if(g.correct >= 6){ msg = 'İyi! Düzenli oyun ile gelişir.'; emoji = '👍'; }
    else { msg = 'Pratik gerekli — yakın sayıları karşılaştırma sayı hissinin temelidir.'; emoji = '💪'; }
    if(q) q.innerHTML = `
      <div style="text-align:center;padding:1rem">
        <div style="font-size:3rem;margin-bottom:.4rem">${emoji}</div>
        <p style="font-size:var(--t-lg);font-weight:800;margin-bottom:.3rem">${msg}</p>
        <p style="color:var(--muted);font-size:var(--t-md)">Doğru: <strong>${g.correct}/${g.total}</strong> (%${pct})</p>
      </div>`;
    if(fb) fb.textContent = '';
  }

  static reset(app){
    app._mag = null;
    document.getElementById('mag-start-btn').style.display = 'inline-flex';
    document.getElementById('mag-reset-btn').style.display = 'none';
    document.getElementById('mag-question').innerHTML =
      '<p class="muted" style="font-size:var(--t-md)">Başlamak için "Başla" düğmesine basın.</p>';
    document.getElementById('mag-feedback').textContent = '';
    ['mag-turn','mag-correct'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.textContent = '0';
    });
  }
}
