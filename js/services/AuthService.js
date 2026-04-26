/* ══════════════════════════════════════════════════════════
   ABMAT — AuthService
   Profesyonel kimlik doğrulama altyapısı:

   • Şifre hash: PBKDF2-SHA256, 100k iter, 16 byte salt, 32 byte key
   • Format: "pbkdf2$<iter>$<saltB64>$<hashB64>"
   • Sabit-zaman karşılaştırma
   • Brute-force koruması: kullanıcı bazlı sayaç + üstel kilitleme
   • Oturum tokeni: 32 byte rastgele + sona erme (default 7g, hatırla 30g)
   • Şifre güçlülük skorlaması (0-4)
   • E-posta / kullanıcı adı format ve benzersizlik doğrulama
   • Legacy hash (eski h*31 yöntemi) → PBKDF2 otomatik göç

   Storage: ns altında 'auth:users' anahtarı.
══════════════════════════════════════════════════════════ */

const KEY_USERS   = 'auth:users';
const KEY_SESSION = 'auth:session';
const KEY_LEGACY  = 'abmat_users';     // mevcut sistem
const PBKDF2_ITER = 100_000;
const SALT_BYTES  = 16;
const KEY_BYTES   = 32;
const ALGO        = 'SHA-256';

/* ─── Yardımcılar ──────────────────────────────────────── */
function _b64(buf){
  let s = '';
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  for(let i=0; i<bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function _b64decode(b){
  const s = atob(b);
  const out = new Uint8Array(s.length);
  for(let i=0; i<s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
function _randomBytes(n){ return crypto.getRandomValues(new Uint8Array(n)); }
function _ts(){ return new Date().toISOString(); }
function _now(){ return Date.now(); }

/* Sabit-zaman karşılaştırma — timing attack savunması */
function _constantTimeEq(a, b){
  if(a.length !== b.length) return false;
  let r = 0;
  for(let i=0; i<a.length; i++) r |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  return r === 0;
}

/* Yasaklı / zayıf şifre listesi (kısa) */
const COMMON_PASSWORDS = new Set([
  '123456','password','12345678','qwerty','abc123','111111','123123','admin',
  'password1','letmein','welcome','sifre','123456789','1234567','sifre123',
  'parola','user','test','demo','000000','iloveyou','dragon','sunshine'
]);

class AuthService {
  constructor(storage){
    this._s = storage;
    // İlk init: legacy göç
    this._migrateLegacyOnce();
  }

  /* ════════════════ ŞİFRE — PBKDF2 ═══════════════════ */
  async hash(password){
    if(!password || password.length < 1) throw new Error('Boş şifre');
    const salt = _randomBytes(SALT_BYTES);
    const key  = await this._deriveKey(password, salt, PBKDF2_ITER);
    return `pbkdf2$${PBKDF2_ITER}$${_b64(salt)}$${_b64(key)}`;
  }

  async verify(password, stored){
    if(!stored || !password) return false;
    // Legacy hash (eski h*31)?
    if(!stored.startsWith('pbkdf2$')){
      return this._verifyLegacy(password, stored);
    }
    const parts = stored.split('$');
    if(parts.length !== 4) return false;
    const iter = parseInt(parts[1], 10);
    const salt = _b64decode(parts[2]);
    const expected = parts[3];
    const key = await this._deriveKey(password, salt, iter);
    return _constantTimeEq(_b64(key), expected);
  }

  async _deriveKey(password, salt, iterations){
    const enc = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey('raw', enc, { name: 'PBKDF2' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: ALGO },
      baseKey, KEY_BYTES * 8
    );
    return new Uint8Array(bits);
  }

  /* Legacy h*31 hash (sadece okuma — yeni şifrelerde kullanılmaz) */
  _verifyLegacy(password, storedHash){
    let h = 0;
    for(let i=0; i<password.length; i++) h = (h * 31 + password.charCodeAt(i)) >>> 0;
    return h.toString(36) === storedHash;
  }

  /* ════════════════ ŞİFRE GÜÇLÜLÜĞÜ ═══════════════════ */
  /**
   * @returns {{score: 0-4, label, color, issues: string[], suggestions: string[]}}
   */
  scorePassword(pw){
    pw = String(pw || '');
    const issues = [];
    const suggestions = [];
    let score = 0;
    if(!pw){ return { score: 0, label: 'Boş', color: '#999', issues: ['Şifre girin'], suggestions: [] }; }
    // Temel uzunluk
    if(pw.length < 8){ issues.push('En az 8 karakter olmalı'); }
    else { score++; }
    if(pw.length >= 12) score++;
    // Karakter çeşitliliği
    const hasLower = /[a-zçğıöşü]/.test(pw);
    const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSym   = /[^A-Za-zçğıöşüÇĞİÖŞÜ0-9]/.test(pw);
    const classes = [hasLower, hasUpper, hasDigit, hasSym].filter(Boolean).length;
    if(classes >= 3) score++;
    if(classes === 4) score++;
    if(!hasUpper && !hasLower) suggestions.push('Harf ekleyin');
    if(!hasDigit) suggestions.push('Rakam ekleyin');
    if(!hasSym && pw.length < 14) suggestions.push('Özel karakter veya uzunluk ekleyin');
    // Yaygın şifre kontrolü
    if(COMMON_PASSWORDS.has(pw.toLowerCase())){
      issues.push('Yaygın olarak kullanılan şifre');
      score = 0;
    }
    // Tekrarlı pattern (aaaaa, 12345, qwerty)
    if(/^(.)\1+$/.test(pw)){ issues.push('Tekrarlı karakter'); score = Math.min(score, 1); }
    if(/^(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(pw)){
      issues.push('Tahmin edilebilir dizi'); score = Math.min(score, 1);
    }
    score = Math.max(0, Math.min(4, score));
    const meta = [
      { label: 'Çok Zayıf', color: '#DC2626' },
      { label: 'Zayıf',     color: '#EA580C' },
      { label: 'Orta',      color: '#D97706' },
      { label: 'Güçlü',     color: '#2E7D32' },
      { label: 'Çok Güçlü', color: '#1B5E20' },
    ][score];
    return { score, label: meta.label, color: meta.color, issues, suggestions };
  }

  isPasswordOk(pw){
    const r = this.scorePassword(pw);
    return r.score >= 2 && r.issues.length === 0;
  }

  /* ════════════════ KULLANICI VERİSİ ═══════════════════ */
  getUsers(){ return this._s.get(KEY_USERS, []); }
  _setUsers(list){ this._s.set(KEY_USERS, list); }

  findByIdentifier(identifier){
    if(!identifier) return null;
    const id = String(identifier).trim().toLowerCase();
    return this.getUsers().find(u => u.username === id || (u.email && u.email.toLowerCase() === id)) || null;
  }
  findByUsername(username){
    if(!username) return null;
    const u = String(username).trim().toLowerCase();
    return this.getUsers().find(x => x.username === u) || null;
  }
  findByEmail(email){
    if(!email) return null;
    const e = String(email).trim().toLowerCase();
    return this.getUsers().find(x => x.email && x.email.toLowerCase() === e) || null;
  }
  findById(id){
    return this.getUsers().find(x => x.id === id) || null;
  }

  /* ════════════════ DOĞRULAMA ═══════════════════ */
  isValidEmail(s){
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  }
  isValidUsername(s){
    return /^[a-z0-9_]{3,30}$/.test(String(s || '').trim());
  }
  /** Türkçe büyük→küçük dahil normalize */
  normalizeUsername(s){
    return String(s || '').trim()
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /* ════════════════ KAYIT ═══════════════════ */
  async createUser({ name, username, email, password, role = 'editor', active = true }){
    const errors = [];
    if(!name || name.trim().length < 2) errors.push('Ad en az 2 karakter olmalı');
    const u = this.normalizeUsername(username || '');
    if(!this.isValidUsername(u)) errors.push('Kullanıcı adı 3-30 karakter, sadece harf/rakam/_ olmalı');
    if(this.findByUsername(u)) errors.push('Bu kullanıcı adı kullanılıyor');
    if(email && !this.isValidEmail(email)) errors.push('Geçersiz e-posta');
    if(email && this.findByEmail(email)) errors.push('Bu e-posta kullanılıyor');
    if(!password || password.length < 8) errors.push('Şifre en az 8 karakter olmalı');
    const sc = this.scorePassword(password);
    if(sc.score < 2) errors.push(`Şifre çok zayıf (${sc.label}) — ${sc.suggestions.join(', ') || 'iyileştirin'}`);
    if(errors.length) throw new Error(errors.join(' · '));

    const passwordHash = await this.hash(password);
    const user = {
      id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      username: u,
      email: email ? email.trim().toLowerCase() : '',
      role,
      active: !!active,
      createdAt: _ts(),
      updatedAt: _ts(),
      lastLoginAt: null,
      failedAttempts: 0,
      lockedUntil: null,
      password: passwordHash,
    };
    const users = this.getUsers();
    users.push(user);
    this._setUsers(users);
    return user;
  }

  /* ════════════════ GİRİŞ — Rate-limited ═══════════════════ */
  /**
   * @returns Promise<{ok:true, user, session} | {ok:false, reason, retryAfterSec?, attemptsLeft?}>
   */
  async login(identifier, password, { remember = false } = {}){
    const user = this.findByIdentifier(identifier);
    if(!user) return { ok: false, reason: 'not_found' };
    if(!user.active) return { ok: false, reason: 'disabled' };

    // Kilit kontrolü
    if(user.lockedUntil && _now() < new Date(user.lockedUntil).getTime()){
      const sec = Math.ceil((new Date(user.lockedUntil).getTime() - _now()) / 1000);
      return { ok: false, reason: 'locked', retryAfterSec: sec };
    }

    // Şifre kontrolü
    const ok = await this.verify(password, user.password);
    if(!ok){
      this._recordFail(user.id);
      const fresh = this.findById(user.id);
      const left = Math.max(0, 5 - (fresh.failedAttempts % 5));
      return { ok: false, reason: 'bad_password', attemptsLeft: left };
    }

    // Başarı — sayacı sıfırla, gerekirse legacy hash'i göç ettir
    if(!user.password.startsWith('pbkdf2$')){
      try { user.password = await this.hash(password); } catch {}
    }
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = _ts();
    user.updatedAt = _ts();
    this._upsertUser(user);

    const session = this._createSession(user.id, remember);
    return { ok: true, user, session };
  }

  _recordFail(userId){
    const users = this.getUsers();
    const u = users.find(x => x.id === userId);
    if(!u) return;
    u.failedAttempts = (u.failedAttempts || 0) + 1;
    // Üstel kilit: 5/10/15 yanlış
    if(u.failedAttempts >= 15)      u.lockedUntil = new Date(_now() + 30 * 60_000).toISOString();
    else if(u.failedAttempts >= 10) u.lockedUntil = new Date(_now() + 5 * 60_000).toISOString();
    else if(u.failedAttempts >= 5)  u.lockedUntil = new Date(_now() + 30_000).toISOString();
    u.updatedAt = _ts();
    this._setUsers(users);
  }

  _upsertUser(user){
    const users = this.getUsers();
    const i = users.findIndex(x => x.id === user.id);
    if(i >= 0) users[i] = user; else users.push(user);
    this._setUsers(users);
  }

  /* ════════════════ ŞİFRE DEĞİŞTİR ═══════════════════ */
  async changePassword(userId, currentPassword, newPassword){
    const user = this.findById(userId);
    if(!user) throw new Error('Kullanıcı bulunamadı');
    const ok = await this.verify(currentPassword, user.password);
    if(!ok) throw new Error('Mevcut şifre yanlış');
    const sc = this.scorePassword(newPassword);
    if(sc.score < 2) throw new Error(`Yeni şifre çok zayıf (${sc.label})`);
    if(newPassword.length < 8) throw new Error('Yeni şifre en az 8 karakter olmalı');
    user.password = await this.hash(newPassword);
    user.updatedAt = _ts();
    this._upsertUser(user);
    return true;
  }

  /** Admin tarafından sıfırlama (mevcut şifre gerektirmez) */
  async adminResetPassword(userId, newPassword){
    const user = this.findById(userId);
    if(!user) throw new Error('Kullanıcı bulunamadı');
    const sc = this.scorePassword(newPassword);
    if(sc.score < 2) throw new Error(`Şifre çok zayıf (${sc.label})`);
    user.password = await this.hash(newPassword);
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = _ts();
    this._upsertUser(user);
    return true;
  }

  /* ════════════════ KULLANICI YÖNETİMİ ═══════════════════ */
  updateUser(userId, patch){
    const user = this.findById(userId);
    if(!user) throw new Error('Kullanıcı bulunamadı');
    if(patch.username){
      const u = this.normalizeUsername(patch.username);
      if(!this.isValidUsername(u)) throw new Error('Geçersiz kullanıcı adı');
      const ex = this.findByUsername(u);
      if(ex && ex.id !== userId) throw new Error('Bu kullanıcı adı alınmış');
      user.username = u;
    }
    if(patch.email !== undefined){
      if(patch.email && !this.isValidEmail(patch.email)) throw new Error('Geçersiz e-posta');
      if(patch.email){
        const ex = this.findByEmail(patch.email);
        if(ex && ex.id !== userId) throw new Error('Bu e-posta kullanılıyor');
      }
      user.email = patch.email ? String(patch.email).trim().toLowerCase() : '';
    }
    if(patch.name) user.name = String(patch.name).trim();
    if(patch.role) user.role = patch.role;
    if(typeof patch.active === 'boolean') user.active = patch.active;
    user.updatedAt = _ts();
    this._upsertUser(user);
    return user;
  }

  deleteUser(userId){
    const users = this.getUsers().filter(u => u.id !== userId);
    this._setUsers(users);
    // Bu kullanıcının session'u varsa temizle
    const sess = this.session();
    if(sess && sess.userId === userId) this.logout();
  }

  unlockUser(userId){
    const user = this.findById(userId);
    if(!user) return false;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = _ts();
    this._upsertUser(user);
    return true;
  }

  /* ════════════════ İLK KURULUM ═══════════════════ */
  /** Aktif (çalışan şifresi olan) admin var mı? Boş hash ya da pasif sayılmaz. */
  hasUsableAdmin(){
    return this.getUsers().some(u =>
      u.role === 'admin' && u.active && u.password && u.username !== 'yonetici'
    );
  }
  /** Liste tamamen boşsa veya yalnızca legacy "yonetici" var ise true. */
  needsFirstAdmin(){
    const users = this.getUsers();
    if(users.length === 0) return true;
    return !this.hasUsableAdmin();
  }
  /** İlk admin kurulumu — sadece henüz kullanılabilir admin yoksa çalışır. */
  async setupFirstAdmin({ name, username, email, password }){
    if(this.hasUsableAdmin()){
      throw new Error('Zaten bir yönetici hesabı var');
    }
    const u = await this.createUser({ name, username, email, password, role: 'admin', active: true });
    return u;
  }

  /* ════════════════ OTURUM ═══════════════════ */
  _createSession(userId, remember){
    const days = remember ? 30 : 7;
    const token = _b64(_randomBytes(24));
    const session = {
      token,
      userId,
      createdAt: _ts(),
      expiresAt: new Date(_now() + days * 24 * 3600_000).toISOString(),
      remember: !!remember,
    };
    this._s.set(KEY_SESSION, session);
    return session;
  }
  session(){
    const s = this._s.get(KEY_SESSION);
    if(!s) return null;
    if(s.expiresAt && _now() > new Date(s.expiresAt).getTime()){
      this._s.remove(KEY_SESSION);
      return null;
    }
    return s;
  }
  currentUser(){
    const s = this.session();
    if(!s) return null;
    return this.findById(s.userId);
  }
  logout(){ this._s.remove(KEY_SESSION); }

  /* ════════════════ LEGACY GÖÇÜ ═══════════════════ */
  _migrateLegacyOnce(){
    if(this.getUsers().length > 0) return; // zaten yeni format var
    let raw;
    try { raw = JSON.parse(localStorage.getItem(KEY_LEGACY) || 'null'); } catch { raw = null; }
    if(!Array.isArray(raw) || !raw.length) return;
    const migrated = raw.map(u => ({
      id: u.id || ('u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      name: u.name || 'Kullanıcı',
      username: this.normalizeUsername(u.username || ''),
      email: u.email ? String(u.email).toLowerCase() : '',
      role: u.role || 'editor',
      active: u.active !== false,
      createdAt: u.createdAt || _ts(),
      updatedAt: _ts(),
      lastLoginAt: null,
      failedAttempts: 0,
      lockedUntil: null,
      // Legacy hash — bir sonraki başarılı login'de PBKDF2'ye göç edecek
      password: u.pwdHash || '',
    }));
    this._setUsers(migrated);
    // Legacy anahtarı SİLMİYORUZ — geri rollback için
  }
}

export { AuthService };
