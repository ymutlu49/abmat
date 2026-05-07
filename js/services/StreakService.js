/* ABMATO — StreakService
 *
 * R5 refactor: Duolingo-tarzı ardışık gün "streak" yerine haftalık ritim modeli.
 * Hedef kitlemiz zaten kaygılı ebeveynler olduğu için "serin bozuldu" tarzı
 * guilt-trip kontra-prodüktiftir (Penn gamification çalışması). Bunun yerine
 * "bu hafta N etkinlik yaptınız" pozitif çerçevelemesi kullanıyoruz.
 *
 * Eski getData/isTodayDone/checkExpiry arayüzü geriye dönük uyumluluk için
 * korunuyor — böylece diğer kodlar bozulmadan çalışmaya devam ediyor.
 */

const MS_PER_DAY = 86400000;
// Hedef hafta başına kaç etkinlik? (Berkowitz 2015: "haftada bir bile yeter")
const DEFAULT_WEEKLY_GOAL = 3;

class StreakService {
  constructor(storage){ this._s = storage; }

  // ── Haftalık ritim API (R5) ──────────────────────────────

  // ISO hafta anahtarı, örn. "2026-W15"
  _weekKey(d = new Date()){
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7; // Pazar = 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((date - yearStart) / MS_PER_DAY) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2,'0')}`;
  }

  _loadWeeks(){
    return this._s.get('weekly_rhythm', { weeks: {}, goal: DEFAULT_WEEKLY_GOAL });
  }

  getWeeklyProgress(){
    const data = this._loadWeeks();
    const key  = this._weekKey();
    const thisWeekDates = data.weeks[key] || [];
    const goal = data.goal || DEFAULT_WEEKLY_GOAL;
    // Tamamlanan hafta sayısı (ardışık olması gerekmiyor — toplam)
    const completedWeeks = Object.values(data.weeks).filter(
      arr => (arr?.length || 0) >= goal
    ).length;
    // En iyi hafta: tek haftada yapılan en çok etkinlik
    const bestWeek = Object.values(data.weeks).reduce(
      (m, arr) => Math.max(m, (arr?.length || 0)), 0
    );
    return {
      weekKey: key,
      thisWeekCount: thisWeekDates.length,
      goal,
      completedWeeks,
      bestWeek,
      todayDone: this.isTodayDone(),
    };
  }

  setWeeklyGoal(n){
    const data = this._loadWeeks();
    data.goal = Math.max(1, Math.min(7, n|0));
    this._s.set('weekly_rhythm', data);
    return data;
  }

  // ── Etkinlik kaydı (eski + yeni) ─────────────────────────

  recordActivity(){
    const today = new Date().toDateString();

    // Eski format — hala bazı yerlerde okunuyor
    const legacy = this._s.get('streak', { count:0, lastDate:null, longestStreak:0, todayDone:false });
    if(legacy.lastDate !== today){
      const yesterday = new Date(Date.now() - MS_PER_DAY).toDateString();
      const isConsecutive = legacy.lastDate === yesterday;
      const newCount = isConsecutive ? legacy.count + 1 : 1;
      this._s.set('streak', {
        count: newCount,
        lastDate: today,
        longestStreak: Math.max(newCount, legacy.longestStreak||0),
        todayDone: true,
      });
    }

    // Yeni format — haftalık ritim
    const data = this._loadWeeks();
    const key = this._weekKey();
    if(!data.weeks[key]) data.weeks[key] = [];
    if(!data.weeks[key].includes(today)) data.weeks[key].push(today);
    this._s.set('weekly_rhythm', data);

    // Controller'a yeni durum bilgisini döndür
    return this.getWeeklyProgress();
  }

  isTodayDone(){
    const data = this._loadWeeks();
    const key = this._weekKey();
    const today = new Date().toDateString();
    return (data.weeks[key] || []).includes(today);
  }

  // ── Geriye dönük uyumluluk (eski kod) ────────────────────

  // Dashboard eski streak kartından yararlanıyor — artık haftalık görünümü döndürür
  getData(){
    const p = this.getWeeklyProgress();
    return {
      count: p.thisWeekCount,
      lastDate: this.isTodayDone() ? new Date().toDateString() : null,
      longestStreak: p.bestWeek,
      todayDone: p.todayDone,
    };
  }

  checkExpiry(){
    // Haftalık modelde "expire" kavramı yok — her hafta sıfırdan başlar
    return this.getData();
  }
}

export { StreakService, DEFAULT_WEEKLY_GOAL };
