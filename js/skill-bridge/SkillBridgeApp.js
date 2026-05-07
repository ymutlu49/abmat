/* ABMATO — Beceri Köprüsü: SkillBridgeApp */

class SkillBridgeApp {
  #view;
  #progressSvc;
  #state;

  constructor({ view, progressSvc }) {
    this.#view        = view;
    this.#progressSvc = progressSvc;
    this.#state       = { screen: 'list', moduleId: null, filter: null };
  }

  /** Ana giriş noktası */
  mount() {
    this.#showList();
    this.#attachFilterDelegation();
  }

  openModule(moduleId) {
    this.#state = { screen: 'detail', moduleId, filter: this.#state.filter };
    this.#view.renderDetail(moduleId);
    this.#reattachEvents();
  }

  back() {
    this.#state = { screen: 'list', moduleId: null, filter: this.#state.filter };
    this.#showList();
  }

  setFilter(bolum) {
    this.#state = { ...this.#state, screen: 'list', filter: bolum || null };
    this.#showList();
  }

  // ── Özel ───────────────────────────────────────────────────

  #showList() {
    this.#view.renderList(this.#state.filter);
    this.#reattachEvents();
  }

  #reattachEvents() {
    const c = this.#view.container ?? document.querySelector('[data-sb-root]');
    if (!c) return;

    // Modül açma
    c.querySelectorAll('[data-sb-open]').forEach(el => {
      el.addEventListener('click', () => this.openModule(el.dataset.sbOpen));
    });

    // Geri
    c.querySelectorAll('[data-sb-back]').forEach(el => {
      el.addEventListener('click', () => this.back());
    });

    // Filtre butonları
    this.#attachFilterDelegation();
  }

  #attachFilterDelegation() {
    const c = this.#view.container ?? document.querySelector('[data-sb-root]');
    if (!c) return;
    c.querySelectorAll('[data-sb-filter]').forEach(el => {
      el.addEventListener('click', () => this.setFilter(el.dataset.sbFilter));
    });
  }
}

export { SkillBridgeApp };
