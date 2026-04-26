/* ══════════════════════════════════════════════════════════
   ABMAT — CorsiBlockGameView
   Klasik Corsi blok dizi hatırlama görevi (görsel-uzamsal WM).
   9 blok ekranda; sistem N tanesini sırayla yakar; çocuk
   aynı sırayla tekrar tıklar. Her başarıda dizi uzar.
   Kanıt: Corsi (1972); Logie & Pearson (1997);
          görsel-uzamsal WM ↔ matematik korelasyonu (Mammarella vd. 2018).
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class CorsiBlockGameView extends BaseView {
  static render(app){
    const el = document.getElementById('corsi-body');
    if(!el) return;
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(124,58,237,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(124,58,237,.2)">
        <h3 style="margin-bottom:.4rem;color:var(--purple)">🧠 Hafıza Blokları (Corsi)</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Bloklar bir sırayla yanıp sönecek. Sen aynı sırayla tıkla. Görsel-uzamsal çalışma belleği matematik becerisinin en güçlü yordayıcılarındandır. <em style="font-size:var(--t-xs)">(Mammarella vd., 2018)</em></p>
      </div>

      <div class="card">
        <div class="card-body" style="text-align:center">
          <div id="corsi-hud" style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.5rem">
            Seviye: <strong id="corsi-level">2</strong> · En iyi: <strong id="corsi-best">${app._s?.get('corsi_best',0) ?? 0}</strong>
          </div>
          <div id="corsi-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;max-width:280px;margin:0 auto;aspect-ratio:1;padding:.5rem"></div>
          <div id="corsi-status" style="margin-top:.6rem;font-size:var(--t-md);font-weight:700;min-height:1.5rem">Başlamak için "Başla" düğmesine basın.</div>
          <div style="display:flex;gap:.5rem;justify-content:center;margin-top:.7rem">
            <button id="corsi-start" class="btn btn-primary btn-sm" onclick="App._corsiStart()">Başla →</button>
            <button id="corsi-reset" class="btn btn-ghost btn-sm" onclick="App._corsiReset()" style="display:none">Sıfırla</button>
          </div>
          <p class="muted" style="font-size:.7rem;margin-top:.6rem;line-height:1.5">
            💡 İpucu: Konumları "yol" olarak hatırla — sol-üst → sağ-orta → alt vb.
          </p>
        </div>
      </div>
    `;
    CorsiBlockGameView._renderGrid();
  }

  static _renderGrid(){
    const g = document.getElementById('corsi-grid');
    if(!g) return;
    g.innerHTML = '';
    for(let i=0; i<9; i++){
      const b = document.createElement('button');
      b.className = 'corsi-block';
      b.dataset.idx = i;
      b.style.cssText = `
        background:var(--surface);
        border:2px solid var(--border);
        border-radius:var(--r-md);
        cursor:pointer;
        transition:transform .1s,background .15s,border-color .15s;
        min-height:60px;
        -webkit-tap-highlight-color:transparent;
      `;
      b.setAttribute('aria-label', `Blok ${i+1}`);
      b.onclick = () => window.App._corsiTap(i);
      g.appendChild(b);
    }
  }

  static start(app){
    app._corsi = { level: 2, sequence: [], userIndex: 0, isShowing: true, startedAt: 0 };
    document.getElementById('corsi-start').style.display = 'none';
    document.getElementById('corsi-reset').style.display = 'inline-flex';
    CorsiBlockGameView.next(app);
  }

  static next(app){
    const g = app._corsi;
    if(!g) return;
    g.sequence = [];
    for(let i=0; i<g.level; i++){
      g.sequence.push(Math.floor(Math.random() * 9));
    }
    g.userIndex = 0;
    g.isShowing = true;
    document.getElementById('corsi-level').textContent = g.level;
    document.getElementById('corsi-status').textContent = '👀 İzle...';
    CorsiBlockGameView._playSequence(app);
  }

  static _playSequence(app){
    const g = app._corsi;
    const grid = document.getElementById('corsi-grid');
    if(!grid) return;
    const blocks = grid.querySelectorAll('.corsi-block');
    g.sequence.forEach((idx, i) => {
      setTimeout(() => {
        const b = blocks[idx];
        if(!b) return;
        b.style.background = 'var(--purple)';
        b.style.borderColor = 'var(--purple)';
        b.style.transform = 'scale(.96)';
        // Sesli ipucu (TTS varsa) — pozisyonu söyle
        setTimeout(() => {
          b.style.background = 'var(--surface)';
          b.style.borderColor = 'var(--border)';
          b.style.transform = '';
        }, 450);
        if(i === g.sequence.length - 1){
          setTimeout(() => {
            g.isShowing = false;
            g.startedAt = Date.now();
            document.getElementById('corsi-status').textContent = '👆 Şimdi sen tekrarla';
          }, 600);
        }
      }, 700 * i);
    });
  }

  static tap(app, idx){
    const g = app._corsi;
    if(!g || g.isShowing) return;
    const expected = g.sequence[g.userIndex];
    const grid = document.getElementById('corsi-grid');
    const blocks = grid.querySelectorAll('.corsi-block');
    const b = blocks[idx];
    // Görsel feedback
    if(idx === expected){
      b.style.background = 'var(--success)';
      setTimeout(() => { b.style.background = 'var(--surface)'; }, 200);
      g.userIndex++;
      if(g.userIndex >= g.sequence.length){
        // Seviye tamamlandı
        const elapsed = Date.now() - g.startedAt;
        if(app._errPatterns){
          app._errPatterns.logAnswer({
            gameId: 'corsi', q: `seq-${g.level}`, expected: 'correct', given: 'correct', elapsedMs: elapsed,
          });
        }
        const best = app._s?.get('corsi_best', 0) || 0;
        if(g.level > best){
          app._s?.set('corsi_best', g.level);
          document.getElementById('corsi-best').textContent = g.level;
        }
        document.getElementById('corsi-status').innerHTML = `<span style="color:var(--success)">✓ Seviye ${g.level}!</span>`;
        g.level++;
        if(g.level > 9){
          document.getElementById('corsi-status').innerHTML = `<span style="color:var(--success)">🌟 Mükemmel! Maksimum seviyeye ulaştınız.</span>`;
          return;
        }
        setTimeout(() => CorsiBlockGameView.next(app), 1100);
      }
    } else {
      b.style.background = 'var(--danger)';
      setTimeout(() => { b.style.background = 'var(--surface)'; }, 250);
      if(app._errPatterns){
        app._errPatterns.logAnswer({
          gameId: 'corsi', q: `seq-${g.level}`, expected: expected, given: idx, elapsedMs: Date.now() - g.startedAt,
        });
      }
      if(app._subtype){
        app._subtype.addScores({ working_memory: 1 }, 'corsi_game');
      }
      document.getElementById('corsi-status').innerHTML = `<span style="color:var(--danger)">✗ En iyi seviyen: ${g.level - 1}</span>`;
      setTimeout(() => {
        // Bir alt seviyede yeniden dene
        g.level = Math.max(2, g.level - 1);
        CorsiBlockGameView.next(app);
      }, 1500);
    }
  }

  static reset(app){
    app._corsi = null;
    document.getElementById('corsi-start').style.display = 'inline-flex';
    document.getElementById('corsi-reset').style.display = 'none';
    document.getElementById('corsi-level').textContent = '2';
    document.getElementById('corsi-status').textContent = 'Başlamak için "Başla" düğmesine basın.';
    CorsiBlockGameView._renderGrid();
  }
}
