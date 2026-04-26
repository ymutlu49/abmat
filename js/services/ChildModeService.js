/* ══════════════════════════════════════════════════════════
   ABMAT — ChildModeService
   Çocuk modu durumu + opsiyonel PIN ile ebeveyn kilidi.
   Çocuk modu açıkken yetişkin ekranlarına erişim sınırlanır
   (KidsModeView render edilir, navigasyon kısıtlanır).
   PIN sadece localStorage'da plain saklanır — çocuktan
   teknik gizleme amaçlı, gerçek güvenlik değildir.
══════════════════════════════════════════════════════════ */

const STATE_KEY = 'kids_mode';
const PIN_KEY   = 'kids_pin';

class ChildModeService {
  constructor(storage){ this._s = storage; }

  isOn(){ return !!this._s.get(STATE_KEY, false); }

  setOn(on){
    this._s.set(STATE_KEY, !!on);
    document.body?.classList.toggle('kids-mode', !!on);
  }

  hasPin(){ return !!this._s.get(PIN_KEY); }
  setPin(pin){
    if(!pin) { this._s.remove(PIN_KEY); return; }
    if(!/^\d{4,6}$/.test(String(pin))) throw new Error('PIN 4-6 hane olmalı');
    this._s.set(PIN_KEY, String(pin));
  }
  verifyPin(pin){
    const real = this._s.get(PIN_KEY);
    if(!real) return true; // PIN yoksa serbest
    return String(pin) === String(real);
  }
  removePin(){ this._s.remove(PIN_KEY); }
}

export { ChildModeService };
