/**
 * RemoteAuthService — Diskalkuli Derneği merkezî auth client.
 *
 * Endpoint: https://diskalkulidernegi.org/auth/
 *
 * Üye listesi sunucu tarafında JSON'da; biz şifre tanımlıyoruz.
 * Token localStorage'da; PWA çevrimdışıyken expires-at'a göre yerel doğrulama.
 */

const AUTH_BASE   = 'https://diskalkulidernegi.org/auth/';
const STORAGE_KEY = 'abmato_auth_v1';

export class RemoteAuthService {
  constructor() {
    this.endpoint = AUTH_BASE;
  }

  // ── HTTP helpers ─────────────────────────────────────────────

  async _post(payload, { signal } = {}) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    let data = null;
    try { data = await res.json(); } catch { /* boş cevap */ }
    return { status: res.status, data: data || {} };
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Sunucuya login isteği at. Başarılıysa token'ı sakla.
   * @returns {Promise<{ok:boolean, name?:string, username?:string, expiresAt?:number, reason?:string, message?:string}>}
   */
  async login(username, password) {
    if (!username || !password) {
      return { ok: false, reason: 'missing_credentials' };
    }
    let resp;
    try {
      resp = await this._post({ action: 'login', username: String(username).trim(), password: String(password) });
    } catch (e) {
      return { ok: false, reason: 'network_error', message: 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.' };
    }
    const { status, data } = resp;
    if (data.ok) {
      this._save({
        token: data.token,
        name: data.name || username,
        username: data.username || username,
        expiresAt: data.expiresAt,
        savedAt: Math.floor(Date.now() / 1000),
      });
      return { ok: true, name: data.name, username: data.username, expiresAt: data.expiresAt };
    }
    if (status === 429) {
      return { ok: false, reason: 'locked', message: data.message || 'Çok fazla başarısız deneme. Bir süre sonra tekrar deneyin.' };
    }
    if (status === 401) {
      return { ok: false, reason: 'invalid_credentials', message: 'Kullanıcı adı veya şifre hatalı.' };
    }
    return { ok: false, reason: data.error || 'unknown', message: 'Giriş başarısız.' };
  }

  /**
   * Kayıtlı token varsa, hâlâ geçerli mi sunucudan doğrula.
   * Çevrimdışıyken yerel expiresAt'a göre tolere et.
   * @returns {Promise<null | {token, name, username, expiresAt}>}
   */
  async verifyStored() {
    const stored = this._load();
    if (!stored?.token) return null;

    // Yerel olarak süresi geçtiyse hemen at
    if (stored.expiresAt && stored.expiresAt * 1000 < Date.now()) {
      this.clear();
      return null;
    }

    // Çevrimiçi doğrulama (best-effort, ağ olmazsa local'e güven)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const { status, data } = await this._post(
        { action: 'verify', token: stored.token },
        { signal: ctrl.signal }
      );
      clearTimeout(timer);

      if (data.ok) {
        const fresh = {
          ...stored,
          name: data.name || stored.name,
          username: data.username || stored.username,
          expiresAt: data.expiresAt || stored.expiresAt,
        };
        this._save(fresh);
        return fresh;
      }
      // Sunucu açıkça "geçersiz" dediyse temizle
      if (status === 401) {
        this.clear();
        return null;
      }
      // Diğer durumlarda local geçerlilik süresine güven
      return stored;
    } catch (e) {
      // Çevrimdışı veya zaman aşımı — local expires-at'a göre tolere et
      return stored;
    }
  }

  /**
   * Token'ı sunucuda da iptal et, yerel temizle.
   */
  async logout() {
    const stored = this._load();
    if (stored?.token) {
      try {
        await this._post({ action: 'logout', token: stored.token });
      } catch { /* sessizce yut */ }
    }
    this.clear();
  }

  /**
   * Senkron: yerel olarak depolanan ve süresi geçmemiş oturumu döndür.
   */
  current() {
    const stored = this._load();
    if (!stored?.token) return null;
    if (stored.expiresAt && stored.expiresAt * 1000 < Date.now()) {
      this.clear();
      return null;
    }
    return stored;
  }

  // ── Storage ──────────────────────────────────────────────────

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota / private mode */ }
  }

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }
}
