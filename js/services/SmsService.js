/* ABMAT — SmsService */

class SmsService {
  static WEEKLY_TASKS = [
    // SMS görev havuzu — Mutfakta_Matematik.docx ve Evde.docx'ten uyarlandı (20 görev)
    { id:'sms1',  text:'Bu hafta: Çocuğunuzla alışveriş listesi yapın ve toplamı hesaplayın. 🛒', category:'MARKET' },
    { id:'sms2',  text:'Bu hafta: Evinizde 5 tane üçgen bulun ve fotoğraflayın. 🔺', category:'GEOMETRY' },
    { id:'sms3',  text:'Bu hafta: Kahvaltıda takvime bakıp bugünün tarihini sayın. 📅', category:'TIME' },
    { id:'sms4',  text:'Bu hafta: Yemek yaparken ölçü kabı kullanarak ölçün, çocuk tahmin etsin. 🥄', category:'KITCHEN' },
    { id:'sms5',  text:'Bu hafta: Yatmadan önce \"bugün kaç tane... gördün?\" diye sorun. 🌙', category:'NUMBER' },
    { id:'sms6',  text:'Bu hafta: Mutfak tezgahını kaşıkla ölçün — önce tahmin edin! 🍴', category:'KITCHEN' },
    { id:'sms7',  text:'Bu hafta: Marketten gelen fişi birlikte kontrol edin. 🧾', category:'MARKET' },
    { id:'sms8',  text:'Bu hafta: 5-10 dakika boyunca doğada kaç tane kuş/araba/ağaç saydığınızı kaydedin. 🌿', category:'NATURE' },
    { id:'sms9',  text:'Bu hafta: Bir doğum günü veya tatile kaç gün kaldığını birlikte hesaplayın. 🗓️', category:'TIME' },
    { id:'sms10', text:'Bu hafta: 4 kişilik bir tarifi 2 kişiye uyarlayın — çocuk hesaplasın. 🍳', category:'KITCHEN' },
    { id:'sms11', text:'Bu hafta: Çorapları çamaşırdan çıkarken eşleştirin ve sayın. 🧦', category:'NUMBER' },
    { id:'sms12', text:'Bu hafta: İki farklı boy ürünün birim fiyatını birlikte karşılaştırın. 💰', category:'MARKET' },
    { id:'sms13', text:'Bu hafta: Oyun sırasında puan tablosu tutun. 🎲', category:'GAME' },
    { id:'sms14', text:'Bu hafta: Bir tohum veya bitki yüksekliğini cetvel ile ölçün. 📏', category:'NATURE' },
    { id:'sms15', text:'Bu hafta: Yemek pişmeden önce \"kaç dakika sürer?\" diye sorun. ⏱️', category:'KITCHEN' },
    { id:'sms16', text:'Bu hafta: Günlük program yapın — her şeye kaç dakika ayıracağınızı tahmin edin. 📋', category:'TIME' },
    { id:'sms17', text:'Bu hafta: Çocuğunuzla 1-10 arası sayıları bir ritimle sayın — ikişer, üçer deneyin. 🎵', category:'NUMBER' },
    { id:'sms18', text:'Bu hafta: Evdeki bir odayı karış veya adımla ölçün. 🏠', category:'MEASUREMENT' },
    { id:'sms19', text:'Bu hafta: 8 çift kart yapıp sayı hafıza oyunu oynayın. 🎴', category:'GAME' },
    { id:'sms20', text:'Bu hafta: Hava durumunu her gün not edin, hafta sonunda en sıcak günü bulun. 🌤️', category:'NATURE' },
  ];

  getCurrentTask(){
    const weekNum = Math.floor(Date.now()/(7*86400000)) % SmsService.WEEKLY_TASKS.length;
    return SmsService.WEEKLY_TASKS[weekNum];
  }
}

export { SmsService };
