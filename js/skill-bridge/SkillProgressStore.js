/* ABMAT — Beceri Köprüsü: SkillProgressStore */

class SkillProgressStore {
  #storageKey;
  #storage;

  constructor(storage, namespace = 'matevde') {
    this.#storage = storage;
    this.#storageKey = `${namespace}:skill_progress`;
  }

  /** @returns {{ completed: string[], notes: Object.<string,string> }} */
  load() {
    const raw = this.#storage.getItem(this.#storageKey);
    if (!raw) return { completed: [], notes: {} };
    try {
      return JSON.parse(raw);
    } catch {
      return { completed: [], notes: {} };
    }
  }

  /** @param {{ completed: string[], notes: Object.<string,string> }} data */
  save(data) {
    this.#storage.setItem(this.#storageKey, JSON.stringify(data));
  }

  markComplete(moduleId) {
    const data = this.load();
    if (!data.completed.includes(moduleId)) {
      data.completed = [...data.completed, moduleId];
      this.save(data);
    }
  }

  saveNote(moduleId, text) {
    const data = this.load();
    data.notes = { ...data.notes, [moduleId]: text };
    this.save(data);
  }

  getNote(moduleId) {
    return this.load().notes[moduleId] ?? '';
  }

  isCompleted(moduleId) {
    return this.load().completed.includes(moduleId);
  }

  getCompletedIds() {
    return this.load().completed;
  }

  reset() {
    this.#storage.removeItem(this.#storageKey);
  }
}

export { SkillProgressStore };
