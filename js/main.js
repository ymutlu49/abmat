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

/* AUTO-BOOT: sayfa yüklendiğinde merkezî auth token'ını kontrol et;
   geçerli token varsa splash'ı atla, dashboard'a git. Token yoksa splash kalır. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.start(), { once: true });
} else {
  App.start();
}

/* ══════════════════════════════════════════════════════════
   PWA — Service Worker kaydı
   Sessiz hata yönetimi: kayıt başarısız olursa app normal çalışır.
══════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then((reg) => {
        // Sayfa açıldığında zaten bekleyen yeni sürüm varsa kullanıcıya hemen söyle
        if (reg.waiting && navigator.serviceWorker.controller) {
          window.App?._showUpdateReady?.(reg.waiting);
        }
        // Yeni güncelleme bulunduğunda
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // Yeni SW kuruldu ama eski aktif — kullanıcıya bildir
              window.App?._showUpdateReady?.(installing);
            }
          });
        });
        // Saatte bir update kontrolü
        setInterval(() => { try { reg.update(); } catch {} }, 60 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[ABMATO] SW registration failed:', err);
      });

    // Yeni SW aktif olduğunda sayfayı tek seferlik yenile
    let _refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (_refreshing) return;
      _refreshing = true;
      window.location.reload();
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
