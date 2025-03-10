<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Dosya yolu sorununu çözmek için farklı olası yolları deneyelim
$scoresFile = __DIR__ . '/sample-scores.json';

// Dosya mevcut değilse diğer olası yolları dene
if (!file_exists($scoresFile)) {
    $scoresFile = dirname(__DIR__) . '/api/sample-scores.json';
    
    if (!file_exists($scoresFile)) {
        $scoresFile = dirname(__DIR__) . '/sample-scores.json';
    }
}

// Dosyanın varlığını kontrol et
if (!file_exists($scoresFile)) {
    echo json_encode([
        'error' => 'Skor dosyası bulunamadı. Aranan yollar: ' . 
                   __DIR__ . '/sample-scores.json, ' . 
                   dirname(__DIR__) . '/api/sample-scores.json, ' . 
                   dirname(__DIR__) . '/sample-scores.json'
    ]);
    exit;
}

// JSON dosyasını oku
$scoresJson = file_get_contents($scoresFile);
$scores = json_decode($scoresJson, true);

// Veri yapısını kontrol et ve hata ayıklama
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['error' => 'JSON dosyası okunamadı: ' . json_last_error_msg()]);
    exit;
}

// Hata ayıklama için JSON içeriğini göster
$debug = false;
if ($debug) {
    echo json_encode(['debug' => [
        'file_path' => $scoresFile,
        'json_structure' => $scores
    ]]);
    exit;
}

// URL parametrelerini kontrol et
if (isset($_GET['username'])) {
    $username = $_GET['username'];
    $userRankings = getUserRankings($scores, $username);
    echo json_encode($userRankings);
} elseif (isset($_GET['score'])) {
    // Skora dayalı sıralama için fonksiyon
    $score = intval($_GET['score']);
    $scoreRanking = getScoreRanking($scores, $score);
    echo json_encode($scoreRanking);
} else {
    echo json_encode(['error' => 'Kullanıcı adı veya skor parametresi gerekli']);
}

// Kullanıcı adına göre sıralama
function getUserRankings($scores, $username) {
    // JSON yapısını kontrol et - muhtemelen 'scores' anahtarı altında düz bir liste var
    $scoresList = [];
    
    // Gerçek JSON yapısına göre veriyi hazırla
    if (isset($scores['scores'])) {
        $scoresList = $scores['scores'];
    } elseif (is_array($scores)) {
        $scoresList = $scores;
    } else {
        return ['error' => 'Geçersiz skor verisi yapısı', 'data' => $scores];
    }
    
    // Puanları azalan sırada sırala
    usort($scoresList, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    // Kullanıcının sıralamasını bul
    $rank = findRank($scoresList, $username);
    
    // Tüm zaman dilimleri için aynı sıralamayı kullan
    return [
        'success' => true,
        'daily' => $rank,
        'weekly' => $rank,
        'monthly' => $rank
    ];
}

// Skora göre sıralama
function getScoreRanking($scores, $score) {
    // JSON yapısını kontrol et - muhtemelen 'scores' anahtarı altında düz bir liste var
    $scoresList = [];
    
    // Gerçek JSON yapısına göre veriyi hazırla
    if (isset($scores['scores'])) {
        $scoresList = $scores['scores'];
    } elseif (is_array($scores)) {
        $scoresList = $scores;
    } else {
        return ['error' => 'Geçersiz skor verisi yapısı', 'data' => $scores];
    }
    
    // Puanları azalan sırada sırala
    usort($scoresList, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    // Belirli skorun sıralamasını bul
    $rank = findScoreRank($scoresList, $score);
    
    // Tüm zaman dilimleri için aynı sıralamayı kullan
    return [
        'success' => true,
        'daily' => $rank,
        'weekly' => $rank,
        'monthly' => $rank
    ];
}

// Kullanıcının sıralamasını bul
function findRank($scoreList, $username) {
    if (!is_array($scoreList)) {
        return null;
    }
    
    for ($i = 0; $i < count($scoreList); $i++) {
        if (isset($scoreList[$i]['username']) && strtolower($scoreList[$i]['username']) === strtolower($username)) {
            return $i + 1; // sıralama 1'den başlar
        }
    }
    return null; // kullanıcı bulunamadı
}

// Skora göre sıralama bul
function findScoreRank($scoreList, $score) {
    if (!is_array($scoreList)) {
        return 1;
    }
    
    for ($i = 0; $i < count($scoreList); $i++) {
        if (isset($scoreList[$i]['score']) && $scoreList[$i]['score'] <= $score) {
            return $i + 1; // skor bu sıraya denk gelir
        }
    }
    return count($scoreList) + 1; // skorun sıralaması en sonda
}
?> 