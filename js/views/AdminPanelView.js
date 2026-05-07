/* ══════════════════════════════════════════════════════════
   ABMATO — AdminPanelView
   Tek merkezi yönetici paneli: tüm içerik tiplerini listeler,
   her tipte arama + "+ Yeni" + satır bazlı Düzenle/Sil.
   Sadece role=admin|editor erişebilir (App._canEdit gate).

   Tipler: activities · learn · books · stories · mt
══════════════════════════════════════════════════════════ */

import { BaseView } from './BaseView.js';

const TABS = [
  { id: 'activities', icon: '🎯', ad: 'Etkinlikler',  addLabel: '+ Etkinlik' },
  { id: 'learn',      icon: '📚', ad: 'Akademi',      addLabel: '+ Modül' },
  { id: 'books',      icon: '📖', ad: 'Kitaplar',     addLabel: '+ Kitap' },
  { id: 'stories',    icon: '🌟', ad: 'Hikayeler',    addLabel: '+ Hikaye' },
  { id: 'mt',         icon: '💬', ad: 'Sohbet',       addLabel: '+ Kart' },
];

export class AdminPanelView extends BaseView {
  static render(app){
    const el = document.getElementById('admin-body');
    if(!el) return;
    if(!app._canEdit()){
      el.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:1.4rem">
        <div style="font-size:2.5rem;margin-bottom:.4rem">🔒</div>
        <h3>Yetkiniz Yok</h3>
        <p class="muted" style="font-size:var(--t-sm);margin-top:.4rem">Bu sayfa yalnızca yönetici (admin) ve içerik üreticileri için.</p>
      </div></div>`;
      return;
    }
    const tab = app._adminTab || 'activities';
    const search = app._adminSearch || '';
    const counts = AdminPanelView._counts(app);
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(46,125,50,.08),rgba(46,125,50,.02));border-radius:var(--r-lg);padding:var(--s-lg);margin-bottom:1rem;border:1.5px solid rgba(46,125,50,.2)">
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem">
          <span style="font-size:1.6rem">🛠️</span>
          <h3 style="margin:0">Yönetici Paneli</h3>
          <span class="chip" style="background:${app._isAdmin()?'var(--teal-d)':'var(--blue)'};color:#fff;font-size:.65rem">${app._isAdmin()?'👑 Yönetici':'✍️ İçerik Üretici'}</span>
        </div>
        <p style="font-size:var(--t-sm);line-height:1.5">Tüm içerikleri tek yerden görün, düzenleyin veya yenisini ekleyin. Değişiklikler bu cihazın hafızasında saklanır.</p>
      </div>

      <!-- Sekmeler -->
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.85rem">
        ${TABS.map(t => `
          <button class="btn ${tab===t.id?'btn-primary':'btn-soft'} btn-sm"
            onclick="App._adminSetTab('${t.id}')"
            style="font-size:var(--t-sm);font-weight:700">
            ${t.icon} ${t.ad} <span style="opacity:.7;margin-left:.25rem">${counts[t.id]}</span>
          </button>
        `).join('')}
      </div>

      <!-- Arama + Yeni Ekle -->
      <div style="display:flex;gap:.5rem;margin-bottom:.85rem">
        <div style="flex:1;position:relative">
          <input type="search" placeholder="Bu listede ara..." value="${app._eesc(search)}"
            oninput="App._adminSearchSet(this.value)"
            style="width:100%;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);padding:.65rem .85rem .65rem 2.2rem;font-size:var(--t-md);color:var(--text);outline:none;font-family:inherit">
          <span style="position:absolute;left:.7rem;top:50%;transform:translateY(-50%);color:var(--muted);font-size:1rem">🔍</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="App._adminAdd('${tab}')" style="white-space:nowrap;font-weight:800">
          ${TABS.find(t=>t.id===tab)?.addLabel || '+ Yeni'}
        </button>
      </div>

      <!-- Liste -->
      <div id="admin-list" style="display:flex;flex-direction:column;gap:.5rem">
        ${AdminPanelView._renderList(app, tab, search)}
      </div>

      <!-- Reset alanı -->
      ${app._isAdmin() ? `
        <div style="margin-top:1.4rem;padding-top:1rem;border-top:1px solid var(--border)">
          <p style="font-size:var(--t-sm);color:var(--muted);margin-bottom:.5rem">Sıfırlama:</p>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" onclick="App._adminResetTab('${tab}')" style="font-size:var(--t-xs)">↺ Bu listeyi varsayılana döndür</button>
            <button class="btn btn-ghost btn-sm" onclick="App._adminResetAll()" style="font-size:var(--t-xs);color:var(--danger)">⚠️ Tüm içerik düzenlemelerini sıfırla</button>
          </div>
        </div>
      ` : ''}
    `;
  }

  static _counts(app){
    return {
      activities: app._repo._data.length,
      learn: (app._learnModules || []).length,
      books: (app._bookLibrary || []).length,
      stories: (app._stories || []).length,
      mt: (app._sayiSohbetiKartlari || []).length,
    };
  }

  static _renderList(app, tab, search){
    const items = AdminPanelView._items(app, tab);
    const q = (search || '').toLowerCase().trim();
    const filtered = q
      ? items.filter(i => JSON.stringify(i).toLowerCase().includes(q))
      : items;
    if(!filtered.length){
      return `<div class="card"><div class="card-body" style="text-align:center;padding:1.2rem;color:var(--muted)">
        ${q ? 'Eşleşen kayıt yok.' : 'Bu listede henüz içerik yok. Yukarıdan ekleyebilirsiniz.'}
      </div></div>`;
    }
    return filtered.map((it, idx) => AdminPanelView._row(app, tab, it, idx)).join('');
  }

  static _items(app, tab){
    if(tab === 'activities') return app._repo._data;
    if(tab === 'learn')      return app._learnModules || [];
    if(tab === 'books')      return app._bookLibrary || [];
    if(tab === 'stories')    return app._stories || [];
    if(tab === 'mt')         return app._sayiSohbetiKartlari || [];
    return [];
  }

  static _row(app, tab, it, idx){
    const id = it.id != null ? it.id : String(idx);
    const editType = ({ activities:'activity', learn:'lm', books:'book', stories:'story', mt:'mt' })[tab];
    const title = AdminPanelView._title(tab, it);
    const sub   = AdminPanelView._sub(tab, it);
    const emoji = it.emoji || '📄';
    return `
      <div class="card card-sm">
        <div class="card-body" style="display:flex;align-items:center;gap:.7rem;padding:.7rem .85rem">
          <span style="font-size:1.6rem;flex-shrink:0">${emoji}</span>
          <div style="flex:1;min-width:0">
            <strong style="font-size:var(--t-md);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${app._eesc(title)}</strong>
            ${sub ? `<p class="muted" style="font-size:var(--t-xs);margin-top:.15rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${app._eesc(sub)}</p>` : ''}
          </div>
          <div style="display:flex;gap:.3rem;flex-shrink:0">
            <button class="btn btn-soft btn-sm" style="padding:.35rem .6rem;font-size:var(--t-xs)" onclick="App._inlineEdit('${editType}','${id}')">✏️</button>
            ${app._isAdmin() ? `<button class="btn btn-soft btn-sm" style="padding:.35rem .6rem;font-size:var(--t-xs);color:var(--danger)" onclick="App._adminDelete('${tab}','${id}')">🗑</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  static _title(tab, it){
    if(tab === 'mt')      return it.prompt || it.context || '(boş kart)';
    if(tab === 'stories') return it.label || it.family || '(başlıksız hikaye)';
    return it.title || '(başlıksız)';
  }

  static _sub(tab, it){
    if(tab === 'activities') return it.desc;
    if(tab === 'learn')      return it.sub;
    if(tab === 'books')      return it.author;
    if(tab === 'stories')    return it.lesson || it.family;
    if(tab === 'mt')         return it.context;
    return '';
  }
}
