/* ABMAT — Service Worker
 *
 * Strateji:
 *   - Statik varlıklar (CSS, JS, fontlar): cache-first
 *   - HTML (index): network-first, offline fallback cache
 *   - Google Fonts: cache-first (immutable)
 *
 * Sürüm kontrolü: CACHE_NAME'yi yeni deploy'da güncelle.
 */

const CACHE_VERSION = 'v7';
const CACHE_NAME = `abmat-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

// Önceden cache'lenecek çekirdek dosyalar (app shell)
const CORE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/utilities.css',
  './css/a11y.css',
  './js/main.js',
  './js/App.js',
  './js/core/constants.js',
  './js/core/tymm.js',
  './js/data/activities.js',
  './js/data/tymm-ilkokul-outcomes.js',
  './js/data/math-talk-extended.js',
  './js/services/StorageService.js',
  './js/services/ActivityRepository.js',
  './js/services/RecommendationEngine.js',
  './js/services/BadgeEngine.js',
  './js/services/TeacherMessageService.js',
  './js/services/PlannerService.js',
  './js/services/NotificationService.js',
  './js/services/SmsService.js',
  './js/services/StreakService.js',
  './js/services/AnxietyTracker.js',
  './js/services/AdaptiveEngine.js',
  './js/services/A11yService.js',
  './js/services/SubtypeService.js',
  './js/services/SpacedRetrievalService.js',
  './js/services/ErrorPatternService.js',
  './js/services/ChildModeService.js',
  './js/services/ExportService.js',
  './js/services/ContentService.js',
  './js/services/AuthService.js',
  './js/views/BaseView.js',
  './js/views/BreathingView.js',
  './js/views/MagnitudeGameView.js',
  './js/views/StructuredSubitizingView.js',
  './js/views/CorsiBlockGameView.js',
  './js/views/FactPracticeView.js',
  './js/views/StrategyView.js',
  './js/views/SubtypeProfileView.js',
  './js/views/EmbodiedNumberLineView.js',
  './js/views/MathTalkExtView.js',
  './js/views/ErrorReportView.js',
  './js/views/A11ySettingsView.js',
  './js/views/KidsModeView.js',
  './js/views/AdminPanelView.js',
  './js/skill-bridge/index.js',
  './js/skill-bridge/data.js',
  './js/skill-bridge/SkillProgressStore.js',
  './js/skill-bridge/SkillRepository.js',
  './js/skill-bridge/SkillProgressService.js',
  './js/skill-bridge/SkillBridgeView.js',
  './js/skill-bridge/SkillBridgeApp.js',
  './icons/icon.svg',
  './icons/dernek-logo.png',
  './icons/dernek-logo-round.png',
  './icons/dernek-logo-small.png',
];

// Install: çekirdek varlıkları cache'le
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Some core assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: eski cache'leri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith('abmat-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: farklı stratejiler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Sadece GET isteklerini yönet
  if (request.method !== 'GET') return;

  // Chrome extensions vb. özel şemaları atla
  if (!url.protocol.startsWith('http')) return;

  // HTML navigation: network-first, cache fallback, offline fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Sırayla: istenen URL → index.html → offline.html
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match('./index.html');
          if (shell) return shell;
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Google Fonts — cache-first (immutable)
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
        );
      })
    );
    return;
  }

  // Statik varlıklar (JS, CSS, icons): cache-first, network güncelleme
  // (push, notificationclick handler'ları aşağıda)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Arka planda yeniden indir (stale-while-revalidate gibi)
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback — boş yanıt yerine 503 dönelim
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});

/* ══════════════════════════════════════════════════════════
   PUSH NOTIFICATIONS — Altyapı (push servisi opsiyonel)
   - push: gerçek bir Web Push sunucusundan gelen JSON payload
     ya da local self.postMessage ile tetiklenebilir.
   - notificationclick: bildirim tıklanırsa ilgili sayfayı aç.
   - showLocalNotification mesaj kanalı: client tarafından
     gönderilen { type:'show-notif', ... } mesajını işler — bu
     sayede gerçek push aboneliği olmadan da test edilebilir.
══════════════════════════════════════════════════════════ */
self.addEventListener('push', (event) => {
  let payload = { title: 'ABMAT', body: 'Bir hatırlatıcınız var', url: '/' };
  if(event.data){
    try { payload = { ...payload, ...event.data.json() }; }
    catch { payload.body = event.data.text(); }
  }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || './icons/icon-192.png',
    badge: payload.badge || './icons/icon-192.png',
    tag: payload.tag || 'abmat',
    data: { url: payload.url || './' },
    requireInteraction: false,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for(const c of clientsList){
      if(c.url.includes(url) && 'focus' in c) return c.focus();
    }
    if(self.clients.openWindow) return self.clients.openWindow(url);
  })());
});

// Lokal test: client'tan { type:'show-notif', title, body } mesajı gelirse
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if(msg.type === 'show-notif'){
    self.registration.showNotification(msg.title || 'ABMAT', {
      body: msg.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: msg.tag || 'abmat-local',
      data: { url: msg.url || './' },
    });
  }
  if(msg.type === 'skipWaiting') self.skipWaiting();
});
