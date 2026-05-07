/* ABMATO — TYMM veri yapısı (Türkiye Yüzyılı Maarif Modeli, MEB 2024)
 *
 *   Kaynaklar:
 *    - Okul Öncesi: MEB TEGM (2024) OÖEP — tegm.meb.gov.tr, tymm.meb.gov.tr
 *    - İlkokul    : MEB TYMM (2024) İlkokul Matematik Dersi Öğretim Programı
 *                   (onaylı PDF'ten doğrulanmış)
 *
 *   İlkokul kazanımları ayrı bir dosyada:  js/data/tymm-ilkokul-outcomes.js
 *   Bu dosya yalnızca alan becerileri, tema yapıları ve yardımcı fonksiyonları tutar.
 */

import { TYMM_IL_OUTCOMES } from '../data/tymm-ilkokul-outcomes.js';

const TYMM = Object.freeze({

  /* ══════════════════════════════════════════════════════════
     OKUL ÖNCESİ — Alan Becerileri (OÖEP 2024)
     Resmi kodlar: tymm.meb.gov.tr aylık plan başlıklarından doğrulandı
  ══════════════════════════════════════════════════════════ */
  OO: Object.freeze({
    MAB6: { kod:'MAB6', ad:'Sayma',
      aciklama:'Ritmik ve algısal sayabilme; şipşak sayma (subitizing)',
      surec:['Ritmik sayma','Algısal sayma','Şipşak sayma (subitizing)','Sıralı sayı bilgisi'],
      yas:['36-48','48-60','60-72'] },
    MAB1: { kod:'MAB1', ad:'Matematiksel Muhakeme',
      aciklama:'Çözümleme, yorumlama, çıkarım yapma yoluyla akıl yürütme',
      surec:['Çözümleme','Yorumlama','Çıkarım yapma'],
      yas:['36-48','48-60','60-72'] },
    MAB2: { kod:'MAB2', ad:'Matematiksel Problem Çözme',
      aciklama:'Problemi çözümleme, yorumlama, çözüm geliştirme ve yansıtma',
      surec:['Çözümleme','Yorumlama','Çözüm geliştirme','Yansıtma'],
      yas:['48-60','60-72'] },
    MAB3: { kod:'MAB3', ad:'Matematiksel Temsil',
      aciklama:'Matematiksel temsillerden yararlanma ve değerlendirme',
      surec:['Temsillerden yararlanma','Temsilleri değerlendirme'],
      yas:['48-60','60-72'] },
    MAB4: { kod:'MAB4', ad:'Veri ile Çalışma ve Veriye Dayalı Karar Verme',
      aciklama:'Problem belirleme, veri elde etme, bulgulara ulaşma, yorumlama',
      surec:['İstatistiksel problemi belirleme','Veri elde etme ve analiz','Bulgulara ulaşma','Bulguları yorumlama'],
      yas:['60-72'] },
    MAB5: { kod:'MAB5', ad:'Matematiksel Araç ve Teknoloji ile Çalışma',
      aciklama:'Uygun araç ve teknoloji kullanarak matematiksel durumları inceleme',
      surec:['Uygun araç belirleme','Araçla çalışma','Sonucu paylaşma'],
      yas:['60-72'] },
  }),

  /* ══════════════════════════════════════════════════════════
     İLKOKUL — Alan Becerileri (PDF bölüm 1.2.1)
     5 alan becerisi, her birinin alt süreç bileşenleri
  ══════════════════════════════════════════════════════════ */
  IL_MAB: Object.freeze({
    MAB1: { kod:'MAB1', ad:'Matematiksel Muhakeme',
      aciklama:'Bilgi veya varsayımlar kullanarak mantığa yatkın çıkarımlarda bulunma',
      surec:['MAB1.1 Çözümleme','MAB1.2 Yorumlama','MAB1.3 Çıkarım yapma','MAB1.4 Matematiksel doğrulama veya ispat yapma'] },
    MAB2: { kod:'MAB2', ad:'Matematiksel Problem Çözme',
      aciklama:'Matematiksel bir problemi çözerken deneyimlenen süreç',
      surec:['MAB2.1 Matematiksel çözümler geliştirme','MAB2.2 Yansıtma','MAB2.3 Çözümleme','MAB2.4 Yorumlama'] },
    MAB3: { kod:'MAB3', ad:'Matematiksel Temsil',
      aciklama:'Matematiksel durumları sergileme araçlarını anlama ve kullanma',
      surec:['MAB3.1 Matematiksel temsillerden yararlanma','MAB3.2 Matematiksel temsilleri değerlendirme'] },
    MAB4: { kod:'MAB4', ad:'Veri ile Çalışma ve Veriye Dayalı Karar Verme',
      aciklama:'İstatistiksel problemi çözmek için verilerden anlamlı sonuçlar çıkarma',
      surec:['MAB4.1 İstatistiksel problemi belirleme','MAB4.2 Verileri elde etme ve analiz için değerlendirme','MAB4.3 Bulgulara ulaşma','MAB4.4 Bulguları yorumlama'] },
    MAB5: { kod:'MAB5', ad:'Matematiksel Araç ve Teknoloji ile Çalışma',
      aciklama:'Matematik öğrenirken uygun araç ve teknolojiden yararlanma',
      surec:['MAB5.1 Matematiksel araç ve teknolojiden yararlanma','MAB5.2 Değerlendirme'] },
  }),

  /* ══════════════════════════════════════════════════════════
     İLKOKUL — Sınıf Bazlı Tema Yapısı (PDF bölüm 1.3)
     Her sınıfın 4 teması var. Her tema alt-temalara bölünebilir.
     Ders saatleri her alt-tema için ayrı verilmiştir.

     Kod formatı:  MAT.{sınıf}.{tema_no}
     Örn.  MAT.1.1 = 1. Sınıf Sayılar ve Nicelikler
           MAT.4.4 = 4. Sınıf Olayların Olasılığı ve Veriye Dayalı Araştırma
  ══════════════════════════════════════════════════════════ */
  IL_TEMALAR: Object.freeze({
    // 1. Sınıf
    'MAT.1.1': { kod:'MAT.1.1', sinif:1, ad:'Sayılar ve Nicelikler',
      altTemalar:[
        { ad:'Sayılar ve Nicelikler (1)', saat:57 },
        { ad:'Sayılar ve Nicelikler (2)', saat:18 },
        { ad:'Sayılar ve Nicelikler (3)', saat:7  },
      ] },
    'MAT.1.2': { kod:'MAT.1.2', sinif:1, ad:'İşlemlerden Cebirsel Düşünmeye',
      altTemalar:[{ ad:'İşlemlerden Cebirsel Düşünmeye', saat:50 }] },
    'MAT.1.3': { kod:'MAT.1.3', sinif:1, ad:'Nesnelerin Geometrisi',
      altTemalar:[
        { ad:'Nesnelerin Geometrisi (1)', saat:15 },
        { ad:'Nesnelerin Geometrisi (2)', saat:15 },
      ] },
    'MAT.1.4': { kod:'MAT.1.4', sinif:1, ad:'Veriye Dayalı Araştırma',
      altTemalar:[{ ad:'Veriye Dayalı Araştırma', saat:10 }] },

    // 2. Sınıf
    'MAT.2.1': { kod:'MAT.2.1', sinif:2, ad:'Sayılar ve Nicelikler',
      altTemalar:[
        { ad:'Sayılar ve Nicelikler (1)', saat:41 },
        { ad:'Sayılar ve Nicelikler (2)', saat:30 },
      ] },
    'MAT.2.2': { kod:'MAT.2.2', sinif:2, ad:'İşlemlerden Cebirsel Düşünmeye',
      altTemalar:[{ ad:'İşlemlerden Cebirsel Düşünmeye', saat:55 }] },
    'MAT.2.3': { kod:'MAT.2.3', sinif:2, ad:'Nesnelerin Geometrisi',
      altTemalar:[
        { ad:'Nesnelerin Geometrisi (1)', saat:25 },
        { ad:'Nesnelerin Geometrisi (2)', saat:11 },
      ] },
    'MAT.2.4': { kod:'MAT.2.4', sinif:2, ad:'Veriye Dayalı Araştırma',
      altTemalar:[{ ad:'Veriye Dayalı Araştırma', saat:10 }] },

    // 3. Sınıf
    'MAT.3.1': { kod:'MAT.3.1', sinif:3, ad:'Sayılar ve Nicelikler',
      altTemalar:[
        { ad:'Sayılar ve Nicelikler (1)', saat:26 },
        { ad:'Sayılar ve Nicelikler (2)', saat:45 },
      ] },
    'MAT.3.2': { kod:'MAT.3.2', sinif:3, ad:'İşlemlerden Cebirsel Düşünmeye',
      altTemalar:[{ ad:'İşlemlerden Cebirsel Düşünmeye', saat:55 }] },
    'MAT.3.3': { kod:'MAT.3.3', sinif:3, ad:'Nesnelerin Geometrisi',
      altTemalar:[
        { ad:'Nesnelerin Geometrisi (1)', saat:21 },
        { ad:'Nesnelerin Geometrisi (2)', saat:10 },
      ] },
    'MAT.3.4': { kod:'MAT.3.4', sinif:3, ad:'Veriye Dayalı Araştırma',
      altTemalar:[{ ad:'Veriye Dayalı Araştırma', saat:15 }] },

    // 4. Sınıf (4. tema farklı: Olayların Olasılığı ve Veriye Dayalı Araştırma)
    'MAT.4.1': { kod:'MAT.4.1', sinif:4, ad:'Sayılar ve Nicelikler',
      altTemalar:[
        { ad:'Sayılar ve Nicelikler (1)', saat:23 },
        { ad:'Sayılar ve Nicelikler (2)', saat:43 },
      ] },
    'MAT.4.2': { kod:'MAT.4.2', sinif:4, ad:'İşlemlerden Cebirsel Düşünmeye',
      altTemalar:[{ ad:'İşlemlerden Cebirsel Düşünmeye', saat:50 }] },
    'MAT.4.3': { kod:'MAT.4.3', sinif:4, ad:'Nesnelerin Geometrisi',
      altTemalar:[
        { ad:'Nesnelerin Geometrisi (1)', saat:17 },
        { ad:'Nesnelerin Geometrisi (2)', saat:11 },
        { ad:'Nesnelerin Geometrisi (3)', saat:13 },
      ] },
    'MAT.4.4': { kod:'MAT.4.4', sinif:4, ad:'Olayların Olasılığı ve Veriye Dayalı Araştırma',
      altTemalar:[{ ad:'Olayların Olasılığı ve Veriye Dayalı Araştırma', saat:15 }] },
  }),

  /* ══════════════════════════════════════════════════════════
     Geriye dönük uyum: Eski T1..T5 kodları sınıf bağlamına göre
     resmi MAT.S.T koduna haritalanır. Eski aktivite verilerindeki
     `tymm_t:['T1']` alanı çalışmaya devam eder.

     IL_TEMA  — App.js tarafından hâlâ okunan eski sözlük (T1..T5).
                Yeni kod IL_TEMALAR'ı (MAT.S.T kodlu) tercih etmelidir.
     IL_TEMA_LEGACY — T1..T5 → MAT.S.T dönüşümü için metadata.
  ══════════════════════════════════════════════════════════ */
  IL_TEMA: Object.freeze({
    T1: { kod:'T1', ad:'Sayılar ve Nicelikler',
      aciklama:'Doğal sayılar, basamak değeri, kesirler, ondalık gösterim',
      siniflar:['1','2','3','4'] },
    T2: { kod:'T2', ad:'İşlemlerden Cebirsel Düşünmeye',
      aciklama:'Dört işlem, işlem özellikleri, sayı-şekil örüntüleri, eşitlik',
      siniflar:['1','2','3','4'] },
    T3: { kod:'T3', ad:'Nesnelerin Geometrisi',
      aciklama:'Geometrik şekiller, uzamsal ilişkiler, ölçme, simetri',
      siniflar:['1','2','3','4'] },
    T4: { kod:'T4', ad:'Veriye Dayalı Araştırma',
      aciklama:'Veri toplama, düzenleme, grafik oluşturma ve yorumlama',
      siniflar:['1','2','3'] },
    T5: { kod:'T5', ad:'Olayların Olasılığı ve Veriye Dayalı Araştırma',
      aciklama:'Kesin-olası-imkânsız olaylar, olasılık dili ve veri araştırması',
      siniflar:['4'] },
  }),
  IL_TEMA_LEGACY: Object.freeze({
    T1: { ad:'Sayılar ve Nicelikler',            temaIdx:1, siniflar:['1','2','3','4'] },
    T2: { ad:'İşlemlerden Cebirsel Düşünmeye',   temaIdx:2, siniflar:['1','2','3','4'] },
    T3: { ad:'Nesnelerin Geometrisi',            temaIdx:3, siniflar:['1','2','3','4'] },
    T4: { ad:'Veriye Dayalı Araştırma',          temaIdx:4, siniflar:['1','2','3']     },
    T5: { ad:'Olayların Olasılığı ve Veriye Dayalı Araştırma', temaIdx:4, siniflar:['4'] },
  }),

  /* ══════════════════════════════════════════════════════════
     Programlar Arası Bileşenler (kısa)
  ══════════════════════════════════════════════════════════ */
  PAB: Object.freeze({
    SDB: { ad:'Sosyal-Duygusal Öğrenme Becerileri', aciklama:'Benlik, sosyal yaşam, ortak/bileşik beceriler' },
    DEA: { ad:'Erdem-Değer-Eylem Çerçevesi', aciklama:'Millî ve manevi değerler; dürüstlük, sorumluluk, dostluk' },
    OB:  { ad:'Okuryazarlık Becerileri', aciklama:'Bilgi, dijital, finansal, sürdürülebilirlik okuryazarlığı' },
  }),
});

/* ══════════════════════════════════════════════════════════
   Yardımcı fonksiyonlar — kazanım arama ve filtreleme
════════════════════════════════════════════════════════════ */

/** Belirli bir sınıfa ait tüm kazanımları döndürür. */
export function getOutcomesByGrade(grade){
  return TYMM_IL_OUTCOMES.filter(o => o.grade === grade);
}

/** Belirli bir tema kodunun (örn. 'MAT.1.1') kazanımlarını döndürür. */
export function getOutcomesByTheme(themeCode){
  return TYMM_IL_OUTCOMES.filter(o => o.themeCode === themeCode);
}

/** Tek kazanımı koduyla bul (örn. 'MAT.1.1.5'). */
export function getOutcomeByCode(code){
  return TYMM_IL_OUTCOMES.find(o => o.code === code) || null;
}

/** Bir sınıfın tema listesini ders saatleriyle birlikte döndürür. */
export function getThemesByGrade(grade){
  return Object.values(TYMM.IL_TEMALAR).filter(t => t.sinif === grade);
}

/**
 * Bir etkinliğin tymm_outcomes dizisini (örn. ['MAT.1.1.1','MAT.2.1.1'])
 * tam kazanım nesnelerine çevirir — eksik kodlar atlanır.
 */
export function resolveOutcomes(codes){
  if(!Array.isArray(codes)) return [];
  return codes.map(c => getOutcomeByCode(c)).filter(Boolean);
}

/**
 * Eski-tarz `tymm_t:['T1','T2']` + `tymm_il:['MAB1']` etiketlerini resmi
 * tema koduna haritalar. Sınıf bağlamı verilirse (örn. 1..4) ilgili sınıfın
 * MAT.S.T'leri döndürülür. Yoksa tüm eşleşmeleri döndürür.
 */
export function legacyToThemeCodes(legacyT, grade){
  if(!Array.isArray(legacyT)) return [];
  const out = [];
  for(const tcode of legacyT){
    const entry = TYMM.IL_TEMA_LEGACY[tcode];
    if(!entry) continue;
    if(grade !== undefined){
      if(!entry.siniflar.includes(String(grade))) continue;
      out.push(`MAT.${grade}.${entry.temaIdx}`);
    } else {
      for(const s of entry.siniflar){
        out.push(`MAT.${s}.${entry.temaIdx}`);
      }
    }
  }
  // Dedupe
  return [...new Set(out)];
}

export { TYMM, TYMM_IL_OUTCOMES };
