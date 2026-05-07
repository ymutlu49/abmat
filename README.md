# ABMATO — Anne-Baba Matematik Okulu

Okul öncesi ve ilkokul matematiğinde ebeveyn-çocuk etkileşimini destekleyen, araştırma temelli, mobil web uygulaması.

## Proje Yapısı

Tek dosya HTML iken OOP prensiplerine uygun, dağıtıma hazır modüler bir yapıya taşındı:

```
ABMATO/
├── index.html                  HTML kabuğu + görünüm konteynerları
├── css/
│   ├── tokens.css              Tasarım token'ları (renk, boşluk, tipografi)
│   ├── base.css                Reset, body, app-root, view sistemi, geçişler
│   ├── components.css          Navbar, kartlar, butonlar, modal, form, Beceri Köprüsü
│   └── utilities.css           Yardımcı sınıflar, animasyonlar
├── js/
│   ├── main.js                 Giriş noktası: App örneği oluşturur, window.App atar
│   ├── App.js                  MatEvdeApp ana koordinatör sınıfı
│   ├── core/
│   │   ├── constants.js        AgeGroup, AnxietyLevel, ParentingStyle, Category
│   │   └── tymm.js             TYMM (MEB 2024) müfredat çerçevesi
│   ├── services/
│   │   ├── StorageService.js           localStorage sarmalayıcısı
│   │   ├── ActivityRepository.js       Etkinlik sorgu arayüzü
│   │   ├── RecommendationEngine.js     Öneri motoru (SDT + kaygı modelleri)
│   │   ├── BadgeEngine.js              Rozet tanımları
│   │   ├── TeacherMessageService.js    Öğretmen mesaj yönetimi
│   │   ├── PlannerService.js           Haftalık plan servisi
│   │   ├── NotificationService.js      Bildirim kuyruğu
│   │   ├── SmsService.js               SMS gönderim (demo)
│   │   ├── StreakService.js            Günlük etkinlik serisi
│   │   ├── AnxietyTracker.js           Kaygı geçmişi takibi
│   │   └── AdaptiveEngine.js           Uyarlanabilir zorluk motoru
│   ├── data/
│   │   └── activities.js       32+ etkinliğin veri seti (TYMM etiketli)
│   └── skill-bridge/
│       ├── data.js             Modül veri yapıları (SB_BOLUM, SB_MODULLER, ...)
│       ├── SkillProgressStore.js
│       ├── SkillRepository.js
│       ├── SkillProgressService.js
│       ├── SkillBridgeView.js
│       ├── SkillBridgeApp.js
│       └── index.js            createSkillBridge factory
└── README.md                   Bu dosya
```

## Mimari Kararlar

### Katmanlama
- **Çekirdek (`core/`)** — Sabit veriler ve enum benzeri dondurulmuş nesneler. Side-effect yok.
- **Veri (`data/`)** — Saf veri koleksiyonları (etkinlikler). Yalnızca `core` bağımlılığı.
- **Servisler (`services/`)** — İş mantığı ve veri erişimi. DOM'a dokunmaz.
- **Beceri Köprüsü (`skill-bridge/`)** — Tamamen bağımsız alt sistem. Kendi veri, servis ve view katmanı var. Ana uygulamaya `createSkillBridge()` factory'si ile bağlanır.
- **Koordinatör (`App.js`)** — `MatEvdeApp`: Servisleri enjekte alır, görünüm yönlendirmesi yapar, HTML inline handler'lar için `window.App` üzerinden erişilebilir API sunar.
- **Giriş (`main.js`)** — Sadece örnek oluşturma ve global bağlama.

### Bağımlılık Yönü
```
main.js → App.js → services/ ─┐
                             ├→ core/
                              └→ data/
                 → skill-bridge/ (kendi iç bağımlılıklarıyla)
```

Hiçbir alt modül `App.js`'ye bağlı değildir — tek yönlü bağımlılık.

### OOP İlkeleri
- **Tek Sorumluluk**: Her servis tek bir konsepti yönetir (StorageService yalnızca localStorage, RecommendationEngine yalnızca skorlama vb.).
- **Bağımlılık Enjeksiyonu**: Servisler constructor üzerinden bağımlılık alır (`new PlannerService(storage, repo)`).
- **Encapsulation**: `_` önekli alanlar özel olarak işaretlenir. `SkillProgressStore` gerçek private `#` alanları kullanır.
- **Immutability**: Enum'lar ve müfredat verisi `Object.freeze` ile dondurulmuştur.
- **Factory Pattern**: `createSkillBridge()` karmaşık bağımlılık ağını gizler.

## Çalıştırma (Yerel)

ES modülleri `file://` protokolü ile çalışmaz; yerel bir HTTP sunucusu gerekir.

### Python ile (önerilen)
```bash
cd ABMATO
python -m http.server 8080
```
Tarayıcıdan: `http://localhost:8080/`

### Node.js ile
```bash
cd ABMATO
npx serve
```

### VS Code ile
"Live Server" eklentisini kurup `index.html`'yi açın.

## Dağıtım (Static Hosting)

Hiçbir build adımı gerekmez — tüm dosyalar tarayıcı tarafından doğrudan yorumlanır.

### GitHub Pages
```bash
git init
git add .
git commit -m "ABMATO yapılandırıldı"
git branch -M main
git remote add origin https://github.com/<kullanici>/abmat.git
git push -u origin main
```
Repo ayarlarından Pages → Branch: `main`, Folder: `/ (root)`.

### Netlify
1. https://app.netlify.com/drop sayfasına ABMATO klasörünü sürükleyip bırakın.
2. Veya repo'yu bağlayın: Build command — boş; Publish directory — `/`.

### Vercel
```bash
npm i -g vercel
cd ABMATO
vercel
```
Framework preset: "Other". Build command — boş. Output directory — `./`.

### Herhangi bir statik sunucu
Tüm `ABMATO/` klasörünü sunucuya yüklemek yeterlidir. Nginx/Apache ile ek konfigürasyon gerekmez.

## Tarayıcı Uyumluluğu

Modern tarayıcılar (son 2 yıl):
- Chrome 91+
- Safari 15+ (iOS 15+)
- Firefox 90+
- Edge 91+

Gereksinimler:
- ES2020+ (optional chaining, private class fields)
- ES modules
- CSS custom properties
- `env(safe-area-inset-*)` — iOS çentik desteği

## Yerel Veri

Tüm kullanıcı verisi `localStorage`'da tutulur (anahtar öneki: `matevde_v2:`). Sunucu yok, veri cihazda kalır.

- `matevde_v2:parent` — ana ebeveyn profili
- `matevde_v2:parent_<userId>` — çoklu hesap profilleri
- `matevde_v2:obs_notes` — etkinlik gözlem notları
- `matevde_v2:streak` — günlük seri
- `matevde_v2:anxiety_history` — kaygı geçmişi
- `matevde:skill_progress` — Beceri Köprüsü ilerlemesi

## Kaynak Dosya

Orijinal tek dosya (`MatEvde_v2.html`) proje klasöründe referans olarak korunmaktadır. Üretimde yalnızca `index.html` kullanılır; eski dosyaya dağıtım gerekmez.

## Geliştirme Notları

### Yeni Etkinlik Ekleme
`js/data/activities.js` dosyasına yeni bir nesne ekleyin. Alanlar:
```js
{
  id: 'x99', emoji: '🎯', title: '...',
  desc: '...',
  ageGroups: [AgeGroup.G1, AgeGroup.G2],
  category: Category.NUMBER, dur: 15,
  materials: [...], steps: [...],
  tip: '...',
  anxFriendly: true, dysc: false, tags: [...],
  sesAlt: '...',
  tymm_oo: ['MAB1'], tymm_il: ['MAB1'], tymm_t: ['T1'], tymm_yas: ['60-72']
}
```

### Yeni Servis Ekleme
1. `js/services/<Name>.js` oluşturun.
2. `class <Name> { constructor(...){} }` + `export { <Name> };` yapısını kullanın.
3. `js/App.js` içinde import edip `this._<alan> = new <Name>(...)` ile bağlayın.

### İleri Refactor
`MatEvdeApp` sınıfı hâlâ tüm görünümleri tek bir dosyada barındırır (~3200 satır). Sonraki adım: her görünüm için ayrı bir controller sınıfı (`DashboardController`, `ActivitiesController` vb.) oluşturup `App.js`'yi yalnızca yönlendirme yapan ince bir koordinatöre indirgemek. Mevcut yapı bu adımı kolaylaştıracak şekilde hazırlandı — servisler ve veri zaten bağımsız modüller halinde.

## Lisans

Prof. Dr. Yılmaz Mutlu — Anne-Baba Matematik Okulu / Diskalkuli Derneği
