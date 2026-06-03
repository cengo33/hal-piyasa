# Zernio WhatsApp Sender — Project Card

> README.md ürün/teknik özet için; PROJECT_CARD durumsal/operasyonel takip için.

## Durum
- **Mod:** Aktif
- **Sahip:** <KULLANICI_ADI>
- **Son güncelleme:** 2026-06-03

## Bir Cümlede
Zernio API altyapısını kullanarak WhatsApp Sandbox üzerinden hedef numaraya şablon doğrulama adımlarıyla otomatik mesaj gönderilmesini sağlayan CLI aracı.

## Production
- **Railway servisi:** Yok (Lokal CLI Aracı)
- **Cron schedule:** Yok
- **Root directory:** `Projeler/Zernio_WhatsApp_Sender`
- **Auto-deploy:** Kapalı

## Bağımlılıklar
- **Dış API:** Zernio (Late)
- **İçeride bağımlı:** Yok

## Bilinen Riskler / TODO
- [ ] Sandbox modunda 24 saatlik mesajlaşma penceresinin açık kalması için test numarasından periyodik yanıt alınması gerekir.
- [ ] Mesaj şablon parametrelerinin (varsa) dinamik olarak CLI argümanlarından alınabilmesi desteği.

## İlgili Linkler
- README: `./README.md`
- Master env: `_knowledge/credentials/master.env`
