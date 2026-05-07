/* ══════════════════════════════════════════════════════════
   ABMATO — SpacedRetrievalService (Leitner kutuları)
   Sayı olgularını (toplama / çarpma) zamana yayılmış pratikle
   uzun süreli akıcılığa taşıma sistemi.

   Kutu → bir sonraki tekrar aralığı (gün):
      1: 1 gün     2: 2 gün     3: 4 gün
      4: 7 gün     5: 14 gün    6: 30 gün (mezun)
   Kanıt: Roediger & Karpicke (2006); Ophuis-Cox vd. (2023);
          NCTM strategy-first practice.
══════════════════════════════════════════════════════════ */

const KEY = 'fact_practice';
const BOX_INTERVALS_DAYS = [1, 2, 4, 7, 14, 30];
const MS_DAY = 86400000;

const DECKS = Object.freeze({
  ADD_TO_10:   { id:'add10',  ad:'10\'a Kadar Toplama',     emoji:'➕' },
  ADD_TO_20:   { id:'add20',  ad:'20\'ye Kadar Toplama',    emoji:'➕' },
  SUB_TO_10:   { id:'sub10',  ad:'10\'a Kadar Çıkarma',     emoji:'➖' },
  MULT_TO_5:   { id:'mult5',  ad:'5\'e Kadar Çarpma',       emoji:'✖️' },
  MULT_TO_10:  { id:'mult10', ad:'Çarpım Tablosu (10)',     emoji:'✖️' },
});

function buildAdditionDeck(max){
  const out = [];
  for(let a=0; a<=max; a++){
    for(let b=0; b<=max; b++){
      if(a+b > max) continue;
      out.push({ q: `${a} + ${b}`, a: a+b, op:'+', operands:[a,b] });
    }
  }
  return out;
}
function buildSubtractionDeck(max){
  const out = [];
  for(let a=0; a<=max; a++){
    for(let b=0; b<=a; b++){
      out.push({ q: `${a} − ${b}`, a: a-b, op:'-', operands:[a,b] });
    }
  }
  return out;
}
function buildMultDeck(max){
  const out = [];
  for(let a=1; a<=max; a++){
    for(let b=1; b<=max; b++){
      out.push({ q: `${a} × ${b}`, a: a*b, op:'×', operands:[a,b] });
    }
  }
  return out;
}

const DECK_BUILDERS = {
  add10: () => buildAdditionDeck(10),
  add20: () => buildAdditionDeck(20),
  sub10: () => buildSubtractionDeck(10),
  mult5: () => buildMultDeck(5),
  mult10: () => buildMultDeck(10),
};

class SpacedRetrievalService {
  constructor(storage){ this._s = storage; }

  /* ─── İç state ────────────────────────────────────── */
  _getAll(){ return this._s.get(KEY, {}); }
  _saveAll(state){ this._s.set(KEY, state); }

  decks(){ return DECKS; }

  /**
   * Bir destenin durumunu döndür. Yoksa oluştur.
   * State şekli: { cards: { "0+0": { box, lastSeen, due } }, stats: {...} }
   */
  getDeck(deckId){
    const all = this._getAll();
    if(all[deckId]) return all[deckId];
    const builder = DECK_BUILDERS[deckId];
    if(!builder) throw new Error('Bilinmeyen deste: ' + deckId);
    const cards = {};
    builder().forEach(c => {
      cards[c.q] = { q:c.q, a:c.a, op:c.op, operands:c.operands, box:1, lastSeen:null, due:Date.now() };
    });
    all[deckId] = { cards, stats: { sessions:0, totalCorrect:0, totalAnswered:0 } };
    this._saveAll(all);
    return all[deckId];
  }

  /** Bugün vadesi gelen kartlar (en gecikmiş önce) */
  dueCards(deckId, limit = 12){
    const deck = this.getDeck(deckId);
    const now = Date.now();
    const arr = Object.values(deck.cards)
      .filter(c => c.box < BOX_INTERVALS_DAYS.length && c.due <= now)
      .sort((a,b) => a.due - b.due);
    if(arr.length >= limit) return arr.slice(0, limit);
    // Az ise: kutu sırasına göre yakın olanları da ekle
    const extras = Object.values(deck.cards)
      .filter(c => !arr.includes(c))
      .sort((a,b) => a.box - b.box)
      .slice(0, limit - arr.length);
    return [...arr, ...extras];
  }

  /** Cevap sonucu: doğru → kutu+1, yanlış → kutu=1 */
  recordAnswer(deckId, q, isCorrect){
    const all = this._getAll();
    const deck = all[deckId] || this.getDeck(deckId);
    const card = deck.cards[q];
    if(!card) return null;
    card.lastSeen = Date.now();
    if(isCorrect){
      card.box = Math.min(BOX_INTERVALS_DAYS.length, card.box + 1);
    } else {
      card.box = 1;
    }
    const days = BOX_INTERVALS_DAYS[card.box - 1] || BOX_INTERVALS_DAYS[BOX_INTERVALS_DAYS.length - 1];
    card.due = Date.now() + days * MS_DAY;
    deck.stats.totalAnswered = (deck.stats.totalAnswered || 0) + 1;
    if(isCorrect) deck.stats.totalCorrect = (deck.stats.totalCorrect || 0) + 1;
    all[deckId] = deck;
    this._saveAll(all);
    return card;
  }

  finishSession(deckId){
    const all = this._getAll();
    const deck = all[deckId];
    if(!deck) return;
    deck.stats.sessions = (deck.stats.sessions || 0) + 1;
    deck.stats.lastSession = new Date().toISOString();
    all[deckId] = deck;
    this._saveAll(all);
  }

  /** Mezuniyet özeti */
  summary(deckId){
    const deck = this.getDeck(deckId);
    const cards = Object.values(deck.cards);
    const total = cards.length;
    const byBox = [0,0,0,0,0,0];
    cards.forEach(c => byBox[Math.min(c.box-1, 5)]++);
    const mastered = byBox[5];
    return {
      total,
      mastered,
      masteryPct: total ? Math.round(mastered * 100 / total) : 0,
      byBox,
      stats: deck.stats,
      dueNow: this.dueCards(deckId, 9999).length,
    };
  }

  resetDeck(deckId){
    const all = this._getAll();
    delete all[deckId];
    this._saveAll(all);
  }
}

export { SpacedRetrievalService, DECKS };
