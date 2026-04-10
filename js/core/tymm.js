/* ABMAT — TYMM veri yapısı (MEB 2024)
   Kaynak: tymm.meb.gov.tr, tegm.meb.gov.tr */

const TYMM = Object.freeze({
  /* Okul Öncesi Alan Becerileri — OÖEP 2024 Bölüm 4.2
     Resmi kodlar: tymm.meb.gov.tr aylık plan başlıklarından doğrulandı */
  OO: {
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
  },
  /* İlkokul Alan Becerileri — tymm.meb.gov.tr/beceriler/matematik-alan-becerileri
     5 alan becerisi, her birinin resmi süreç bileşenleri */
  IL_MAB: {
    MAB1: { kod:'MAB1', ad:'Matematiksel Muhakeme',
      aciklama:'Bilgi veya varsayımlar kullanarak mantığa yatkın çıkarımlarda bulunma',
      surec:['Çözümleme','Yorumlama','Çıkarım yapma','Matematiksel doğrulama veya ispat yapma'] },
    MAB2: { kod:'MAB2', ad:'Matematiksel Problem Çözme',
      aciklama:'Asgari düzeyde matematiksel bir problemi çözebilmek için deneyimlenmesi gereken süreç',
      surec:['Çözümleme','Yorumlama','Matematiksel çözümler geliştirme','Yansıtma'] },
    MAB3: { kod:'MAB3', ad:'Matematiksel Temsil',
      aciklama:'Matematiksel durumları sergileme araçlarını anlama ve kullanma',
      surec:['Matematiksel temsillerden yararlanma','Matematiksel temsilleri değerlendirme'] },
    MAB4: { kod:'MAB4', ad:'Veri ile Çalışma ve Veriye Dayalı Karar Verme',
      aciklama:'İstatistiksel problemi çözmek için verilerden anlamlı sonuçlar çıkarma',
      surec:['İstatistiksel problemi belirleme','Verileri elde etme ve analiz için değerlendirme','Bulgulara ulaşma','Bulguları yorumlama'] },
    MAB5: { kod:'MAB5', ad:'Matematiksel Araç ve Teknoloji ile Çalışma',
      aciklama:'Matematik öğrenirken uygun araç ve teknolojiden yararlanma',
      surec:['Matematiksel araç ve teknolojiden yararlanma','Değerlendirme'] },
  },
  /* İlkokul Temaları — İlkokul Matematik Dersi Öğretim Programı 2024, s.9 ve 12-18
     NOT: 4. sınıfta T4 yerine T5 kullanılır */
  IL_TEMA: {
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
  },
  /* Programlar Arası Bileşenler — her iki programda ortak */
  PAB: {
    SDB: { ad:'Sosyal-Duygusal Öğrenme Becerileri', aciklama:'Benlik, sosyal yaşam, ortak/bileşik beceriler' },
    DEA: { ad:'Erdem-Değer-Eylem Çerçevesi', aciklama:'Millî ve manevi değerler; dürüstlük, sorumluluk, dostluk' },
    OB:  { ad:'Okuryazarlık Becerileri', aciklama:'Dijital, finansal, sürdürülebilirlik okuryazarlığı' },
  },
});

export { TYMM };
