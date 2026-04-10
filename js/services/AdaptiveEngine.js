/* ABMAT — AdaptiveEngine */

class AdaptiveEngine {
  constructor(storage){ this._s = storage }

  getFeedback(){ return this._s.get('activity_feedback', {}) }

  recordFeedback(activityId, difficulty){ // 'easy' | 'ok' | 'hard'
    const fb = this.getFeedback();
    fb[activityId] = { difficulty, date: new Date().toISOString() };
    this._s.set('activity_feedback', fb);
  }

  getDifficultyLevel(parent, child){
    // Birikmiş geri bildirimlere bakarak tercih edilen zorluk seviyesini tahmin et
    const fb = this.getFeedback();
    const completedCount = (child.completedActivities||[]).length;
    if(completedCount < 3) return 'easy';     // Yeni başlayan: kolay başla
    const recentFbs = Object.values(fb).slice(-5);
    const hardCount = recentFbs.filter(f=>f.difficulty==='hard').length;
    const easyCount = recentFbs.filter(f=>f.difficulty==='easy').length;
    if(hardCount >= 3) return 'easy';          // Çok zorlanıyor: geri çekil
    if(easyCount >= 3) return 'hard';          // Çok kolay: zorlaştır
    return 'ok';
  }
}

export { AdaptiveEngine };
