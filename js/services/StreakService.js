/* ABMAT — StreakService */

class StreakService {
  constructor(storage){ this._s = storage }

  getData(){ return this._s.get('streak', { count:0, lastDate:null, longestStreak:0, todayDone:false }) }

  // Bir etkinlik tamamlandığında çağrılır
  recordActivity(){
    const data = this.getData();
    const today = new Date().toDateString();
    if(data.lastDate === today) return data; // Bugün zaten kaydedildi

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isConsecutive = data.lastDate === yesterday;

    const newCount = isConsecutive ? data.count + 1 : 1;
    const updated = {
      count: newCount,
      lastDate: today,
      longestStreak: Math.max(newCount, data.longestStreak||0),
      todayDone: true,
    };
    this._s.set('streak', updated);
    return updated;
  }

  // Bugünün durumu
  isTodayDone(){
    const data = this.getData();
    return data.lastDate === new Date().toDateString();
  }

  // Streak kırılıp kırılmadığını kontrol et
  checkExpiry(){
    const data = this.getData();
    if(!data.lastDate) return data;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const today = new Date().toDateString();
    if(data.lastDate !== today && data.lastDate !== yesterday && data.count > 0){
      // Streak kırıldı — sıfırla ama longestStreak koru
      const reset = { count:0, lastDate:null, longestStreak:data.longestStreak, todayDone:false };
      this._s.set('streak', reset);
      return reset;
    }
    return data;
  }
}

export { StreakService };
