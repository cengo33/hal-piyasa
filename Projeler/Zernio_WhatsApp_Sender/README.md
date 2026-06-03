# Zernio WhatsApp Sender

Bu proje, **Zernio** (eski adıyla Late) birleşik sosyal medya API platformunu kullanarak WhatsApp Sandbox üzerinden hedef telefon numaralarına otomatik ve güvenli mesaj gönderilmesini sağlayan bir komut satırı (CLI) aracıdır.

## 🚀 Hızlı Başlangıç

### 1. Kimlik Bilgileri (.env)
Proje dizininde `ZERNIO_API_KEY` bilgisini içeren bir `.env` dosyası bulunmalıdır. (Eğer dizinde `.env` yoksa, script otomatik olarak merkezi `_knowledge/credentials/master.env` dosyasındaki anahtarı okuyacaktır).

```env
ZERNIO_API_KEY=sk_6e7873c4b3...
```

### 2. Kullanım
Script'i terminalden alıcı numara (E164 formatında) ve göndermek istediğiniz mesajı parametre olarak geçerek çalıştırabilirsiniz:

```bash
python send_message.py --to +905076231510 --message "selam naber?"
```

**Kısa Parametreler:**
```bash
python send_message.py -t +905076231510 -m "selam naber?"
```

---

## 🛠️ Nasıl Çalışır? (API Akışı)

Script arka planda şu adımları takip eder:

1. **Telefon Numaraları ve Sandbox Keşfi (`GET /v1/whatsapp/phone-numbers`):**
   Geliştirici hesabına ait WhatsApp sandbox numarasını, `accountId` bilgisini ve doğrulanmış başlangıç şablonunu (`sandbox_start`) öğrenir.
2. **Pencereyi Açma / Şablon Gönderimi (`POST /v1/inbox/conversations`):**
   WhatsApp ve Zernio kuralları gereği, serbest mesaj penceresini tetiklemek üzere `sandbox_start` şablonu (template) alıcıya gönderilir. Bu adım sonucunda alıcı ile aramızda bir konuşma (`conversationId`) kimliği açılır.
3. **Serbest Mesaj İletimi (`POST /v1/inbox/conversations/{conversationId}/messages`):**
   Açılan konuşma penceresi üzerinden kullanıcının girdiği serbest metin ("selam naber?") alıcıya ulaştırılır.
4. **Bağlantı ve Hata Dayanıklılığı:**
   Script içerisinde HTTP 429 (Rate Limit) ve 5xx (Sunucu) hatalarına karşı üstel gecikmeli yeniden deneme (**Exponential Backoff**) mekanizması entegre edilmiştir.
