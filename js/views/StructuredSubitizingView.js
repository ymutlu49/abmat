/* ══════════════════════════════════════════════════════════
   ABMAT — StructuredSubitizingView
   Yapılandırılmış desenlerle subitizing oyunu.
   Mevcut rastgele dağıtımlı versiyona ek olarak:
     • dice    — zar deseni (1-6)
     • frame   — beşli/onluk çerçeve
     • finger  — parmak temsili
     • domino  — domino taşı (2x6)
   Kanıt: Clements & Sarama (2014); araştırma yapılandırılmış
   desenlerin çocuğun "gestalt" tanıma becerisini geliştirdiğini gösteriyor.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

const PATTERNS = {
  dice: {
    1: [[50,50]],
    2: [[30,30],[70,70]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
  },
  frame: { // 5'lik / 10'luk çerçeve (max 10)
    // Her sayı için sabit grid pozisyonu
    max: 10,
  },
  finger: {
    max: 10,
  },
  domino: {
    // 2x6 = 12 grid, n parça yere ardışık doldur
    max: 12,
  },
};

export class StructuredSubitizingView extends BaseView {
  static render(app){
    const el = document.getElementById('struct-sub-body');
    if(!el) return;
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(245,158,11,.25)">
        <h3 style="margin-bottom:.4rem">🎲 Yapılandırılmış Subitizing</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Zar, çerçeve, parmak ve domino desenlerini saymadan tanıma. Gestalt algı sayı hissinin temelidir. <em style="font-size:var(--t-xs)">(Clements & Sarama, 2014)</em></p>
      </div>

      <div class="card">
        <div class="card-body" style="text-align:center">
          <div id="ssub-hud" style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.5rem">
            Tur: <strong id="ssub-turn">0</strong> · Doğru: <strong id="ssub-correct">0</strong>
          </div>

          <div style="display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;margin-bottom:.8rem">
            <button class="btn btn-soft btn-sm" id="ssub-mode-dice" onclick="App._ssubMode('dice')">🎲 Zar</button>
            <button class="btn btn-soft btn-sm" id="ssub-mode-frame" onclick="App._ssubMode('frame')">🔲 Çerçeve</button>
            <button class="btn btn-soft btn-sm" id="ssub-mode-finger" onclick="App._ssubMode('finger')">🖐️ Parmak</button>
            <button class="btn btn-soft btn-sm" id="ssub-mode-domino" onclick="App._ssubMode('domino')">🁫 Domino</button>
            <button class="btn btn-soft btn-sm" id="ssub-mode-mix" onclick="App._ssubMode('mix')">🔀 Karışık</button>
          </div>

          <div id="ssub-canvas" style="min-height:160px;background:linear-gradient(135deg,rgba(245,158,11,.05),rgba(245,158,11,.02));border-radius:var(--r-md);padding:1rem;display:flex;align-items:center;justify-content:center;margin-bottom:.7rem">
            <p class="muted" style="font-size:var(--t-md)">"Başla" ya basın</p>
          </div>

          <div id="ssub-options" style="display:none;flex-wrap:wrap;gap:.35rem;justify-content:center;margin-bottom:.5rem"></div>
          <div id="ssub-feedback" style="font-size:var(--t-md);font-weight:700;min-height:1.5rem;margin-bottom:.6rem"></div>
          <div style="display:flex;gap:.5rem;justify-content:center">
            <button id="ssub-start" class="btn btn-primary btn-sm" onclick="App._ssubStart()">Başla →</button>
            <button id="ssub-reset" class="btn btn-ghost btn-sm" onclick="App._ssubReset()" style="display:none">Sıfırla</button>
          </div>
        </div>
      </div>
    `;
  }

  static setMode(app, mode){
    app._ssub = app._ssub || {};
    app._ssub.mode = mode;
    ['dice','frame','finger','domino','mix'].forEach(m => {
      const b = document.getElementById('ssub-mode-' + m);
      if(b){
        b.style.background = (m === mode) ? 'var(--amber)' : '';
        b.style.color = (m === mode) ? '#fff' : '';
      }
    });
  }

  static start(app){
    app._ssub = { ...(app._ssub || {}), turn: 0, correct: 0, total: 8, current: null, showAt: 0,
      mode: app._ssub?.mode || 'dice' };
    document.getElementById('ssub-start').style.display = 'none';
    document.getElementById('ssub-reset').style.display = 'inline-flex';
    document.getElementById('ssub-options').style.display = 'flex';
    StructuredSubitizingView.next(app);
  }

  static next(app){
    const g = app._ssub;
    if(!g) return;
    if(g.turn >= g.total){ StructuredSubitizingView.finish(app); return; }
    g.turn++;
    const mode = g.mode === 'mix'
      ? ['dice','frame','finger','domino'][Math.floor(Math.random() * 4)]
      : g.mode;
    const max = mode === 'dice' ? 6 : (mode === 'finger' || mode === 'frame' ? 10 : 12);
    const n = 1 + Math.floor(Math.random() * max);
    g.current = { n, mode };
    g.showAt = Date.now();
    document.getElementById('ssub-turn').textContent = g.turn;
    StructuredSubitizingView._renderPattern(mode, n);
    StructuredSubitizingView._renderOptions(app, n, max);
    document.getElementById('ssub-feedback').textContent = '';
  }

  static _renderPattern(mode, n){
    const c = document.getElementById('ssub-canvas');
    if(!c) return;
    if(mode === 'dice'){
      const positions = PATTERNS.dice[n] || [];
      c.innerHTML = `<div style="position:relative;width:140px;height:140px;background:#fff;border:3px solid var(--text);border-radius:18px;box-shadow:0 4px 12px rgba(0,0,0,.15)">
        ${positions.map(p => `<div style="position:absolute;left:${p[0]}%;top:${p[1]}%;width:18px;height:18px;border-radius:50%;background:#1a1a1a;transform:translate(-50%,-50%)"></div>`).join('')}
      </div>`;
    } else if(mode === 'frame'){
      const cells = [];
      for(let i=0; i<10; i++){
        cells.push(`<div style="width:32px;height:32px;border:2px solid var(--text);background:${i<n?'var(--teal)':'transparent'};border-radius:6px;${i===4?'margin-right:8px':''}"></div>`);
      }
      c.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;gap:6px">${cells.slice(0,5).join('')}</div>
        <div style="display:flex;gap:6px">${cells.slice(5).join('')}</div>
      </div>`;
    } else if(mode === 'finger'){
      // Sol el: 5'e kadar, sağ el: 5+ için
      const leftCount = Math.min(n, 5);
      const rightCount = Math.max(0, n - 5);
      const finger = (active) => `<div style="width:14px;height:50px;background:${active?'#fbbf24':'#fde68a'};border:2px solid #92400e;border-radius:8px 8px 4px 4px"></div>`;
      const hand = (count) => {
        let html = '<div style="display:flex;align-items:flex-end;gap:3px">';
        for(let i=0; i<5; i++) html += finger(i < count);
        html += '</div><div style="width:60px;height:24px;background:#fde68a;border:2px solid #92400e;border-top:none;border-radius:0 0 12px 12px"></div>';
        return `<div style="display:flex;flex-direction:column;align-items:center">${html}</div>`;
      };
      c.innerHTML = `<div style="display:flex;gap:30px">${hand(leftCount)}${hand(rightCount)}</div>`;
    } else if(mode === 'domino'){
      // 2x6 grid; n bloğu sıralı doldur
      const cells = [];
      for(let i=0; i<12; i++){
        const filled = i < n;
        cells.push(`<div style="width:28px;height:28px;border-radius:50%;background:${filled?'#1a1a1a':'transparent'};border:2px solid ${filled?'#1a1a1a':'transparent'}"></div>`);
      }
      c.innerHTML = `<div style="background:#fff;border:3px solid var(--text);border-radius:14px;padding:14px;display:grid;grid-template-columns:repeat(6,1fr);gap:8px;box-shadow:0 4px 12px rgba(0,0,0,.15)">
        ${cells.join('')}
      </div>`;
    }
  }

  static _renderOptions(app, n, max){
    const opts = new Set([n]);
    while(opts.size < 4){
      const delta = (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
      const cand = Math.max(1, Math.min(max, n + delta));
      opts.add(cand);
    }
    const shuffled = [...opts].sort(() => Math.random() - .5);
    const optsEl = document.getElementById('ssub-options');
    if(optsEl){
      optsEl.innerHTML = shuffled.map(v =>
        `<button class="btn btn-soft btn-sm" style="min-width:52px;font-size:var(--t-lg);font-weight:900" onclick="App._ssubAnswer(${v})">${v}</button>`
      ).join('');
    }
  }

  static answer(app, val){
    const g = app._ssub;
    if(!g || !g.current) return;
    const elapsed = Date.now() - g.showAt;
    const isCorrect = (val === g.current.n);
    const isFast = elapsed < 2200;
    if(isCorrect) g.correct++;
    if(app._errPatterns){
      app._errPatterns.logAnswer({
        gameId: 'ssub-' + g.current.mode, q: `n=${g.current.n}`,
        expected: g.current.n, given: val, elapsedMs: elapsed,
      });
    }
    if(!isCorrect && app._subtype){
      app._subtype.addScores({ number_sense: 1 }, 'structured_sub');
    }
    const fb = document.getElementById('ssub-feedback');
    if(fb){
      if(isCorrect && isFast){ fb.textContent = '⚡ Hızlı ve doğru!'; fb.style.color = 'var(--success)'; }
      else if(isCorrect){ fb.textContent = '✓ Doğru'; fb.style.color = 'var(--teal-d)'; }
      else { fb.textContent = `✗ Doğrusu: ${g.current.n}`; fb.style.color = 'var(--danger)'; }
    }
    document.getElementById('ssub-correct').textContent = g.correct;
    setTimeout(() => StructuredSubitizingView.next(app), 1000);
  }

  static finish(app){
    const g = app._ssub;
    const c = document.getElementById('ssub-canvas');
    const opts = document.getElementById('ssub-options');
    if(opts) opts.style.display = 'none';
    const pct = Math.round(g.correct * 100 / g.total);
    let msg, emoji;
    if(g.correct >= 7){ msg = 'Harika! Yapılandırılmış desenler artık tanıdık.'; emoji = '🌟'; }
    else if(g.correct >= 5){ msg = 'İyi! Her desen tipi ayrı ayrı pratik edin.'; emoji = '👍'; }
    else { msg = 'Pratik gerekli — günde bir desen tipi yeterli.'; emoji = '💪'; }
    if(c) c.innerHTML = `
      <div style="text-align:center;padding:.7rem">
        <div style="font-size:2.5rem;margin-bottom:.3rem">${emoji}</div>
        <p style="font-size:var(--t-md);font-weight:700">${msg}</p>
        <p style="font-size:var(--t-sm);color:var(--muted)">Doğru: <strong>${g.correct}/${g.total}</strong> (%${pct})</p>
      </div>
    `;
  }

  static reset(app){
    app._ssub = null;
    document.getElementById('ssub-start').style.display = 'inline-flex';
    document.getElementById('ssub-reset').style.display = 'none';
    document.getElementById('ssub-canvas').innerHTML = '<p class="muted" style="font-size:var(--t-md)">"Başla" ya basın</p>';
    document.getElementById('ssub-options').style.display = 'none';
    document.getElementById('ssub-feedback').textContent = '';
    ['ssub-turn','ssub-correct'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.textContent = '0';
    });
  }
}
