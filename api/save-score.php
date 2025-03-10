<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// POST verisi alındı mı kontrol et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Sadece POST istekleri kabul edilir']);
    exit;
}

// POST verisini al
$postData = file_get_contents('php://input');
$scoreData = json_decode($postData, true);

// Veri geçerli mi kontrol et
if (!$scoreData || !isset($scoreData['username']) || !isset($scoreData['score'])) {
    echo json_encode(['success' => false, 'message' => 'Geçersiz veri formatı']);
    exit;
}

// Eğer keystrokeCount yoksa veya sıfır ise, ortalama vuruş sayısıyla tahmin yap
if (!isset($scoreData['keystrokeCount']) || $scoreData['keystrokeCount'] <= 0) {
    // Ortalama olarak kelime başına 5 vuruş varsayalım
    $wordCount = isset($scoreData['wordCount']) ? $scoreData['wordCount'] : 0;
    $scoreData['keystrokeCount'] = $wordCount * 5;
}

// Eğer wordCount yoksa, kontrol et
if (!isset($scoreData['wordCount'])) {
    $scoreData['wordCount'] = 0;
}

// Dosya yolunu belirle
$filePath = __DIR__ . '/sample-scores.json';

// Mevcut skorları oku
if (file_exists($filePath)) {
    $jsonContent = file_get_contents($filePath);
    $jsonData = json_decode($jsonContent, true);
    
    // Geçerli JSON okundu mu kontrol et
    if ($jsonData === null) {
        $jsonData = ['scores' => []];
    } elseif (!isset($jsonData['scores'])) {
        // Eğer 'scores' alanı yoksa oluştur
        $jsonData['scores'] = [];
    }
} else {
    // Dosya yoksa yeni yapı oluştur
    $jsonData = ['scores' => []];
}

// Yeni skoru ekle
$jsonData['scores'][] = $scoreData;

// Dosyaya yaz
$success = file_put_contents($filePath, json_encode($jsonData, JSON_PRETTY_PRINT));

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Skor başarıyla kaydedildi']);
} else {
    echo json_encode(['success' => false, 'message' => 'Skor kaydedilirken bir hata oluştu']);
}
?> 