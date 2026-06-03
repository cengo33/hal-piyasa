# Zernio WhatsApp Dashboard — Project Card

> README.md ürün/teknik özet için; PROJECT_CARD durumsal/operasyonel takip için.

## Durum
- **Mod:** Aktif
- **Sahip:** <KULLANICI_ADI>
- **Son güncelleme:** 2026-06-03

## Bir Cümlede
Zernio API altyapısını kullanan, sıfır bağımlılıklı Python backend ve glassmorphism tasarımlı HTML5/CSS3/JS WhatsApp sohbet ve mesajlaşma paneli.

## Production
- **Railway servisi:** Yok (Lokal Web Arayüzü)
- **Cron schedule:** Yok
- **Root directory:** `Projeler/Zernio_WhatsApp_Dashboard`
- **Auto-deploy:** Kapalı

## Bağımlılıklar
- **Dış API:** Zernio (Late)
- **İçeride bağımlı:** Yok

## Bilinen Riskler / TODO
- [ ] Polling sıklığı nedeniyle Zernio rate limit aşım riski (istekler önbellek veya optimize edilebilir).
- [ ] Birden fazla aktif WhatsApp hattı/numarası bağlandığında hat seçimi yapabilme arayüzü eklenmesi.

## İlgili Linkler
- README: `./README.md`
- Master env: `_knowledge/credentials/master.env`
