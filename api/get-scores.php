<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Skor dosyasının yolu
$filePath = __DIR__ . '/scores.json';

try {
    // Dosya var mı kontrol et
    if (!file_exists($filePath)) {
        echo json_encode([
            'success' => true,
            'last1Hour' => [],
            'last1Day' => [],
            'last1Week' => []
        ]);
        exit;
    }

    // Dosyayı oku
    $jsonContent = file_get_contents($filePath);
    $data = json_decode($jsonContent, true);

    if (!isset($data['scores']) || !is_array($data['scores'])) {
        echo json_encode([
            'success' => true,
            'last1Hour' => [],
            'last1Day' => [],
            'last1Week' => []
        ]);
        exit;
    }

    $scores = $data['scores'];
    $currentTime = time();

    // Skorları filtrele ve sırala
    $lastHourScores = array_filter($scores, function($score) use ($currentTime) {
        return isset($score['timestamp']) && 
               ($score['timestamp'] / 1000) > ($currentTime - (60 * 60));
    });

    $lastDayScores = array_filter($scores, function($score) use ($currentTime) {
        return isset($score['timestamp']) && 
               ($score['timestamp'] / 1000) > ($currentTime - (24 * 60 * 60));
    });

    $lastWeekScores = array_filter($scores, function($score) use ($currentTime) {
        return isset($score['timestamp']) && 
               ($score['timestamp'] / 1000) > ($currentTime - (7 * 24 * 60 * 60));
    });

    // Her bir zaman aralığı için skorları sırala
    $sortScores = function($scores) {
        if (empty($scores)) return [];
        
        usort($scores, function($a, $b) {
            return $b['score'] - $a['score'];
        });
        return array_slice($scores, 0, 100);
    };

    echo json_encode([
        'success' => true,
        'last1Hour' => $sortScores($lastHourScores),
        'last1Day' => $sortScores($lastDayScores),
        'last1Week' => $sortScores($lastWeekScores)
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Skorlar yüklenirken bir hata oluştu',
        'last1Hour' => [],
        'last1Day' => [],
        'last1Week' => []
    ]);
}
?> 