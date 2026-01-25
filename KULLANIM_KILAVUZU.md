# THEON POS: AKILLI İŞLETME YÖNETİM SİSTEMİ
## Kullanım Kılavuzu & İşletme Rehberi

Bu kılavuz, **Theon POS** sisteminin tüm yeteneklerini ve bu yeteneklerin işletmenize sağlayacağı verimliliği maksimize etmek için hazırlanmıştır. Sistemimiz sadece bir kasa programı değil, mutfaktan masaya, kasanızdan analiz raporlarınıza kadar tüm operasyonunuzu birbirine bağlayan akıllı bir ekosistemdir.

---

## 1. Neden Theon POS? (İşletmenize Faydaları)

Theon POS, modern restoran ve kafe işletmeciliğinin ihtiyaç duyduğu 3 temel sütun üzerine inşa edilmiştir:

*   **Sıfır Hata:** Garsonun masada aldığı sipariş, aynı saniyede mutfaktaki şefin önündeki ekrana düşer. El yazısı hataları veya sözlü yanlış anlamalar tarih olur.
*   **Maksimum Hız:** QR Menü sayesinde müşteri garson beklemeden siparişini verebilir, mutfak personeli tek tuşla garsona "sipariş hazır" bildirimi gönderebilir.
*   **Veriye Dayalı Büyüme:** Hangi ürünün ne kadar kazandırdığını, en yoğun saatinizde kaç personel gerektiğini tahmin eden "God Mode" analizleri ile stratejik kararlar alırsınız.

---

## 2. Sistemin Temel Bileşenleri

Sistemimiz dört ana panelden oluşur ve hepsi gerçek zamanlı (Real-time) olarak birbiriyle konuşur:

### A. Yönetici Paneli (Dashboard & God Mode)
İşletmenizin kontrol merkezidir. Satışları naklen izleyebilir, ürünlerinizi güncelleyebilir ve derinlemesine cirosal analizler yapabilirsiniz.
*   **God Mode:** Kara temaslı özel arayüzü ile yapay zeka destekli "Kâr Artırma Taktikleri" sunar. (Örn: "En yoğun saatiniz 20:00, personel sayısını artırın.")

### B. POS Terminali (Kasa Ekranı)
Kasada duran yetkilinin her şeye hâkim olduğu ekrandır. Tüm masaların doluluk oranı, bekleyen onaylar ve ödeme işlemleri buradan yönetilir.

### C. Garson Paneli (Mobil Sipariş)
Garsonlarınızın herhangi bir tablet veya telefondan eriştiği, masada sipariş alıp anında mutfağa geçtiği hızlı arabirimdir.

### D. Mutfak Paneli (Üretim Takibi)
Aşçıların önündeki dijital sipariş fişidir. Hazırlanan siparişler tek dokunuşla "Hazır" olarak işaretlenir.

---

## 3. YENİ: Akıllı Bildirim Sistemi (Personel Haberleşmesi)

Theon POS, artık kendi içinde bir haberleşme ağına sahiptir. Tüm panellerin sağ üstünde bulunan **Zil (Bildirim)** ikonu, işletme içi koordinasyonu sağlar.

### Zil Sesi (Zil.mp3)
Sistemdeki her kritik işlemde (yeni sipariş, masa çağrısı vb.) özel bir **Zil Sesi** çalar. Bu sayede personel sürekli ekrana bakmak zorunda kalmaz, sesi duyduğunda işlem yapar.

### Kişi Çağırma Özelliği
1. Herhangi bir panelden sağ üstteki zil simgesine tıklayın.
2. **"Kişiler"** sekmesine gidin.
3. İşletmedeki herhangi bir personelin ismine tıklayın.
4. O personelin ekranında anında sesli bir uyarı ve **"X sizi çağırıyor"** bildirimi görünecektir. 
   *(Örn: Kasa, mutfağa "şefim bir bakar mısın" demek yerine tek tıkla çağrı atabilir.)*

### Bildirim Yönetimi
Gelen bildirimler **"Tamamlandı"** olarak işaretlenene kadar listede kalır. **"Ertele"** seçeneği ile bildirimi listede tutup modal penceresini kapatabilirsiniz.

---

## 4. Akıllı QR Menü & Garson Çağırma

Müşterileriniz masadaki QR kodu okuttuğunda karşılarına çıkan dijital menüden şunları yapabilirler:

*   **Garson Çağır Butonu:** Müşteri menünün en üstündeki **"Garson Çağır"** butonuna bastığında; işletmedeki tüm garsonların ve kasanın paneline anında bir **Zil Sesu** uyarısı gider: *"MASA X GARSON BEKLİYOR."*
*   **Dijital Sipariş:** Müşteri kendi siparişini sepete ekleyip onayladığında, bu sipariş POS ekranına "Onay Bekliyor" olarak düşer. Onaylandığı an mutfağa iletilir.

---

## 5. Operasyonel İş Akışı (Örnek Senaryo)

1.  **Müşteri Gelir:** Masadaki QR kodu okutur.
2.  **Hızlı Hazırlık:** Müşteri kararsız kalırsa QR menüdeki **"Garson Çağır"**a basar. Garsonun cebine sesli bildirim gider.
3.  **Sipariş:** Garson mobil panelinden veya müşteri QR menüden siparişi verir.
4.  **Üretim:** Mutfak panelindeki fiş anında yanıp sönmeye başlar ve sesli uyarı çalar. Şef siparişi hazırlar.
5.  **Servis:** Şef mutfak ekranında "Hazır" butonuna basar. Garsona ve kasaya "Sipariş Hazır" bildirimi ve **Zil Sesi** gider.
6.  **Ödeme:** Müşteri kasaya gelir, kasiyer POS ekranından ilgili masayı seçer ve "Hesabı Kapat" diyerek işlemi bitirir. Tüm veriler anında "Raporlar" kısmına yazılır.

---

## 6. Kurulum ve Ayarlar

### Şube ve Masa Ayarları
`Sol Menü > Şubeler` kısmından yeni şube ekleyebilir veya mevcut şubenin masa sayısını güncelleyebilirsiniz. Masa sayısı güncellendiğinde `Masalar` bölümünde QR kodlar otomatik oluşturulur.

### Ürün ve Kategori Yönetimi
`Sol Menü > Envanter` kısmından ürünlerinizin fiyatlarını güncelleyebilir, yeni fotoğraflar ekleyebilir veya stokta biten ürünleri geçici olarak satışa kapatabilirsiniz.

### Personel Hesapları
`Sol Menü > Kullanıcılar` kısmından her personele uygun rolü tanımlayın:
*   **Admin:** Tam yetki ve analizler.
*   **Kasiyer:** Sadece POS ve Ödeme.
*   **Garson:** Sadece mobil sipariş.
*   **Mutfak:** Sadece üretim ekranı.

---

## 7. Önemli İpuçları & Güvenlik

*   **İlk Tıklama:** Tarayıcıların ses politikası gereği, sayfa açıldığında ekrana en az bir kez tıklanmalıdır. Bu sayede **Zil Sesleri** aktif hale gelir.
*   **Z-Raporu:** Her akşam `Raporlar` bölümünden günün Z-Raporunu alıp sistem dışı kaydedebilirsiniz.
*   **Bağlantı:** Eğer Wi-Fi koparsa sistem sizi uyaracaktır. Sayfayı yenilemek bağlantıyı (Socket.io) tekrar kuracaktır.

---
**Theon POS** ile işletmenizi kağıt kalem karmaşasından kurtarıp, dijital hıza ve veri odaklı kazanca taşıyın. Başarılar dileriz!
