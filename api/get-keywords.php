<?php
// CORS başlıkları
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Türkçe kelimeler dizisi - en çok kullanılan 200 kelime
$keywords = [
    // Temel fiiller
    "olmak", "yapmak", "gelmek", "gitmek", "demek", "görmek", "vermek", "almak",
    "bilmek", "istemek", "bulmak", "çıkmak", "kalmak", "düşünmek", "bakmak", "sevmek",
    "söylemek", "duymak", "anlamak", "çalışmak", "oturmak", "konuşmak", "yemek", "içmek",
    "yaşamak", "okumak", "başlamak", "beklemek", "girmek", "geçmek", "kazanmak", "koymak",
    "getirmek", "açmak", "tutmak", "hissetmek", "yürümek", "düşmek", "kullanmak", "öğrenmek",
    
    // Temel isimler
    "insan", "şey", "zaman", "gün", "adam", "çocuk", "yıl", "iş", 
    "kadın", "hayat", "yer", "yol", "ev", "göz", "el", "para", 
    "su", "kitap", "hava", "anne", "baba", "baş", "kapı", "arkadaş",
    "dünya", "ülke", "okul", "yüz", "ses", "şehir", "zaman", "araba",
    "kişi", "saat", "sorun", "oda", "gece", "sabah", "sokak", "yaşam",
    
    // Zamirler ve belirleyiciler
    "ben", "sen", "ona", "biz", "siz", "onlar", "bu", "şu", 
    "kim", "nedir", "nasıl", "neden", "hangi", "kaç", "başka", "herkes",
    "hiç", "her", "tüm", "bütün", "bazı", "birkaç", "kendi", "kendisi",
    
    // Bağlaçlar ve edatlar
    "ayrıca", "ile", "için", "gibi", "kadar", "ama", "fakat", "çünkü",
    "dahi", "diye", "öyle", "acaba", "diye", "üzere", "göre", "rağmen",
    "dolayı", "nedeniyle", "sonra", "önce", "beri", "boyunca", "hakkında", "karşı",
    
    // Sıfatlar
    "iyi", "güzel", "büyük", "küçük", "yeni", "eski", "doğru", "yanlış",
    "sıcak", "soğuk", "uzun", "kısa", "yüksek", "alçak", "kolay", "zor",
    "önemli", "açık", "kapalı", "hızlı", "yavaş", "güçlü", "zayıf", "genç",
    "yaşlı", "mutlu", "üzgün", "ucuz", "pahalı", "temiz", "kirli", "sağlam",
    
    // Diğer yaygın kelimeler
    "evet", "hayır", "belki", "tamam", "lütfen", "teşekkür", "merhaba", "hoşçakal",
    "sağ", "sol", "art", "ön", "dış", "içeri", "alt", "üst",
    "azcık", "çok", "daha", "tam", "orta", "yan", "hep", "hiç",
    "geri", "ileri", "karşı", "arka", "hâlâ", "şimdi", "sonra", "önce",
    
    // Günlük hayatta kullanılan nesneler
    "telefon", "bilgisayar", "masa", "sandalye", "yatak", "pencere", "duvar", "tavan",
    "ışık", "lamba", "kalem", "kağıt", "çanta", "ayakkabı", "elbise", "yemek",
    "bardak", "tabak", "çatal", "bıçak", "ekmek", "kahve", "çay", "süt",
    "ateş", "deniz", "göl", "nehir", "dağ", "toprak", "ağaç", "çiçek"
];

// JSON formatında kelimeleri döndür
echo json_encode($keywords);
?> 