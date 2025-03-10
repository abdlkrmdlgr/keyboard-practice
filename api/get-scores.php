<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Skor dosyasının yolu
$filePath = __DIR__ . '/scores.json';

try {
    // Dosya var mı kontrol et
    if (!file_exists($filePath)) {
        echo json_encode(['success' => true, 'scores' => []]);
        exit;
    }

    // Dosyayı oku
    $jsonContent = file_get_contents($filePath);
    $data = json_decode($jsonContent, true);

    if (!isset($data['scores'])) {
        echo json_encode(['success' => true, 'scores' => []]);
        exit;
    }

    $scores = $data['scores'];
    $timeFrame = $_GET['timeFrame'] ?? 'hourly';
    $currentTime = time();

    // Zaman aralığına göre filtrele
    switch ($timeFrame) {
        case 'hourly':
            $timeLimit = $currentTime - (60 * 60); // Son 1 saat
            break;
        case 'daily':
            $timeLimit = $currentTime - (24 * 60 * 60); // Son 24 saat
            break;
        case 'weekly':
            $timeLimit = $currentTime - (7 * 24 * 60 * 60); // Son 7 gün
            break;
        default:
            $timeLimit = $currentTime - (60 * 60); // Varsayılan: Son 1 saat
    }

    // Skorları filtrele ve sırala
    $filteredScores = array_filter($scores, function($score) use ($timeLimit) {
        $scoreTime = isset($score['timestamp']) ? $score['timestamp'] / 1000 : 0; // Milisaniyeden saniyeye çevir
        return $scoreTime > $timeLimit;
    });

    // Skorları puana göre sırala (yüksekten düşüğe)
    usort($filteredScores, function($a, $b) {
        return $b['score'] - $a['score'];
    });

    // İlk 100 skoru al
    $filteredScores = array_slice($filteredScores, 0, 100);

    echo json_encode([
        'success' => true,
        'scores' => $filteredScores
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Skorlar yüklenirken bir hata oluştu'
    ]);
}
?> 