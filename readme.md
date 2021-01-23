# ScrumIT XP Temelli Scrum Task Board Uygulaması - Final Projesi
## HAZIRLAYAN: ALİ BAŞKÖYLÜ

## [PROJEYİ ÇALIŞIR HALDE GÖRMEK İÇİN TIKLAYIN](https://ali-baskoylu.herokuapp.com/)

#### Kullanıcı adı: deneme

#### Şifre: deneme 

### EKLENEN İŞLERE GÖRE PROJE BÜYÜKLÜĞÜ TAHMİNLEMESİ
Projenin ne kadar süreceği tahmin edilirken projede kullanıcı tarafından belirlenen iş zorluğu çarpı işin başlık ve açıklama metni toplam uzunlukları bölü 40 denklemi uygulanır. Deneme yanılmalar sonucu denklemde en ideal orantıyı 40 a böldüğümüzde almaktayız. Denklem gün olarak sonuç verir. Ölçümler her iş için ayrı ayrı proje görüntüleme ekranında yazar.

### KULLANILAN TEKNOLOJİLER: 
- Node | Yazılımın temel mimarisi Node üzerine kuruludur.
- ExpressJS | GET, POST gibi metodlarla gelen API üç nokta istekleri ExpressJS yardımı ile yanıtlanmıştır.
- EJS | HTML dosyalarının içine dinamik olarak güncellebilen veri koymaya yarayan Express ile koordine çalışan taslak yapısıdır. PHP ye benzer çalışır. 
- ExpressJS-Sessions | Oturumlar ve kullanıcı sisteminin client üzerindeki hareketleri ExpressJS-Sessions ile şifreli ve güvenli bir şekilde sağlanmıştır.
- Database-JS | Ekstra yapı(MySQL, SQLite...) ya da sunucu kullanılmaya gerek kalmadan JSON dosyaları üzerinden veritabanı oluşturulmuş ve SQL syntax ile kullanılmıştır.
- JQuery | Temel DOM ve JavaScript işlemlerini kolaylaştırmıştır.
- BootStrap | Kullanışlı, modern, gelişmiş ve etkileyici bir arayüzün çok fazla CSS ile yüz göz olunmadan oluşturulmasını sağlamıştır.
- MD5 Kripto Algoritması | Kullanıcıların şifreleri sunucu tarafında MD5 kriptolu hash olarak tutulmuş ve sunucudaki verilerin çalınması halinde bile kullanıcı şifrelerinin gizli kalması sağlanmıştır.
- Body-Parser | Form GET-POST verilerinin çözümlenmesine yardımcı bir pakettir.

### ScrumIT TEKNIK DETAYLAR
- Yaklaşık 1000 satır kod yazılmıştır. Yazılımın ileride geliştirilmesini zorlaştırmayacak bütün gereksiz kod tekrarı özellikle kullanılan Node paketleri sayesinde engellenmiştir.
- Çalışma süresi ve işlem yükü tölere edilebilir seviyededir.
- Az kullanılan döngüler sayesinde sunucu eş zamanlı olarak düşük ping ile binlerce kullanıcıya sorunsuzca client açabilir.
- Temel güvenlik testlerinden geçmiştir.
- İzinsiz dosya konumlarına ekstra güvenlik için Express aracılığı ile belirli olanlar harici HTTP GET ya da POST tamamen yasaklanmıştır.
- XSS açıklarına karşı ekstra önlem olarak JS ve CSS dosyaları özel 2 adet API uç noktasından temin edilmektedir.
- Kolayca tek rakam değişikliği ile veya sunucuda PORT isimli ortam değişkeni belirlenerek herhangi bir port üzerinden çalıştırılabilir.
