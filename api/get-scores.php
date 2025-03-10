<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Debug için hata gösterimini aç
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Geçerli zaman
$currentTime = time();

// Zaman aralıklarını hesapla
$hourlyStartTime = $currentTime - 3600;    // Son 1 saat
$dailyStartTime = $currentTime - 86400;    // Son 24 saat
$weeklyStartTime = $currentTime - 604800;  // Son 7 gün

// Dosya yolunu kontrol et
$scoresFile = __DIR__ . '/scores.json';

// Skorları veritabanından veya JSON dosyasından al
$allScores = [];
if (file_exists($scoresFile)) {
    $scoresJson = file_get_contents($scoresFile);
    $jsonData = json_decode($scoresJson, true) ?: [];
    // scores anahtarının altındaki verileri al
    $allScores = isset($jsonData['scores']) ? $jsonData['scores'] : [];
}

// Filtreli skorları saklamak için diziler
$hourlyScores = [];
$dailyScores = [];
$weeklyScores = [];

// Debug için timestamp dönüşüm fonksiyonu
function normalizeTimestamp($timestamp) {
    // String ise sayıya çevir
    if (is_string($timestamp)) {
        $timestamp = (int)$timestamp;
    }
    
    // Milisaniye ise saniyeye çevir (13 haneli)
    if ($timestamp > 10000000000) {
        $timestamp = floor($timestamp / 1000);
    }
    
    return $timestamp;
}

// Skorları filtrele
foreach ($allScores as $score) {
    if (!isset($score['timestamp'])) {
        continue; // timestamp yoksa atla
    }
    
    // Timestamp'i normalize et
    $timestamp = normalizeTimestamp($score['timestamp']);
    
    // Debug için orijinal ve dönüştürülmüş timestamp'i sakla
    $score['_debug'] = [
        'original_timestamp' => $score['timestamp'],
        'normalized_timestamp' => $timestamp,
        'current_time' => $currentTime,
        'hourly_diff' => $timestamp - $hourlyStartTime,
        'daily_diff' => $timestamp - $dailyStartTime,
        'weekly_diff' => $timestamp - $weeklyStartTime
    ];
    
    // Zaman filtrelemesi
    if ($timestamp >= $weeklyStartTime) {
        $weeklyScores[] = $score;
        
        if ($timestamp >= $dailyStartTime) {
            $dailyScores[] = $score;
            
            if ($timestamp >= $hourlyStartTime) {
                $hourlyScores[] = $score;
            }
        }
    }
}

// Skorları puana göre sırala
function sortScores($a, $b) {
    return $b['score'] - $a['score'];
}

usort($hourlyScores, 'sortScores');
usort($dailyScores, 'sortScores');
usort($weeklyScores, 'sortScores');

// Debug bilgileri
$debug = [
    'current_time' => $currentTime,
    'time_ranges' => [
        'hourly_start' => $hourlyStartTime,
        'daily_start' => $dailyStartTime,
        'weekly_start' => $weeklyStartTime
    ],
    'sample_scores' => array_slice($allScores, 0, 3), // İlk 3 skoru örnek olarak göster
    'filtered_counts' => [
        'total' => count($allScores),
        'hourly' => count($hourlyScores),
        'daily' => count($dailyScores),
        'weekly' => count($weeklyScores)
    ]
];

// Sonucu JSON olarak döndür
echo json_encode([
    'success' => true,
    'last1Hour' => $hourlyScores,
    'last1Day' => $dailyScores,
    'last1Week' => $weeklyScores,
    'debug' => $debug
]);
?> 