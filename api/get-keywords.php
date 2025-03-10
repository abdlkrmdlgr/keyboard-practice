<?php
// CORS başlıkları
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Türkçe kelimeler dizisi - en çok kullanılan ve yaygın kelimeler
$keywords = [
    // Temel fiiller
    "olmak", "yapmak", "gelmek", "gitmek", "demek", "görmek", "vermek", "almak",
    "bilmek", "istemek", "bulmak", "çıkmak", "kalmak", "düşünmek", "bakmak", "sevmek",
    "söylemek", "duymak", "anlamak", "çalışmak", "oturmak", "konuşmak", "yemek", "içmek",
    "yaşamak", "okumak", "başlamak", "beklemek", "girmek", "geçmek", "kazanmak", "koymak",
    "getirmek", "açmak", "tutmak", "hissetmek", "yürümek", "düşmek", "kullanmak", "öğrenmek",
    "dinlemek", "yazmak", "satmak", "bitirmek", "uyumak", "izlemek", "oynamak", "koşmak",
    "geliştirmek", "paylaşmak", "düzenlemek", "taşımak", "yardım", "unutmak", "hatırlamak", "anlatmak",
    
    // Temel isimler
    "insan", "şey", "zaman", "gün", "adam", "çocuk", "yıl", "iş", 
    "kadın", "hayat", "yer", "yol", "ev", "göz", "el", "para", 
    "su", "kitap", "hava", "anne", "baba", "baş", "kapı", "arkadaş",
    "dünya", "ülke", "okul", "yüz", "ses", "şehir", "zaman", "araba",
    "kişi", "saat", "sorun", "oda", "gece", "sabah", "sokak", "yaşam",
    "konu", "aile", "fikir", "sistem", "hak", "tarih", "bilgi", "oyun",
    "enerji", "alan", "toplum", "bölüm", "soru", "cevap", "fırsat", "özellik",
    
    // Zamirler ve belirleyiciler
    "ben", "sen", "ona", "biz", "siz", "onlar", "kim", "nedir", "nasıl", 
    "neden", "hangi", "kaç", "başka", "herkes",
    "hiç", "her", "tüm", "bütün", "bazı", "birkaç", "kendi", "kendisi",
    "birisi", "kimse", "birbiri", "diğeri", "öteki", "herhangi", "öbürü", "hepsi",
    
    // Bağlaçlar ve edatlar
    "ayrıca", "ile", "için", "gibi", "kadar", "ama", "fakat", "çünkü",
    "dahi", "diye", "öyle", "acaba", "diye", "üzere", "göre", "rağmen",
    "dolayı", "nedeniyle", "sonra", "önce", "beri", "boyunca", "hakkında", "karşı",
    "ise", "eğer", "ancak", "hem", "veya", "yahut", "belki", "halbuki", "oysa", "zira", "meğer",
    
    // Sıfatlar
    "iyi", "güzel", "büyük", "küçük", "yeni", "eski", "doğru", "yanlış",
    "sıcak", "soğuk", "uzun", "kısa", "yüksek", "alçak", "kolay", "zor",
    "önemli", "açık", "kapalı", "hızlı", "yavaş", "güçlü", "zayıf", "genç",
    "yaşlı", "mutlu", "üzgün", "ucuz", "pahalı", "temiz", "kirli", "sağlam",
    "ilginç", "sıradan", "farklı", "benzer", "olumlu", "olumsuz", "boş", "dolu",
    "basit", "karmaşık", "etkili", "değerli", "sık", "seyrek", "geniş", "dar",
    
    // Renkler
    "kırmızı", "mavi", "yeşil", "sarı", "siyah", "beyaz", "mor", "turuncu",
    "pembe", "gri", "kahverengi", "bordo", "lacivert", "turkuaz", "altın", "gümüş",
    
    // Sayılar
    "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz",
    "dokuz", "on", "yüz", "bin", "milyon", "milyar", "ilk", "ikinci",
    
    // Zaman ifadeleri
    "bugün", "dün", "yarın", "şimdi", "sonra", "önce", "hemen", "birazdan",
    "geçen", "gelecek", "hafta", "ay", "yıl", "asır", "mevsim", "dakika",
    "saniye", "ertesi", "geç", "erken", "bahar", "yaz", "sonbahar", "kış",
    
    // Diğer yaygın kelimeler
    "evet", "hayır", "belki", "tamam", "lütfen", "teşekkür", "merhaba", "hoşçakal",
    "sağ", "sol", "art", "ön", "dış", "içeri", "alt", "üst",
    "azcık", "çok", "daha", "tam", "orta", "yan", "hep", "hiç",
    "geri", "ileri", "karşı", "arka", "hâlâ", "şimdi", "sonra", "önce",
    
    // Günlük hayatta kullanılan nesneler
    "telefon", "bilgisayar", "masa", "sandalye", "yatak", "pencere", "duvar", "tavan",
    "ışık", "lamba", "kalem", "kağıt", "çanta", "ayakkabı", "elbise", "yemek",
    "bardak", "tabak", "çatal", "bıçak", "ekmek", "kahve", "çay", "süt",
    "ateş", "deniz", "göl", "nehir", "dağ", "toprak", "ağaç", "çiçek",
    
    // Meslekler
    "öğretmen", "doktor", "mühendis", "avukat", "hemşire", "aşçı", "şoför", "polis",
    "pilot", "gazeteci", "çiftçi", "sanatçı", "müzisyen", "yazar", "programcı", "tasarımcı",
    "yönetici", "işçi", "memur", "teknisyen", "muhasebeci", "pazarlamacı", "psikolog", "dişçi",
    
    // Yiyecekler
    "ekmek", "peynir", "zeytin", "yumurta", "domates", "salatalık", "biber", "patlıcan",
    "et", "tavuk", "balık", "pilav", "makarna", "çorba", "salata", "meyve",
    "sebze", "patates", "soğan", "sarımsak", "elma", "portakal", "muz", "çilek",
    
    // Duygular
    "mutluluk", "üzüntü", "korku", "öfke", "şaşkınlık", "heyecan", "merak", "endişe",
    "gurur", "utanç", "sevgi", "nefret", "kıskançlık", "umut", "hayal", "kırıklığı", "minnettarlık",
    
    // Teknoloji terimleri
    "internet", "bilgisayar", "yazılım", "donanım", "uygulama", "dosya", "site", "şifre",
    "ekran", "klavye", "fare", "tablet", "wifi", "tarayıcı", "kamera", "posta",
    "bellek", "sunucu", "veri", "güncelleme", "indirmek", "yüklemek", "paylaşmak", "yedeklemek",
    
    // Eğitim ile ilgili
    "ders", "sınav", "not", "ödev", "proje", "kütüphane", "öğrenci", "öğretmen",
    "fakülte", "bölüm", "mezun", "diploma", "anlayış", "bilgi", "beceri", "eğitim",
    
    // Sağlık ile ilgili
    "sağlık", "hastalık", "ilaç", "doktor", "hastane", "ağrı", "tedavi", "muayene",
    "reçete", "diyet", "spor", "beslenme", "uyku", "egzersiz", "vitamin", "ateş",
    
    // Hava durumu
    "güneşli", "yağmurlu", "bulutlu", "sisli", "karlı", "rüzgarlı", "fırtınalı", "açık",
    "sıcak", "soğuk", "ılık", "serin", "nemli", "kuru", "dondurucu", "bunaltıcı",
    
    // Doğa ve çevre
    "doğa", "orman", "göl", "deniz", "okyanus", "dağ", "tepe", "vadi",
    "ada", "çöl", "iklim", "çevre", "ekosistem", "kirlilik", "geri dönüşüm", "enerji"
];

// JSON formatında kelimeleri döndür
echo json_encode($keywords);
?> 