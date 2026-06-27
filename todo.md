# Marketing Blueprint (Marketing OS) Özelliğini Admin Panele Ekle

Admin panelimize proje bazlı yeni bir özellik ekle.

Bu özellik klasik bir "Pazarlama" sayfası değildir.

Amaç, her proje için ürünün pazarlama operasyonlarını tek ekrandan yönetebileceğimiz bir **Marketing OS (Marketing Blueprint)** oluşturmaktır.

Bu ekran ürün geliştirme süreciyle birlikte ilk günden itibaren kullanılmalıdır.

AI destekli çalışmalıdır ve mevcut ChatGPT API altyapısını kullanabilecek şekilde tasarlanmalıdır.

UI mevcut admin panelinin tasarım dili ile tamamen uyumlu olsun.

Responsive çalışsın.

---

# Menü

ProjectNavSidebar içerisinde bulunan

ALL_TABS

listesine yeni sekme ekle.

Yeni sekme

```
Pazarlama
```

veya

```
Marketing Blueprint
```

olsun.

Bu sekme her proje içerisinde yer almalıdır.

---

# Genel Yapı

Tek sayfalık bir operasyon ekranı oluştur.

Sayfa aşağıdaki bölümlerden oluşsun.

---

# 1) Marketing Score

Sayfanın en üstünde AI analiz kartı olsun.

Örneğin

```
Marketing Score

38 / 100

Henüz pazarlama planı oluşturulmamış.

Eksikler

• Landing Page

• İlk içerikler

• Dağıtım kanalları

• Launch Planı
```

İleride ChatGPT API burayı otomatik dolduracak.

Şimdilik CRUD destekli veri yapısını hazırla.

---

# 2) Product Stage

Projenin bulunduğu aşama seçilebilsin.

Seçenekler

* Idea
* Validation
* MVP
* Beta
* Launch
* Growth
* Scale

Stage değişince ekran buna göre filtrelenebilecek şekilde tasarla.

---

# 3) Target Audience

Alanlar

* Hedef Kitle
* Problem
* Çözüm
* Rakipler
* Değer Önerisi

Serbest metin alanları olsun.

---

# 4) Distribution Channels

Checklist şeklinde olsun.

Platformlar

* SEO
* Google Ads
* Reddit
* X (Twitter)
* LinkedIn
* Instagram
* TikTok
* Facebook
* YouTube
* Product Hunt
* Hacker News
* Email
* Cold Email
* Discord
* Facebook Groups
* WhatsApp
* Affiliate
* Influencer
* Blog
* App Store Optimization (ASO)

Her platform için

* aktif mi
* öncelik
* not

alanları bulunsun.

---

# 5) Organic / Paid

Kart görünümü

Organic

%

Paid

%

oranları belirlenebilsin.

---

# 6) Content Strategy

İçerik kategorileri oluştur.

Örneğin

* Eğitim
* Problem
* Çözüm
* Özellik Tanıtımı
* Karşılaştırma
* Case Study
* Founder Story
* Behind The Scenes
* Launch
* Müşteri Hikayesi
* Video
* Blog
* FAQ
* Tips
* Reel
* Shorts

Her kategori için

haftalık paylaşım hedefi girilebilsin.

---

# 7) Content Calendar

Basit takvim görünümü oluştur.

İçerikler günlere atanabilsin.

İçerik tipi seçilebilsin.

Durumu

Planlandı

Hazırlanıyor

Hazır

Paylaşıldı

olsun.

---

# 8) Marketing Funnel

Görsel kart yapısı oluştur.

Kutular

Awareness

↓

Interest

↓

Signup

↓

Activation

↓

Revenue

↓

Referral

Her kutuya açıklama yazılabilsin.

---

# 9) Launch Checklist

Checklist

Örneğin

* Landing Page
* Domain
* Analytics
* Search Console
* Logo
* Pricing
* Privacy Policy
* Terms
* Product Hunt
* App Store Assets
* Screenshots
* Demo Video
* Support Email
* Waitlist
* Email Automation

Tamamlandı işaretlenebilsin.

---

# 10) Weekly Marketing Plan

Haftalık yapılacaklar.

Kanban görünümü.

Kolonlar

* Todo
* Doing
* Done

Kartlar

* başlık
* açıklama
* bitiş tarihi
* öncelik
* sorumlu kişi

---

# 11) Marketing Tasks

Normal görev yönetimi.

Alanlar

* Başlık
* Açıklama
* Öncelik
* Stage
* Platform
* Son Tarih
* Sorumlu
* Durum

---

# 12) Competitor Analysis

Rakip ürünler eklenebilsin.

Alanlar

* Ürün adı
* Website
* Notlar
* Güçlü Yanlar
* Zayıf Yanlar
* Pazarlama Stratejisi

İleride AI analiz edecek.

Şimdilik CRUD yeterli.

---

# 13) KPI Dashboard

Kartlar

* Visitors
* Downloads
* Signups
* Active Users
* MRR
* Conversion Rate
* CAC
* LTV
* Email Subscribers
* Followers

Manuel girilebilir.

---

# 14) AI Marketing Coach

Şimdilik placeholder kart oluştur.

Buton

```
Marketing Planı Oluştur
```

Buton şimdilik dummy olabilir.

İleride ChatGPT API kullanılacak.

Bu alan için component yapısını hazırla.

---

# 15) Reverse Engineering

Rakip stratejileri not alabileceğimiz bölüm.

Alanlar

* Ürün
* Landing
* Pricing
* Ads
* SEO
* İçerik
* Funnel
* Notlar

---

# Veritabanı

Ana dizinde bulunan

db.sql

dosyasını güncelle.

Mevcut tablo yapısını bozma.

Yeni tabloları sona ekle.

Mevcut

projects

tablosuna foreign key ile bağla.

RLS KULLANMIYORUZ.

Hiçbir yeni tablo için RLS oluşturma.

Policy oluşturma.

Authentication ekleme.

---

# Önerilen Tablolar

marketing_blueprints

Projenin ana pazarlama ayarları

* id
* project_id
* stage
* marketing_score
* target_audience
* problem
* solution
* value_proposition
* organic_percentage
* paid_percentage
* notes
* created_at
* updated_at

---

marketing_channels

* id
* blueprint_id
* platform
* enabled
* priority
* notes

---

marketing_content_categories

* id
* blueprint_id
* category
* weekly_target

---

marketing_contents

* id
* blueprint_id
* title
* category
* platform
* planned_date
* status
* notes

---

marketing_tasks

* id
* blueprint_id
* title
* description
* platform
* stage
* priority
* assigned_to
* due_date
* status
* completed_at

---

marketing_launch_checklist

* id
* blueprint_id
* item_name
* completed

---

marketing_competitors

* id
* blueprint_id
* competitor_name
* website
* strengths
* weaknesses
* strategy
* notes

---

marketing_kpis

* id
* blueprint_id
* visitors
* downloads
* signups
* active_users
* mrr
* conversion_rate
* cac
* ltv
* email_subscribers
* followers
* created_at

---

# Teknik Gereksinimler

* Mevcut component yapısını kullan.
* TypeScript tiplerini eksiksiz oluştur.
* CRUD işlemleri Supabase üzerinden yapılsın.
* Kod modüler olsun.
* Responsive çalışsın.
* Tablolar arasında foreign key ilişkileri kur.
* Formlarda validation kullan.
* Mevcut tema ve UI bileşenlerini kullan.
* Sayfa performanslı olsun.
* Gereksiz paket ekleme.

Bu ekranın amacı klasik bir pazarlama not defteri oluşturmak değildir.

Amaç; bir SaaS, mobil uygulama veya dijital ürünün fikir aşamasından büyüme aşamasına kadar tüm pazarlama operasyonlarını tek ekrandan yönetebileceğimiz, ileride ChatGPT API ile otomatik strateji üretebilecek profesyonel bir **Marketing OS** altyapısı oluşturmaktır.
