/* ABMAT — BadgeEngine */

import { AnxietyLevel } from '../core/constants.js';

class BadgeEngine {
  static DEFS = [
    { id:'first',    emoji:'🌱', label:'İlk Adım',        desc:'İlk etkinliği tamamladı',         cond:(p,c)=>c.completedActivities.length>=1 },
    { id:'three',    emoji:'🎯', label:'Ritme Girdik',     desc:'3 etkinlik tamamlandı',           cond:(p,c)=>c.completedActivities.length>=3 },
    { id:'explorer', emoji:'🔭', label:'Kaşif',           desc:'5 etkinlik tamamlandı',           cond:(p,c)=>c.completedActivities.length>=5 },
    { id:'ten',      emoji:'⭐', label:'Tutarlı',         desc:'10 etkinlik tamamlandı',          cond:(p,c)=>c.completedActivities.length>=10 },
    { id:'brave',    emoji:'🦁', label:'Cesur Ebeveyn',   desc:'Yüksek kaygıya rağmen devam',     cond:(p,c)=>p.anxietyProfile?.level===AnxietyLevel.HIGH && c.completedActivities.length>=2 },
    { id:'streak3',  emoji:'🔥', label:'3 Günlük Seri',   desc:'3 gün art arda etkinlik',         cond:(p,c)=>BadgeEngine._getStreak()>=3 },
    { id:'streak7',  emoji:'🔥🔥',label:'Haftalık Ateş',  desc:'7 gün art arda etkinlik',         cond:(p,c)=>BadgeEngine._getStreak()>=7 },
    { id:'spatial',  emoji:'🧭', label:'Uzamsal Gezgin',  desc:'İlk uzamsal etkinlik tamamlandı', cond:(p,c)=>BadgeEngine._hasSpatial(c) },
    { id:'dysc',     emoji:'💙', label:'Anlayışlı Ebeveyn',desc:'Diskalkuli modülü tamamlandı',   cond:(p,c)=>p.dyscModuleDone },
    { id:'teacher',  emoji:'🤝', label:'Köprü Kurucu',    desc:'Öğretmene mesaj gönderildi',      cond:(p,c)=>p.teacherMessages?.length>0 },
    { id:'planner',  emoji:'📅', label:'Planlı Ebeveyn',  desc:'Haftalık plan oluşturuldu',       cond:(p,c)=>p.weeklyPlans?.length>0 },
    { id:'calm',     emoji:'🧘', label:'Sakin Zihin',     desc:'Kaygı seansını tamamladı',        cond:(p,c)=>p.breathingDone },
    { id:'talker',   emoji:'💬', label:'Sayı Sohbetier',     desc:'Sayı Sohbeti kartını kullandı',      cond:(p,c)=>p.mathTalkUsed },
  ];

  static _getStreak(){
    try{ const d=JSON.parse(localStorage.getItem('matevde:streak')||'{}'); return d.count||0; }catch{ return 0; }
  }

  static _hasSpatial(child){
    // Uzamsal kategorideki etkinlik ID'leri s ile başlıyor
    return (child.completedActivities||[]).some(id=>id.startsWith('s'));
  }

  evaluate(parent, child){
    const have = new Set([...(parent.badges||[]).map(b=>b.id)]);
    return BadgeEngine.DEFS
      .filter(d=>!have.has(d.id) && d.cond(parent, child))
      .map(d=>({ id:d.id, emoji:d.emoji, label:d.label, earnedAt:new Date() }));
  }
}

export { BadgeEngine };
