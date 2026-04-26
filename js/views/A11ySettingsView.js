/* ══════════════════════════════════════════════════════════
   ABMAT — A11ySettingsView
   Profil sayfasından açılan erişilebilirlik ayar paneli.
   Tercihler localStorage'da; A11yService.apply() ile body class'a uygulanır.
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

export class A11ySettingsView extends BaseView {
  static render(app){
    const el = document.getElementById('a11y-body');
    if(!el) return;
    const p = app._a11y.prefs;
    const ttsOk = app._a11y.isTtsSupported();
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(13,148,136,.08),rgba(13,148,136,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(13,148,136,.2)">
        <h3 style="margin-bottom:.4rem">♿ Erişilebilirlik</h3>
        <p style="font-size:var(--t-md);line-height:1.55">Görsel, motor, dikkat ve okuma güçlüğü olan kullanıcılar için. <em style="font-size:var(--t-xs)">(WCAG 2.1)</em></p>
      </div>

      <div class="a11y-panel">
        <label class="a11y-toggle">
          <input type="checkbox" ${p.contrast?'checked':''} onchange="App._a11ySet('contrast', this.checked)">
          <span class="a11y-icon">🌗</span>
          <div class="a11y-info">
            <strong>Yüksek Kontrast</strong>
            <span>Renkler daha keskin, kenarlıklar belirgin</span>
          </div>
        </label>

        <label class="a11y-toggle" style="${!p.contrast?'opacity:.5;pointer-events:none':''}">
          <input type="checkbox" ${p.dark?'checked':''} onchange="App._a11ySet('dark', this.checked)">
          <span class="a11y-icon">🌙</span>
          <div class="a11y-info">
            <strong>Karanlık Mod</strong>
            <span>Yüksek kontrast ile birlikte; az ışık ortamlarına uygun</span>
          </div>
        </label>

        <label class="a11y-toggle">
          <input type="checkbox" ${p.large?'checked':''} onchange="App._a11ySet('large', this.checked)">
          <span class="a11y-icon">🔠</span>
          <div class="a11y-info">
            <strong>Büyük Yazı</strong>
            <span>Tüm tipografi %10 büyür</span>
          </div>
        </label>

        <label class="a11y-toggle" style="${!p.large?'opacity:.5;pointer-events:none':''}">
          <input type="checkbox" ${p.xlarge?'checked':''} onchange="App._a11ySet('xlarge', this.checked)">
          <span class="a11y-icon">🔡</span>
          <div class="a11y-info">
            <strong>Ekstra Büyük</strong>
            <span>Görme zorluğu / tablet kullanımı için</span>
          </div>
        </label>

        <label class="a11y-toggle">
          <input type="checkbox" ${p.dyslexic?'checked':''} onchange="App._a11ySet('dyslexic', this.checked)">
          <span class="a11y-icon">📖</span>
          <div class="a11y-info">
            <strong>Disleksi-Dostu Font</strong>
            <span>OpenDyslexic varsa kullanır + harf/kelime aralığı genişler</span>
          </div>
        </label>

        <label class="a11y-toggle">
          <input type="checkbox" ${p.reduceMotion?'checked':''} onchange="App._a11ySet('reduceMotion', this.checked)">
          <span class="a11y-icon">🐢</span>
          <div class="a11y-info">
            <strong>Azaltılmış Hareket</strong>
            <span>Animasyonlar minimuma iner — vestibüler hassasiyet için</span>
          </div>
        </label>

        <label class="a11y-toggle">
          <input type="checkbox" ${p.noPressure?'checked':''} onchange="App._a11ySet('noPressure', this.checked)">
          <span class="a11y-icon">⏱️</span>
          <div class="a11y-info">
            <strong>Zaman Baskısız Mod</strong>
            <span>Oyunlardaki süre/hız ödülleri kapanır — diskalkulili çocuklar için kritik</span>
          </div>
        </label>

        <label class="a11y-toggle">
          <input type="checkbox" ${p.ttsEnabled?'checked':''} onchange="App._a11ySet('ttsEnabled', this.checked)" ${!ttsOk?'disabled':''}>
          <span class="a11y-icon">🔊</span>
          <div class="a11y-info">
            <strong>Sesli Okuma (TTS)</strong>
            <span>${ttsOk?'Sayfa içeriği dinlenebilir — okuma güçlüğü olan ebeveynler için':'⚠️ Bu cihazda Web Speech API desteklenmiyor'}</span>
          </div>
        </label>

        ${p.ttsEnabled && ttsOk ? `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:.7rem .9rem">
            <p style="font-size:var(--t-sm);font-weight:700;margin-bottom:.5rem">🎚️ TTS Hızı: <span id="tts-rate-val" style="color:var(--teal-d)">${p.ttsRate}x</span></p>
            <input type="range" min="0.5" max="1.5" step="0.05" value="${p.ttsRate}"
              oninput="App._a11ySet('ttsRate', parseFloat(this.value));document.getElementById('tts-rate-val').textContent=this.value+'x'"
              style="width:100%">
            <button class="btn btn-soft btn-sm" style="margin-top:.5rem" onclick="App._a11y.speak('Bu bir test cümlesidir. Hız ve ton ayarlarınız böyle duyulur.')">🔊 Test et</button>
          </div>
        ` : ''}
      </div>

      <div style="display:flex;gap:.5rem;margin-top:1rem">
        <button class="btn btn-ghost btn-sm" onclick="App._a11yReset()">↺ Varsayılana dön</button>
      </div>
    `;
  }
}
