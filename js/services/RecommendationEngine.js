/* ABMATO — RecommendationEngine */

import { AnxietyLevel, Category } from '../core/constants.js';

class RecommendationEngine {
  constructor(repo){ this._repo = repo }

  recommend(parent, child, count=3, adaptiveEngine=null){
    const pool = this._repo.byAgeGroup(child.ageGroup);
    const done  = new Set(child.completedActivities||[]);
    const fresh = pool.filter(a=>!done.has(a.id));
    const src   = fresh.length >= count ? fresh : pool;
    const highAnx = parent.anxietyProfile?.level === AnxietyLevel.HIGH;

    // Adaptif zorluk seviyesi
    const diffLevel = adaptiveEngine
      ? adaptiveEngine.getDifficultyLevel(parent, child)
      : 'ok';

    const style = parent.parentingStyle || 'autonomy';
    return src
      .map(a=>({ a, score: this._score(a, highAnx, diffLevel, style) }))
      .sort((x,y)=>y.score-x.score)
      .slice(0, count)
      .map(x=>x.a);
  }

  _score(a, highAnx, diffLevel, parentingStyle){
    // Teorik çerçeve: Self-Determination Theory (Deci & Ryan, 2000)
    // Özerklik destekleyici yaklaşım: açık uçlu, keşif odaklı, günlük bağlamlı
    let s = Math.random() * 3;

    // Kaygı uyumu (Beilock & Maloney, 2015)
    if (highAnx && a.anxFriendly) s += 25;

    // Özerklik destekleyici profil → açık uçlu ve keşif etkinlikleri öncelikli
    if (parentingStyle === 'autonomy' || parentingStyle === 'mixed') {
      if (a.category === Category.DAILY)    s += 12; // Günlük bağlam = özgün keşif alanı
      if (a.category === Category.PATTERNS) s += 10; // Örüntü = sorgulama
      if (a.category === Category.SPATIAL)  s += 9;  // Uzamsal = keşif
      if (a.category === Category.PROBLEM)  s += 8;  // Problem kurma = üst düzey
      if (a.category === Category.GEOMETRY) s += 7;
      if (a.category === Category.NUMBER)   s += 5;
    } else {
      // Yönlendirici profil → yapılandırılmış etkinlikler
      if (a.category === Category.NUMBER)      s += 12;
      if (a.category === Category.MEASUREMENT) s += 10;
      if (a.category === Category.GEOMETRY)    s += 8;
      if (a.category === Category.DAILY)       s += 6;
    }

    // Adaptif zorluk (Vygotsky ZPD — yakınsak gelişim alanı)
    if (diffLevel === 'easy' && a.dur <= 10) s += 12;
    if (diffLevel === 'hard' && a.dur >= 15) s += 12;

    return s;
  }
}

export { RecommendationEngine };
