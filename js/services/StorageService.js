/* ABMAT — localStorage sarmalayıcı servisi */

class StorageService {
  constructor(ns='matevde_v2'){ this._ns=ns }
  _k(k){ return `${this._ns}:${k}` }
  set(k,v){ try{ localStorage.setItem(this._k(k),JSON.stringify(v));return true }catch{return false} }
  get(k,fb=null){ try{ const r=localStorage.getItem(this._k(k));return r!==null?JSON.parse(r):fb }catch{return fb} }
  remove(k){ localStorage.removeItem(this._k(k)) }
  clear(){ Object.keys(localStorage).filter(k=>k.startsWith(this._ns+':')).forEach(k=>localStorage.removeItem(k)) }

  /**
   * Namespace altındaki TÜM anahtar-değer çiftlerini düz obje olarak döndürür.
   * Obje JSON.stringify ile bir dosyaya yazılabilir.
   */
  exportAll(){
    const out = {};
    const prefix = this._ns + ':';
    for(let i=0; i<localStorage.length; i++){
      const fullKey = localStorage.key(i);
      if(!fullKey || !fullKey.startsWith(prefix)) continue;
      const shortKey = fullKey.slice(prefix.length);
      try{ out[shortKey] = JSON.parse(localStorage.getItem(fullKey)); }
      catch{ out[shortKey] = localStorage.getItem(fullKey); }
    }
    return {
      _format: 'abmat-backup',
      _version: 1,
      _ns: this._ns,
      _exportedAt: new Date().toISOString(),
      data: out,
    };
  }

  /**
   * exportAll() formatındaki nesneyi alıp namespace'i sıfırlayıp yeniden yazar.
   * Format doğrulaması: _format === 'abmat-backup' ve data obje olmalı.
   * replace=true → önce mevcut namespace temizlenir (varsayılan).
   * replace=false → merge: mevcut anahtarlar üzerine yazılır, diğerleri kalır.
   */
  importAll(payload, { replace = true } = {}){
    if(!payload || typeof payload !== 'object') throw new Error('Geçersiz yedek: obje değil');
    if(payload._format !== 'abmat-backup') throw new Error('Geçersiz yedek: format imzası yok');
    if(!payload.data || typeof payload.data !== 'object') throw new Error('Geçersiz yedek: data alanı yok');
    if(replace) this.clear();
    let written = 0;
    for(const [k, v] of Object.entries(payload.data)){
      if(this.set(k, v)) written++;
    }
    return { written };
  }
}

export { StorageService };
