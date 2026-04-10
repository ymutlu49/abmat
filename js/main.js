/* ═══════════════════════════════════════════════════════════
   ABMAT — Uygulama Giriş Noktası
   ES modül olarak yüklenir; DOM hazır olduğunda uygulamayı başlatır.
═══════════════════════════════════════════════════════════ */

import { MatEvdeApp } from './App.js';

// Tekil uygulama örneği
const App = new MatEvdeApp();

// HTML'deki inline onclick="App.xxx()" ifadelerinin çalışabilmesi için
// global alana aç. Modül kapsamı dışarıdan erişime izin vermediğinden
// bu adım gereklidir.
window.App = App;

// İsteğe bağlı: DOM hazır olduğunda bootstrap kancası
// (uygulamayı kullanıcı etkileşimi başlatıyor — splash üzerindeki
// "Başla" butonu App.start() çağırıyor; burada otomatik başlatmıyoruz.)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Başlangıç görünümü HTML tarafından (`#view-splash.active`) ayarlı.
    // Burada splash hazır hale getirilebilir.
  });
}
