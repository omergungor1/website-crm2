# Blueprint (Product Blueprint) Özelliğini Projeye Ekle

Projeler içerisine yeni bir sekme ekle.

Bu sekmenin amacı; bir projenin tüm temel bilgilerini, hedeflerini, kullanıcı kitlesini, MVP kapsamını ve stratejisini tek bir yerde toplamak olacaktır.

Bu sayfa projenin **Single Source of Truth** (tek doğru bilgi kaynağı) olacaktır.

Bir geliştirici, tasarımcı veya AI bu sayfayı okuduğunda proje hakkında ihtiyaç duyduğu tüm temel bilgileri anlayabilmelidir.

Bu ekran daha sonra Todo, Marketing, AI ve Deep Work modülleri tarafından kullanılacaktır.

---

# Menü

ProjectNavSidebar içerisinde bulunan

ALL_TABS

listesine yeni sekme ekle.

Sekme adı

```text
Blueprint
```

olsun.

Sıralama önerisi

```text
Overview

Blueprint

Todo

Deep Work

Marketing

Files

Notes
```

Blueprint proje içerisindeki ilk çalışılan sayfa olmalıdır.

---

# Sayfa Yapısı

Tek sayfa halinde oluştur.

Kart bazlı modern bir tasarım kullan.

Mevcut admin panel tasarım diline tamamen uyumlu olsun.

Responsive çalışsın.

---

# 1) Product Summary

En üstte kısa ürün tanımı.

Alanlar

* Ürün Adı
* Kısa Açıklama
* Elevator Pitch (Tek cümlelik açıklama)

Örnek

"AI destekli restoran QR sipariş sistemi"

---

# 2) Problem

Bu ürün hangi problemi çözüyor?

Uzun metin alanı.

---

# 3) Solution

Problemi nasıl çözüyoruz?

Uzun metin alanı.

---

# 4) Target Audience

Hedef kullanıcı kitlesi

Alanlar

* Hedef Kitle
* Sektör
* Ülke
* Kullanıcı Tipi
* Şirket Tipi

Örnek

Restaurant

Doctor

Agency

Freelancer

Teacher

SMB

Enterprise

---

# 5) Ideal Customer Profile (ICP)

Alanlar

* Kullanıcı Profili
* Şirket Büyüklüğü
* Çalışan Sayısı
* Tahmini Bütçe
* Karar Verici
* Teknik Seviyesi

---

# 6) Value Proposition

Neden bu ürünü tercih etmeliler?

Rakiplerden farkımız nedir?

Uzun metin alanı.

---

# 7) Core Features

Ürünün ana özellikleri.

Liste şeklinde CRUD.

Her özellik için

* Başlık
* Açıklama
* Öncelik
* MVP mi?

Alanları olsun.

---

# 8) MVP Scope

Üç ayrı bölüm oluştur.

MVP'de Olacak

Sonraki Versiyon

Gelecek Fikirler

Sürükle bırak destekli olabilir.

---

# 9) Monetization

Gelir modeli.

Alanlar

* Freemium
* Subscription
* Lifetime
* Enterprise
* Marketplace
* Commission
* Ads

Birden fazla seçim yapılabilsin.

Fiyat notu eklenebilsin.

---

# 10) Success Metrics

Başarı hedefleri.

Örneğin

* İlk 100 kullanıcı
* İlk 10 müşteri
* 1.000 aktif kullanıcı
* 10K MRR
* 100K ziyaretçi

CRUD destekli liste.

---

# 11) Competitors

Rakip analizi.

Alanlar

* Rakip Adı
* Website
* Güçlü Yanları
* Zayıf Yanları
* Bizim Farkımız
* Notlar

CRUD destekli.

---

# 12) Tech Stack

Kullanılan teknolojiler.

Örneğin

* Next.js
* React
* Expo
* Supabase
* PostgreSQL
* OpenAI
* Stripe

Liste halinde yönetilebilsin.

---

# 13) Roadmap

Roadmap kartları.

Örnek

Idea

↓

Validation

↓

MVP

↓

Beta

↓

Launch

↓

Growth

↓

Scale

Mevcut aşama seçilebilsin.

---

# 14) Project Vision

Alanlar

* Vizyon
* Misyon
* Uzun Vadeli Hedef

Uzun metin alanları.

---

# 15) AI Product Brief

Sayfanın en altında AI alanı oluştur.

Şimdilik placeholder yeterli.

Kart içerisinde

```text
AI Product Assistant
```

bulunsun.

Buton

```text
Blueprint Oluştur
```

Şimdilik sadece component oluştur.

İleride ChatGPT API kullanılarak;

* Ürün özeti
* Hedef kitle
* Persona
* Value Proposition
* Rakip analizi
* MVP önerisi
* Özellik önerileri
* Pazarlama stratejisi

otomatik üretilecek.

Bu alan buna uygun tasarlansın.

---

# Veritabanı

Ana dizinde bulunan

db.sql

dosyasını güncelle.

Yeni tabloları sona ekle.

Mevcut yapıyı bozma.

Mevcut

projects

tablosuna foreign key ile bağlan.

RLS kullanılmıyor.

Hiçbir yeni tablo için

* RLS açma
* Policy oluşturma
* Auth kontrolü ekleme

---

# Oluşturulacak Tablolar

## project_blueprints

Projenin ana Blueprint kaydı.

Alanlar

* id
* project_id
* short_description
* elevator_pitch
* problem
* solution
* target_audience
* industry
* country
* company_type
* ideal_customer_profile
* value_proposition
* monetization_model
* roadmap_stage
* vision
* mission
* long_term_goal
* created_at
* updated_at

---

## blueprint_features

Alanlar

* id
* blueprint_id
* title
* description
* priority
* is_mvp
* sort_order

---

## blueprint_success_metrics

Alanlar

* id
* blueprint_id
* title
* target_value
* current_value
* completed

---

## blueprint_competitors

Alanlar

* id
* blueprint_id
* competitor_name
* website
* strengths
* weaknesses
* differentiation
* notes

---

## blueprint_tech_stack

Alanlar

* id
* blueprint_id
* technology
* category

Örneğin

Frontend

Backend

Database

AI

Payment

Hosting

Analytics

---

## blueprint_mvp_items

Alanlar

* id
* blueprint_id
* title
* description
* stage

stage değerleri

* mvp
* next_version
* future

---

# Teknik Gereksinimler

* TypeScript tiplerini oluştur.
* CRUD işlemleri Supabase üzerinden yapılsın.
* Mevcut component yapısı kullanılsın.
* Kod modüler olsun.
* Responsive çalışsın.
* Form validation ekle.
* Foreign key ilişkilerini oluştur.
* Gereksiz bağımlılık ekleme.
* Kod okunabilir ve sürdürülebilir olsun.

Bu sayfa projenin merkezi olacaktır.

İleride Todo, Deep Work, Marketing Blueprint ve AI modülleri bu sayfadaki bilgilerden faydalanacaktır.

Amaç, proje hakkında tüm temel bilgilerin tek bir yerde tutulduğu profesyonel bir **Product Blueprint** altyapısı oluşturmaktır.
