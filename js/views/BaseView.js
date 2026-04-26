/* ══════════════════════════════════════════════════════════
   ABMAT — BaseView
   View kontrolcüsü için minimal arayüz. Her view şunu sağlamalı:
     - static render(app)  : tek sorumluluk, DOM'a HTML yazar
     - opsiyonel static mount(app) : event binding / post-render işi
   App.js'den çağrıldığında 'this' App instance'ıdır.
   Mevcut inline-onclick pattern'i korunur: butonlar hâlâ
   global `App.xxx()` çağırabilir; yalnızca render mantığı taşınır.
   Bu, 4562 satırlık App.js monolitinin kademeli bölünmesi için
   sıfır-risk giriş noktasıdır.
══════════════════════════════════════════════════════════ */

export class BaseView {
  /**
   * @param {object} app MatEvdeApp instance'ı
   * @returns {string|void} — rendered HTML (caller set'lerse) veya void (view kendi DOM'unu yazarsa)
   */
  static render(app){ /* alt sınıf override eder */ }

  /** Render sonrası event listener, focus, animasyon gibi işler için. */
  static mount(app){}
}
