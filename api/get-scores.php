<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Dosya yolunu belirle
$filePath = __DIR__ . '/sample-scores.json';

// Debug kodlarını kaldır
// header('Content-Type: text/plain');
// echo "Debug bilgileri..."

// Varsayılan yanıt yapısı
$response = [
    'success' => false,
    'scores' => [],
    'message' => 'Skorlar yüklenemedi'
];

// GET parametresi olarak zaman dilimini al
$timeFrame = isset($_GET['timeFrame']) ? $_GET['timeFrame'] : 'all';

// Mevcut skorları oku
if (file_exists($filePath)) {
    $jsonContent = file_get_contents($filePath);
    $jsonData = json_decode($jsonContent, true);
    
    if ($jsonData !== null && isset($jsonData['scores'])) {
        $scores = $jsonData['scores'];
        
        // Referans zaman
        $referenceTime = 1693571000000; // En yeni veri zamanı
            
        // Zaman aralıkları
        $HOUR_MS = 60 * 60 * 1000;
        $DAY_MS = 24 * $HOUR_MS;
        $WEEK_MS = 7 * $DAY_MS;
        
        // Zaman dilimine göre filtrele
        if ($timeFrame !== 'all') {
            $filteredScores = [];
            
            foreach ($scores as $score) {
                $timeDiff = $referenceTime - $score['timestamp'];
                
                if ($timeFrame === 'hourly' && $timeDiff < $HOUR_MS) {
                    $filteredScores[] = $score;
                } else if ($timeFrame === 'daily' && $timeDiff < $DAY_MS) {
                    $filteredScores[] = $score;
                } else if ($timeFrame === 'weekly' && $timeDiff < $WEEK_MS) {
                    $filteredScores[] = $score;
                }
            }
            
            $scores = $filteredScores;
        }
        
        // Puana göre sırala
        usort($scores, function($a, $b) {
            return $b['score'] - $a['score'];
        });

        $response = [
            'success' => true,
            'scores' => $scores,
            'message' => 'Skorlar başarıyla yüklendi'
        ];
    }
}

// "exit" ifadesini kaldırın!
// exit;

echo json_encode($response);
?> 