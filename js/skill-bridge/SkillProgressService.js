/* ABMATO — Beceri Köprüsü: SkillProgressService */

class SkillProgressService {
  #store;
  #repo;

  constructor(store, repo) {
    this.#store = store;
    this.#repo = repo;
  }

  /** Modülün kilitli olup olmadığı */
  isLocked(moduleId) {
    const mod = this.#repo.byId(moduleId);
    if (!mod || !mod.onKosul) return false;
    return !this.#store.isCompleted(mod.onKosul);
  }

  isCompleted(moduleId) {
    return this.#store.isCompleted(moduleId);
  }

  complete(moduleId) {
    if (this.isLocked(moduleId)) return { ok: false, reason: 'locked' };
    this.#store.markComplete(moduleId);
    return { ok: true };
  }

  saveNote(moduleId, text) {
    this.#store.saveNote(moduleId, text);
  }

  getNote(moduleId) {
    return this.#store.getNote(moduleId);
  }

  /** Genel ilerleme: { tamamlanan, toplam, yuzde, bolumler } */
  summary() {
    const completed = this.#store.getCompletedIds();
    const total = this.#repo.totalCount();
    const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const byBolum = {};
    for (const mod of this.#repo.all()) {
      if (!byBolum[mod.bolum]) byBolum[mod.bolum] = { toplam: 0, tamamlanan: 0 };
      byBolum[mod.bolum].toplam++;
      if (completed.includes(mod.id)) byBolum[mod.bolum].tamamlanan++;
    }

    return { tamamlanan: completed.length, toplam: total, yuzde: pct, byBolum };
  }

  nextRecommended() {
    return this.#repo.nextRecommended(this.#store.getCompletedIds());
  }
}

export { SkillProgressService };
