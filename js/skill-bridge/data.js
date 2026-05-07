/* ABMATO — Beceri Köprüsü: Veri katmanı
   Modül tanımları ve ENUMlar (Saf veri, side-effect yok)
   Kaynak: Diskalkuli Derneği / MEB TYMM 2024 hizalanmış */

const SB_BOLUM = Object.freeze({
  GIRIS:      'giris',
  SAYI_HISSI: 'sayi_hissi',
  ARACLAR:    'araclar',
  BASAMAK:    'basamak',
  ISLEM:      'islem',
  OLGULAR:    'olgular',
  SOZEL:      'sozel',
});

// ─────────────────────────────────────────────────────────────
// ENUM: Sınıf/yaş grupları (MEB)
// ─────────────────────────────────────────────────────────────
const SB_SINIF = Object.freeze({
  OO:  'Okul Öncesi',
  S1:  '1. Sınıf',
  S2:  '2. Sınıf',
  S3:  '3. Sınıf',
  S4:  '4. Sınıf',
});

// ─────────────────────────────────────────────────────────────
// ENUM: Araç/materyal tipleri
// ─────────────────────────────────────────────────────────────
const SB_ARAC = Object.freeze({
  FIZIKSEL:  'fiziksel',   // somut nesneler (fasulye, boncuk)
  KAGIT:     'kagit',      // çizilen/yazdırılan araçlar
  DIJITAL:   'dijital',    // ekran/uygulama
  VUCUTSAL:  'vucutsal',   // parmak, el, vücut
});

// ─────────────────────────────────────────────────────────────
// MODEL: Adım (her modülün uygulama adımı)
// ─────────────────────────────────────────────────────────────
// { no, eylem, ipucu? }
// eylem: ebeveynin somut olarak yapacağı şey
// ipucu: özerklik destekleyici soru/yaklaşım (isteğe bağlı)

// ─────────────────────────────────────────────────────────────
// MODEL: Modül
// ─────────────────────────────────────────────────────────────
// {
//   id, bolum, sira, emoji, baslik, altBaslik,
//   siniflar: SB_SINIF[],
//   sure: dakika,
//   hedef: string,
//   tymm: { oo?: string[], il?: string[], tema?: string[] },
//   araclar: { zorunlu, evYapimi? },
//   adimlar: Step[],
//   sorular: string[],      // özerklik destekleyici sorular
//   dikkatler: string[],    // yapmaması gerekenler
//   sesAlt?: string,        // düşük bütçe alternatifi
//   onKosul?: string,       // hangi modül tamamlanmalı
// }

// ─────────────────────────────────────────────────────────────
// VERİ: Bölüm meta bilgileri
// ─────────────────────────────────────────────────────────────
const SB_BOLUM_META = Object.freeze({
  [SB_BOLUM.GIRIS]:      { emoji: '🚀', ad: 'Neden Bu Yöntemler?',   renk: '#6366f1' },
  [SB_BOLUM.SAYI_HISSI]: { emoji: '🔢', ad: 'Sayı Hissi Temelleri',  renk: '#f59e0b' },
  [SB_BOLUM.ARACLAR]:    { emoji: '🛠️', ad: 'Matematik Araçları',    renk: '#10b981' },
  [SB_BOLUM.BASAMAK]:    { emoji: '🏗️', ad: 'Basamak Değeri',        renk: '#3b82f6' },
  [SB_BOLUM.ISLEM]:      { emoji: '➕', ad: 'Toplama ve Çıkarma',     renk: '#ef4444' },
  [SB_BOLUM.OLGULAR]:    { emoji: '⚡', ad: 'Sayı Olguları',          renk: '#8b5cf6' },
  [SB_BOLUM.SOZEL]:      { emoji: '📖', ad: 'Sözel Problemler',       renk: '#06b6d4' },
});

// ─────────────────────────────────────────────────────────────
// VERİ: Modüller (20 modül — tüm belgelerden uyarlandı)
// ─────────────────────────────────────────────────────────────
const SB_MODULLER = Object.freeze([

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 0 — GİRİŞ                                        ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-giris',
    bolum: SB_BOLUM.GIRIS,
    sira: 0,
    emoji: '🎯',
    baslik: 'Neden Bu Yöntemler?',
    altBaslik: 'Sayı hissi ve derin kavrayış',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1, SB_SINIF.S2, SB_SINIF.S3, SB_SINIF.S4],
    sure: 8,
    hedef: 'Modern matematik öğretiminin neden farklı göründüğünü, bunun çocuğunuza nasıl fayda sağladığını anlayın.',
    tymm: { oo: ['MAB1','MAB2'], il: ['MAB1','MAB2'] },
    araclar: { zorunlu: [], evYapimi: null },
    adimlar: [
      { no: 1, eylem: 'Bu kısa metni okuyun: Geçmişte "2+2=4" ezberledik. Ama neden 4 olduğunu bilen kaç kişi var?' },
      { no: 2, eylem: 'Çocuğunuza şu soruyu sorun: "15+9\'u kafadan nasıl hesaplarsın?" — cevabı not edin.' },
      { no: 3, eylem: 'Şimdi siz hesaplayın: 15+9 = 15+10-1 = 25-1 = 24. Bunu düşündünüz mü?' },
      { no: 4, eylem: 'Farkı tartışın: Kural ezberlemek mi, yoksa sayıların nasıl çalıştığını anlamak mı?' },
    ],
    sorular: [
      '"Sence 15+9\'u hesaplamanın kaç farklı yolu var?"',
      '"Hangi yol sana daha kolay geldi? Neden?"',
      '"Bu sonuca başka nasıl ulaşabilirdik?"',
    ],
    dikkatler: [
      '"Yanlış yapıyorsun, böyle yapılmaz" — yöntem farkı hata değildir.',
      'Kendi öğrendiğiniz yöntemi tek doğru olarak sunmayın.',
    ],
    sesAlt: null,
    onKosul: null,
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 1 — SAYI HİSSİ TEMELLERİ                        ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-sayma1',
    bolum: SB_BOLUM.SAYI_HISSI,
    sira: 1,
    emoji: '🫘',
    baslik: 'Sayma — Temel Beceriler',
    altBaslik: 'Somutlaştırma, birebir eşleme, sıralı sayma',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1],
    sure: 10,
    hedef: 'Çocuğunuzun sayıları ezberden söylemekten, sayıların gerçek miktarı temsil ettiğini kavramaya geçmesini sağlayın.',
    tymm: {
      oo:   ['MAB6', 'MAB1'],
      il:   ['MAB1'],
      tema: ['T1'],
    },
    araclar: {
      zorunlu: ['Küçük nesneler (fasulye, boncuk, düğme, taş)'],
      evYapimi: 'Her evde fasulye veya makarna var. Ekstra materyal gerekmez.',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Masaya 7 fasulye koyun. Çocuğunuza saydırın.',
        ipucu: 'Hepsini bir kerede saymaya çalışabilir — bu normal. Bekleyin.',
      },
      {
        no: 2,
        eylem: '"Her fasulye bir parmağa denk" kuralı: saydıkça fasulyeleri tek tek ayırın.',
        ipucu: '"Sence kaç tane var?" — tahmin yaptırın, ardından saydırın.',
      },
      {
        no: 3,
        eylem: 'Sayma bitince "son söylediğin sayı kaç tane olduğunu söylüyor" kuralını uygulayın. Sona dönerek pekiştirin.',
        ipucu: 'Önemli: "Kaç tane var?" sorusunu saydıktan SONRA tekrar sorun.',
      },
      {
        no: 4,
        eylem: 'Nesneleri karıştırın, tekrar saydırın. Sayı değişti mi? Niçin?',
        ipucu: '"Yerlerini değiştirdim, sence sayı değişti mi?" — önce düşündürün.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Bugün ne keşfettin?" diye sorun. Dinleyin.',
      },
    ],
    sorular: [
      '"Nasıl biliyorsun ki bu kadar?"',
      '"Kaçtan başlasan bile aynı sonucu alır mısın?"',
      '"Şekli değiştirirsek sayı değişir mi?"',
      '"Sen saydın, bir de ben sayayım — aynı mı çıkıyor?"',
    ],
    dikkatler: [
      'Çocuk saymadan önce tahmini sormayı atlamayın — tahmin, düşünmeyi başlatır.',
      '"Hayır, yanlış" demeyin. "Bir daha bakalım" deyin.',
      'Hepsini en baştan saymak istiyorsa engelleyin — birebir eşleme önce gelir.',
    ],
    sesAlt: 'Fasulye yoksa: çamaşır klipsleri, küçük taşlar, plastik kapaklar — boyutu yakın olsun.',
    onKosul: null,
  },

  {
    id: 'sb-sayma2',
    bolum: SB_BOLUM.SAYI_HISSI,
    sira: 2,
    emoji: '🔄',
    baslik: 'İleri Sayma — Ritmik ve Üzerine Sayma',
    altBaslik: 'İleri-geri, üzerine sayma, sıralama',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1, SB_SINIF.S2],
    sure: 12,
    hedef: 'Herhangi bir sayıdan ileri veya geri sayabilme; toplama ve çıkarmanın zihinsel altyapısı.',
    tymm: {
      oo:   ['MAB6', 'MAB1', 'MAB2'],
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Küçük arabalar veya oyuncaklar (3-6 adet)', 'Küçük kağıt kartlar (1-14 yazılı)'],
      evYapimi: 'Kağıt parçalarına rakamları yazın — cetvel veya düzgünlük gerekmez.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '3 arabayı yavaşça masaya sürerken saydırın: "bir, iki, üç." Sonra geri çekerken tersine: "üç, iki, bir."',
        ipucu: 'Ritimli ve yavaş yapın. İlk birkaç denemede siz de birlikte sayın.',
      },
      {
        no: 2,
        eylem: '1\'den 14\'e kadar yazılı kartları karıştırın. Bir kart çektirin. İkinci kartı çektirin: "Bu nereye gitmeli — sağına mı soluna mı?"',
        ipucu: '"Sence neden sol tarafa koymalıyız?" — karar vermesini değil gerekçelendirmesini isteyin.',
      },
      {
        no: 3,
        eylem: '"Üzerine sayma" pratiği: Masada 4 araç var. 3 tane daha getiriyor. Hepsini baştan saymak isterse durdurun: "4\'ü biliyoruz, oradan devam et: beş, altı, yedi."',
        ipucu: 'Bu kritik adım. Sabırla bekleyin — alışması zaman alabilir.',
      },
      {
        no: 4,
        eylem: '"89\'dan 100\'e kadar say" gibi büyük sayılarla tekrarlayın.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Hangi sayıdan saymak sana en kolay geldi?"',
      },
    ],
    sorular: [
      '"Kaçı zaten biliyordun? Oradan devam edebilir misin?"',
      '"Geri sayarken ileri saymaktan farkı var mı?"',
      '"89\'dan 100\'e kaç adım atman gerekiyor?"',
    ],
    dikkatler: [
      'Her seferinde 1\'den başlatmayın — üzerine sayma becerisini öldürür.',
      'Geri sayma ilk seferde zorlanabilir — normal, ısrarla devam edin.',
    ],
    sesAlt: 'Arabalar yoksa: parmaklar, taşlar veya yüksek sesle adım atarak sayın.',
    onKosul: 'sb-sayma1',
  },

  {
    id: 'sb-subitizing',
    bolum: SB_BOLUM.SAYI_HISSI,
    sira: 3,
    emoji: '⚡',
    baslik: 'Şipşak Sayma (Subitizing)',
    altBaslik: 'Sayı örüntülerini tek bakışta tanıma',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1],
    sure: 10,
    hedef: 'Küçük miktarları (1-6) tek bakışta, saymadan tanıma; sayı örüntüsü farkındalığı.',
    tymm: {
      oo:   ['MAB6', 'MAB1'],
      il:   ['MAB1'],
      tema: ['T1'],
    },
    araclar: {
      zorunlu: ['Noktalı kağıt tabaklar (3 adet) veya zar'],
      evYapimi: 'Tabak yoksa: kağıda 3-6 nokta basın (farklı düzenlerde). Etiket işaretçi veya kalemle 2 saniyede yapılır.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '3 noktalı kartı 2-3 saniye gösterip gizleyin. "Kaç tane gördün?" sorun.',
        ipucu: 'Hemen söyleyemezse süreyi uzatın. Amaç saydırmadan tanıtmak.',
      },
      {
        no: 2,
        eylem: '"Nasıl gördün?" diye sorun. "2 ve 1" mi gördü, yoksa "3" mü? Her ikisi de doğru.',
        ipucu: 'Farklı görme biçimleri olduğunu vurgulayın — tek doğru yol yok.',
      },
      {
        no: 3,
        eylem: 'Zarla oynayın: atan kişi zarı hızla kapatır. Diğeri kaç geldiğini söyler.',
      },
      {
        no: 4,
        eylem: '5\'ten büyük örüntülere geçin. İki farklı renk kullanın: "3 kırmızı ve 4 siyah — kaç tane?"',
        ipucu: '"Nasıl parçalara ayırdın?" sorusu matematiksel düşünmeyi açığa çıkarır.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Sana en kolay hangi sayı geldi?"',
      },
    ],
    sorular: [
      '"Kaçını saymadan gördün?"',
      '"Başka nasıl görebilirdin?"',
      '"Zarı atmadan önce kaç geleceğini tahmin edebilir misin?"',
    ],
    dikkatler: [
      'Çocuğun saymak istediğini görürseniz süreyi kısaltın.',
      '7\'nin üzerindeki sayılarla başlamayın.',
    ],
    sesAlt: 'Kart ve zar yoksa: bir avuç fasulye masaya saçın — kaç tane gördün?',
    onKosul: 'sb-sayma1',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 2 — MATEMATİK ARAÇLARI                          ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-beslik',
    bolum: SB_BOLUM.ARACLAR,
    sira: 4,
    emoji: '5️⃣',
    baslik: 'Beşlik Kart (5-Çerçeve)',
    altBaslik: '5\'i parçalama, 5 uzmanı olma',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1],
    sure: 12,
    hedef: '5\'i oluşturan tüm sayı çiftlerini keşfetmek; 5\'i köprü olarak kullanma becerisini geliştirme.',
    tymm: {
      oo:   ['MAB6', 'MAB1', 'MAB2', 'MAB3'],
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['5 kutucuklu ızgara (çizilmiş veya banttan yapılmış)', '~10 sayaç (2 farklı renk)'],
      evYapimi: 'Kağıda 5 kare çizin. Sayaç yoksa: 5 kırmızı düğme + 5 beyaz düğme. Ya da her iki tarafı farklı renk olan bozuk paralar.',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Çocuğunuza 5 kutucuklu ızgarayı gösterin. "Buraya soldan başlayarak sayaçları koy" deyin.',
      },
      {
        no: 2,
        eylem: '3 kırmızı koymasını isteyin. "Kaç tane daha koyarsam 5 olur?" sorun.',
        ipucu: 'Saydırmadan önce tahmin yaptırın: "Sence kaç tane eksik?"',
      },
      {
        no: 3,
        eylem: 'Tüm kombinasyonları keşfettirin: 0+5, 1+4, 2+3, 3+2, 4+1, 5+0.',
      },
      {
        no: 4,
        eylem: 'Çerçeveyi kapatın. "5\'i kaç farklı şekilde yapabiliriz?" diye sorun — ezberden değil, düşünerek söylesin.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Hangi ikili sana en çabuk geldi?"',
      },
    ],
    sorular: [
      '"Sence 5\'i kaç farklı şekilde yapabiliriz?"',
      '"2 kırmızı koydun — daha kaç tane lazım?"',
      '"Renkleri değiştirirsek sayı değişir mi?"',
    ],
    dikkatler: [
      'Sayaçları rastgele koymaya izin vermeyin — soldan sağa kural kalıbı oluşturur.',
      'Tüm kombinasyonlara ulaşması için acele etmeyin.',
    ],
    sesAlt: 'Banttan 5 kutu zemine yapıştırın. Sayaç yerine küçük taşlar veya kapaklar kullanın.',
    onKosul: 'sb-sayma1',
  },

  {
    id: 'sb-onluk',
    bolum: SB_BOLUM.ARACLAR,
    sira: 5,
    emoji: '🔟',
    baslik: 'Onluk Kart (10-Çerçeve)',
    altBaslik: '10\'u parçalama, 10 uzmanı olma',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 15,
    hedef: '10\'u oluşturan tüm çiftleri öğrenmek; 10\'u köprü/çıpa olarak kullanma.',
    tymm: {
      oo:   ['MAB1', 'MAB2'],
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['10 kutucuklu ızgara (2 satır × 5)', '~20 sayaç (2 farklı renk)'],
      evYapimi: 'Beşlik kartın altına 5 kutu daha ekleyin. Sayaç: lego, şeker, bozuk para.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"7\'yi kur" deyin. Üst satırı önce dolduracak, sonra alta geçecek.',
        ipucu: 'Yanlış başlarsa: "5\'i önce bitirmeyi denedin mi?"',
      },
      {
        no: 2,
        eylem: '"Bu nasıl 7?" diye sorun. Cevap: "5 ve 2 daha", "10\'dan 3 eksik" vb.',
      },
      {
        no: 3,
        eylem: '"Aynı 7\'yi başka renkle göster." Kombinasyonları çoğaltın.',
      },
      {
        no: 4,
        eylem: '10\'luk gerçekleri: 10 adet çerçeve yazdırın/çizin. Tüm 10\'lu gerçekleri (1+9, 2+8...) bu çerçevelerle keşfettirin.',
        ipucu: 'Çerçeveleri yan yana koyun — görsel örüntü çok güçlü.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Hangi ikili kafana en çabuk geldi?"',
      },
    ],
    sorular: [
      '"8\'i gördüğünde 10\'a kaç var?"',
      '"Başka nasıl yapabilirdin?"',
      '"Neden önce üstü doldurdun?"',
    ],
    dikkatler: [
      'Üst satır 5 dolmadan alta geçmeye izin vermeyin.',
      'Sayıları yazmadan, sayarak keşfettirin.',
    ],
    sesAlt: 'Çerçeve yerine: yumurta kutusunun 10 gözü. Sayaç: misket, fasulye.',
    onKosul: 'sb-beslik',
  },

  {
    id: 'sb-yuzluk',
    bolum: SB_BOLUM.ARACLAR,
    sira: 6,
    emoji: '💯',
    baslik: 'Yüzlük Tablo (100 Kart)',
    altBaslik: 'Sayılar arası örüntüler ve ilişkiler',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 15,
    hedef: '100\'e kadar sayı örüntülerini keşfetmek; onluk sistemi görsel olarak anlamak.',
    tymm: {
      il:   ['MAB1', 'MAB4'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Yüzlük tablo (basılı veya çizilmiş)', 'İşaret parçası (kapak veya düğme)'],
      evYapimi: 'A4 kağıda 10×10 kare çizin, içlerine 1-100 yazın. 10 dakika sürer, bir kez çizin.',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Tablonun sadece 1-30 kısmını gösterin. "Bunları sayar mısın?" — tek tek sayın.',
      },
      {
        no: 2,
        eylem: '"25\'in altında ne var?" sorun. 35. "35, 25\'ten kaç büyük?"',
        ipucu: 'Tablo üzerinde hareket edin: bir aşağı = 10 fazla. Bunu keşfettirin.',
      },
      {
        no: 3,
        eylem: '"Hangi sütundaki sayılar 5 ile bitiyor?" — örüntü bulmak.',
      },
      {
        no: 4,
        eylem: '"64\'e işaret koy. Oradan 10 ileri git — kaçtasın?" Tabloda hareket ettirin.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Tabloda seni şaşırtan bir şey fark ettin mi?"',
      },
    ],
    sorular: [
      '"Bu sütundaki sayıların ortak özelliği ne?"',
      '"10 artırınca her zaman ne değişiyor, ne aynı kalıyor?"',
      '"Kaçtasın? Bir satır aşağıya gidersen?"',
    ],
    dikkatler: [
      'Tüm tabloyu baştan vermeyin — kısım kısım açın.',
      'Ezber yaptırmayın, örüntü buldurturun.',
    ],
    sesAlt: 'Tablo yoksa: not kağıtlarına 1-100 yazıp zemine dizi yapın.',
    onKosul: 'sb-sayma2',
  },

  {
    id: 'sb-onceson',
    bolum: SB_BOLUM.ARACLAR,
    sira: 7,
    emoji: '📏',
    baslik: 'Açık Sayı Doğrusu',
    altBaslik: 'Sayıların konumu ve ilişkisi',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1, SB_SINIF.S2],
    sure: 12,
    hedef: 'Sayıların birbirine göre konumunu ve aralarındaki ilişkiyi görsel olarak anlamak.',
    tymm: {
      oo:   ['MAB1', 'MAB3'],
      il:   ['MAB1', 'MAB3'],
      tema: ['T1', 'T3'],
    },
    araclar: {
      zorunlu: ['İp veya şerit', 'Not kağıtları veya mandal'],
      evYapimi: 'Bir sicim gerin, rakam yazdığınız kağıtları ataçla asın. Ya da masaya bant uzatın.',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Boş bir çizgi çizin. 0 ve 10\'u uçlara koyun. "5 nereye gitmeli?" sorun.',
        ipucu: 'Tam ortaya koymasını beklemeden "Neden orası?" sorusunu sorun.',
      },
      {
        no: 2,
        eylem: '0, 5 ve 10 varken: "3 nereye gider?" — konumu tartışın.',
      },
      {
        no: 3,
        eylem: 'Kaldırım tebeşiriyle büyük sayı doğrusu çizin. Çocuğu üstünde yürütün.',
      },
      {
        no: 4,
        eylem: '"46\'dan 20 ileri git." Sayı doğrusunda atlama yapın.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Sayı doğrusu sana neyi gösterdi?"',
      },
    ],
    sorular: [
      '"5 burada neden tam ortada?"',
      '"7 ile 10 arasında kaç sayı var?"',
      '"46\'dan 10 ileri gidersem neredeyim?"',
    ],
    dikkatler: [
      'Sayı doğrusunu çok erken rakamla doldurmayın.',
      'Çocuğun tahminini söylemeden önce düşünme süresi tanıyın.',
    ],
    sesAlt: 'İp yoksa: zemine bant yapıştırın veya tebeşirle çizin.',
    onKosul: 'sb-sayma2',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 3 — BASAMAK DEĞERİ                               ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-basamak1',
    bolum: SB_BOLUM.BASAMAK,
    sira: 8,
    emoji: '🏗️',
    baslik: 'Basamak Değeri — 20\'ye Kadar',
    altBaslik: 'Onluk ve birlikler, sayıları parçalama',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1],
    sure: 15,
    hedef: '11-20 arası sayıların "bir onluk + birlikler" yapısını somut nesnelerle kavramak.',
    tymm: {
      oo:   ['MAB6', 'MAB1', 'MAB3'],
      il:   ['MAB1'],
      tema: ['T1'],
    },
    araclar: {
      zorunlu: ['20 adet küçük nesne (fasulye)', '1 bardak veya kap (onluğu temsil eder)'],
      evYapimi: 'Bardak = onluk. İçine tam 10 fasulye. Dışarıda kalanlar = birlikler.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"13 tane fasulye koy." Çocuk saydıkça bir kaba koyun.',
        ipucu: '10\'a ulaşınca: "Dur — şimdi bardağı dolduralım. Kaç tane koyacağız?"',
      },
      {
        no: 2,
        eylem: '"Şimdi bardakta kaç var, dışarıda kaç var?" Sorun: "Bu sayıyı nasıl söyleriz?"',
      },
      {
        no: 3,
        eylem: '"35\'e kadar say" diyerek bardaklara devam edin. Üç bardak + birlikler.',
      },
      {
        no: 4,
        eylem: '"Rakamda hangi sayı onlukları, hangi sayı birlikleri söylüyor?" — 13 → "1" onluk, "3" birlik.',
        ipucu: 'Çocuğun kendi bulmasını bekleyin. Doğrudan anlatmayın.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Bardak neden 10 taşıyor, neden 9 veya 11 değil?"',
      },
    ],
    sorular: [
      '"Bu sayının onluğu kaç, birliği kaç?"',
      '"35 dersen — kaç bardak doluyken kaç fasulye dışarıda kalır?"',
      '"Neden bardağa tam 10 koyduk?"',
    ],
    dikkatler: [
      '"1 onluk + 3 birlik" kuralını baştan söylemeyin — çocuğun keşfetmesini bekleyin.',
      'Sayıyı önce somut, sonra sembolik (rakamla) gösterin.',
    ],
    sesAlt: 'Bardak yoksa: içine 10 kağıt topu sığan bir kutu. Fasulye yerine taş.',
    onKosul: 'sb-sayma2',
  },

  {
    id: 'sb-basamak2',
    bolum: SB_BOLUM.BASAMAK,
    sira: 9,
    emoji: '🧱',
    baslik: 'Basamak Değeri — 100\'e ve Ötesine',
    altBaslik: 'Önceden gruplu modeller, 3 basamak',
    siniflar: [SB_SINIF.S2, SB_SINIF.S3],
    sure: 20,
    hedef: 'Onluk bloklarla (hazır gruplu modeller) 100\'e kadar ve üç basamaklı sayıları temsil etmek.',
    tymm: {
      il:   ['MAB1', 'MAB3'],
      tema: ['T1'],
    },
    araclar: {
      zorunlu: ['Dil çöpü (popsicle stick) veya kalem', 'Fasulye'],
      evYapimi: '10 fasulye → dil çöpüne yapıştırın = 1 onluk çubuk. 10 çubuk = 1 yüzlük. Çocukla birlikte yapın!',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Tek fasulye = 1 birlik. Çocuğa saydırın ve "bu nedir?" sorun.',
      },
      {
        no: 2,
        eylem: '10 fasulyeyi dil çöpüne yapıştırın. "Bu çubuk kaç tanedir? Neden?" — tek tek saydırın.',
        ipucu: 'Çubuğu yaparken konuşun: "Her çubuk tam 10 — değiştirilebilir birim."',
      },
      {
        no: 3,
        eylem: '"34\'ü kur." — 3 çubuk + 4 tekil fasulye.',
      },
      {
        no: 4,
        eylem: '"100\'ü nasıl kurarız?" — 10 çubuk = 100. Birlikte bağlayın.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Bu araçları kendin yapmak sana ne öğretti?"',
      },
    ],
    sorular: [
      '"3 çubuk var — kaç birliğe denk gelir?"',
      '"Rakamda soldan ikinci basamak ne anlama geliyor?"',
      '"243\'ü kur — kaç çubuk, kaç tekil lazım?"',
    ],
    dikkatler: [
      'Önceden hazır araçtan önce, çocuğun kendisi yapmalı — anlama farkı büyük.',
      'Çubuğu bağımsız tekil birimlerle karıştırmayın — fiziksel ayrım önemli.',
    ],
    sesAlt: 'Dil çöpü yoksa: 10 kağıt şeridini bantla birleştirin. Birlik = tek kağıt.',
    onKosul: 'sb-basamak1',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 4 — TOPLAMA VE ÇIKARMA                           ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-on-islem',
    bolum: SB_BOLUM.ISLEM,
    sira: 10,
    emoji: '🔢',
    baslik: '10 İçinde Toplama ve Çıkarma',
    altBaslik: 'Boncuk rafı ile denklem ailelerini keşfetme',
    siniflar: [SB_SINIF.OO, SB_SINIF.S1],
    sure: 15,
    hedef: '10 içindeki tüm toplama ve çıkarma denklemlerini somut temsille öğrenmek.',
    tymm: {
      oo:   ['MAB2', 'MAB3'],
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Boncuk rafı (veya ipe geçirilmiş boncuklar, 10 adet)', '2 farklı renk boncuk'],
      evYapimi: 'İp üzerine 5 kırmızı + 5 beyaz boncuk geçirin. Ya da iki renk fasulye bir çubuğa delin.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"Bana 4 göster." Çocuk 4 boncuğu sola kaydırır.',
      },
      {
        no: 2,
        eylem: '"Şimdi 1 tane daha ekle." 5 oldu. Denklem cümlesi söyleyin: "4 artı 1 eşittir 5."',
        ipucu: 'Denklem cümlesini yazma zorunluluğu yok — söz yeterli.',
      },
      {
        no: 3,
        eylem: '"7\'nin tüm parçalarını bul." 7+0, 6+1, 5+2, 4+3 — her kombinasyonu rafla gösterin.',
      },
      {
        no: 4,
        eylem: 'Çıkarma: 7 boncuktan 3\'ü geri kaydırın. Denklem: "7 eksi 3 eşittir 4."',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "7\'yi kaç farklı şekilde parçalayabildik?"',
      },
    ],
    sorular: [
      '"Kaç tane var? Kaçını çıkardık? Kaç kaldı?"',
      '"7\'yi başka nasıl parçalayabilirdin?"',
      '"Bu iki denklem birbirine nasıl bağlı?"',
    ],
    dikkatler: [
      'Kağıt-kalem denklemlerine henüz geçmeyin — somut kalın.',
      '"Artı" ve "eksi" kelimelerini kullanın, "topla" ve "al götür"ü değil.',
    ],
    sesAlt: 'Boncuk yoksa: iki renk düğme veya bozuk para. Raf yerine bir kutu.',
    onKosul: 'sb-onluk',
  },

  {
    id: 'sb-yirmi',
    bolum: SB_BOLUM.ISLEM,
    sira: 11,
    emoji: '➕',
    baslik: '20 İçinde Toplama',
    altBaslik: '5\'e ve 10\'a sabitleme stratejileri',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 15,
    hedef: '10\'u aşan toplama işlemlerinde 5 ve 10\'u çıpa/köprü olarak kullanmak.',
    tymm: {
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['İki adet 10-çerçeve', '20 sayaç (2 renk)'],
      evYapimi: 'İki yumurta kutusu (10 gözlü). Sayaç: misket, düğme, lego.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"7+8 nedir?" — önce tahmin yaptırın.',
      },
      {
        no: 2,
        eylem: 'Bir çerçeveye 7, diğerine 8 koyun. "Birinci çerçeveyi doldurmak için diğerinden kaç alırız?"',
        ipucu: '7→10 için 3 gerekiyor. 8\'den 3 alınca 5 kalıyor. 10+5=15.',
      },
      {
        no: 3,
        eylem: '"5\'e sabitleme": 7+8 → 5+2 ve 5+3 → 10+5 = 15. Çocuğun gözlemlemesini bekleyin.',
      },
      {
        no: 4,
        eylem: 'Başka örnekler: 9+6, 8+5. Çocuk kendi yöntemini bulsun.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Hangi strateji sana daha kolay geldi — 5\'e mi 10\'a mı?"',
      },
    ],
    sorular: [
      '"Neden 10\'dan geçtik?"',
      '"8\'den kaç alırsak 7\'yi 10 yaparız?"',
      '"Başka nasıl çözebilirdin?"',
    ],
    dikkatler: [
      'Her iki stratejiyi (5\'e ve 10\'a) zorla öğretmeyin — birini anlaması yeterli.',
      'Sonucu söylemeden önce çerçevedeki hareketi anlatmasını isteyin.',
    ],
    sesAlt: 'Çerçeve yoksa: iki grupta fasulye sayın — 10 olunca bardağa alın.',
    onKosul: 'sb-on-islem',
  },

  {
    id: 'sb-cikarma1',
    bolum: SB_BOLUM.ISLEM,
    sira: 12,
    emoji: '➖',
    baslik: 'Çıkarma — Somut ve 10-Çerçeve',
    altBaslik: 'Al götür ve fark bulma stratejileri',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 15,
    hedef: 'Çıkarmanın iki farklı anlamını (al-götür ve fark bulma) somut modellerle kavramak.',
    tymm: {
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['10-çerçeve', '~15 sayaç (2 renk)'],
      evYapimi: 'Yumurta kutusu ve boncuklar.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"15 sayacı çerçeveye koy." Sonra: "7\'sini al götür." Kaç kaldı?',
        ipucu: 'Bu "al götür" tarzı çıkarma.',
      },
      {
        no: 2,
        eylem: '"Farklı bir yol deneyelim: 7\'den başla, 15\'e kadar say." Kaç atladın?',
        ipucu: 'Bu "fark bulma" — eksiltmeden saymak. İkisi de çıkarma!',
      },
      {
        no: 3,
        eylem: '"15-7 için hangi yol sana daha kolay geldi?" — kendi tercihini bulsun.',
      },
      {
        no: 4,
        eylem: 'Ek örnekler: 12-5, 14-6. Her ikisi için de iki yolu gösterin.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "İki yol arasındaki fark neydi?"',
      },
    ],
    sorular: [
      '"Hangi yol daha hızlıydı? Neden?"',
      '"7 ile 15 arasında kaç var? Saydın mı, yoksa hesapladın mı?"',
    ],
    dikkatler: [
      '"Al götür" tek çıkarma yolu değildir — fark bulmayı tanıtın.',
      '"Borrow" (borç alma) kavramını henüz açıklamayın.',
    ],
    sesAlt: 'Çerçeve yerine: yere 15 taş koyun, 7\'sini alın.',
    onKosul: 'sb-yirmi',
  },

  {
    id: 'sb-cikarma2',
    bolum: SB_BOLUM.ISLEM,
    sira: 13,
    emoji: '📐',
    baslik: 'Çıkarma — Sayı Doğrusunda',
    altBaslik: 'Atlayarak çıkarma stratejileri',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 12,
    hedef: 'Sayı doğrusunu kullanarak çıkarma problemlerini görsel-zihinsel olarak çözmek.',
    tymm: {
      il:   ['MAB1', 'MAB2', 'MAB3'],
      tema: ['T1', 'T2', 'T3'],
    },
    araclar: {
      zorunlu: ['Kağıt', 'Kalem'],
      evYapimi: 'Herhangi bir kağıt ve kalem yeterli.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"15-7" için çizgi çizin. 15\'i koyun.',
      },
      {
        no: 2,
        eylem: '"Al götür" yolu: 15\'ten geriye 7 atla. Nereye geldin?',
      },
      {
        no: 3,
        eylem: '"Fark bulma" yolu: 7\'den başla, 15\'e atla. Kaç atladın?',
        ipucu: '7→10: 3 atlama. 10→15: 5 atlama. Toplam: 8.',
      },
      {
        no: 4,
        eylem: 'Kendi problemini kursun: bir sayı söylesin, bir şey çıkarsın.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Çizgi sana ne işe yaradı?"',
      },
    ],
    sorular: [
      '"Neden 10\'da duraksadın?"',
      '"Kafadan yapabilir misin? Sayı doğrusu olmadan?"',
    ],
    dikkatler: [
      'Sayı doğrusu ömür boyu kullanılacak bir araç değil, köprüdür.',
      'Hareketi hızlandırmayın — her atlama için düşünme süresi verin.',
    ],
    sesAlt: 'Kaldırım tebeşiriyle büyük sayı doğrusu çizin, çocuk üstünde yürüsün.',
    onKosul: 'sb-cikarma1',
  },

  {
    id: 'sb-buyuk-islem',
    bolum: SB_BOLUM.ISLEM,
    sira: 14,
    emoji: '🚀',
    baslik: 'Sayı Doğrusunda Büyük İşlemler',
    altBaslik: 'İki ve üç basamaklı toplama-çıkarma',
    siniflar: [SB_SINIF.S2, SB_SINIF.S3],
    sure: 15,
    hedef: 'Açık sayı doğrusunu kullanarak 2-3 basamaklı işlemleri zihinsel stratejilerle çözmek.',
    tymm: {
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Kağıt', 'Kalem'],
      evYapimi: null,
    },
    adimlar: [
      {
        no: 1,
        eylem: '"46+20" — sayı doğrusuna 46 koyun. 2 kez 10 atlayın: 56, 66.',
        ipucu: 'Tek seferde 20 atlayabilir mi? Denemesini isteyin.',
      },
      {
        no: 2,
        eylem: '"46+27" — önce 20 atlayın (66), sonra 7 daha.',
        ipucu: '7\'yi 4+3 şeklinde parçalayabilir mi? 66→70→73.',
      },
      {
        no: 3,
        eylem: 'Kendi hikaye problemini kursun: "Ahmet\'in 46 koşu kartı var, 27 tane daha aldı..."',
      },
      {
        no: 4,
        eylem: 'Büyük problemler: 235+48. Yüzlük, onluk, birlik atlamalar.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Hangi atlamayı zihinde yapabiliyorsun artık?"',
      },
    ],
    sorular: [
      '"Neden önce onları ekledin?"',
      '"Bir seferde 20 atlamak nasıl mümkün?"',
      '"Bu stratejiyi zihinden yapabilir misin?"',
    ],
    dikkatler: [
      'Standart algoritmayı göstermeyin — bu önce gelir.',
      'Kendi hikayesini kurması zoraki değil, önerilen bir alternatif olsun.',
    ],
    sesAlt: 'Kağıt yerine: parmakla havaya çizin veya sesli anlatın.',
    onKosul: 'sb-cikarma2',
  },

  {
    id: 'sb-zorlanma',
    bolum: SB_BOLUM.ISLEM,
    sira: 15,
    emoji: '🌉',
    baslik: '10\'u Köprü Olarak Kullanma',
    altBaslik: 'Zor toplama olgularını 10 üzerinden çözme',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 12,
    hedef: '10\'u aşan zor olgularda (8+7, 9+6) 10\'u köprü olarak kullanarak çözüm üretmek.',
    tymm: {
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['İki 10-çerçeve', '20 sayaç (2 renk)'],
      evYapimi: 'İki yumurta kutusu (10 gözlü). Sayaç: düğme, misket.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"9+6" — bir çerçeveye 9, diğerine 6 koyun.',
      },
      {
        no: 2,
        eylem: '"Birinci çerçeveyi 10\'a tamamlamak için ne lazım?" — 1 sayaç.',
        ipucu: '6\'dan 1 alın. 10+5=15.',
      },
      {
        no: 3,
        eylem: '"8+7" deneyin. Çocuğun kendi stratejisini geliştirmesini bekleyin.',
      },
      {
        no: 4,
        eylem: 'Kafadan denemesini isteyin: "Çerçeve olmadan aynı şeyi yapabilir misin?"',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "10\'dan geçmek neden işe yaradı?"',
      },
    ],
    sorular: [
      '"9\'u 10 yapmak için kaç lazım?"',
      '"Bundan sonra ne kalıyor?"',
      '"Bu stratejiyi başka hangi problemlerde kullanabilirsin?"',
    ],
    dikkatler: [
      'Tüm olgular ezber gerektirmez — strateji yeterlidir.',
      'Hızı zorlamayın; doğruluk ve anlama önce gelir.',
    ],
    sesAlt: 'Çerçeve yoksa: 10 fasulye bir bardakta, geri kalanı dışarıda.',
    onKosul: 'sb-yirmi',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 5 — SAYI OLGULARI                                ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-olgular1',
    bolum: SB_BOLUM.OLGULAR,
    sira: 16,
    emoji: '⚡',
    baslik: 'Toplama Olguları — Stratejiler',
    altBaslik: 'Sıfır, bir fazlası, iki fazlası, katlar',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 15,
    hedef: 'Temel toplama olgularını ezberleme yerine strateji hiyerarşisiyle öğrenmek.',
    tymm: {
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Kağıt, kalem (olgular tablosu)', 'Nesneler (isteğe bağlı)'],
      evYapimi: '10×10 olgular tablosunu kağıda çizin veya yazdırın.',
    },
    adimlar: [
      {
        no: 1,
        eylem: '"Sıfır olguları": 5+0=? Her sayıya sıfır ekleyince ne oluyor? Neden?',
        ipucu: 'Sıfır eklemek hiçbir şey değiştirmez — ama neden? Düşündürün.',
      },
      {
        no: 2,
        eylem: '"Bir fazlası": 6+1=? 8+1=? Sayı sayımında bir ileri gitmekle aynı.',
      },
      {
        no: 3,
        eylem: '"Katlar": 6+6=? Ellerini gösterin — her el 5. Fırsatları gösterin.',
      },
      {
        no: 4,
        eylem: '"Komşu katlar": 6+7 = 6+6+1 = 12+1 = 13. Katları köprü olarak kullanın.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Hangi stratejiyi daha önce hiç düşünmemiştin?"',
      },
    ],
    sorular: [
      '"Bunu nasıl çözdün?"',
      '"Daha hızlı bir yol var mı?"',
      '"6+7\'yi 6+6 kullanarak nasıl bulursun?"',
    ],
    dikkatler: [
      'Flaş kart ile hız yarışı başlatmayın — strateji önce, hız sonra.',
      'Tüm olguları aynı anda öğretmeye çalışmayın.',
    ],
    sesAlt: null,
    onKosul: 'sb-on-islem',
  },

  {
    id: 'sb-olgular2',
    bolum: SB_BOLUM.OLGULAR,
    sira: 17,
    emoji: '🧠',
    baslik: 'Toplama Olguları — Uzmanlaşma',
    altBaslik: 'Olgu ailesi sırası ve kalıcı bellek',
    siniflar: [SB_SINIF.S2, SB_SINIF.S3],
    sure: 12,
    hedef: 'Tüm tek basamaklı toplama olgularını strateji ve tekrar yoluyla uzun süreli belleğe taşımak.',
    tymm: {
      il:   ['MAB1', 'MAB2'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Olgular tablosu (basılı)'],
      evYapimi: '10×10 tablo. Öğrenilenleri renkli boyayın — görsel ilerleme motivasyonu.',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Tabloda renksiz kalan olguları belirleyin. Bunlar "zor" olguları.',
      },
      {
        no: 2,
        eylem: '"Olgu ailesi": 3, 5, 8 sayılarından kaç farklı denklem çıkar? (3+5, 5+3, 8-3, 8-5)',
        ipucu: 'Aile kavramı ezber ihtiyacını yarıya indirir.',
      },
      {
        no: 3,
        eylem: 'Günde 5-10 dakika, zor olguları stratejilerle çalışın. Saat tutmayın.',
      },
      {
        no: 4,
        eylem: 'Her hafta tabloyu boyayın — ilerlemeyi birlikte görün.',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Geçen hafta boyasız olan hangi olgular şimdi renkli?"',
      },
    ],
    sorular: [
      '"Bu 3 sayıdan kaç farklı denklem yapabiliriz?"',
      '"Hangi olgu hâlâ zor geliyor? Stratejin ne?"',
    ],
    dikkatler: [
      'Olguları günlük hayattan bağımsız soyut egzersizlerle pekiştirmeyin.',
      'Hata yapınca "yanlış" değil, "hadi birlikte bakalım" deyin.',
    ],
    sesAlt: null,
    onKosul: 'sb-olgular1',
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  BÖLÜM 6 — SÖZEL PROBLEMLER                             ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    id: 'sb-sozel1',
    bolum: SB_BOLUM.SOZEL,
    sira: 18,
    emoji: '📖',
    baslik: 'Sözel Problem — Parça-Parça-Bütün',
    altBaslik: 'Problemi görselleştirme ve düzenleme',
    siniflar: [SB_SINIF.S1, SB_SINIF.S2],
    sure: 12,
    hedef: 'Sözel problemlerdeki bilineni ve bilinmeyeni organize etmek; parça-bütün ilişkisini kavramak.',
    tymm: {
      il:   ['MAB1', 'MAB2', 'MAB4'],
      tema: ['T1', 'T2'],
    },
    araclar: {
      zorunlu: ['Küçük nesneler (2 türlü — farklı renk düğme)', 'Kağıt'],
      evYapimi: 'Kağıda büyük bir daire çizin: ortada "bütün", yanlarda "parça" yazan 2 küçük daire.',
    },
    adimlar: [
      {
        no: 1,
        eylem: 'Hikaye okuyun: "Ayşe sabah 3, öğleden sonra 4 kitap okudu. Toplam kaç kitap?" İki eli gösterin: sol = sabah, sağ = öğleden sonra.',
      },
      {
        no: 2,
        eylem: 'Elleri birleştirin: "Bu toplam." Soru işaretini nereye koyacak?',
        ipucu: 'Soru işaretini bulmak cevaptan daha önemli — nerede olduğunu önce sorun.',
      },
      {
        no: 3,
        eylem: 'Parça-bütün şemasına sayaçları koydurun. Bilinmeyen nerede?',
      },
      {
        no: 4,
        eylem: 'Kendi hikayesini kursun: "3 ve 5 sayılarını kullanarak bir hikaye yaz."',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Soru işaretini nereye koydun? Neden?"',
      },
    ],
    sorular: [
      '"Ne biliyoruz? Ne bulmamız lazım?"',
      '"Soru işareti nerede — parçada mı, bütünde mi?"',
      '"Bu problemde toplama mı yoksa çıkarma mı kullandın?"',
    ],
    dikkatler: [
      '"Gördüğün sayıları topla" kısayolunu kullanmalarına izin vermeyin.',
      '"Al götür" yerine "ayır", "toplam" yerine "birleştir" deyin.',
    ],
    sesAlt: 'Şema yoksa: iki avuca sayaç koyun, birleştirin.',
    onKosul: 'sb-on-islem',
  },

  {
    id: 'sb-sozel2',
    bolum: SB_BOLUM.SOZEL,
    sira: 19,
    emoji: '✏️',
    baslik: 'Sözel Problem — Modelleme ve Kurma',
    altBaslik: 'Problem kurma, olgu aileleri, karşılaştırma',
    siniflar: [SB_SINIF.S2, SB_SINIF.S3],
    sure: 15,
    hedef: 'Kendi sözel problemini kurmak; karşılaştırma problemlerini modellerle çözmek.',
    tymm: {
      il:   ['MAB1', 'MAB2', 'MAB3', 'MAB4'],
      tema: ['T1', 'T2', 'T4'],
    },
    araclar: {
      zorunlu: ['İki tür küçük nesne (farklı renk)'],
      evYapimi: null,
    },
    adimlar: [
      {
        no: 1,
        eylem: '"5, 4 ve 9" sayılarını verin: "Bu sayıları kullanarak bir hikaye kur."',
        ipucu: 'İlk cümle için çok bekletmeyin ama ilk sözcüğü siz söylemeyin.',
      },
      {
        no: 2,
        eylem: 'Karşılaştırma problemi: "Ali\'nin 8 kalemi var, Ayşe\'nin 5. Fark ne?" İki grup nesne yan yana koyun.',
      },
      {
        no: 3,
        eylem: '"Al götür" kelimesi olmasa da çıkarma sorusu mu? Tartışın.',
        ipucu: '"Kaç tane daha fazla" = çıkarma, ama nesneleri kimse almıyor!',
      },
      {
        no: 4,
        eylem: 'Daha büyük olgu aileleri: 14, 6 ve 8 — kaç farklı denklem çıkar?',
      },
      {
        no: 5,
        eylem: 'Yansıtma: "Kendi kurduğun problemde en zor neydi?"',
      },
    ],
    sorular: [
      '"Bu bir toplama mı çıkarma mı problemi?"',
      '"Nasıl anladın?"',
      '"Başka bir hikaye kurabilir misin — cevabı aynı, hikayesi farklı?"',
    ],
    dikkatler: [
      '"Take away" yerine "fark", "compare" yerine "karşılaştır" deyin.',
      'Problemin cevabından önce kurulumunu (neyi biliyoruz, neyi bilmiyoruz) sorun.',
    ],
    sesAlt: null,
    onKosul: 'sb-sozel1',
  },

]);

export { SB_BOLUM, SB_SINIF, SB_ARAC, SB_BOLUM_META, SB_MODULLER };
