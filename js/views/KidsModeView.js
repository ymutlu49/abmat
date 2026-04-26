/* ══════════════════════════════════════════════════════════
   ABMAT — KidsModeView
   Çocuk modu UI: büyük tuşlar, sade dil, sadece çocuğun
   kullanabileceği oyunlar. Çıkış için ebeveyn PIN'i (varsa).
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class KidsModeView extends BaseView {
  static render(app){
    const el = document.getElementById('kids-body');
    if(!el) return;
    document.body.classList.add('kids-mode');
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,#0F8C82,#085049);color:#fff;border-radius:var(--r-lg);padding:1.4rem;margin-bottom:1rem;text-align:center">
        <div style="font-size:3rem;margin-bottom:.3rem">🌟</div>
        <h2 style="color:#fff;margin:0;font-size:1.6rem">Hadi Oynayalım!</h2>
        <p style="color:rgba(255,255,255,.85);margin-top:.4rem;font-size:1rem">Bir oyun seç</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-bottom:1rem">
        ${[
          { id: 'mag', icon: '⚖️', title: 'Hangisi Büyük?', renk: '#118AB2' },
          { id: 'ssub', icon: '🎲', title: 'Şipşak Sayma', renk: '#F59E0B' },
          { id: 'corsi', icon: '🧠', title: 'Hafıza Blokları', renk: '#8B5CF6' },
          { id: 'nl', icon: '📏', title: 'Sayı Çizgisi', renk: '#0D9488' },
          { id: 'fact', icon: '⚡', title: 'Hızlı Toplama', renk: '#EF4444' },
          { id: 'sub', icon: '🎯', title: 'Klasik Sayma', renk: '#06B6D4' },
        ].map(g => `
          <button onclick="App._kidsPlay('${g.id}')"
            style="background:${g.renk};color:#fff;border:none;border-radius:var(--r-lg);padding:1.4rem .7rem;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:.5rem;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 12px rgba(0,0,0,.15);font-family:var(--ff-body);min-height:120px"
            ontouchstart="this.style.transform='scale(.96)'"
            ontouchend="this.style.transform=''">
            <span style="font-size:2.5rem">${g.icon}</span>
            <strong style="font-size:1rem;line-height:1.2;text-align:center">${g.title}</strong>
          </button>
        `).join('')}
      </div>

      <div style="text-align:center;margin-top:1.5rem">
        <button class="btn btn-soft btn-sm" onclick="App._kidsExit()" style="font-size:.9rem">
          🔓 Anne/Baba Modu
        </button>
      </div>
    `;
  }

  /** PIN sorma modal HTML */
  static promptPin(app){
    return `
      <div style="background:rgba(0,0,0,.5);position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem">
        <div style="background:#fff;border-radius:var(--r-lg);padding:1.4rem;max-width:340px;width:100%;text-align:center">
          <div style="font-size:2.5rem;margin-bottom:.3rem">🔒</div>
          <h3 style="margin-bottom:.4rem">Ebeveyn PIN'i</h3>
          <p style="color:var(--muted);font-size:var(--t-sm);margin-bottom:.85rem">Çocuk modundan çıkmak için PIN gerekli</p>
          <input id="kids-pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="off"
            style="width:160px;text-align:center;font-size:1.6rem;letter-spacing:.4em;padding:.6rem;border:2px solid var(--border);border-radius:var(--r-md);margin-bottom:.8rem;font-feature-settings:'tnum'"
            onkeydown="if(event.key==='Enter')App._kidsVerifyPin()">
          <p id="kids-pin-err" style="display:none;color:var(--danger);font-size:var(--t-sm);margin-bottom:.5rem">Yanlış PIN</p>
          <div style="display:flex;gap:.5rem;justify-content:center">
            <button class="btn btn-ghost btn-sm" onclick="App._kidsCancelPin()">İptal</button>
            <button class="btn btn-primary btn-sm" onclick="App._kidsVerifyPin()">Doğrula</button>
          </div>
        </div>
      </div>
    `;
  }
}
