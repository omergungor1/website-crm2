Şimdi bir crm uygulaması geliştiriyoruz. 
Projede suopabase psql, storage ve auth kullanacağız. 

Proje ilk açıldığında login form bizi karşılamalı. Login olmayan kimse diğer sayfaları göremez. 

Bu proje bir site yapma sürecinin crm yazılımıdır. Sistemi otomasyon ile daha kolay süreç yönetmek için yapıyoruz. Tüm proje mobil ve web uyumlu responsive olmalıdır. Mobil ve web de sorunsuz kullanılabilmelidir.


Sabit iki adet admin kullanıcı olacak. Bu adminler tüm projeleri listeleyebilir. Tüm güncellemeleri yapabilir. Admin kullanıcısı harici olanlar sadece kendi projelerini görebilir, editleyebilir. Bu kullanıcı admin mi diye api seviyesinde basit bir fonksiyon ekle. Admin kullanıcılarını oraya ekleyeyim ben. "omergungorco@gmail.com" ilk admin kullanıcımız. 



Proje ilk açıldığı zaman login ve signup form bizi karşılayacaktır. Ardından login olunca dashboard açılacaktır. Dashboardda [+ Yeni Site] ekle butonu olmalıdır. Altında tüm ilgili siteler listelenmelidir. (Admin kullanıcısında tüm siteler listelenmelidir. Normal kullanıcıda sadece kendi site projeleri listelenmelidir.) Kullanıcı bir siteye tıklar ve sitenin detay sayfası açılır. 


Detay sayfasında site ile ilgili bilgiler yer almalıdır. Ayrıca şu ayar sayfalarını açacak butonlar eklenmelidir. -> Domain, Blog, Kurulum Formu, Güncelleme Formu, Mesaj, Ayarlar

Her buton site ile ilgili ayarlamaların yapılacağı sayfayı açmalıdır. 
- Domainler: kullanıcı web sitesine domain ekleyebilir, silebilir "ilk eklenen domain ana domain seçilir. Kullanıcı istediği domaini ana domain seçebilir." -> Tüm projeler vercelde serve ediliyor. Bu nedenle domaini bağla butonu olmalıdır. Vervel NS ve DNS ayarları için gerekli talimatları açan birer kurulum modalı açılmalıdır. 
- Blog: MVP de olmayacak. Daha sonra eklenecek. Sadece ilgili sayfayı üret boş dursun.
- Kurulum formu: aşağıda vereceğim kurulum bilgilerinin doldurulacağı formdur. Kullanıcı paylaş butonu ile bu sayfayı paylaşabilir. Bu sayfa kurulum form linki login olmadan da açılabilmeli ve editlenebilmelidir. Bu formu müşteri ile paylaşacağız. Kullanıcı gerekli bilgileri dolduracaktır. Bu kurulum formunu login olmadan kullanıcı açabilmeli, güncelleyebilmeli ve kaydedebilmelidir. Kurulum formunda neler olacağını aşağıda detaylı paylaşacağım. Kurulum formu her proje için bir tanedir. Paylaşılıp harici doldurulup güncellenebileceği gibi, kullanıcı paylaş yapmadan da crm içinde doldurup güncelleyebilir. Kullanıcı admin kullanıcısı ise -> kurulum formu içinde prompt butonu olmalıdır. Bu buton prompt modalını açmalıdır. Tıklayınca modal açılsın ve metin olarak prompt yazsın. İndir butonu ile indirilebilir bir CURSOR ai editör için hazır site yapmaya yarayan prompt dosyası indirsin. Kullanıcının doldurduğu bilgileri kullanarak siteyi anlatan bir prompt dosyası olmalıdır. Bu promptu ai editöre verince istenilen web sitesini başarıyla üretebilmesi gerekmektedir. Normal kullanıcılar bu prompt buton ve modalını görüntüleyememelidir.!  ai editör istenen siteyi başarıyla yapabileceği bir kalitede prompt üretmesi gerekmektedir. Bu promptu editöre verip istenen siteyi ai ile otomatik yaptırılacaktır.
- Edit form: edit talepleri her site için birden fazla olabilir. güncelleme talepleri listelesidir. [+ Yeni Güncelleme] ile yeni güncelleme talebi açılabilmelidir. Kullanıcı güncelleme talebini buraya girmelidir. Formda şunlar olmalıdır: 1- Sayfa seç (Sabit sayfa isimleri olacak, çoklu seçim yapılabilir. Tüm sayfalar seçimi de olsun. Sabit şu sayfaları yazalım: Ana sayfa, hakkımızda, iletişim, hizmetler, hizmet bölgeleri, Özel -> kullanıcı domain veya açıklama yazar.). 2- Detaylı açıklama (Bu seçilen sayfalarda hangi güncellemeleri yapmak istiyor, bunu detaylı anlatsın) 3-Görsel yükleme (Eğer görsel güncelleme isteniyorsa görselleri yüklesin. Çoklu görsel yüklenebilmelidir. max 20 görsel, resimler max 3mb) -> Talebi kaydet butonu. Kaydedilen talepler beklemede ise güncellenebilmelidir. yapılıyor veya tamamlandı ise güncellenemez -> Her edit talebi içinde bir prompt butonu olmalıdır. Admin kullanıcısında bu prompt butonu çıkmalı. Ayrıca güncelleme durumunu editleyebilmelidir admin. Normal kullanıcı bu butonları göremezler. Güncellemede sadece prompt kopyala yeterlidir. Kopyala yapıştır yapıp ai editöre istenen güncellemeyi yapması sağlanabilir. ai editör istenen güncellemeyi kolayca yapabileceği bir kalitede prompt üretmesi gerekmektedir. Bu promptu editöre verip istenen güncelleme ai ile otomatik yaptırılacaktır.
- Mesajlar: MVP de olmayacak. Sadece sayfasını ekle ve boş kalsın
- Site Ayarları: WEb sitesinin genel ayarları burada olacaktır. Burada kullanıcı şunları görebilir ve güncelleyebilmelidir -> Google analitics kurulum, search consol kurulum.





### “Kurulum Formu” Details
- İşletme adı
- telefon → wp kullanıyor musun?
- adres
- Google map linki
- Çalışma saatleri
- Menü ve ürünler
- Paket servis var mı?
- Site içinde kullanılmasını istediğin görseller
- Sektör
- Dükkan resimlerini yükle (isteğe bağlı galeri)
- Logonuz varsa yükleyin → hayır sistem benim için uygun bir logo üretsin (openai apisi ile kullanıcı ai ile üret tıklarsa chatgpt apisi ile otomatik logo üretilsin ve storage kaydedilsin. dosya yolu da tabloya kaydedilsin. Logo önizmelemesi gösterilmelidir. Güzel bir prompt yazalım logo üreten ai için. Logo metin içermemelidir! Hizmet ile uyumlu bir renk paleti içermelidir. )
- Verdiğiniz hizmetleri yazınız
- sosyal hesap linklerini yapıştı
- google işletme hesap linkini yapıştır
- domain seç → boştaki domainleri kontrol + tr karakter içermemelidir…!
    - → Önerilen abc.com
    - https://whois.whoisxmlapi.com/pricing
    - https://domain-availability.whoisxmlapi.com/api
- Aktif kullandığınız mail adresini yazınız
- Uygun renk palet önerisi ver 3 adet → kullanıcı seçsin? → uyumlu renk ai karar versin -> ai hizmet sektöre uygun renk paleti generate etsin.
- Sayfaları ayarlayın
    - KVKK / gizlilik sözleşmesi sayfaları istiyor musun?
- Marka dili: resmi / samimi / genç / premium
- Rakip örnek site (beğendiği stil) → ne kadar benzetelim?
    - ( ) az  ( ) orta ( ) çok
- Ana hedef ne?
    - arama
    - WhatsApp
    - rezervasyon
    - sipariş
- İçerik boşluklarını doldurmak için
    - “Hakkımızda” metni (ya da AI yazsın checkbox -> Ai ile yaz butonu tıklayınca en az x uzunlukta açıklama yazılmalıdır. Ai örnek alacaktır bu metni. Ai ile üret yapılınca metni güncellesin. env dosyasına OPENAI_API_KEY ekledim)
    - Slogan / kısa açıklama
- Yetkili adı (Bizim için)
- Yetkili iletişim telefonu (biz ulaşmak istersek)

---

- Hangi sayfalar olsun? → ( silme&ekleme )
    - Ana Sayfa (silinemez)
    - Hizmetler → input [hizmet adı, açıklama] [+ Hizmet Ekle] → elle gir, açıklama, Görsel
    - Hizmet bölgeleri → elle manuel ekle, belki açıklama alanı da ekle
    - İletişim
    - Hakkımızda → İşletmeni kısaca anlat:…
    - Galeri
    - Yorumlar → “ABC çilingir yorumları” long tail trafiği çeker → mapten çek, ben el ile yazacağım?
    - Blog (Ekstra özellik)
    - Kampanyalar / Fiyatlar
    - Ürünler → tek tek ekle, resim sistem ayarlasın-ben yükleyeceğim
    



- Ana sayfada [+ Yeni Site] butonu ekle -> tıklayınca proje adı için input alan+ Oluştur butonu çıksın, proje adı yazıp oluştura basınca proje oluşturulsun ve proje detay sayfası otomatik açılsın
- Altta proje listesi olacak. Üzerine tıklayınca projelerin detay sayfaları açılmalıdır.
- Proje detay sayfasında Kurulum Formu, Güncelleme Formu, Blog, Mesajlar, Domain, Ayarlar sekmeleri olmalıdır. Tamamen mobil uyumlu çalışmalıdır.
- Domain sayfasında domain input alanı ve [+Domain Ekle] butonu olmalı, eklenen domain alttaki domain listesine eklenecektir. Eklenen ilk domain ana domaindir. Kullanıcı diğer domainlerden birini de ana domaşn yapıp güncelleyebilir. -> Domain bağlama için vercel deki bağlama talimat benzeri talimat butonu ekle. Ns ile hangi ayarı girmesi gerektiğini gösterelim. Vercel NS adreslerini yazalım yeterlidir.
- Kurulum formu üzerinde paylaş butonu olmalıdır. Bu link ile kullanıcı login olmadan da kurulum formunu editleyebilir. PRoje eklenir eklenmez kurulum linkini de üretmelisin. Kurulum formu işletme adı, sektör, yetkili telefon içermelidir. (Telefonlar cep veya sabit olabilir. Ona göre formatlama yapmalısın. Eksik veya fazla girilmemelidir. Cep 05XX XXX XX XX Sabit: 0XXX XXX XX XX formatını kullanacaksın). Cep tel yanında "Whatsap butonu siteye ekleyelim" checkBox ekle. Adres ve Google map işletme linki input, ÇAlışma saatleri girme kısmı olmalıdır. Pazartesi-pazar arası []24 Saat Açık, Açılış kapanış saat kısımları olmalı. 24 Saat seçili ise saat sormaz. İstediğiniz domainler kısmı olacak form içinde. domain insert + Domain ekle butonu olmalı. Eklenen domainler altta listeye düşmelidir. İstemediğim domainleri x butonundan yanında silinebilmelidir. Marka dili, Beğendiğiniz örnek alıncak site, Ne kadar benzesin(radio), Ana hedef (radio)
, Slogan ve Hakkımızda metni -> Ai ile yaz özellik butonlarını ekle. Chatgpt api ekleyeceğiz. Sosyal hesap linkleri istenilen bir kısım olacak: instagram, facebook, Youtube, Diğer (input). Renk palet seçim alanı -> radio olarak Ai uyumlu renk paleti bulsun, Renk palet örneğinden seçim ve elle gireceğim. Renk palet seçilirse örnek 10 adet renk paleti içinden biri seçilmelidir. Renkler Yuvarlak yuvarlak iç içe geçmiş modern renk paleti görünümünde olmalıdır. Logo -> sistem bana uygun logo üretsin veya upload ile yükleme. Yüklerse önizleme göster. Hizmet gir -> input+ekle -> listede x ile silme, Hizmet bölgesi input+ekle -> x ile silme, Menü ve ürünler -> Başlık, açıklama+ekle -> x ile silme butonu. Sitede hangi sayfalar olsun çoklu seçim kısmı. export const POPULAR_PAGE_LABELS = [
  'Ana Sayfa',
  'Hizmetler',
  'İletişim',
  'Hakkımızda',
  'Galeri',
  'Blog',
  'Kampanyalar / Fiyatlar',
  'Ürünler',
  'S.S.S. (sık sorulan sorular)',
  'Referanslar',
  'KVKK',
  'Gizlilik sözleşmesi',
]; -> özel sayfa ekle input+ekle -> x ile sil özelliği. Site görsel upload alanı -> upload drop alanı max 20 görsel 3mb limit. Yüklenen görseller önizleme ile gösterilmeli, x ile silme özelliği ekle. Mobilde sticky [Kaydet] || [Kaydet ve Gönder] butonları olmalı. KAydet sunucuya kaydeder veya günceller. Kaydet ve gönder edit özelliğini kapatır ve kaydeder. Kaydet ve gönder onay modal aç ve Kaydedip kurulum formunu site yapımına göndermek istediğinize emin misiniz benzeri açıklama yazacak.  

- Güncelleme formu: [+Yeni Güncelleme] ile yeni güncelleme formu açılır -> sayfa seçim en üstte tüm sayfalar ile sayfa tek tek seçilmesin. Tüm sayfalar check olursa sayfa seçim gözükmemelidir. Sayfalar çoklu seçilebilmelidir. Detay açıklama (Hangi güncellemeyi istiyorsunuz.) Görsel yükleme upload alanı, yüklenen görse önizmele yapılmalı ve x ile görsel silinebilmelidir. [Kaydet] butonu olacak. Kaydedince alttaki güncelleme talep listesine eklenir. Birdaha güncellenemez veya silinemez. Sadece talep durumu ve detayı gösterilir. 

- Blog, mesajlar kısımları MVP de boş olacak. Sadece sayfalarını oluştur. 
- Ayarlar: Site Ayarları
Google Analytics ve Search Console bilgilerini buradan yönetebilirsiniz.

Google Analytics ID
Örn: G-XXXXXXXXXX
Search Console
Doğrulama kodu / property / not
[Kaydet] olmalıdır. 






Kurulum formu link ile gönderilebilir ve kullanıcı login olmadan doldurup güncelleyebilmelidir.
Güncelleme formu da paylaşılabilir bir linki olmalıdır. Bu link ile kullanıcı ilgili siten için yeni güncelleme talebi oluşturabilmelidir. Kaydedince talbiniz başarıyla alınmıştır. En kısa sürede dönüş yapılacaktır gibi başarı sayfasına yönlendirmelisin. Tüm proje mobil uyumlu olmalıdır. Admin kullanıcısı tüm projeleri listeleyebilir. Diğer kullanıcılar sadece kendi projelerini listeleyebilir. Yeni ehsap eklerken şimdilik mail onay gerekmesin. 


İlgili veritabanı tablo bilgisini DB.sql dosyasından okuyabilirsin. Gerekli gördüğün bir tablo alanını güncelleybilirsin.

env için .env.local
tablo detayları için db.sql
env içindeki bilgiler: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, ADMIN_EMAILS, DATABASE_URL, OPENAI_API_KEY 


Tüm db.Sql dosyasını oku ve tablo yapısını anla. Şuan tüm RLS ler kapalı. MVP geliştiriyoruz. Bu nedenle hızla ortaya ürün çıkması gerekiyor. RLS sonra ayarlayacağız. Ancak süreç, ui, kullanıcı ne yapması gerektiğini kolayca anlayabilmelidir.




! Tüm bu proje için detaylı bir todoList çıkart. Bitirdiğin maddeleri tik işaretle. Sırayla tüm maddeleri eksiksiz tamamla. 