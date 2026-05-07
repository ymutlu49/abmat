/* ABMATO — PlannerService */

import { AgeGroup } from '../core/constants.js';

class PlannerService {
  constructor(storage, repo){ this._s=storage; this._repo=repo }

  getWeekPlan(){ return this._s.get('week_plan', {}) }

  setDayActivity(dayIdx, activityId){
    const plan = this.getWeekPlan();
    plan[dayIdx] = activityId;
    this._s.set('week_plan', plan);
    return plan;
  }

  clearDay(dayIdx){
    const plan = this.getWeekPlan();
    delete plan[dayIdx];
    this._s.set('week_plan', plan);
  }

  autoGenerate(child){
    const activities = this._repo.byAgeGroup(child.ageGroup||AgeGroup.G1);
    const done = new Set(child.completedActivities||[]);
    const fresh = activities.filter(a=>!done.has(a.id));
    const pool = fresh.length >= 5 ? fresh : activities;
    const shuffled = [...pool].sort(()=>Math.random()-.5);
    const plan = {};
    [0,2,4].forEach((d,i)=>{ if(shuffled[i]) plan[d]=shuffled[i].id });
    this._s.set('week_plan', plan);
    return plan;
  }
}

export { PlannerService };
