/* ══════════════════════════════════════════════════════════
   ABMATO — SubtypeService
   Diskalkuli alt-tip profili:
     • NUMBER_SENSE (sayı hissi açığı) — magnitude comparison odaklı
     • FACT_RETRIEVAL (olgu hatırlama) — strateji + retrieval practice
     • WORKING_MEMORY (çalışma belleği) — Corsi blok + parçalama
     • SPATIAL_NUMERIC (uzamsal sayı temsili) — sayı doğrusu, embodied

   Mini gözlem oyunu sonuçları + kontrol listesi cevapları
   profile.subtype.scores'e yazılır. recommend() çağrısında
   öneri motoru bu skorları ağırlık olarak kullanır.
   Kanıt: Butterworth (2019) heterogeneous dyscalculia model;
   Mutlu (2017) multiple-filter screening.
══════════════════════════════════════════════════════════ */

const KEY = 'subtype_profile';

const SUBTYPES = Object.freeze({
  NUMBER_SENSE:    'number_sense',
  FACT_RETRIEVAL:  'fact_retrieval',
  WORKING_MEMORY:  'working_memory',
  SPATIAL_NUMERIC: 'spatial_numeric',
});

const SUBTYPE_META = Object.freeze({
  [SUBTYPES.NUMBER_SENSE]: {
    icon: '🔢', renk: 'var(--blue)', ad: 'Sayı Hissi Açığı',
    aciklama: 'Sayıların büyüklüğünü hissetmekte güçlük; subitizing gelişmemiş.',
    yaklasim: 'Magnitude comparison, beşli/onlu çerçeve, subitizing oyunları.',
    onerilenEtkinlikler: ['mag-game', 'sub-structured', 'a01', 'a09', 'a15'],
  },
  [SUBTYPES.FACT_RETRIEVAL]: {
    icon: '⚡', renk: 'var(--teal)', ad: 'Olgu Hatırlama Güçlüğü',
    aciklama: 'Basit toplama/çarpma olgularını her seferinde sayarak çözüyor.',
    yaklasim: '10\'a tamamlama, ikilemeler, spaced retrieval (Leitner) pratiği.',
    onerilenEtkinlikler: ['fact-practice', 'strat-make10', 'a08', 'a09', 'a12'],
  },
  [SUBTYPES.WORKING_MEMORY]: {
    icon: '🧠', renk: 'var(--purple)', ad: 'Çalışma Belleği Sorunları',
    aciklama: 'Adım adım işlemlerde ara sonuçları unutuyor.',
    yaklasim: 'Corsi blok, görsel parçalama, adımları kağıda yaz.',
    onerilenEtkinlikler: ['corsi-game', 'strat-chunking', 'a07', 's01'],
  },
  [SUBTYPES.SPATIAL_NUMERIC]: {
    icon: '📍', renk: 'var(--teal-d)', ad: 'Uzamsal Sayı Temsili',
    aciklama: 'Sayı doğrusunda konumu karıştırıyor, rakamları ters yazıyor.',
    yaklasim: 'Yere büyük sayı doğrusu, embodied yürüyüş, simetri.',
    onerilenEtkinlikler: ['embodied-line', 's01', 's02', 's03', 's04'],
  },
});

class SubtypeService {
  constructor(storage){ this._s = storage; }

  get profile(){
    return this._s.get(KEY) || { scores: this._zero(), updatedAt: null, history: [] };
  }

  _zero(){
    return Object.fromEntries(Object.values(SUBTYPES).map(k => [k, 0]));
  }

  /**
   * Mini gözlem oyunu cevap dizisini al → alt-tip skorlarına çevir.
   * Cevaplar: 'ok' | 'count' | 'slow' | 'wrong'
   */
  scoreFromMiniGame(answers){
    const s = this._zero();
    if(!Array.isArray(answers) || answers.length < 3) return s;
    // 0: subitizing (3 nokta) → NUMBER_SENSE göstergesi
    if(answers[0] === 'wrong') s[SUBTYPES.NUMBER_SENSE] += 3;
    if(answers[0] === 'count') s[SUBTYPES.NUMBER_SENSE] += 1;
    // 1: 6 vs 9 magnitude → NUMBER_SENSE + SPATIAL_NUMERIC
    if(answers[1] === 'wrong'){ s[SUBTYPES.NUMBER_SENSE] += 2; s[SUBTYPES.SPATIAL_NUMERIC] += 2; }
    if(answers[1] === 'slow') { s[SUBTYPES.NUMBER_SENSE] += 1; s[SUBTYPES.SPATIAL_NUMERIC] += 1; }
    // 2: 3+2 → FACT_RETRIEVAL + WORKING_MEMORY
    if(answers[2] === 'wrong'){ s[SUBTYPES.FACT_RETRIEVAL] += 3; s[SUBTYPES.WORKING_MEMORY] += 1; }
    if(answers[2] === 'count'){ s[SUBTYPES.FACT_RETRIEVAL] += 1; }
    return s;
  }

  /**
   * Subitizing oyunu sonucundan ek delil ekle.
   * @param {{correct, fast, maxTurns}} stats
   */
  scoreFromSubitizing({ correct, fast, maxTurns }){
    const s = this._zero();
    if(!maxTurns) return s;
    const accPct = correct / maxTurns;
    const fastPct = fast / maxTurns;
    if(accPct < .5) s[SUBTYPES.NUMBER_SENSE] += 2;
    if(fastPct < .3) s[SUBTYPES.NUMBER_SENSE] += 1;
    return s;
  }

  /** Sayı doğrusu sonucu (avg sapma) */
  scoreFromNumberLine(avgError){
    const s = this._zero();
    if(typeof avgError !== 'number') return s;
    if(avgError > 20) s[SUBTYPES.SPATIAL_NUMERIC] += 2;
    if(avgError > 30) s[SUBTYPES.NUMBER_SENSE] += 1;
    return s;
  }

  /** Yaş-bazlı kontrol listesi sonucu */
  scoreFromChecklist(checkedIndexes, ageGroup){
    const s = this._zero();
    if(!Array.isArray(checkedIndexes)) return s;
    // Basit eşleme: indekslere göre doğal kategoriler
    // Maddeler genelde: sayı, parmak, olgu, magnitude, ters yazma, kaygı
    const map = [
      SUBTYPES.NUMBER_SENSE,    // 0
      SUBTYPES.FACT_RETRIEVAL,  // 1 (parmak süreklilik)
      SUBTYPES.FACT_RETRIEVAL,  // 2 (olgu)
      SUBTYPES.NUMBER_SENSE,    // 3 (magnitude)
      SUBTYPES.SPATIAL_NUMERIC, // 4 (ters yazma)
      SUBTYPES.WORKING_MEMORY,  // 5 (genel)
    ];
    checkedIndexes.forEach(i => {
      const k = map[i];
      if(k) s[k] += 1;
    });
    return s;
  }

  /** Kümülatif olarak skorları topla */
  addScores(deltas, source = 'unknown'){
    const cur = this.profile;
    const next = { ...cur.scores };
    Object.keys(deltas).forEach(k => { next[k] = (next[k] || 0) + (deltas[k] || 0); });
    const history = (cur.history || []).slice(-19);
    history.push({ at: new Date().toISOString(), source, deltas });
    this._s.set(KEY, { scores: next, updatedAt: new Date().toISOString(), history });
    return next;
  }

  /** En yüksek skorlu alt-tip(ler) — eşit olanları döner */
  dominant(){
    const s = this.profile.scores;
    const max = Math.max(...Object.values(s));
    if(max <= 0) return [];
    return Object.entries(s)
      .filter(([k, v]) => v === max)
      .map(([k]) => k);
  }

  meta(subtype){ return SUBTYPE_META[subtype]; }
  allMeta(){ return SUBTYPE_META; }
  types(){ return SUBTYPES; }

  /** Önerilen etkinlik/oyun id'leri (dominant alt-tipten) */
  recommendedIds(){
    const dom = this.dominant();
    if(!dom.length) return [];
    return [...new Set(dom.flatMap(k => SUBTYPE_META[k].onerilenEtkinlikler))];
  }

  resetScores(){
    this._s.set(KEY, { scores: this._zero(), updatedAt: new Date().toISOString(), history: [] });
  }
}

export { SubtypeService, SUBTYPES, SUBTYPE_META };
