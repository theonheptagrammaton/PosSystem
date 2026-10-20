# 🚀 Restaurant Master POS - İşletme Sahibi ve Personel Kullanım Kılavuzu

Hoş geldiniz! Bu kılavuz, işletmenizi **Restaurant Master POS** sistemi ile nasıl uçtan uca, verimli ve hatasız bir şekilde yöneteceğinizi öğretmek için hazırlanmıştır.

Bu sadece bir "kasa programı" değil; işletmenizin **dijital beynidir**.

---

## 📖 İçindekiler

1. [Sistem Size Ne Kazandırır?](#1-sistem-size-ne-kazandırır)
2. [Hızlı Başlangıç: İlk Kurulum](#2-hızlı-başlangıç-i̇lk-kurulum)
3. [Personel ve Yetkiler](#3-personel-ve-yetkiler)
4. [Operasyon: Günlük İşleyiş Senaryoları](#4-operasyon-günlük-i̇şleyiş-senaryoları)
    - [Garson: Sipariş Alma](#garson-sipariş-alma)
    - [Müşteri: QR Menü Kullanımı](#müşteri-qr-menü-kullanımı)
    - [Mutfak: Sipariş Hazırlama](#mutfak-sipariş-hazırlama)
    - [Kasa: Ödeme ve Kontrol](#kasa-ödeme-ve-kontrol)
5. [🔔 Bildirim ve İletişim Merkezi](#5--bildirim-ve-i̇letişim-merkezi)
6. [📊 God Mode & Analitik (Patron Ekranı)](#6--god-mode--analitik-patron-ekranı)
7. [Sıkça Sorulan Sorular ve İpuçları](#7-sıkça-sorulan-sorular-ve-i̇puçları)

---

## 1. Sistem Size Ne Kazandırır?

*   **Sıfır Kayıp/Kaçak:** Her sipariş sisteme girer, mutfağa düşer ve ödenmeden kapanmaz. Adisyon kaybolma derdi biter.
*   **Hız:** Garson masadan ayrılmadan siparişi mutfağa iletir. Şef anında görür. Servis süresi %30 hızlanır.
*   **Müşteri Memnuniyeti:** QR menü ile garson beklemeden sipariş verebilir veya tek tuşla garsonu masaya çağırabilirler.
*   **Veri Odaklı Yönetim:** Hangi ürün çok satıyor? Hangi saatler yoğunsunuz? Sistem size "Şu saatte personel sayısını artır" gibi taktikler verir.

---

## 2. Hızlı Başlangıç: İlk Kurulum

Sistemi kullanmaya başlamadan önce dükkanınızın dijital ikizini oluşturmalısınız.

### Adım 1: Şube ve Masa Oluşturma
*   **Yol:** Yönetim Paneli > Şubeler
*   Yeni bir şube açın ve masa sayısını girin (Örn: 20).
*   Sistem otomatik olarak MASA-1'den MASA-20'ye kadar masaları oluşturur ve QR kod linklerini hazırlar.

### Adım 2: Menü Tanımlama
*   **Kategoriler:** Önce grupları oluşturun (Örn: *Başlangıçlar, Ana Yemekler, İçecekler*).
*   **Ürünler:** Her ürünü ilgili kategoriye ekleyin. Fotoğraf, fiyat ve açıklama girin.
*   **Seçenekler (ÇOK ÖNEMLİ):** Ürünlere opsiyon ekleyin. Örneğin "Adana Kebap" için:
    *   *Porsiyon:* 1 Porsiyon, 1.5 Porsiyon (+Fiyat)
    *   *İçecek:* Şalgam, Ayran
    *   Bu sayede garson sipariş alırken müşteriye soru sormayı unutmaz.

---

## 3. Personel ve Yetkiler

İşletmedeki herkesin kendi rolüne uygun ekranı vardır.

| Rol | Yetkiler | Kullandığı Ekran |
| :--- | :--- | :--- |
| **Admin (Patron)** | Her şeyi görür, siler, düzenler. Raporlara erişir. | Tüm Ekranlar + Yönetim Paneli |
| **Kasa (Cashier)** | Siparişleri görür, ödeme alır, raporlara erişemez. | POS Terminali |
| **Garson (Waiter)** | Sipariş alır, masaları yönetir, ödeme alamaz. | Garson Paneli (Mobil) |
| **Mutfak (Kitchen)** | Gelen siparişi görür, hazır/reddedildi yapar. | Mutfak Paneli |

**Öneri:** Her personelinize ayrı kullanıcı adı açın. Böylece kimin hangi siparişi aldığını veya sildiğini takip edebilirsiniz.

---

## 4. Operasyon: Günlük İşleyiş Senaryoları

İşte tipik bir restoran gününde sistemin nasıl kullanıldığı:

### Garson: Sipariş Alma 📱
1.  Garson tableti/telefonundan **Garson Paneli**ne girer.
2.  Masayı seçer.
3.  Ürünlere tıklar. (Eğer ürünün "Acılı/Acısız" gibi seçeneği varsa sistem otomatik sorar).
4.  **"SİPARİŞİ GÖNDER"** butonuna basar.
5.  **Sonuç:** Sipariş anında **Mutfak Ekranına** sesli uyarı ile düşer ve **Kasa** ekranında belirir. Garsonun mutfağa koşmasına gerek kalmaz.

### Müşteri: QR Menü Kullanımı 🤳
1.  Müşteri masadaki QR kodu okutur.
2.  Dijital menüden ürünleri sepetine ekler.
3.  **"SİPARİŞİ ONAYLA"** der.
4.  **Sonuç:** Bu sipariş, Garson ve Kasa ekranına **"ONAY BEKLİYOR"** olarak düşer (kötü niyetli siparişleri önlemek için). Garson veya Kasa onayladığında mutfağa iletilir.
5.  Müşteri ayrıca menüdeki **"GARSON ÇAĞIR"** 🔔 butonuna basarak personeli masaya çağırabilir.

### Mutfak: Sipariş Hazırlama 👨‍🍳
1.  Mutfak ekranında **"DING DONG"** 🎵 sesi çalar. 
2.  Yeni sipariş kartı en başa gelir: *"MASA 5 - 2x İskender, 1x Cola"*.
3.  Şef yemeği hazırlar.
4.  Kartın üzerindeki **"HAZIR"** ✅ butonuna basar.
5.  **Sonuç:** Garsonların telefonuna sesli bildirim gider: *"MASA 5 SİPARİŞİ HAZIR"*.

### Kasa: Ödeme ve Kontrol 💻
1.  Kasiyer **POS Terminali**nde tüm masaları kuş bakışı görür.
2.  Dolu masalar siyah, boşlar beyazdır.
3.  Ödeme yapacak masaya tıklar.
4.  Ürün ekleme/çıkarma yapabilir.
5.  **"HESABI KAPAT"** butonuna basarak ödemeyi alır ve masayı boşa çıkarır.

---

## 5. 🔔 Bildirim ve İletişim Merkezi

İşletme içindeki bağırış çağırışa son veriyoruz. Sağ üstteki **ZİL** 🔔 ikonu iletişim merkezinizdir.

*   **Sistem Uyarıları:** Yeni bir sipariş geldiğinde, bir sipariş hazırlandığında, bir şube silinemediğinde (hata durumunda) buraya düşer.
*   **Personel Çağırma:**
    1.  Zile tıklayın.
    2.  **"KİŞİLER"** sekmesine geçin.
    3.  Ahmet (Mutfak) kullanıcısına tıklayın.
    4.  Ahmet'in ekranında zil çalar ve *"Mehmet (Kasa) sizi çağırıyor"* yazar.
*   **Müşteri Çağrısı:** Müşteri QR menüden butona bastığında, tüm garsonların ekranında zil çalar ve *"MASA X GARSON BEKLİYOR"* uyarısı çıkar.

**Nasıl Kullanılır?**
- Gelen bildirime **"TAMAMLANDI"** derseniz listeden silinir.
- **"ERTELE"** derseniz modal kapanır ama bildirim merkezinde (kırmızı noktalı) beklemeye devam eder.

---

## 6. 📊 God Mode & Analitik (Patron Ekranı)

Burası işletmenizin kaptan köşküdür.

*   **Canlı Ciro:** Bugün kasaya giren net parayı anlık görün.
*   **Doluluk Oranı:** Dükkanın % kaçı dolu?
*   **Sıcaklık Haritası:** Günün hangi saatleri yoğun? (Personel vardiyasını buna göre ayarlayın).
*   **Yapay Zeka Taktikleri:** Sistem verileri analiz eder ve size tavsiye verir.
    *   *Örnek:* "Tatlı satışların düşük. Garsonlara yemek sonrası kahve önermelerini söyle."
    *   *Örnek:* "Saat 18:00 - 20:00 arası çok yoğunsun, mutfağa bir kişi daha lazım."

---

## 7. Sıkça Sorulan Sorular ve İpuçları

**S: Sesli bildirimler çalışmıyor, ne yapmalıyım?**
C: Tarayıcılar (Chrome/Safari), kullanıcı sayfaya hiç tıklamadıysa otomatik ses çalmayı engeller. Sayfayı açtığınızda **ekranda herhangi bir yere bir kez tıklamanız** yeterlidir. Sistem "kilidi açar" ve sonraki tüm bildirimlerde ses çalar.

**S: Bir şubeyi silemiyorum, hata veriyor?**
C: Güvenlik gereği, **içinde aktif veya geçmiş siparişi olan** bir şubeyi doğrudan silemezsiniz. Önce o şubeye ait verileri temizlemeniz gerekir. Aldığınız hata mesajı size tam sebebi söyleyecektir.

**S: İptal edilen siparişleri görebilir miyim?**
C: Evet. Kasa ve Yönetim panelinde "İPTAL EDİLDİ" veya "REDDEDİLDİ" statüsündeki tüm siparişler raporlanır. Bu sayede kaçakları önlersiniz.

**S: İnternet kesilirse ne olur?**
C: Sistem bulut tabanlıdır (SaaS), internet gerektirir. Ancak kısa süreli kesintilerde (WiFi kopması vb.) sayfa kapatılmadığı sürece bağlantı tekrar geldiğinde senkronize olur. Bağlantı kopukken "WebSocket" hatası alırsanız sayfayı yenileyin.

---

**Restaurant Master POS** ile bol kazançlar dileriz! 🚀
