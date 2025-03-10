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

// POST verilerini al
$data = json_decode(file_get_contents('php://input'), true);

// Eksik değerler için varsayılan değerler ata
$data['accuracy'] = $data['accuracy'] ?? 0;
$data['incorrectWords'] = $data['incorrectWords'] ?? 0;

// Gerekli alanların varlığını kontrol et
if (!isset($data['username']) || !isset($data['score']) || 
    !isset($data['wordCount']) || !isset($data['keystrokeCount'])) {
    echo json_encode(['success' => false, 'message' => 'Geçersiz skor değeri']);
    exit;
}

// Verileri al
$username = $data['username'];
$score = intval($data['score']);
$correctWords = intval($data['wordCount']);
$incorrectWords = intval($data['incorrectWords']);
$keystrokeCount = intval($data['keystrokeCount']);
$accuracy = intval($data['accuracy']);
if($keystrokeCount < $correctWords*2){
    echo json_encode(['success' => false, 'message' => 'Geçersiz skor değeri']);
    exit;
}
// Reverse validation - Puanı tekrar hesapla
function calculateScore($correctWords, $keystrokeCount, $accuracy) {
    // Frontend'deki hesaplamanın aynısı
    $baseScore = round(($correctWords * 10) + ($keystrokeCount * 0.2));
    return round($baseScore * ($accuracy / 100));
}

// Backend'de puanı hesapla
$calculatedScore = calculateScore($correctWords, $keystrokeCount, $accuracy);

// Tolerans değeri (yuvarlama farklılıkları için)
$tolerance = 5;

// Gönderilen puan ile hesaplanan puan arasındaki farkı kontrol et
if (abs($score - $calculatedScore) > $tolerance) {
    echo json_encode([
        'success' => false, 
        'message' => 'Geçersiz skor değeri'
    ]);
    exit;
}

// Diğer validasyonlar
if ($accuracy < 0 || $accuracy > 100) {
    echo json_encode([
        'success' => false, 
        'message' => 'Geçersiz skor değeri'
    ]);
    exit;
}

if ($correctWords < 0 || $incorrectWords < 0 || $keystrokeCount < 0) {
    echo json_encode([
        'success' => false, 
        'message' => 'Geçersiz sayısal değerler'
    ]);
    exit;
}

// Toplam kelime sayısı ile doğruluk oranı tutarlılığını kontrol et
$totalWords = $correctWords + $incorrectWords;
if ($totalWords > 0) {
    $calculatedAccuracy = round(($correctWords / $totalWords) * 100);
    if (abs($calculatedAccuracy - $accuracy) > $tolerance) {
        echo json_encode([
            'success' => false, 
            'message' => 'Tutarsız doğruluk oranı'
        ]);
        exit;
    }
}

// Tüm validasyonlar geçildiyse skoru kaydet
try {
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
    $jsonData['scores'][] = $data;

    // Dosyaya yaz
    $success = file_put_contents($filePath, json_encode($jsonData, JSON_PRETTY_PRINT));

    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Skor başarıyla kaydedildi']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Skor kaydedilirken bir hata oluştu']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Veritabanı hatası']);
}
?> 