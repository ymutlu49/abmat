/* ══════════════════════════════════════════════════════════
   ABMATO — ErrorPatternService
   Çocuğun pratikteki yanlış cevaplarından desen çıkarır:
     • magnitude_confusion  → 6/9 ya da 2/5 karışıklığı (rakam yansıma)
     • near_miss            → ±1 hatalar (parmak sayma kayması)
     • commutative_mismatch → 3+5 doğru, 5+3 yanlış (ezbere bağımlı)
     • carry_borrow_loss    → 10'u atlama (basamak)
     • timeout              → süre baskısı altında bozulma

   Kullanım: kayıt ekle (logAnswer) → analyze() çağır → öneri al.
   Kanıt: VanLehn (1990) bug taxonomy; Ashkenazi & Henik (2010).
══════════════════════════════════════════════════════════ */

const KEY = 'error_log';
const MAX_LOG = 200;

const PATTERNS = Object.freeze({
  MAGNITUDE_CONFUSION: 'magnitude_confusion',
  NEAR_MISS:           'near_miss',
  COMMUTATIVE:         'commutative_mismatch',
  CARRY_BORROW:        'carry_borrow_loss',
  TIMEOUT:             'timeout',
});

const PATTERN_META = Object.freeze({
  [PATTERNS.MAGNITUDE_CONFUSION]: {
    ad: 'Rakam Karışıklığı',
    aciklama: 'Çocuğunuz benzer rakamları (6↔9, 2↔5) karıştırıyor olabilir.',
    oneri: 'Rakamların yönünü vurgulayan görsel kartlar kullanın; havada parmakla yazdırın.',
    icon: '🔁',
  },
  [PATTERNS.NEAR_MISS]: {
    ad: '±1 Hataları (Parmak Kayması)',
    aciklama: 'Cevaplar 1 farkla kayıyor — sayma sırasında atlama/tekrar var.',
    oneri: '"Bir önceki sayıyı söyle" oyunu, ritmik sayma; "kaç tane?" sorusunu saymadan SONRA tekrar sorun.',
    icon: '👆',
  },
  [PATTERNS.COMMUTATIVE]: {
    ad: 'Yer Değişme Eksiği',
    aciklama: '3+5 biliyor ama 5+3 zorlanıyor — ezbere bağımlı, ilişki yok.',
    oneri: 'Aynı toplamı iki şekilde göster (boncuk dizisini ters çevir). "Aynı, sadece sıra farklı" diyaloğu.',
    icon: '↔️',
  },
  [PATTERNS.CARRY_BORROW]: {
    ad: '10\'u Atlama / Basamak Kaybı',
    aciklama: 'Cevap "tam" 10 farkla kayıyor — onluk geçişlerinde kayıp.',
    oneri: 'Onluk çerçeve, "10\'a tamamlama" stratejisi; basamak kartları ile somutlaştırma.',
    icon: '🏗️',
  },
  [PATTERNS.TIMEOUT]: {
    ad: 'Süre Baskısı',
    aciklama: 'Sürenin dolmasıyla cevap bozuluyor; baskısız ortamda doğru.',
    oneri: 'Profil → Erişilebilirlik → "Zaman baskısız mod" açın. Süreli oyunlardan kaçının.',
    icon: '⏱️',
  },
});

class ErrorPatternService {
  constructor(storage){ this._s = storage; }

  _log(){ return this._s.get(KEY, []); }
  _save(arr){ this._s.set(KEY, arr.slice(-MAX_LOG)); }

  /**
   * @param {Object} entry { gameId, q, expected, given, elapsedMs, timedOut }
   */
  logAnswer(entry){
    const log = this._log();
    log.push({ at: Date.now(), ...entry });
    this._save(log);
  }

  /** Son N kayıttan desen sayımı yap */
  analyze(window = 60){
    const recent = this._log().slice(-window);
    const counts = Object.fromEntries(Object.values(PATTERNS).map(k => [k, 0]));
    let totalErrors = 0;
    recent.forEach(e => {
      if(e.expected === e.given) return;
      totalErrors++;
      const exp = Number(e.expected);
      const giv = Number(e.given);
      if(e.timedOut) counts[PATTERNS.TIMEOUT]++;
      if(!Number.isFinite(exp) || !Number.isFinite(giv)) return;
      const diff = Math.abs(exp - giv);
      if(diff === 1) counts[PATTERNS.NEAR_MISS]++;
      if(diff === 10 || diff === 20 || diff === 30) counts[PATTERNS.CARRY_BORROW]++;
      // Rakam yansıma: 6↔9, 2↔5 (tek haneli)
      if((exp === 6 && giv === 9) || (exp === 9 && giv === 6) ||
         (exp === 2 && giv === 5) || (exp === 5 && giv === 2)){
        counts[PATTERNS.MAGNITUDE_CONFUSION]++;
      }
      // Commutative: aynı sorunun ters versiyonu doğruyken yanlış mı?
      if(typeof e.q === 'string' && /^\d+\s*[+×]\s*\d+/.test(e.q)){
        const [a, op, b] = e.q.split(/\s+/);
        if(op && a && b){
          const reverse = `${b} ${op} ${a}`;
          const reverseHits = recent.filter(x => x.q === reverse && x.expected === x.given);
          if(reverseHits.length > 0) counts[PATTERNS.COMMUTATIVE]++;
        }
      }
    });
    // %5 ve üstü desenleri "anlamlı" say
    const threshold = Math.max(2, Math.round(totalErrors * 0.15));
    const significant = Object.entries(counts)
      .filter(([k, v]) => v >= threshold)
      .map(([k, v]) => ({ pattern: k, count: v, ...PATTERN_META[k] }));
    return { totalSeen: recent.length, totalErrors, counts, significant };
  }

  reset(){ this._s.set(KEY, []); }

  meta(){ return PATTERN_META; }
}

export { ErrorPatternService, PATTERNS, PATTERN_META };
