/* ═══════════════════════════════════════════════════════════
   ABMATO — MatEvdeApp (Ana koordinatör)
   Tüm servisler, view render ve event işlemlerinin birleştiği yer.
   Görünüm bazlı alt-kontrolcüler için bölünmeye hazır yapı.
═══════════════════════════════════════════════════════════ */

// ── Çekirdek sabitler ve müfredat ─────────────────────────
import { AgeGroup, AnxietyLevel, ParentingStyle, Category } from './core/constants.js';
import {
  TYMM,
  TYMM_IL_OUTCOMES,
  getOutcomesByGrade,
  getOutcomesByTheme,
  getOutcomeByCode,
  getThemesByGrade,
  resolveOutcomes,
} from './core/tymm.js';

// ── Servisler ─────────────────────────────────────────────
import { StorageService }        from './services/StorageService.js';
import { ActivityRepository }    from './services/ActivityRepository.js';
import { RecommendationEngine }  from './services/RecommendationEngine.js';
import { BadgeEngine }           from './services/BadgeEngine.js';
import { TeacherMessageService } from './services/TeacherMessageService.js';
import { PlannerService }        from './services/PlannerService.js';
import { NotificationService }   from './services/NotificationService.js';
import { SmsService }            from './services/SmsService.js';
import { StreakService }         from './services/StreakService.js';
import { AnxietyTracker }        from './services/AnxietyTracker.js';
import { AdaptiveEngine }        from './services/AdaptiveEngine.js';
import { A11yService }           from './services/A11yService.js';
import { SubtypeService }        from './services/SubtypeService.js';
import { SpacedRetrievalService }from './services/SpacedRetrievalService.js';
import { ErrorPatternService }   from './services/ErrorPatternService.js';
import { ChildModeService }      from './services/ChildModeService.js';
import { ExportService }         from './services/ExportService.js';
import { ContentService }        from './services/ContentService.js';
import { AuthService }           from './services/AuthService.js';

// ── Alt uygulama: Beceri Köprüsü ──────────────────────────
import { createSkillBridge } from './skill-bridge/index.js';

// ── View kontrolcüleri (kademeli refactor) ────────────────
import { BreathingView } from './views/BreathingView.js';
import { MagnitudeGameView } from './views/MagnitudeGameView.js';
import { StructuredSubitizingView } from './views/StructuredSubitizingView.js';
import { CorsiBlockGameView } from './views/CorsiBlockGameView.js';
import { FactPracticeView } from './views/FactPracticeView.js';
import { StrategyView } from './views/StrategyView.js';
import { SubtypeProfileView } from './views/SubtypeProfileView.js';
import { EmbodiedNumberLineView } from './views/EmbodiedNumberLineView.js';
import { MathTalkExtView } from './views/MathTalkExtView.js';
import { ErrorReportView } from './views/ErrorReportView.js';
import { A11ySettingsView } from './views/A11ySettingsView.js';
import { KidsModeView } from './views/KidsModeView.js';
import { AdminPanelView } from './views/AdminPanelView.js';
import { AboutView } from './views/AboutView.js';

// ── Aile rutin tetikleyicileri (Math Talk extended) ──────
import { ROUTINE_TRIGGERS, pickRandomTalk } from './data/math-talk-extended.js';

class MatEvdeApp {
  constructor(){
    this._storage   = new StorageService();
    this._repo      = new ActivityRepository();
    this._recEngine = new RecommendationEngine(this._repo);
    this._badgeEng  = new BadgeEngine();
    this._teacherSvc= new TeacherMessageService(this._storage);
    this._plannerSvc= new PlannerService(this._storage, this._repo);
    this._notifSvc  = new NotificationService(this._storage);
    this._smsSvc    = new SmsService();
    this._streakSvc = new StreakService(this._storage);
    this._anxTracker= new AnxietyTracker(this._storage);
    this._adaptEng  = new AdaptiveEngine(this._storage);
    // ── Yeni servisler (v4 — diskalkuli derinleşme + a11y) ─
    this._a11y       = new A11yService(this._storage);
    this._subtype    = new SubtypeService(this._storage);
    this._spaced     = new SpacedRetrievalService(this._storage);
    this._errPatterns= new ErrorPatternService(this._storage);
    this._kidsMode   = new ChildModeService(this._storage);
    this._exportSvc  = new ExportService({
      storage: this._storage, repo: this._repo, subtype: this._subtype,
      spaced: this._spaced, errorPattern: this._errPatterns, anxiety: this._anxTracker,
    });
    this._content    = new ContentService(this._storage);
    this._auth       = new AuthService(this._storage);
    // _s alias servislerin storage'a kısa erişimi için (CorsiView kullanır)
    this._s = this._storage;
    // A11y body class uygulamasını DOM hazır olunca yap
    if(typeof document !== 'undefined'){
      if(document.body) this._a11y.apply();
      else document.addEventListener('DOMContentLoaded', () => this._a11y.apply(), { once: true });
    }
    // Eğer ChildMode aktifse body sınıfı uygula
    if(this._kidsMode.isOn()) document.body?.classList.add('kids-mode');

    this._parent   = null;
    this._childId  = null;
    this._activeView = 'splash';

    // Onboarding state
    this._ob = { step:0, name:'', email:'', childName:'', ageGroup:'', style:'autonomy', anxiety:{}, resources:[] };

    // Filter state
    this._filter = { category:null, anxOnly:false, spatialOnly:false, context:null, difficulty:null, searchTerm:'' };

    this._AGLabels = {
      [AgeGroup.PRESCHOOL]:'Okul Öncesi (3-6 yaş)',
      [AgeGroup.G1]:'1. Sınıf', [AgeGroup.G2]:'2. Sınıf',
      [AgeGroup.G3]:'3. Sınıf', [AgeGroup.G4]:'4. Sınıf',
    };
    this._CatLabels = {
    [Category.NUMBER]:'Sayı & İşlem',
    [Category.PATTERNS]:'Örüntü & Cebir',
    [Category.GEOMETRY]:'Geometri',
    [Category.MEASUREMENT]:'Ölçme',
    [Category.DAILY]:'Günlük Hayat',
    [Category.PROBLEM]:'Problem Kurma',
    [Category.SPATIAL]:'Uzamsal Düşünme',
    [Category.KITCHEN]:'Mutfak Lab',
    [Category.MARKET]:'Market Matematiği',
    [Category.TIME]:'Zaman & Planlama',
    [Category.GAME]:'Aile Oyunları',
    [Category.NATURE]:'Doğa & Açık Hava',
  };
    this._CatEmoji = {
    [Category.NUMBER]:'🔢',
    [Category.PATTERNS]:'🔄',
    [Category.GEOMETRY]:'🔺',
    [Category.MEASUREMENT]:'📏',
    [Category.DAILY]:'🏠',
    [Category.PROBLEM]:'💡',
    [Category.SPATIAL]:'🧩',
    [Category.KITCHEN]:'🍳',
    [Category.MARKET]:'🛒',
    [Category.TIME]:'⏰',
    [Category.GAME]:'🎲',
    [Category.NATURE]:'🌿',
  };
    this._DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

    this._anxQs = [
      // Boyut 1: Öğrenme Kaygısı (MARS-R / sMARS uyarlaması — Plake & Parker, 1982; Alexander & Martray, 1989)
      { id:'q1', text:'Çocuğuma matematik ödevinde yardım etmem gerektiğinde kendimi gergin hissederim.', rev:false },
      { id:'q2', text:'Bir matematik problemini çözerken takıldığımda panikleyebiliyorum.', rev:false },
      { id:'q3', text:'Matematiği günlük hayatımda (alışveriş, fatura hesaplama vb.) rahatça kullanırım.', rev:true },
      // Boyut 2: Değerlendirme / Aktarım Kaygısı (Maloney et al., 2015; Beilock et al., 2010)
      { id:'q4', text:'Çocuğumun matematik konusunda başarısız olması beni çok endişelendirir.', rev:false },
      { id:'q5', text:'Çocuğumla matematik konuşurken yanlış bir şey söyleyeceğimden çekinirim.', rev:false },
      { id:'q6', text:'Matematiğin çocuğumun geleceği için ne kadar önemli olduğunu düşündüğümde baskı hissederim.', rev:false },
      // Boyut 3: Öz-yeterlik / Destek Kapasitesi (Bandura, 1997; Pajares, 1996 uyarlaması)
      { id:'q7', text:'Çocuğumun anlayamadığı bir konuyu farklı şekillerde açıklayabileceğime inanırım.', rev:true },
      { id:'q8', text:'Matematik konusunda kendi bilgime güvenmiyorum.', rev:false },
    ];
    this._weekQs = [
      { id:'wq1', text:'Bu hafta en az bir matematik etkinliği yaptık.', opts:['Evet ✓','Hayır ✗','Kısmen'] },
      { id:'wq2', text:'Çocuğum spontan bir matematik şeyi paylaştı.', opts:['Evet','Hayır','Hatırlamıyorum'] },
      { id:'wq3', text:'Kendi kaygım bu hafta nasıldı?', opts:['😌 Rahat','😐 Orta','😰 Gergin'] },
    ];
    this._wqResp = {};

    this._learnModules = [
      { id:'lm1', emoji:'💡', title:'Matematik Neden Önemli?', sub:'Günlük hayattan örnekler', dur:'8 dk', level:1, text:'Matematik çocuğunuzun dünyayı anlamlandırma biçimidir — sınav notu değil. Araştırmalar, matematiği günlük bağlamda (mutfak, market, park) deneyimleyen çocukların okul matematiğinde çok daha güçlü bir temel kurduğunu göstermektedir (Lave, 1988; Freudenthal, 1991). Ebeveynin rolü öğretmek değil, merak ortamı oluşturmaktır. "Kaç tane?" diye soran bir ebeveyn, en etkili matematik eğitimini veriyordur.' },
      { id:'lm2', emoji:'❤️', title:'Kaygıyı Tanıyın', sub:'Sizden çocuğunuza ne geçer?', dur:'10 dk', level:1, text:'Ebeveyn matematik kaygısı çocuğa doğrudan geçmez — ama ebeveynin davranışları aracılığıyla etkiler. Beilock ve Maloney (2015), yüksek matematik kaygılı ebeveynlerin çocuklarıyla daha fazla ödev yardımı yaptıklarında çocukların daha düşük başarı gösterdiğini bulmuştur. Neden? Kaygılı ebeveyn, farkında olmadan kontrol edici ve olumsuz geri bildirim veriyor. Çözüm: Kendi kaygınızı çocuğunuza değil, bir not defterine söyleyin. "Ben de bazen matematikten çekiniyordum — ama birlikte bakalım" cümlesi, kaygıyı normalleştirir ve birlikteliği güçlendirir.' },
      { id:'lm3', emoji:'🌱', title:'Otonomi Destekleyici Olmak', sub:'Baskı değil, keşif ortamı', dur:'12 dk', level:2, text:'Özerklik destekleyici ebeveyn, cevabı değil soruyu sunar. "Kaç tane?" yerine "Nasıl buldun?" sorusu, çocuğun düşünme sürecini görünür kılar. Pomerantz ve arkadaşları (2005) şunu bulmuştur: Cevabı veren değil, süreci sorgulayan ebeveynlerin çocukları matematik öz-yeterliği açısından çok daha güçlüdür. Deneyin: Bu hafta matematikte tek bir şey söyleyin — "Hmm, emin misin?" Geri kalan her şeyi çocuğa bırakın.' },
      { id:'lm4', emoji:'🏠', title:'Ev Ortamı Nasıl Düzenlenmeli?', sub:'Matematik köşesi oluşturun', dur:'8 dk', level:2, text:'"Home Learning Environment" (HLE) araştırmaları, fiziksel düzenlemenin değil günlük etkileşim kalitesinin belirleyici olduğunu göstermektedir (Melhuish ve ark., 2008). Pahalı materyallere gerek yok. Sayıları günlük hayatta gösteren bir ebeveyn, özel ders veren bir ebeveynden çok daha etkilidir. Üç somut adım: (1) Sofrada takvimden gün sayın, (2) Markette fiyatları karşılaştırın, (3) Yatarken "bugün kaç tane... gördün?" diye sorun. Bu üç rutin, haftada 30 dakikada matematiksel ev ortamı oluşturur.' },
      { id:'lm5', emoji:'🔍', title:'Diskalkuli Farkındalığı', sub:'Öğrenme güçlüğünü tanıyın', dur:'15 dk', level:3, isSpecial:'dyscalculia', text:'Diskalkuli, sayıları işlemede yaşanan nörogelişimsel bir güçlüktür. Tembellik veya dikkatsizlik değildir. Erken tanıma ve doğru destek, uzun vadede büyük fark yaratır.' },
      { id:'lm6', emoji:'📱', title:'Teknolojiyi Akıllıca Kullanın', sub:'Uygulamalar ve sınırlılıkları', dur:'10 dk', level:2, text:'Dijital matematik oyunları destekleyici olabilir ancak ebeveyn etkileşiminin yerini tutamaz. En etkili yaklaşım: somut deneyim + ebeveyn sorulaması + isteğe bağlı dijital araç. Khan Academy Kids ve Prodigy kanıt temelli seçenekler. Kural: ekrana bakarken ebeveyn yanında sorular sorsun.' },
      { id:'lm7', emoji:'🤝', title:'Öğretmenle İş Birliği', sub:'Köprü nasıl kurulur?', dur:'8 dk', level:2, text:'Sheldon ve Epstein (2005) aile-okul ortaklıklarının matematik başarısı üzerindeki boylamsal etkisini kanıtlamıştır. Üç somut adım: (1) Dönem başında öğretmene sorun: hangi konular zor, evde nasıl destekleyebilirim? (2) Haftalık kısa not ile iletişimi sürdürün. (3) Çocuğun başarısını değil çabasını paylaşın.' },
      { id:'lm8', emoji:'🧭', title:'Uzamsal Düşünme Neden Önemli?', sub:'STEM başarısının gizli anahtarı', dur:'10 dk', level:2, text:'5 yaşındaki bir çocuğun zihinsel döndürme becerisi, 6 yaşındaki sayı doğrusu başarısını öngörüyor (Gunderson et al., 2012). Blok oyunu, tangram, harita çizimi — bunların hepsi uzamsal düşünceyi besler. Çocuğun "matematik zekâsı" gerçekte büyük ölçüde uzamsal zekâdır.' },
      { id:'lm9', emoji:'📚', title:'Resimli Kitapla Matematik', sub:'Math talk rehberi', dur:'8 dk', level:1, text:'Resimli kitap okurken doğal matematik sohbetleri açılır: "Kaç tane vardı? Bir tane daha geldi, şimdi kaç oldu?" Bu müdahale, Purpura ve arkadaşlarının 2021 RCT çalışmasında çocukların sayı dili gelişimini anlamlı biçimde artırdı.', isSpecial:'books' },
      { id:'lm10', emoji:'💬', title:'Sayı Sohbeti: Anında Sohbet Kartları', sub:'Araba, mutfak, market — her yerde', dur:'5 dk', level:1, text:'Matematik konuşması yapmak için etkinlik başlatmanıza gerek yok. Arabayla giderken: "Kaç tane kırmızı araba gördük?", markette: "Hangi kutu daha ağır?", akşam yemeğinde: "Kaç kişi masada? Herkese kaçar tabak lazım?" Bu kısa konuşmalar birikince büyük fark yaratır.', isSpecial:'mathtalk' },
      { id:'lm11', emoji:'💬', title:'Sayı Sohbeti+ (Genişletilmiş)', sub:'60+ tetikleyici, 6 bağlam, 3 yaş grubu', dur:'10 dk', level:2, text:'Mutfak, banyo, yatma, yol, market ve oyun bağlamlarında 60+ rehber soru. Yaş ve bağlama göre filtrelenir; rastgele soru çeker; sesli okur (TTS).', isSpecial:'mtext' },
      { id:'lm12', emoji:'💚', title:'Diskalkuli Derneği', sub:'Vizyonumuz ve iletişim', dur:'5 dk', level:1, text:'ABMATO, Diskalkuli Derneği işbirliğiyle geliştirilmiş ve tamamen ücretsiz olarak sunulmaktadır. "Herkes Matematik Öğrenebilir" ilkesiyle 2017\'den bu yana farkındalık çalışmaları yürütüyoruz. İletişim bilgileri için Hakkında sayfasına göz atın.', isSpecial:'about' },
      { id:'lm11', emoji:'🧘', title:'Kaygıyı Yönetin: Nefes Tekniği', sub:'Matematik yaparken sakin kalmak', dur:'6 dk', level:1, text:'Çocuğunuzla matematik yaparken gerginleştiğinizde: Derin nefes alın (4 saniye), tutun (4 saniye), verin (6 saniye). Bu tekniği çocuğunuza da öğretin. Araştırma bulgusu: ebeveyn kaygısı azaltılmadan ev aktivitelerinin etkisi sınırlı kalıyor (Cosso et al., 2023).', isSpecial:'breathing' },

      { id:'lm-skill', emoji:'📚', title:'Beceri Köprüsü', sub:'Adım adım matematik desteği', dur:'Kendi hızınızda', level:2, text:'Sayma, basamak değeri, toplama-çıkarma, sözel problem — 20 modül, her biri için ev yapımı araçlar ve özerklik destekleyici sorular.', isSpecial:'skill' },
      { id:'lm13', emoji:'♻️', title:'Her Bütçeye Uygun Matematik', sub:'Fırsat eşitliği ve ev ortamı', dur:'7 dk', level:1, text:'Düşük sosyoekonomik düzeyli ailelerin çocukları evde matematik desteği alınca başarı farkı kapanıyor (Verdine ve ark., 2014). Pahalı materyale gerek yok: kuru bakliyat, gazete, yumurta kartonları, kapak ve düğmeler sayma, sınıflama, örüntü ve ölçme için yeterli. En etkili materyal ebeveynin dikkatidir. 5 dakika kaliteli soru-cevap, 1 saatlik desteksiz çalışma kitabından daha etkilidir.' },
      { id:'lm14', emoji:'🌟', title:'Başarı Hikayeleri', sub:'Gerçek ailelerden deneyimler', dur:'5 dk', level:1, text:'Araştırmacılar farklı profilden ailelerle yaptıkları çalışmalarda ortak bir örüntü bulmuştur: başarıyı getiren aktivite değil, ebeveynin tutumudur. Matematiği eğlenceli ve anlamlı olarak çerçeveleyen her aile — gelir ve eğitim düzeyinden bağımsız — çocuklarında olumlu matematik tutumu geliştirmiştir (Muir, 2012; Skwarchuk, 2009). Siz de bu hikayelerin parçasısınız.', isSpecial:'stories' },
      { id:'lm12', emoji:'🎓', title:'TYMM Müfredat Çerçevesi', sub:'Okul öncesi ve ilkokul matematik', dur:'8 dk', level:2, text:'Türkiye Yüzyılı Maarif Modeli matematik becerileri ve ABMATO etkinliklerinin bu çerçeveyle hizası.', isSpecial:'tymm' },

      // ── Diskalkuli Derneği "Ebeveyn Rehber Kitabı" temelli modüller ──
      { id:'lm-belirti', emoji:'🔍', title:'Diskalkuli Belirtileri', sub:'Çocuğumda nelere dikkat etmeliyim?', dur:'8 dk', level:2, text:'Diskalkulik çocuklarda sık görülen somut işaretler: (1) Sayıları sezgisel kavrayamama, sayı doğrusunda yer bulmada zorluk. (2) Basit aritmetik işlemleri akılda tutamama — toplama-çıkarmayı bile parmakla devam ettirir. (3) Saati okumakta, gün-hafta-ay-yıl ilişkisinde güçlük. (4) Sağ-sol karıştırma, yön duygusu zayıflığı. (5) Bir mesafeyi (10 m mi 20 m mi) tahmin edememe. (6) Oyunlarda puan tutamama, finansal işlemleri (alışveriş sepeti) kavrayamama. (7) Matematik konularını/formülleri hatırlamada zorluk. (8) Parmakla sayma eğiliminin uzun süre devam etmesi. Bu işaretler tek başına bir tanı değildir — ama 3+ tanesi tutarlıysa Rehberlik ve Araştırma Merkezi (RAM) değerlendirmesi düşünülebilir. Kaynak: Mutlu & Çalışkan, Diskalkuli Derneği (2023).' },
      { id:'lm-tani', emoji:'🎯', title:'Erken Tanılama ve RAM Süreci', sub:'Ne zaman uzman desteği?', dur:'10 dk', level:2, text:'Diskalkulik çocuklar ilkokuldan itibaren yaşıtlarının gerisinde kalır; zaman ilerledikçe fark artar (Mutlu & Olkun, 2019). Erken tanı bu farkın büyümesini önler. Süreç dört aşamada: (1) FARKINA VARMA — ebeveyn/öğretmen akranlara göre belirgin gerilik gözler. (2) İLK YÖNLENDİRME — sınıf öğretmeniyle konuşun, çocuğun günlük performansını kayıt altına aldırın. (3) RAM BAŞVURUSU — e-Devlet üzerinden Rehberlik ve Araştırma Merkezi\'ne randevu alın. Süreç ücretsizdir, 60 gün içinde değerlendirme tamamlanır. (4) BİREYSEL EĞİTİM PLANI — tanı sonrası okuldaki destek eğitim odası ve özel eğitim hizmetlerinden yararlanılır. Tanı koyma yararı: çocuk yaşadığını anlar, ebeveyn nedenleri öğrenir, öğretmen gereksiz müdahalelerden kaçınır, depresyon riski azalır. Kaynak: Diskalkuli Derneği Ebeveyn Rehberi.' },
      { id:'lm-cra', emoji:'🧱', title:'Somut → Soyut: CRA Yaklaşımı', sub:'En etkili öğretim sıralaması', dur:'12 dk', level:2, text:'Bilimsel dayanaklı en güçlü yaklaşımlardan biri: Somut → Yarı-Somut → Soyut (CRA, Bruner). Üç aşamada öğretim:\n\n1) SOMUT: Yeni bir kavramı her zaman gerçek nesnelerle başlatın — fasulye, mercimek, lego, kapak, parmak. Örnek: "5+3" için 5 fasulye + 3 fasulye birleştirip sayalım.\n\n2) YARI-SOMUT: Aynı kavram resimlerle modellenir. "5+3" için kağıda 5 daire + 3 daire çizin, birleştirip sayın. Çocuk hem nesneyi görsel olarak hatırlar hem soyuta köprü kurar.\n\n3) SOYUT: Yalnızca sembollerle çalışın: "5 + 3 = 8". Çocuk bu noktaya rahat hissetmeden geçmesin.\n\nÖnemli: Soyuta geçerken bir önceki aşamayı yanında bulundurun — fasulye ve çizimle birlikte semboller. Bu, diskalkulik çocuklarda kalıcılığı önemli ölçüde artırır. Pratik: Bu hafta yapacağınız her yeni matematik etkinliğinde önce malzeme, sonra çizim, sonra sayı sembolü sırasına uyun. Kaynak: Diskalkuli Derneği Ebeveyn Rehberi; Bruner, 1966.' },
      { id:'lm-bellek', emoji:'🧠', title:'Çalışma Belleği Desteği', sub:'Diskalkulinin merkezindeki zorluk', dur:'10 dk', level:2, text:'Çalışma belleği, beynin "anlık not defteri"dir — bir bilgiyi (örn. 27) zihinde tutarken aynı anda başka bir şey yapma yeteneği (üzerine 8 ekleme). Araştırmalar diskalkulik çocuklarda bu belleğin akranlarından zayıf olduğunu gösteriyor (Geary ve ark., 2012). Bu yüzden çocuk basit gibi görünen işlemleri bile yapmakta zorlanır — sayıyı hatırlayamaz, ortada unutur.\n\nNe yapabilirsiniz?\n\n• İŞLEMİ GÖRSELLEŞTİRİN: "27 + 8" için 27\'yi kağıda yazın, çocuk üzerine eklesin — bellek yükü dışarı çıkar.\n\n• PARÇALA: Tek bir uzun işlem yerine küçük parçalara bölün: "Önce 27 + 3 = 30, sonra +5 = 35".\n\n• PARMAKLA SAYMAYI DESTEKLEYİN: Diskalkulili çocuklar için parmak bir tercih değil, çalışma belleğinin yedeği. Engellemeyin.\n\n• TEKRARLAYIN: Aynı tür problemi 4-5 farklı bağlamda yapın (mutfak, market, oyun). Tekrar = pekiştirme = bellek genişletme.\n\n• ZAMAN BASKISI YAPMAYIN: Süre baskısı çalışma belleğini daha da daraltır. "Düşünmen için zamanın var" deyin.\n\nKaynak: Baddeley (2003), Geary ve ark. (2012); Diskalkuli Derneği Ebeveyn Rehberi.' },
    ];

    // ── Resimli Kitap Kütüphanesi ──────────────────────────
    this._bookLibrary = [
      // ── Türkçe Resimli Kitap Listesi ─────────────────────────────
      // Kaynak: Türk çocuk edebiyatı ve matematik odaklı kitaplar
      // Her kitapta: Türkçe yazar, Türkçe özgün/çeviri, matematik bağlantısı

      // OKUL ÖNCESİ & 1. SINIF
      { id:'b01', emoji:'🐛', title:'Çok Aç Tırtıl', author:'Eric Carle (Can Çocuk)',
        ageGroups:[AgeGroup.PRESCHOOL,AgeGroup.G1],
        mathConcepts:['Sayma','Sıralı sayılar','Haftanın günleri','Toplama'],
        mathQuestions:['Pazartesi kaç tane yedi?','Cumartesi ile Pazartesi arasında fark ne?','Hepsi toplam kaç tane yedi?'],
        tip:'Türkiye genelinde okul kütüphanelerinde bulunan klasik. Günler ve sayma için mükemmel.' },

      { id:'b02', emoji:'🐑', title:'Koyun Sayarken', author:'Mem Fox / Judy Horacek (Uçanbalık)',
        ageGroups:[AgeGroup.PRESCHOOL,AgeGroup.G1],
        mathConcepts:['Sayma','10a kadar sayılar','Azalma'],
        mathQuestions:['Kaç koyun kaldı?','Her sayfada kaç azaldı?','Başta kaç tane vardı?'],
        tip:'Uyku vakti için ideal. Geriye sayma çıkarmanın temelini kurar.' },

      { id:'b03', emoji:'🐞', title:'Bir Delikten Bakmak', author:'Aytül Akal (Altın Kitaplar)',
        ageGroups:[AgeGroup.PRESCHOOL,AgeGroup.G1],
        mathConcepts:['Şekil tanıma','Geometri','Gözlem'],
        mathQuestions:['Bu delikten ne şekil görünüyor?','Daire ve kare arasındaki fark ne?','Kaç köşesi var?'],
        tip:'Türk yazardan geometri farkındalığı için. Gözlem ve şekil keşfi.' },

      { id:'b04', emoji:'🦆', title:'Küçük Sarı Ördek', author:'Feridun Oral (Yapı Kredi)',
        ageGroups:[AgeGroup.PRESCHOOL,AgeGroup.G1],
        mathConcepts:['Sayma','Renk-sayı ilişkisi','Sıralama'],
        mathQuestions:['Kaç tane ördek var?','Sıralamayı tersine çevirsek?','En büyük hangisi?'],
        tip:'Feridun Oral Türk çocuk edebiyatının en sevilen isimleri arasında.' },

      { id:'b05', emoji:'🌙', title:'Ay Nereden Doğar?', author:'Aytül Akal (Altın Kitaplar)',
        ageGroups:[AgeGroup.PRESCHOOL,AgeGroup.G1],
        mathConcepts:['Büyük/küçük','Karşılaştırma','Uzamsal ilişki'],
        mathQuestions:['Ay mı büyük Güneş mi?','Nereden doğdu, nereye gitti?','Yukarı mı aşağı mı?'],
        tip:'Uzamsal düşünme ve karşılaştırma kavramları için.' },

      // 1. - 2. SINIF
      { id:'b06', emoji:'🍎', title:'Elma Kurdu', author:'Nurten Arca (Tudem)',
        ageGroups:[AgeGroup.G1,AgeGroup.G2],
        mathConcepts:['Bölme','Paylaşım','Kesir girişi'],
        mathQuestions:['Elmayı eşit bölebilir miyiz?','Yarısı ne kadar?','4 kişiye nasıl paylaştırırsın?'],
        tip:'Türk yazardan paylaşım ve bölme için somut bağlam.' },

      { id:'b07', emoji:'🌻', title:'Tohumun Büyük Yolculuğu', author:'İlknur Özdemir (Can Çocuk)',
        ageGroups:[AgeGroup.G1,AgeGroup.G2],
        mathConcepts:['Ölçme','Büyüme','Zaman'],
        mathQuestions:['Kaç günde büyüdü?','Dün ne kadardı, bugün ne kadar?','Farkı hesaplayabilir misin?'],
        tip:'Ölçme ve zaman kavramı için. Evde tohum yetiştirme etkinliğiyle birleştirilebilir.' },

      { id:'b08', emoji:'🎒', title:'Okula Giden Çanta', author:'Behiç Ak (Yapı Kredi)',
        ageGroups:[AgeGroup.G1,AgeGroup.G2],
        mathConcepts:['Sayma','Sınıflama','Toplama'],
        mathQuestions:['Çantada kaç eşya var?','Hangi eşyalar aynı türden?','Toplam ağırlığı ne olabilir?'],
        tip:'Behiç Ak Türk çocuk edebiyatının klasiği.' },

      // 2. - 3. SINIF
      { id:'b09', emoji:'🏪', title:'Recep Ustanın Dükkanı', author:'Aytül Akal (Altın Kitaplar)',
        ageGroups:[AgeGroup.G2,AgeGroup.G3],
        mathConcepts:['Para hesabı','Toplama-çıkarma','Gerçek hayat matematiği'],
        mathQuestions:['Kaç lira verdi?','Para üstü ne kadar?','Toplam ne kadar ödemeli?'],
        tip:'Market ve para matematiği için mükemmel Türkçe kaynak.' },

      { id:'b10', emoji:'🌈', title:'Renklerin Savaşı', author:'Feridun Oral (Yapı Kredi)',
        ageGroups:[AgeGroup.G2,AgeGroup.G3],
        mathConcepts:['Sınıflama','Veri','Grafik'],
        mathQuestions:['Hangi renk en çok var?','Grafiğe döksek nasıl görünür?','Azdan çoğa sırala'],
        tip:'Veri toplama ve grafik oluşturma için yaratıcı bağlam.' },

      { id:'b11', emoji:'🗺️', title:'Meraklı Çocuklar Dünyayı Keşfediyor', author:'Ömer Seyfettin uyarlaması',
        ageGroups:[AgeGroup.G2,AgeGroup.G3,AgeGroup.G4],
        mathConcepts:['Ölçek','Mesafe','Koordinat'],
        mathQuestions:['Haritada bu yer nerede?','Gerçekte ne kadar uzak?','Ölçek ne anlama geliyor?'],
        tip:'Koordinat ve harita ölçeği için. Uzamsal düşünme.' },

      // 3. - 4. SINIF
      { id:'b12', emoji:'🔢', title:'Sayıların Gizemli Dünyası', author:'Yılmaz Özdil (Remzi)',
        ageGroups:[AgeGroup.G3,AgeGroup.G4],
        mathConcepts:['Büyük sayılar','Örüntü','Sayı tarihi'],
        mathQuestions:['Milyar kaç sıfırdır?','Bu sayı örüntüsü nereye gidiyor?','En büyük sayı var mı?'],
        tip:'Sayı tarihi ve örüntü farkındalığı için. 3-4. sınıfa uygun.' },

      { id:'b13', emoji:'⏰', title:'Zamanın Sırrı', author:'Müge İplikçi (Altın Kitaplar)',
        ageGroups:[AgeGroup.G3,AgeGroup.G4],
        mathConcepts:['Zaman','Saatler','Hesaplama'],
        mathQuestions:['Kaç saat geçti?','Toplantı ne zaman bitiyor?','2 saat 45 dakika sonra saat kaç?'],
        tip:'Zaman ve saat hesabı için hikaye bağlamı.' },
    ];

    // ── Sayı Sohbeti Konuşma Kartları ──────────────────────────
    this._sayiSohbetiKartlari = [
      { id:'mt01', context:'🚗 Araçta', prompt:'Kaç tane kırmızı araba geçti?', concept:'Sayma & Dikkat', ageMin: AgeGroup.PRESCHOOL },
      { id:'mt02', context:'🛒 Markette', prompt:'Hangi kutu daha ağır? Nasıl anlarsın?', concept:'Ölçme tahmini', ageMin: AgeGroup.PRESCHOOL },
      { id:'mt03', context:'🍽️ Yemekte', prompt:'Herkes için kaçar tabak lazım?', concept:'Çarpmanın temeli', ageMin: AgeGroup.G1 },
      { id:'mt04', context:'⏰ Günlük', prompt:'Okula kaç dakika kaldı?', concept:'Zaman & Çıkarma', ageMin: AgeGroup.G1 },
      { id:'mt05', context:'🌡️ Hava', prompt:'Dün 15°C, bugün 22°C. Ne kadar ısındı?', concept:'Fark hesaplama', ageMin: AgeGroup.G2 },
      { id:'mt06', context:'🧺 Çamaşır', prompt:'Bu çoraplar kaç çift?', concept:'Eşleştirme & çift', ageMin: AgeGroup.PRESCHOOL },
      { id:'mt07', context:'🏗️ Etraf', prompt:'Bu pencere kaç tuğla geniş?', concept:'Ölçme & birim', ageMin: AgeGroup.G1 },
      { id:'mt08', context:'🌙 Yatmadan', prompt:'Bugün kaç farklı şey saydın?', concept:'Serbest sayma', ageMin: AgeGroup.PRESCHOOL },
      { id:'mt09', context:'🍕 Yemekte', prompt:'Bu pizzayı 4 kişiye nasıl böleriz?', concept:'Kesirler & paylaşım', ageMin: AgeGroup.G1 },
      { id:'mt10', context:'📦 Paket', prompt:'Bu kutu içine kaç elma sığar sence?', concept:'Tahmin & uzamsal', ageMin: AgeGroup.PRESCHOOL },
    ];

    // ── Kaygı Nefes Seansı ──────────────────────────────────
    this._breathingSteps = [
      { icon:'🫁', label:'Nefes al', duration:4, instruction:'Burnunuzdan yavaşça nefes alın… 1… 2… 3… 4…' },
      { icon:'⏸️', label:'Tut', duration:4, instruction:'Nefesinizi tutun… 1… 2… 3… 4…' },
      { icon:'💨', label:'Nefes ver', duration:6, instruction:'Ağzınızdan yavaşça verin… 1… 2… 3… 4… 5… 6…' },
    ];

    // v6: Yönetici tarafından kaydedilmiş içerik snapshot'larını yükle
    this._hydrateContentOverrides();
  }

  /* ── ROUTING ───────────────────────────────────── */

  show(name, opts={}){
    // Navigation history stack — geri butonunu güçlendir
    const historyExclude = new Set(['splash','onboarding']);
    if(this._activeView && this._activeView !== name && !historyExclude.has(this._activeView)){
      if(!opts.isBack){
        this._navHistory = this._navHistory || [];
        // Yineleme engeli
        if(this._navHistory[this._navHistory.length-1] !== this._activeView){
          this._navHistory.push(this._activeView);
          if(this._navHistory.length > 15) this._navHistory.shift();
        }
      }
    }
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    const el = document.getElementById(`view-${name}`);
    if(el){
      el.classList.add('active');
      this._activeView=name;
      el.style.animation='none';
      requestAnimationFrame(()=>{
        el.style.animation='';
      });
      // Sayfayı en başa kaydır
      el.querySelector('.page')?.scrollTo?.(0,0);
      el.scrollTo?.(0,0);
      // PWA install banner — sadece splash/dashboard'da görünmesi gerekir
      this._maybeShowInstallBanner?.();
      // Sayfa başlığını güncelle
      const titles = {'dashboard': 'ABMATO — Ana Sayfa', 'activities': 'ABMATO — Etkinlikler', 'learn': 'ABMATO — Akademi', 'progress': 'ABMATO — Gelişim', 'planner': 'ABMATO — Planlayıcı', 'teacher': 'ABMATO — Öğretmen İletişimi', 'skill': 'ABMATO — Beceri Köprüsü', 'books': 'ABMATO — Kitap & Sayı Sohbeti', 'mathtalk': 'ABMATO — Sayı Sohbeti', 'dyscalculia': 'ABMATO — Diskalkuli Bilgi', 'tymm': 'ABMATO — TYMM Müfredat', 'spatial': 'ABMATO — Uzamsal Düşünme', 'breathing': 'ABMATO — Nefes Egzersizi', 'profile': 'ABMATO — Profil', 'sms': 'ABMATO — Haftalık Görev', 'stories': 'ABMATO — Başarı Hikayeleri', 'notifications': 'ABMATO — Bildirimler', 'magnitude': 'ABMATO — Hangisi Büyük?', 'struct-sub': 'ABMATO — Yapılı Sayma', 'corsi': 'ABMATO — Hafıza Blokları', 'fact': 'ABMATO — Aralıklı Tekrar', 'strategies': 'ABMATO — Stratejiler', 'subtype': 'ABMATO — Alt-Tip Profili', 'embodied': 'ABMATO — Yer Sayı Doğrusu', 'mtext': 'ABMATO — Sayı Sohbeti+', 'errreport': 'ABMATO — Hata Deseni', 'a11y': 'ABMATO — Erişilebilirlik', 'kids': 'ABMATO — Çocuk Modu', 'admin': 'ABMATO — Yönetici Paneli', 'about': 'ABMATO — Diskalkuli Derneği'};
      if(titles[name]) document.title = titles[name];
    }
    const renders = {
      dashboard:()=>this._renderDash(),
      activities:()=>this._renderActs(),
      learn:()=>this._renderLearn(),
      profile:()=>this._renderProfile(),
      teacher:()=>this._renderTeacher(),
      planner:()=>this._renderPlanner(),
      progress:()=>this._renderProgress(),
      dyscalculia:()=>this._renderDysc(),
      sms:()=>this._renderSms(),
      offline:()=>this._renderOffline(),
      notifications:()=>this._renderNotifs(),
      books:()=>this._renderBooks(),
      tymm:()=>this._renderTymm(),
      stories:()=>this._renderStories(),
      skill:()=>this._renderSkill(),
      mathtalk:()=>this._renderSayiSohbeti(),
      breathing:()=>this._renderBreathing(),
      spatial:()=>this._renderSpatialModule(),
      // ── Yeni view'lar ────────────────────────────────────
      magnitude:()=>MagnitudeGameView.render(this),
      'struct-sub':()=>StructuredSubitizingView.render(this),
      corsi:()=>CorsiBlockGameView.render(this),
      fact:()=>FactPracticeView.render(this),
      strategies:()=>StrategyView.render(this),
      subtype:()=>SubtypeProfileView.render(this),
      embodied:()=>EmbodiedNumberLineView.render(this),
      mtext:()=>MathTalkExtView.render(this),
      errreport:()=>ErrorReportView.render(this),
      a11y:()=>A11ySettingsView.render(this),
      kids:()=>KidsModeView.render(this),
      admin:()=>AdminPanelView.render(this),
      about:()=>AboutView.render(this),
    };
    renders[name]?.();
    this._updateBnavs(name);
    this._updateNotifDot();
  }

  back(){
    if(this._ob && this._ob.step > 0){ this._ob.step--; this._renderOb(); return; }
    this._navHistory = this._navHistory || [];
    if(this._navHistory.length > 0){
      const prev = this._navHistory.pop();
      this.show(prev, { isBack: true });
    } else {
      this.show('dashboard', { isBack: true });
    }
  }

  /* ── BOOT ──────────────────────────────────────── */

  start(){
    // Çift tıklama / hızlı tekrar çağrı yarış koşulu — kısa bir süre reentrant'ı kilitle.
    if(this._starting) return;
    this._starting = true;
    setTimeout(()=>{ this._starting = false; }, 500);

    /* ÜCRETSİZ: Üyelik / giriş şartı yok. Kayıtlı profil varsa dashboard'a,
       yoksa splash'a (Hemen Başla) yönlendir. */
    const saved = this._storage.get('parent');
    if (saved?.onboardingComplete) {
      this._parent = saved;
      this._childId = saved.children?.[0]?.id || null;
      this.show('dashboard');
      return;
    }
    this.show('splash');
  }

  /**
   * Splash'taki "Hemen Başla" butonu: doğrudan onboarding'e gönderir.
   * Üyelik/giriş yok — uygulama tamamen ücretsiz.
   */
  beginFree(){
    this._ob = { step:0, name:'', email:'', childName:'', ageGroup:'', style:'autonomy', anxiety:{}, resources:[] };
    this.show('onboarding');
    this._renderOb();
  }

  /**
   * "Aa" hızlı erişim: yazıyı büyüt/küçült (a11y-large toggle).
   * Splash ve dashboard navbar'ından çağrılır.
   */
  toggleLargeText(){
    const next = this._a11y.toggle('large');
    this._toast(next.large ? '🔍 Büyük yazı modu açık' : '🔍 Normal yazı modu', 'ok');
  }

  /* ══════════════════════════════════════════════
     ONBOARDING
  ══════════════════════════════════════════════ */

  _renderOb(){
    // R6 — Onboarding'i 3 adıma indirgedik. Kaygı ölçeği (eski adım 1) kaldırıldı;
    // dashboard üzerinden opsiyonel olarak sonra sunuluyor. Mevcut adım sayısı:
    // 0: İsim  ·  1: Çocuk + yaş + SES  ·  2: Ebeveynlik stili
    const total = 3;
    document.getElementById('ob-steps').innerHTML =
      Array.from({length:total},(_,i)=>`<div class="step-dot ${i<this._ob.step?'done':i===this._ob.step?'cur':''}"></div>`).join('');
    const body = document.getElementById('ob-body');
    const steps = [
      ()=>this._obStep0(body),
      ()=>this._obStep2(body),  // Çocuk bilgileri artık 2. adım (eski 3. adımdı)
      ()=>this._obStep3(body),  // Ebeveynlik stili son adım
    ];
    steps[this._ob.step]?.();
  }

  _obStep0(el){
    el.innerHTML=`<div style="padding:2.5rem 1.5rem 2rem;display:flex;flex-direction:column;gap:1.4rem;max-width:100%;margin:0 auto">
      <div style="text-align:center;margin-bottom:.5rem">
        <div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,var(--teal),var(--teal-d));display:flex;align-items:center;justify-content:center;margin:0 auto 1.1rem;box-shadow:0 8px 24px rgba(13,148,136,.3);font-size:2rem">🏡</div>
        <h2 style="font-size:var(--t-2xl);font-weight:900;letter-spacing:-.02em">Hoş Geldiniz!</h2>
        <p style="color:var(--muted);margin-top:.4rem;font-size:var(--t-md);line-height:1.6;max-width:280px;margin-inline:auto">Çocuğunuzun matematiğini evde keyifle destekleyin. Başlamak için adınızı öğrenelim.</p>
      </div>
      <div class="field">
        <label>Adınız</label>
        <input class="input" id="ob-name" placeholder="Örn: Zeynep" value="${this._esc(this._ob.name)}" style="font-size:var(--t-lg)">
      </div>
      <div class="field">
        <label>E-posta <span style="font-weight:400;color:var(--muted)">(isteğe bağlı)</span></label>
        <input class="input" id="ob-email" type="email" placeholder="ornek@mail.com" value="${this._esc(this._ob.email)}">
      </div>
      <div style="background:var(--teal-a);border-radius:var(--r-md);padding:.7rem .9rem;display:flex;align-items:center;gap:.6rem">
        <span style="font-size:1.1rem">🔒</span>
        <p style="font-size:var(--t-xs);color:var(--teal-d);line-height:1.55">Tüm verileriniz yalnızca bu cihazda saklanır. Hiçbir sunucuya gönderilmez.</p>
      </div>
      <button class="btn btn-primary btn-block" style="font-size:var(--t-lg);padding:.88rem" onclick="App._obNext()">Devam →</button>
    </div>`;
  }

  _obStep1(el){
    el.innerHTML=`<div style="padding:1.8rem 1.5rem 2rem;max-width:100%;margin:0 auto">
      <h2>Matematik ile Aranız</h2>
      <p class="muted" style="margin:.35rem 0 1.3rem;font-size:var(--t-md)">Her ifadeyi şu anki durumunuza göre değerlendirin. Doğru ya da yanlış yanıt yoktur. Bu ölçek; size özel etkinlik önerileri ve destek stratejileri oluşturmak için kullanılır.</p>
      <p style="font-size:var(--t-xs);color:var(--muted);background:var(--raised);border-radius:var(--r-sm);padding:.5rem .75rem;margin-bottom:1rem;line-height:1.6">📚 <em>Bu ölçek MARS-R (Plake & Parker, 1982), sMARS (Alexander & Martray, 1989) ve ebeveyn matematik kaygısı literatüründen (Maloney ve ark., 2015; Beilock ve ark., 2010) uyarlanmıştır.</em></p>
      <div style="display:flex;flex-direction:column;gap:1.1rem">
        ${this._anxQs.map((q,i)=>`
          <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);padding:1rem">
            <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.65rem">${i+1}. ${q.text}</p>
            <div class="likert">${[1,2,3,4,5].map(v=>`<button class="likert-btn ${this._ob.anxiety[q.id]===v?'sel':''}" onclick="App._anxSel('${q.id}',${v})">${v}</button>`).join('')}</div>
            <div style="display:flex;justify-content:space-between;font-size:var(--t-xs);color:var(--muted);margin-top:.3rem"><span>Hiç katılmıyorum</span><span>Tamamen katılıyorum</span></div>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:1.4rem" onclick="App._obNext()">Devam →</button>
    </div>`;
  }

  _obStep2(el){
    el.innerHTML=`<div style="padding:1.8rem 1.5rem 2rem;max-width:100%;margin:0 auto">
      <div class="center" style="margin-bottom:1.4rem"><div style="font-size:3rem">👧🏻</div><h2 style="margin-top:.5rem">Çocuğunuzu Tanıyalım</h2></div>
      <div class="field" style="margin-bottom:1.2rem"><label>Çocuğunuzun Adı <span style="font-weight:400;color:var(--muted)">(isteğe bağlı)</span></label><input class="input" id="ob-cname" placeholder="Örn: Ali" value="${this._esc(this._ob.childName)}"></div>
      <div class="field"><label>Sınıf / Yaş Grubu</label>
        <div style="display:flex;flex-direction:column;gap:.55rem;margin-top:.25rem">
          ${Object.entries(this._AGLabels).map(([k,v])=>`
            <div style="display:flex;align-items:center;gap:.8rem;padding:.82rem 1rem;border:2px solid ${this._ob.ageGroup===k?'var(--teal)':'var(--border)'};border-radius:var(--r-md);cursor:pointer;transition:var(--t);background:${this._ob.ageGroup===k?'var(--teal-a)':'var(--surface)'}" onclick="App._agSel('${k}')">
              <span style="font-size:1.35rem">${k===AgeGroup.PRESCHOOL?'🎒':k===AgeGroup.G1?'1️⃣':k===AgeGroup.G2?'2️⃣':k===AgeGroup.G3?'3️⃣':'4️⃣'}</span>
              <strong style="font-size:var(--t-lg)">${v}</strong>
              ${this._ob.ageGroup===k?'<span style="margin-left:auto;color:var(--teal);font-weight:900">✓</span>':''}
            </div>`).join('')}
        </div>
      </div>
      <!-- SES: Evde mevcut kaynaklar -->
      <div style="margin-top:1.2rem">
        <label style="font-size:var(--t-md);font-weight:700;display:block;margin-bottom:.5rem">Evde genellikle neler bulunur?</label>
        <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.65rem">Bu bilgi, etkinlik önerilerini evinize uyarlamak için kullanılır.</p>
        <div style="display:flex;flex-direction:column;gap:.45rem">
          ${[
            {k:'basic', label:'🥄 Temel mutfak malzemeleri (kaşık, kase, bakliyat...)'},
            {k:'craft',  label:'✂️ Kağıt, kalem, makas, karton'},
            {k:'toys',   label:'🧩 Tahta oyuncak, lego veya bloklar'},
            {k:'digital',label:'📱 Tablet veya akıllı telefon'},
          ].map(r=>`<label style="display:flex;align-items:center;gap:.65rem;padding:.6rem .85rem;border:1.5px solid var(--border);border-radius:var(--r-md);cursor:pointer;background:var(--surface)">
            <input type="checkbox" id="res-${r.k}" style="width:16px;height:16px;accent-color:var(--teal)" ${(this._ob.resources||[]).includes(r.k)?'checked':''} onchange="App._resSel('${r.k}',this.checked)">
            <span style="font-size:var(--t-md)">${r.label}</span>
          </label>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:1.4rem" onclick="App._obNext()">Devam →</button>
    </div>`;
  }

  _obStep3(el){
    // Teorik çerçeve: Self-Determination Theory (Deci & Ryan, 2000)
    // Özerklik destekleyici ebeveynlik: Grolnick & Ryan (1989)
    // Matematik bağlamı: Soenens & Vansteenkiste (2010), Pomerantz ve ark. (2005)
    const opts = [
      {
        k:'autonomy',
        emoji:'🌱',
        label:'Özerklik Destekleyici',
        subtitle:'(Önerilen yaklaşım)',
        desc:'Çocuğun kendi çözümünü bulmasına alan açarım. Soruyu sunarım, cevabı değil. Hata, öğrenmenin parçasıdır.',
        research:'Araştırma: Bu yaklaşım çocukların içsel motivasyonunu ve matematik öz-yeterliğini artırır (Grolnick & Ryan, 1989; Pomerantz ve ark., 2005).',
        highlight: true,
      },
      {
        k:'controlling',
        emoji:'📋',
        label:'Yönlendirici',
        subtitle:'',
        desc:'Adım adım rehberlik ederim. Yanlış yolda olunca müdahale ederim. Doğru sonuca ulaşmak önceliğimdir.',
        research:'Not: Yüksek yönlendirici tarz, çocukta bağımlılık yaratabilir ve matematik kaygısını artırabilir.',
        highlight: false,
      },
      {
        k:'mixed',
        emoji:'⚖️',
        label:'Duruma Göre',
        subtitle:'',
        desc:'Bazen alan tanırım, bazen adım adım yönlendiririm. Çocuğun ihtiyacına göre değişirim.',
        research:'',
        highlight: false,
      },
    ];
    el.innerHTML=`<div style="padding:1.8rem 1.5rem 2rem;max-width:100%;margin:0 auto">
      <h2>Destek Tarzınız</h2>
      <p class="muted" style="margin:.35rem 0 .6rem;font-size:var(--t-md)">Şu anki yaklaşımınızı seçin. ABMATO, özerklik destekleyici yaklaşımı temel alır ve tüm etkinlikler bu felsefeyle tasarlanmıştır.</p>
      <p style="font-size:var(--t-xs);color:var(--muted);background:var(--raised);border-radius:var(--r-sm);padding:.5rem .75rem;margin-bottom:1.1rem;line-height:1.6">📚 <em>Kaynak: Deci & Ryan (2000) Öz-Belirleme Kuramı · Grolnick & Ryan (1989) · Soenens & Vansteenkiste (2010)</em></p>
      <div style="display:flex;flex-direction:column;gap:.85rem">
        ${opts.map(o=>`
          <div style="padding:1.15rem;border:2.5px solid ${this._ob.style===o.k?'var(--teal)':o.highlight?'var(--teal-d)':'var(--border)'};border-radius:var(--r-lg);cursor:pointer;transition:var(--t);background:${this._ob.style===o.k?'var(--teal-a)':o.highlight?'rgba(45,106,79,.05)':'var(--surface)'}" onclick="App._styleSel('${o.k}')">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.25rem">
              <span style="font-size:1.7rem">${o.emoji}</span>
              <div style="flex:1">
                <strong>${o.label}</strong>
                ${o.subtitle?`<span style="font-size:var(--t-xs);color:var(--teal-d);font-weight:700;margin-left:.4rem">${o.subtitle}</span>`:''}
              </div>
              ${this._ob.style===o.k?'<span style="color:var(--teal);font-size:1.2rem">✓</span>':''}
            </div>
            <p style="font-size:var(--t-md);color:var(--muted);margin-bottom:.3rem">${o.desc}</p>
            ${o.research?`<p style="font-size:var(--t-xs);color:${o.highlight?'var(--teal-d)':'var(--amber)'};font-style:italic;line-height:1.5">${o.research}</p>`:''}
          </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:1.4rem" onclick="App._obFinish()">Başlayalım! 🚀</button>
    </div>`;
  }

  _anxSel(qid, val){
    this._ob.anxiety[qid]=val;
    document.querySelectorAll(`[onclick*="_anxSel('${qid}'"]`).forEach(b=>{
      b.classList.toggle('sel', parseInt(b.textContent)===val);
    });
  }
  _agSel(k){ this._ob.ageGroup=k; this._obStep2(document.getElementById('ob-body')); }
  _styleSel(k){ this._ob.style=k; this._obStep3(document.getElementById('ob-body')); }
  _resSel(k, checked){
    if(!this._ob.resources) this._ob.resources=[];
    if(checked){ if(!this._ob.resources.includes(k)) this._ob.resources.push(k); }
    else { this._ob.resources=this._ob.resources.filter(r=>r!==k); }
  }

  _obNext(){
    // R6 — 3 adımlı onboarding: 0=İsim · 1=Çocuk · 2=Stil
    const {step}=this._ob;
    if(step===0){
      const inp=document.getElementById('ob-name');
      const n=inp?.value.trim();
      if(!n){
        this._toast('Lütfen adınızı girin','err');
        if(inp){
          inp.style.borderColor='var(--danger)';
          inp.style.boxShadow='0 0 0 3px rgba(220,38,38,.12)';
          inp.focus();
          inp.scrollIntoView({ behavior:'smooth', block:'center' });
        }
        return;
      }
      this._ob.name=n;
      this._ob.email=document.getElementById('ob-email')?.value.trim()||'';
    }
    if(step===1){
      if(!this._ob.ageGroup){
        this._toast('Lütfen çocuğunuzun yaş grubunu seçin','err');
        const body=document.getElementById('ob-body');
        body?.scrollTo({ top:body.scrollHeight, behavior:'smooth' });
        // Yaş kartlarını kısa süre vurgula
        const cards=document.querySelectorAll('[onclick*="_agSel"]');
        cards.forEach(c=>{
          const orig=c.style.borderColor;
          c.style.borderColor='var(--danger)';
          c.style.transition='border-color .2s';
          setTimeout(()=>{ c.style.borderColor=orig; }, 1500);
        });
        return;
      }
      const n=document.getElementById('ob-cname')?.value.trim();
      this._ob.childName = n || 'Çocuğum';
    }
    this._ob.step++;
    this._renderOb();
  }

  _obFinish(){
    if(!this._ob.style){ this._toast('Bir stil seçin','err'); return; }

    // R6 — Kaygı ölçeği artık onboarding'de yok. Eğer kullanıcı dashboard'dan
    // ölçeği daha sonra doldurursa yanıtlar this._ob.anxiety'e gelir.
    // Bu adımda ölçek doldurulmamışsa değerlendirmeyi "yapılmadı" olarak işaretliyoruz.
    const hasAnxAnswers = Object.keys(this._ob.anxiety || {}).length >= this._anxQs.length;
    let anxietyProfile;
    if(hasAnxAnswers){
      const resp = this._anxQs.map(q=>({
        value: this._ob.anxiety[q.id]||3, rev:q.rev
      }));
      const norm = resp.map(r=>r.rev ? 6-r.value : r.value);
      const pct  = Math.round(norm.reduce((s,v)=>s+v,0) / (resp.length*5) * 100);
      const level = pct<35 ? AnxietyLevel.LOW : pct<65 ? AnxietyLevel.MEDIUM : AnxietyLevel.HIGH;
      anxietyProfile = { level, score:pct, assessedAt:new Date(), assessed:true };
    } else {
      anxietyProfile = { level: AnxietyLevel.MEDIUM, score: 50, assessedAt: null, assessed: false };
    }

    const cid = crypto.randomUUID();
    this._parent = {
      id: crypto.randomUUID(),
      name: this._ob.name, email: this._ob.email,
      onboardingComplete: true,
      children:[{ id:cid, name:this._ob.childName, ageGroup:this._ob.ageGroup, completedActivities:[], badges:[] }],
      anxietyProfile,
      parentingStyle: this._ob.style,
      resources: this._ob.resources||['basic','craft'],
      weeklyCheckIns:[], badges:[], teacherMessages:[], weeklyPlans:[],
    };
    this._childId = cid;
    this._storage.set('parent', this._parent);

    // Kullanıcıyı login sistemine de kaydet
    const existingUsers = this._eGetUsers();
    const username = (this._ob.name||'kullanici').toLowerCase()
      .replace(/\s+/g,'_')
      .replace(/[^a-z0-9_]/g,'')
      .substring(0,20) || 'kullanici';
    // Aynı username yoksa ekle
    if(!existingUsers.find(u=>u.username===username)){
      existingUsers.push({
        id: this._parent.id,
        name: this._parent.name,
        username: username,
        email: this._parent.email||'',
        pwdHash: '',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      });
      this._eSaveUsers(existingUsers);
    }

    this.show('dashboard');
    setTimeout(()=>this._toast(`Hoş geldin, ${this._parent.name}! 🎉`,'ok'), 400);

    // Berkowitz ve ark. (2015): "time to first value" tutmayı doğrudan etkiler.
    // Onboarding biter bitmez yaşa uygun bir başlangıç etkinliği öner.
    setTimeout(()=>{
      const p = this._parent; const c = this._getChild();
      if(!p || !c) return;
      const starter = this._recEngine.recommend(p, c, 1, null)[0];
      if(!starter) return;
      this._openModal(`
        <div style="text-align:center;padding:.5rem 0 .5rem">
          <div style="font-size:2.8rem;margin-bottom:.4rem">👋</div>
          <h3 style="margin-bottom:.25rem">İlk etkinliğini dene!</h3>
          <p class="muted" style="font-size:var(--t-md);margin-bottom:1.1rem;line-height:1.6">
            Araştırmalar haftada <strong>yalnızca bir kez</strong> bile yapılan kaliteli etkileşimin fark yarattığını gösteriyor.
            <span style="font-size:var(--t-xs);display:block;margin-top:.3rem;font-style:italic">Berkowitz ve ark., 2015 — Science dergisi</span>
          </p>
          <div class="card card-sm" style="text-align:left;margin-bottom:1rem;cursor:default">
            <div class="card-body">
              <div style="display:flex;gap:.8rem;align-items:center">
                <span style="font-size:2rem">${starter.emoji}</span>
                <div>
                  <strong style="font-size:var(--t-lg)">${starter.title}</strong>
                  <p class="muted" style="font-size:var(--t-sm);margin-top:.1rem">${starter.desc}</p>
                  <span class="chip chip-orange" style="font-size:var(--t-xs);margin-top:.35rem;display:inline-block">⏱ ${starter.dur} dk</span>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:.65rem">
            <button class="btn btn-soft btn-block" style="flex:.8" onclick="App._closeModal()">Sonra</button>
            <button class="btn btn-primary btn-block" style="flex:1.2" onclick="App._closeModal();App._openActivity('${starter.id}')">Şimdi Başla →</button>
          </div>
        </div>
      `);
    }, 1800);
  }

  /* ══════════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════════ */

  _renderDash(){
    const p=this._parent; if(!p) return;
    const c=this._getChild(); if(!c) return;
    // v4: aile rutin tetikleyicilerini kontrol et (sabah/öğle/akşam)
    try { this._checkRoutineTriggers(); } catch(e) { /* sessiz */ }
    const rec = this._recEngine.recommend(p, c, 3, this._adaptEng);
    const done = (c.completedActivities||[]).length;
    const anxLevel=p.anxietyProfile?.level;
    const anxScore=p.anxietyProfile?.score||0;
    const anxColor = anxLevel===AnxietyLevel.LOW?'var(--success)':anxLevel===AnxietyLevel.MEDIUM?'var(--amber)':'var(--danger)';
    const anxEmoji = anxLevel===AnxietyLevel.LOW?'😌':anxLevel===AnxietyLevel.MEDIUM?'🤔':'😰';
    const hour=new Date().getHours();
    const greet = hour<12?'Günaydın':hour<18?'İyi günler':'İyi akşamlar';
    const planCount = Object.keys(this._plannerSvc.getWeekPlan()).length;

    // R5 — Haftalık ritim (streak yerine)
    const rhythm = this._streakSvc.getWeeklyProgress();
    const todayDone = rhythm.todayDone;
    // Geri uyum — eski kartlarda kullanılabilir
    const streak = this._streakSvc.checkExpiry();

    // Kaygı trendi
    const anxTrend = this._anxTracker.getTrend();
    const trendLabel = anxTrend==='improving' ? '📉 İyileşiyor' : anxTrend==='worsening' ? '📈 Yükseliyor' : '➡️ Stabil';
    const trendColor = anxTrend==='improving' ? 'var(--success)' : anxTrend==='worsening' ? 'var(--danger)' : 'var(--muted)';

    document.getElementById('dash-body').innerHTML=`
      <!-- Greeting -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.1rem;padding-top:.25rem">
        <div>
          <p style="font-size:var(--t-xs);font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">${greet}</p>
          <h2 style="font-size:1.4375rem;font-weight:900;color:var(--text);margin:.15rem 0 0;line-height:1.15;letter-spacing:-.02em">${this._esc(p.name)}</h2>
          <p style="font-size:var(--t-sm);color:var(--muted);margin-top:.2rem;font-weight:600">${this._esc(c.name)} · ${this._AGLabels[c.ageGroup]}</p>
        </div>
        <button onclick="App.show('notifications')" style="width:38px;height:38px;border-radius:11px;background:var(--surface);border:0.5px solid var(--border);display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;cursor:pointer;-webkit-tap-highlight-color:transparent;font-size:1rem" ontouchstart="this.style.opacity='.6'" ontouchend="this.style.opacity=''">
          🔔<span id="notif-dot" class="nav-dot" style="display:none"></span>
        </button>
      </div>

      <!-- R5 — Haftalık ritim kartı (streak yerine, guilt-trip YOK) -->
      ${this._renderWeeklyRhythmCard(rhythm)}

      <!-- Hızlı erişim — yatay kaydırmalı -->
      <div style="display:flex;gap:.45rem;overflow-x:auto;padding-bottom:.2rem;margin-bottom:1rem;scrollbar-width:none;-webkit-overflow-scrolling:touch">
        ${[
          {icon:'🎲',label:'Etkinlik',view:'activities'},
          {icon:'⭐',label:'Beceri',view:'skill'},
          {icon:'📚',label:'Akademi',view:'learn'},
          {icon:'💬',label:'Sohbet',view:'mathtalk'},
          {icon:'📖',label:'Kitap',view:'books'},
          {icon:'📅',label:'Plan',view:'planner'},
          {icon:'🌿',label:'Nefes',view:'breathing'},
        ].map(q=>`<button onclick="App.show('${q.view}')" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.5rem .6rem;background:var(--surface);border:0.5px solid var(--border);border-radius:12px;cursor:pointer;min-width:54px;-webkit-tap-highlight-color:transparent" ontouchstart="this.style.opacity='.6';this.style.transform='scale(.92)'" ontouchend="this.style.opacity='';this.style.transform=''">
          <span style="font-size:1.35rem;line-height:1">${q.icon}</span>
          <span style="font-size:.58rem;font-weight:700;color:var(--muted);white-space:nowrap">${q.label}</span>
        </button>`).join('')}
      </div>

      <!-- Günün Problemi (R1 — Bedtime Math tarzı, 5 dk commitment) -->
      ${this._renderDailyProblemCard()}

      <!-- Haftanın Kazanımları (TYMM sınıf-bazlı hedef) -->
      ${this._renderWeeklyOutcomesCard()}

      <!-- En çok yaptıklarınız (yerel telemetry) -->
      ${this._renderPopularCard()}

      <!-- Şu an neredesiniz? — bağlam bazlı etkinlik seçici (DREME Family Math) -->
      ${this._renderContextPickerCard()}

      <!-- Bugün için öneriler -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem">
        <span style="font-size:var(--t-xs);font-weight:900;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Bugün için Öneriler</span>
        <button onclick="App.show('activities')" style="font-size:var(--t-xs);font-weight:700;color:var(--teal);background:none;border:none;cursor:pointer;padding:.2rem .4rem">Tümü →</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:.55rem;margin-bottom:1rem">
        ${rec.map(a=>this._actCard(a)).join('')}
      </div>

      <!-- Kaygı profili — kompakt / R6: Henüz değerlendirilmediyse CTA -->
      ${(p.anxietyProfile?.assessed===false)?`
      <div style="background:linear-gradient(135deg,rgba(124,61,159,.08),rgba(124,61,159,.03));border:1.5px solid rgba(124,61,159,.25);border-radius:var(--r-lg);padding:.95rem 1rem;margin-bottom:1rem;cursor:pointer" onclick="App._openAnxAssessment()">
        <div style="display:flex;align-items:center;gap:.7rem">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--purple-a);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">📊</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--t-sm);font-weight:800;color:var(--purple)">Kısa değerlendirme (2 dk)</div>
            <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.1rem;line-height:1.5">8 soruluk matematik tutumu ölçeği — etkinlik önerilerimiz size özel hale gelir.</p>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--hint)" stroke-width="2" style="flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>`:(anxLevel!==undefined)?`
      <div style="background:var(--surface);border-radius:var(--r-lg);padding:.875rem 1rem;border:0.5px solid var(--border);display:flex;align-items:center;gap:.8rem;margin-bottom:1rem;cursor:pointer" onclick="App.show('progress')">
        <div style="width:40px;height:40px;border-radius:50%;background:${anxColor};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;opacity:.9">${anxEmoji}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--t-sm);font-weight:800;color:var(--text)">Matematik Kaygısı: ${anxLevel===AnxietyLevel.LOW?'Düşük':anxLevel===AnxietyLevel.MEDIUM?'Orta':'Yüksek'}</div>
          <div style="background:var(--raised);border-radius:99px;height:3px;margin-top:.35rem;overflow:hidden">
            <div style="height:100%;width:${anxScore}%;background:${anxColor};border-radius:99px"></div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--hint)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`:''}

      <!-- Berkowitz — sadece ilk açılışta -->
      ${streak.count===0?`
      <div style="background:rgba(13,148,136,.06);border-radius:var(--r-md);padding:.8rem .9rem;border:0.5px solid rgba(13,148,136,.15);display:flex;gap:.6rem;align-items:flex-start;margin-bottom:1rem">
        <span style="font-size:1rem;flex-shrink:0">📊</span>
        <div>
          <p style="font-size:var(--t-sm);font-weight:700;color:var(--teal)">Haftada bir kez bile yeter.</p>
          <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.15rem;line-height:1.55"><em>Berkowitz ve ark., 2015 — Science</em></p>
        </div>
      </div>`:''}

      <!-- Diskalkuli Derneği işbirliği banner'ı -->
      <div onclick="App.show('about')" role="button" tabindex="0"
        style="background:linear-gradient(135deg,rgba(46,125,50,.08),rgba(46,125,50,.03));border:1.5px solid rgba(46,125,50,.22);border-radius:var(--r-lg);padding:.85rem 1rem;margin-bottom:1rem;cursor:pointer;display:flex;align-items:center;gap:.75rem;-webkit-tap-highlight-color:transparent;transition:var(--t)"
        onmouseover="this.style.borderColor='var(--teal-l)'"
        onmouseout="this.style.borderColor='rgba(46,125,50,.22)'"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.show('about')}">
        <img src="./icons/dernek-logo.png" alt="" aria-hidden="true" style="width:42px;height:42px;border-radius:50%;background:#fff;padding:2px;flex-shrink:0;border:1px solid var(--border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--t-sm);font-weight:800;color:var(--teal-d)">Diskalkuli Derneği iş birliğiyle 💚</div>
          <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.1rem;line-height:1.5">"Herkes Matematik Öğrenebilir" · Hakkında & iletişim →</p>
        </div>
        <span style="color:var(--muted);flex-shrink:0;font-size:1.2rem">›</span>
      </div>
    `  }

  /* ══════════════════════════════════════════════
     BAĞLAM SEÇİCİ (DREME Family Math — "Nerede bulduğunuz?"
     modeli). Dashboard'da "Şu an neredesiniz?" kartı.
  ══════════════════════════════════════════════ */

  _renderContextPickerCard(){
    const c = this._getChild();
    if(!c) return '';
    const contexts = [
      { k:'kitchen', icon:'🍳', label:'Mutfakta' },
      { k:'indoor',  icon:'🏠', label:'Ev İçi' },
      { k:'outdoor', icon:'🌳', label:'Dışarı' },
      { k:'commute', icon:'🚗', label:'Yolda' },
      { k:'bedtime', icon:'🌙', label:'Uyku Öncesi' },
      { k:'game',    icon:'🎲', label:'Oyun Zamanı' },
    ];
    // Kaç aktivite var her bağlamda (yaş grubuna göre filtrelenmiş)
    const byCtx = {};
    this._repo.byAgeGroup(c.ageGroup).forEach(a => {
      (a.context || []).forEach(ctx => {
        byCtx[ctx] = (byCtx[ctx] || 0) + 1;
      });
    });
    return `
      <div style="margin-bottom:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
          <span style="font-size:var(--t-xs);font-weight:900;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">Şu an neredesiniz?</span>
          <span style="font-size:.6rem;color:var(--hint)">bağlama göre etkinlik bul</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem">
          ${contexts.map(ctx => `
            <button onclick="App._selectContext('${ctx.k}')"
              style="display:flex;flex-direction:column;align-items:center;gap:.2rem;
                padding:.65rem .3rem;background:var(--surface);border:1px solid var(--border);
                border-radius:var(--r-md);cursor:pointer;
                -webkit-tap-highlight-color:transparent;transition:all var(--dur-fast)"
              ontouchstart="this.style.transform='scale(.96)';this.style.background='var(--raised)'"
              ontouchend="this.style.transform='';this.style.background='var(--surface)'">
              <span style="font-size:1.35rem;line-height:1">${ctx.icon}</span>
              <span style="font-size:.62rem;font-weight:800;color:var(--text2);line-height:1.2">${ctx.label}</span>
              <span style="font-size:.55rem;color:var(--hint);font-weight:700">${byCtx[ctx.k] || 0} etkinlik</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  _selectContext(ctx){
    // Activities sayfasına git, context filtresi ile
    this._filter.context = ctx;
    this._filter.category = null;
    this._filter.anxOnly = false;
    this._filter.spatialOnly = false;
    this.show('activities');
  }

  /* ══════════════════════════════════════════════
     HAFTANIN KAZANIMLARI (Dashboard sınıf-bazlı hedef)
     Çocuğun sınıfına göre her hafta deterministik olarak
     3 TYMM kazanımı seçer ve her biri için en uygun
     etkinliği önerir.
  ══════════════════════════════════════════════ */

  _getWeeklyOutcomesForChild(){
    const c = this._getChild();
    if(!c) return null;
    const gradeMap = { [AgeGroup.G1]:1, [AgeGroup.G2]:2, [AgeGroup.G3]:3, [AgeGroup.G4]:4 };
    const grade = gradeMap[c.ageGroup];
    if(!grade) return null; // Okul öncesi için bu akış yok

    const gradeOutcomes = getOutcomesByGrade(grade);
    if(!gradeOutcomes.length) return null;

    // Hafta indeksi (ISO hafta yaklaşımı — Unix haftası)
    const weekIdx = Math.floor(Date.now() / (7 * 86400000));
    // 3 kazanım seçiyoruz — determinstik ama hafta değiştikçe değişiyor
    const selected = [];
    for(let i = 0; i < 3; i++){
      const idx = (weekIdx * 3 + i) % gradeOutcomes.length;
      selected.push(gradeOutcomes[idx]);
    }

    // Her kazanım için o kazanımı kapsayan en kısa süreli (kolay) etkinliği bul
    const allActs = this._repo.byAgeGroup(c.ageGroup);
    const results = selected.map(o => {
      const candidates = allActs.filter(a => (a.tymm_outcomes||[]).includes(o.code));
      if(!candidates.length) return { outcome: o, activity: null };
      // En kısa süreli olan, zorluk kolay tercihi
      candidates.sort((a,b) => {
        const ap = (a.difficulty==='easy'?0:a.difficulty==='medium'?1:2);
        const bp = (b.difficulty==='easy'?0:b.difficulty==='medium'?1:2);
        if(ap !== bp) return ap - bp;
        return (a.dur||0) - (b.dur||0);
      });
      return { outcome: o, activity: candidates[0] };
    });
    return { grade, results };
  }

  _renderWeeklyOutcomesCard(){
    const data = this._getWeeklyOutcomesForChild();
    if(!data) return '';  // Okul öncesi için gösterme
    const { grade, results } = data;
    const doneSet = new Set(this._getChild()?.completedActivities || []);

    return `
      <div style="margin-bottom:1rem;background:linear-gradient(135deg,rgba(17,138,178,.08),rgba(17,138,178,.02));border:1px solid rgba(17,138,178,.2);border-radius:var(--r-lg);padding:.9rem 1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem">
          <div style="display:flex;align-items:center;gap:.4rem">
            <span style="font-size:1rem">🎯</span>
            <span style="font-size:var(--t-xs);font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:var(--blue)">Bu Haftanın ${grade}. Sınıf Kazanımları</span>
          </div>
          <button onclick="App.show('tymm')" style="font-size:.6rem;font-weight:700;color:var(--blue);background:none;border:none;cursor:pointer;padding:.2rem .4rem">Tümü →</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          ${results.map(r => {
            const o = r.outcome;
            const a = r.activity;
            const isDone = a && doneSet.has(a.id);
            return `
              <div style="background:var(--surface);border-radius:var(--r-md);padding:.55rem .7rem;border:1px solid rgba(17,138,178,.15)${isDone?';opacity:.72':''}">
                <div style="display:flex;align-items:flex-start;gap:.4rem;margin-bottom:.3rem">
                  <span style="background:var(--blue);color:#fff;font-size:.55rem;font-weight:800;padding:.12rem .35rem;border-radius:3px;flex-shrink:0;margin-top:.1rem">${o.code}</span>
                  <p style="font-size:.68rem;font-weight:700;line-height:1.4;flex:1;color:var(--text2)">${o.title}</p>
                </div>
                ${a ? `
                  <div onclick="App._openActivity('${a.id}')" style="display:flex;align-items:center;gap:.5rem;padding:.4rem .55rem;background:var(--raised);border-radius:var(--r-sm);cursor:pointer;margin-top:.3rem">
                    <span style="font-size:1.1rem;line-height:1">${a.emoji}</span>
                    <span style="flex:1;font-size:var(--t-xs);font-weight:700">${a.title}</span>
                    ${isDone ? '<span style="color:var(--success);font-size:.8rem">✓</span>' : '<span style="color:var(--muted);font-size:.7rem">›</span>'}
                  </div>
                ` : `<p style="font-size:.6rem;color:var(--hint);font-style:italic">Uygun etkinlik yok</p>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     R1 — GÜNÜN PROBLEMİ (Bedtime Math tarzı)
     Her gün sabit, determinstik seçilmiş 1 etkinlik.
     Kanıt: Schaeffer et al. 2018, d=0.82 (kaygılı ebeveynlerin çocuklarında)
  ══════════════════════════════════════════════ */

  // Bugün için seçilen etkinliği deterministik olarak döndürür.
  // Aynı ebeveyn aynı günde hep aynı etkinliği görür.
  _getDailyProblem(){
    const c = this._getChild(); if(!c) return null;
    const pool = this._repo.byAgeGroup(c.ageGroup);
    if(!pool.length) return null;
    // Günün indeksi: Unix-epoch gün sayısı mod havuz uzunluğu
    const dayIndex = Math.floor(Date.now() / 86400000);
    return pool[dayIndex % pool.length];
  }

  _renderDailyProblemCard(){
    const a = this._getDailyProblem();
    if(!a) return '';
    const c = this._getChild();
    const isDone = (c?.completedActivities||[]).includes(a.id);
    // 3 yaş seviyesi — Bedtime Math Wee/Little/Big modeli
    // Adımlardan ilk 3'ünü farklı zorluk olarak sun
    const levels = [
      { emoji:'🐣', label:'Küçük', step: a.steps[0] || '' },
      { emoji:'🧒', label:'Orta',  step: a.steps[Math.min(1, a.steps.length-1)] || '' },
      { emoji:'👦', label:'Büyük', step: a.steps[a.steps.length-1] || '' },
    ];
    return `
      <div style="background:linear-gradient(135deg,#FFF7ED 0%,#FEF3E7 100%);border:1.5px solid rgba(244,98,42,.25);border-radius:var(--r-xl);padding:1rem 1.05rem;margin-bottom:1rem;box-shadow:0 2px 8px rgba(244,98,42,.08);cursor:pointer" onclick="App._openActivity('${a.id}')">
        <div style="display:flex;align-items:center;gap:.45rem;margin-bottom:.55rem">
          <span style="font-size:.65rem;font-weight:900;color:var(--orange-d);text-transform:uppercase;letter-spacing:.1em;background:rgba(244,98,42,.15);padding:.15rem .45rem;border-radius:99px">⭐ Günün Problemi</span>
          <span style="font-size:.58rem;font-weight:700;color:var(--muted);margin-left:auto">≈5 dk</span>
        </div>
        <div style="display:flex;align-items:center;gap:.7rem;margin-bottom:.6rem">
          <span style="font-size:2.2rem;line-height:1;flex-shrink:0">${a.emoji}</span>
          <div style="flex:1;min-width:0">
            <strong style="font-size:var(--t-lg);color:var(--text);display:block;line-height:1.2">${a.title}</strong>
            <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.15rem;line-height:1.4">${a.desc}</p>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.35rem;margin-bottom:.65rem">
          ${levels.map(l=>`
            <div style="display:flex;align-items:flex-start;gap:.55rem;font-size:var(--t-xs);color:var(--text2);line-height:1.45">
              <span style="font-size:.95rem;flex-shrink:0;line-height:1.3">${l.emoji}</span>
              <span style="flex:1"><strong style="color:var(--orange-d)">${l.label}:</strong> ${l.step}</span>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-sm" style="width:100%;background:${isDone?'var(--teal-a)':'var(--orange)'};color:${isDone?'var(--teal-d)':'#fff'};border:none;font-weight:800" onclick="event.stopPropagation();App._openActivity('${a.id}')">
          ${isDone ? '✓ Bugün tamamlandı — yine de aç' : 'Bugün bunu dene →'}
        </button>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     R6 — Kaygı değerlendirmesi (ertelenmiş, onboarding sonrası)
     Kullanıcıya bir modal üzerinden 8 maddeli ölçek sunar; sonucu
     parent.anxietyProfile'a işler.
  ══════════════════════════════════════════════ */

  _openAnxAssessment(){
    // Modal içi yerel durum — ob state'ini kirletme
    this._anxModalState = {};
    const qs = this._anxQs;
    const body = `
      <div style="padding:.2rem 0 .2rem">
        <h3 style="margin-bottom:.4rem">📊 Matematik ile Aranız</h3>
        <p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem;line-height:1.55">Her ifadeyi şu anki durumunuza göre değerlendirin. Doğru ya da yanlış yanıt yoktur. Bu ölçek, etkinlik önerilerinizi kişiselleştirmek için kullanılır.</p>
        <p style="font-size:var(--t-xs);color:var(--muted);background:var(--raised);border-radius:var(--r-sm);padding:.5rem .75rem;margin-bottom:1rem;line-height:1.55">📚 <em>MARS-R (Plake & Parker, 1982) · sMARS (Alexander & Martray, 1989) · Maloney ve ark. (2015)</em></p>
        <div style="display:flex;flex-direction:column;gap:.9rem" id="anx-modal-qs">
          ${qs.map((q,i)=>`
            <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);padding:.85rem">
              <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.55rem">${i+1}. ${q.text}</p>
              <div class="likert" id="anx-m-${q.id}">
                ${[1,2,3,4,5].map(v=>`<button class="likert-btn" onclick="App._anxModalSel('${q.id}',${v})">${v}</button>`).join('')}
              </div>
              <div style="display:flex;justify-content:space-between;font-size:var(--t-xs);color:var(--muted);margin-top:.3rem"><span>Hiç katılmıyorum</span><span>Tamamen katılıyorum</span></div>
            </div>`).join('')}
        </div>
      </div>
    `;
    const footer = `
      <div class="modal-footer-row">
        <button class="btn btn-ghost" onclick="App._closeModal()">Sonra</button>
        <button class="btn btn-primary" onclick="App._submitAnxAssessment()">Değerlendir</button>
      </div>
    `;
    this._openModal(body, footer);
  }

  _anxModalSel(qid, val){
    if(!this._anxModalState) this._anxModalState = {};
    this._anxModalState[qid] = val;
    const group = document.getElementById(`anx-m-${qid}`);
    if(group){
      group.querySelectorAll('.likert-btn').forEach(b => {
        b.classList.toggle('sel', parseInt(b.textContent,10) === val);
      });
    }
  }

  _submitAnxAssessment(){
    const state = this._anxModalState || {};
    if(Object.keys(state).length < this._anxQs.length){
      this._toast('Lütfen tüm soruları yanıtlayın','err');
      return;
    }
    const resp = this._anxQs.map(q=>({ value: state[q.id]||3, rev:q.rev }));
    const norm = resp.map(r=>r.rev ? 6-r.value : r.value);
    const pct  = Math.round(norm.reduce((s,v)=>s+v,0) / (resp.length*5) * 100);
    const level = pct<35 ? AnxietyLevel.LOW : pct<65 ? AnxietyLevel.MEDIUM : AnxietyLevel.HIGH;

    // Kaygı trendini kaydet
    this._anxTracker.record(pct, level);

    this._parent = {
      ...this._parent,
      anxietyProfile: { level, score:pct, assessedAt:new Date(), assessed:true },
    };
    this._storage.set('parent', this._parent);
    this._closeModal();

    const levelText = level===AnxietyLevel.LOW?'Düşük':level===AnxietyLevel.MEDIUM?'Orta':'Yüksek';
    this._toast(`Teşekkürler! Kaygı düzeyiniz: ${levelText}`, 'ok');
    if(this._activeView==='dashboard') this._renderDash();
  }

  /* ══════════════════════════════════════════════
     R5 — Haftalık ritim kartı (streak değil)
     Kaygılı ebeveyn kitlesinde Duolingo-tarzı guilt-trip kontra-prodüktif.
     "Bu hafta X / Y etkinlik" normalize edici çerçeveleme.
  ══════════════════════════════════════════════ */

  _renderWeeklyRhythmCard(rhythm){
    const { thisWeekCount, goal, todayDone, completedWeeks, bestWeek } = rhythm;
    const pct = Math.min(100, Math.round((thisWeekCount / goal) * 100));
    const isGoalMet = thisWeekCount >= goal;

    // Hafta günleri — bugünün konumu vurgulu
    const todayIdx = (new Date().getDay() + 6) % 7; // Pzt=0
    const days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

    const headline = isGoalMet
      ? `Bu hafta hedefi aştınız 🎉`
      : `Bu hafta ${thisWeekCount}/${goal} etkinlik`;

    const sub = isGoalMet
      ? (bestWeek > thisWeekCount ? `En iyi haftanız ${bestWeek} etkinlikti.` : 'Bu haftaki rekorunuz!')
      : (todayDone
          ? 'Bugünü tamamladınız — hafta sonuna kadar zamanınız var.'
          : 'Haftanızı tamamlamak için ufak bir an yeter.');

    return `
      <div style="background:${isGoalMet?'linear-gradient(135deg,var(--teal),var(--teal-d))':'var(--surface)'};color:${isGoalMet?'#fff':'var(--text)'};border-radius:var(--r-xl);padding:1rem 1.1rem;margin-bottom:1rem;border:${isGoalMet?'none':'0.5px solid var(--border)'};box-shadow:${isGoalMet?'var(--sh-btn)':'var(--sh-xs)'}">
        <div style="display:flex;align-items:center;gap:.55rem;margin-bottom:.55rem">
          <span style="font-size:1.3rem;line-height:1;flex-shrink:0">${isGoalMet?'🌟':'📅'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--t-md);font-weight:800;line-height:1.2">${headline}</div>
            <p style="font-size:var(--t-xs);opacity:${isGoalMet?.9:.75};margin-top:.1rem;color:${isGoalMet?'rgba(255,255,255,.9)':'var(--muted)'}">${sub}</p>
          </div>
          ${!isGoalMet
            ? `<button class="btn btn-sm" style="background:var(--teal);color:#fff;border:none;flex-shrink:0" onclick="App.show('activities')">Başla</button>`
            : `<span style="font-size:1.2rem">✅</span>`
          }
        </div>
        <!-- Hafta şeridi — 7 gün -->
        <div style="display:flex;gap:.25rem;margin-top:.3rem">
          ${days.map((d,i)=>{
            const isToday = i === todayIdx;
            const isPast  = i < todayIdx;
            const bg = isGoalMet
              ? (i<=todayIdx?'rgba(255,255,255,.85)':'rgba(255,255,255,.25)')
              : (isPast?'var(--raised)':isToday?'var(--teal)':'var(--border)');
            const fg = isGoalMet ? (i<=todayIdx?'var(--teal-d)':'rgba(255,255,255,.7)')
                                 : (isToday?'#fff':'var(--muted)');
            return `<div style="flex:1;text-align:center;padding:.3rem .1rem;background:${bg};color:${fg};border-radius:6px;font-size:.58rem;font-weight:800">${d}</div>`;
          }).join('')}
        </div>
        ${completedWeeks >= 1 && !isGoalMet ? `
          <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.55rem;line-height:1.5">✓ Şimdiye kadar <strong>${completedWeeks}</strong> haftayı tamamladınız — ortalama ailenin üstündesiniz.</p>
        ` : ''}
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     R2 — FACT / TIP / GROWTH şablonu
     Ready4K formatı: Neden? (FACT) + Nasıl? (TIP, zaten var) + Ne değişti? (GROWTH)
     Kanıt: York, Loeb, Doss 2014 — SMS kanıtı
  ══════════════════════════════════════════════ */

  // Kategoriye göre "Neden işe yarar?" mesajı (brain science — Vroom tarzı)
  _factFor(a){
    const facts = {
      [Category.NUMBER]:
        'Bu etkinlik çocuğun <strong>sayı hissini</strong> (number sense) destekler — sayıyı bir isim olarak değil miktar olarak kavraması. Erken sayı hissi, ilkokul matematiği için en güçlü yordayıcıdır (Jordan et al., 2009).',
      [Category.PATTERNS]:
        'Örüntü fark etme, <strong>cebirsel düşünmenin</strong> temelidir. Çocuk "sıradaki ne?" sorusunu yanıtlamayı öğrenirken beyni ileride değişken, fonksiyon ve denklemi kavrayacak nöral yolları kuruyor.',
      [Category.GEOMETRY]:
        'Şekil ve uzay farkındalığı, <strong>uzamsal akıl yürütmeyi</strong> güçlendirir — bu, STEM başarısının gizli anahtarıdır. 5 yaşındaki uzamsal beceri, 6 yaşındaki sayı doğrusu başarısını öngörüyor (Gunderson et al., 2012).',
      [Category.MEASUREMENT]:
        'Ölçme, <strong>sayı ile gerçek dünyayı bağlayan köprüdür</strong>. Standart olmayan birimlerle başlamak (karış, adım), çocuğun ölçme kavramını sezgisel olarak kavramasını sağlar (Freudenthal, 1991).',
      [Category.PROBLEM]:
        'Problem kurma becerisi, problem çözme becerisinden <strong>daha üst düzey bir matematiksel düşünmedir</strong>. Kendi sorularını üreten çocuklar, daha karmaşık problemleri çözmeye daha hazır olur (Silver, 1994).',
      [Category.DAILY]:
        'Günlük hayatta matematik, çocuğun "matematik = okul işi" ayrımını ortadan kaldırır. Bağlamlı öğrenme, transfer için en güçlü mekanizmadır (Lave, 1988).',
      [Category.SPATIAL]:
        'Uzamsal eğitim, matematik performansına <strong>anlamlı transfer</strong> üretir: Hawes ve ark. (2022) meta-analizi 29 çalışmada ortalama etki g=0.28. Fiziksel materyaller dijital olanlardan daha güçlü.',
      [Category.KITCHEN]:
        'Mutfak, <strong>kesir, oran ve ölçme kavramlarının doğal laboratuvarıdır</strong>. "Yarım bardak un" somut olarak deneyimlenir — soyut sembolden çok daha güçlüdür.',
      [Category.MARKET]:
        'Gerçek para ve gerçek fiyatlar, çocuğun matematik motivasyonu için en güçlü bağlamdır. Bedtime Math RCT: kaygılı ebeveynlerin çocuklarında d=0.82 etki (Schaeffer et al., 2018).',
      [Category.TIME]:
        'Zaman kavramı, <strong>sayı doğrusu sezgisini</strong> besler. "Kaç gün kaldı?" sorusu, çıkarma işleminin en doğal halidir ve motivasyon otomatiktir.',
      [Category.GAME]:
        'Oyun sırasında öğrenme, <strong>içsel motivasyonu korur</strong>. Kamii (1985): rekabet değil, "ne fark ettin?" sorusu çocuğun matematiksel düşünmesini derinleştirir.',
      [Category.NATURE]:
        'Doğada sayma, sınıflama ve örüntü arama, <strong>bedenlenmiş öğrenmenin</strong> (embodied learning) en saf halidir. Çocuk yalnızca zihniyle değil duyularıyla öğrenir.',
    };
    return facts[a.category] ||
      'Bu etkinlik çocuğun matematik becerilerini gerçek bir bağlamda destekler — ezberden çok daha güçlü bir öğrenme biçimidir.';
  }

  // Tamamlamadan sonra "Ne değişti?" mesajı
  _growthFor(a){
    const growths = {
      [Category.NUMBER]:
        'Çocuğunuz bugün sayıları sadece isim olarak değil, <strong>miktar</strong> olarak deneyimledi. Bu deneyim birikir — 3 hafta sonra yeniden deneyin, fark edilir ilerlemeyi göreceksiniz.',
      [Category.PATTERNS]:
        'Örüntü fark etme kası bugün çalıştı. Birkaç haftaya, çocuğunuz sizin fark etmediğiniz örüntüleri size gösterecek — bu algebraic düşünmenin ilk işaretidir.',
      [Category.GEOMETRY]:
        'Uzamsal dil ("kenar", "köşe", "yüz") bugün çocuğunuzun aktif kelime dağarcığına eklendi. Bir hafta sonra sokakta bir şekil görünce adlandıracaktır.',
      [Category.MEASUREMENT]:
        'Bugün çocuğunuz tahmin etti ve ölçtü — bu iki adım, bilimsel düşünmenin temelidir. Bir dahaki sefere tahminleri daha yakın olacak.',
      [Category.PROBLEM]:
        'Çocuğunuz bugün kendi sorusunu kurdu — bu, matematik öz-yeterliği için büyük bir adımdır. Soruyu kuran, çözebileceğine de inanır.',
      [Category.DAILY]:
        'Bugünkü etkinlik, çocuğunuza "matematik her yerde" mesajını verdi. Bu mesaj, okul matematiğine karşı direnci anlamlı biçimde azaltır.',
      [Category.SPATIAL]:
        'Uzamsal düşünme — matematik başarısının en güçlü öngörücülerinden biri — bugün çalıştı. Haftada 2-3 uzamsal etkinlik, ilkokul aritmetiğini bile destekliyor.',
      [Category.KITCHEN]:
        'Mutfakta geçirilen 15 dakika, test kitabındaki 30 dakikadan daha etkilidir. Kesir ve ölçü kavramı bugün duyularla pekişti.',
      [Category.MARKET]:
        'Gerçek para ile deneyim, soyut sayılardan çok daha güçlü. Çocuğunuz bugün "fiyat" kavramıyla aktif olarak çalıştı.',
      [Category.TIME]:
        'Zaman kavramı bugün somutlaştı. Bu deneyim, ileride takvim, saat ve süre hesaplarını çok daha kolay kılacak.',
      [Category.GAME]:
        'Oyun sırasında matematik yapmak, çocuğun matematik tutumunu olumlu yönde etkiler — ki bu, başarıdan daha uzun vadede önemli bir çıktıdır.',
      [Category.NATURE]:
        'Doğada yapılan matematik, hafızada daha uzun kalır. Bedenlenmiş öğrenme teorisi bunu açıklıyor.',
    };
    return growths[a.category] ||
      'Çocuğunuz bugün matematikle keyifli bir etkileşim yaşadı — bu tekrar ettikçe matematik tutumu olumluya döner.';
  }

  /* ══════════════════════════════════════════════
     R3 — Soru taksonomisi: "Nasıl soracağım?"
     Her etkinlik için 3 soru: açık uçlu + kapalı uçlu + yansıtıcı
     Kanıt: DREME 2021 — açık uçlu sorular daha uzun sayı konuşmaları tetikler
  ══════════════════════════════════════════════ */

  // Son adım tipik olarak yansıtıcı sorudur — onu kullan; değilse kategoriye göre üret
  _renderQuestionPrompts(a){
    // Mevcut etkinlik adımlarından yansıtıcı soruyu çek (sonuncu adım genelde öyle)
    const lastStep = a.steps[a.steps.length - 1] || '';
    const isReflective = /\?/.test(lastStep);
    const reflective = isReflective ? lastStep : this._defaultReflectiveQ(a);

    // Kategoriye göre örnek açık & kapalı sorular
    const prompts = this._questionPromptsFor(a);

    return `
      <div style="background:rgba(124,61,159,.06);border:1px solid rgba(124,61,159,.2);border-radius:var(--r-md);padding:.85rem 1rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.55rem">
          <span style="font-size:.95rem">💬</span>
          <strong style="font-size:var(--t-sm);color:var(--purple);text-transform:uppercase;letter-spacing:.05em">Nasıl soracağım?</strong>
        </div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          <div style="display:flex;gap:.55rem;align-items:flex-start">
            <span style="font-size:.6rem;font-weight:900;background:var(--teal);color:#fff;padding:.15rem .4rem;border-radius:3px;flex-shrink:0;margin-top:.12rem">AÇIK</span>
            <p style="font-size:var(--t-sm);line-height:1.5;flex:1">${prompts.open}</p>
          </div>
          <div style="display:flex;gap:.55rem;align-items:flex-start">
            <span style="font-size:.6rem;font-weight:900;background:var(--blue);color:#fff;padding:.15rem .4rem;border-radius:3px;flex-shrink:0;margin-top:.12rem">KAPALI</span>
            <p style="font-size:var(--t-sm);line-height:1.5;flex:1">${prompts.closed}</p>
          </div>
          <div style="display:flex;gap:.55rem;align-items:flex-start">
            <span style="font-size:.6rem;font-weight:900;background:var(--purple);color:#fff;padding:.15rem .4rem;border-radius:3px;flex-shrink:0;margin-top:.12rem">YANSITICI</span>
            <p style="font-size:var(--t-sm);line-height:1.5;flex:1">${reflective}</p>
          </div>
        </div>
        <div style="margin-top:.65rem;padding-top:.55rem;border-top:1px dashed rgba(124,61,159,.2);font-size:var(--t-xs);color:var(--muted);line-height:1.5">
          <strong style="color:var(--purple)">3W:</strong> Sor (<em>Wonder</em>) → 3 saniye bekle (<em>Wait</em>) → genişlet (<em>Widen</em>). Cevabı siz vermeyin.
        </div>
      </div>
    `;
  }

  // Kategoriye göre jenerik açık/kapalı soru şablonları
  _questionPromptsFor(a){
    const generic = {
      [Category.NUMBER]:     { open:'Nasıl saydın? Başka hangi yolla sayabilirsin?',       closed:'Kaç tane var?' },
      [Category.PATTERNS]:   { open:'Bu örüntüde ne fark ettin?',                           closed:'Sıradaki ne olur?' },
      [Category.GEOMETRY]:   { open:'Bu şekil sana neyi hatırlatıyor?',                     closed:'Kaç kenarı var?' },
      [Category.MEASUREMENT]:{ open:'Başka ne ile ölçebilirdik? Neden farklı çıkar?',       closed:'Hangisi daha uzun?' },
      [Category.PROBLEM]:    { open:'Sence en iyi yol hangisi? Başka nasıl çözebiliriz?',   closed:'Cevap kaç?' },
      [Category.DAILY]:      { open:'Bunu evde nerede daha görüyorsun?',                    closed:'Kaç tane / ne kadar?' },
      [Category.SPATIAL]:    { open:'Tersine döndürsek nasıl görünür?',                      closed:'Hangisi sağda?' },
      [Category.KITCHEN]:    { open:'Eğer 2 kat daha yapsak, neler değişir?',                closed:'Kaç kaşık gerekiyor?' },
      [Category.MARKET]:     { open:'Bu fiyat sana pahalı mı ucuz mu? Neden?',               closed:'Toplam ne kadar?' },
      [Category.TIME]:       { open:'Bekleme hissi nasıl — uzun mu kısa mı geldi?',          closed:'Kaç dakika sürdü?' },
      [Category.GAME]:       { open:'Bu oyunda ne keşfettin?',                                closed:'Kim kaç puan aldı?' },
      [Category.NATURE]:     { open:'Bunu daha önce başka yerde gördün mü?',                 closed:'Kaç tane saydın?' },
    };
    return generic[a.category] || { open:'Nasıl buldun?', closed:'Kaç tane?' };
  }

  _defaultReflectiveQ(a){
    return 'Bir dahaki sefere farklı ne deneyebiliriz?';
  }

  /* ══════════════════════════════════════════════
     R4 — Yaş-bazlı diskalkuli kontrol listesi
     Mutlu (2017) "multiple filter" modelinin ebeveyn versiyonu.
     Kanıt: Mutlu & Akgün, dyscalculia screening model
  ══════════════════════════════════════════════ */

  _renderDyscChecklist(){
    const c = this._getChild();
    const ag = c?.ageGroup || AgeGroup.G1;

    // Yaş grubuna göre kırmızı bayraklar
    const byAge = {
      [AgeGroup.PRESCHOOL]: [
        '1–5 arasındaki sayıları sırayla söylemekte tutarsız',
        '3 nesneyi görünce saymadan "3" diyemiyor (subitizing yok)',
        '"Hangisi daha çok?" sorusuna sık yanlış cevap veriyor',
        'Parmaklarını saymada hiç kullanmıyor veya tersini sayıyor',
        'Sayı şarkılarını ezberliyor ama saymaya bağlamıyor',
        'Aynı yaştaki çocuklara göre belirgin biçimde geride',
      ],
      [AgeGroup.G1]: [
        '1–20 arasındaki sayıları sık sık karıştırıyor (12/21, 13/31)',
        'Parmak saymayı başka çocuklara göre fazla sürdürüyor',
        '"3+2" gibi tek haneli toplamayı ezberleyemiyor, her seferinde sayıyor',
        'Sayı büyüklüğü hakkında (hangi daha fazla) sık hata yapıyor',
        'Rakamları aynada yansımış gibi yazıyor (6↔9, 2↔5)',
        'Matematik deyince belirgin biçimde kaçınıyor ya da ağlıyor',
      ],
      [AgeGroup.G2]: [
        'Basamak değerini (onlar/birler) kavramakta zorlanıyor',
        'Ezberleyemeyen tek çocuk olduğu hissi — toplama olgularını her seferinde parmakla sayıyor',
        'Sözlü problem çözebiliyor ama aynı problemi yazılı göremiyor',
        'Sayı doğrusunda sayıların yerini bulamıyor',
        '"Kaç tane kaldı?" (çıkarma) sorusunu çok zor algılıyor',
        'Saat ve takvim kavramları yaşına göre çok geride',
      ],
      [AgeGroup.G3]: [
        'Çarpım tablosunu 2\'nin katları ötesinde öğrenemiyor',
        'Uzun bölmede adımları takip edemiyor',
        'Problem çözmede "ne sorulduğunu" ayırt edemiyor',
        'Para, zaman, ölçü birimleri arasında dönüşüm yapamıyor',
        'Aynı yaştaki okul arkadaşlarının gerisinde en az 1 yıl',
        'Matematik ödevi karşısında belirgin kaygı (ağlama, kaçınma)',
      ],
      [AgeGroup.G4]: [
        'Basit kesirleri (1/2, 1/4) kavramakta çok zorlanıyor',
        'Dört işlem becerilerinde akıcılık eksik, sürekli yavaş',
        'Sözel problemlerde "hangi işlem?" kararını veremiyor',
        'Ondalık gösterim ve virgül kavramı yok',
        'Zaman ve süre hesaplarında ciddi güçlük',
        'Matematik dersinden kaçınma davranışı artıyor',
      ],
    };
    const items = byAge[ag] || byAge[AgeGroup.G1];
    const ageLabel = this._AGLabels[ag] || 'Çocuğunuz';

    return `
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">📋 Yaş-Bazlı Kontrol Listesi</span></div>
        <p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem;line-height:1.6">
          <strong>${ageLabel}</strong> için gözlem maddeleri. Son 2 ayda düzenli olarak gözlemlediklerinizi işaretleyin.
        </p>
        <div style="display:flex;flex-direction:column;gap:.45rem;margin-bottom:.85rem">
          ${items.map((t,i)=>`
            <label style="display:flex;align-items:flex-start;gap:.65rem;padding:.6rem .85rem;border:1px solid var(--border);border-radius:var(--r-sm);cursor:pointer;background:var(--surface)">
              <input type="checkbox" id="dysc-chk-${i}" style="width:16px;height:16px;accent-color:var(--danger);flex-shrink:0;margin-top:.15rem" onchange="App._updateDyscChecklistCount()">
              <span style="font-size:var(--t-sm);line-height:1.5;color:var(--text2)">${t}</span>
            </label>
          `).join('')}
        </div>
        <div id="dysc-chk-result" style="display:none;padding:.75rem .9rem;border-radius:var(--r-md);font-size:var(--t-sm);line-height:1.55"></div>
      </div>
    `;
  }

  // Kontrol listesi değiştiğinde aşağıdaki sonuç kartını günceller
  _updateDyscChecklistCount(){
    const total = 6;
    let checked = 0;
    for(let i=0; i<total; i++){
      const cb = document.getElementById(`dysc-chk-${i}`);
      if(cb && cb.checked) checked++;
    }
    const el = document.getElementById('dysc-chk-result');
    if(!el) return;
    if(checked === 0){
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    if(checked <= 1){
      el.style.background = 'rgba(22,163,74,.08)';
      el.style.border = '1px solid rgba(22,163,74,.25)';
      el.innerHTML = `<strong style="color:var(--success)">🟢 1 işaret:</strong> Tek başına anlamlı değil — çocuklar zaman zaman zorlanabilir. Gözlem sürdür.`;
    } else if(checked <= 3){
      el.style.background = 'rgba(245,158,11,.08)';
      el.style.border = '1px solid rgba(245,158,11,.3)';
      el.innerHTML = `<strong style="color:var(--amber)">🟡 ${checked} işaret:</strong> Dikkat çekici. Öğretmenle paylaşın, evde destek stratejilerini uygulayın ve 2-3 ay sonra tekrar değerlendirin.`;
    } else {
      el.style.background = 'rgba(220,38,38,.07)';
      el.style.border = '1px solid rgba(220,38,38,.3)';
      el.innerHTML = `<strong style="color:var(--danger)">🔴 ${checked} işaret:</strong> Uzman değerlendirmesi öneriyoruz. Aşağıdaki <strong>RAM başvurusu</strong> adımlarını izleyin — süreç ücretsizdir ve erken müdahale büyük fark yaratır.`;
    }
  }




  _saveNote(id, text){
    const notes = this._storage.get('obs_notes') || {};
    notes[id] = text;
    this._storage.set('obs_notes', notes);
  }
  _getNote(id){
    const notes = this._storage.get('obs_notes') || {};
    return notes[id] || '';
  }

  _buildTymmModal(a){
    const hasOO = a.tymm_oo?.length > 0;
    // tymm_outcomes resmi kazanım kodlarını içerir (MAT.S.T.N)
    const realOutcomes = resolveOutcomes(a.tymm_outcomes || []);
    const hasReal = realOutcomes.length > 0;
    // Geriye dönük: eski tymm_il (MAB alan becerileri) varsa alan becerileri rozetini göster
    const hasMAB = a.tymm_il?.length > 0;
    if(!hasOO && !hasReal && !hasMAB) return '';

    let html = `<div style="background:linear-gradient(135deg,rgba(17,138,178,.08),rgba(17,138,178,.02));border:1.5px solid rgba(17,138,178,.22);border-radius:var(--r-md);padding:.95rem 1rem;margin-bottom:1rem">
      <p style="font-size:var(--t-xs);font-weight:800;color:var(--blue);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.65rem">🎓 TYMM Müfredat Uyumu</p>`;

    // ── OKUL ÖNCESİ ────────────────────────────────────────
    if(hasOO){
      html += `<p style="font-size:var(--t-xs);font-weight:700;color:var(--muted);margin-bottom:.4rem">OKUL ÖNCESİ — Alan Becerileri (OÖEP 2024)</p>`;
      html += `<div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:.6rem">`;
      (a.tymm_oo||[]).forEach(k => {
        const b = TYMM.OO[k]; if(!b) return;
        html += `<div style="background:var(--surface);border:1px solid rgba(17,138,178,.18);border-radius:var(--r-sm);padding:.55rem .75rem">
          <div style="display:flex;align-items:center;gap:.45rem;margin-bottom:.2rem">
            <span style="background:var(--blue);color:#fff;font-size:var(--t-xs);font-weight:800;padding:.12rem .4rem;border-radius:3px">${b.kod}</span>
            <strong style="font-size:var(--t-sm)">${b.ad}</strong>
          </div>
          <p style="font-size:var(--t-sm);color:var(--muted);line-height:1.5">${b.aciklama}</p>
          <div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-top:.3rem">${b.surec.map(s=>`<span style="font-size:var(--t-xs);background:rgba(17,138,178,.08);color:var(--blue);padding:.1rem .32rem;border-radius:3px">${s}</span>`).join('')}</div>
        </div>`;
      });
      html += `</div>`;
      if(a.tymm_yas?.length) html += `<p style="font-size:var(--t-xs);color:var(--muted);margin-bottom:.4rem"><strong>Yaş:</strong> ${a.tymm_yas.map(y=>y+' ay').join(' · ')}</p>`;
    }

    // ── İLKOKUL — GERÇEK KAZANIMLAR (MAT.S.T.N) ───────────
    if(hasReal){
      // Kazanımları sınıf bazında grupla
      const byGrade = {};
      realOutcomes.forEach(o => {
        if(!byGrade[o.grade]) byGrade[o.grade] = [];
        byGrade[o.grade].push(o);
      });
      html += `<p style="font-size:var(--t-xs);font-weight:700;color:var(--muted);margin-bottom:.4rem${hasOO?';margin-top:.6rem':''}">İLKOKUL — Öğrenme Çıktıları (TYMM İlkokul Mat. Prog. 2024)</p>`;
      Object.keys(byGrade).sort().forEach(g => {
        const outcomes = byGrade[g];
        html += `<div style="margin-bottom:.6rem">
          <p style="font-size:var(--t-xs);font-weight:800;color:var(--teal-d);margin-bottom:.35rem;letter-spacing:.04em">📘 ${g}. SINIF (${outcomes.length} kazanım)</p>
          <div style="display:flex;flex-direction:column;gap:.45rem">`;
        outcomes.forEach(o => {
          html += `<div style="background:var(--surface);border:1px solid rgba(45,106,79,.2);border-radius:var(--r-sm);padding:.6rem .75rem">
            <div style="display:flex;align-items:flex-start;gap:.45rem;margin-bottom:.25rem">
              <span style="background:var(--teal-d);color:#fff;font-size:.6rem;font-weight:800;padding:.15rem .4rem;border-radius:3px;white-space:nowrap;margin-top:.1rem">${o.code}</span>
              <p style="font-size:var(--t-sm);font-weight:700;line-height:1.45;flex:1">${o.title}</p>
            </div>
            ${o.bullets.length ? `
              <div style="margin-top:.35rem;padding-left:.25rem;border-left:2px solid rgba(45,106,79,.15);padding-left:.6rem">
                ${o.bullets.map(b => `<p style="font-size:var(--t-xs);color:var(--muted);line-height:1.55;margin:.1rem 0">${b}</p>`).join('')}
              </div>
            ` : ''}
            <p style="font-size:.58rem;color:var(--hint);margin-top:.35rem;text-transform:uppercase;letter-spacing:.06em">
              ${o.themeName} · ${o.dersSaati} saat
            </p>
          </div>`;
        });
        html += `</div></div>`;
      });
    }

    // ── ALAN BECERİLERİ (MAB rozetleri) ────────────────────
    if(hasMAB){
      html += `<p style="font-size:var(--t-xs);font-weight:700;color:var(--muted);margin:.5rem 0 .35rem">ALAN BECERİLERİ</p>
        <div style="display:flex;gap:.3rem;flex-wrap:wrap">`;
      (a.tymm_il||[]).forEach(k => {
        const b = TYMM.IL_MAB[k]; if(!b) return;
        html += `<span title="${b.aciklama}" style="font-size:var(--t-xs);background:rgba(45,106,79,.1);color:var(--teal-d);border-radius:3px;padding:.18rem .45rem;font-weight:700">${b.kod}: ${b.ad}</span>`;
      });
      html += `</div>`;
    }

    html += `<p style="font-size:var(--t-xs);color:var(--muted);margin-top:.6rem;opacity:.7">Kaynak: MEB TEGM OÖEP 2024 · MEB TYMM İlkokul Matematik Dersi Öğretim Programı 2024</p></div>`;
    return html;
  }

  _renderTeacherBanner(){
    const note = this._teacherSvc.getWeeklyNote();
    if(!note) return '';
    return `<div style="background:linear-gradient(135deg,var(--blue) 0%,#0e6e8c 100%);border-radius:var(--r-lg);padding:1.1rem 1.3rem;margin-bottom:1.3rem;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(17,138,178,.3)" onclick="App.show('teacher')">
      <div style="font-size:var(--t-xs);font-weight:800;opacity:.75;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">📋 ÖĞRETMENDEN HAFTALIK NOT</div>
      <p style="font-size:var(--t-lg);line-height:1.5;opacity:.95">${note.text}</p>
      <p style="font-size:var(--t-xs);opacity:.65;margin-top:.4rem">Öğretmen köprüsüne git →</p>
    </div>`;
  }

  _renderSmsBanner(){
    const task = this._smsSvc.getCurrentTask();
    return `<div style="background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:var(--s-md) var(--s-lg);margin-bottom:1.3rem;cursor:pointer" onclick="App.show('sms')">
      <div style="font-size:var(--t-xs);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem">📱 BU HAFTALIK GÖREV</div>
      <p style="font-size:var(--t-md);line-height:1.5;color:var(--text2)">${task.text}</p>
    </div>`;
  }

  /* ══════════════════════════════════════════════
     ACTIVITIES VIEW
  ══════════════════════════════════════════════ */

  _renderActs(){
    this._showSkeleton('act-body', 4);
    const c = this._getChild();
    const all = c ? this._repo.byAgeGroup(c.ageGroup) : this._repo.all();
    const done = new Set(c?.completedActivities||[]);

    let filtered = all;
    if(this._filter.category) filtered = filtered.filter(a=>a.category===this._filter.category);
    if(this._filter.anxOnly)  filtered = filtered.filter(a=>a.anxFriendly);
    if(this._filter.spatialOnly) filtered = filtered.filter(a=>a.category===Category.SPATIAL);
    if(this._filter.context)  filtered = filtered.filter(a=>(a.context||[]).includes(this._filter.context));
    if(this._filter.difficulty) filtered = filtered.filter(a=>a.difficulty===this._filter.difficulty);
    if(this._filter.searchTerm) {
      const t = this._filter.searchTerm.toLowerCase();
      filtered = filtered.filter(a=>a.title.toLowerCase().includes(t)||a.tags.some(g=>g.includes(t)));
    }

    // Bağlam etiketi label'ları
    const ctxLabels = {
      kitchen:'🍳 Mutfak', indoor:'🏠 Ev İçi', outdoor:'🌳 Dışarı',
      commute:'🚗 Yolda',  bedtime:'🌙 Uyku Öncesi', game:'🎲 Oyun',
    };

    document.getElementById('act-body').innerHTML=`
      <!-- Search -->
      <div style="margin-bottom:1rem">
        <input class="input" placeholder="🔍 Etkinlik ara…" value="${this._filter.searchTerm}" oninput="App._search(this.value)" style="padding:.7rem 1rem;font-size:var(--t-lg)">
      </div>
      <!-- Active filters -->
      ${this._filter.category||this._filter.anxOnly||this._filter.spatialOnly||this._filter.context||this._filter.difficulty?`
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.85rem">
        ${this._filter.category?`<span class="chip chip-orange">${this._CatEmoji[this._filter.category]} ${this._CatLabels[this._filter.category]} <button onclick="App._clearCatFilter()" style="background:none;border:none;cursor:pointer;font-size:var(--t-lg);padding-left:.25rem">×</button></span>`:''}
        ${this._filter.anxOnly?`<span class="chip chip-orange">💛 Kaygı Dostu <button onclick="App._clearAnxFilter()" style="background:none;border:none;cursor:pointer;font-size:var(--t-lg);padding-left:.25rem">×</button></span>`:''}
        ${this._filter.spatialOnly?`<span class="chip chip-blue">🧭 Uzamsal <button onclick="App._clearSpatialFilter()" style="background:none;border:none;cursor:pointer;font-size:var(--t-lg);padding-left:.25rem">×</button></span>`:''}
        ${this._filter.context?`<span class="chip chip-green">${ctxLabels[this._filter.context]||this._filter.context} <button onclick="App._clearContextFilter()" style="background:none;border:none;cursor:pointer;font-size:var(--t-lg);padding-left:.25rem">×</button></span>`:''}
        ${this._filter.difficulty?`<span class="chip chip-muted">${this._filter.difficulty==='easy'?'🟢 Kolay':this._filter.difficulty==='medium'?'🟡 Orta':'🔴 İleri'} <button onclick="App._clearDifficultyFilter()" style="background:none;border:none;cursor:pointer;font-size:var(--t-lg);padding-left:.25rem">×</button></span>`:''}
      </div>`:''}
      <!-- Count -->
      <p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem">${filtered.length} etkinlik</p>
      <!-- List -->
      <div style="display:flex;flex-direction:column;gap:.75rem">
        ${filtered.length?filtered.map(a=>this._actCard(a, done.has(a.id))).join(''):'<p class="muted center" style="padding:2rem">Etkinlik bulunamadı.</p>'}
      </div>
    `;

    // Filter panel
    document.getElementById('act-filter-panel').innerHTML=`
      <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted);text-transform:uppercase;margin-bottom:.55rem">KATEGORİ</p>
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.8rem">
        ${Object.entries(this._CatLabels).map(([k,v])=>`
          <button class="chip ${this._filter.category===k?'chip-orange':'chip-muted'}" onclick="App._setCatFilter('${k}')" style="cursor:pointer;border:none;padding:.4rem .8rem">${this._CatEmoji[k]} ${v}</button>`).join('')}
      </div>
      <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted);text-transform:uppercase;margin:.8rem 0 .55rem">ZORLUK</p>
      <div style="display:flex;gap:.35rem;margin-bottom:.8rem">
        ${[
          {k:'easy',   label:'🟢 Kolay'},
          {k:'medium', label:'🟡 Orta'},
          {k:'hard',   label:'🔴 İleri'},
        ].map(d => `<button onclick="App._setDifficultyFilter('${d.k}')" class="chip ${this._filter.difficulty===d.k?'chip-orange':'chip-muted'}" style="cursor:pointer;border:none;padding:.4rem .8rem;flex:1">${d.label}</button>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        <label style="display:flex;align-items:center;gap:.6rem;font-size:var(--t-md);font-weight:700;cursor:pointer">
          <input type="checkbox" ${this._filter.anxOnly?'checked':''} onchange="App._toggleAnxFilter()" style="width:16px;height:16px;accent-color:var(--teal)">
          💛 Yalnızca Kaygı Dostu Etkinlikler
        </label>
        <label style="display:flex;align-items:center;gap:.6rem;font-size:var(--t-md);font-weight:700;cursor:pointer">
          <input type="checkbox" ${this._filter.spatialOnly?'checked':''} onchange="App._toggleSpatialFilter()" style="width:16px;height:16px;accent-color:var(--blue)">
          🧭 Yalnızca Uzamsal Düşünme
        </label>
      </div>
    `;
  }

  _clearSpatialFilter(){ this._filter.spatialOnly=false; this._renderActs(); }
  _toggleSpatialFilter(){ this._filter.spatialOnly=!this._filter.spatialOnly; this._renderActs(); }
  _clearContextFilter(){ this._filter.context=null; this._renderActs(); }

  _setDifficultyFilter(d){
    this._filter.difficulty = (this._filter.difficulty === d) ? null : d;
    this._renderActs();
  }
  _clearDifficultyFilter(){ this._filter.difficulty=null; this._renderActs(); }

  _difficultyChip(d){
    const meta = {
      easy:   { label:'Kolay',  bg:'rgba(22,163,74,.1)',   fg:'var(--success)',  icon:'🟢' },
      medium: { label:'Orta',   bg:'rgba(245,158,11,.1)',  fg:'var(--amber)',    icon:'🟡' },
      hard:   { label:'İleri',  bg:'rgba(220,38,38,.08)',  fg:'var(--danger)',   icon:'🔴' },
    }[d];
    if(!meta) return '';
    return `<span style="background:${meta.bg};color:${meta.fg};border-radius:var(--r-full);padding:.15rem .5rem;font-size:var(--t-xs);font-weight:700">${meta.icon} ${meta.label}</span>`;
  }

  /* ══════════════════════════════════════════════
     UZAMSAL DÜŞÜNME MODÜLÜ
  ══════════════════════════════════════════════ */


  /* ══════════════════════════════════════════════
     TYMM MÜFREDAт UYUM MODÜLÜ
  ══════════════════════════════════════════════ */


  /* ══════════════════════════════════════════════
     BECERİ KÖPRÜSÜ — Koordinatör
  ══════════════════════════════════════════════ */
  _renderSkill(){
    this._renderBreadcrumb('skill-body', [{label:'Akademi',view:'learn'},{label:'Beceri Köprüsü'}]);
    const el = document.getElementById('skill-body');
    if (!el) return;
    // SkillBridgeApp yalnızca bir kez oluşturulur
    if (!this._skillApp) {
      this._skillApp = createSkillBridge({
        containerEl: el,
        storage:     localStorage,
        namespace:   'matevde',
      });
    }
    this._skillApp.mount();
  }


  /* ── Breadcrumb ────────────────────────────────────────────
     Sub-view'larda üst konumu gösterir.
     path: [{ label, view? }] — sonuncusu aktif (tıklanamaz)
  ──────────────────────────────────────────────────────────── */
  _renderBreadcrumb(containerId, path){
    const el = document.getElementById(containerId);
    if(!el) return;
    const bc = document.createElement('div');
    bc.className = 'breadcrumb';
    bc.innerHTML = path.map((p, i) => {
      const isLast = i === path.length - 1;
      const sep = i > 0 ? `<span class="breadcrumb-sep">›</span>` : '';
      return isLast
        ? `${sep}<span class="breadcrumb-item">${p.label}</span>`
        : `${sep}<button class="breadcrumb-item" onclick="App.show('${p.view}')">${p.label}</button>`;
    }).join('');
    el.prepend(bc);
  }

  _renderStories(){
    this._renderBreadcrumb('stories-body', [{label:'Akademi',view:'learn'},{label:'Başarı Hikayeleri'}]);
    const el = document.getElementById('stories-body'); if(!el) return;
    // Başarı hikayeleri — Muir (2012), Skwarchuk (2009), Knapp ve ark. (2017)'den uyarlandı
    const stories = [
      { emoji:'👩\u200d🍳', family:"Erzurum — 2 çocuk", age:"36-48 ay", label:"Sabırlı Başlangıç",
        story:"Mutfakta pirinç tanelerini sayarken başladık. İlk hafta 5e kadar sayabiliyordu. Üç ay sonra 30a kadar kolayca sayıyor, beni sınıflandırma hakkında sorularla bunaltıyor.",
        lesson:"Küçük, tekrarlayan anlar büyük farklılık yaratır.",
        tag:"Sayma ve Günlük Hayat" },
      { emoji:'👨\u200d🔧', family:"Ankara — 1 çocuk", age:"2. Sınıf", label:"Market Keşfi",
        story:"Fişleri birlikte kontrol etmeye başladık. Bir gün marketten 3 TL hata buldu. O günden beri aile muhasebecimiz oldu. Matematik dersindeki tutumu tamamen değişti.",
        lesson:"Gerçek bağlam içsel motivasyonu besler.",
        tag:"Market Matematiği" },
      { emoji:'👩\u200d🎓', family:"İzmir — 3 çocuk", age:"48-60 ay", label:"Farklı Hızlar",
        story:"Üç çocuğum var, üçü de farklı hızda öğreniyor. Ölçme etkinliklerinde herkes aynı masada farklı şeyler keşfetti. En küçüğü kardeşini izleyerek öğrendi.",
        lesson:"Karma yaş etkinlikleri herkese kazandırır.",
        tag:"Ölçme ve Aile" },
      { emoji:'👨\u200d👩\u200d👧', family:"Konya — Düşük bütçe", age:"1. Sınıf", label:"Malzeme Değil, Dikkat",
        story:"Tahta oyuncaklar yoktu. Kuru fasulyeyle saydık, gazete kesimleriyle şekil yaptık. En etkili materyal ebeveynin dikkatidir.",
        lesson:"Pahalı araca gerek yok — merak her evde var.",
        tag:"Her Bütçeye Uygun" },
      { emoji:'👩\u200d💼', family:"İstanbul — Çalışan ebeveyn", age:"3. Sınıf", label:"5 Dakika Yeter",
        story:"Sabah 5 dakikam vardı. Takvime baktık, haftaya kaç gün kaldı. Akşam 5 dakika: fişi kontrol ettik. Haftada 10 toplam dakika. Bir dönem sonra matematik notu 60dan 85e çıktı.",
        lesson:"Rutinin süresi değil, kalitesi belirler.",
        tag:"Zaman Yönetimi" },
      { emoji:'👴', family:"Trabzon — Büyükbaba", age:"Okul öncesi", label:"Kuşaklar Arası",
        story:"Torunumla bahçede sebze yetiştirdik. Büyüme günlüğü tuttuk, her gün cetvel koyduk. Ben matematik bilmiyorum ama sayıları ve ölçmeyi öğrettim. İkimiz de öğrendik.",
        lesson:"Matematiği bilmek zorunda değilsiniz — merak etmeniz yeterli.",
        tag:"Doğa ve Nesil" },
      { emoji:'👩‍👦', family:"Diyarbakır — 2 çocuk", age:"1. ve 3. Sınıf", label:"Dil Köprüsü",
        story:"Evde Kürtçe konuşuyoruz, okulda Türkçe matematik öğreniyorlar. Sayıları her iki dilde birlikte saydık. Mutfakta ölçerken iki dilli konuştuk. Matematik dili ne olursa olsun aynı — bu bizi çok rahatlattı.",
        lesson:"Matematik evrensel bir dil — anadil ne olursa desteklemek mümkün.",
        tag:"Çok Dilli Aile" },
      { emoji:'👨‍👩‍👦‍👦', family:"Van — 4 çocuk", age:"Okul öncesi ve 2. Sınıf", label:"Kış Matematiği",
        story:"Van'ın kışı uzun, çok dışarı çıkamıyoruz. Pencereden kar tanelerini saydık, sobanın odunlarını grupladık, yemek tariflerini ölçeklendirdik. Ev zaten bir matematik laboratuvarıymış.",
        lesson:"Her koşulda, her evde matematik var — görmek yeterli.",
        tag:"Ev Ortamı" },
    ];
;

    el.innerHTML = '<div style="padding-bottom:2rem">' +
      '<div style="background:linear-gradient(135deg,rgba(255,209,102,.15),rgba(255,107,53,.08));border-radius:var(--r-lg);padding:var(--s-lg) 1.3rem;margin-bottom:1.5rem;border:1.5px solid rgba(255,209,102,.3)">' +
        '<h3 style="color:var(--teal);margin-bottom:.35rem">🌟 Başarı Hikayeleri</h3>' +
        '<p style="font-size:var(--t-md);line-height:1.65;color:var(--muted)">Araştırmalar şunu gösteriyor: başarıyı getiren aktivite değil, ebeveynin tutumudur. Bu aileler farklı koşullarda, aynı merakla başladı.</p>' +
        '<p style="font-size:var(--t-xs);color:var(--muted);margin-top:.4rem;font-style:italic">Kaynak: Muir (2012), Skwarchuk (2009), Knapp ve ark. (2017) — uyarlanmış örnekler</p>' +
      '</div>' +
      stories.map(s => '<div class="card" style="margin-bottom:.85rem"><div class="card-body">' +
        '<div style="display:flex;align-items:flex-start;gap:.85rem">' +
          '<div style="font-size:2.2rem;flex-shrink:0">' + s.emoji + '</div>' +
          '<div style="flex:1">' +
            '<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem">' +
              '<strong style="font-size:var(--t-lg)">' + s.label + '</strong>' +
              '<span style="font-size:var(--t-xs);background:rgba(255,107,53,.1);color:var(--teal);padding:.1rem .4rem;border-radius:3px;font-weight:700">' + s.tag + '</span>' +
            '</div>' +
            '<p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.5rem">' + s.family + ' · ' + s.age + '</p>' +
            '<p style="font-size:var(--t-md);line-height:1.6;color:var(--text2);font-style:italic;margin-bottom:.5rem">"' + s.story + '"</p>' +
            '<div style="background:rgba(45,106,79,.08);border-radius:var(--r-sm);padding:.5rem .75rem">' +
              '<p style="font-size:var(--t-sm);color:var(--teal-d);font-weight:700">💡 ' + s.lesson + '</p>' +
            '</div>' +
            this._editBar(stories.indexOf(s).toString(),'story') +
          '</div>' +
        '</div>' +
      '</div></div>').join('') +
      '<div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-md) var(--s-lg);text-align:center;border:1.5px dashed var(--border)">' +
        '<p style="font-size:var(--t-md);font-weight:700;margin-bottom:.3rem">Siz de paylaşın 💬</p>' +
        '<p style="font-size:var(--t-sm);color:var(--muted);line-height:1.55">ABMATO ile yaşadığınız güzel bir anı gözlem notunuza ekleyin. Her etkinliğin altında not alanı var.</p>' +
      '</div>' +
    '</div>';
  }

  _selectTymmGrade(g){
    this._tymmSelectedGrade = g;
    this._renderTymm();
  }

  _renderTymm(){
    const el = document.getElementById('tymm-body'); if(!el) return;
    const child = this._getChild();
    const isOO = child?.ageGroup === AgeGroup.PRESCHOOL;

    // Seçili sınıf (varsayılan: çocuğun sınıfı veya 1. sınıf)
    const gradeMap = { [AgeGroup.G1]:1, [AgeGroup.G2]:2, [AgeGroup.G3]:3, [AgeGroup.G4]:4 };
    if(this._tymmSelectedGrade === undefined){
      this._tymmSelectedGrade = gradeMap[child?.ageGroup] || 1;
    }
    const sel = this._tymmSelectedGrade;

    const allActs = this._repo.all();
    const done = new Set(child?.completedActivities||[]);

    // Her OO alan becerisi için etkinlik sayısı
    const countOO={}, doneOO={};
    allActs.forEach(a => {
      (a.tymm_oo||[]).forEach(k => { countOO[k]=(countOO[k]||0)+1; if(done.has(a.id)) doneOO[k]=(doneOO[k]||0)+1; });
    });

    // Her MAT.S.T için etkinlik ve kazanım sayıları
    const themeActCount = {};   // 'MAT.1.1' -> activity count
    const themeActDone  = {};   // 'MAT.1.1' -> done activity count
    allActs.forEach(a => {
      const themes = new Set();
      (a.tymm_outcomes||[]).forEach(code => {
        const o = getOutcomeByCode(code);
        if(o) themes.add(o.themeCode);
      });
      themes.forEach(tc => {
        themeActCount[tc] = (themeActCount[tc]||0) + 1;
        if(done.has(a.id)) themeActDone[tc] = (themeActDone[tc]||0) + 1;
      });
    });

    el.innerHTML = `
      <!-- Başlık -->
      <div style="background:linear-gradient(135deg,rgba(17,138,178,.1),rgba(17,138,178,.03));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1.5rem;border:1.5px solid rgba(17,138,178,.25)">
        <h3 style="color:var(--blue);margin-bottom:.4rem">🎓 TYMM Müfredat Çerçevesi</h3>
        <p style="font-size:var(--t-md);line-height:1.65;color:var(--muted)">Türkiye Yüzyılı Maarif Modeli 2024 beceri çerçevesiyle ABMATO etkinliklerinin hizası. Tüm veriler resmi MEB belgelerinden doğrulanmıştır.</p>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.65rem">
          <span class="chip chip-blue">OÖEP 2024</span>
          <span class="chip chip-green">İlkokul Mat. Prog. 2024</span>
          <span class="chip chip-muted">tymm.meb.gov.tr</span>
        </div>
      </div>

      <!-- OKUL ÖNCESİ MAB'LER -->
      <div style="margin-bottom:1.5rem">
        <div class="sec-header">
          <span class="sec-title">Okul Öncesi Matematik Alan Becerileri (36-72 ay)</span>
        </div>
        <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.8rem">Kaynak: OÖEP 2024 Bölüm 4.2 + tymm.meb.gov.tr aylık planlar</p>
        <div style="display:flex;flex-direction:column;gap:.55rem">
          ${Object.entries(TYMM.OO).map(([k,b])=>{
            const tot=countOO[k]||0, don=doneOO[k]||0;
            const pct=tot>0?Math.round(don/tot*100):0;
            return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:.65rem .8rem">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
                <span style="background:var(--blue);color:#fff;font-size:.65rem;font-weight:800;padding:.15rem .4rem;border-radius:3px">${b.kod}</span>
                <strong style="font-size:var(--t-sm)">${b.ad}</strong>
                ${tot>0 ? `<span style="margin-left:auto;font-size:.65rem;color:var(--muted);font-weight:700">${don}/${tot}</span>` : ''}
              </div>
              <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.5">${b.aciklama}</p>
              ${tot>0 ? `<div class="progress" style="margin-top:.35rem"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- İLKOKUL — SINIF SEÇİCİ -->
      <div style="margin-bottom:.8rem">
        <div class="sec-header">
          <span class="sec-title">İlkokul Matematik Programı (TYMM 2024)</span>
        </div>
        <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.6rem">111 öğrenme çıktısı, 16 tema — resmi PDF'ten doğrulandı. Sınıf seçin:</p>
        <div style="display:flex;gap:.35rem">
          ${[1,2,3,4].map(g => `
            <button onclick="App._selectTymmGrade(${g})" style="flex:1;padding:.55rem .2rem;background:${sel===g?'var(--teal)':'var(--surface)'};color:${sel===g?'#fff':'var(--text)'};border:1.5px solid ${sel===g?'var(--teal)':'var(--border)'};border-radius:var(--r-sm);font-weight:800;font-size:var(--t-sm);cursor:pointer">${g}. Sınıf</button>
          `).join('')}
        </div>
      </div>

      <!-- İLKOKUL — Seçili sınıfın temaları -->
      <div style="margin-bottom:1.5rem">
        <div style="display:flex;flex-direction:column;gap:.7rem">
          ${getThemesByGrade(sel).map(t => {
            const themeOutcomes = getOutcomesByTheme(t.kod);
            const tot = themeActCount[t.kod] || 0;
            const don = themeActDone[t.kod] || 0;
            const pct = tot > 0 ? Math.round(don / tot * 100) : 0;
            const totalHours = t.altTemalar.reduce((s,st) => s + st.saat, 0);
            return `<div class="card"><div class="card-body">
              <div style="display:flex;align-items:flex-start;gap:.7rem;margin-bottom:.4rem">
                <span style="background:var(--teal-d);color:#fff;font-size:.65rem;font-weight:800;padding:.2rem .5rem;border-radius:4px;flex-shrink:0;white-space:nowrap;margin-top:.1rem">${t.kod}</span>
                <div style="flex:1;min-width:0">
                  <strong style="font-size:var(--t-lg);line-height:1.25;display:block">${t.ad}</strong>
                  <p style="font-size:.65rem;color:var(--hint);margin-top:.15rem;text-transform:uppercase;letter-spacing:.05em">${totalHours} saat · ${themeOutcomes.length} kazanım</p>
                </div>
              </div>
              ${t.altTemalar.length > 1 ? `
                <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.5rem">
                  ${t.altTemalar.map(st => `<span style="font-size:.58rem;background:var(--raised);color:var(--muted);padding:.15rem .4rem;border-radius:3px;font-weight:700">${st.ad} (${st.saat}s)</span>`).join('')}
                </div>
              ` : ''}
              <details style="margin-top:.4rem">
                <summary style="cursor:pointer;font-size:var(--t-xs);font-weight:700;color:var(--teal-d);padding:.3rem 0">Öğrenme çıktılarını göster (${themeOutcomes.length})</summary>
                <div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.5rem;padding-left:.25rem;border-left:2px solid rgba(45,106,79,.15);padding-left:.55rem">
                  ${themeOutcomes.map(o => `
                    <div style="padding:.35rem 0">
                      <div style="display:flex;gap:.4rem;align-items:flex-start;margin-bottom:.15rem">
                        <span style="background:rgba(45,106,79,.12);color:var(--teal-d);font-size:.55rem;font-weight:800;padding:.12rem .35rem;border-radius:3px;white-space:nowrap">${o.code}</span>
                        <p style="font-size:var(--t-xs);font-weight:600;line-height:1.5;flex:1">${o.title}</p>
                      </div>
                      ${o.bullets.length ? `
                        <div style="padding-left:.3rem;margin-top:.15rem">
                          ${o.bullets.map(b => `<p style="font-size:.65rem;color:var(--muted);line-height:1.5;margin:.05rem 0">${b}</p>`).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </details>
              ${tot > 0 ? `<div style="margin-top:.55rem">
                <div style="display:flex;justify-content:space-between;font-size:var(--t-xs);color:var(--muted);margin-bottom:.2rem">
                  <span>Destekleyen etkinlikler</span>
                  <span style="color:${pct>=70?'var(--success)':pct>=30?'var(--amber)':'var(--muted)'};font-weight:700">${don}/${tot}</span>
                </div>
                <div class="progress"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--teal-d),var(--teal-l))"></div></div>
              </div>` : `<p style="font-size:var(--t-xs);color:var(--hint);margin-top:.45rem;font-style:italic">Henüz destekleyen etkinlik yok</p>`}
            </div></div>`;
          }).join('')}
        </div>
      </div>

      <!-- İLKOKUL ALAN BECERİLERİ -->
      <div style="margin-bottom:1.5rem">
        <div class="sec-header">
          <span class="sec-title">İlkokul Matematik Alan Becerileri</span>
        </div>
        <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.8rem">Kaynak: tymm.meb.gov.tr/beceriler/matematik-alan-becerileri (doğrulanmış)</p>
        <div style="display:flex;flex-direction:column;gap:.6rem">
          ${Object.entries(TYMM.IL_MAB).map(([k,b])=>`
            <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);padding:var(--s-sm) var(--s-md)">
              <div style="display:flex;align-items:center;gap:.55rem;margin-bottom:.3rem">
                <span style="background:var(--teal-l);color:#fff;font-size:var(--t-xs);font-weight:800;padding:.18rem .42rem;border-radius:4px">${b.kod}</span>
                <strong style="font-size:var(--t-md)">${b.ad}</strong>
              </div>
              <p style="font-size:var(--t-sm);color:var(--muted);line-height:1.5;margin-bottom:.3rem">${b.aciklama}</p>
              <div style="display:flex;gap:.25rem;flex-wrap:wrap">
                ${b.surec.map(s=>`<span style="font-size:var(--t-xs);background:rgba(45,106,79,.08);color:var(--teal-d);padding:.12rem .35rem;border-radius:3px">${s}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- PROGRAMLAR ARASI BİLEŞENLER -->
      <div style="margin-bottom:1.5rem">
        <div class="sec-header">
          <span class="sec-title">Programlar Arası Bileşenler</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:.55rem">
          ${Object.entries(TYMM.PAB).map(([k,b])=>`
            <div style="display:flex;gap:.7rem;align-items:center;padding:.7rem;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md)">
              <span style="background:var(--purple);color:#fff;font-size:var(--t-xs);font-weight:800;padding:.18rem .42rem;border-radius:4px;flex-shrink:0">${k}</span>
              <div>
                <strong style="font-size:var(--t-md)">${b.ad}</strong>
                <p style="font-size:var(--t-sm);color:var(--muted);margin-top:.1rem">${b.aciklama}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Kaynaklar -->
      <div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-sm) var(--s-md);border:1.5px solid var(--border)">
        <strong style="font-size:var(--t-sm)">📎 Resmi Kaynaklar</strong>
        <div style="font-size:var(--t-sm);color:var(--muted);margin-top:.4rem;line-height:1.8">
          <p>• MEB TEGM (2024). <em>TYMM Okul Öncesi Eğitim Programı</em> — tegm.meb.gov.tr</p>
          <p>• MEB TYMM (2024). <em>İlkokul Matematik Dersi Öğretim Programı (1–4. Sınıf)</em> — tymm.meb.gov.tr</p>
          <p>• Doğrulama: tymm.meb.gov.tr/okul-oncesi/unite/* (aylık planlar)</p>
          <p>• Doğrulama: tymm.meb.gov.tr/beceriler/matematik-alan-becerileri</p>
        </div>
      </div>
    `;
  }

  _renderSpatialModule(){
    const el = document.getElementById('spatial-body'); if(!el) return;
    const c = this._getChild();
    const spatialActs = this._repo.byCategory(Category.SPATIAL).filter(a=>
      !c || a.ageGroups.includes(c.ageGroup)
    );
    const done = new Set(c?.completedActivities||[]);

    el.innerHTML=`
      <!-- Intro -->
      <div style="background:linear-gradient(135deg,rgba(123,45,139,.08),rgba(123,45,139,.03));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1.4rem;border:1.5px solid rgba(123,45,139,.2)">
        <h3 style="color:var(--purple);margin-bottom:.5rem">🧭 Uzamsal Düşünme Nedir?</h3>
        <p style="font-size:var(--t-lg);line-height:1.65">Nesnelerin uzaydaki konumunu, ilişkilerini ve dönüşümlerini zihinsel olarak işleme yeteneğidir. 5 yaşındaki bir çocuğun blok yapısını kopyalama becerisi, 6 yaşındaki sayı doğrusu başarısını öngörüyor. Tüm STEM alanlarıyla güçlü bağlantısı var.</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem">
          <span class="chip chip-blue">🔬 Royal Society, 2024</span>
          <span class="chip chip-green">✓ Öğretilebilir beceri</span>
          <span class="chip chip-orange">⭐ STEM anahtarı</span>
        </div>
      </div>

      <!-- Neden önemli? -->
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">Neden bu kadar önemli?</span></div>
        <div style="display:flex;flex-direction:column;gap:.6rem">
          ${[
            {icon:'🧠', text:'5 yaşında zihinsel döndürme → 6 yaşında sayı doğrusu başarısı (Gunderson et al., 2012)'},
            {icon:'🎓', text:'Uzamsal beceri tüm STEM alanlarında başarıyı öngörüyor (Wai et al., 2009)'},
            {icon:'🌱', text:'Düşük gelirli ailelerden çocuklar eğitimle en büyük ilerlemeyi gösteriyor (Verdine, 2014)'},
            {icon:'🔄', text:'Uzamsal beceri öğretilebilir — blok oyunu, bulmaca, harita çizimi etkili (Uttal et al., 2013)'},
          ].map(i=>`
            <div style="display:flex;gap:.75rem;align-items:flex-start;padding:.75rem;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md)">
              <span style="font-size:1.4rem;flex-shrink:0">${i.icon}</span>
              <p style="font-size:var(--t-md);line-height:1.55">${i.text}</p>
            </div>`).join('')}
        </div>
      </div>

      <!-- Uzamsal etkinlikler -->
      <div>
        <div class="sec-header">
          <span class="sec-title">🧭 Uzamsal Düşünme Etkinlikleri</span>
          <span class="chip chip-blue">${spatialActs.length} etkinlik</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${spatialActs.map(a=>this._actCard(a, done.has(a.id))).join('')}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     RESIMLI KİTAP VIEW
  ══════════════════════════════════════════════ */

  _renderBooks(){
    this._renderBreadcrumb('books-body', [{label:'Akademi',view:'learn'},{label:'Kitap & Sayı Sohbeti'}]);
    const el = document.getElementById('books-body'); if(!el) return;
    const child = this._getChild();
    const books = child
      ? this._bookLibrary.filter(b=>b.ageGroups.includes(child.ageGroup))
      : this._bookLibrary;

    el.innerHTML=`
      <!-- Intro -->
      <div style="background:rgba(255,209,102,.15);border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(255,209,102,.3)">
        <h3 style="color:#92600A;margin-bottom:.4rem">📚 Okurken Matematik Konuşun</h3>
        <p style="font-size:var(--t-md);line-height:1.6">Türkçe resimli kitap okurken doğal matematik sohbetleri açılır. Purpura ve arkadaşlarının 2021 çalışması, matematik dilli kitap okuma müdahalesinin çocukların sayı dili gelişimini anlamlı biçimde artırdığını gösterdi.</p>
        <p style="font-size:var(--t-sm);color:#92600A;margin-top:.5rem;font-weight:700">Tüm kitaplar Türkçe — çoğu yerel yayınevlerinde ve okul kütüphanelerinde bulunur.</p>
      </div>

      ${!child ? '' : `<p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem">
        ${this._esc(child.name)} için yaş grubuna uygun kitaplar gösteriliyor.
        <button class="btn btn-soft btn-xs" onclick="App._renderAllBooks()">Tümünü gör</button>
      </p>`}

      <!-- Books -->
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${books.map(b=>`
          <div class="card">
            <div class="card-body">
              <div style="display:flex;align-items:flex-start;gap:.9rem;margin-bottom:.75rem">
                <div style="font-size:2.5rem;flex-shrink:0;line-height:1">${b.emoji}</div>
                <div style="flex:1">
                  <strong style="font-size:var(--t-lg)">${b.title}</strong>
                  <p class="muted" style="font-size:var(--t-sm);margin-top:.1rem">${b.author}</p>
                  <div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.4rem">
                    ${b.mathConcepts.map(c=>`<span class="chip chip-orange" style="font-size:var(--t-xs)">${c}</span>`).join('')}
                  </div>
                  ${b.tip ? `<p style="font-size:var(--t-sm);color:var(--muted);margin-top:.4rem;font-style:italic">💡 ${b.tip}</p>` : ''}
                </div>
              </div>
              <div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-sm) var(--s-sm)">
                <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.55rem">Okurken sorabileceğiniz sorular:</p>
                <div style="display:flex;flex-direction:column;gap:.4rem">
                  ${b.mathQuestions.map((q,i)=>`
                    <div style="display:flex;gap:.5rem;align-items:flex-start">
                      <span style="width:18px;height:18px;border-radius:50%;background:var(--teal);color:#fff;font-size:var(--t-xs);font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.1rem">${i+1}</span>
                      <p style="font-size:var(--t-md);line-height:1.5;font-style:italic">"${q}"</p>
                    </div>`).join('')}
                </div>
              </div>
              ${this._editBar(b.id,'book')}
            </div>
          </div>`).join('')}
      </div>

      <!-- Math talk tip -->
      <div style="margin-top:1.4rem;background:rgba(17,138,178,.08);border-radius:var(--r-lg);padding:var(--s-lg);border:1.5px solid rgba(17,138,178,.2)">
        <strong style="color:var(--blue);font-size:var(--t-lg)">💡 Sayı Sohbeti İpucu</strong>
        <p style="font-size:var(--t-md);line-height:1.6;margin-top:.4rem">Soru sorduktan sonra bekleyin. Çocuğa düşünme süresi tanıyın. Cevabı siz vermeyin — sessizlik öğrenmenin parçasıdır.</p>
      </div>
    `;
  }

  _renderAllBooks(){
    const el = document.getElementById('books-body'); if(!el) return;
    const books = this._bookLibrary;
    // Geçici olarak tüm kitapları göster
    const savedChild = this._getChild();
    // Tüm gruplara göre ayır
    const groups = {
      'Okul Öncesi & 1. Sınıf': books.filter(b=>b.ageGroups.includes(AgeGroup.PRESCHOOL)||b.ageGroups.includes(AgeGroup.G1)),
      '2. - 3. Sınıf': books.filter(b=>b.ageGroups.includes(AgeGroup.G2)||b.ageGroups.includes(AgeGroup.G3)),
      '3. - 4. Sınıf': books.filter(b=>b.ageGroups.includes(AgeGroup.G3)||b.ageGroups.includes(AgeGroup.G4)),
    };
    el.innerHTML = Object.entries(groups).map(([label, bks]) =>
      bks.length ? `<div class="sec-header" style="margin-top:1rem"><span class="sec-title">${label}</span></div>
      <div style="display:flex;flex-direction:column;gap:.7rem;margin-bottom:.5rem">
        ${bks.map(b=>`<div class="card card-sm" onclick="" style="cursor:default"><div class="card-body">
          <div style="display:flex;gap:.7rem;align-items:center">
            <span style="font-size:1.8rem">${b.emoji}</span>
            <div><strong style="font-size:var(--t-lg)">${b.title}</strong>
            <p class="muted" style="font-size:var(--t-sm)">${b.author}</p></div>
          </div>
        </div></div>`).join('')}
      </div>` : ''
    ).join('') + `<button class="btn btn-soft btn-block" style="margin-top:1rem" onclick="App._renderBooks()">← Yaşa uygun görünüm</button>`;
  }



  /* ══════════════════════════════════════════════
     MATH TALK KARTLARI VIEW
  ══════════════════════════════════════════════ */

  _renderSayiSohbeti(){
    this._renderBreadcrumb('mathtalk-body', [{label:'Akademi',view:'learn'},{label:'Sayı Sohbeti Kartları'}]);
    const el = document.getElementById('mathtalk-body'); if(!el) return;
    const child = this._getChild();
    const today = new Date();
    // Her gün farklı bir kart öne çıkar
    const featuredIdx = today.getDate() % this._sayiSohbetiKartlari.length;
    const featured = this._sayiSohbetiKartlari[featuredIdx];

    el.innerHTML=`
      <!-- Intro -->
      <div style="background:linear-gradient(135deg,var(--teal) 0%,var(--teal-d) 100%);border-radius:var(--r-lg);padding:1.4rem;margin-bottom:1.4rem;color:#fff">
        <p style="font-size:var(--t-xs);font-weight:800;opacity:.75;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.4rem">💬 BUGÜNÜN KARTI</p>
        <div style="font-size:1.6rem;margin-bottom:.4rem">${featured.context}</div>
        <p style="font-size:var(--t-xl);font-weight:700;line-height:1.4">"${featured.prompt}"</p>
        <p style="font-size:var(--t-sm);opacity:.8;margin-top:.5rem">Kavram: ${featured.concept}</p>
          ${this._editBar(m.id,'mt')}
      </div>

      <!-- Neden işe yarıyor? -->
      <div style="background:rgba(255,209,102,.15);border-radius:var(--r-md);padding:var(--s-md) var(--s-lg);margin-bottom:1.4rem;border:1.5px solid rgba(255,209,102,.3)">
        <p style="font-size:var(--t-md);line-height:1.6;color:var(--text2)"><strong>Araştırma bulgusu:</strong> Yüksek SES ailelerinin günlük matematik konuşma sıklığı düşük SES ailelerine kıyasla 3 kat fazla. Bu fark okul başarısında erken ayrışmaya yol açıyor. Kısa sohbetler bu açığı kapatıyor (Lu et al., Child Dev., 2025).</p>
      </div>

      <!-- Tüm kartlar -->
      <div class="sec-header"><span class="sec-title">Tüm Sohbet Kartları</span></div>
      <div style="display:flex;flex-direction:column;gap:.65rem">
        ${this._sayiSohbetiKartlari.map((c,i)=>`
          <div style="display:flex;gap:.85rem;align-items:flex-start;padding:1rem;background:var(--surface);border:${i===featuredIdx?'2px solid var(--teal)':'1.5px solid var(--border)'};border-radius:var(--r-md)">
            <div style="font-size:1.5rem;flex-shrink:0;min-width:2.5rem;text-align:center">${c.context.split(' ')[0]}</div>
            <div style="flex:1">
              <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted)">${c.context}</p>
              <p style="font-size:var(--t-lg);font-weight:700;margin:.2rem 0;font-style:italic">"${c.prompt}"</p>
              <span class="chip chip-blue" style="font-size:var(--t-xs)">${c.concept}</span>
            </div>
            ${i===featuredIdx?`<span class="chip chip-orange" style="flex-shrink:0">Bugün</span>`:''}
          </div>`).join('')}
      </div>

      <!-- Uygulama notu -->
      <div style="margin-top:1.4rem;background:var(--raised);border-radius:var(--r-md);padding:1rem;border:1.5px solid var(--border)">
        <strong style="font-size:var(--t-md)">📌 Nasıl kullanılır?</strong>
        <p style="font-size:var(--t-md);color:var(--muted);margin-top:.35rem;line-height:1.55">Günde 1 kart yeterli. Soru sorduktan sonra <strong>bekleyin</strong>. Cevap "yanlış" olursa "Hmm, nasıl buldun?" sorun. Düzeltmeyin — keşfettirin.</p>
      </div>

      <!-- Sayı Sohbeti kullandım butonu -->
      <button class="btn btn-primary btn-block" style="margin-top:1.2rem" onclick="App._markSayiSohbetiUsed()">
        💬 Bugün bir kart kullandım!
      </button>
    `;
  }

  _markSayiSohbetiUsed(){
    const p = this._parent; if(!p) return;
    if(p.mathTalkUsed){ this._toast('Zaten kayıtlı ✓','ok'); return; }
    this._parent = {...p, mathTalkUsed:true};
    this._storage.set('parent', this._parent);
    const child = this._getChild();
    if(child){
      const newBadges = this._badgeEng.evaluate(this._parent, child);
      if(newBadges.length){
        this._parent = {...this._parent, badges:[...(this._parent.badges||[]),...newBadges]};
        this._storage.set('parent', this._parent);
        this._confetti();
        setTimeout(()=>this._badgeModal(newBadges[0]), 350);
        return;
      }
    }
    this._toast('Harika! Sayı Sohbeti başladı 💬','ok');
  }

  /* ══════════════════════════════════════════════
     NEFES EGZERSİZİ VIEW
  ══════════════════════════════════════════════ */

  _renderBreathing(){
    // Delege edildi: js/views/BreathingView.js
    // (App.js monoliti kademeli bölünmesi — refactor seed)
    BreathingView.render(this);
  }

  _startBreathing(){
    const steps = this._breathingSteps;
    const totalRounds = 3;
    let round = 0;
    let stepIdx = 0;

    const btn = document.getElementById('breath-btn');
    if(btn) btn.style.display = 'none';

    const runStep = () => {
      if(round >= totalRounds){
        const icon = document.getElementById('breath-icon');
        const label = document.getElementById('breath-label');
        const inst = document.getElementById('breath-instruction');
        const phase = document.getElementById('breath-phase');
        const bar = document.getElementById('breath-bar');
        if(icon) icon.textContent = '✅';
        if(label) label.textContent = 'Tamamlandı!';
        if(inst) inst.textContent = 'Harika iş çıkardınız. Şimdi biraz daha sakin hissedeceksiniz.';
        if(phase) phase.textContent = `${totalRounds} tekrar tamamlandı`;
        if(bar){ bar.style.transition='none'; bar.style.width='100%'; }
        if(btn){ btn.style.display='block'; btn.textContent='Tekrar Yap'; btn.onclick=()=>App._renderBreathing(); }

        // Rozet ve profil güncelle
        const p = this._parent;
        if(p && !p.breathingDone){
          this._parent = {...p, breathingDone:true};
          this._storage.set('parent', this._parent);
          const child = this._getChild();
          if(child){
            const newBadges = this._badgeEng.evaluate(this._parent, child);
            if(newBadges.length){
              this._parent = {...this._parent, badges:[...(this._parent.badges||[]),...newBadges]};
              this._storage.set('parent', this._parent);
              setTimeout(()=>this._badgeModal(newBadges[0]), 600);
            }
          }
        }
        return;
      }

      const step = steps[stepIdx];
      const icon = document.getElementById('breath-icon');
      const label = document.getElementById('breath-label');
      const inst = document.getElementById('breath-instruction');
      const phase = document.getElementById('breath-phase');
      const bar = document.getElementById('breath-bar');

      if(icon){ icon.textContent = step.icon; icon.style.transform = stepIdx===0?'scale(1.3)':stepIdx===1?'scale(1.3)':'scale(0.9)'; }
      if(label) label.textContent = step.label;
      if(inst) inst.textContent = step.instruction;
      if(phase) phase.textContent = `Tekrar ${round+1}/${totalRounds} · Adım ${stepIdx+1}/${steps.length}`;
      if(bar){ bar.style.transition=`width ${step.duration}s linear`; bar.style.width='100%'; setTimeout(()=>{ if(bar){ bar.style.transition='none'; bar.style.width='0%'; }}, 50); }

      setTimeout(()=>{
        stepIdx++;
        if(stepIdx >= steps.length){ stepIdx=0; round++; }
        runStep();
      }, step.duration * 1000);
    };

    runStep();
  }


  toggleFilter(){
    const p = document.getElementById('act-filter-panel');
    const btn = document.getElementById('act-filter-btn');
    const open = p.style.display === 'none' || !p.style.display;
    p.style.display = open ? 'block' : 'none';
    btn.textContent = open ? '🔼 Filtre' : '🔽 Filtre';
    if(open) this._renderActs();
  }

  _setCatFilter(cat){
    this._filter.category = this._filter.category===cat ? null : cat;
    this._renderActs();
  }
  _clearCatFilter(){ this._filter.category=null; this._renderActs(); }
  _toggleAnxFilter(){ this._filter.anxOnly=!this._filter.anxOnly; this._renderActs(); }
  _clearAnxFilter(){ this._filter.anxOnly=false; this._renderActs(); }
  _setAnxFilter(){ this._filter.anxOnly=true; this.show('activities'); }
  _search(v){ this._filter.searchTerm=v; this._renderActs(); }

  _actCard(activity, isDone){
    if(isDone===undefined){ const c=this._getChild(); isDone=(c?.completedActivities||[]).includes(activity.id); }
    const child = this._getChild();
    const isOO = child?.ageGroup === AgeGroup.PRESCHOOL;
    // TYMM mini etiket — okul öncesi için MAB kodu, ilkokul için Tema kodu
    const tymmCodes = isOO ? (activity.tymm_oo||[]) : (activity.tymm_t||[]);
    const tymmChips = tymmCodes.slice(0,2).map(k => {
      const b = isOO ? TYMM.OO[k] : TYMM.IL_TEMA[k];
      return b ? `<span style="font-size:var(--t-xs);background:rgba(17,138,178,.1);color:var(--blue);border-radius:3px;padding:.1rem .35rem;font-weight:700">${b.kod}</span>` : '';
    }).join('');
    return `<div class="card card-interactive${isDone?' card-green':''}" onclick="App._openActivity('${activity.id}')" style="${isDone?'opacity:.72':''}">
      <div class="card-body">
        <div style="display:flex;align-items:flex-start;gap:.875rem">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--raised);display:flex;align-items:center;justify-content:center;font-size:1.75rem;flex-shrink:0;line-height:1">${activity.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;margin-bottom:.2rem">
              <span style="font-size:var(--t-xl);font-weight:800;color:var(--text);line-height:1.25;letter-spacing:-.02em">${activity.title}</span>
              <span style="color:var(--muted);font-size:1.1rem;flex-shrink:0;margin-top:.1rem">›</span>
            </div>
            <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.5rem;line-height:1.55">${activity.desc}</p>
            <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">
              <span style="background:var(--raised);border:1px solid var(--border);border-radius:var(--r-full);padding:.15rem .5rem;font-size:var(--t-xs);font-weight:700;color:var(--muted)">⏱ ${activity.dur} dk</span>
              <span style="background:var(--raised);border:1px solid var(--border);border-radius:var(--r-full);padding:.15rem .5rem;font-size:var(--t-xs);font-weight:700;color:var(--muted)">${this._CatEmoji[activity.category]} ${this._CatLabels[activity.category]}</span>
              ${activity.difficulty?this._difficultyChip(activity.difficulty):''}
              ${isDone?`<span class="chip chip-green">✓ Tamam</span>`:''}
              ${activity.anxFriendly&&!isDone?`<span class="chip chip-yellow">💛 Kaygısız</span>`:''}
              ${activity.dysc?`<span class="chip chip-blue">💙</span>`:''}
              ${tymmChips}
            </div>
          </div>
        </div>
      </div>
      ${this._editBar(activity.id,'activity')}
    </div>`;
  }

  _openActivity(id){
    const a = this._repo.byId(id); if(!a) return;
    const c = this._getChild();
    const done = (c?.completedActivities||[]).includes(id);

    // Telemetry — kullanım sayacı
    this._trackEvent('activity_open', id);

    const body = `
      <div class="center" style="margin-bottom:1.2rem">
        <div style="font-size:3.5rem;margin-bottom:.3rem">${a.emoji}</div>
        <h2 style="line-height:1.2">${a.title}</h2>
        <div style="display:flex;justify-content:center;gap:.4rem;flex-wrap:wrap;margin-top:.5rem">
          <span class="chip chip-orange">⏱ ${a.dur} dk</span>
          <span class="chip chip-blue">${this._CatLabels[a.category]}</span>
          ${a.anxFriendly?`<span class="chip chip-yellow">💛 Kaygı Dostu</span>`:''}
          ${a.dysc?`<span class="chip chip-blue">💙 Diskalkuli</span>`:''}
        </div>
      </div>
      <p style="color:var(--muted);font-size:var(--t-lg);margin-bottom:1rem">${a.desc}</p>

      <!-- R2 FACT — Neden işe yarar? (brain science) -->
      <div style="background:rgba(26,127,166,.08);border-left:4px solid var(--blue);border-radius:0 var(--r-sm) var(--r-sm) 0;padding:.75rem 1rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.25rem">
          <span style="font-size:.95rem">🧠</span>
          <strong style="font-size:var(--t-sm);color:var(--blue);text-transform:uppercase;letter-spacing:.05em">Neden işe yarar?</strong>
        </div>
        <p style="font-size:var(--t-sm);line-height:1.55;color:var(--text2)">${this._factFor(a)}</p>
      </div>

      ${a.materials.length?`
        <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">MALZEME</p>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1.2rem">
          ${a.materials.map(m=>`<span class="chip chip-orange">${m}</span>`).join('')}
        </div>`:''}
      <p style="font-size:var(--t-sm);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.7rem">NASIL YAPILIR?</p>
      <ol style="list-style:none;display:flex;flex-direction:column;gap:.7rem;margin-bottom:1.2rem">
        ${a.steps.map((s,i)=>`
          <li style="display:flex;gap:.75rem;align-items:flex-start">
            <span style="width:26px;height:26px;border-radius:50%;background:var(--teal);color:#fff;font-size:var(--t-sm);font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.1rem">${i+1}</span>
            <p style="font-size:var(--t-lg);line-height:1.55;flex:1">${s}</p>
          </li>`).join('')}
      </ol>

      <!-- R3 SORULAR — Nasıl soracağım? (question taxonomy) -->
      ${this._renderQuestionPrompts(a)}

      <!-- R2 TIP — Pedagojik ipucu -->
      <div style="background:rgba(255,209,102,.18);border-left:4px solid var(--amber);border-radius:0 var(--r-sm) var(--r-sm) 0;padding:.9rem 1.1rem;margin-bottom:${a.sesAlt?'.6rem':'1rem'}">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.2rem">
          <span style="font-size:.95rem">💡</span>
          <strong style="font-size:var(--t-sm);color:#92400E;text-transform:uppercase;letter-spacing:.05em">Nasıl iyi yaparım?</strong>
        </div>
        <p style="font-size:var(--t-md);line-height:1.55">${a.tip}</p>
      </div>

      <!-- R2 GROWTH — Tamamladıktan sonra ne bekleyebilirsiniz? -->
      ${done ? `
      <div style="background:var(--teal-a);border-left:4px solid var(--teal);border-radius:0 var(--r-sm) var(--r-sm) 0;padding:.75rem 1rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.25rem">
          <span style="font-size:.95rem">🌱</span>
          <strong style="font-size:var(--t-sm);color:var(--teal-d);text-transform:uppercase;letter-spacing:.05em">Ne değişti?</strong>
        </div>
        <p style="font-size:var(--t-sm);line-height:1.55;color:var(--text2)">${this._growthFor(a)}</p>
      </div>` : ''}
      ${a.sesAlt?`<div style="background:rgba(45,106,79,.07);border-left:4px solid var(--teal-d);border-radius:0 var(--r-sm) var(--r-sm) 0;padding:.75rem 1rem;margin-bottom:1rem">
        <strong style="font-size:var(--t-sm)">♻️ Alternatif Malzeme (Her Bütçeye Uygun)</strong>
        <p style="font-size:var(--t-sm);margin-top:.25rem;line-height:1.5;color:var(--muted)">${a.sesAlt}</p>
      </div>`:''}
      ${this._buildTymmModal(a)}
      <div style="margin-bottom:.4rem">
        <label style="font-size:var(--t-sm);font-weight:700;display:block;margin-bottom:.4rem">📝 Gözlem Notu <span style="font-weight:400;color:var(--muted)">(isteğe bağlı)</span></label>
        <textarea placeholder="Nasıl geçti? Ne fark ettin? Çocuğun ne söyledi?..." style="width:100%;padding:.65rem .85rem;border:1.5px solid var(--border);border-radius:var(--r-md);font-family:var(--ff-body);font-size:var(--t-md);resize:none;height:70px;background:var(--surface);color:var(--text);box-sizing:border-box" oninput="App._saveNote('${id}',this.value)">${App._getNote(id)}</textarea>
      </div>
    `;

    const footer = `
      <div class="modal-footer-row" style="flex-wrap:wrap;gap:.4rem">
        <button class="btn btn-ghost" onclick="App._closeModal()" aria-label="Kapat">Kapat</button>
        <button class="btn btn-soft" onclick="App._shareActivityOnWhatsApp('${id}')" aria-label="WhatsApp'ta paylaş" title="WhatsApp'ta paylaş" style="flex:0 0 auto;min-width:48px">
          <span aria-hidden="true">📤</span>
        </button>
        ${done
          ? `<div class="modal-done-pill" role="status"><span aria-hidden="true">✓</span><span>Tamamlandı</span></div>`
          : `<button class="btn btn-primary" onclick="App._complete('${id}')" aria-label="Etkinliği tamamla">✓ Tamamladım</button>`
        }
      </div>
    `;

    this._openModal(body, footer);
  }

  /* ══════════════════════════════════════════════
     E — Telemetry (yerel, sunucusuz)
     Sadece localStorage'da sayaç tutar. Hiçbir yere gönderilmez.
     Kullanım:
       _trackEvent('activity_open', 'a01')
       _trackEvent('activity_complete', 'a01')
       _trackEvent('share_whatsapp', 'a01')
     _getPopularActivities() en çok açılan aktiviteleri döndürür.
  ══════════════════════════════════════════════ */

  _trackEvent(event, id){
    try{
      const stats = this._storage.get('telemetry', { open:{}, complete:{}, share:{} });
      const bucket = event === 'activity_complete' ? 'complete'
                   : event === 'share_whatsapp'    ? 'share'
                   : 'open';
      stats[bucket][id] = (stats[bucket][id] || 0) + 1;
      stats.lastUpdated = new Date().toISOString();
      this._storage.set('telemetry', stats);
    }catch(_){ /* sessiz fail */ }
  }

  _getPopularActivities(limit = 3){
    const stats = this._storage.get('telemetry', { open:{}, complete:{}, share:{} });
    // Skor: complete × 3 + open × 1 + share × 2
    const scores = {};
    Object.entries(stats.open || {}).forEach(([id,n]) => { scores[id] = (scores[id]||0) + n; });
    Object.entries(stats.complete || {}).forEach(([id,n]) => { scores[id] = (scores[id]||0) + n * 3; });
    Object.entries(stats.share || {}).forEach(([id,n]) => { scores[id] = (scores[id]||0) + n * 2; });
    return Object.entries(scores)
      .sort((a,b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => ({ id, score, activity: this._repo.byId(id) }))
      .filter(x => x.activity);
  }

  _renderPopularCard(){
    const popular = this._getPopularActivities(3);
    if(popular.length === 0) return '';
    return `
      <div style="margin-bottom:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
          <span style="font-size:var(--t-xs);font-weight:900;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)">⭐ En Çok Yaptıklarınız</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:.45rem">
          ${popular.map(p => `
            <div onclick="App._openActivity('${p.id}')" role="button" tabindex="0"
              style="display:flex;align-items:center;gap:.7rem;padding:.55rem .75rem;
                background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);
                cursor:pointer;-webkit-tap-highlight-color:transparent"
              onkeydown="if(event.key==='Enter')App._openActivity('${p.id}')">
              <span style="font-size:1.4rem;line-height:1">${p.activity.emoji}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:var(--t-sm);font-weight:700;line-height:1.3">${p.activity.title}</div>
                <div style="font-size:.58rem;color:var(--muted);margin-top:.1rem">${p.score} etkileşim puanı</div>
              </div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--hint)" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     C — WhatsApp paylaşım (Türkiye'de %97+ penetrasyon)
     wa.me deeplink ile etkinlik özetini paylaşmak için yeni
     bir mesaj penceresi açar. Herhangi bir server veya API
     gerektirmez — doğal tarayıcı yönlendirmesi.
  ══════════════════════════════════════════════ */
  _shareActivityOnWhatsApp(id){
    const a = this._repo.byId(id); if(!a) return;
    const catLabel = this._CatLabels[a.category] || '';
    const parts = [
      `${a.emoji} *${a.title}*`,
      '',
      a.desc,
      '',
      `⏱ ${a.dur} dk · ${catLabel}`,
      '',
      '📝 *Nasıl yapılır?*',
      ...a.steps.map((s, i) => `${i+1}. ${s}`),
      '',
      '💡 ' + a.tip,
      '',
      '— ABMATO · Anne-Baba Matematik Okulu',
      'https://ymutlu49.github.io/abmat/',
    ];
    const text = parts.join('\n');
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    // Yeni pencerede aç
    try{
      window.open(url, '_blank', 'noopener,noreferrer');
      // Telemetry — paylaşım sayacı
      if(typeof this._trackEvent === 'function') this._trackEvent('share_whatsapp', id);
      this._toast('WhatsApp\'ta paylaşılıyor…', 'ok');
    }catch(err){
      this._toast('Paylaşım açılamadı', 'err');
    }
  }

  _complete(id){
    const p=this._parent; if(!p) return;
    const child=this._getChild(); if(!child) return;
    if((child.completedActivities||[]).includes(id)) return;

    // Telemetry — tamamlama
    this._trackEvent('activity_complete', id);

    const updChild = {...child, completedActivities:[...(child.completedActivities||[]), id]};
    const updParent = {...p, children:p.children.map(c=>c.id===child.id?updChild:c)};
    this._parent = updParent;

    // Badges
    const newBadges = this._badgeEng.evaluate(updParent, updChild);
    if(newBadges.length){
      this._parent = {...updParent, badges:[...(updParent.badges||[]), ...newBadges]};
    }
    this._storage.set('parent', this._parent);

    // R5 — Haftalık ritim kaydı (streak yerine)
    const rhythm = this._streakSvc.recordActivity();

    this._closeModal();

    if(newBadges.length){
      this._confetti();
      setTimeout(()=>this._badgeModal(newBadges[0]), 350);
    } else if(rhythm.thisWeekCount >= rhythm.goal){
      this._toast(`🌟 Bu hafta hedefi aştınız! (${rhythm.thisWeekCount}/${rhythm.goal})`, 'ok');
    } else if(rhythm.thisWeekCount === rhythm.goal - 1){
      this._toast(`Harika! Hedefe 1 etkinlik kaldı 💪`, 'ok');
    } else {
      this._toast(`Etkinlik tamamlandı 🎉 (${rhythm.thisWeekCount}/${rhythm.goal} bu hafta)`, 'ok');
    }

    // Zorluk geri bildirimi iste (3. etkinlikten sonra, her 3'te bir)
    const totalDone = updChild.completedActivities.length;
    if(totalDone >= 2 && totalDone % 3 === 0){
      setTimeout(()=>this._askDifficulty(id), 1200);
    }

    if(this._activeView==='dashboard') this._renderDash();
    if(this._activeView==='activities') this._renderActs();
    if(this._activeView==='progress') this._renderProgress();
  }

  _askDifficulty(actId){
    this._openModal(`
      <div class="center" style="margin-bottom:1rem">
        <div style="font-size:2.5rem;margin-bottom:.4rem">🎯</div>
        <h3>Bu etkinlik nasıldı?</h3>
        <p class="muted" style="font-size:var(--t-md);margin-top:.3rem">Cevabınız bir sonraki öneriyi kişiselleştirmek için kullanılır.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:.6rem">
        ${[
          {key:'easy', emoji:'😊', label:'Çok kolaydı, daha zorunu deneyelim'},
          {key:'ok',   emoji:'👍', label:'Tam uygundu, böyle devam'},
          {key:'hard', emoji:'😅', label:'Biraz zorlandık, daha kolay olsun'},
        ].map(o=>`
          <button style="display:flex;align-items:center;gap:.9rem;padding:.9rem 1.1rem;border:1.5px solid var(--border);border-radius:var(--r-md);background:var(--surface);cursor:pointer;transition:var(--t);text-align:left;width:100%"
            onmouseover="this.style.borderColor='var(--teal)'"
            onmouseout="this.style.borderColor='var(--border)'"
            onclick="App._saveDifficulty('${actId}','${o.key}')">
            <span style="font-size:1.6rem">${o.emoji}</span>
            <span style="font-size:var(--t-md);font-weight:700">${o.label}</span>
          </button>`).join('')}
      </div>
    `);
  }

  _saveDifficulty(actId, difficulty){
    this._adaptEng.recordFeedback(actId, difficulty);
    this._closeModal();
    const msgs = {
      easy:'Anladık! Bir sonraki önerimiz daha zorlayıcı olacak 💪',
      ok:'Mükemmel denge! Aynı seviyeye devam 🎯',
      hard:'Tamam, tempo biraz düşürelim 🌱',
    };
    this._toast(msgs[difficulty]||'Kaydedildi ✓','ok');
  }

  /* ══════════════════════════════════════════════
     TEACHER BRIDGE (Faz 2)
  ══════════════════════════════════════════════ */

  _renderTeacher(){
    const msgs = this._teacherSvc.getMessages();
    const prog = this._teacherSvc.getSubjectProgress();

    document.getElementById('teacher-body').innerHTML=`
      <!-- Progress map -->
      <div style="margin-bottom:1.5rem">
        <div class="sec-header"><span class="sec-title">📊 Konu İlerleme Haritası</span></div>
        <div class="card">
          <div class="card-body" style="display:flex;flex-direction:column;gap:1rem">
            ${prog.map(p=>`
              <div class="skill-bar">
                <div class="skill-label"><span>${p.subject}</span><span style="color:var(--teal)">${p.pct}%</span></div>
                <div class="progress"><div class="progress-fill" style="width:${p.pct}%"></div></div>
              </div>`).join('')}
            <p class="muted" style="font-size:var(--t-sm);margin-top:.3rem">* Öğretmen tarafından güncellenen veriler</p>
          </div>
        </div>
      </div>

      <!-- Weekly note input -->
      <div style="margin-bottom:1.5rem">
        <div class="sec-header"><span class="sec-title">📋 Bu Haftanın Konusu</span></div>
        <div class="card">
          <div class="card-body">
            ${this._teacherSvc.getWeeklyNote()?
              `<div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-sm) var(--s-sm);font-size:var(--t-lg);margin-bottom:.8rem;line-height:1.55">${this._teacherSvc.getWeeklyNote().text}</div>`:
              `<p class="muted" style="font-size:var(--t-md);margin-bottom:.8rem">Öğretmenin bu haftaki notu henüz yok.</p>`}
            <textarea class="input" id="teacher-note-inp" placeholder="Öğretmenin notu (simülasyon — gerçek uygulamada öğretmen girer)…" style="font-size:var(--t-md)"></textarea>
            <button class="btn btn-blue btn-sm btn-block" style="margin-top:.6rem" onclick="App._saveTeacherNote()">Notu Kaydet</button>
          </div>
        </div>
      </div>

      <!-- Message thread -->
      <div style="margin-bottom:1.2rem">
        <div class="sec-header"><span class="sec-title">💬 Mesajlaşma</span></div>
        <div class="card">
          <div style="max-height:280px;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.55rem" id="msg-thread">
            ${msgs.length?msgs.map(m=>`
              <div style="display:flex;flex-direction:column;${m.isTeacher?'align-items:flex-start':'align-items:flex-end'}">
                <div class="msg-bubble ${m.isTeacher?'msg-in':'msg-out'}">${m.text}</div>
                <span class="msg-time">${m.isTeacher?'👩‍🏫 Öğretmen':'👤 Siz'} · ${this._relTime(m.date)}</span>
              </div>`).join('')
              :`<p class="muted center" style="padding:.5rem;font-size:var(--t-md)">Henüz mesaj yok. İlk mesajı siz gönderin!</p>`}
          </div>
          <!-- Input -->
          <div style="border-top:1.5px solid var(--border);padding:var(--s-sm) var(--s-sm) 1rem;display:flex;gap:.6rem">
            <input class="input" id="msg-inp" placeholder="Mesajınızı yazın…" style="flex:1;padding:.65rem .9rem;font-size:var(--t-lg)" onkeydown="event.key==='Enter'&&App._sendMsg()">
            <button class="btn btn-primary btn-sm" onclick="App._sendMsg()">Gönder</button>
          </div>
        </div>
      </div>

      <!-- Simulate teacher reply -->
      <button class="btn btn-ghost btn-sm btn-block" onclick="App._teacherReply()">
        🤖 Öğretmen Yanıtını Simüle Et
      </button>
    `;
  }

  _saveTeacherNote(){
    const text = document.getElementById('teacher-note-inp')?.value.trim();
    if(!text){ this._toast('Not boş olamaz','err'); return; }
    this._teacherSvc.setWeeklyNote(text);
    this._toast('Not kaydedildi ✓','ok');
    this._renderTeacher();
  }

  _sendMsg(){
    const inp=document.getElementById('msg-inp'); if(!inp) return;
    const text=inp.value.trim(); if(!text) return;
    this._teacherSvc.addMessage(text, false);
    inp.value='';
    // Badge check
    const p=this._parent;
    if(p){
      const msgs=this._teacherSvc.getMessages();
      if(msgs.filter(m=>!m.isTeacher).length===1){
        this._parent={...p,teacherMessages:[...(p.teacherMessages||[]),{date:new Date()}]};
        this._storage.set('parent',this._parent);
        const badges=this._badgeEng.evaluate(this._parent, this._getChild());
        if(badges.length){ this._parent={...this._parent,badges:[...(this._parent.badges||[]),...badges]}; this._storage.set('parent',this._parent); setTimeout(()=>this._badgeModal(badges[0]),600); }
      }
    }
    this._renderTeacher();
  }

  _teacherReply(){
    const replies=[
      'Merhaba! Bu hafta kesirler konusunu işliyoruz. Evde somut materyallerle alıştırma yapabilirsiniz.',
      'Ali bu hafta geometri konusunda çok güzel sorular sordu, tebrikler! 🌟',
      'Toplama işlemlerinde hız artıyor. Günlük pratik çok faydalı olacaktır.',
      'Bu haftaki ev etkinliği için teşekkürler, Ali sınıfta paylaştı 😊',
    ];
    const text=replies[Math.floor(Math.random()*replies.length)];
    this._teacherSvc.addMessage(text, true);
    this._notifSvc.addNotif({ emoji:'👩‍🏫', title:'Öğretmenden Yanıt', text });
    this._toast('Öğretmen yanıt verdi!','ok');
    this._renderTeacher();
    this._updateNotifDot();
  }

  /* ══════════════════════════════════════════════
     WEEKLY PLANNER (Faz 2)
  ══════════════════════════════════════════════ */

  _renderPlanner(){
    const plan=this._plannerSvc.getWeekPlan();
    const child=this._getChild();
    const today=new Date().getDay(); // 0=Sun
    const todayIdx=(today+6)%7; // Mon=0

    document.getElementById('planner-body').innerHTML=`
      <p class="muted" style="font-size:var(--t-md);margin-bottom:1.2rem">Haftanın hangi günleri etkinlik yapacaksınız? Güne dokunarak etkinlik atayın.</p>
      <!-- Day grid -->
      <div class="grid-3" style="margin-bottom:1.4rem;grid-template-columns:repeat(7,1fr);gap:.4rem">
        ${this._DAYS.map((d,i)=>{
          const aid=plan[i];
          const act=aid?this._repo.byId(aid):null;
          const isToday=i===todayIdx;
          return `<div class="day-col ${aid?'has-activity':''} ${isToday?'today':''}" onclick="App._planDayClick(${i})">
            <div class="day-name" style="${isToday?'color:var(--teal-d)':''}">${d}</div>
            <div class="day-emoji">${act?act.emoji:isToday?'📍':'+'}</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Plan summary -->
      <div class="sec-header"><span class="sec-title">Bu Haftanın Planı</span></div>
      <div style="display:flex;flex-direction:column;gap:.65rem;margin-bottom:1.2rem">
        ${Object.entries(plan).length?
          Object.entries(plan).map(([dayIdx,actId])=>{
            const act=this._repo.byId(actId);
            if(!act) return '';
            return `<div class="card card-sm" style="cursor:pointer" onclick="App._openActivity('${actId}')">
              <div class="card-body" style="display:flex;align-items:center;gap:.85rem;padding:var(--s-sm) var(--s-sm) 1rem">
                <div style="font-size:1.7rem">${act.emoji}</div>
                <div style="flex:1">
                  <strong style="font-size:var(--t-lg)">${this._DAYS[dayIdx]}</strong>
                  <p style="font-size:var(--t-md);color:var(--muted)">${act.title}</p>
                </div>
                <button onclick="event.stopPropagation();App._removeFromPlan(${dayIdx})" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:var(--t-xl);padding:.2rem .4rem" title="Kaldır">×</button>
              </div>
            </div>`;
          }).join('')
          :`<p class="muted center" style="padding:1.5rem;font-size:var(--t-md)">Henüz planlı etkinlik yok. "Otomatik Plan" butonunu deneyin!</p>`}
      </div>

      <!-- Progress this week -->
      <div class="card" style="margin-top:.5rem">
        <div class="card-body">
          <strong style="font-size:var(--t-lg)">Haftalık İlerleme</strong>
          <div style="margin-top:.7rem">
            <div style="display:flex;justify-content:space-between;font-size:var(--t-md);margin-bottom:.3rem">
              <span>Tamamlanan</span>
              <span style="color:var(--teal)">${Object.keys(plan).filter(d=>child&&(child.completedActivities||[]).includes(plan[d])).length} / ${Object.keys(plan).length} planlı</span>
            </div>
            <div class="progress">
              <div class="progress-fill" style="width:${Object.keys(plan).length?Math.round(Object.keys(plan).filter(d=>child&&(child.completedActivities||[]).includes(plan[d])).length/Object.keys(plan).length*100):0}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _planDayClick(dayIdx){
    const c=this._getChild(); if(!c) return;
    const acts=this._repo.byAgeGroup(c.ageGroup);
    this._openModal(`
      <h3 style="margin-bottom:1rem">${this._DAYS[dayIdx]} için etkinlik seç</h3>
      <div style="display:flex;flex-direction:column;gap:.55rem;max-height:55vh;overflow-y:auto">
        ${acts.map(a=>`
          <div style="display:flex;align-items:center;gap:.8rem;padding:.75rem;border:1.5px solid var(--border);border-radius:var(--r-md);cursor:pointer" onclick="App._assignToPlan(${dayIdx},'${a.id}')">
            <span style="font-size:1.6rem">${a.emoji}</span>
            <div><strong style="font-size:var(--t-lg)">${a.title}</strong><p class="muted" style="font-size:var(--t-sm)">⏱ ${a.dur} dk · ${this._CatLabels[a.category]}</p></div>
          </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm btn-block" style="margin-top:1rem" onclick="App._closeModal()">İptal</button>
    `);
  }

  _assignToPlan(dayIdx, actId){
    this._plannerSvc.setDayActivity(dayIdx, actId);
    const p=this._parent;
    if(p&&!(p.weeklyPlans||[]).length){ this._parent={...p,weeklyPlans:[{date:new Date()}]}; this._storage.set('parent',this._parent); }
    this._closeModal();
    this._toast('Plana eklendi ✓','ok');
    this._renderPlanner();
  }

  _removeFromPlan(dayIdx){ this._plannerSvc.clearDay(dayIdx); this._renderPlanner(); }

  autoplan(){
    const c=this._getChild(); if(!c) return;
    this._plannerSvc.autoGenerate(c);
    this._toast('Otomatik plan oluşturuldu ✨','ok');
    this._renderPlanner();
  }

  /* ══════════════════════════════════════════════
     PROGRESS (Faz 3)
  ══════════════════════════════════════════════ */

  _renderProgress(){
    const p=this._parent; if(!p) return;
    const c=this._getChild(); if(!c) return;
    const done=c.completedActivities||[];
    const allActs = this._repo.byAgeGroup(c.ageGroup);
    const total=allActs.length;
    const pct=Math.round(done.length/total*100)||0;

    // Category breakdown
    const catDone={};
    done.forEach(id=>{ const a=this._repo.byId(id); if(a) catDone[a.category]=(catDone[a.category]||0)+1; });
    const catTotal={};
    allActs.forEach(a=>catTotal[a.category]=(catTotal[a.category]||0)+1);

    // Streak
    const streak = this._streakSvc.getData();

    // Kaygı profili — eksik değişkenler
    const anxLevel = p.anxietyProfile?.level;
    const anxScore = p.anxietyProfile?.score||0;
    const anxColor = anxLevel===AnxietyLevel.LOW?'var(--success)':anxLevel===AnxietyLevel.MEDIUM?'var(--amber)':'var(--danger)';
    const anxEmoji = anxLevel===AnxietyLevel.LOW?'😌':anxLevel===AnxietyLevel.MEDIUM?'🤔':'😰';
    const anxLabel = anxLevel===AnxietyLevel.LOW?'Düşük':anxLevel===AnxietyLevel.MEDIUM?'Orta':'Yüksek';

    document.getElementById('prog-body').innerHTML=`
      <!-- Genel İlerleme -->
      <div style="background:var(--surface);border-radius:var(--r-xl);border:0.5px solid var(--border);padding:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:1rem">
        <div style="position:relative;width:68px;height:68px;flex-shrink:0">
          <svg viewBox="0 0 36 36" width="68" height="68" style="transform:rotate(-90deg)">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--raised)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--teal)" stroke-width="3"
              stroke-dasharray="${pct} ${100-pct}" stroke-linecap="round"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.9375rem;font-family:var(--ff-mono);color:var(--teal)">${pct}%</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:1.0625rem;font-weight:800;color:var(--text)">${this._esc(c.name)}</div>
          <div style="font-size:var(--t-sm);color:var(--muted);margin-top:.12rem">${done.length} / ${total} etkinlik</div>
          <div style="margin-top:.5rem;background:var(--raised);border-radius:99px;height:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--teal-l),var(--teal));border-radius:99px"></div>
          </div>
        </div>
      </div>

      <!-- Metrikler -->
      <div class="metric-row" style="margin-bottom:1rem">
        <div class="metric-cell">
          <div class="metric-icon">🎯</div>
          <div class="metric-val">${done.length}</div>
          <div class="metric-label">Etkinlik</div>
        </div>
        <div class="metric-cell">
          <div class="metric-icon">${anxEmoji}</div>
          <div class="metric-val" style="font-size:1.25rem;color:${anxColor}">${anxScore}%</div>
          <div class="metric-label">Kaygı</div>
        </div>
        <div class="metric-cell">
          <div class="metric-icon">🔥</div>
          <div class="metric-val">${streak.count}</div>
          <div class="metric-label">Seri</div>
        </div>
      </div>

      <!-- Beceri Analizi -->
      <div class="sec-header" style="margin-bottom:.6rem"><span class="sec-title">Beceri Analizi</span></div>
      <div style="background:var(--surface);border-radius:var(--r-lg);border:0.5px solid var(--border);overflow:hidden;margin-bottom:1rem">
        <div style="padding:.875rem .9rem;display:flex;flex-direction:column;gap:.75rem">
          ${Object.entries(this._CatLabels).map(([cat,label])=>{
            const d=catDone[cat]||0; const t=catTotal[cat]||0;
            if(t===0) return '';
            const cp=Math.round(d/t*100);
            const bc=cp>=70?'var(--teal)':cp>=40?'var(--amber)':'var(--danger)';
            return '<div>'
              +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem">'
              +'<span style="font-size:var(--t-sm);font-weight:700;color:var(--text)">'+this._CatEmoji[cat]+' '+label+'</span>'
              +'<span style="font-size:var(--t-xs);font-weight:800;color:'+bc+';font-family:var(--ff-mono)">'+d+'/'+t+'</span>'
              +'</div>'
              +'<div style="background:var(--raised);border-radius:99px;height:5px;overflow:hidden">'
              +'<div style="height:100%;width:'+cp+'%;background:'+bc+';border-radius:99px;transition:width .6s"></div>'
              +'</div></div>';
          }).join('')}
        </div>
      </div>

      <!-- Tamamlanan etkinlikler -->
      <div class="sec-header" style="margin-bottom:.6rem"><span class="sec-title">Tamamlanan Etkinlikler</span></div>
      ${done.length===0
        ?'<div class="empty-state"><div class="empty-state-icon">🌱</div><p style="font-size:var(--t-md);font-weight:700;margin-bottom:.3rem">Henüz tamamlanan etkinlik yok.</p><p style="font-size:var(--t-sm);color:var(--muted)">Etkinlikler sekmesinden başlayın.</p></div>'
        :'<div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem">'
          +done.slice().reverse().slice(0,8).map(id=>{
            const a=this._repo.byId(id);
            if(!a) return '';
            return '<div style="display:flex;align-items:center;gap:.75rem;background:var(--surface);border:0.5px solid var(--border);border-radius:var(--r-md);padding:.65rem .875rem">'
              +'<span style="font-size:1.25rem;flex-shrink:0">'+a.emoji+'</span>'
              +'<div style="flex:1;min-width:0">'
              +'<div style="font-size:var(--t-sm);font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+a.title+'</div>'
              +'<div style="font-size:var(--t-xs);color:var(--muted)">'+this._CatLabels[a.category]+' · '+a.dur+' dk</div>'
              +'</div>'
              +'<span style="color:var(--teal)">✓</span></div>';
          }).join('')
          +(done.length>8?'<p style="text-align:center;font-size:var(--t-xs);color:var(--muted);margin-top:.3rem">+'+(done.length-8)+' etkinlik daha</p>':'')
          +'</div>'
      }

      <!-- Zhao 2023 -->
      <div style="background:var(--teal-a);border-radius:var(--r-md);padding:.875rem;border:0.5px solid var(--border);margin-bottom:1rem">
        <p style="font-size:var(--t-sm);color:var(--text2);line-height:1.65;font-style:italic">
          "Gözlem notu yazan ebeveynler çocuklarındaki ilerlemeyi daha net görüyor" — <em style="color:var(--muted)">Zhao ve ark., 2023</em>
        </p>
      </div>
    `  }


  showShareProgress(){
    this._toast('Paylaşım özelliği yakında! 📤');
  }

  /* ══════════════════════════════════════════════
     DYSCALCULIA MODULE (Faz 3)
  ══════════════════════════════════════════════ */

  _renderDysc(){
    const signals=[
      { level:'red',  text:'Sayı sırasını sık sık karıştırıyor (5, 3, 7 yerine 5, 7, 3)' },
      { level:'red',  text:'Parmak saymayı ilerlemiş yaşta da bırakmıyor' },
      { level:'red',  text:'Benzer rakamları (6-9, 2-5) sık sık karıştırıyor' },
      { level:'yellow',text:'Basit toplama/çıkarma işlemlerinde diğer çocuklardan belirgin yavaş' },
      { level:'yellow',text:'Saati, takvimi kavramakta güçlük çekiyor' },
      { level:'yellow',text:'Para işlemlerinde çok zorlanıyor' },
      { level:'green', text:'Sözel problem çözebiliyor ama sembolik işlemde zorlanıyor' },
      { level:'green', text:'Geometri ve görsel-uzamsal becerilerde güçlü' },
    ];
    const emojiMap={ red:'🔴', yellow:'🟡', green:'🟢' };
    const strategies=[
      { emoji:'🖐️', title:'Somut Nesnelerle Çalışın', desc:'Fasulye, taş, küp gibi nesneler soyut rakamların köprüsüdür. Çoklu duyusal yol (görsel+dokunsal) en etkili müdahaledir.' },
      { emoji:'🎵', title:'Ritim ve Müzik Kullanın', desc:'Sayı şarkıları ve ritmik sayma, zayıf hafıza izlerini güçlendirir. Müzik eğitimi sayı sıralama becerisini artırıyor (EDSense, 2025).' },
      { emoji:'⏱️', title:'Zaman Baskısını Kaldırın', desc:'Diskalkuli olan çocuklar baskı altında çok daha kötü performans gösterir. Süre vermeden çalışın.' },
      { emoji:'📐', title:'Görsel Temsil Kullanın', desc:'Sayı doğrusu, onluk bloklar ve renk kodlaması etkilidir. Sayıyı renkle ve konumla ilişkilendirin.' },
      { emoji:'🔄', title:'Tekrar ve Rutinle Pekiştirin', desc:'20 dakikalık bireysel seanslar uzun grup çalışmalarından daha etkili (MDPI Derleme, 2025).' },
      { emoji:'💬', title:'Öğretmenle İş Birliği Yapın', desc:'Okul ve ev desteğinin koordineli olması kritiktir. Öğretmenden hangi alt becerinin eksik olduğunu sorun.' },
    ];

    const el = document.getElementById('dysc-body'); if(!el) return;
    el.innerHTML=`
      <!-- Intro -->
      <div style="background:linear-gradient(135deg,rgba(17,138,178,.08) 0%,rgba(17,138,178,.03) 100%);border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1.4rem;border:1.5px solid rgba(17,138,178,.2)">
        <h3 style="color:var(--blue);margin-bottom:.5rem">💙 Diskalkuli Nedir?</h3>
        <p style="font-size:var(--t-lg);line-height:1.65">Diskalkuli, sayıları işlemede ve matematiksel hesaplarda yaşanan nörogelişimsel bir güçlüktür. Tembellik, dikkatsizlik veya zekâ düzeyiyle ilgisi yoktur. Okul çağı çocuklarının %5-7'sini etkiliyor — disleziyle aynı oran. Erken tanıma ve doğru destekle büyük fark yaratılabilir.</p>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.65rem">
          <span class="chip chip-blue">%5-7 çocuk etkileniyor</span>
          <span class="chip chip-green">Erken tanıma kritik</span>
          <span class="chip chip-orange">3 yaşından tarama mümkün</span>
        </div>
      </div>

      <!-- MİNİ TARAMA OYUNU -->
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">🔍 Alt Tip Rehberi</span></div>
        <p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem;line-height:1.6">Diskalkuli homojen değil — alt tipler farklı yaklaşımlar gerektiriyor. <em style="font-size:var(--t-xs)">(Butterworth, 2019)</em></p>
        <div style="display:flex;flex-direction:column;gap:.7rem;margin-bottom:1rem">
          ${[
            { icon:'🔢', baslik:'Sayı Hissi Açığı', renk:'var(--blue)',
              belirtiler:'Nesneleri saymakta güçlük, büyüklük karşılaştırmasında tutarsızlık.',
              yaklasim:'Beşlik/onluk kart, sayı doğrusu, subitizing (şipşak sayma) egzersizleri.' },
            { icon:'⚡', baslik:'Olgu Hatırlama Güçlüğü', renk:'var(--teal)',
              belirtiler:'4+3 gibi basit toplama olgularını her seferinde sayarak çözüyor.',
              yaklasim:'Ezberleme değil strateji: katlar, 10\'a tamamlama, sayı ailesi oyunları.' },
            { icon:'🧠', baslik:'Çalışma Belleği Sorunları', renk:'var(--purple)',
              belirtiler:'Adım adım işlemlerde ara sonuçları unutuyor, "ne soruluyordu?" diyor.',
              yaklasim:'Görsel destekler — kağıda yaz, adımları parçala, tek anda tek işlem.' },
            { icon:'📍', baslik:'Uzamsal Sayı Temsili', renk:'var(--teal-d)',
              belirtiler:'Sayı doğrusunda sayıların konumunu karıştırıyor, rakamları ters yazıyor.',
              yaklasim:'Yere büyük sayı doğrusu çiz, sayıları hareketle ilişkilendir.' },
          ].map(t=>`
            <div style="border:1.5px solid var(--border);border-radius:var(--r-md);overflow:hidden">
              <div style="padding:.6rem .9rem;background:${t.renk}15;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.5rem">
                <span style="font-size:1.2rem">${t.icon}</span>
                <strong style="font-size:var(--t-md);color:${t.renk}">${t.baslik}</strong>
              </div>
              <div style="padding:.65rem .9rem">
                <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.3rem"><strong style="color:var(--text)">Belirtiler:</strong> ${t.belirtiler}</p>
                <p style="font-size:var(--t-sm);line-height:1.55"><strong>Ne yapın:</strong> ${t.yaklasim}</p>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="background:rgba(255,209,102,.12);border-radius:var(--r-md);padding:.75rem .9rem;border:1px solid rgba(255,209,102,.35);margin-bottom:1.4rem">
          <p style="font-size:var(--t-sm);line-height:1.65">⚠️ <strong>Önemli:</strong> Diskalkuli tanısı yalnızca eğitim psikoloğu veya RAM tarafından konulabilir. Bu rehber bilgilendirme amaçlıdır — ciddi güçlük gözlemlenirse okul rehber öğretmenine başvurun.</p>
        </div>
      </div>

      <!-- MİNİ TARAMA OYUNU -->
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">🎮 Mini Gözlem Oyunu (3+ yaş)</span></div>
        <div class="card">
          <div class="card-body" style="padding:var(--s-lg)">
            <p style="font-size:var(--t-md);line-height:1.55;color:var(--muted);margin-bottom:1rem">Bu oyunu <strong>çocuğunuzla birlikte</strong> oynayın. Gözlemlerinizi işaretleyin. Bu bir tanı aracı değil — uzman görüşüne yönlendirecek erken sinyaller verir.</p>
            <div id="dysc-game-container">
              <div id="dysc-game-step-0" style="display:block">
                <div style="background:linear-gradient(135deg,rgba(17,138,178,.1),rgba(17,138,178,.04));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:.9rem;text-align:center">
                  <div style="font-size:3rem;margin-bottom:.5rem">●  ●  ●</div>
                  <p style="font-weight:700;margin-bottom:.3rem">Kaç nokta var?</p>
                  <p class="muted" style="font-size:var(--t-md)">Çocuğunuza sorun. Görmeden saymasını istemeden "kaç?" deyin.</p>
                </div>
                <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.6rem">Çocuğunuz ne yaptı?</p>
                <div style="display:flex;flex-direction:column;gap:.5rem" id="dysc-opts-0">
                  ${[
                    {v:'ok', label:'Hemen "3" dedi (subitizing ✓)'},
                    {v:'count', label:'Tek tek saydı (normal okul öncesi)'},
                    {v:'wrong', label:'Yanlış söyledi veya çok zorlandı'},
                  ].map(o=>`<button style="display:flex;align-items:center;gap:.75rem;padding:var(--s-sm) var(--s-md);border:1.5px solid var(--border);border-radius:var(--r-md);background:var(--surface);cursor:pointer;text-align:left;width:100%;transition:var(--t)" onmouseover="this.style.borderColor='var(--teal)'" onmouseout="this.style.borderColor='var(--border)'" onclick="App._dyscGameNext(0,'${o.v}')">
                    <span style="font-size:1.3rem">${o.v==='ok'?'😊':o.v==='count'?'🤔':'⚠️'}</span>
                    <span style="font-size:var(--t-md)">${o.label}</span>
                  </button>`).join('')}
                </div>
              </div>

              <div id="dysc-game-step-1" style="display:none">
                <div style="background:linear-gradient(135deg,rgba(17,138,178,.1),rgba(17,138,178,.04));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:.9rem;text-align:center">
                  <div style="font-size:1.8rem;letter-spacing:.3rem;font-weight:900">6  9</div>
                  <p style="font-weight:700;margin-top:.5rem;margin-bottom:.3rem">Hangi rakam daha büyük?</p>
                  <p class="muted" style="font-size:var(--t-md)">Gösterin, birlikte bakın.</p>
                </div>
                <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.6rem">Çocuğunuz ne yaptı?</p>
                <div style="display:flex;flex-direction:column;gap:.5rem">
                  ${[
                    {v:'ok',    label:'Hızlıca doğru cevap verdi'},
                    {v:'slow',  label:'Doğru ama uzun sürdü / emin olamadı'},
                    {v:'wrong', label:'6 ve 9\'u karıştırdı veya yanlış seçti'},
                  ].map(o=>`<button style="display:flex;align-items:center;gap:.75rem;padding:var(--s-sm) var(--s-md);border:1.5px solid var(--border);border-radius:var(--r-md);background:var(--surface);cursor:pointer;text-align:left;width:100%;transition:var(--t)" onmouseover="this.style.borderColor='var(--teal)'" onmouseout="this.style.borderColor='var(--border)'" onclick="App._dyscGameNext(1,'${o.v}')">
                    <span style="font-size:1.3rem">${o.v==='ok'?'😊':o.v==='slow'?'🤔':'⚠️'}</span>
                    <span style="font-size:var(--t-md)">${o.label}</span>
                  </button>`).join('')}
                </div>
              </div>

              <div id="dysc-game-step-2" style="display:none">
                <div style="background:linear-gradient(135deg,rgba(17,138,178,.1),rgba(17,138,178,.04));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:.9rem;text-align:center">
                  <p style="font-size:1.3rem;font-weight:900">3 + 2 = ?</p>
                  <p class="muted" style="font-size:var(--t-md);margin-top:.4rem">Kafadan söyleyin. Parmak kullanmasına izin verin.</p>
                </div>
                <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.6rem">Çocuğunuz ne yaptı?</p>
                <div style="display:flex;flex-direction:column;gap:.5rem">
                  ${[
                    {v:'ok',    label:'Hızlı / parmak kullanmadan doğru'},
                    {v:'count', label:'Parmak sayarak buldu (yaşa göre normal)'},
                    {v:'wrong', label:'Parmak saymasına rağmen yanlış / çok uzun sürdü'},
                  ].map(o=>`<button style="display:flex;align-items:center;gap:.75rem;padding:var(--s-sm) var(--s-md);border:1.5px solid var(--border);border-radius:var(--r-md);background:var(--surface);cursor:pointer;text-align:left;width:100%;transition:var(--t)" onmouseover="this.style.borderColor='var(--teal)'" onmouseout="this.style.borderColor='var(--border)'" onclick="App._dyscGameNext(2,'${o.v}')">
                    <span style="font-size:1.3rem">${o.v==='ok'?'😊':o.v==='count'?'🤔':'⚠️'}</span>
                    <span style="font-size:var(--t-md)">${o.label}</span>
                  </button>`).join('')}
                </div>
              </div>

              <div id="dysc-game-result" style="display:none;text-align:center;padding:var(--s-lg)">
                <div id="dysc-result-icon" style="font-size:3.5rem;margin-bottom:.5rem"></div>
                <h3 id="dysc-result-title" style="margin-bottom:.5rem"></h3>
                <p id="dysc-result-text" style="font-size:var(--t-md);line-height:1.65;color:var(--muted)"></p>
                <button class="btn btn-ghost btn-sm" style="margin-top:.9rem" onclick="App._resetDyscGame()">Tekrar Oyna</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Warning signals -->
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">⚠️ İşaret Sinyalleri</span></div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          ${signals.map(s=>'<div class="dysc-signal '+s.level+'">'
            +'<span style="font-size:.9rem;flex-shrink:0;margin-top:.05rem">'+emojiMap[s.level]+'</span>'
            +'<span>'+s.text+'</span>'
            +'</div>').join('')}
        </div>
        <p class="muted" style="font-size:var(--t-sm);margin-top:.7rem">🟢 Tek başına anlamlı değil · 🟡 Takip edin · 🔴 Uzman görüşü alın</p>
      </div>

      <!-- R4 — Yaş-bazlı kontrol listesi (Mutlu multiple filter model uyarlaması) -->
      ${this._renderDyscChecklist()}

      <!-- R4 — RAMDEVU e-Devlet yönlendirmesi -->
      <div style="background:linear-gradient(135deg,rgba(26,127,166,.1),rgba(26,127,166,.04));border:1.5px solid rgba(26,127,166,.25);border-radius:var(--r-lg);padding:1rem 1.1rem;margin-bottom:1.4rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
          <span style="font-size:1.3rem">🏛️</span>
          <strong style="font-size:var(--t-lg);color:var(--blue)">RAM'e Başvuru</strong>
        </div>
        <p style="font-size:var(--t-sm);line-height:1.55;color:var(--text2);margin-bottom:.8rem">
          Yukarıdaki kontrol listesinde birden fazla "evet" işaretlediyseniz, <strong>Rehberlik ve Araştırma Merkezi (RAM)</strong> eğitsel değerlendirme için başvuru yapabilirsiniz. Süreç ücretsizdir ve e-Devlet üzerinden randevu alınır. Değerlendirme 60 gün içinde tamamlanır.
        </p>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:.65rem .8rem;margin-bottom:.8rem">
          <p style="font-size:var(--t-xs);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem">📋 SÜREÇ</p>
          <ol style="font-size:var(--t-sm);line-height:1.6;padding-left:1.1rem;color:var(--text2);margin:0">
            <li>e-Devlet "RAMDEVU" üzerinden randevu al</li>
            <li>Öğretmenden kısa gözlem notu iste</li>
            <li>RAM'de Özel Eğitim Değerlendirme Kurulu değerlendirir</li>
            <li>Rapor + varsa destek eğitimi hakkı verilir</li>
          </ol>
        </div>
        <a href="https://www.turkiye.gov.tr/meb-ramdevu-sistemi" target="_blank" rel="noopener"
           class="btn btn-blue btn-block"
           style="text-decoration:none;font-size:var(--t-md)">
          🔗 e-Devlet RAMDEVU'ya Git
        </a>
        <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.55rem;line-height:1.5">
          ⚠️ <strong>Not:</strong> Bu uygulama tanı koymaz. RAM, MEB'e bağlı resmi bir değerlendirme kurumudur. Başvuru zorunlu değildir — gözleminiz ağır basıyorsa önerilir.
        </p>
      </div>

      <!-- Strategies -->
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">🛠️ Ev Destek Stratejileri</span></div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${strategies.map(s=>`<div class="card card-sm">
            <div class="card-body" style="display:flex;gap:.9rem;align-items:flex-start">
              <span style="font-size:1.8rem;flex-shrink:0">${s.emoji}</span>
              <div><strong style="font-size:var(--t-lg)">${s.title}</strong><p style="font-size:var(--t-md);color:var(--muted);margin-top:.2rem;line-height:1.55">${s.desc}</p></div>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Dijital Subitizing Oyunu (Dehaene Number Race ilhamlı) -->
      ${this._renderSubitizingGame()}

      <!-- Sayı Doğrusu Tahmin Oyunu (Siegler linear number line) -->
      ${this._renderNumberLineGame()}

      <!-- Diskalkuli activities -->
      <div>
        <div class="sec-header"><span class="sec-title">💙 Diskalkuli Dostu Etkinlikler</span></div>
        <div style="display:flex;flex-direction:column;gap:.6rem">
          ${this._repo.forDyscalculia().map(a=>this._actCard(a)).join('')}
        </div>
      </div>

      <!-- v4 — Yeni Müdahale Modülleri -->
      <div style="margin-top:1.6rem">
        <div class="sec-header"><span class="sec-title">🎮 Kanıt-Temelli Müdahale Oyunları</span></div>
        <p class="muted" style="font-size:var(--t-sm);line-height:1.6;margin-bottom:.7rem">
          Çocuğunuzla birlikte oynayabileceğiniz, alt-tipe özel pratikler.
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
          ${[
            { id:'magnitude',  emoji:'⚖️', title:'Hangisi Büyük?', sub:'Sayı hissi · Butterworth' },
            { id:'struct-sub', emoji:'🎲', title:'Yapılı Sayma',   sub:'Subitizing · Clements' },
            { id:'corsi',      emoji:'🧠', title:'Hafıza Blokları', sub:'Görsel-uzamsal WM' },
            { id:'fact',       emoji:'⏰', title:'Aralıklı Tekrar', sub:'Olgu hatırlama · Leitner' },
            { id:'strategies', emoji:'🛠️', title:'Stratejiler',    sub:'10\'a tamamlama, parmak…' },
            { id:'embodied',   emoji:'🚶', title:'Yer Sayı Doğrusu', sub:'Embodied · Fischer' },
          ].map(g => `
            <button onclick="App.show('${g.id}')" class="card" style="border:1.5px solid var(--border);background:var(--surface);cursor:pointer;padding:.85rem .7rem;border-radius:var(--r-md);text-align:left;font-family:var(--ff-body);min-height:90px">
              <div style="font-size:1.6rem;margin-bottom:.25rem">${g.emoji}</div>
              <strong style="font-size:var(--t-sm);display:block;line-height:1.3">${g.title}</strong>
              <p class="muted" style="font-size:.65rem;margin-top:.2rem;line-height:1.4">${g.sub}</p>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- v4 — Profil & Analiz -->
      <div style="margin-top:1.4rem">
        <div class="sec-header"><span class="sec-title">📊 Profil & Analiz</span></div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          <button class="card" onclick="App.show('subtype')" style="border:1.5px solid var(--border);background:var(--surface);cursor:pointer;padding:.85rem 1rem;border-radius:var(--r-md);text-align:left;font-family:var(--ff-body);display:flex;align-items:center;gap:.7rem">
            <span style="font-size:1.6rem">🎯</span>
            <div style="flex:1">
              <strong style="font-size:var(--t-md)">Alt-Tip Profili</strong>
              <p class="muted" style="font-size:var(--t-xs);margin-top:.15rem">Sayı hissi · Olgu · WM · Uzamsal</p>
            </div>
            <span style="color:var(--muted)">→</span>
          </button>
          <button class="card" onclick="App.show('errreport')" style="border:1.5px solid var(--border);background:var(--surface);cursor:pointer;padding:.85rem 1rem;border-radius:var(--r-md);text-align:left;font-family:var(--ff-body);display:flex;align-items:center;gap:.7rem">
            <span style="font-size:1.6rem">🔍</span>
            <div style="flex:1">
              <strong style="font-size:var(--t-md)">Hata Deseni Analizi</strong>
              <p class="muted" style="font-size:var(--t-xs);margin-top:.15rem">Tekrarlayan hata kalıpları + öneri</p>
            </div>
            <span style="color:var(--muted)">→</span>
          </button>
        </div>
      </div>

      <!-- Modül tamamla butonu -->
      <button class="btn btn-blue btn-block" style="margin-top:1.4rem" onclick="App._completeDyscModule()">
        💙 Modülü Tamamladım
      </button>
    `;
    // Oyun state sıfırla
    this._dyscGameAnswers = [];
  }

  _dyscGameNext(stepIdx, answer){
    if(!this._dyscGameAnswers) this._dyscGameAnswers = [];
    this._dyscGameAnswers.push(answer);

    const nextStep = stepIdx + 1;
    const current = document.getElementById(`dysc-game-step-${stepIdx}`);
    if(current) current.style.display = 'none';

    if(nextStep <= 2){
      const next = document.getElementById(`dysc-game-step-${nextStep}`);
      if(next) next.style.display = 'block';
    } else {
      // Sonucu hesapla
      const warningCount = this._dyscGameAnswers.filter(a=>a==='wrong').length;
      const slowCount = this._dyscGameAnswers.filter(a=>a==='slow' || a==='count').length;
      const resultEl = document.getElementById('dysc-game-result');
      const iconEl = document.getElementById('dysc-result-icon');
      const titleEl = document.getElementById('dysc-result-title');
      const textEl = document.getElementById('dysc-result-text');

      if(resultEl) resultEl.style.display = 'block';

      if(warningCount === 0){
        if(iconEl) iconEl.textContent = '🌟';
        if(titleEl) titleEl.textContent = 'Harika işaretler!';
        if(textEl) textEl.textContent = 'Çocuğunuz bu gözlemde güçlü performans gösterdi. Rutin destekle devam edin. Zamanla değişim gözlemlenirse yeniden deneyin.';
      } else if(warningCount === 1 || slowCount >= 2){
        if(iconEl) iconEl.textContent = '🟡';
        if(titleEl) titleEl.textContent = 'Bazı sinyaller var';
        if(textEl) textEl.textContent = 'Birkaç dikkat çeken nokta var. Öğretmeninizle paylaşın. Ev destek stratejilerini uygulayın ve birkaç ay sonra tekrar deneyin.';
      } else {
        if(iconEl) iconEl.textContent = '💙';
        if(titleEl) titleEl.textContent = 'Uzman görüşü öneriliyor';
        if(textEl) textEl.textContent = 'Birden fazla güçlü sinyal gözlemlendi. Bir gelişim uzmanına veya eğitim psikologuna danışmanızı öneririz. Erken müdahale büyük fark yaratır.';
      }
      // v4: skorları subtype profiline aktar
      try { this._persistMiniGameToSubtype(); } catch(e) { /* sessiz */ }
    }
  }

  _resetDyscGame(){
    this._dyscGameAnswers = [];
    ['step-0','step-1','step-2'].forEach((s,i)=>{
      const el = document.getElementById(`dysc-game-${s}`);
      if(el) el.style.display = i===0?'block':'none';
    });
    const result = document.getElementById('dysc-game-result');
    if(result) result.style.display = 'none';
  }

  _dyscCheck(){
    // Artık oyun tabanlı _dyscGameNext kullanıyor — eski metod geriye dönük uyumluluk için kaldı
    this._toast('Mini tarama oyununu deneyin ↑','ok');
  }

  /* ══════════════════════════════════════════════
     DİJİTAL SUBİTİZİNG OYUNU (Dehaene Number Race ilhamlı)
     Kanıt: Wilson et al. 2006 — 5 hafta × 4 gün × 30 dk
     protokolünde subitizing hızı birkaç yüz ms artıyor.
     Bu bir tarama değil, çocukla ebeveynin birlikte
     oynayacağı kısa bir pratik oyunudur.
  ══════════════════════════════════════════════ */

  _renderSubitizingGame(){
    return `
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">🎯 Subitizing Oyunu (Birlikte Oynayın)</span></div>
        <p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem;line-height:1.6">
          <strong>Subitizing</strong> = saymadan küçük grupları hızlıca görebilme. Sayı hissinin temelidir.
          Aşağıdaki noktalara 1 saniye bakın, saymadan cevap verin. <em>(Wilson &amp; Dehaene, 2006)</em>
        </p>
        <div class="card">
          <div class="card-body" style="text-align:center">
            <div id="sub-score" style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.4rem">Tur: <strong id="sub-turn">0</strong> · Doğru: <strong id="sub-correct">0</strong> · Hızlı: <strong id="sub-fast">0</strong></div>
            <div id="sub-dots-container" style="min-height:120px;background:linear-gradient(135deg,rgba(13,148,136,.05),rgba(13,148,136,.02));border-radius:var(--r-md);padding:1rem;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
              <div id="sub-message" style="font-size:var(--t-md);color:var(--muted);line-height:1.5">Başlamak için "Başla" düğmesine basın.<br><span style="font-size:var(--t-xs)">1–9 arası rastgele noktalar gösterilecek.</span></div>
            </div>
            <div id="sub-options" style="display:none;flex-wrap:wrap;gap:.35rem;justify-content:center;margin-top:.7rem"></div>
            <div id="sub-feedback" style="display:none;font-size:var(--t-md);font-weight:700;margin-top:.55rem;min-height:1.5rem"></div>
            <div style="display:flex;gap:.45rem;justify-content:center;margin-top:.75rem">
              <button id="sub-start-btn" class="btn btn-primary btn-sm" onclick="App._subStart()">Başla →</button>
              <button id="sub-reset-btn" class="btn btn-ghost btn-sm" onclick="App._subReset()" style="display:none">Sıfırla</button>
            </div>
            <p class="muted" style="font-size:.65rem;margin-top:.55rem;line-height:1.5">
              💡 İpucu: Çocuğunuz 5\'e kadar gruplu noktaları "şip şak" görmeye başlarsa, sayı hissi gelişiyor demektir.
              Yavaş düşünmek de sorun değil — pratikle hızlanır.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  _subStart(){
    // Oyun durumu
    this._sub = { turn:0, correct:0, fast:0, current:null, showTime:0, maxTurns:8 };
    document.getElementById('sub-start-btn').style.display = 'none';
    document.getElementById('sub-reset-btn').style.display = 'inline-flex';
    document.getElementById('sub-options').style.display = 'flex';
    this._subNextRound();
  }

  _subNextRound(){
    if(this._sub.turn >= this._sub.maxTurns){
      this._subFinish();
      return;
    }
    this._sub.turn++;
    this._updateSubHud();
    // Rastgele 1–9 arası sayı
    const n = 1 + Math.floor(Math.random() * 9);
    this._sub.current = n;
    this._sub.showTime = Date.now();

    // Nokta render et — rastgele ama çakışmayan yerleşim
    const container = document.getElementById('sub-dots-container');
    if(!container) return;
    const dotsHtml = this._subRenderDots(n);
    container.innerHTML = dotsHtml;

    // Seçenekleri oluştur — doğru cevap + 3 yakın yanlış
    const options = new Set([n]);
    while(options.size < 4){
      const delta = (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
      const candidate = Math.max(1, Math.min(9, n + delta));
      options.add(candidate);
    }
    const shuffled = [...options].sort(() => Math.random() - .5);

    const optsEl = document.getElementById('sub-options');
    if(optsEl){
      optsEl.innerHTML = shuffled.map(v =>
        `<button class="btn btn-soft btn-sm" style="min-width:44px;font-size:var(--t-lg);font-weight:800" onclick="App._subAnswer(${v})">${v}</button>`
      ).join('');
    }
    const fb = document.getElementById('sub-feedback');
    if(fb){ fb.style.display = 'none'; fb.textContent = ''; }
  }

  // Rastgele yerleştirilmiş noktalar üretir
  _subRenderDots(n){
    const positions = [];
    const size = 18; // nokta çapı
    const maxAttempts = 80;
    for(let i=0; i<n; i++){
      let placed = false;
      for(let attempt=0; attempt<maxAttempts && !placed; attempt++){
        // yüzde cinsinden koordinat (container %100)
        const x = 10 + Math.random() * 80;
        const y = 10 + Math.random() * 80;
        // Çakışma kontrolü
        let ok = true;
        for(const p of positions){
          const dx = p.x - x, dy = p.y - y;
          if(Math.sqrt(dx*dx + dy*dy) < 15){ ok = false; break; }
        }
        if(ok){ positions.push({x,y}); placed = true; }
      }
      if(!placed){
        // Başarısızsa herhangi bir yere
        positions.push({ x: 10 + (i*12)%80, y: 20 + Math.floor(i/7)*25 });
      }
    }
    const dots = positions.map(p =>
      `<div style="position:absolute;left:${p.x}%;top:${p.y}%;width:${size}px;height:${size}px;border-radius:50%;background:var(--teal);box-shadow:0 2px 4px rgba(13,148,136,.3);transform:translate(-50%,-50%)"></div>`
    ).join('');
    return `<div style="position:relative;width:100%;height:120px">${dots}</div>`;
  }

  _subAnswer(val){
    if(!this._sub || !this._sub.current) return;
    const elapsed = Date.now() - this._sub.showTime;
    const isCorrect = (val === this._sub.current);
    const isFast = elapsed < 2000; // 2 saniyeden hızlıysa "subitizing" sayılır
    if(isCorrect){
      this._sub.correct++;
      if(isFast) this._sub.fast++;
    }
    // v4: hata desenleri & subtype skoru için logla
    try {
      this._errPatterns?.logAnswer({
        gameId:'subitizing-classic', q:`n=${this._sub.current}`,
        expected:this._sub.current, given:val, elapsedMs:elapsed,
      });
      if(!isCorrect) this._subtype?.addScores({ number_sense: 1 }, 'subitizing_classic');
    } catch(e) { /* sessiz */ }
    // Feedback
    const fb = document.getElementById('sub-feedback');
    if(fb){
      fb.style.display = 'block';
      if(isCorrect && isFast){
        fb.textContent = '⚡ Harika! Hızlı ve doğru!';
        fb.style.color = 'var(--success)';
      } else if(isCorrect){
        fb.textContent = '✓ Doğru';
        fb.style.color = 'var(--teal-d)';
      } else {
        fb.textContent = `✗ Doğrusu: ${this._sub.current}`;
        fb.style.color = 'var(--danger)';
      }
    }
    this._updateSubHud();
    // Bir sonraki tur
    setTimeout(() => this._subNextRound(), 1100);
  }

  _updateSubHud(){
    const t = document.getElementById('sub-turn');
    const c = document.getElementById('sub-correct');
    const f = document.getElementById('sub-fast');
    if(t) t.textContent = this._sub.turn;
    if(c) c.textContent = this._sub.correct;
    if(f) f.textContent = this._sub.fast;
  }

  _subFinish(){
    const { correct, fast, maxTurns } = this._sub;
    const container = document.getElementById('sub-dots-container');
    const opts = document.getElementById('sub-options');
    if(opts) opts.style.display = 'none';
    const pct = Math.round((correct / maxTurns) * 100);
    const fastPct = Math.round((fast / maxTurns) * 100);

    let msg, emoji;
    if(correct >= 7 && fast >= 5){
      msg = 'Harika! Subitizing gelişmiş görünüyor.';
      emoji = '🌟';
    } else if(correct >= 5){
      msg = 'İyi iş! Düzenli oyun ile daha da hızlanır.';
      emoji = '👍';
    } else {
      msg = 'Pratik ile iyileşir. Endişelenmeyin, bir hafta sonra tekrar deneyin.';
      emoji = '💪';
    }

    if(container){
      container.innerHTML = `
        <div style="text-align:center;padding:.5rem">
          <div style="font-size:2.5rem;margin-bottom:.3rem">${emoji}</div>
          <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.4rem">${msg}</p>
          <p style="font-size:var(--t-sm);color:var(--muted);line-height:1.5">
            Doğru: <strong>${correct}/${maxTurns}</strong> (%${pct})<br>
            Hızlı tanıma: <strong>${fast}/${maxTurns}</strong> (%${fastPct})
          </p>
        </div>
      `;
    }
  }

  _subReset(){
    this._sub = null;
    const container = document.getElementById('sub-dots-container');
    if(container){
      container.innerHTML = `
        <div id="sub-message" style="font-size:var(--t-md);color:var(--muted);line-height:1.5">
          Başlamak için "Başla" düğmesine basın.<br>
          <span style="font-size:var(--t-xs)">1–9 arası rastgele noktalar gösterilecek.</span>
        </div>
      `;
    }
    const opts = document.getElementById('sub-options');
    if(opts){ opts.style.display = 'none'; opts.innerHTML = ''; }
    const fb = document.getElementById('sub-feedback');
    if(fb){ fb.style.display = 'none'; fb.textContent = ''; }
    const s = document.getElementById('sub-start-btn');
    if(s) s.style.display = 'inline-flex';
    const r = document.getElementById('sub-reset-btn');
    if(r) r.style.display = 'none';
    // HUD sıfırla
    ['sub-turn','sub-correct','sub-fast'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.textContent = '0';
    });
  }

  /* ══════════════════════════════════════════════
     SAYI DOĞRUSU TAHMİN OYUNU (Siegler, 2004; Ramani & Siegler, 2008)
     Kanıt: Lineer sayı çizgisi oyunları düşük-SES çocukların
     matematik başarısını 9 hafta sonra bile koruyor.
     Bu oyun: 0-100 arası bir sayı verilir, çocuk tıklayarak
     yerini tahmin eder; gerçek konumla karşılaştırılır.
  ══════════════════════════════════════════════ */

  _renderNumberLineGame(){
    return `
      <div style="margin-bottom:1.4rem">
        <div class="sec-header"><span class="sec-title">📏 Sayı Doğrusu Oyunu</span></div>
        <p class="muted" style="font-size:var(--t-sm);margin-bottom:.85rem;line-height:1.6">
          Bir sayı verilir — <strong>hangi noktada</strong> olduğunu sayı doğrusunda tahmin edin.
          Sayı doğrusu tahmini, sayı hissinin en güçlü yordayıcılarından biridir.
          <em>(Siegler &amp; Booth, 2004)</em>
        </p>
        <div class="card">
          <div class="card-body" style="text-align:center">
            <div id="nl-score" style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.6rem">
              Tur: <strong id="nl-turn">0</strong> · Ortalama sapma: <strong id="nl-avg">-</strong>
            </div>
            <div id="nl-question" style="font-size:var(--t-2xl);font-weight:900;color:var(--teal-d);margin-bottom:.6rem;min-height:2.6rem;line-height:1.2">
              Başlamak için düğmeye basın
            </div>
            <!-- Sayı doğrusu: clickable container -->
            <div id="nl-line-wrapper" style="position:relative;margin:1rem .5rem .8rem;padding:1.2rem 0 1.5rem">
              <!-- Ana çizgi -->
              <div style="position:relative;height:4px;background:var(--border2);border-radius:2px">
                <!-- 0 ve 100 etiketi -->
                <div style="position:absolute;left:0;top:-24px;font-size:var(--t-sm);font-weight:800;color:var(--muted)">0</div>
                <div style="position:absolute;right:0;top:-24px;font-size:var(--t-sm);font-weight:800;color:var(--muted)">100</div>
                <!-- Tık alanı — çizgi üstünde geniş bant -->
                <div id="nl-line" onclick="App._nlClick(event)"
                  style="position:absolute;left:0;right:0;top:-20px;bottom:-20px;cursor:crosshair"></div>
                <!-- Kullanıcı marker -->
                <div id="nl-guess-marker" style="display:none;position:absolute;top:-10px;width:3px;height:24px;background:var(--orange);border-radius:2px;transform:translateX(-50%)"></div>
                <!-- Doğru cevap marker -->
                <div id="nl-answer-marker" style="display:none;position:absolute;top:-10px;width:3px;height:24px;background:var(--teal);border-radius:2px;transform:translateX(-50%)"></div>
              </div>
            </div>
            <div id="nl-feedback" style="font-size:var(--t-sm);font-weight:700;min-height:1.5rem;color:var(--muted)"></div>
            <div style="display:flex;gap:.45rem;justify-content:center;margin-top:.75rem">
              <button id="nl-start-btn" class="btn btn-primary btn-sm" onclick="App._nlStart()">Başla →</button>
              <button id="nl-reset-btn" class="btn btn-ghost btn-sm" onclick="App._nlReset()" style="display:none">Sıfırla</button>
            </div>
            <p class="muted" style="font-size:.65rem;margin-top:.55rem;line-height:1.5">
              💡 İpucu: Çocuğunuza "yarısı 50, yarının yarısı 25" gibi referansları hatırlatın.
              Zamanla sapma azalacaktır.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  _nlStart(){
    this._nl = { turn:0, errors:[], target:null, maxTurns:6 };
    document.getElementById('nl-start-btn').style.display = 'none';
    document.getElementById('nl-reset-btn').style.display = 'inline-flex';
    this._nlNextRound();
  }

  _nlNextRound(){
    if(this._nl.turn >= this._nl.maxTurns){
      this._nlFinish();
      return;
    }
    this._nl.turn++;
    // Rastgele hedef (2-98 arası, daha ilginç)
    this._nl.target = 2 + Math.floor(Math.random() * 97);
    // HUD güncelle
    const t = document.getElementById('nl-turn');
    if(t) t.textContent = this._nl.turn;
    const q = document.getElementById('nl-question');
    if(q) q.innerHTML = `<span style="color:var(--orange)">${this._nl.target}</span> nerede?`;
    // Marker'ları gizle
    const gm = document.getElementById('nl-guess-marker');
    const am = document.getElementById('nl-answer-marker');
    if(gm) gm.style.display = 'none';
    if(am) am.style.display = 'none';
    const fb = document.getElementById('nl-feedback');
    if(fb){ fb.textContent = 'Sayı doğrusuna tıklayın'; fb.style.color = 'var(--muted)'; }
  }

  _nlClick(event){
    if(!this._nl || this._nl.target === null) return;
    const line = document.getElementById('nl-line');
    if(!line) return;
    const rect = line.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const guess = Math.round(pct);
    const error = Math.abs(guess - this._nl.target);
    this._nl.errors.push(error);

    // Marker göster
    const gm = document.getElementById('nl-guess-marker');
    const am = document.getElementById('nl-answer-marker');
    if(gm){ gm.style.display = 'block'; gm.style.left = guess + '%'; }
    if(am){ am.style.display = 'block'; am.style.left = this._nl.target + '%'; }

    // Ortalama sapma
    const avg = Math.round(this._nl.errors.reduce((s,v)=>s+v,0) / this._nl.errors.length);
    const avgEl = document.getElementById('nl-avg');
    if(avgEl) avgEl.textContent = avg;

    // Feedback
    const fb = document.getElementById('nl-feedback');
    if(fb){
      if(error <= 5){
        fb.textContent = `🎯 Harika! Sadece ${error} sapma.`;
        fb.style.color = 'var(--success)';
      } else if(error <= 15){
        fb.textContent = `👍 İyi! Sapma: ${error}`;
        fb.style.color = 'var(--teal-d)';
      } else {
        fb.textContent = `Tahmin: ${guess} · Doğru: ${this._nl.target} · Sapma: ${error}`;
        fb.style.color = 'var(--muted)';
      }
    }
    // Sonraki tur
    setTimeout(() => this._nlNextRound(), 1400);
  }

  _nlFinish(){
    const errors = this._nl.errors;
    const avg = Math.round(errors.reduce((s,v)=>s+v,0) / errors.length);
    const q = document.getElementById('nl-question');
    let msg, emoji;
    if(avg <= 8){
      msg = 'Mükemmel sayı hissi!';
      emoji = '🌟';
    } else if(avg <= 15){
      msg = 'İyi gidiyorsunuz — pratikle daha da iyi olacak.';
      emoji = '👍';
    } else {
      msg = 'Sayı çizgisi pratiği işe yarar — düzenli tekrar edin.';
      emoji = '💪';
    }
    if(q){
      q.innerHTML = `<div style="font-size:var(--t-xl)">${emoji} ${msg}</div>`;
    }
    const fb = document.getElementById('nl-feedback');
    if(fb){
      fb.innerHTML = `Ortalama sapma: <strong>${avg}</strong> · Toplam: ${errors.length} tur`;
      fb.style.color = 'var(--text2)';
    }
  }

  _nlReset(){
    this._nl = null;
    const q = document.getElementById('nl-question');
    if(q) q.textContent = 'Başlamak için düğmeye basın';
    const t = document.getElementById('nl-turn');
    if(t) t.textContent = '0';
    const avg = document.getElementById('nl-avg');
    if(avg) avg.textContent = '-';
    const gm = document.getElementById('nl-guess-marker');
    const am = document.getElementById('nl-answer-marker');
    if(gm) gm.style.display = 'none';
    if(am) am.style.display = 'none';
    const fb = document.getElementById('nl-feedback');
    if(fb){ fb.textContent = ''; fb.style.color = 'var(--muted)'; }
    const s = document.getElementById('nl-start-btn');
    if(s) s.style.display = 'inline-flex';
    const r = document.getElementById('nl-reset-btn');
    if(r) r.style.display = 'none';
  }

  _setSpatialFilter(){
    this._filter.spatialOnly = true;
    this._filter.category = null;
    this.show('activities');
  }

  _completeDyscModule(){
    const p=this._parent; if(!p) return;
    this._parent = {...p, dyscModuleDone:true};
    this._storage.set('parent', this._parent);
    const badges = this._badgeEng.evaluate(this._parent, this._getChild());
    if(badges.length){ this._parent={...this._parent,badges:[...(this._parent.badges||[]),...badges]}; this._storage.set('parent',this._parent); this._badgeModal(badges[0]); }
    else this._toast('Diskalkuli modülü tamamlandı! 💙','ok');
  }

  /* ══════════════════════════════════════════════
     SMS BRIDGE (Faz 4)
  ══════════════════════════════════════════════ */

  _renderSms(){
    const task = this._smsSvc.getCurrentTask();
    const allTasks = SmsService.WEEKLY_TASKS;

    document.getElementById('sms-body').innerHTML=`
      <p class="muted" style="font-size:var(--t-md);margin-bottom:1.3rem">İnternetsiz ebeveynler için her hafta kısa bir görev SMS olarak gönderilebilir. Bu özellik uygulama entegrasyonu ile hayata geçirilir.</p>

      <!-- Phone mockup -->
      <div class="phone-frame" style="margin-bottom:1.4rem">
        <div class="phone-screen">
          <div class="sms-header">📱 ABMATO Görevi</div>
          <div class="sms-body">
            <div class="sms-msg" style="background:#e8e8ed">${task.text}</div>
            <div class="sms-msg out" style="margin-top:.3rem">Teşekkürler! Bugün deneyeceğiz 🎉</div>
          </div>
        </div>
      </div>

      <!-- All SMS tasks -->
      <div class="sec-header"><span class="sec-title">📋 SMS Görev Bankası (5 Haftalık)</span></div>
      <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.3rem">
        ${allTasks.map((t,i)=>`
          <div style="background:var(--surface);border:1.5px solid ${i===allTasks.indexOf(task)?'var(--teal)':'var(--border)'};border-radius:var(--r-md);padding:var(--s-sm) var(--s-sm) 1rem;position:relative">
            ${i===allTasks.indexOf(task)?`<span class="chip chip-orange" style="position:absolute;top:.6rem;right:.7rem">Bu Hafta</span>`:''}
            <p style="font-size:var(--t-md);line-height:1.5;padding-right:${i===allTasks.indexOf(task)?'5.5rem':'0'}">${t.text}</p>
          </div>`).join('')}
      </div>

      <!-- Simulate send -->
      <div class="card">
        <div class="card-body">
          <h3 style="margin-bottom:.6rem">Telefon Numarası Ekle</h3>
          <p class="muted" style="font-size:var(--t-md);margin-bottom:.8rem">Gerçek uygulamada görevler her pazartesi otomatik gönderilir.</p>
          <div style="display:flex;gap:.6rem">
            <input class="input" placeholder="+90 5XX XXX XX XX" style="flex:1">
            <button class="btn btn-primary" onclick="App._simulateSms()">Gönder</button>
          </div>
        </div>
      </div>
    `;
  }

  _simulateSms(){ this._toast('SMS simüle edildi! Gerçek uygulamada gönderilirdi 📱','ok'); }

  /* ══════════════════════════════════════════════
     OFFLINE CARDS (Faz 4)
  ══════════════════════════════════════════════ */

  _renderOffline(){
    const child=this._getChild();
    const packs=[
      { id:'op1', emoji:'📚', title:'Okul Öncesi Başlangıç Paketi', count:8, desc:'Sayma, şekil ve örüntü etkinlikleri. Materyal gerekmez.', forAg:[AgeGroup.PRESCHOOL] },
      { id:'op2', emoji:'🔢', title:'1. Sınıf Sayı Hissi', count:6, desc:'Toplama, çıkarma ve sayı örüntüleri.', forAg:[AgeGroup.G1] },
      { id:'op3', emoji:'📐', title:'Geometri Kartları (Tüm Seviyeler)', count:5, desc:'Şekil avı, tangram ve geometri yürüyüşü.', forAg:Object.values(AgeGroup) },
      { id:'op4', emoji:'💙', title:'Diskalkuli Destek Kartları', count:7, desc:'Somut nesne odaklı, adım adım yönlendirmeli kartlar.', forAg:Object.values(AgeGroup) },
      { id:'op5', emoji:'🏠', title:'Günlük Hayat Matematik', count:10, desc:'Mutfak, alışveriş ve takvim etkinlikleri.', forAg:Object.values(AgeGroup) },
    ];

    document.getElementById('offline-body').innerHTML=`
      <p class="muted" style="font-size:var(--t-md);margin-bottom:1.2rem">İnternet bağlantısı olmayan aileler için yazdırılabilir etkinlik kartları. Her kart A5 boyutunda, siyah-beyaz baskıya uygun tasarlanmıştır.</p>

      <div style="display:flex;flex-direction:column;gap:.85rem">
        ${packs.map(pk=>{
          const fits = !child || pk.forAg.includes(child.ageGroup);
          return `<div class="pdf-card ${!fits?'opacity:.5':''}" onclick="App._downloadPack('${pk.id}')">
            <div style="font-size:2.5rem;margin-bottom:.5rem">${pk.emoji}</div>
            <h3 style="margin-bottom:.3rem">${pk.title}</h3>
            <p class="muted" style="font-size:var(--t-md);margin-bottom:.5rem">${pk.desc}</p>
            <div style="display:flex;align-items:center;justify-content:center;gap:.5rem;font-size:var(--t-sm);font-weight:700;color:var(--teal)">
              <span>📄 ${pk.count} kart</span>
              <span>·</span>
              <span>⬇ İndir / Yazdır</span>
            </div>
          </div>`;
        }).join('')}
      </div>

      <div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-md) var(--s-lg);margin-top:1.3rem;border:1.5px solid var(--border)">
        <strong style="font-size:var(--t-md)">📌 Nasıl Kullanılır?</strong>
        <ol style="font-size:var(--t-md);color:var(--muted);margin-top:.4rem;padding-left:1.1rem;display:flex;flex-direction:column;gap:.3rem;line-height:1.5">
          <li>İlgili paketi indirin</li>
          <li>A5 veya A4 kâğıda yazdırın</li>
          <li>Kartları kesin ve saklamak için lamine yapın</li>
          <li>Haftalık plan kutusuna yerleştirin</li>
        </ol>
      </div>
    `;
  }

  _downloadPack(id){ this._toast('PDF hazırlanıyor… (Demo modda simüle edildi) 📄','ok'); }

  /* ══════════════════════════════════════════════
     LEARN
  ══════════════════════════════════════════════ */

  _renderLearn(){
    document.getElementById('learn-body').innerHTML=`
      <p class="muted" style="font-size:var(--t-md);margin-bottom:1.2rem">Araştırma temelli kısa eğitimler. Her modül 5–15 dakika.</p>
      <div style="display:flex;flex-direction:column;gap:.8rem">
        ${this._learnModules.map(m=>`
          <div class="card" style="cursor:pointer" data-lm-id="${m.id}" onclick="App._openLearn('${m.id}')">
            <div class="card-body" style="display:flex;align-items:center;gap:.9rem">
              <div style="font-size:2.3rem;flex-shrink:0">${m.emoji}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin-bottom:.2rem">
                  <strong>${m.title}</strong>
                  <span class="chip ${m.level===1?'chip-green':m.level===2?'chip-blue':'chip-orange'}">Seviye ${m.level}</span>
                  ${m.isSpecial?`<span class="chip chip-blue">💙 Özel</span>`:''}
                </div>
                <p class="muted" style="font-size:var(--t-sm)">${m.sub}</p>
                <p class="muted" style="font-size:var(--t-sm);margin-top:.15rem">⏱ ${m.dur}</p>
              </div>
              <span style="color:var(--muted);font-size:1.2rem">›</span>
            </div>
            ${this._editBar(m.id,'lm')}
          </div>`).join('')}
      </div>`;
  }



  /* ── Loading Skeleton ─────────────────────────────────────
     İçerik yüklenmeden önce kısa süre skeleton göster
  ──────────────────────────────────────────────────────────── */

  /* ── Kaygı Rehberi Modal ───────────────────────────────────
     Maloney ve ark. (2015) bulgularına dayalı pratik rehber
  ──────────────────────────────────────────────────────────── */
  _showAnxGuide(){
    const items = [
      { ok:true,  text:'Soru sorun ve bekleyin — "Peki sen ne düşünüyorsun?"' },
      { ok:true,  text:'Hata olursa "Hmmm, emin misin?" deyin — düzeltmeyin.' },
      { ok:true,  text:'Sessizliği bozmayın. Çocuğun düşünmesine yer açın.' },
      { ok:false, text:'"Ben de matematiği sevmezdim" demeyin — bu mesaj geçer.' },
      { ok:false, text:'Cevabı göstermeyin — süreç sonuçtan önemlidir.' },
      { ok:false, text:'Aceleci olmayın — yavaşlık öğrenmenin işaretidir.' },
    ];
    const rows = items.map(i => {
      const bg     = i.ok ? 'rgba(45,106,79,.07)'   : 'rgba(239,68,68,.06)';
      const border = i.ok ? 'var(--teal-d)'         : 'var(--danger)';
      const color  = i.ok ? 'var(--teal-d)'         : 'var(--danger)';
      const emoji  = i.ok ? '✅' : '❌';
      const label  = i.ok ? 'Yapın' : 'Yapmayın';
      return '<div style="display:flex;gap:.75rem;align-items:flex-start;padding:.65rem .85rem;' +
             'background:' + bg + ';border-radius:var(--r-md);border-left:3px solid ' + border + '">' +
             '<span style="font-size:var(--t-xl);flex-shrink:0">' + emoji + '</span>' +
             '<div><strong style="font-size:var(--t-sm);color:' + color + '">' + label + '</strong>' +
             '<p style="font-size:var(--t-md);margin:.1rem 0 0;line-height:1.5">' + i.text + '</p></div></div>';
    }).join('');

    this._openModal(
      '<div style="padding:.3rem 0">' +
      '<h3 style="margin-bottom:.75rem">💛 "Siz İzleyin, Çocuğunuz Yapsın"</h3>' +
      '<p style="font-size:var(--t-md);color:var(--muted);line-height:1.65;margin-bottom:1rem">' +
      'Araştırmalar, matematik kaygısı yüksek ebeveynlerin çocuğa ne sıklıkla yardım ettiğinden çok ' +
      '<strong>nasıl yardım ettiğinin</strong> belirleyici olduğunu gösteriyor.' +
      '<em style="display:block;margin-top:.3rem;font-size:var(--t-sm)">(Maloney ve ark., 2015 — Psychological Science)</em>' +
      '</p>' +
      '<div style="display:flex;flex-direction:column;gap:.65rem;margin-bottom:1.1rem">' + rows + '</div>' +
      '<button class="btn btn-primary btn-block" onclick="App._closeModal();App.show(\'activities\')">Etkinliklere Git →</button>' +
      '</div>'
    );
  }

  _showSkeleton(containerId, rows=3){
    const el = document.getElementById(containerId);
    if(!el) return;
    el.innerHTML = Array.from({length:rows}, ()=>`
      <div style="display:flex;gap:.85rem;padding:.95rem 1rem;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);margin-bottom:.7rem">
        <div class="skeleton" style="width:48px;height:48px;border-radius:50%;flex-shrink:0"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:.45rem;padding-top:.2rem">
          <div class="skeleton" style="height:14px;border-radius:6px;width:60%"></div>
          <div class="skeleton" style="height:12px;border-radius:6px;width:85%"></div>
          <div class="skeleton" style="height:10px;border-radius:6px;width:40%"></div>
        </div>
      </div>`).join('');
  }

  _searchLearn(term){
    const t = term.toLowerCase().trim();
    const el = document.getElementById('learn-modules');
    if(!el) return;
    el.querySelectorAll('[data-lm-id]').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = (!t || text.includes(t)) ? '' : 'none';
    });
    // Boş section başlıklarını gizle
    el.querySelectorAll('.sec-header').forEach(h => {
      const next = h.nextElementSibling;
      const hasVisible = next && [...next.querySelectorAll('[data-lm-id]')].some(c=>c.style.display!=='none');
      h.style.display = (!t || hasVisible) ? '' : 'none';
    });
  }

  _openLearn(id){
    const m=this._learnModules.find(x=>x.id===id); if(!m) return;
    if(m.isSpecial==='dyscalculia'){ this.show('dyscalculia'); return; }
    if(m.isSpecial==='books')     { this.show('books');       return; }
    if(m.isSpecial==='mathtalk')  { this.show('mathtalk');    return; }
    if(m.isSpecial==='breathing') { this.show('breathing');   return; }
    if(m.isSpecial==='tymm')      { this.show('tymm');        return; }
    if(m.isSpecial==='stories')   { this.show('stories');     return; }
    if(m.isSpecial==='skill')     { this.show('skill');       return; }
    if(m.isSpecial==='mtext')     { this.show('mtext');       return; }
    if(m.isSpecial==='about')     { this.show('about');       return; }
    this._openModal(`
      <div class="center" style="margin-bottom:1.2rem">
        <div style="font-size:3rem;margin-bottom:.3rem">${m.emoji}</div>
        <h2>${m.title}</h2>
        <p class="muted" style="margin-top:.3rem">${m.sub}</p>
      </div>
      <div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-lg);line-height:1.7;font-size:var(--t-lg);margin-bottom:1.1rem">${m.text}</div>
      <div style="background:rgba(255,209,102,.18);border-left:4px solid var(--amber);border-radius:0 var(--r-sm) var(--r-sm) 0;padding:var(--s-sm) var(--s-sm) 1rem;margin-bottom:1.2rem">
        <strong style="font-size:var(--t-sm)">💡 Araştırma Notu</strong>
        <p style="font-size:var(--t-sm);margin-top:.2rem;line-height:1.55">Bu içerik ebeveyn katılımı ve matematik eğitimi alan yazınına dayanmaktadır.</p>
      </div>
      <button class="btn btn-primary btn-block" onclick="App._closeModal()">Anladım ✓</button>
    `);
  }

  /* ══════════════════════════════════════════════
     NOTIFICATIONS
  ══════════════════════════════════════════════ */

  _renderNotifs(){
    const notifs = this._notifSvc.getAll();
    this._notifSvc.markAllRead();
    this._updateNotifDot();

    document.getElementById('notif-body').innerHTML=`
      ${notifs.length?notifs.map(n=>`
        <div style="background:var(--surface);border:1.5px solid ${n.read?'var(--border)':'var(--teal)'};border-radius:var(--r-md);padding:.9rem 1.1rem;margin-bottom:.6rem;display:flex;gap:.75rem;animation:slideRight .25s ease">
          <div style="font-size:1.8rem;flex-shrink:0">${n.emoji}</div>
          <div style="flex:1">
            <strong style="font-size:var(--t-lg)">${n.title}</strong>
            <p style="font-size:var(--t-md);color:var(--muted);margin-top:.2rem;line-height:1.5">${n.text}</p>
            <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.3rem">${this._relTime(n.date)}</p>
          </div>
          ${!n.read?`<div style="width:8px;height:8px;background:var(--teal);border-radius:50%;margin-top:.4rem;flex-shrink:0"></div>`:''}
        </div>`).join('')
      :`<p class="muted center" style="padding:2rem">Bildirim yok.</p>`}
    `;
  }

  _updateNotifDot(){
    const count = this._notifSvc.unreadCount();
    const dot = document.getElementById('notif-dot');
    if(dot) dot.style.display = count>0 ? 'block' : 'none';
  }

  /* ══════════════════════════════════════════════
     PROFILE
  ══════════════════════════════════════════════ */

  _renderProfile(){
    const p=this._parent; if(!p) return;
    const c=this._getChild();
    const anxLevel=p.anxietyProfile?.level;
    const anxScore=p.anxietyProfile?.score||0;
    const anxColor=anxLevel===AnxietyLevel.LOW?'#22c55e':anxLevel===AnxietyLevel.MEDIUM?'#f59e0b':'#ef4444';
    const styleInfo={
      autonomy:{label:'Özerklik Destekleyici 🌱',color:'var(--teal-d)',
        desc:'Soruyu sunuyorsunuz, cevabı değil. SDT araştırmaları bu yaklaşımın içsel motivasyonu ve matematik öz-yeterliğini en güçlü biçimde beslediğini gösteriyor.'},
      controlling:{label:'Yönlendirici 📋',color:'var(--blue)',
        desc:'Yapılandırılmış destek veriyorsunuz. Özerkliği artırmak için: bazen "nasıl yapardın?" diye sorup bekleyin.'},
      mixed:{label:'Duruma Göre ⚖️',color:'var(--amber)',
        desc:'Esnek yaklaşımınız var. Zor anlarda özerklik destekleyici ipuçlarını deneyin.'},
      mixed:{label:'Karma ⚖️',color:'var(--purple)'},
      unknown:{label:'Belirsiz',color:'var(--muted)'},
    };
    const si=styleInfo[p.parentingStyle]||styleInfo.unknown;

    document.getElementById('prof-body').innerHTML=`
      <!-- Header -->
      <div style="background:linear-gradient(145deg,var(--teal) 0%,var(--teal-d) 100%);padding:2.2rem 1.4rem 2rem;border-radius:0 0 var(--r-xl) var(--r-xl);margin-bottom:1.4rem;box-shadow:var(--sh-btn)">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:1.9rem;border:3px solid rgba(255,255,255,.4)">${this._esc((p.name||'?').charAt(0).toUpperCase())}</div>
          <div>
            <h2 style="color:#fff;margin:0">${this._esc(p.name)}</h2>
            <p style="color:rgba(255,255,255,.75);font-size:var(--t-md);margin-top:.1rem">${(c?.completedActivities||[]).length} etkinlik tamamlandı</p>
          </div>
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap">
          <span style="background:rgba(255,255,255,.2);color:#fff;padding:.3rem .75rem;border-radius:var(--r-full);font-size:var(--t-sm);font-weight:700">${si.label}</span>
          <span style="background:rgba(255,255,255,.2);color:#fff;padding:.3rem .75rem;border-radius:var(--r-full);font-size:var(--t-sm);font-weight:700">${this._AGLabels[c?.ageGroup]||'—'}</span>
          <span style="background:${p.role==='admin'?'rgba(255,209,102,.3)':p.role==='editor'?'rgba(255,255,255,.2)':'rgba(255,255,255,.15)'};color:#fff;padding:.3rem .75rem;border-radius:var(--r-full);font-size:var(--t-sm);font-weight:700">
            ${p.role==='admin'?'👑 Yönetici':p.role==='editor'?'✍️ İçerik Üretici':'👨‍👩‍👧 Ebeveyn'}
          </span>
        </div>
      </div>

      ${this._auth?.needsFirstAdmin?.() ? `
        <div style="margin:0 1.25rem 1rem;background:linear-gradient(135deg,#FFF3CD,#FFE69C);border:1.5px solid var(--amber);border-radius:var(--r-lg);padding:1rem 1.1rem">
          <div style="display:flex;align-items:flex-start;gap:.7rem">
            <span style="font-size:1.8rem;flex-shrink:0">⚠️</span>
            <div style="flex:1">
              <strong style="color:#92600A;font-size:var(--t-md);display:block">Yönetici Hesabı Yok</strong>
              <p style="font-size:var(--t-sm);color:#5C3D00;line-height:1.55;margin-top:.25rem">
                Bu cihazda henüz yönetici hesabı kurulmamış. Etkinlik/içerik düzenlemek için yönetici girişi gerekli.
              </p>
              <button class="btn btn-primary btn-sm" style="margin-top:.55rem;font-weight:800" onclick="App._openAdminSetup()">
                👑 Yönetici Hesabı Kur →
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <div style="padding:0 1.25rem 7rem;display:flex;flex-direction:column;gap:1.1rem">

        <!-- Anxiety -->
        <div class="card">
          <div class="card-body">
            <h3 style="margin-bottom:.9rem">Matematik Kaygı Profili</h3>
            <div style="display:flex;align-items:center;gap:1.1rem">
              <div style="position:relative;width:78px;height:78px;flex-shrink:0">
                <svg viewBox="0 0 36 36" style="width:78px;height:78px;transform:rotate(-90deg)">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" stroke-width="2.5"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="${anxColor}" stroke-width="2.5"
                    stroke-dasharray="${anxScore} ${100-anxScore}" stroke-linecap="round"/>
                </svg>
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:var(--t-xl);color:${anxColor}">${anxScore}%</div>
              </div>
              <div>
                <p style="font-weight:700">${anxLevel===AnxietyLevel.LOW?'Düşük Kaygı':anxLevel===AnxietyLevel.MEDIUM?'Orta Kaygı':'Yüksek Kaygı'}</p>
                <p style="font-size:var(--t-md);color:var(--muted);margin-top:.25rem;line-height:1.5">
                  ${anxLevel===AnxietyLevel.LOW?'Harika! Düşük kaygı ile çok etkili destek verebilirsiniz.':anxLevel===AnxietyLevel.MEDIUM?'Orta düzey kaygı, farkındalıkla yönetilebilir.':'Yüksek kaygı. Önce kendinize karşı nazik olun.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Badges earned -->
        <div class="card">
          <div class="card-body">
            <h3 style="margin-bottom:.8rem">Rozetlerim 🏅</h3>
            ${(p.badges||[]).length===0
              ?`<p class="muted" style="font-size:var(--t-md)">Henüz rozet kazanılmadı. İlk etkinliği tamamla!</p>`
              :`<div style="display:flex;flex-wrap:wrap;gap:.6rem">
                ${p.badges.map(b=>`<div style="text-align:center;padding:.6rem .8rem;background:linear-gradient(135deg,rgba(255,209,102,.25),rgba(244,162,97,.2));border-radius:var(--r-md);border:1.5px solid rgba(255,209,102,.5)">
                  <div style="font-size:1.8rem">${b.emoji}</div>
                  <div style="font-size:var(--t-xs);font-weight:700;margin-top:.15rem">${b.label}</div>
                </div>`).join('')}
              </div>`}
          </div>
        </div>

        <!-- App info -->
        <div class="card card-sm">
          <div class="card-body" style="display:flex;flex-direction:column;gap:.55rem">
            <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)"><span class="muted">Versiyon</span><span class="mono" style="font-size:var(--t-sm)">ABMATO v1.0</span></div>
            <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)"><span class="muted">Etkinlik bankası</span><span>${this._repo.all().length} etkinlik</span></div>
            <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)"><span class="muted">Kategoriler</span><span>${Object.keys(this._CatLabels).length} kategori</span></div>
            <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)"><span class="muted">Rozet sistemi</span><span>${BadgeEngine.DEFS.length} rozet</span></div>
            <div style="border-top:1px solid var(--border);margin-top:.2rem;padding-top:.5rem;display:flex;justify-content:space-between;font-size:var(--t-md)"><span class="muted">Geliştirici</span><span style="font-weight:700">Prof. Dr. Yılmaz Mutlu</span></div>
          </div>
        </div>

        ${this._canEdit()?`
        <div class="card card-sm" style="margin-bottom:.75rem;border:1.5px solid var(--teal-l);background:linear-gradient(135deg,rgba(46,125,50,.06),rgba(46,125,50,.02))">
          <div class="card-body" style="display:flex;flex-direction:column;gap:.55rem">
            <h3 style="font-size:var(--t-md);margin-bottom:.15rem;color:var(--teal-d)">🛠️ Yönetici / İçerik</h3>
            <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.5;margin-bottom:.35rem">
              Etkinlik, akademi modülü, kitap, hikaye ve sohbet kartlarını yönetin — düzenleyin, silin veya yenisini ekleyin.
            </p>
            <button onclick="App._openAdmin()" class="btn btn-primary btn-block" style="font-size:var(--t-md);font-weight:800">
              🛠️ Yönetici Paneline Git →
            </button>
            <button onclick="App._toggleEditMode()" class="btn btn-block"
              style="background:${this._isEditMode()?'var(--teal)':'var(--raised)'};
                color:${this._isEditMode()?'#fff':'var(--text)'};
                border:1.5px solid ${this._isEditMode()?'var(--teal)':'var(--border)'};
                font-size:var(--t-sm)">
              ${this._isEditMode()?'✏️ Sayfa İçi Düzenleme Aktif — Kapat':'✏️ Sayfa İçi Düzenleme Modu'}
            </button>
            <p style="font-size:var(--t-xs);color:var(--muted);text-align:center">
              ${this._isEditMode()?'Tüm sayfalarda kartların altında düzenle/sil butonları görünür.':'Sayfalardaki kartların altına düzenle/sil butonları ekler.'}
            </p>
          </div>
        </div>
        ${this._renderUserMgmt()}
        `:''}

        <!-- v6 — Hesap & Güvenlik -->
        <div class="card card-sm">
          <div class="card-body" style="display:flex;flex-direction:column;gap:.55rem">
            <h3 style="font-size:var(--t-md);margin-bottom:.15rem">🔐 Hesap & Güvenlik</h3>
            <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.5;margin-bottom:.35rem">
              Şifre değiştir, oturum bilgisi, hesap durumu.
            </p>
            <button class="btn btn-soft btn-block" style="font-size:var(--t-sm)" onclick="App._openAccountSecurity()">🔑 Hesap & Güvenlik →</button>
          </div>
        </div>

        <!-- v4 — Erişilebilirlik & Çocuk Modu -->
        <div class="card card-sm">
          <div class="card-body" style="display:flex;flex-direction:column;gap:.55rem">
            <h3 style="font-size:var(--t-md);margin-bottom:.15rem">♿ Erişilebilirlik & Mod</h3>
            <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.55;margin-bottom:.35rem">
              Yüksek kontrast, büyük font, disleksi-dostu font, sesli okuma (TTS), zaman baskısız mod.
            </p>
            <button class="btn btn-soft btn-block" style="font-size:var(--t-sm)" onclick="App._openA11y()">♿ Erişilebilirlik Ayarları →</button>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-soft" style="flex:1;font-size:var(--t-sm)" onclick="App._openKidsMode()">🌟 Çocuk Modu</button>
              <button class="btn btn-soft" style="flex:1;font-size:var(--t-sm)" onclick="App._kidsSetPin()">🔒 PIN Ayarla</button>
            </div>
            <button class="btn btn-soft btn-block" style="font-size:var(--t-sm)" onclick="App._enableNotifications()">🔔 Bildirimleri Etkinleştir</button>
          </div>
        </div>

        <!-- v4 — Öğretmen Raporu (CSV/PDF) -->
        <div class="card card-sm">
          <div class="card-body" style="display:flex;flex-direction:column;gap:.55rem">
            <h3 style="font-size:var(--t-md);margin-bottom:.15rem">📄 Öğretmen / RAM Raporu</h3>
            <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.55;margin-bottom:.35rem">
              Çocuğunuzun ilerleme verisini öğretmenle veya RAM ile paylaşmak için.
            </p>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-soft" style="flex:1;font-size:var(--t-sm)" onclick="App._exportCsv()">📊 CSV İndir</button>
              <button class="btn btn-soft" style="flex:1;font-size:var(--t-sm)" onclick="App._exportSummary()">📝 PDF Raporu</button>
            </div>
          </div>
        </div>

        <!-- v6 — Diskalkuli Derneği -->
        <div class="card card-sm" style="border:1.5px solid var(--teal-l);background:linear-gradient(135deg,rgba(46,125,50,.06),rgba(46,125,50,.02))">
          <div class="card-body" style="display:flex;align-items:center;gap:.85rem;padding:.85rem 1rem">
            <img src="./icons/dernek-logo.png" alt="" aria-hidden="true" style="width:46px;height:46px;border-radius:50%;background:#fff;padding:2px;flex-shrink:0;border:1px solid var(--border)">
            <div style="flex:1;min-width:0">
              <strong style="font-size:var(--t-md);color:var(--teal-d);display:block">Diskalkuli Derneği</strong>
              <p style="font-size:var(--t-xs);color:var(--muted);margin-top:.15rem;line-height:1.45">Hakkında & iletişim</p>
            </div>
            <button class="btn btn-soft btn-sm" onclick="App.show('about')" style="flex-shrink:0">→</button>
          </div>
        </div>

        <!-- Veri Yedekleme -->
        <div class="card card-sm" aria-label="Veri yedekleme">
          <div class="card-body" style="display:flex;flex-direction:column;gap:.55rem">
            <h3 style="font-size:var(--t-md);margin-bottom:.15rem">📦 Veri Yedekleme</h3>
            <p style="font-size:var(--t-xs);color:var(--muted);line-height:1.55;margin-bottom:.35rem">
              Tüm verileriniz cihazınızda saklanır. Cihaz değiştirirken veya ikinci bir ebeveyne aktarırken
              yedek alın. Yedek dosyası tamamen çevrimdışıdır, hiçbir yere gönderilmez.
            </p>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-soft" style="flex:1;font-size:var(--t-sm)" onclick="App._exportData()" aria-label="Verileri JSON dosyasına dışa aktar">📤 Dışa Aktar</button>
              <button class="btn btn-soft" style="flex:1;font-size:var(--t-sm)" onclick="App._promptImportData()" aria-label="JSON yedekten geri yükle">📥 İçe Aktar</button>
            </div>
          </div>
        </div>

        <!-- PWA Install (beforeinstallprompt yakalandıysa) -->
        <div id="pwa-install-row" style="display:${this._pwaInstallReady?'block':'none'}">
          <button class="btn btn-soft btn-block" onclick="App._installPwa()"
            style="font-size:var(--t-sm);margin-top:.1rem" aria-label="Uygulamayı ana ekrana ekle">
            📲 Ana Ekrana Ekle
          </button>
        </div>

        <button class="btn btn-soft btn-block" onclick="App._logout()" style="margin-bottom:.5rem">Çıkış Yap</button><button class="btn btn-ghost btn-block" style="color:var(--muted);border-color:var(--muted)" onclick="App._confirmReset()">⚙ Sıfırla &amp; Yeniden Başla</button>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════
     WEEKLY CHECK-IN
  ══════════════════════════════════════════════ */

  _shouldCheckIn(){
    const p=this._parent;
    if(!p?.weeklyCheckIns?.length) return true;
    const last=p.weeklyCheckIns[p.weeklyCheckIns.length-1];
    return (Date.now()-new Date(last.date).getTime()) > 6*86400000;
  }

  _openCheckIn(){
    this._wqResp={};
    this._openModal(`
      <h2 style="margin-bottom:.3rem">Haftalık Check-In 📋</h2>
      <p class="muted" style="font-size:var(--t-md);margin-bottom:1.2rem">3 soru, 2 dakika.</p>
      <div style="display:flex;flex-direction:column;gap:.9rem">
        ${this._weekQs.map(q=>`
          <div style="background:var(--raised);border-radius:var(--r-md);padding:var(--s-sm) var(--s-md)">
            <p style="font-size:var(--t-md);font-weight:700;margin-bottom:.6rem">${q.text}</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap">
              ${q.opts.map(o=>`<button id="ci-${q.id}-${o.replace(/\s/g,'_')}" class="checkin-opt chip chip-muted" onclick="App._ciSel('${q.id}','${o}')" style="padding:.42rem .85rem;cursor:pointer;border:1.5px solid var(--border)">${o}</button>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:1.2rem" onclick="App._submitCheckIn()">Kaydet ✓</button>
    `);
  }

  _ciSel(qid, val){
    this._wqResp[qid]=val;
    document.querySelectorAll(`[id^="ci-${qid}-"]`).forEach(b=>{
      const isSelected = b.textContent.trim()===val;
      b.style.background = isSelected ? 'var(--teal)' : '';
      b.style.color = isSelected ? '#fff' : '';
      b.style.borderColor = isSelected ? 'var(--teal)' : 'var(--border)';
    });
  }

  _submitCheckIn(){
    if(Object.keys(this._wqResp).length<this._weekQs.length){ this._toast('Tüm soruları yanıtlayın','err'); return; }
    const ci={date:new Date(), responses:this._wqResp};
    this._parent={...this._parent, weeklyCheckIns:[...(this._parent.weeklyCheckIns||[]),ci]};
    this._storage.set('parent',this._parent);

    // Kaygı seviyelini takip et
    const anxResp = this._wqResp['wq3'] || '';
    const newAnxScore = anxResp.includes('Rahat') ? 25 :
                        anxResp.includes('Orta')  ? 55 : 80;
    const newLevel = newAnxScore < 35 ? AnxietyLevel.LOW :
                     newAnxScore < 65 ? AnxietyLevel.MEDIUM : AnxietyLevel.HIGH;
    this._anxTracker.record(newAnxScore, newLevel);

    // Ebeveyn profilindeki kaygı skorunu güncelle
    this._parent = {
      ...this._parent,
      anxietyProfile: { level:newLevel, score:newAnxScore, assessedAt:new Date() }
    };
    this._storage.set('parent', this._parent);

    this._closeModal();
    this._toast('Check-in kaydedildi! 🌿','ok');
    if(this._activeView==='dashboard') this._renderDash();
  }

  /* ══════════════════════════════════════════════
     BADGE MODAL + CONFETTI
  ══════════════════════════════════════════════ */

  _badgeModal(badge){
    this._openModal(`
      <div style="text-align:center;padding:1rem">
        <div style="font-size:5rem;animation:popIn .5s var(--spring);margin-bottom:.5rem">${badge.emoji}</div>
        <h2 style="color:var(--teal)">Rozet Kazandın!</h2>
        <h3 style="margin:.4rem 0">${badge.label}</h3>
        <p class="muted" style="font-size:var(--t-md)">Harika iş çıkardın! Devam et 💪</p>
        <button class="btn btn-primary btn-lg" style="margin-top:1.3rem" onclick="App._closeModal()">Teşekkürler 🎉</button>
      </div>
    `);
  }

  _confetti(){
    const colors=['#FF6B35','#FFD166','#06D6A0','#118AB2','#7B2D8B','#F4845F'];
    const container=document.body;
    for(let i=0;i<28;i++){
      const p=document.createElement('div');
      p.className='confetti-piece';
      p.style.cssText=`
        left:${Math.random()*100}vw;top:-20px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        transform:rotate(${Math.random()*360}deg);
        animation-delay:${Math.random()*0.5}s;
        animation-duration:${1.2+Math.random()*0.6}s;
        width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;
      `;
      container.appendChild(p);
      setTimeout(()=>p.remove(), 2000);
    }
  }

  /* ══════════════════════════════════════════════
     BOTTOM NAV
  ══════════════════════════════════════════════ */

  _updateBnavs(active){
    // Sub-view'lar için aktif nav item tespiti
    const navMap = {
      'tymm':'learn','stories':'learn',
      'books':'learn','mathtalk':'learn','dyscalculia':'learn',
      'spatial':'learn','breathing':'learn',
      'teacher':'planner','sms':'planner',
      'notifications':'dashboard',
    };
    const activeNav = navMap[active] || active;
    const items=[
      {
        id:'dashboard', label:'Anasayfa',
        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        svgFill:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`
      },
      {
        id:'activities', label:'Etkinlikler',
        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
        svgFill:`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`
      },
      {
        id:'skill', label:'Beceri',
        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        svgFill:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
      },
      {
        id:'learn', label:'Akademi',
        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
        svgFill:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18V17h14v-5.82L23 9zm6 12H6v-4.73L12 13l6-2.73V15zm1-8.19L12 7.1 5 10.81V9l7-4 7 4z"/></svg>`
      },
      {
        id:'progress', label:'Gelişim',
        svg:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        svgFill:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V7h4v2zm4 8h-2V7h2v10z"/></svg>`
      },
    ];
    const html = items.map(n=>`<button class="nav-btn ${n.id===activeNav?'active':''}" onclick="App.show('${n.id}')" aria-label="${n.label}" title="${n.label}">
      <div class="nav-icon">${n.id===activeNav?n.svgFill||n.svg:n.svg}</div>
      <span>${n.label}</span>
    </button>`).join('');
    const noNavViews = new Set(['splash','login','onboarding']);
    if(noNavViews.has(active)) return;
    ['bnav-1','bnav-2','bnav-3','bnav-4','bnav-5','bnav-6','bnav-7'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.innerHTML=html;
    });
  }

  /* ══════════════════════════════════════════════
     MODAL + TOAST
  ══════════════════════════════════════════════ */

  _openModal(html, footer=''){
    // html  : kayan gövde içeriği
    // footer: (opsiyonel) scroll alanı dışında sabit alt şerit
    // A11y: role=dialog, aria-modal, escape-to-close, focus trap, prev focus restore
    this._prevFocus = document.activeElement;
    document.getElementById('modals').innerHTML=`
      <div class="modal-overlay" onclick="if(event.target===this)App._closeModal()" role="presentation">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Bilgi penceresi" tabindex="-1">
          <div class="modal-handle" aria-hidden="true"></div>
          <button type="button" aria-label="Kapat" onclick="App._closeModal()"
            style="position:absolute;top:.4rem;right:.5rem;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.06);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;color:var(--text);z-index:5;transition:background .15s"
            onmouseover="this.style.background='rgba(0,0,0,.12)'"
            onmouseout="this.style.background='rgba(0,0,0,.06)'">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
          <div class="modal-body">${html}</div>
          ${footer?`<div class="modal-footer">${footer}</div>`:''}
        </div>
      </div>`;
    // Bind escape-to-close and focus trap
    if(!this._modalKeyHandler){
      this._modalKeyHandler = (e) => this._handleModalKey(e);
    }
    document.addEventListener('keydown', this._modalKeyHandler);
    // Move focus into modal
    setTimeout(() => {
      const modal = document.querySelector('.modal[role="dialog"]');
      if(modal){
        const focusable = this._getFocusableInside(modal);
        (focusable[0] || modal).focus();
      }
    }, 50);
  }

  _getFocusableInside(el){
    if(!el) return [];
    return Array.from(el.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  _handleModalKey(e){
    if(e.key === 'Escape'){
      e.preventDefault();
      this._closeModal();
      return;
    }
    if(e.key === 'Tab'){
      const modal = document.querySelector('.modal[role="dialog"]');
      if(!modal) return;
      const focusable = this._getFocusableInside(modal);
      if(!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if(e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    }
  }

  _bdClick(e){ if(e.target.classList.contains('backdrop')) this._closeModal(); }
  _closeModal(){
    document.getElementById('modals').innerHTML='';
    if(this._modalKeyHandler){
      document.removeEventListener('keydown', this._modalKeyHandler);
    }
    // Restore focus
    if(this._prevFocus && typeof this._prevFocus.focus === 'function'){
      try{ this._prevFocus.focus(); }catch(_){}
    }
    this._prevFocus = null;
  }

  _toast(msg, type=''){
    const t=document.createElement('div');
    t.className=`toast ${type}`;
    t.textContent=msg;
    // A11y: screen reader announcement
    t.setAttribute('role', type === 'err' ? 'alert' : 'status');
    t.setAttribute('aria-live', type === 'err' ? 'assertive' : 'polite');
    document.getElementById('toasts').appendChild(t);
    // Hata 3.5s, bilgi 2.4s görünür kalır; sonra .hide → fade out
    const dur = type === 'err' ? 3500 : 2400;
    setTimeout(() => {
      t.classList.add('hide');
      setTimeout(() => t.remove(), 260);
    }, dur);
  }

  /* ══════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════ */

  /**
   * HTML-escape herhangi bir değer.
   * Kullanıcıdan gelen string'ler (ad, çocuk adı, e-posta, not, vb.)
   * innerHTML veya template literal ile render edilmeden önce
   * MUTLAKA bu fonksiyondan geçmelidir.
   * 5 karakter: & < > " '   → HTML entity karşılıkları.
   */
  _esc(s){
    return String(s ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  _getChild(){
    const p=this._parent; if(!p?.children?.length) return null;
    return p.children.find(c=>c.id===this._childId)||p.children[0];
  }

  _relTime(isoStr){
    const d=new Date(isoStr);
    const mins=Math.round((Date.now()-d)/60000);
    if(mins<1) return 'şimdi';
    if(mins<60) return `${mins} dk önce`;
    if(mins<1440) return `${Math.round(mins/60)} saat önce`;
    return d.toLocaleDateString('tr-TR');
  }

  _confirmReset(){
    this._openModal(`
      <div class="center">
        <div style="font-size:3rem;margin-bottom:.5rem">⚠️</div>
        <h2>Sıfırla?</h2>
        <p class="muted" style="margin:.6rem auto 1.3rem;max-width:260px">Tüm veriler silinir. Bu işlem geri alınamaz.</p>
        <div style="display:flex;gap:.8rem">
          <button class="btn btn-ghost" style="flex:1" onclick="App._closeModal()">İptal</button>
          <button class="btn btn-danger" style="flex:1" onclick="App._reset()">Sıfırla</button>
        </div>
      </div>
    `);
  }

  _reset(){
    this._storage.clear();
    this._parent=null; this._childId=null;
    this._closeModal();
    this.show('splash');
  }

  /* ══════════════════════════════════════════════
     VERİ YEDEKLEME (EXPORT / IMPORT)
     — Cihaz değişikliği ve aile çocuk profili transferi için.
     — Sunucusuz, dosya tabanlı JSON. Tüm namespace'i kapsar.
  ══════════════════════════════════════════════ */

  _exportData(){
    try {
      const payload = this._storage.exportAll();
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const pname = (this._parent?.name || 'abmat').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      const stamp = new Date().toISOString().slice(0,10);
      a.href = url;
      a.download = `abmat-yedek-${pname||'kullanici'}-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
      this._toast('Yedek dosyası indirildi ✓','ok');
    } catch(err) {
      console.error('[ABMATO] Export failed:', err);
      this._toast('Yedek oluşturulamadı','err');
    }
  }

  _promptImportData(){
    // Kullanıcıya önce uyarı göster — import veriyi üzerine yazar
    this._openModal(`
      <div class="center">
        <div style="font-size:2.6rem;margin-bottom:.3rem">📥</div>
        <h2>Yedekten Geri Yükle</h2>
        <p class="muted" style="margin:.6rem auto 1.1rem;max-width:280px;font-size:var(--t-md);line-height:1.55">
          Yükleyeceğiniz yedek dosyası mevcut tüm ABMATO verilerinin yerini alır.
          Mevcut durumun kaybolmasını istemiyorsanız önce "Dışa Aktar" ile yedek alın.
        </p>
        <input type="file" id="abmat-import-file" accept="application/json,.json"
          style="display:block;margin:0 auto 1rem;max-width:260px;font-family:var(--ff-body);font-size:var(--t-sm)">
        <div style="display:flex;gap:.8rem">
          <button class="btn btn-ghost" style="flex:1" onclick="App._closeModal()">İptal</button>
          <button class="btn btn-primary" style="flex:1" onclick="App._importDataFile()">Yükle</button>
        </div>
      </div>
    `);
  }

  _importDataFile(){
    const input = document.getElementById('abmat-import-file');
    const file = input && input.files && input.files[0];
    if(!file){ this._toast('Bir dosya seçin','err'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const result = this._storage.importAll(payload, { replace: true });
        this._closeModal();
        this._toast(`Yedek yüklendi (${result.written} kayıt) ✓`,'ok');
        // Parent'ı yeniden yükle ve dashboard'a dön
        const saved = this._storage.get('parent');
        if(saved?.onboardingComplete){
          this._parent = saved;
          this._childId = saved.children?.[0]?.id || null;
          this.show('dashboard');
        } else {
          this.show('splash');
        }
      } catch(err) {
        console.error('[ABMATO] Import failed:', err);
        this._toast(`Hatalı yedek: ${err.message||'okunamadı'}`,'err');
      }
    };
    reader.onerror = () => this._toast('Dosya okunamadı','err');
    reader.readAsText(file);
  }

  /* ══════════════════════════════════════════════
     PWA — Ana Ekrana Ekle (beforeinstallprompt)
     main.js beforeinstallprompt olayını yakalayıp
     _pwaInstallReady=true + _triggerInstall() ile iletir.
  ══════════════════════════════════════════════ */

  _updateInstallButton(){
    // Profil ekranında PWA install satırını yeniden hesapla
    const row = document.getElementById('pwa-install-row');
    if(row) row.style.display = this._pwaInstallReady ? 'block' : 'none';
    // Banner'ı da güncelle (her view'de tetikleyici olay)
    this._maybeShowInstallBanner();
  }

  async _installPwa(){
    if(typeof this._triggerInstall !== 'function'){
      this._toast('Bu tarayıcıda yükleme desteklenmiyor','err'); return;
    }
    try {
      const ok = await this._triggerInstall();
      if(ok) this._toast('Ana ekrana eklendi ✓','ok');
    } catch(err){
      console.warn('[ABMATO] Install prompt failed:', err);
    }
    this._updateInstallButton();
  }

  /* ── PWA Install Banner ──────────────────────────────────
     Splash veya dashboard'da bottom banner ile davet eder.
     Android Chrome/Edge: beforeinstallprompt yakalandığında "Yükle" native prompt'u açar.
     iOS Safari: API yok — adım adım görsel modal gösterir.
  ──────────────────────────────────────────────────────── */
  _isIOS(){
    return /iPhone|iPad|iPod/.test(navigator.userAgent || '');
  }
  _isStandalone(){
    // Zaten yüklü olarak çalışıyor mu?
    return window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }
  _isInstallDismissed(){
    try {
      const ts = parseInt(localStorage.getItem('pwa_install_dismissed_at') || '0', 10);
      if(!ts) return false;
      // 24 saat hatırla
      return (Date.now() - ts) < 24 * 60 * 60 * 1000;
    } catch { return false; }
  }
  _dismissInstall(){
    try { localStorage.setItem('pwa_install_dismissed_at', String(Date.now())); } catch {}
    const el = document.getElementById('pwa-install-banner');
    if(el){
      el.classList.remove('visible');
      setTimeout(() => { el.hidden = true; }, 300);
    }
  }
  /**
   * Yükleme banner'ını uygun koşullarda göster:
   *  - Henüz yüklü değil (standalone değil)
   *  - 24 saat içinde dismiss edilmedi
   *  - Şu anki view splash veya dashboard
   *  - Android: beforeinstallprompt yakalanmış olmalı
   *  - iOS Safari: doğrudan gösterilir (API yok ama modal verilebilir)
   */
  _maybeShowInstallBanner(){
    const el = document.getElementById('pwa-install-banner');
    if(!el) return;
    if(this._isStandalone() || this._isInstallDismissed()){
      el.hidden = true; el.classList.remove('visible'); return;
    }
    const okView = this._activeView === 'splash' || this._activeView === 'dashboard';
    const canInstall = this._isIOS() || this._pwaInstallReady;
    if(!okView || !canInstall){
      el.hidden = true; el.classList.remove('visible'); return;
    }
    el.hidden = false;
    // Bir sonraki frame'de visible class ekle (CSS geçişi için)
    setTimeout(() => el.classList.add('visible'), 50);
  }
  /**
   * "Yükle" tıklandı: Android'de native prompt; iOS'ta görsel rehber modal.
   */
  async _doInstall(){
    if(this._isIOS()){
      this._showIosInstallModal();
      return;
    }
    if(typeof this._triggerInstall === 'function'){
      try {
        const ok = await this._triggerInstall();
        if(ok){
          this._toast('Ana ekrana eklendi ✓','ok');
          this._dismissInstall();
        }
      } catch(err){
        console.warn('[ABMATO] Install prompt failed:', err);
      }
      this._updateInstallButton();
    } else {
      this._toast('Tarayıcı henüz hazır değil — birkaç saniye sonra tekrar dene','err');
    }
  }
  _showIosInstallModal(){
    this._openModal(`
      <div style="padding:1.2rem 1.1rem .5rem">
        <div style="text-align:center;margin-bottom:1rem">
          <div style="font-size:2.6rem;margin-bottom:.3rem">📲</div>
          <h3 style="margin:0">Telefonuna kur — iPhone/iPad</h3>
          <p style="font-size:.85rem;color:var(--muted);margin-top:.4rem;line-height:1.5">
            Safari uygulamadan ana ekrana eklemek için:
          </p>
        </div>
        <ol style="padding-left:1.2rem;margin:0;display:flex;flex-direction:column;gap:.85rem">
          <li style="font-size:.95rem;line-height:1.55">
            Ekranın alt çubuğundaki
            <strong style="display:inline-flex;align-items:center;gap:.25rem;background:var(--raised);padding:.15rem .5rem;border-radius:8px;border:1px solid var(--border)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 12v8h16v-8"/></svg>
              Paylaş
            </strong>
            butonuna dokun.
          </li>
          <li style="font-size:.95rem;line-height:1.55">
            Açılan listede aşağı kaydır → <strong>"Ana Ekrana Ekle"</strong> seçeneğine dokun.
          </li>
          <li style="font-size:.95rem;line-height:1.55">
            Sağ üstte <strong>"Ekle"</strong> tıkla. Bitti! Uygulama ana ekranda. 🎉
          </li>
        </ol>
        <button class="btn btn-soft btn-block" style="margin-top:1.2rem" onclick="App._dismissInstall();App._closeModal()">Anladım</button>
      </div>
    `);
  }


  /* ══════════════════════════════════════════════════════════
     ABMATO — INLINE DÜZENLEME SİSTEMİ
     Profil → "✏️ Düzenleme Modunu Aç" → kart altında ✏️/🗑 çıkar
  ══════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════
     OTURUM SONLANDIRMA
     (Üyelik / giriş şartı yok — uygulama tamamen ücretsiz.)
  ══════════════════════════════════════════════════════════ */

  _logout(){
    // Sadece yerel kullanıcı oturumunu (cihaz üzerindeki admin/editor login'i) kapat
    try { this._auth?.logout(); } catch {}
    this._parent = null; this._childId = null;
    this._toast('Çıkış yapıldı');
    setTimeout(() => this.show('splash'), 300);
  }

  _loginSuccess(u){
    /* Cihaz üzerinde admin/editor olarak yerel giriş yapıldığında çağrılır.
       Üyelik akışı değildir — yalnızca içerik düzenleme yetkisi içindir. */
    const saved = this._storage.get('parent_' + u.id) || this._storage.get('parent');
    if(saved?.onboardingComplete){
      this._parent = { ...saved, id: u.id, name: u.name, email: u.email || saved.email, role: u.role, username: u.username };
      this._storage.set('parent', this._parent);
      this._storage.set('parent_' + u.id, this._parent);
      this._childId = saved.children?.[0]?.id || null;
      this.show('dashboard');
      setTimeout(() => this._toast('Hoş geldiniz, ' + this._parent.name + '! 👋', 'ok'), 400);
    } else {
      this._ob = { step:0, name:u.name, email:u.email||'', childName:'', ageGroup:'', style:'autonomy', anxiety:{}, resources:[] };
      this.show('onboarding');
      this._renderOb();
    }
  }


  _canEdit(){ const r=this._parent?.role; return r==='admin'||r==='editor'; }
  _isAdmin(){ return this._parent?.role==='admin'; }
  _isEditMode(){ return this._canEdit()&&sessionStorage.getItem('abmat_em')==='1'; }
  _toggleEditMode(){
    if(this._isEditMode()) sessionStorage.removeItem('abmat_em');
    else sessionStorage.setItem('abmat_em','1');
    const v=this._activeView; if(v) this.show(v);
    this._renderProfile();
  }

  _editBar(id, type){
    if(!this._isEditMode()) return '';
    return '<div class="edit-bar" onclick="event.stopPropagation()">'
      +'<button class="edit-bar-btn" onclick="App._inlineEdit(\''+type+'\',\''+id+'\')">✏️ Düzenle</button>'
      +(this._isAdmin()?'<button class="edit-bar-del" onclick="App._inlineDel(\''+type+'\',\''+id+'\')">🗑</button>':'')
      +'</div>';
  }

  _inlineEdit(type,id){
    if(type==='activity') this._editActivity(id);
    else if(type==='lm')  this._editLM(id);
    else if(type==='book')this._editBook(id);
    else if(type==='story')this._editStory(id);
    else if(type==='mt')  this._editMT(id);
  }
  _inlineDel(type,id){
    const L={activity:'etkinlik',lm:'modül',book:'kitap',story:'hikaye',mt:'kart'};
    if(!confirm('Bu '+(L[type]||'öğe')+' silinsin mi?')) return;
    if(type==='activity'){ const i=this._repo._data.findIndex(a=>a.id===id); if(i>=0)this._repo._data.splice(i,1); this._persistContent('activities'); }
    else if(type==='lm')  { this._learnModules=this._learnModules.filter(m=>m.id!==id); this._persistContent('learn'); }
    else if(type==='book'){ this._bookLibrary=this._bookLibrary.filter(b=>b.id!==id); this._persistContent('books'); }
    else if(type==='story'){ if(!this._stories)this._stories=[]; this._stories.splice(parseInt(id),1); this._persistContent('stories'); }
    else if(type==='mt')  { this._sayiSohbetiKartlari=this._sayiSohbetiKartlari.filter(m=>m.id!==id); this._persistContent('mt'); }
    this.show(this._activeView); this._toast('Silindi');
  }

  /* ── Form yardımcıları ──────────────────────────────── */
  _ef(id){ return document.getElementById('ef-'+id)?.value?.trim()||''; }
  _echk(nm){ return [...document.querySelectorAll('[name="'+nm+'"]:checked')].map(c=>c.value); }
  _eF(lbl,html){ return '<div style="margin-bottom:.6rem"><div style="font-size:var(--t-xs);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">'+lbl+'</div>'+html+'</div>'; }
  _eI(id,v,t,ro){
    t=t||'text'; ro=ro||''; v=this._eesc(v||'');
    return '<input id="ef-'+id+'" type="'+t+'" value="'+v+'" '+ro+' style="width:100%;background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit;margin-top:.2rem">';
  }
  _eT(id,v,h){
    h=h||80; v=this._eesc(v||'');
    return '<textarea id="ef-'+id+'" style="width:100%;background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit;margin-top:.2rem;resize:vertical;min-height:'+h+'px">'+v+'</textarea>';
  }
  _eS(id,opts,val){
    return '<select id="ef-'+id+'" style="width:100%;background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit;margin-top:.2rem">'
      +Object.entries(opts).map(function(e){return '<option value="'+e[0]+'"'+(val==e[0]?' selected':'')+'>'+e[1]+'</option>';}).join('')+'</select>';
  }
  _eAge(sel){
    sel=sel||[];
    var A={PRESCHOOL:'OK.Ö.',G1:'1.S',G2:'2.S',G3:'3.S',G4:'4.S'};
    return Object.entries(A).map(function(e){
      var k=e[0],v=e[1],s=sel.includes(k);
      return '<label style="display:inline-flex;align-items:center;gap:.25rem;'
        +'background:'+(s?'var(--teal-a)':'var(--raised)')+';'
        +'border:1.5px solid '+(s?'var(--teal)':'var(--border)')+';'
        +'border-radius:99px;padding:.16rem .5rem;font-size:var(--t-xs);cursor:pointer;color:var(--muted);margin:.12rem;transition:var(--t)">'
        +'<input type="checkbox" name="eAge" value="'+k+'" '+(s?'checked':'')+' style="display:none">'+v+'</label>';
    }).join('');
  }
  _eBtns(fn){ return '<div style="display:flex;gap:.5rem;margin-top:.75rem"><button class="btn btn-soft btn-block" onclick="App._closeModal()">İptal</button><button class="btn btn-primary btn-block" onclick="'+fn+'">Kaydet ✓</button></div>'; }
  _eesc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ── Etkinlik ───────────────────────────────────────── */
  _editActivity(id){
    var a=this._repo.byId(id); if(!a) return;
    var C={NUMBER:'Sayı',PATTERNS:'Örüntü',GEOMETRY:'Geometri',MEASUREMENT:'Ölçme',DAILY:'Günlük',PROBLEM:'Problem',SPATIAL:'Uzamsal',KITCHEN:'Mutfak',MARKET:'Market',TIME:'Zaman',GAME:'Oyun',NATURE:'Doğa'};
    this._openModal(
      '<h3 style="margin-bottom:.9rem">✏️ Etkinlik Düzenle</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji',a.emoji))
      +this._eF('Süre (dk)',this._eI('dur',String(a.dur),'number'))
      +'</div>'
      +this._eF('Başlık',this._eI('title',a.title))
      +this._eF('Açıklama',this._eI('desc',a.desc))
      +this._eF('Kategori',this._eS('cat',C,a.category))
      +this._eF('Yaş Grupları','<div style="margin-top:.25rem">'+this._eAge(a.ageGroups)+'</div>')
      +this._eF('Malzemeler (virgülle)',this._eI('mat',(a.materials||[]).join(', ')))
      +this._eF('Adımlar (her satır bir adım)',this._eT('steps',(a.steps||[]).join('\n'),85))
      +this._eF('İpucu',this._eT('tip',a.tip||'',55))
      +'<div style="display:flex;gap:1rem;margin-bottom:.5rem">'
      +'<label style="display:flex;align-items:center;gap:.3rem;font-size:var(--t-sm);cursor:pointer">'
      +'<input type="checkbox" id="ef-anx" '+(a.anxFriendly?'checked':'')+' style="accent-color:var(--teal);width:14px;height:14px"> Kaygı Dostu</label>'
      +'<label style="display:flex;align-items:center;gap:.3rem;font-size:var(--t-sm);cursor:pointer">'
      +'<input type="checkbox" id="ef-dysc" '+(a.dysc?'checked':'')+' style="accent-color:var(--teal);width:14px;height:14px"> Diskalkuli</label>'
      +'</div>'
      +this._eBtns('App._saveActivity(\''+id+'\')')
    );
  }
  _saveActivity(id){
    var a=this._repo.byId(id); if(!a) return;
    a.emoji=this._ef('emoji')||a.emoji; a.title=this._ef('title')||a.title;
    a.desc=this._ef('desc'); a.category=this._ef('cat');
    a.dur=parseInt(this._ef('dur'))||a.dur;
    var ag=this._echk('eAge'); if(ag.length) a.ageGroups=ag;
    a.materials=this._ef('mat').split(',').map(function(s){return s.trim();}).filter(Boolean);
    a.steps=this._ef('steps').split('\n').map(function(s){return s.trim();}).filter(Boolean);
    a.tip=this._ef('tip');
    a.anxFriendly=!!document.getElementById('ef-anx')?.checked;
    a.dysc=!!document.getElementById('ef-dysc')?.checked;
    this._persistContent('activities');
    this._closeModal(); this.show(this._activeView); this._toast('Etkinlik güncellendi ✓','ok');
  }

  /* ── Akademi Modülü ─────────────────────────────────── */
  _editLM(id){
    var m=this._learnModules.find(function(x){return x.id===id;}); if(!m) return;
    this._openModal(
      '<h3 style="margin-bottom:.9rem">✏️ Modül Düzenle</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji',m.emoji))
      +this._eF('Süre',this._eI('dur',m.dur))+'</div>'
      +this._eF('Başlık',this._eI('title',m.title))
      +this._eF('Alt Başlık',this._eI('sub',m.sub||''))
      +this._eF('Seviye',this._eS('level',{'1':'Başlangıç','2':'Orta','3':'İleri'},String(m.level)))
      +this._eF('İçerik',this._eT('text',m.text||'',110))
      +this._eBtns('App._saveLM(\''+id+'\')')
    );
  }
  _saveLM(id){
    var m=this._learnModules.find(function(x){return x.id===id;}); if(!m) return;
    m.emoji=this._ef('emoji')||m.emoji; m.title=this._ef('title')||m.title;
    m.sub=this._ef('sub'); m.dur=this._ef('dur')||m.dur;
    m.level=parseInt(this._ef('level'))||m.level; m.text=this._ef('text');
    this._persistContent('learn');
    this._closeModal(); this.show(this._activeView); this._toast('Modül güncellendi ✓','ok');
  }

  /* ── Kitap ──────────────────────────────────────────── */
  _editBook(id){
    var b=this._bookLibrary.find(function(x){return x.id===id;}); if(!b) return;
    this._openModal(
      '<h3 style="margin-bottom:.9rem">✏️ Kitap Düzenle</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji',b.emoji))
      +this._eF('ID',this._eI('bid',b.id,'text','readonly'))+'</div>'
      +this._eF('Başlık',this._eI('title',b.title))
      +this._eF('Yazar / Yayınevi',this._eI('author',b.author||''))
      +this._eF('Yaş Grupları','<div style="margin-top:.25rem">'+this._eAge(b.ageGroups||[])+'</div>')
      +this._eF('Matematik Kavramları (virgülle)',this._eI('conc',(b.mathConcepts||[]).join(', ')))
      +this._eF('Sorular (her satır bir soru)',this._eT('qs',(b.mathQuestions||[]).join('\n'),75))
      +this._eF('Pedagojik Not',this._eI('tip',b.tip||''))
      +this._eBtns('App._saveBook(\''+id+'\')')
    );
  }
  _saveBook(id){
    var b=this._bookLibrary.find(function(x){return x.id===id;}); if(!b) return;
    b.emoji=this._ef('emoji')||b.emoji; b.title=this._ef('title')||b.title;
    b.author=this._ef('author');
    var ag=this._echk('eAge'); if(ag.length) b.ageGroups=ag;
    b.mathConcepts=this._ef('conc').split(',').map(function(s){return s.trim();}).filter(Boolean);
    b.mathQuestions=this._ef('qs').split('\n').map(function(s){return s.trim();}).filter(Boolean);
    b.tip=this._ef('tip');
    this._persistContent('books');
    this._closeModal(); this.show(this._activeView); this._toast('Kitap güncellendi ✓','ok');
  }

  /* ── Başarı Hikayesi ────────────────────────────────── */
  _editStory(idx){
    if(!this._stories) this._stories=[];
    var s=this._stories[parseInt(idx)]; if(!s) return;
    this._openModal(
      '<h3 style="margin-bottom:.9rem">✏️ Hikaye Düzenle</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji',s.emoji||'🌟'))
      +this._eF('Etiket',this._eI('label',s.label||''))+'</div>'
      +this._eF('Aile / Şehir',this._eI('family',s.family||''))
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Yaş Grubu',this._eI('age',s.age||''))
      +this._eF('Konu',this._eI('tag',s.tag||''))+'</div>'
      +this._eF('Hikaye Metni',this._eT('story',s.story||'',90))
      +this._eF('Ders / Mesaj',this._eI('lesson',s.lesson||''))
      +this._eBtns('App._saveStory('+idx+')')
    );
  }
  _saveStory(i){
    if(!this._stories) return; var s=this._stories[i]; if(!s) return;
    s.emoji=this._ef('emoji')||s.emoji; s.label=this._ef('label')||s.label;
    s.family=this._ef('family'); s.age=this._ef('age');
    s.story=this._ef('story'); s.lesson=this._ef('lesson'); s.tag=this._ef('tag');
    this._persistContent('stories');
    this._closeModal(); this.show(this._activeView); this._toast('Hikaye güncellendi ✓','ok');
  }

  /* ── Sayı Sohbeti Kartı ─────────────────────────────── */
  _editMT(id){
    var A={PRESCHOOL:'Okul Öncesi',G1:'1.Sınıf',G2:'2.Sınıf',G3:'3.Sınıf',G4:'4.Sınıf'};
    var m=this._sayiSohbetiKartlari.find(function(x){return x.id===id;}); if(!m) return;
    this._openModal(
      '<h3 style="margin-bottom:.9rem">✏️ Kart Düzenle</h3>'
      +this._eF('Bağlam (🚗 Araçta)',this._eI('ctx',m.context||''))
      +this._eF('Soru / İpucu',this._eI('prompt',m.prompt||''))
      +this._eF('Matematik Kavramı',this._eI('conc',m.concept||''))
      +this._eF('Min. Yaş',this._eS('ageMin',A,m.ageMin||'PRESCHOOL'))
      +this._eBtns('App._saveMT(\''+id+'\')')
    );
  }
  _saveMT(id){
    var m=this._sayiSohbetiKartlari.find(function(x){return x.id===id;}); if(!m) return;
    m.context=this._ef('ctx')||m.context; m.prompt=this._ef('prompt')||m.prompt;
    m.concept=this._ef('conc'); m.ageMin=this._ef('ageMin')||m.ageMin;
    this._persistContent('mt');
    this._closeModal(); this.show(this._activeView); this._toast('Kart güncellendi ✓','ok');
  }

  /* ── Kullanıcı Yönetimi (AuthService destekli) ─────── */
  /* Geriye uyumluluk: eski _eGetUsers/_eSaveUsers/_eHashPwd çağrıları AuthService'e proxy'lenir */
  _eGetUsers(){ return this._auth.getUsers(); }
  _eSaveUsers(_u){ /* no-op — AuthService kendisi yönetir */ }
  _eHashPwd(s){ /* sadece legacy doğrulamada — yeni kayıtta KULLANILMAZ */
    let h = 0; for(let i=0; i<s.length; i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  _renderUserMgmt(){
    if(!this._isAdmin()) return '';
    const users = this._auth.getUsers();
    const self = this;
    const rows = users.map(u => {
      const lockSec = u.lockedUntil && Date.now() < new Date(u.lockedUntil).getTime()
        ? Math.ceil((new Date(u.lockedUntil).getTime() - Date.now()) / 1000) : 0;
      const isMe = self._parent?.id === u.id;
      return `<div style="display:flex;align-items:center;gap:.6rem;padding:.55rem .8rem;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);margin-bottom:.4rem">
        <span style="font-size:1.1rem">${u.role==='admin'?'👑':'✍️'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--t-md);font-weight:700;display:flex;align-items:center;gap:.35rem">
            ${self._eesc(u.name)}
            ${lockSec?`<span style="font-size:.65rem;color:var(--danger);font-weight:700">🔒 ${lockSec}s</span>`:''}
          </div>
          <div style="font-size:var(--t-xs);color:var(--muted)">@${u.username}${u.email?' · '+u.email:''} · ${u.role==='admin'?'Yönetici':'İçerik Üretici'}${u.active?'':' · <span style="color:var(--danger)">Pasif</span>'}</div>
          ${u.lastLoginAt?`<div style="font-size:.65rem;color:var(--hint);margin-top:.1rem">Son giriş: ${self._relTime(u.lastLoginAt)}</div>`:''}
        </div>
        <div style="display:flex;gap:.3rem;flex-wrap:wrap;justify-content:flex-end;max-width:130px">
          <button onclick="App._editUserModal('${u.id}')" class="btn btn-soft btn-sm" title="Düzenle">✏️</button>
          ${lockSec?`<button onclick="App._unlockUser('${u.id}')" class="btn btn-sm" style="background:var(--amber-a);color:var(--amber);border:none;font-size:.7rem" title="Kilidi aç">🔓</button>`:''}
          ${!isMe?`<button onclick="App._toggleUser('${u.id}')" class="btn btn-sm" style="background:${u.active?'rgba(220,38,38,.1)':'var(--teal-a)'};color:${u.active?'var(--danger)':'var(--teal-d)'};border:none;font-size:.7rem">${u.active?'Pasif':'Aktif'}</button>`:'<span style="font-size:var(--t-xs);color:var(--muted);padding:.3rem">Siz</span>'}
          ${!isMe?`<button onclick="App._deleteUser('${u.id}')" class="btn btn-sm" style="background:rgba(220,38,38,.08);color:var(--danger);border:none;font-size:.7rem" title="Sil">🗑</button>`:''}
        </div>
      </div>`;
    }).join('');
    return `<div style="margin-top:1.1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.55rem">
        <div style="font-size:var(--t-xs);font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Kullanıcılar (${users.length})</div>
        <button onclick="App._openNewUserModal()" class="btn btn-soft btn-sm">+ Ekle</button>
      </div>
      ${rows}
    </div>`;
  }

  _openNewUserModal(){
    this._openModal(
      '<h3 style="margin-bottom:.9rem">👤 Yeni Kullanıcı</h3>'
      + this._eF('Ad Soyad *', this._eI('name',''))
      + this._eF('Kullanıcı Adı * <span style="font-weight:400;color:var(--muted);font-size:.7rem">(3-30 karakter, harf/rakam/_)</span>', this._eI('uname',''))
      + this._eF('E-posta <span style="font-weight:400;color:var(--muted);font-size:.7rem">(opsiyonel)</span>', this._eI('email','','email'))
      + this._eF('Şifre * <span style="font-weight:400;color:var(--muted);font-size:.7rem">(en az 8 karakter)</span>',
          '<input id="ef-pwd" type="password" oninput="App._updatePwdMeter(\'ef-pwd\',\'pwd-meter\')" '
          + 'style="width:100%;background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit;margin-top:.2rem">'
          + '<div id="pwd-meter" style="margin-top:.4rem"></div>'
        )
      + this._eF('Rol', this._eS('role',{editor:'✍️ İçerik Üretici',admin:'👑 Yönetici'},'editor'))
      + this._eBtns('App._createUser()')
    );
  }

  /** Şifre güçlülük metresi — input'a bağlanır */
  _updatePwdMeter(inputId, meterId){
    const inp = document.getElementById(inputId);
    const m = document.getElementById(meterId);
    if(!inp || !m) return;
    const r = this._auth.scorePassword(inp.value);
    const segs = [0,1,2,3].map(i => `<div style="flex:1;height:5px;border-radius:3px;background:${i <= r.score - 1 ? r.color : 'var(--border)'};transition:background .2s"></div>`).join('');
    m.innerHTML = `
      <div style="display:flex;gap:3px">${segs}</div>
      <div style="font-size:var(--t-xs);margin-top:.3rem;color:${r.color};font-weight:700">${r.label}</div>
      ${r.issues.length?`<div style="font-size:var(--t-xs);color:var(--danger);margin-top:.15rem">${r.issues.join(' · ')}</div>`:''}
      ${r.suggestions.length && r.score < 3?`<div style="font-size:var(--t-xs);color:var(--muted);margin-top:.15rem">💡 ${r.suggestions.join(' · ')}</div>`:''}
    `;
  }

  async _createUser(){
    const name  = this._ef('name');
    const uname = this._ef('uname');
    const email = this._ef('email');
    const pwd   = document.getElementById('ef-pwd')?.value || '';
    const role  = this._ef('role');
    try {
      await this._auth.createUser({ name, username: uname, email, password: pwd, role });
      this._closeModal();
      this.show('profile');
      this._toast('Kullanıcı oluşturuldu ✓','ok');
    } catch(e) {
      this._toast(e.message || 'Hata','err');
    }
  }

  _editUserModal(userId){
    const u = this._auth.findById(userId); if(!u) return;
    this._openModal(
      '<h3 style="margin-bottom:.9rem">✏️ Kullanıcı Düzenle</h3>'
      + this._eF('Ad Soyad', this._eI('name', u.name))
      + this._eF('Kullanıcı Adı', this._eI('uname', u.username))
      + this._eF('E-posta', this._eI('email', u.email || '','email'))
      + this._eF('Rol', this._eS('role',{editor:'✍️ İçerik Üretici',admin:'👑 Yönetici'}, u.role))
      + '<div style="margin:.7rem 0;padding:.6rem .8rem;background:var(--raised);border-radius:var(--r-sm);border:1px solid var(--border)">'
      + '<p style="font-size:var(--t-xs);color:var(--muted);margin-bottom:.3rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">🔑 Şifre Sıfırla (opsiyonel)</p>'
      + '<input id="ef-pwd" type="password" placeholder="Boş bırakırsanız değişmez" oninput="App._updatePwdMeter(\'ef-pwd\',\'pwd-meter\')" '
      + 'style="width:100%;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit">'
      + '<div id="pwd-meter" style="margin-top:.4rem"></div></div>'
      + this._eBtns(`App._saveUser('${userId}')`)
    );
  }

  async _saveUser(userId){
    const name  = this._ef('name');
    const uname = this._ef('uname');
    const email = this._ef('email');
    const role  = this._ef('role');
    const pwd   = document.getElementById('ef-pwd')?.value || '';
    try {
      this._auth.updateUser(userId, { name, username: uname, email, role });
      if(pwd){ await this._auth.adminResetPassword(userId, pwd); }
      this._closeModal();
      this.show('profile');
      this._toast('Güncellendi ✓','ok');
    } catch(e) {
      this._toast(e.message || 'Hata','err');
    }
  }

  _toggleUser(userId){
    const u = this._auth.findById(userId); if(!u) return;
    this._auth.updateUser(userId, { active: !u.active });
    this.show('profile');
    this._toast(!u.active ? 'Kullanıcı aktifleştirildi' : 'Pasifleştirildi');
  }
  _unlockUser(userId){
    if(this._auth.unlockUser(userId)){ this.show('profile'); this._toast('Kilit kaldırıldı 🔓','ok'); }
  }
  _deleteUser(userId){
    const u = this._auth.findById(userId); if(!u) return;
    if(u.id === this._parent?.id){ this._toast('Kendi hesabınızı silemezsiniz','err'); return; }
    if(!confirm(`"${u.name}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    this._auth.deleteUser(userId);
    this.show('profile');
    this._toast('Kullanıcı silindi','ok');
  }

  /* ── Hesap & Güvenlik (kendi hesabı için) ──────────── */
  _openAccountSecurity(){
    const u = this._auth.findById(this._parent?.id);
    if(!u){ this._toast('Hesap bulunamadı','err'); return; }
    const sess = this._auth.session();
    this._openModal(
      '<h3 style="margin-bottom:.9rem">🔐 Hesap & Güvenlik</h3>'
      + '<div style="background:var(--raised);border-radius:var(--r-sm);padding:.65rem .85rem;margin-bottom:.85rem;font-size:var(--t-sm);line-height:1.55">'
      + `<div><strong>Kullanıcı:</strong> ${this._eesc(u.name)} (@${u.username})</div>`
      + (u.email?`<div><strong>E-posta:</strong> ${this._eesc(u.email)}</div>`:'')
      + `<div><strong>Rol:</strong> ${u.role==='admin'?'👑 Yönetici':'✍️ İçerik Üretici'}</div>`
      + `<div><strong>Hesap oluşturma:</strong> ${this._relTime(u.createdAt)}</div>`
      + (u.lastLoginAt?`<div><strong>Son giriş:</strong> ${this._relTime(u.lastLoginAt)}</div>`:'')
      + (sess?`<div><strong>Oturum süresi:</strong> ${this._relTime(sess.expiresAt)} sona erecek${sess.remember?' (Beni hatırla)':''}</div>`:'')
      + '</div>'
      + '<div class="sec-header" style="margin-bottom:.4rem"><span class="sec-title">🔑 Şifre Değiştir</span></div>'
      + this._eF('Mevcut Şifre', this._eI('cur','','password'))
      + this._eF('Yeni Şifre',
          '<input id="ef-new" type="password" oninput="App._updatePwdMeter(\'ef-new\',\'pwd-meter\')" '
          + 'style="width:100%;background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit;margin-top:.2rem">'
          + '<div id="pwd-meter" style="margin-top:.4rem"></div>'
        )
      + this._eF('Yeni Şifre (Tekrar)', this._eI('new2','','password'))
      + '<div style="display:flex;gap:.5rem;margin-top:.75rem">'
      + '<button class="btn btn-soft btn-block" onclick="App._closeModal()">Kapat</button>'
      + '<button class="btn btn-primary btn-block" onclick="App._changeMyPassword()">🔑 Şifreyi Değiştir</button>'
      + '</div>'
      + '<div style="margin-top:1rem;padding-top:.7rem;border-top:1px solid var(--border)">'
      + '<button class="btn btn-ghost btn-block" style="color:var(--danger);font-size:var(--t-sm)" onclick="App._logout();App._closeModal()">↩️ Çıkış Yap</button>'
      + '</div>'
    );
  }

  /* ── İlk Yönetici Kurulumu ────────────────────────── */
  _openAdminSetup(){
    if(!this._auth.needsFirstAdmin()){
      this._toast('Zaten bir yönetici hesabı var','err'); return;
    }
    const cur = this._parent || {};
    this._openModal(
      '<h3 style="margin-bottom:.4rem">👑 Yönetici Hesabı Kur</h3>'
      + '<p style="font-size:var(--t-sm);color:var(--muted);line-height:1.55;margin-bottom:.85rem">Bu cihazda içerik yönetimi (etkinlik/kitap/hikaye ekleme) için bir yönetici hesabı oluşturun. Profil bilgileriniz ön doldurulmuştur — değiştirebilirsiniz.</p>'
      + this._eF('Ad Soyad *', this._eI('name', cur.name || ''))
      + this._eF('Kullanıcı Adı * <span style="font-weight:400;color:var(--muted);font-size:.7rem">(3-30 karakter, harf/rakam/_)</span>',
          this._eI('uname', this._auth.normalizeUsername(cur.name || 'admin')))
      + this._eF('E-posta', this._eI('email', cur.email || '','email'))
      + this._eF('Şifre * <span style="font-weight:400;color:var(--muted);font-size:.7rem">(en az 8 karakter)</span>',
          '<input id="ef-pwd" type="password" oninput="App._updatePwdMeter(\'ef-pwd\',\'pwd-meter\')" '
          + 'style="width:100%;background:var(--raised);border:1.5px solid var(--border);border-radius:var(--r-sm);padding:.48rem .75rem;color:var(--text);font-size:var(--t-md);outline:none;font-family:inherit;margin-top:.2rem">'
          + '<div id="pwd-meter" style="margin-top:.4rem"></div>'
        )
      + this._eF('Şifre (Tekrar) *', this._eI('pwd2','','password'))
      + this._eBtns('App._setupFirstAdmin()')
    );
  }

  async _setupFirstAdmin(){
    const name = this._ef('name');
    const uname = this._ef('uname');
    const email = this._ef('email');
    const pwd = document.getElementById('ef-pwd')?.value || '';
    const pwd2 = this._ef('pwd2');
    if(pwd !== pwd2){ this._toast('Şifreler eşleşmiyor','err'); return; }
    try {
      const u = await this._auth.setupFirstAdmin({ name, username: uname, email, password: pwd });
      // Mevcut profil verisini kullanıcıya bağla
      if(this._parent){
        this._parent = { ...this._parent, id: u.id, name: u.name, role: u.role, username: u.username, email: u.email };
        this._storage.set('parent', this._parent);
        this._storage.set('parent_' + u.id, this._parent);
      }
      // Otomatik oturum
      const sess = this._auth._createSession(u.id, true);
      this._closeModal();
      this._toast('Yönetici hesabınız hazır 👑','ok');
      this.show('profile');
    } catch(e) {
      this._toast(e.message || 'Hata','err');
    }
  }

  async _changeMyPassword(){
    const cur = document.getElementById('ef-cur')?.value || '';
    const nw  = document.getElementById('ef-new')?.value || '';
    const nw2 = document.getElementById('ef-new2')?.value || '';
    if(!cur || !nw){ this._toast('Tüm alanlar gerekli','err'); return; }
    if(nw !== nw2){ this._toast('Yeni şifreler eşleşmiyor','err'); return; }
    if(cur === nw){ this._toast('Yeni şifre mevcut ile aynı olamaz','err'); return; }
    try {
      await this._auth.changePassword(this._parent.id, cur, nw);
      this._closeModal();
      this._toast('Şifreniz güncellendi 🔐','ok');
    } catch(e) {
      this._toast(e.message || 'Şifre değiştirilemedi','err');
    }
  }

  _admEsc(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ══════════════════════════════════════════════════════════
     v4 — Yeni özelliklerin köprü metodları
     (HTML inline onclick'leri buraya çağırır)
  ══════════════════════════════════════════════════════════ */

  // ─── Magnitude oyunu ─────────────────────────────────────
  _magStart(){ MagnitudeGameView.start(this); }
  _magReset(){ MagnitudeGameView.reset(this); }
  _magAnswer(side){ MagnitudeGameView.answer(this, side); }
  _magSetMode(mode){ MagnitudeGameView.setMode(this, mode); }
  _openMagnitude(){ this.show('magnitude'); }

  // ─── Yapılandırılmış subitizing ─────────────────────────
  _ssubStart(){ StructuredSubitizingView.start(this); }
  _ssubReset(){ StructuredSubitizingView.reset(this); }
  _ssubAnswer(v){ StructuredSubitizingView.answer(this, v); }
  _ssubMode(m){ StructuredSubitizingView.setMode(this, m); }
  _openStructSub(){ this.show('struct-sub'); }

  // ─── Corsi blok ─────────────────────────────────────────
  _corsiStart(){ CorsiBlockGameView.start(this); }
  _corsiReset(){ CorsiBlockGameView.reset(this); }
  _corsiTap(idx){ CorsiBlockGameView.tap(this, idx); }
  _openCorsi(){ this.show('corsi'); }

  // ─── Fact practice (Leitner) ────────────────────────────
  _factOpen(deckId){ FactPracticeView.openDeck(this, deckId); }
  _factHome(){ this._factSession = null; FactPracticeView.render(this); }
  _factAnswer(v){ FactPracticeView.answer(this, v); }
  _openFact(){ this.show('fact'); }

  // ─── Stratejiler ────────────────────────────────────────
  _strategyOpen(id){ StrategyView.renderDetail(this, id); }
  _strategyClose(){ StrategyView.render(this); }
  _strategyComplete(id){
    const done = this._storage.get('strategies_done', []);
    if(!done.includes(id)){ done.push(id); this._storage.set('strategies_done', done); }
    this._toast('Strateji denendi ✓','ok');
    StrategyView.render(this);
  }
  _openStrategies(){ this.show('strategies'); }

  // ─── Subtype profili ────────────────────────────────────
  _openSubtype(){ this.show('subtype'); }
  _subtypeReset(){
    if(confirm('Alt-tip skorlarını sıfırlamak istediğinize emin misiniz?')){
      this._subtype.resetScores();
      this.show('subtype');
      this._toast('Profil sıfırlandı','ok');
    }
  }

  // ─── Embodied number line ───────────────────────────────
  _openEmbodied(){ this.show('embodied'); }
  _embodiedComplete(){
    const done = this._storage.get('embodied_done', 0);
    this._storage.set('embodied_done', done + 1);
    this._toast('Etkinlik kaydedildi 🚶','ok');
    this.show('dyscalculia');
  }

  // ─── Math Talk genişletilmiş ────────────────────────────
  _openMathTalkExt(){ this._mtFilter = { ctx:null, age:null }; this.show('mtext'); }
  _mtFilterCtx(c){ this._mtFilter = { ...(this._mtFilter||{}), ctx: c }; MathTalkExtView.render(this); }
  _mtFilterAge(a){ this._mtFilter = { ...(this._mtFilter||{}), age: a }; MathTalkExtView.render(this); }
  _mtRandom(){
    const q = pickRandomTalk(this._mtFilter || {});
    const el = document.getElementById('mt-random-q');
    if(el) el.textContent = q.soru;
    if(this._a11y?.prefs?.ttsEnabled) this._a11y.speak(q.soru);
  }

  // ─── Hata raporu ────────────────────────────────────────
  _openErrorReport(){ this.show('errreport'); }
  _errReset(){
    if(confirm('Hata geçmişini silmek istiyor musunuz?')){
      this._errPatterns.reset();
      ErrorReportView.render(this);
      this._toast('Geçmiş silindi','ok');
    }
  }

  // ─── Export (CSV/PDF) ───────────────────────────────────
  _exportCsv(){
    const csv = this._exportSvc.activitiesCsv(this._parent, this._getChild());
    const today = new Date().toISOString().slice(0,10);
    this._exportSvc.download(`abmat-etkinlikler-${today}.csv`, csv);
    this._toast('CSV indirildi 📥','ok');
  }
  _exportSummary(){
    if(this._exportSvc.printableReport(this._parent, this._getChild())){
      this._toast('Rapor yeni sekmede açıldı 📄','ok');
    } else {
      this._toast('Açılır pencere engellendi — izin verin','err');
    }
  }

  // ─── A11y ayarları ──────────────────────────────────────
  _openA11y(){ this.show('a11y'); }
  _a11ySet(key, val){
    this._a11y.set(key, val);
    A11ySettingsView.render(this);
  }
  _a11yReset(){
    this._a11y.reset();
    A11ySettingsView.render(this);
    this._toast('Erişilebilirlik ayarları sıfırlandı','ok');
  }

  // ─── Çocuk modu ─────────────────────────────────────────
  _openKidsMode(){
    this._kidsMode.setOn(true);
    this.show('kids');
  }
  _kidsPlay(gameId){
    const map = { mag:'magnitude', ssub:'struct-sub', corsi:'corsi', nl:'dyscalculia', fact:'fact', sub:'dyscalculia' };
    const target = map[gameId] || 'kids';
    this.show(target);
  }
  _kidsExit(){
    if(this._kidsMode.hasPin()){
      let modal = document.getElementById('kids-pin-modal');
      if(!modal){
        modal = document.createElement('div');
        modal.id = 'kids-pin-modal';
        modal.innerHTML = KidsModeView.promptPin(this);
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('kids-pin-input')?.focus(), 50);
      }
    } else {
      this._kidsMode.setOn(false);
      document.body.classList.remove('kids-mode');
      this.show('dashboard');
    }
  }
  _kidsCancelPin(){
    document.getElementById('kids-pin-modal')?.remove();
  }
  _kidsVerifyPin(){
    const v = document.getElementById('kids-pin-input')?.value;
    if(this._kidsMode.verifyPin(v)){
      document.getElementById('kids-pin-modal')?.remove();
      this._kidsMode.setOn(false);
      document.body.classList.remove('kids-mode');
      this.show('dashboard');
    } else {
      const err = document.getElementById('kids-pin-err');
      if(err) err.style.display = 'block';
    }
  }
  _kidsSetPin(){
    const cur = this._kidsMode.hasPin() ? prompt('Mevcut PIN:') : null;
    if(this._kidsMode.hasPin() && !this._kidsMode.verifyPin(cur)){
      this._toast('Yanlış mevcut PIN','err'); return;
    }
    const np = prompt('Yeni 4-6 haneli PIN (boş bırakırsanız PIN kaldırılır):');
    if(np === null) return;
    if(np === ''){ this._kidsMode.removePin(); this._toast('PIN kaldırıldı','ok'); return; }
    try{
      this._kidsMode.setPin(np);
      this._toast('PIN kaydedildi 🔒','ok');
    }catch(e){ this._toast(e.message,'err'); }
  }

  /* ─── Aile rutin tetikleyicileri ──────────────────────── */
  _checkRoutineTriggers(){
    const now = new Date();
    const hour = now.getHours();
    const today = now.toDateString();
    const fired = this._storage.get('routine_fired', {});
    ROUTINE_TRIGGERS.forEach(r => {
      // hour ± 1 saatlik pencere
      if(Math.abs(hour - r.hour) > 1) return;
      const key = `${today}:${r.time}`;
      if(fired[key]) return;
      fired[key] = true;
      this._notifSvc.addNotif({
        emoji: r.emoji,
        title: r.label,
        text: r.soru + ' (Sayı Sohbeti+ kütüphanesinden)',
      });
      this._updateNotifDot?.();
      // Tarayıcı izniyle gerçek push bildirimi (varsa)
      this._sendLocalNotification(`${r.emoji} ${r.label}`, r.soru, '#mtext');
    });
    // Sadece bugünün kayıtlarını tut
    const trimmed = Object.fromEntries(Object.entries(fired).filter(([k]) => k.startsWith(today)));
    this._storage.set('routine_fired', trimmed);
  }

  /* ─── PWA push bildirimi (local, izinle) ──────────────── */
  async _enableNotifications(){
    if(typeof Notification === 'undefined'){
      this._toast('Bu cihazda bildirimler desteklenmiyor','err'); return false;
    }
    if(Notification.permission === 'granted') return true;
    if(Notification.permission === 'denied'){
      this._toast('Bildirim izni reddedilmiş — tarayıcı ayarından açın','err'); return false;
    }
    const perm = await Notification.requestPermission();
    if(perm === 'granted'){
      this._toast('Bildirimler aktif 🔔','ok');
      this._storage.set('notif_perm', true);
      return true;
    }
    return false;
  }

  _sendLocalNotification(title, body, url){
    if(typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    if(typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'show-notif', title, body, url: url || './' });
    }).catch(() => {});
  }

  /* ─── Mini gözlem oyunu sonucunu subtype profiline yaz ─── */
  _persistMiniGameToSubtype(){
    if(!Array.isArray(this._dyscGameAnswers) || this._dyscGameAnswers.length < 3) return;
    const delta = this._subtype.scoreFromMiniGame(this._dyscGameAnswers);
    this._subtype.addScores(delta, 'mini_game');
  }

  /* ══════════════════════════════════════════════════════════
     v6 — Yönetici Paneli & Kalıcı İçerik (ContentService)
  ══════════════════════════════════════════════════════════ */

  /** İlk açılışta localStorage snapshot'ları belleğe yükle.
   *  Constructor'dan SONRA, mevcut diziler kurulduktan sonra çağrılır. */
  _hydrateContentOverrides(){
    try {
      const aSnap = this._content.load('activities');
      if(Array.isArray(aSnap)) this._repo._data = aSnap;
      const lSnap = this._content.load('learn');
      if(Array.isArray(lSnap)) this._learnModules = lSnap;
      const bSnap = this._content.load('books');
      if(Array.isArray(bSnap)) this._bookLibrary = bSnap;
      const sSnap = this._content.load('stories');
      if(Array.isArray(sSnap)) this._stories = sSnap;
      const mSnap = this._content.load('mt');
      if(Array.isArray(mSnap)) this._sayiSohbetiKartlari = mSnap;
    } catch(e) { /* sessiz */ }
  }

  /** Tek tipli snapshot kaydet — _saveX / _inlineDelX / _addX sonunda çağrılır. */
  _persistContent(type){
    try {
      if(type === 'activities') this._content.save('activities', this._repo._data);
      else if(type === 'learn') this._content.save('learn', this._learnModules);
      else if(type === 'books') this._content.save('books', this._bookLibrary);
      else if(type === 'stories') this._content.save('stories', this._stories || []);
      else if(type === 'mt') this._content.save('mt', this._sayiSohbetiKartlari);
    } catch(e) { /* sessiz */ }
  }

  /* ─── Admin paneli navigasyonu ──────────────────────────── */
  _openAdmin(){
    if(!this._canEdit()){ this._toast('Yönetici/içerik üretici girişi gerekli','err'); return; }
    if(!this._isEditMode()) sessionStorage.setItem('abmat_em','1');
    this._adminTab = this._adminTab || 'activities';
    this._adminSearch = '';
    this.show('admin');
  }
  _adminSetTab(tab){ this._adminTab = tab; this._adminSearch = ''; AdminPanelView.render(this); }
  _adminSearchSet(v){
    this._adminSearch = v || '';
    const el = document.getElementById('admin-list');
    if(el) el.innerHTML = AdminPanelView._renderList(this, this._adminTab, this._adminSearch);
  }
  _adminDelete(tab, id){
    const map = { activities:'activity', learn:'lm', books:'book', stories:'story', mt:'mt' };
    this._inlineDel(map[tab], id);
    setTimeout(() => AdminPanelView.render(this), 50);
  }
  _adminResetTab(tab){
    if(!confirm('Bu listedeki TÜM düzenlemelerinizi sıfırlayıp varsayılan içeriğe dönmek istediğinize emin misiniz?')) return;
    this._content.reset(tab);
    location.reload();
  }
  _adminResetAll(){
    if(!confirm('TÜM içerik düzenlemelerinizi (etkinlik, akademi, kitap, hikaye, sohbet) sıfırlayıp varsayılana dönmek istediğinize emin misiniz?')) return;
    this._content.resetAll();
    location.reload();
  }

  /* ─── Yeni içerik ekleme (boş form aç) ─────────────────── */
  _adminAdd(tab){
    if(tab === 'activities') return this._addActivity();
    if(tab === 'learn')      return this._addLM();
    if(tab === 'books')      return this._addBook();
    if(tab === 'stories')    return this._addStory();
    if(tab === 'mt')         return this._addMT();
  }

  /* ── Yeni Etkinlik ────────────────────────────────────── */
  _addActivity(){
    const C = {NUMBER:'Sayı',PATTERNS:'Örüntü',GEOMETRY:'Geometri',MEASUREMENT:'Ölçme',DAILY:'Günlük',PROBLEM:'Problem',SPATIAL:'Uzamsal',KITCHEN:'Mutfak',MARKET:'Market',TIME:'Zaman',GAME:'Oyun',NATURE:'Doğa'};
    this._openModal(
      '<h3 style="margin-bottom:.9rem">➕ Yeni Etkinlik</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji','🎯'))
      +this._eF('Süre (dk)',this._eI('dur','15','number'))
      +'</div>'
      +this._eF('Başlık *',this._eI('title',''))
      +this._eF('Açıklama',this._eI('desc',''))
      +this._eF('Kategori',this._eS('cat',C,'NUMBER'))
      +this._eF('Yaş Grupları','<div style="margin-top:.25rem">'+this._eAge([])+'</div>')
      +this._eF('Malzemeler (virgülle)',this._eI('mat',''))
      +this._eF('Adımlar (her satır bir adım)',this._eT('steps','',85))
      +this._eF('İpucu',this._eT('tip','',55))
      +'<div style="display:flex;gap:1rem;margin-bottom:.5rem">'
      +'<label style="display:flex;align-items:center;gap:.3rem;font-size:var(--t-sm);cursor:pointer">'
      +'<input type="checkbox" id="ef-anx" style="accent-color:var(--teal);width:14px;height:14px"> Kaygı Dostu</label>'
      +'<label style="display:flex;align-items:center;gap:.3rem;font-size:var(--t-sm);cursor:pointer">'
      +'<input type="checkbox" id="ef-dysc" style="accent-color:var(--teal);width:14px;height:14px"> Diskalkuli</label>'
      +'</div>'
      +this._eBtns('App._saveNewActivity()')
    );
  }
  _saveNewActivity(){
    const title = this._ef('title');
    if(!title){ this._toast('Başlık zorunlu','err'); return; }
    const ag = this._echk('eAge');
    const item = {
      id: this._content.newId('a'),
      emoji: this._ef('emoji') || '🎯',
      title,
      desc: this._ef('desc'),
      ageGroups: ag.length ? ag : ['G1'],
      category: this._ef('cat') || 'NUMBER',
      dur: parseInt(this._ef('dur')) || 15,
      materials: this._ef('mat').split(',').map(s=>s.trim()).filter(Boolean),
      steps: this._ef('steps').split('\n').map(s=>s.trim()).filter(Boolean),
      tip: this._ef('tip'),
      anxFriendly: !!document.getElementById('ef-anx')?.checked,
      dysc: !!document.getElementById('ef-dysc')?.checked,
      tags: [],
      tymm_oo: [], tymm_il: [], tymm_t: [], tymm_yas: [], tymm_outcomes: [],
      _custom: true,
    };
    this._repo._data.push(item);
    this._persistContent('activities');
    this._closeModal();
    if(this._activeView === 'admin') AdminPanelView.render(this);
    else this.show(this._activeView);
    this._toast('Etkinlik eklendi ✓','ok');
  }

  /* ── Yeni Akademi Modülü ───────────────────────────────── */
  _addLM(){
    this._openModal(
      '<h3 style="margin-bottom:.9rem">➕ Yeni Akademi Modülü</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji','📘'))
      +this._eF('Süre',this._eI('dur','10 dk'))+'</div>'
      +this._eF('Başlık *',this._eI('title',''))
      +this._eF('Alt Başlık',this._eI('sub',''))
      +this._eF('Seviye',this._eS('level',{'1':'Başlangıç','2':'Orta','3':'İleri'},'1'))
      +this._eF('İçerik',this._eT('text','',110))
      +this._eBtns('App._saveNewLM()')
    );
  }
  _saveNewLM(){
    const title = this._ef('title');
    if(!title){ this._toast('Başlık zorunlu','err'); return; }
    const item = {
      id: this._content.newId('lm'),
      emoji: this._ef('emoji') || '📘',
      title,
      sub: this._ef('sub'),
      dur: this._ef('dur') || '10 dk',
      level: parseInt(this._ef('level')) || 1,
      text: this._ef('text'),
      _custom: true,
    };
    if(!this._learnModules) this._learnModules = [];
    this._learnModules.push(item);
    this._persistContent('learn');
    this._closeModal();
    if(this._activeView === 'admin') AdminPanelView.render(this);
    else this.show(this._activeView);
    this._toast('Modül eklendi ✓','ok');
  }

  /* ── Yeni Kitap ─────────────────────────────────────────── */
  _addBook(){
    this._openModal(
      '<h3 style="margin-bottom:.9rem">➕ Yeni Kitap</h3>'
      +this._eF('Emoji',this._eI('emoji','📖'))
      +this._eF('Başlık *',this._eI('title',''))
      +this._eF('Yazar / Yayınevi',this._eI('author',''))
      +this._eF('Yaş Grupları','<div style="margin-top:.25rem">'+this._eAge([])+'</div>')
      +this._eF('Matematik Kavramları (virgülle)',this._eI('conc',''))
      +this._eF('Sorular (her satır bir soru)',this._eT('qs','',75))
      +this._eF('Pedagojik Not',this._eI('tip',''))
      +this._eBtns('App._saveNewBook()')
    );
  }
  _saveNewBook(){
    const title = this._ef('title');
    if(!title){ this._toast('Başlık zorunlu','err'); return; }
    const ag = this._echk('eAge');
    const item = {
      id: this._content.newId('b'),
      emoji: this._ef('emoji') || '📖',
      title,
      author: this._ef('author'),
      ageGroups: ag.length ? ag : ['G1'],
      mathConcepts: this._ef('conc').split(',').map(s=>s.trim()).filter(Boolean),
      mathQuestions: this._ef('qs').split('\n').map(s=>s.trim()).filter(Boolean),
      tip: this._ef('tip'),
      _custom: true,
    };
    if(!this._bookLibrary) this._bookLibrary = [];
    this._bookLibrary.push(item);
    this._persistContent('books');
    this._closeModal();
    if(this._activeView === 'admin') AdminPanelView.render(this);
    else this.show(this._activeView);
    this._toast('Kitap eklendi ✓','ok');
  }

  /* ── Yeni Hikaye ────────────────────────────────────────── */
  _addStory(){
    this._openModal(
      '<h3 style="margin-bottom:.9rem">➕ Yeni Başarı Hikayesi</h3>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Emoji',this._eI('emoji','🌟'))
      +this._eF('Etiket',this._eI('label',''))+'</div>'
      +this._eF('Aile / Şehir',this._eI('family',''))
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">'
      +this._eF('Yaş Grubu',this._eI('age',''))
      +this._eF('Konu',this._eI('tag',''))+'</div>'
      +this._eF('Hikaye Metni *',this._eT('story','',90))
      +this._eF('Ders / Mesaj',this._eI('lesson',''))
      +this._eBtns('App._saveNewStory()')
    );
  }
  _saveNewStory(){
    const story = this._ef('story');
    if(!story){ this._toast('Hikaye metni zorunlu','err'); return; }
    const item = {
      emoji: this._ef('emoji') || '🌟',
      label: this._ef('label'),
      family: this._ef('family'),
      age: this._ef('age'),
      tag: this._ef('tag'),
      story,
      lesson: this._ef('lesson'),
      _custom: true,
    };
    if(!this._stories) this._stories = [];
    this._stories.push(item);
    this._persistContent('stories');
    this._closeModal();
    if(this._activeView === 'admin') AdminPanelView.render(this);
    else this.show(this._activeView);
    this._toast('Hikaye eklendi ✓','ok');
  }

  /* ── Yeni Sayı Sohbeti Kartı ────────────────────────────── */
  _addMT(){
    const A = {PRESCHOOL:'Okul Öncesi',G1:'1.Sınıf',G2:'2.Sınıf',G3:'3.Sınıf',G4:'4.Sınıf'};
    this._openModal(
      '<h3 style="margin-bottom:.9rem">➕ Yeni Sohbet Kartı</h3>'
      +this._eF('Bağlam (örn. 🚗 Araçta)',this._eI('ctx',''))
      +this._eF('Soru / İpucu *',this._eI('prompt',''))
      +this._eF('Matematik Kavramı',this._eI('conc',''))
      +this._eF('Min. Yaş',this._eS('ageMin',A,'PRESCHOOL'))
      +this._eBtns('App._saveNewMT()')
    );
  }
  _saveNewMT(){
    const prompt = this._ef('prompt');
    if(!prompt){ this._toast('Soru zorunlu','err'); return; }
    const item = {
      id: this._content.newId('mt'),
      context: this._ef('ctx'),
      prompt,
      concept: this._ef('conc'),
      ageMin: this._ef('ageMin') || 'PRESCHOOL',
      _custom: true,
    };
    if(!this._sayiSohbetiKartlari) this._sayiSohbetiKartlari = [];
    this._sayiSohbetiKartlari.push(item);
    this._persistContent('mt');
    this._closeModal();
    if(this._activeView === 'admin') AdminPanelView.render(this);
    else this.show(this._activeView);
    this._toast('Kart eklendi ✓','ok');
  }
}

export { MatEvdeApp, createSkillBridge };
