# AI COO Telegram Bot Özelliğini Next.js Projesine Entegre Et

Projeye Telegram Bot entegrasyonu ekle.

Bu bot klasik bir Telegram botu olmayacak.

Amacı, admin panelimizin uzaktan yönetilebildiği, projeleri anlayan ve yöneten bir **AI COO (Chief Operating Officer)** olacaktır.

Bot, benim kişisel AI asistanım gibi davranmalıdır.

Ürün geliştirme, pazarlama, roadmap, todo yönetimi, proje analizi ve fikir üretme konularında bana yardımcı olmalıdır.

Bot tamamen mevcut admin paneli ile entegre çalışmalıdır.

---

# Önce mevcut projeyi analiz et

Kod yazmaya başlamadan önce aşağıdakileri incele.

* Ana dizindeki **telegram.md** dosyasını oku.
* Telegram bot bilgilerini ve gerekli ayarları buradan al.
* Ana dizindeki **db.sql** dosyasını tamamen incele.
* Veritabanı yapısını öğren.
* Mevcut tablo ilişkilerini anla.
* Mevcut Project, Blueprint, Marketing, Todo, Deep Work tablolarını kullan.
* Gerekiyorsa yeni tabloları db.sql dosyasına ekle.

Mevcut yapıyı bozma.

---

# Amaç

Telegram üzerinden;

* projelerimi yönetebilmeliyim.
* AI ile sohbet edebilmeliyim.
* Ses mesajı gönderebilmeliyim.
* Yazı yazabilmeliyim.
* Todo oluşturabilmeliyim.
* Marketing planı oluşturabilmeliyim.
* Blueprint güncelleyebilmeliyim.
* Deep Work planı hazırlatabilmeliyim.
* Projeler hakkında rapor alabilmeliyim.

Bot benim kişisel AI COO'm gibi davranmalıdır.

---

# Güvenlik

En önemli konu.

Bot sadece benim tarafımdan kullanılmalıdır.

Başka hiçbir Telegram kullanıcısı kullanamasın.

telegram.md içerisindeki

Telegram User ID

veya

Allowed User ID

kullanılarak doğrulama yap.

İzin verilmeyen kullanıcılar

```text
Bu bot özel kullanım içindir.
```

cevabını alsın.

Hiçbir AI işlemi çalıştırılmasın.

---

# Deployment

Proje Vercel üzerinde çalışıyor.

Telegram Webhook yapısını buna göre oluştur.

Long polling kullanma.

Webhook kullan.

Vercel'e deploy edildiğinde ekstra işlem gerektirmeden çalışabilsin.

Environment Variable yapısını oluştur.

---

# OpenAI

Projede mevcut ChatGPT API kullanılsın.

Yeni provider ekleme.

Mevcut AI servislerini kullan.

---

# AI Çalışma Prensibi

Bot gereksiz yere büyük prompt göndermesin.

Her mesajda tüm veritabanını AI'ya göndermesin.

Önce intent belirlesin.

Örneğin

"Todo ekle"

ise

sadece ilgili proje bilgileri çekilsin.

"Marketing"

ise

yalnızca marketing bilgileri çekilsin.

"Blueprint"

ise

yalnızca blueprint verileri gönderilsin.

Promptlar mümkün olduğunca küçük olsun.

Token tüketimi optimize edilsin.

Yanıtlar mümkün olduğunca hızlı gelsin.

---

# Voice Message

Ses mesajı destekle.

Telegram ses kaydı gönderdiğimde

OpenAI Speech To Text kullan.

Metne dönüştür.

Sonra normal mesaj gibi işle.

---

# AI COO

Bot benim COO'm gibi davranmalı.

Sadece sorulara cevap veren chatbot olmasın.

Proaktif öneriler verebilsin.

Örneğin

"Bu hafta Restaurant QR projesine odaklanmanı öneriyorum."

veya

"Pazarlama tarafında son 10 gündür ilerleme yok."

gibi öneriler sunabilsin.

---

# Yapabilecekleri

Bot aşağıdaki işlemleri yapabilsin.

## Genel Sohbet

Projeler hakkında sohbet.

Yeni fikirler.

Teknik öneriler.

Ürün önerileri.

Rakip analizi.

Roadmap önerileri.

---

## Blueprint

Blueprint'i okuyabilsin.

Güncelleyebilsin.

Yeni hedefler ekleyebilsin.

Problem tanımı oluşturabilsin.

Value Proposition geliştirebilsin.

Hedef kitle önerileri sunabilsin.

---

## Marketing

Marketing Blueprint okuyabilsin.

Yeni pazarlama planı oluşturabilsin.

İçerik fikirleri verebilsin.

Launch planı oluşturabilsin.

Haftalık pazarlama planı hazırlayabilsin.

Organik/Paid önerileri sunabilsin.

---

## Todo

Yeni Todo oluşturabilsin.

Todo tamamlayabilsin.

Todo listeleyebilsin.

Todo önceliği değiştirebilsin.

Todo'yu projeye bağlayabilsin.

---

## Deep Work

Bugünkü 2 saatlik plan hazırlayabilsin.

Öncelikli işleri belirleyebilsin.

Deep Work görevleri oluşturabilsin.

---

## Daily Report

Günlük rapor verebilsin.

Bugün yapılanlar.

Tamamlanan görevler.

Marketing ilerlemesi.

Roadmap durumu.

---

## Weekly Report

Haftalık özet hazırlayabilsin.

Tamamlanan işler.

Eksikler.

Öneriler.

---

## Project Status

Örneğin

Restaurant QR ne durumda?

sorulduğunda

Blueprint

Todo

Marketing

Roadmap

Deep Work

bilgilerini analiz ederek cevap verebilsin.

---

## Brain Dump

Telegram'dan yazılan serbest fikirleri

Inbox

veya

Todo

olarak kaydedebilsin.

---

## Quick Notes

Not oluşturabilsin.

Projeye bağlayabilsin.

---

## Feature Request

"QR ödeme ekleyelim"

denildiğinde

Blueprint Feature

veya

Todo

oluşturabilsin.

---

## Sprint Planning

Haftalık sprint oluşturabilsin.

---

## Launch Readiness

Launch'a hazır mıyız?

sorusunu analiz ederek

eksikleri söyleyebilsin.

---

## KPI Analizi

Marketing KPI'larını yorumlayabilsin.

---

# AI COO Karakteri

Cevaplar

* kısa
* net
* aksiyon odaklı

olsun.

Gereksiz uzun cevaplar verme.

Her cevap sonunda mümkünse

önerilen sonraki adımı yaz.

Örneğin

"Sonraki önerim:

Landing Page Hero bölümünü güncelle."

---

# Günlük Öneriler

Bot zaman zaman bana öneriler verebilsin.

Örneğin

Sabah

"Bugünkü Deep Work planın hazır."

Haftada birkaç kez

"Pazarlama tarafında içerik üretimi durmuş."

gibi öneriler oluşturabilecek altyapıyı hazırla.

Bu öneriler spam olmayacak şekilde tasarlansın.

---

# Help Komutu

/help

veya

"Sen neler yapabiliyorsun?"

yazıldığında

çok güzel hazırlanmış yardım ekranı göndersin.

İçerisinde

* Yapabilecekleri
* Komut örnekleri
* Desteklenen özellikler

bulunsun.

Örnekler

Restaurant QR durumunu göster

Bugün ne yapmalıyım?

Yeni Todo oluştur

Marketing planı hazırla

Launch'a hazır mıyız?

Bu hafta neye odaklanmalıyım?

QR ödeme özelliği ekle

Twitter için içerik üret

Bugünkü Deep Work planını oluştur

Restaurant QR Blueprint'ini güncelle

---

# Komut Sistemi

Komut zorunlu olmasın.

Doğal dil desteklensin.

Örneğin

"Bugün ne yapacağım?"

"Restaurant QR projesine Stripe ekleyelim."

"Pazarlama planı oluştur."

gibi doğal mesajlar anlaşılabilsin.

İsteğe bağlı olarak aşağıdaki slash komutları da desteklenebilir:

/help

/projects

/project

/todo

/marketing

/blueprint

/deepwork

/report

/weekly

/launch

/status

---

# Yeni Veritabanı

Gerekliyse

db.sql

dosyasına aşağıdaki tabloları ekle.

telegram_chat_history

* id
* telegram_user_id
* role
* message
* project_id
* created_at

telegram_sessions

Konuşma bağlamı

* id
* telegram_user_id
* current_project_id
* last_context
* updated_at

telegram_ai_logs

* id
* action
* token_usage
* response_time
* created_at

Bu tablolar sayesinde

konuşma geçmişi,

aktif proje,

performans,

token kullanımı

takip edilebilsin.

---

# Kod Kalitesi

* Next.js App Router yapısına uygun geliştir.
* Vercel ile uyumlu çalışsın.
* TypeScript tipleri eksiksiz olsun.
* Kod modüler olsun.
* Telegram servisleri ayrı klasörde toplansın.
* AI servisleri mevcut yapıyı kullansın.
* Hata logları düzgün tutulmalı.
* Rate limit düşünülmeli.
* Gereksiz OpenAI isteği atılmamalı.
* Aynı istekler mümkünse cache edilebilmeli.
* Promptlar küçük tutulmalı.
* Ortalama cevap süresi düşük olacak şekilde optimize edilmeli.

## Nihai Hedef

Telegram botu, sıradan bir chatbot değil; projelerimi anlayan, Blueprint, Marketing, Todo ve Deep Work modüllerini yöneten, gerektiğinde proaktif öneriler sunan, sesli ve yazılı iletişim kurabildiğim, yalnızca benim kullanabildiğim kişisel **AI COO (Chief Operating Officer)** olarak çalışmalıdır. Bu entegrasyon mevcut Product OS mimarisinin doğal bir uzantısı olacak şekilde tasarlanmalı ve ileride yeni modüller eklendiğinde kolayca genişletilebilecek modüler bir yapıda geliştirilmelidir.

Proje vercel de deploy edilcek. Vercel üzerinde telegram api ile çalışması için gerekli ayarlamaları yap.