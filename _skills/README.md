# 🛠 Skills

Bu klasör, Antigravity'ye öğretilen kalıcı yetenekleri (skill'leri) içerir.

Her skill, kendi klasörü içinde bir `SKILL.md` dosyasıyla tanımlanır.
Antigravity bir göreve başlamadan önce ilgili skill'i okuyarak nasıl davranacağını öğrenir.

---

## Mevcut Skill'ler ve Kullanan Agent'lar

| # | Skill | Açıklama | Kullanan Agent(lar) |
|---|-------|---------|---------------------|
| 1 | `rakip-analiz` | Rakip analizi ve izleme | 🤖 `icerik-uretim` |
| 2 | `folder-paylasim` | Klasör bazlı paylaşım | 🤖 `yayinla-paylas` |
| 3 | `kie-ai-video-production` | Video, görsel ve ses üretimi | 🤖 `icerik-uretim` |
| 4 | `lead-generation` | Potansiyel müşteri ve veri toplama (Apify) | 🤖 `musteri-kazanim` |
| 5 | `eposta-gonderim` | Toplanan verilere e-posta gönderimi (Gmail) | 🤖 `musteri-kazanim` |
| 6 | `canli-yayina-al` | GitHub + Railway ile 7/24 deployment | 🤖 `yayinla-paylas` |
| 7 | `canli-demo` | Projeleri lokalde başlatıp paylaşılabilir canlı demo URL'i üretir | — (bağımsız) |
| 8 | `folder-paylasim` | Proje export ve paylaşıma hazırlama | 🤖 `yayinla-paylas` |
| 9 | `rakip-analiz` | Rakiplerin landing page analizi | 🤖 `musteri-kazanim` |
| 10 | `egitim-gorselleri` | Web temelli görselleştirmeler | — (bağımsız) |
| 11 | `website-olusturucu` | Web sitesi oluşturma | — (bağımsız) |
| 12 | `sifre-yonetici` | Merkezi şifre/token yönetimi ve dağıtımı | Tüm agent'lar |
| 13 | `fatura-olusturucu` | Sosyal medya iş birlikleri için PDF invoice üretimi | 🤖 `yayinla-paylas` |
| 14 | `reels-kapak` | AI ile Instagram Reels kapak görseli üretimi (Kie AI pipeline) | 🤖 `icerik-uretim` |
| 15 | `telefon-formatlayici` | Telefon numarası formatlama ve doğrulama | — (bağımsız) |
| 16 | `supabase-postgres-best-practices` | Supabase RLS, veritabanı fonksiyonları ve query optimizasyonu kuralları | Tüm projeler |
| 17 | `notion-api-rules` | Notion MCP/API dualite, Idempotency ve Rate Limiting standartları | Tüm projeler |
| 18 | `railway-deploy-rules` | Railway startup delays, fail-fast env config ve deploy stabilitesi | Tüm projeler |
| 19 | `apify-scraping-rules` | Apify Store seçimi, X içerik ve kitle Actor yönlendirmesi, maliyet/hız optimizasyonu | 🤖 `musteri-kazanim` vb. |
| 20 | `telegram-bot-rules` | getUpdates conflict çözümü (webhook/polling), alert fatigue önleme | Tüm projeler |
| 21 | `llm-structured-output-rules` | OpenAI/Anthropic/Groq için Pydantic ve JSON output zorunlulukları | Tüm projeler |
---

## Yeni Skill Nasıl Eklenir?

1. `_skills/` altında yeni bir klasör aç (örn. `apify-analizi/`)
2. İçine `SKILL.md` dosyası oluştur
3. `SKILL.md` içine şu formatı kullan:

```markdown
---
name: Skill Adı
description: Bu skill ne zaman kullanılır?
---

## Açıklama
...

## Adımlar
1. ...
2. ...

## Çıktı Formatı
...
```

## Pazarlama Yetkinlikleri (Marketing Skills)


`https://github.com/coreyhaines31/marketingskills` adresinden eklenen 43 adet pazarlama ve büyüme (growth) odaklı skill `_skills/` klasörüne entegre edilmiştir. Bu skill'ler şunlardır:

- **ab-testing**: A/B testi stratejileri ve uygulamaları.
- **ad-creative**: Reklam görselleri ve kreatif tasarımlar.
- **ads**: Genel reklam kampanyaları ve yönetimi.
- **ai-seo**: Yapay zeka destekli arama motoru optimizasyonu.
- **analytics**: Analitik, metrik ve veri takibi.
- **aso**: App Store Optimization (Uygulama Mağazası Optimizasyonu).
- **churn-prevention**: Kullanıcı kaybı (churn) önleme stratejileri.
- **co-marketing**: Ortak pazarlama kampanyaları.
- **cold-email**: Soğuk e-posta (cold outreach) şablonları ve taktikleri.
- **community-marketing**: Topluluk odaklı pazarlama.
- **competitor-profiling**: Rakip analizi ve profilleme.
- **competitors**: Rakip takibi.
- **content-strategy**: İçerik stratejisi oluşturma.
- **copy-editing**: Metin düzenleme ve iyileştirme.
- **copywriting**: Reklam yazarlığı ve ikna edici metinler.
- **cro**: Conversion Rate Optimization (Dönüşüm Oranı Optimizasyonu).
- **customer-research**: Müşteri araştırması ve anketler.
- **directory-submissions**: Dizin sitelerine kayıt ve SEO backlinks.
- **emails**: E-posta pazarlama stratejileri.
- **free-tools**: Ücretsiz araçlar/mıknatıslar ile lead toplama.
- **image**: Görsel pazarlama ve tasarım.
- **launch**: Ürün/özellik lansman stratejileri.
- **lead-magnets**: Lead magnet tasarımı ve kurgusu.
- **marketing-ideas**: Pazarlama fikirleri ve beyin fırtınası.
- **marketing-plan**: Pazarlama planı şablonları.
- **marketing-psychology**: Pazarlama psikolojisi prensipleri.
- **onboarding**: Kullanıcı alıştırma (onboarding) süreçleri.
- **paywalls**: Ödeme duvarı (paywall) optimizasyonu.
- **popups**: Popup ve form stratejileri.
- **pricing**: Fiyatlandırma stratejileri ve modelleri.
- **product-marketing**: Ürün pazarlaması (product marketing).
- **programmatic-seo**: Programatik SEO uygulamaları.
- **prospecting**: Potansiyel müşteri arama ve filtreleme.
- **referrals**: Tavsiye (referral) programları.
- **revops**: Gelir operasyonları (Revenue Operations).
- **sales-enablement**: Satış ekiplerini destekleyici içerik ve araçlar.
- **schema**: Schema markup ve yapılandırılmış veri.
- **seo-audit**: Kapsamlı SEO denetimi.
- **signup**: Üyelik ve kayıt süreçleri optimizasyonu.
- **site-architecture**: Web sitesi mimarisi ve UX.
- **sms**: SMS pazarlaması taktikleri.
- **social**: Sosyal medya pazarlaması ve yönetimi.
- **video**: Video pazarlama stratejileri.
