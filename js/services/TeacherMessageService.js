/* ABMATO — TeacherMessageService */

class TeacherMessageService {
  constructor(storage){ this._s = storage }

  getMessages(){ return this._s.get('teacher_msgs', []) }

  addMessage(text, isTeacher=false){
    const msgs = this.getMessages();
    const msg = { id: crypto.randomUUID(), text, isTeacher, date: new Date().toISOString() };
    this._s.set('teacher_msgs', [...msgs, msg]);
    return msg;
  }

  getWeeklyNote(){ return this._s.get('teacher_note', null) }

  setWeeklyNote(note){
    const n = { text:note, date: new Date().toISOString() };
    this._s.set('teacher_note', n);
    return n;
  }

  getSubjectProgress(){ return this._s.get('subject_progress', this._defaultProgress()) }

  _defaultProgress(){
    return [
      { subject:'Sayma ve Doğal Sayılar', pct:65 },
      { subject:'Toplama ve Çıkarma',     pct:50 },
      { subject:'Geometrik Şekiller',     pct:40 },
      { subject:'Ölçme',                  pct:30 },
      { subject:'Problem Çözme',          pct:20 },
    ];
  }
}

export { TeacherMessageService };
