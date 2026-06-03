# Zernio WhatsApp Web Dashboard

Bu proje, **Zernio** API altyapısını kullanarak WhatsApp Sandbox (veya bağlı numaralarınız) üzerinden mesaj gönderip almanızı sağlayan, sıfır bağımlılıklı modern bir web paneli (dashboard) sunar.

## 🚀 Hızlı Başlangıç

### 1. Kimlik Bilgileri (.env)
Dizinde `ZERNIO_API_KEY` bilgisini içeren bir `.env` dosyası bulunmalıdır. (Eğer dizinde yoksa, sunucu otomatik olarak merkezi `_knowledge/credentials/master.env` dosyasındaki anahtarı okuyacaktır).

```env
ZERNIO_API_KEY=sk_6e7873c4b3...
```

### 2. Çalıştırma
Hiçbir harici bağımlılık (`Flask`, `FastAPI` vb.) kurmanıza gerek kalmadan, doğrudan standart Python motorunu kullanarak sunucuyu başlatabilirsiniz:

```bash
python server.py
```

Sunucu başarıyla başlatıldıktan sonra tarayıcınızda şu adrese gidin:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🎨 Tasarım ve Arayüz Özellikleri
*   **Premium Glassmorphism:** Buzlu cam efektleri, saydam kartlar ve modern arayüz derinliği.
*   **Real-time Polling:** 5 saniyede bir otomatik sorgulama (polling) ile telefonunuza gelen yanıtları anında ekrana yansıtır.
*   **Sohbet Arama & Filtreleme:** Sol menüde aktif konuşmalar arasında hızlı geçiş yapabilme.
*   **Şablon Entegrasyonu:** WhatsApp kuralları gereği 24 saatlik konuşma penceresini tetikleyecek `sandbox_start` şablonunu tek tıkla gönderebilme penceresi.
