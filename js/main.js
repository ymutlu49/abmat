/* ═══════════════════════════════════════════════════════════
   ABMATO — Uygulama Giriş Noktası
   ES modül olarak yüklenir; DOM hazır olduğunda uygulamayı başlatır.
═══════════════════════════════════════════════════════════ */

import { MatEvdeApp } from './App.js';

// Tekil uygulama örneği
const App = new MatEvdeApp();

// HTML'deki inline onclick="App.xxx()" ifadelerinin çalışabilmesi için
// global alana aç. Modül kapsamı dışarıdan erişime izin vermediğinden
// bu adım gereklidir.
window.App = App;

/* ══════════════════════════════════════════════════════════
   PWA — Service Worker kaydı
   Sessiz hata yönetimi: kayıt başarısız olursa app normal çalışır.
══════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then((reg) => {
        // console.log('[ABMATO] SW registered', reg.scope);
      })
      .catch((err) => {
        console.warn('[ABMATO] SW registration failed:', err);
      });
  });
}

/* ══════════════════════════════════════════════════════════
   PWA — Install prompt (Chrome/Edge)
   `beforeinstallprompt` olayını yakala, kullanıcı uygulamayı
   "Add to Home Screen" yaptığında tetiklenecek butonu hazırla.
══════════════════════════════════════════════════════════ */
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  window.App._pwaInstallReady = true;
  if (typeof window.App._updateInstallButton === 'function') {
    window.App._updateInstallButton();
  }
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  window.App._pwaInstallReady = false;
  if (typeof window.App._updateInstallButton === 'function') {
    window.App._updateInstallButton();
  }
});

// App'ten kullanılabilmesi için
window.App._triggerInstall = async function () {
  if (!deferredInstallPrompt) return false;
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  window.App._pwaInstallReady = false;
  return choice.outcome === 'accepted';
};
