/* ABMAT — localStorage sarmalayıcı servisi */

class StorageService {
  constructor(ns='matevde_v2'){ this._ns=ns }
  _k(k){ return `${this._ns}:${k}` }
  set(k,v){ try{ localStorage.setItem(this._k(k),JSON.stringify(v));return true }catch{return false} }
  get(k,fb=null){ try{ const r=localStorage.getItem(this._k(k));return r!==null?JSON.parse(r):fb }catch{return fb} }
  remove(k){ localStorage.removeItem(this._k(k)) }
  clear(){ Object.keys(localStorage).filter(k=>k.startsWith(this._ns+':')).forEach(k=>localStorage.removeItem(k)) }
}

export { StorageService };
