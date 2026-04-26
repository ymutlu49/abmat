/* ══════════════════════════════════════════════════════════
   ABMAT — A11yService
   Erişilebilirlik servisleri:
     • Kullanıcı ayarları (kontrast, font boyu, disleksi font,
       azaltılmış hareket, zaman baskısız mod)
     • Web Speech API ile Türkçe Text-To-Speech (TTS)
     • Body class yönetimi → css/a11y.css ile koordine
   Kayıt: localStorage 'a11y_prefs'
   Kanıt: WCAG 2.1; OpenDyslexic; Reading Rockets TTS guideline.
══════════════════════════════════════════════════════════ */

const KEY = 'a11y_prefs';

const DEFAULTS = Object.freeze({
  contrast: false,      // yüksek kontrast
  dark: false,          // karanlık mod (kontrasta bağlı)
  large: false,         // büyük tipografi
  xlarge: false,        // ekstra büyük
  dyslexic: false,      // OpenDyslexic font
  reduceMotion: false,  // azaltılmış hareket
  noPressure: false,    // zaman baskısız mod
  ttsEnabled: true,     // TTS düğmesi görünür
  ttsRate: 0.95,        // konuşma hızı
  ttsPitch: 1.0,        // ses tonu
  ttsLang: 'tr-TR',
});

class A11yService {
  constructor(storage){
    this._s = storage;
    this._utterance = null;
    this._isSpeaking = false;
    this._currentBtn = null;
  }

  /* ─── Tercihler ───────────────────────────────────── */
  get prefs(){
    const saved = this._s.get(KEY) || {};
    return { ...DEFAULTS, ...saved };
  }

  set(key, value){
    const next = { ...this.prefs, [key]: value };
    this._s.set(KEY, next);
    this.apply();
    return next;
  }

  toggle(key){ return this.set(key, !this.prefs[key]); }

  reset(){ this._s.set(KEY, {}); this.apply(); return this.prefs; }

  /* ─── Body class uygulaması ──────────────────────── */
  apply(){
    if(typeof document === 'undefined') return;
    const b = document.body;
    if(!b) return;
    const p = this.prefs;
    b.classList.toggle('a11y-contrast', !!p.contrast);
    b.classList.toggle('a11y-dark', !!p.dark);
    b.classList.toggle('a11y-large', !!p.large || !!p.xlarge);
    b.classList.toggle('a11y-xlarge', !!p.xlarge);
    b.classList.toggle('a11y-dyslexic', !!p.dyslexic);
    b.classList.toggle('a11y-reduce-motion', !!p.reduceMotion);
    b.classList.toggle('a11y-no-pressure', !!p.noPressure);
  }

  /* ─── TTS — Web Speech API ───────────────────────── */
  isTtsSupported(){
    return typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && 'SpeechSynthesisUtterance' in window;
  }

  // Türkçe ses bul (en uyumlu olanı)
  _pickVoice(){
    if(!this.isTtsSupported()) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if(!voices.length) return null;
    const trVoices = voices.filter(v => /tr/i.test(v.lang));
    if(trVoices.length){
      const local = trVoices.find(v => v.localService);
      return local || trVoices[0];
    }
    return voices[0];
  }

  speak(text, opts = {}){
    if(!this.isTtsSupported() || !text) return false;
    this.stop();
    const u = new SpeechSynthesisUtterance(String(text).trim());
    const p = this.prefs;
    u.lang = opts.lang || p.ttsLang;
    u.rate = typeof opts.rate === 'number' ? opts.rate : p.ttsRate;
    u.pitch = typeof opts.pitch === 'number' ? opts.pitch : p.ttsPitch;
    const voice = this._pickVoice();
    if(voice) u.voice = voice;
    u.onend = () => this._onTtsEnd();
    u.onerror = () => this._onTtsEnd();
    this._utterance = u;
    this._isSpeaking = true;
    if(opts.btn){
      this._currentBtn = opts.btn;
      opts.btn.setAttribute('aria-pressed', 'true');
    }
    try{
      window.speechSynthesis.speak(u);
    }catch{ this._onTtsEnd(); return false; }
    return true;
  }

  stop(){
    if(!this.isTtsSupported()) return;
    try{ window.speechSynthesis.cancel(); }catch{}
    this._onTtsEnd();
  }

  _onTtsEnd(){
    this._isSpeaking = false;
    if(this._currentBtn){
      this._currentBtn.setAttribute('aria-pressed', 'false');
      this._currentBtn = null;
    }
    this._utterance = null;
  }

  isSpeaking(){ return this._isSpeaking; }

  /**
   * Bir HTML butonuna tıklamayı dinleyip text okuma fonksiyonu.
   * Kullanım: <button class="tts-btn" onclick="App._a11y.speakFromBtn(this, 'okunacak metin')">🔊</button>
   */
  speakFromBtn(btn, text){
    if(!btn) return;
    if(this._isSpeaking && this._currentBtn === btn){
      this.stop();
      return;
    }
    this.speak(text, { btn });
  }

  /* ─── HTML üreticisi: standart TTS düğmesi ───────── */
  ttsButton(text, opts = {}){
    if(!this.prefs.ttsEnabled || !this.isTtsSupported()) return '';
    const safe = String(text).replace(/'/g, "\\'").replace(/\n/g, ' ').slice(0, 380);
    const cls = opts.cls || 'tts-btn';
    const label = opts.label || '🔊 Sesli oku';
    return `<button class="${cls}" type="button" aria-label="${label}" aria-pressed="false"
      onclick="App._a11y && App._a11y.speakFromBtn(this, '${safe}')">${label}</button>`;
  }
}

export { A11yService };
