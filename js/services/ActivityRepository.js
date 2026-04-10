/* ABMAT — Etkinlik deposu
   Saf sorgu arayüzü; veri js/data/activities.js dosyasından enjekte edilir. */

import { ACTIVITIES } from '../data/activities.js';

class ActivityRepository {
  constructor(data = ACTIVITIES){ this._data = data; }
  all(){ return [...this._data]; }
  byId(id){ return this._data.find(a=>a.id===id) || null; }
  byAgeGroup(ag){ return this._data.filter(a=>a.ageGroups.includes(ag)); }
  byCategory(cat){ return this._data.filter(a=>a.category===cat); }
  anxietyFriendly(){ return this._data.filter(a=>a.anxFriendly); }
  forDyscalculia(){ return this._data.filter(a=>a.dysc); }
}

export { ActivityRepository };
