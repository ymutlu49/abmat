/* ══════════════════════════════════════════════════════════
   ABMATO — ContentService
   Yönetici tarafından düzenlenen / eklenen / silinen içerikleri
   localStorage'a kalıcı yazar. Snapshot yaklaşımı:
     • Bir koleksiyon (örn. activities) ilk değiştirildiği anda
       tüm dizinin güncel hâli `content:<type>` anahtarı altında
       kaydedilir.
     • Uygulama açılırken bu snapshot varsa default veriyi
       (activities.js, App constructor'daki diziler) yerine
       geçirir.
     • Kullanıcı sıfırlamak isterse `reset(type)` snapshot'ı siler.

   Desteklenen tipler:
     activities · learn · books · stories · mt
══════════════════════════════════════════════════════════ */

const TYPES = ['activities', 'learn', 'books', 'stories', 'mt'];

class ContentService {
  constructor(storage){ this._s = storage; }

  _key(type){ return 'content:' + type; }

  /** Snapshot var mı? */
  has(type){ return this._s.get(this._key(type)) != null; }

  /** Snapshot'tan diziyi oku (yoksa null) */
  load(type){ return this._s.get(this._key(type)) || null; }

  /** Tam diziyi snapshot olarak kaydet */
  save(type, items){
    if(!Array.isArray(items)) return false;
    return this._s.set(this._key(type), items);
  }

  /** Snapshot'ı sil — bir sonraki yüklemede default veriye dönülür */
  reset(type){ this._s.remove(this._key(type)); }

  /**
   * Default diziye snapshot'ı (varsa) uygula — overlay çağrısı.
   * Snapshot yoksa default değişmez.
   * @returns {Array} kullanılacak dizi
   */
  apply(type, defaults){
    const snap = this.load(type);
    if(snap && Array.isArray(snap)) return snap;
    return defaults;
  }

  /** Yeni item için benzersiz id üret */
  newId(prefix){
    const ts = Date.now().toString(36).slice(-6);
    const r  = Math.random().toString(36).slice(2, 5);
    return `${prefix}_${ts}${r}`;
  }

  /** Tüm tipleri topluca dışa aktar (yedek) */
  exportAll(){
    const out = {};
    TYPES.forEach(t => { out[t] = this.load(t); });
    return out;
  }

  /** Toplu içe aktar (yedekten geri yükleme) */
  importAll(data){
    if(!data || typeof data !== 'object') return false;
    let n = 0;
    TYPES.forEach(t => {
      if(Array.isArray(data[t])){ this.save(t, data[t]); n++; }
    });
    return n;
  }

  /** Tüm yönetici override'larını sıfırla — default'lara dön */
  resetAll(){ TYPES.forEach(t => this.reset(t)); }

  static get TYPES(){ return TYPES; }
}

export { ContentService };
