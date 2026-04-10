/* ABMAT — NotificationService */

class NotificationService {
  constructor(storage){ this._s=storage }

  getAll(){ return this._s.get('notifications', this._defaults()) }

  addNotif(notif){
    const all = this.getAll();
    const n = { id:crypto.randomUUID(), ...notif, date:new Date().toISOString(), read:false };
    this._s.set('notifications', [n, ...all]);
    return n;
  }

  markRead(id){
    const all = this.getAll().map(n=> n.id===id ? {...n,read:true} : n);
    this._s.set('notifications', all);
  }

  markAllRead(){
    const all = this.getAll().map(n=>({...n,read:true}));
    this._s.set('notifications', all);
  }

  unreadCount(){ return this.getAll().filter(n=>!n.read).length }

  _defaults(){
    return [
      { id:'n1', emoji:'📚', title:'Haftalık İpucu', text:'Bu hafta "Mutfakta Sayıyoruz" etkinliğini denediniz mi?', date:new Date(Date.now()-3600000).toISOString(), read:false },
      { id:'n2', emoji:'🎉', title:'Harika Başlangıç!', text:'ABMAT\'a hoş geldiniz. İlk etkinliğinizi yapın ve rozetinizi kazanın!', date:new Date(Date.now()-86400000).toISOString(), read:false },
    ];
  }
}

export { NotificationService };
