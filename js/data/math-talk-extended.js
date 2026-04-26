/* ══════════════════════════════════════════════════════════
   ABMAT — Genişletilmiş Math Talk Sözlüğü
   Levine ve ark. (2010) → ev içi math talk → erken sayı becerisi.
   60+ tetikleyici cümle, gün içine dağılmış 6 bağlamda:
   • mutfak / banyo / yatma / araba-yol / market / oyun
══════════════════════════════════════════════════════════ */

export const MATH_TALK_CONTEXTS = Object.freeze([
  { id: 'kitchen', emoji: '🍳', ad: 'Mutfakta', renk: '#F59E0B' },
  { id: 'bath',    emoji: '🛁', ad: 'Banyoda',  renk: '#06B6D4' },
  { id: 'bedtime', emoji: '🌙', ad: 'Yatma Vakti', renk: '#8B5CF6' },
  { id: 'commute', emoji: '🚗', ad: 'Yolda',    renk: '#10B981' },
  { id: 'market',  emoji: '🛒', ad: 'Markette', renk: '#EF4444' },
  { id: 'play',    emoji: '🎲', ad: 'Oyunda',   renk: '#0D9488' },
]);

export const MATH_TALK_EXTENDED = Object.freeze([
  // ─── MUTFAK ──────────────────────────────────────
  { ctx: 'kitchen', age: '3-5', kategori: 'sayma', soru: 'Tabağa kaç tane domates koyalım?', neden: 'Birebir eşleme + sayma' },
  { ctx: 'kitchen', age: '3-5', kategori: 'karşılaştırma', soru: 'Hangi bardakta daha çok su var?', neden: 'Hacim sezgisi' },
  { ctx: 'kitchen', age: '3-5', kategori: 'sıralama', soru: 'Önce ne, sonra ne yaptık?', neden: 'Süreç + sıralama' },
  { ctx: 'kitchen', age: '5-7', kategori: 'kesir', soru: 'Bu elmayı 4 kişiye nasıl bölelim?', neden: 'Eşit paylaşım' },
  { ctx: 'kitchen', age: '5-7', kategori: 'ölçme', soru: 'Bardağın 3\'te 2\'si ne kadar?', neden: 'Kesir uygulaması' },
  { ctx: 'kitchen', age: '5-7', kategori: 'tahmin', soru: 'Sence kaç kaşık şeker var?', neden: 'Tahmin + doğrulama' },
  { ctx: 'kitchen', age: '7-10', kategori: 'oran', soru: 'Tarif 4 kişilik; 6 kişilik için ne yaparız?', neden: 'Oran orantı' },
  { ctx: 'kitchen', age: '7-10', kategori: 'zaman', soru: 'Saat kaçta yemek hazır olur?', neden: 'Süre hesabı' },

  // ─── BANYO ──────────────────────────────────────
  { ctx: 'bath', age: '3-5', kategori: 'sayma', soru: 'Diş fırçalarken 20\'ye kadar sayalım mı?', neden: 'Sayma akıcılığı' },
  { ctx: 'bath', age: '3-5', kategori: 'şekil', soru: 'Banyoda kaç kare görüyorsun? (fayanslar)', neden: 'Geometri farkındalığı' },
  { ctx: 'bath', age: '5-7', kategori: 'ölçme', soru: 'Suyu doldurmak ne kadar sürdü?', neden: 'Süre kavramı' },
  { ctx: 'bath', age: '5-7', kategori: 'kesir', soru: 'Şampuanın yarısı bitti — ne kadar kaldı?', neden: 'Kesir gözlemi' },
  { ctx: 'bath', age: '7-10', kategori: 'hacim', soru: 'Bu küvet kaç litre alır sence?', neden: 'Tahmin + ölçme' },

  // ─── YATMA ──────────────────────────────────────
  { ctx: 'bedtime', age: '3-5', kategori: 'sayma', soru: 'Yastığında kaç yıldız var?', neden: 'Sayma + ilgi' },
  { ctx: 'bedtime', age: '3-5', kategori: 'sıralama', soru: 'Hangi hikâyeyi önce okuyalım?', neden: 'Karar + sıralama' },
  { ctx: 'bedtime', age: '5-7', kategori: 'zaman', soru: 'Yarın saat kaçta kalkacaksın?', neden: 'Saat okuma' },
  { ctx: 'bedtime', age: '5-7', kategori: 'mantık', soru: 'Bugün ne öğrendin? Yarın ne yapacaksın?', neden: 'Yansıma + planlama' },
  { ctx: 'bedtime', age: '7-10', kategori: 'olasılık', soru: 'Yarın yağmur olma ihtimali ne?', neden: 'Olasılık sezgisi' },

  // ─── YOLDA ──────────────────────────────────────
  { ctx: 'commute', age: '3-5', kategori: 'sayma', soru: 'Kaç kırmızı araba görüyorsun?', neden: 'Görsel sayma' },
  { ctx: 'commute', age: '3-5', kategori: 'karşılaştırma', soru: 'Hangi araba daha büyük?', neden: 'Boyut karşılaştırma' },
  { ctx: 'commute', age: '5-7', kategori: 'mesafe', soru: 'Eve kaç dakika kaldı sence?', neden: 'Süre tahmini' },
  { ctx: 'commute', age: '5-7', kategori: 'okuma', soru: 'O tabelada ne yazıyor? Kaç sayı var?', neden: 'Sayı tanıma' },
  { ctx: 'commute', age: '7-10', kategori: 'hız', soru: 'Saatte 60 km gidersek 30 km ne kadar sürer?', neden: 'Hız orantı' },

  // ─── MARKET ──────────────────────────────────────
  { ctx: 'market', age: '3-5', kategori: 'sayma', soru: 'Sepete kaç tane elma koyalım?', neden: 'Sayma + amaç' },
  { ctx: 'market', age: '3-5', kategori: 'sınıflama', soru: 'Bu raftaki en küçük paket hangisi?', neden: 'Karşılaştırma' },
  { ctx: 'market', age: '5-7', kategori: 'para', soru: '5 lira veriyoruz, 3 lira tutuyor. Üstü kaç?', neden: 'Çıkarma uygulaması' },
  { ctx: 'market', age: '5-7', kategori: 'tahmin', soru: 'Ne dersin, sepetimiz 50 lirayı geçer mi?', neden: 'Toplama tahmini' },
  { ctx: 'market', age: '7-10', kategori: 'oran', soru: 'Kilo 20 lira; yarım kilosu kaç eder?', neden: 'Yarı + çarpma' },
  { ctx: 'market', age: '7-10', kategori: 'indirim', soru: '%20 indirimli; 100 liralık ürün kaç olur?', neden: 'Yüzde uygulaması' },

  // ─── OYUN ──────────────────────────────────────
  { ctx: 'play', age: '3-5', kategori: 'örüntü', soru: 'Renkleri sıralayalım: kırmızı, mavi, kırmızı, mavi… sonra hangisi?', neden: 'Örüntü tanıma' },
  { ctx: 'play', age: '3-5', kategori: 'şekil', soru: 'Bu yapı kaç bloktan oluşuyor?', neden: 'Geometri + sayma' },
  { ctx: 'play', age: '5-7', kategori: 'oyun', soru: 'Zarın kaç olma ihtimali yüksek? Tahmin et.', neden: 'Olasılık' },
  { ctx: 'play', age: '5-7', kategori: 'strateji', soru: 'Bu oyunu kazanmak için en iyi yol nedir?', neden: 'Mantıksal düşünme' },
  { ctx: 'play', age: '7-10', kategori: 'koordinat', soru: '"3 sağa, 2 yukarı" git — nereye varacaksın?', neden: 'Uzamsal koordinat' },
  { ctx: 'play', age: '7-10', kategori: 'olasılık', soru: 'Madeni para 10 atışta 5 kez yazı geldi — bekleyebilir misin?', neden: 'Olasılık sezgisi' },
]);

/* ─── Yardımcı: rastgele bir soru çek ──────────────── */
export function pickRandomTalk({ ctx = null, age = null } = {}){
  let pool = MATH_TALK_EXTENDED;
  if(ctx) pool = pool.filter(t => t.ctx === ctx);
  if(age) pool = pool.filter(t => t.age === age || t.age.startsWith(age.split('-')[0]));
  if(!pool.length) pool = MATH_TALK_EXTENDED;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ─── Aile rutin tetikleyicileri (gün içi 3 anı) ──── */
export const ROUTINE_TRIGGERS = Object.freeze([
  { time: 'morning',   hour: 8,  ctx: 'kitchen', emoji: '☀️', label: 'Sabah Mutfak Anı', soru: 'Kahvaltıda kaç dilim ekmek var?' },
  { time: 'afternoon', hour: 14, ctx: 'play',    emoji: '🌤️', label: 'Öğleden Sonra Oyun Anı', soru: 'Oynadığın oyunda kaç parça var?' },
  { time: 'evening',   hour: 20, ctx: 'bedtime', emoji: '🌙', label: 'Akşam Yatma Anı', soru: 'Bugün kaç farklı renk gördün?' },
]);
