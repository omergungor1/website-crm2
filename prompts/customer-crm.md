
### Müşteri Crm Yazılım:

Ana sayfada Dashboarda bir kısım ekleyelim. Müşteri Crm kısmı.

Müşteri Crm için detay ekran yazalım. Sadece admin bu crm açma butonunu görebilir ve bu crm sayfasını görebilir. Sayfa açılınca en üstte analitics altta listeler gelmelidir. 

Analitics kısmında tarih seçim kısmı olsun. Seçilen tarihin istatistiklerini listelesin. Varsayılan bugün gelmelidir. Tarih altında kartlar olsun. [Toplama Arama] [Olumlu] [Olumsuz] [Tekrar ara]


[+ Yeni Grup] -> Tıklayınca bir modal açılsın İsim ve .CSV liste upload kısmı olacak. Altında kaydet butonu. Kaydedince listeye müşteri grubu eklenecektir. Mobilyacılar, Çorbacılar, Berberler gibi...

Altta müşteri grup liste butonları yer almalıdır. Daha önce eklenen tüm müşteri grupları listelenmelidir. 

Bir müşteri grubu açılınca detay sayfası açılmalıdır. Her detay sayfasında tablar olmalıdır -> 
TAB yapısı:
Bekleyen (sayı)
Tekrar Ara (sayı)
Olumlu (sayı)
Olumsuz (sayı)

Her tab altında müşteri listesi çıkmalıdır. infinite scroll şeklinde her seferinde 10 müşteri yüklenmelidir. Bir gurupta binlerce müşteri olabilir. Bu nedenle bekleyen,tekrar ara, olumlu, olumsuz tüm müşteriler 10 lu infinite scroll şeklinde yüklenmelidir. Veri tabanı gereksiz yük oluşturmamalıdır. Bir müşteri kartında olması gerekenler şunlar: 
İşletme adı (bold)
Telefon
Küçük adres (il-ilçe yeterli)
🔘 Durum dropdown (olumlu, olumsuz, terkar ara + Tarih seçim)
📞 Ara butonu
🟢 WhatsApp
📍 Harita linki

Card üzerine tıklayınca detay kısım açılsın: TIKLANCA AÇILAN DETAY KISMI
ilk müşteri detay kısmı varsayılan açık gelmelidir. Başka bir müşteri cart tıklanırsa onun detay kısmı açılmalıdır.

Burada:

Not alanı
“Tekrar ara tarihi”
Geçmiş notlar
[Kaydet] butonu (Son eklenen notu önceki not ile birleştirip kaydeder. Tek bir not satırı var) -> Kaydet tıklayınca otomatik açık müşteri detayı kapanır sıradaki müşteri detayı açılır. -> olumlu, olumsuz, tekrar ara durumu değişmişse tab yeri değişmelidir. Kaydedince otomatik listeden o müşteri çıkartılmalıdır.

Tekrar ara” seçince -> tarih seç -> otomatik “Tekrar Ara” tabına düşsün




CSV upload ekle:
Grup eklerken upload alanına yükleyeceğim örnek bir csv liste şöyledir: 
business_name,maps_url,phone_number,province,district,web_site_url,adress,plus_code,latitude,longitude,rating,review_count,business_type,image_url,working_hours
Orta Mahalle Çilingir Anahtarcı,https://www.google.com/maps/place/%C3%87ilingir+Anahtarc%C4%B1/data=!4m7!3m6!1s0x14cabb29e966e7fd:0xa674b166701cea3d!8m2!3d41.0350173!4d28.9100405!16s%2Fg%2F11p0vwsp8t!19sChIJ_edm6Sm7yhQRPeoccGaxdKY?authuser=0&hl=tr&rclk=1,(0543) 166 84 63,İstanbul,Bayrampaşa,https://www.cilingir7-24.com/hizmet-bolgeleri/bayrampasa-anahtarci,"Orta mahalle demir kapı caddesi göksu sokak numara 9/5, 34035 Bayrampaşa/İstanbul","2WP6+22 Bayrampaşa, İstanbul",41.0350173,28.9100405,3.4,8,Çilingir,https://lh3.googleusercontent.com/p/AF1QipMdCSWF1JN_s7q5zLcc89K0nHz-kRG5bl9ksGDs=w426-h240-k-no,"{""Çarşamba"":""24 saat açık"",""Perşembe"":""09:00–17:00"",""Cuma"":""24 saat açık"",""Cumartesi"":""24 saat açık"",""Pazar"":""24 saat açık"",""Pazartesi"":""24 saat açık"",""Salı"":""24 saat açık""}"
Anahtarcı İsmail İhsaniye,https://www.google.com/maps/place/Anahtarc%C4%B1+%C4%B0smail/data=!4m7!3m6!1s0x409d3f13dc13dd9d:0xe28acb6785d27b44!8m2!3d40.7371998!4d31.6110652!16s%2Fg%2F1hc3g1b7v!19sChIJnd0T3BM_nUARRHvShWfLiuI?authuser=0&hl=tr&rclk=1,(0537) 438 50 81,Bolu,Bolu Merkez,,"İhsaniye, Çeşmeli Sk. No:3 D:C, 14200 Bolu Merkez/Bolu","PJP6+VC Okçular, Bolu Merkez/Bolu",40.7371998,31.6110652,4.3,12,Çilingir,https://lh3.googleusercontent.com/p/AF1QipO-9LioWjQPd9i4f7Qnii66IK_StKuNUc0I2tLx=w408-h544-k-no,"{""Çarşamba"":""24 saat açık"",""Perşembe"":""09:00–17:00"",""Cuma"":""24 saat açık"",""Cumartesi"":""24 saat açık"",""Pazar"":""24 saat açık"",""Pazartesi"":""24 saat açık"",""Salı"":""24 saat açık""}"
Tepebaşı Çilingir,https://www.google.com/maps/place/Tepeba%C5%9F%C4%B1+%C3%87ilingir/data=!4m7!3m6!1s0x14cc15d4f34ee633:0xdc4138c0f607570d!8m2!3d39.765343!4d30.5448145!16s%2Fg%2F11b678flj_!19sChIJM-ZO89QVzBQRDVcH9sA4Qdw?authuser=0&hl=tr&rclk=1,(0222) 330 83 23,Eskişehir,Tepebaşı,http://www.tepebasicilingir.com/,Şirintepe Mh. Gözüpek Sk. No:7/B Eskişehir,,39.765343,30.5448145,4.3,18,Çilingir,https://lh3.googleusercontent.com/p/AF1QipORm0Sf1vfjUWI6MqyBt4ggNAvDl0nsy3cLP1WL=w408-h306-k-no,"{""Çarşamba"":""24 saat açık"",""Perşembe"":""09:00–17:00"",""Cuma"":""24 saat açık"",""Cumartesi"":""24 saat açık"",""Pazar"":""24 saat açık"",""Pazartesi"":""24 saat açık"",""Salı"":""24 saat açık""}"
Akgül Oto Elektronik Anahtar,https://www.google.com/maps/place/Akg%C3%BCl+Oto+Elektronik+Anahtar/data=!4m7!3m6!1s0x14c38fde01916521:0x4706c07f0fe74c66!8m2!3d36.9004138!4d30.6888732!16s%2Fg%2F1tgfmfr2!19sChIJIWWRAd6PwxQRZkznD3_ABkc?authuser=0&hl=tr&rclk=1,(0532) 455 06 88,Antalya,Muratpaşa,http://akgulotoanahtar.com/ba,"Antalya Orman Müdürlüğü, Güvenlik Mah Anafartalar Caddesi, Karşısı No:157, 07040 Muratpaşa/Antalya",,36.9004138,30.6888732,4.8,120,Çilingir,https://lh3.googleusercontent.com/gps-cs-s/AG0ilSzRT5kt0FLg1z8LvMTVHRiXjqM3T13x47jJKvKZBTPas_vE3Vx2B_60P60nAy85TN3CxzEcbW8XdrDfpvj9qo0vZXah2A-9XiF2MoflScpJ3PacLs8EBnGADi8ZKArpWES1DW4=w408-h725-k-no,"{""Çarşamba"":""24 saat açık"",""Perşembe"":""09:00–17:00"",""Cuma"":""24 saat açık"",""Cumartesi"":""24 saat açık"",""Pazar"":""24 saat açık"",""Pazartesi"":""24 saat açık"",""Salı"":""24 saat açık""}"
Altınşehir Anahtar Çilingir,https://www.google.com/maps/place/ALTIN%C5%9EEH%C4%B0R+ANAHTAR+%C3%87%C4%B0L%C4%B0NG%C4%B0R/data=!4m7!3m6!1s0x15331378658148a5:0xb3b6d3e99535f728!8m2!3d37.7391664!4d38.229467!16s%2Fg%2F11c2pklx_w!19sChIJpUiBZXgTMxURKPc1lenTtrM?authuser=0&hl=tr&rclk=1,(0542) 260 80 02,Adıyaman,Adıyaman Merkez,,"Altınşehir, Gökkuşağı Cd. no: 3, 02100 Adıyaman Merkez/Adıyaman","P6QH+MQ Adıyaman Merkez, Adıyaman",37.7391664,38.229467,4.4,7,Anahtarcı,https://lh3.googleusercontent.com/p/AF1QipP4nwZbP5IejFxOrDObMBl-fH2NCiGDyFzwmVdE=w408-h905-k-no,"{""Çarşamba"":""24 saat açık"",""Perşembe"":""09:00–17:00"",""Cuma"":""24 saat açık"",""Cumartesi"":""24 saat açık"",""Pazar"":""24 saat açık"",""Pazartesi"":""24 saat açık"",""Salı"":""24 saat açık""}"
Arma Anahtar Evi,https://www.google.com/maps/place/Arma+Anahtar+Evi/data=!4m7!3m6!1s0x14b5d30b1e32d08f:0x63f33edf6d1bfc69!8m2!3d40.3500491!4d27.9687192!16s%2Fg%2F1x6n4h0q!19sChIJj9AyHgvTtRQRafwbbd8-82M?authuser=0&hl=tr&rclk=1,(0266) 714 77 01,Balıkesir,Bandırma,,"Paşabayır, Ordu Cd. 28/A, 10000 Bandırma/Balıkesir","9X29+2F Bandırma, Balıkesir",40.3500491,27.9687192,4,40,Çilingir,https://lh3.googleusercontent.com/gps-cs-s/AG0ilSzqMNFIlWH_GJCh2fqtCy_rv7Lng5lf8t6dSbZDsVPxfvBCEMsbI4lWEXXBF09auezqpRIgvmMeZ2zpvB8PCbCFM3I5P5LzMotJDNlEWqUGpPKntPTHOVkwMlZfsbMnPdoXd-mQ=w408-h519-k-no,"{""Çarşamba"":""00:00–23:30"",""Perşembe"":""00:00–23:30"",""Cuma"":""00:00–23:30"",""Cumartesi"":""00:00–23:30"",""Pazar"":""00:00–23:30"",""Pazartesi"":""00:00–23:30"",""Salı"":""00:00–23:30""}"


-> Gerekli tablo detaylarını db.sql dosyasından oku. crm_groups ve crm_customers iki tablomuz var. Gerekli crm kodlayalım.