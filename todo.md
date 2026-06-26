# Deep Work (2 Saat Odak Sistemi) Özelliği Ekleme Promptu

Mevcut admin panelimize **Deep Work (Günlük 2 Saat Odak Çalışma Sistemi)** özelliği ekle.

Amacımız klasik bir Todo uygulaması yapmak değil. Amaç, her gün sadece en önemli işleri seçip 2 saat boyunca odaklanarak ilerleyebileceğimiz bir sistem oluşturmak.

Tasarım dili mevcut admin paneli ile tamamen uyumlu olsun. Yeni sayfalar mevcut component yapısını kullansın. Responsive çalışsın.

---

## Genel Mimari

Yeni özellikleri tamamen mevcut admin paneline entegre et.

Yeni ayrı bir uygulama oluşturma.

Dashboard içerisine yeni bir sekme veya üst bölüm eklenmesi daha uygun olacaktır.

Önerilen akış:

Dashboard

* Genel Dashboard
* Deep Work

Dashboard açıldığında üst tarafta sekmeler olabilir.

```
Dashboard | Deep Work
```

Deep Work sekmesine girildiğinde aşağıdaki ekran gösterilsin.

---

# Dashboard (Deep Work)

En üstte

```
Bugünkü Hedef

120 / 120 dk

Progress Bar
```

Altında

Bugünün görevleri

Toplam süre

Kalan süre

Başlat butonu

Alt tarafta

Bugün tamamlanan görevler

Alt tarafta

Kısa günlük not

---

# Inbox

Aklıma gelen işleri hızlıca ekleyebileceğim sayfa.

Alanlar

* Başlık
* Açıklama
* Tahmini süre
* Proje
* Öncelik

Buraya eklenen işler daha sonra Kanban'a düşmeli.

---

# Kanban

Kolonlar

* Todo
* Doing
* Done
* Archive

Sürükle bırak desteklenmeli.

Kart içerisinde

* Başlık
* Açıklama
* Tahmini süre
* Gerçek çalışma süresi
* Proje
* Öncelik
* Oluşturulma tarihi
* Tamamlanma tarihi

Kartlar istenirse arşivlenebilmeli.

Silme desteği olmalı.

---

# Günlük Plan

Her sabah sadece bugünkü yapılacak işler seçilebilmeli.

Örneğin

```
Landing Page

45 dk

Stripe

30 dk

Pricing

45 dk
```

Toplam

120 dakika

Kullanıcı isterse farklı süreler seçebilir.

Toplam süre gösterilmeli.

---

# Deep Work Modu

En önemli ekran burası.

Bugün seçilmiş görevler listelenmeli.

Her görev için

Başlat

Durdur

Devam Et

Tamamlandı

butonları olmalı.

Aktif görev çalışırken timer çalışmalı.

Timer durdurulursa geçen süre kaydedilmeli.

Görev tamamlandığında

Done kolonuna taşınmalı.

completed_at alanı doldurulmalı.

Gerçek çalışma süresi hesaplanmalı.

---

# Pomodoro

Pomodoro desteği ekle.

Varsayılan

25 dakika çalışma

5 dakika mola

Ayarlar değiştirilebilir.

Timer kapatılsa bile çalışan süre Supabase'e kaydedilmeli.

Her görevin toplam çalışma süresi tutulmalı.

---

# Takvim

Takvim görünümü ekle.

Takvim üzerinde

Günlere görev planlanabilsin.

Bir görev herhangi bir güne atanabilsin.

Görev tamamlanınca tamamlanma tarihi otomatik işlensin.

Takvim sadece planlama amacıyla kullanılacak.

---

# İstatistik

Gösterilecek bilgiler

Bu hafta toplam çalışma süresi

Bu ay toplam çalışma süresi

Tamamlanan görev sayısı

Toplam Deep Work süresi

Arka arkaya çalışma günü (Streak)

En çok zaman harcanan projeler

---

# Projeler

Mevcut

projects

tablosu zaten var.

Yeni görev oluştururken

Project seçilebilmeli.

Task ilgili project kaydına bağlanmalı.

Project silinirse task silinmesin.

project_id nullable olabilir.

---

# Gün Sonu

Kısa değerlendirme

Alanlar

Bugün ne yaptım

Yarın ilk yapacağım iş

Not

---

# Arşiv

Archive kolonundaki işler burada listelenmeli.

İstenirse geri alınabilmeli.

Kalıcı silme yapılabilmeli.

---

# Veritabanı

Supabase kullanıyoruz.

Ana dizinde

db.sql

dosyası mevcut.

Yeni tablolar ve migration SQL kodları doğrudan db.sql dosyasına eklensin.

Mevcut tablo yapısını bozma.

Mevcut project tablosuna uyumlu çalış.

Yeni tablolar oluştur.

Önerilen tablolar

deep_work_tasks

* id
* title
* description
* status
* priority
* estimated_minutes
* worked_minutes
* project_id
* planned_date
* completed_at
* archived_at
* created_at
* updated_at

deep_work_sessions

Her timer oturumu burada tutulacak.

Alanlar

* id
* task_id
* started_at
* ended_at
* duration_minutes

daily_reviews

Alanlar

* id
* review_date
* today_summary
* tomorrow_first_task
* notes
* created_at

İlişkileri foreign key ile oluştur.

project_id mevcut projects tablosuna bağlansın.

---

# RLS

Bu proje hızlı MVP olduğu için

Tüm yeni tablolar için

RLS kapalı olsun.

Policy oluşturma.

Authentication kontrolü ekleme.

---

# Kod Kalitesi

* Mevcut component yapısını kullan.
* Yeni UI mevcut tema ile tamamen uyumlu olsun.
* Responsive çalışsın.
* TypeScript tipleri eksiksiz olsun.
* Kod modüler olsun.
* CRUD işlemleri Supabase üzerinden yapılsın.
* Gereksiz bağımlılık ekleme.
* Drag & Drop stabil çalışsın.
* Timer sayfa yenilense bile doğru şekilde devam edebilsin veya geçen süre hesaplanarak senkronize olsun.
* Kodun tamamında okunabilirlik ön planda olsun.

Amaç, mevcut admin paneli içerisine entegre çalışan, günlük 2 saat odak çalışma sistemine sahip, sade ama güçlü bir üretkenlik modülü oluşturmaktır.
