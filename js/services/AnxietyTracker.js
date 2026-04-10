/* ABMAT — AnxietyTracker */

class AnxietyTracker {
  constructor(storage){ this._s = storage }

  getHistory(){ return this._s.get('anxiety_history', []) }

  record(score, level){
    const history = this.getHistory();
    const entry = { date: new Date().toISOString(), score, level };
    const updated = [...history.slice(-11), entry]; // son 12 kayıt
    this._s.set('anxiety_history', updated);
    return updated;
  }

  getTrend(){
    const h = this.getHistory();
    if(h.length < 2) return 'stable';
    const last = h[h.length-1].score;
    const prev = h[h.length-2].score;
    if(last < prev - 5) return 'improving';
    if(last > prev + 5) return 'worsening';
    return 'stable';
  }
}

export { AnxietyTracker };
