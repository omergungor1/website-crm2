# KEYWORD EXPLORER MODÜLÜ

Bu modül local SEO odaklı çalışan işletmeler için gelişmiş keyword keşif sistemidir.

Amaç blog yazısı üretmek değil, yüksek trafik potansiyeli olan SEO fırsatlarını keşfetmektir.

Sistem proje bazlı çalışır.

Her proje altında Keyword Explorer sekmesi bulunur.

---

1. KEYWORD GROUPS

Kullanıcı sınırsız sayıda keyword grubu oluşturabilir.

Örnek:

Ana Hizmet:

* çilingir
* oto çilingir
* anahtarcı

Lokasyon:

* bursa
* ankara
* izmir

Intent:

* fiyat
* ücret
* ne kadar
* 7 24
* acil

Sistem tüm kombinasyonları üretir.

Örnek:

çilingir bursa fiyat
çilingir bursa ücret
çilingir ankara fiyat
oto çilingir izmir acil

---

2. AI KEYWORD EXPANSION

Kullanıcı isterse ChatGPT API kullanarak keyword fikirleri üretebilir.

AI aşağıdaki görevleri yapabilir:

* Ana keywordlerden yeni keyword üretmek
* Rakip olabilecek varyasyonlar bulmak
* Local SEO fırsatları üretmek
* Soru bazlı keywordler üretmek
* Ticari niyet taşıyan keywordler üretmek
* Blog başlığı fırsatları üretmek

Üretilen tüm keywordler keyword_candidates tablosuna kaydedilir.

---

3. GOOGLE AUTOCOMPLETE EXPANSION

Sistem oluşturulan keywordleri Google autocomplete servisine gönderir.

Örnek:

çilingir bursa fiyat

Google'dan dönen sonuçlar alınır.

Ayrıca aşağıdaki varyasyonlar da çalıştırılır:

çilingir bursa fiyat a
çilingir bursa fiyat b
çilingir bursa fiyat c

...

çilingir bursa fiyat z

Amaç autocomplete verisini maksimum genişletmektir.

Bulunan tüm keywordler keyword_candidates tablosuna kaydedilir.

---

4. LOCATION GENERATOR

Local SEO için şehir ve ilçe bazlı keywordler üretir.

Örnek:

çilingir

çıktılar:

bursa çilingir
nilüfer çilingir
osmangazi çilingir
kestel çilingir
yıldırım çilingir

Bu keywordler candidate listesine eklenir.

---

5. LOCAL SEO GOLDMINE

Sistem otomatik SEO fırsatları üretir.

Örnek:

Bursa çilingir fiyatları
Nilüfer oto çilingir
Anahtar içeride kaldı ne yapmalıyım
Kapı açma ücreti
7/24 çilingir hizmeti

Bu öneriler AI tarafından oluşturulur.

---

6. INTENT DETECTOR

Her keyword otomatik etiketlenir.

Local
Commercial
Informational
Emergency
Transactional
Navigational

Alanı search_intent olarak kaydedilir.

---

7. OPPORTUNITY SCORING

Her keyword için fırsat puanı hesaplanır.

0-100 arasında skor üretilir.

Örnek puan faktörleri:

* şehir içeriyor
* ilçe içeriyor
* fiyat intenti içeriyor
* acil intenti içeriyor
* soru intenti içeriyor
* long tail içeriyor

Skor keyword_candidates.score alanına yazılır.

---

8. KEYWORD CANDIDATES

Bulunan tüm keywordler tabloda gösterilir.

Kolonlar:

Keyword
Intent
Score
Source
Cluster

Kullanıcı:

* tek tek seçebilir
* çoklu seçebilir
* tümünü seçebilir

---

9. SAVE TO PROJECT

Seçilen keywordler project_keywords tablosuna aktarılır.

Bunlar ileride içerik üretme modülünde kullanılacaktır.

---

10. CLUSTER OLUŞTURMA

AI benzer keywordleri gruplandırabilir.

Örnek:

Cluster:
Bursa Çilingir

İçindekiler:

Bursa çilingir
Bursa çilingir fiyatları
Bursa acil çilingir
Bursa oto çilingir

Bu yapı daha sonra içerik planlama ekranında kullanılacaktır.


google autocomplete servisini kullanarak long tail keywordleri keşfedeceğiz.