# ABMAT — cPanel Deploy Rehberi

> Hedef sunucu: **diskalkulidernegi.org** (cPanel)
> Repo: https://github.com/ymutlu49/abmat
> Sonuç URL (önerilen): https://abmat.diskalkulidernegi.org

ABMAT statik bir PWA'dır — build adımı yok. Sadece dosyaları sunucuya koyman yeterli. 3 yöntem var; **Git Version Control** en profesyonel olanı çünkü her `git push`tan sonra tek tıkla güncelleme yapabilirsin.

---

## A. Önerilen: Subdomain Kurulumu (`abmat.diskalkulidernegi.org`)

### Adım 1 — Subdomain oluştur
1. cPanel → **Subdomains** (veya **Domains → Create A New Domain**)
2. Subdomain alanı: `abmat`
3. Domain: `diskalkulidernegi.org`
4. Document Root otomatik: `/home/diskalkulidernek/public_html/abmat`
5. **Create**

### Adım 2 — SSL aktif et (Let's Encrypt ücretsiz)
1. cPanel → **SSL/TLS Status**
2. `abmat.diskalkulidernegi.org` satırını seç → **Run AutoSSL**
3. Yeşil onay gelince HTTPS hazır

### Adım 3 — Deploy (3 yöntemden birini seç)

#### 🥇 Yöntem 1: Git Version Control (önerilen — auto-deploy)

1. cPanel → **Git Version Control** → **Create**
2. **Clone URL:** `https://github.com/ymutlu49/abmat.git`
3. **Repository Path:** `/home/diskalkulidernek/repositories/abmat`
4. **Repository Name:** `abmat`
5. **Branch:** `main`
6. **Create** — repo klonlanır
7. **Manage** sekmesi → **Pull or Deploy** → **Deploy HEAD Commit**
   - Bu, `.cpanel.yml` içindeki adımları çalıştırarak dosyaları `public_html/abmat/` altına kopyalar
8. Her güncelleme için: `git push` → cPanel'de "Update from Remote" + "Deploy HEAD Commit"

> ⚠️ `.cpanel.yml` içindeki `DEPLOYPATH` doğru kullanıcı adınızı içermeli. Şu an `/home/diskalkulidernek/public_html/abmat/` olarak ayarlı. cPanel kullanıcı adın farklıysa repo'da bu satırı düzelt:
> ```yaml
> - export DEPLOYPATH=/home/<KULLANICI_ADIN>/public_html/abmat/
> ```

#### 🥈 Yöntem 2: ZIP Yükle (en hızlı, manuel)

1. GitHub'dan repo'yu zip indir:
   `https://github.com/ymutlu49/abmat/archive/refs/heads/main.zip`
2. cPanel → **Dosya Yöneticisi** → `public_html/abmat/` klasörüne git
3. **Yükle** → zip dosyasını yükle
4. Yüklenen zip'e sağ tık → **Çıkar** (Extract)
5. Çıkan `abmat-main` klasörünün içeriğini kese-yapıştır ile `abmat/` klasörüne taşı
6. zip dosyasını sil

#### 🥉 Yöntem 3: FTP / SFTP (FileZilla)

1. FileZilla ile cPanel FTP bilgileriyle bağlan
2. Yerel `ABMAT/` klasörünün içeriğini sunucudaki `/public_html/abmat/`'a yükle
3. Bitti

### Adım 4 — Test
- https://abmat.diskalkulidernegi.org adresine git
- DevTools → Application → Service Workers: `service-worker.js` aktif olmalı
- DevTools → Application → Manifest: ABMAT görünmeli
- "Add to Home Screen" mobilden çalışmalı

---

## B. Alternatif: Alt dizin (`diskalkulidernegi.org/abmat`)

WordPress kurulu ana sitenle çakışmaması için alt dizin kullanmak istiyorsan:

1. cPanel → Dosya Yöneticisi → `public_html/abmat/` klasörü oluştur
2. Yukarıdaki **Yöntem 1/2/3** ile dosyaları yükle
3. WordPress `.htaccess` (`public_html/.htaccess`) içinde RewriteRules abmat'ı kapsayabilir. Şu satırları **WordPress kuralları başlamadan önce** ekle:
   ```apacheconf
   RewriteEngine On
   RewriteRule ^abmat/ - [L]
   ```
   Böylece `/abmat/...` istekleri ABMAT'ın kendi `.htaccess`'ine düşer.
4. Test: https://www.diskalkulidernegi.org/abmat/

---

## C. Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|---|---|
| **Sayfa boş, console "module not found"** | `.htaccess` aktif değil veya `AllowOverride` kapalı. cPanel destek hattı `AllowOverride All` ayarlasın. |
| **Service Worker kayıt olmuyor** | Site HTTPS değil. Adım 2'deki SSL'i tamamla. |
| **Logo yüklenmiyor** | Dosyalar yanlış izinde. Dosya Yöneticisi → tüm dosyaları seç → **İzinler** → 644 yap (dizinler için 755). |
| **PWA "Add to Home" butonu yok** | manifest.json yüklenememiş. https://abmat.diskalkulidernegi.org/manifest.json doğrudan açılınca JSON görünmeli. |
| **Eski sürüm görünüyor** | Tarayıcı cache + SW. DevTools → Application → "Unregister" SW + Ctrl+Shift+R. |
| **404'lerde index.html dönmüyor** | `.htaccess`'teki RewriteRule kuralları çalışmıyor — mod_rewrite kontrolü gerekli. |

---

## D. Güncelleme Akışı (Git Version Control kullanıyorsan)

Lokalde:
```bash
git add .
git commit -m "..."
git push origin main
```

Sunucuda (cPanel):
1. **Git Version Control** → repo satırı → **Manage**
2. **Pull or Deploy** sekmesi
3. **Update from Remote** (en son commit gelir)
4. **Deploy HEAD Commit** (`.cpanel.yml` çalışır, dosyalar kopyalanır)

İki tıkla güncelleme. ✓

---

## E. Manifest / Scope Notu

`manifest.json` ve `service-worker.js` göreli yollar (`./`) kullanır — bu sayede subdomain (`abmat.diskalkulidernegi.org`) veya alt dizin (`diskalkulidernegi.org/abmat/`) farketmez, ek değişiklik gerekmez.

İstersen `manifest.json` içindeki `start_url` ve `scope` alanlarını mutlak olarak da yazabilirsin (örneğin alt dizinde sorun çıkarsa):
```json
"start_url": "/abmat/",
"scope":     "/abmat/"
```

---

## F. Domain Yönlendirme (opsiyonel)

`www.diskalkulidernegi.org` üzerinden ABMAT'a yönlendirme istersen:
- WordPress'te bir menü öğesi: "ABMAT — Anne-Baba Matematik Okulu" → `https://abmat.diskalkulidernegi.org`
- Ya da ana sayfaya banner: "Çocuğunuzla evde matematik" + buton

İletişim ipucu: ABMAT Hakkında sayfasında derneğin web URL'si, üyelik ve bağış bağlantıları zaten var (`AboutView.js`).
