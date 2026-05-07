/* ABMATO — Beceri Köprüsü: SkillBridgeView */

class SkillBridgeView {
  #container;
  #progressSvc;
  #repo;
  #bolumMeta;
  #onOpen;    // (moduleId) => void
  #onClose;   // () => void

  constructor({ container, progressSvc, repo, bolumMeta, onOpen, onClose }) {
    this.#container  = container;
    this.#progressSvc = progressSvc;
    this.#repo       = repo;
    this.#bolumMeta  = bolumMeta;
    this.#onOpen     = onOpen;
    this.#onClose    = onClose;
  }

  // ── Liste görünümü ──────────────────────────────────────────
  renderList(filterBolum = null, filterSinif = null) {
    const summary  = this.#progressSvc.summary();
    const modules  = filterBolum
      ? this.#repo.byBolum(filterBolum)
      : filterSinif
        ? this.#repo.bySinif(filterSinif)
        : this.#repo.all();
    const next     = this.#progressSvc.nextRecommended();
    const bolumler = this.#repo.bolumler();

    this.#container.innerHTML = `
      ${this.#renderHeader(summary)}
      ${this.#renderFilters(bolumler, filterBolum)}
      ${next && !filterBolum ? this.#renderNextCard(next) : ''}
      <div class="sb-module-list">
        ${modules.map(m => this.#renderModuleCard(m)).join('')}
      </div>
    `;

    // Event delegation — tek listener, sınıf tabanlı
    this.#container.querySelectorAll('[data-sb-open]').forEach(el => {
      el.addEventListener('click', () => this.#onOpen(el.dataset.sbOpen));
    });
  }

  // ── Modül detay görünümü ────────────────────────────────────
  renderDetail(moduleId) {
    const mod = this.#repo.byId(moduleId);
    if (!mod) { this.renderList(); return; }

    const locked    = this.#progressSvc.isLocked(moduleId);
    const completed = this.#progressSvc.isCompleted(moduleId);
    const note      = this.#progressSvc.getNote(moduleId);

    this.#container.innerHTML = `
      <div class="sb-detail">
        ${this.#renderDetailHeader(mod, completed)}
        ${locked ? this.#renderLockNotice(mod) : this.#renderDetailBody(mod, completed, note)}
      </div>
    `;

    // Not alanı
    const noteEl = this.#container.querySelector('[data-sb-note]');
    if (noteEl) {
      noteEl.addEventListener('input', e =>
        this.#progressSvc.saveNote(moduleId, e.target.value)
      );
    }

    // Geri butonu
    this.#container.querySelector('[data-sb-back]')
      ?.addEventListener('click', () => this.#onClose());

    // Tamamlandı butonu
    this.#container.querySelector('[data-sb-complete]')
      ?.addEventListener('click', () => {
        this.#progressSvc.complete(moduleId);
        this.renderDetail(moduleId); // yenile
      });
  }

  // ── Yardımcı render metodları ───────────────────────────────

  #renderHeader({ tamamlanan, toplam, yuzde }) {
    return `
      <div class="sb-header">
        <h2 class="sb-title">📚 Beceri Köprüsü</h2>
        <p class="sb-subtitle">Evde matematik desteğinin adım adım rehberi</p>
        <div class="sb-progress-bar">
          <div class="sb-progress-fill" style="width:${yuzde}%"></div>
        </div>
        <p class="sb-progress-text">${tamamlanan} / ${toplam} modül tamamlandı</p>
      </div>
    `;
  }

  #renderFilters(bolumler, active) {
    const meta = this.#bolumMeta;
    const allBtn = `
      <button class="sb-filter-btn ${!active ? 'active' : ''}" data-sb-filter="">
        🔍 Tümü
      </button>`;
    const bolumBtns = bolumler.map(b => `
      <button class="sb-filter-btn ${active === b ? 'active' : ''}" data-sb-filter="${b}">
        ${meta[b].emoji} ${meta[b].ad}
      </button>`).join('');
    return `<div class="sb-filters">${allBtn}${bolumBtns}</div>`;
  }

  #renderNextCard(mod) {
    return `
      <div class="sb-next-card" data-sb-open="${mod.id}">
        <span class="sb-next-label">▶ Sıradaki</span>
        <span class="sb-next-emoji">${mod.emoji}</span>
        <div>
          <strong>${mod.baslik}</strong>
          <p>${mod.altBaslik}</p>
        </div>
        <span class="sb-next-arrow">→</span>
      </div>
    `;
  }

  #renderModuleCard(mod) {
    const completed = this.#progressSvc.isCompleted(mod.id);
    const locked    = this.#progressSvc.isLocked(mod.id);
    const meta      = this.#bolumMeta[mod.bolum];

    const stateClass = completed ? 'sb-card--done' : locked ? 'sb-card--locked' : '';
    const stateIcon  = completed ? '✅' : locked ? '🔒' : '';

    return `
      <div class="sb-card ${stateClass}" data-sb-open="${mod.id}">
        <div class="sb-card-emoji">${mod.emoji}</div>
        <div class="sb-card-body">
          <div class="sb-card-meta">
            <span class="sb-card-bolum" style="color:${meta.renk}">${meta.emoji} ${meta.ad}</span>
            <span class="sb-card-sure">⏱ ${mod.sure} dk</span>
          </div>
          <h3 class="sb-card-title">${mod.baslik}</h3>
          <p class="sb-card-sub">${mod.altBaslik}</p>
          <div class="sb-card-siniflar">
            ${mod.siniflar.map(s => `<span class="sb-sinif-chip">${s}</span>`).join('')}
          </div>
        </div>
        <div class="sb-card-state">${stateIcon || '›'}</div>
      </div>
    `;
  }

  #renderDetailHeader(mod, completed) {
    const meta = this.#bolumMeta[mod.bolum];
    return `
      <div class="sb-detail-header">
        <button class="sb-back-btn" data-sb-back>← Geri</button>
        <div class="sb-detail-emoji">${mod.emoji}</div>
        <div class="sb-detail-bolum" style="color:${meta.renk}">
          ${meta.emoji} ${meta.ad}
        </div>
        <h2 class="sb-detail-title">${mod.baslik}</h2>
        <p class="sb-detail-sub">${mod.altBaslik}</p>
        <div class="sb-detail-chips">
          <span>⏱ ${mod.sure} dk</span>
          ${mod.siniflar.map(s => `<span class="sb-sinif-chip">${s}</span>`).join('')}
          ${completed ? '<span class="sb-done-chip">✅ Tamamlandı</span>' : ''}
        </div>
      </div>
    `;
  }

  #renderLockNotice(mod) {
    const prereq = this.#repo.byId(mod.onKosul);
    return `
      <div class="sb-lock-notice">
        <div class="sb-lock-icon">🔒</div>
        <p>Bu modülü açmak için önce şunu tamamlayın:</p>
        <strong>${prereq?.baslik ?? mod.onKosul}</strong>
        <button class="sb-btn sb-btn-ghost" data-sb-open="${mod.onKosul}">
          Oraya git →
        </button>
      </div>
    `;
  }

  #renderDetailBody(mod, completed, note) {
    return `
      <!-- Hedef -->
      <div class="sb-section sb-hedef">
        <h4>🎯 Bu modülde ne öğreneceğiz?</h4>
        <p>${mod.hedef}</p>
      </div>

      <!-- Araçlar -->
      <div class="sb-section sb-araclar">
        <h4>🛠️ Gerekli Araçlar</h4>
        ${mod.araclar.zorunlu.length
          ? `<ul>${mod.araclar.zorunlu.map(a => `<li>${a}</li>`).join('')}</ul>`
          : '<p class="sb-muted">Ekstra materyal gerekmez</p>'
        }
        ${mod.araclar.evYapimi
          ? `<div class="sb-ev-yapimi">♻️ <strong>Ev yapımı:</strong> ${mod.araclar.evYapimi}</div>`
          : ''
        }
      </div>

      <!-- Adımlar -->
      <div class="sb-section sb-adimlar">
        <h4>📋 Adım Adım Uygulama</h4>
        <ol class="sb-steps">
          ${mod.adimlar.map(s => `
            <li class="sb-step">
              <div class="sb-step-no">${s.no}</div>
              <div class="sb-step-body">
                <p class="sb-step-eylem">${s.eylem}</p>
                ${s.ipucu
                  ? `<p class="sb-step-ipucu">💡 ${s.ipucu}</p>`
                  : ''
                }
              </div>
            </li>`).join('')}
        </ol>
      </div>

      <!-- Sorular -->
      <div class="sb-section sb-sorular">
        <h4>🗣️ Özerklik Destekleyici Sorular</h4>
        <p class="sb-muted">Bu soruları cevap beklemeden, düşündürmek için sorun:</p>
        <ul class="sb-q-list">
          ${mod.sorular.map(q => `<li>${q}</li>`).join('')}
        </ul>
      </div>

      <!-- Dikkat -->
      ${mod.dikkatler.length ? `
      <div class="sb-section sb-dikkatler">
        <h4>⚠️ Yapmamanız Gerekenler</h4>
        <ul class="sb-d-list">
          ${mod.dikkatler.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>` : ''}

      <!-- SES Alternatifi -->
      ${mod.sesAlt ? `
      <div class="sb-section sb-sesalt">
        <h4>♻️ Her Bütçeye Uygun Alternatif</h4>
        <p>${mod.sesAlt}</p>
      </div>` : ''}

      <!-- TYMM -->
      ${this.#renderTymm(mod.tymm)}

      <!-- Gözlem Notu -->
      <div class="sb-section sb-not">
        <h4>📝 Gözlem Notunuz</h4>
        <textarea
          class="sb-not-input"
          placeholder="Nasıl geçti? Ne fark ettiniz? Çocuğunuz ne söyledi?"
          data-sb-note
        >${note}</textarea>
      </div>

      <!-- Tamamla butonu -->
      <div class="sb-actions">
        ${completed
          ? `<div class="sb-done-badge">✅ Bu modülü tamamladınız!</div>`
          : `<button class="sb-btn sb-btn-primary" data-sb-complete>
               Tamamladım ✓
             </button>`
        }
      </div>
    `;
  }

  #renderTymm(tymm) {
    if (!tymm) return '';
    const parts = [];
    if (tymm.oo?.length) {
      parts.push(`<span class="sb-tymm-chip sb-tymm-oo">OÖ: ${tymm.oo.join(', ')}</span>`);
    }
    if (tymm.il?.length) {
      parts.push(`<span class="sb-tymm-chip sb-tymm-il">İL: ${tymm.il.join(', ')}</span>`);
    }
    if (tymm.tema?.length) {
      parts.push(`<span class="sb-tymm-chip sb-tymm-tema">Tema: ${tymm.tema.join(', ')}</span>`);
    }
    if (!parts.length) return '';
    return `
      <div class="sb-section sb-tymm">
        <h4>🎓 TYMM Müfredat Uyumu</h4>
        <div class="sb-tymm-chips">${parts.join('')}</div>
        <p class="sb-muted" style="font-size:var(--t-xs);margin-top:.4rem">
          Kaynak: MEB TEGM OÖEP 2024 · İlkokul Matematik Dersi Öğretim Programı 2024
        </p>
      </div>
    `;
  }
}

export { SkillBridgeView };
