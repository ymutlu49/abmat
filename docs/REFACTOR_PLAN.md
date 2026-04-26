# ABMAT — App.js Refactor Planı

## Sorun

`js/App.js` **4562 satır** ve tüm view render mantığı, state yönetimi, servis
koordinasyonu, inline admin CRUD, modal sistemi ve toast sistemini barındırıyor.
Bu durum:

- Test edilebilirliği ortadan kaldırıyor (her şey bir sınıfa bağlı)
- Aynı anda birden fazla geliştiricinin çalışmasını çakışmalarla dolduruyor
- Bir view'deki bug'ı izole etmeyi zorlaştırıyor
- Code navigation ve IDE performansını düşürüyor
- Yeni bir özellik eklenmeye çalışıldığında hangi bölüme ekleneceği belirsiz

## Strateji: Kademeli Çıkarım (Incremental Strangler)

**Büyük bang refactor YAPMA.** Yerine: her bir view'ı tek tek `js/views/`
altına taşı; App.js'deki metod sadece delegasyon yapsın. Bu yolla:

1. Her adım bağımsız test edilebilir
2. Her adım ayrı commit — istenirse geri alınabilir
3. Refactor sırasında yeni feature eklemek engellenmez
4. İnline onclick pattern'i korunur (global `App.xxx()` çağrıları çalışmaya devam eder)

## Mimari

```
js/
├── App.js            ← ince koordinatör (hedef: <1500 satır)
│   ├── constructor: servisleri kur
│   ├── show(view): router
│   ├── _render<X>(): sadece View.render(this) çağrısı
│   ├── event handler metodları (_obNext, _loginSubmit, vb.)
│   └── _esc, _getChild, _toast, _openModal, _closeModal (ortak helper'lar)
│
├── views/
│   ├── BaseView.js              ← arayüz
│   ├── BreathingView.js         ✅ taşındı (örnek)
│   ├── DashboardView.js         ⏳
│   ├── ActivitiesView.js        ⏳
│   ├── OnboardingView.js        ⏳
│   ├── ProfileView.js           ⏳
│   ├── LearnView.js             ⏳
│   ├── ProgressView.js          ⏳
│   ├── PlannerView.js           ⏳
│   ├── NotificationsView.js     ⏳
│   ├── LoginView.js             ⏳
│   ├── TeacherView.js           ⏳
│   ├── OfflineCardsView.js      ⏳
│   ├── StoriesView.js           ⏳
│   ├── SpatialView.js           ⏳
│   ├── BooksView.js             ⏳
│   ├── MathTalkView.js          ⏳
│   └── SmsView.js               ⏳
│
├── services/         (zaten ayrılmış — değiştirme)
├── core/             (zaten ayrılmış — değiştirme)
├── data/             (zaten ayrılmış — değiştirme)
└── skill-bridge/     (zaten kendi alt-sistemi — değiştirme)
```

## View Kontratı

Her view `BaseView`'ı genişletir ve en azından `static render(app)` implement eder:

```js
import { BaseView } from './BaseView.js';

export class FooView extends BaseView {
  static render(app){
    const el = document.getElementById('foo-body');
    if(!el) return;
    // ... HTML string üretimi ...
    el.innerHTML = `...`;
  }

  // Opsiyonel: render sonrası iş (event listener, focus, animasyon)
  static mount(app){
    // örn. IntersectionObserver, keydown handler
  }
}
```

App.js'deki ilgili metod **sadece delege eder**:

```js
_renderFoo(){
  FooView.render(this);
  FooView.mount(this);
}
```

## Adım Adım Yol Haritası

### Faz 1 — Sıfır Risk Çıkarımlar (bağımsız view'lar)

Bu view'lar App.js'deki instance metodlarına minimal bağımlı; ilk çıkarılacaklar:

- [x] `BreathingView` — kaygı yönetimi, 4-4-6 nefes (örnek tamamlandı)
- [ ] `OfflineCardsView` — statik kart listesi
- [ ] `SmsView` — demo SMS kuyruğu
- [ ] `MathTalkView` — sohbet kartları
- [ ] `StoriesView` — başarı hikayeleri

### Faz 2 — Orta Bağımlı View'lar

Servisleri çağırıyor ama state mutasyonu yapmıyor:

- [ ] `BooksView` — kitap listesi + grup
- [ ] `LearnView` — öğrenme modülleri
- [ ] `NotificationsView` — bildirim merkezi
- [ ] `PlannerView` — haftalık plan görünümü
- [ ] `TeacherView` — öğretmen mesajları

### Faz 3 — Ana View'lar (en büyük kazançlar)

- [ ] `DashboardView` — ana sayfa (R5 ritim, öneriler, bağlam seçici)
- [ ] `ActivitiesView` — etkinlik katalog + filtre
- [ ] `ProgressView` — gelişim haritası + TYMM coverage
- [ ] `ProfileView` — profil + yedekleme + PWA install
- [ ] `OnboardingView` — 3 adımlı onboarding + adım kontrol

### Faz 4 — Event Handler Grupları

Render'dan ayrı olarak, event handler'ları da modüllere ayır:

- [ ] `handlers/activity.js` — _startActivity, _completeActivity, _feedbackActivity
- [ ] `handlers/onboarding.js` — _obNext, _obBack, _anxSel, _agSel
- [ ] `handlers/admin.js` — tüm `_e*` inline admin metodları
- [ ] `handlers/breathing.js` — _startBreathing (animasyon state machine)

### Faz 5 — HTML Güvenliği

Tüm `${userInput}` interpolasyonlarını `${this._esc(userInput)}` ile sarmala.
Grep ile tarayıcı:

```bash
grep -n '\${[a-z_]*\.name}' js/App.js
grep -n '\${p\.' js/App.js
grep -n '\${c\.' js/App.js
```

`_esc` zaten eklendi (Quick Win 1). Sıra: her yeni view çıkarılırken içindeki
user-input render'larını da escape etmek.

### Faz 6 — Inline Event Handler → Event Delegation

Inline `onclick="App.xxx()"` yerine tek bir üst-level delegated click handler:

```js
// App constructor:
document.getElementById('app-root').addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]');
  if(!action) return;
  const method = action.dataset.action;
  const arg = action.dataset.arg;
  if(typeof this[method] === 'function') this[method](arg);
});
```

HTML'de:

```html
<button data-action="show" data-arg="dashboard">Ana Sayfa</button>
```

Bu sayede CSP'de `'unsafe-inline'`'a ihtiyaç kalmaz ve güvenlik yüzeyi küçülür.

## Ölçüt

Refactor "tamamlandı" sayılır:

- [ ] `App.js` < 1500 satır
- [ ] Her view kendi dosyasında, 400 satırdan kısa
- [ ] Tüm user-input render'ları `_esc()` ile sarılı
- [ ] `_esc()` unit test edilebilir (örn. XSS payload'larına karşı)
- [ ] CSP header'ı `script-src 'self'` ile çalışıyor (no `unsafe-inline`)
- [ ] Bir view'ı değiştirmek diğerlerine dokunmuyor

## Risk Yönetimi

- **Her adım küçük bir commit** — 3+ view birden taşıma
- **Her taşıma sonrası manuel smoke test**: splash → onboarding → dashboard → her sekme
- **Servis enjeksiyonu değiştirilmez**: view'lar sadece `app` instance'ından okur, yeni servis eklenmez
- **State mutasyonu App.js'de kalır**: view'lar sadece render yapar, `this._parent = ...` gibi yazmalar App.js'de durur

## Kaynak

Bu plan 2026-04-11 değerlendirmesi sonrası hazırlandı. İlgili görevler:

- Quick Win 1 (escapeHtml) → Faz 5'in başlangıcı
- BreathingView → Faz 1'in örneği
