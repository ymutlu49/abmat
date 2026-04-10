/* ABMAT — Çekirdek sabitler */

const AgeGroup = Object.freeze({
  PRESCHOOL:'preschool', G1:'grade_1', G2:'grade_2', G3:'grade_3', G4:'grade_4'
});
const AnxietyLevel = Object.freeze({ LOW:'low', MEDIUM:'medium', HIGH:'high' });
const ParentingStyle = Object.freeze({ AUTONOMY:'autonomy', CONTROLLING:'controlling', MIXED:'mixed', UNKNOWN:'unknown' });
const Category = Object.freeze({ NUMBER:'number_sense', GEOMETRY:'geometry', MEASUREMENT:'measurement', PATTERNS:'patterns', PROBLEM:'problem_solving', DAILY:'daily_life', SPATIAL:'spatial_reasoning' });

export { AgeGroup, AnxietyLevel, ParentingStyle, Category };
