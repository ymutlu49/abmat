/* ABMAT — Beceri Köprüsü: SkillRepository */

class SkillRepository {
  #modules;

  constructor(modules) {
    // Sıra numarasına göre sırala, immutable kopyasını tut
    this.#modules = Object.freeze([...modules].sort((a, b) => a.sira - b.sira));
  }

  all() {
    return this.#modules;
  }

  byId(id) {
    return this.#modules.find(m => m.id === id) ?? null;
  }

  byBolum(bolum) {
    return this.#modules.filter(m => m.bolum === bolum);
  }

  bySinif(sinif) {
    return this.#modules.filter(m => m.siniflar.includes(sinif));
  }

  /**
   * Bir sonraki önerilen modülü döndürür.
   * Önce on-kosul tamamlanmış ve kendisi tamamlanmamış modülleri filtreler.
   */
  nextRecommended(completedIds) {
    const completedSet = new Set(completedIds);
    return this.#modules.find(m =>
      !completedSet.has(m.id) &&
      (!m.onKosul || completedSet.has(m.onKosul))
    ) ?? null;
  }

  totalCount() {
    return this.#modules.length;
  }

  bolumler() {
    const seen = new Set();
    return this.#modules
      .map(m => m.bolum)
      .filter(b => { if (seen.has(b)) return false; seen.add(b); return true; });
  }
}

export { SkillRepository };
