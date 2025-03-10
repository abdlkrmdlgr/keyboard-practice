<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Dosya yolu sorununu çözmek için farklı olası yolları deneyelim
$scoresFile = __DIR__ . '/scores.json';

// Dosya mevcut değilse diğer olası yolları dene
if (!file_exists($scoresFile)) {
    $scoresFile = dirname(__DIR__) . '/api/scores.json';
    
    if (!file_exists($scoresFile)) {
        $scoresFile = dirname(__DIR__) . '/scores.json';
    }
}

// Dosyanın varlığını kontrol et
if (!file_exists($scoresFile)) {
    echo json_encode([
        'error' => 'Skor dosyası bulunamadı. Aranan yollar: ' . 
                   __DIR__ . '/scores.json, ' . 
                   dirname(__DIR__) . '/api/scores.json, ' . 
                   dirname(__DIR__) . '/scores.json'
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
    // Farklı zaman dilimleri için skorları filtrele
    $hourlyScores = filterScoresByTimeframe($scores, 'hourly');
    $dailyScores = filterScoresByTimeframe($scores, 'daily');
    $weeklyScores = filterScoresByTimeframe($scores, 'weekly');
    
    // Kullanıcının her zaman dilimindeki sıralamasını bul
    $hourlyRank = findRank($hourlyScores, $username);
    $dailyRank = findRank($dailyScores, $username);
    $weeklyRank = findRank($weeklyScores, $username);
    
    return [
        'success' => true,
        'hourly' => $hourlyRank, // Saatlik sıralamayı ekledik
        'daily' => $dailyRank,
        'weekly' => $weeklyRank
    ];
}

// Skora göre sıralama
function getScoreRanking($scores, $score) {
    // Farklı zaman dilimleri için skorları filtrele
    $hourlyScores = filterScoresByTimeframe($scores, 'hourly');
    $dailyScores = filterScoresByTimeframe($scores, 'daily');
    $weeklyScores = filterScoresByTimeframe($scores, 'weekly');
    
    // Skorun her zaman dilimindeki sıralamasını bul
    $hourlyRank = findScoreRank($hourlyScores, $score);
    $dailyRank = findScoreRank($dailyScores, $score);
    $weeklyRank = findScoreRank($weeklyScores, $score);
    
    return [
        'success' => true,
        'hourly' => $hourlyRank, // Saatlik sıralamayı ekledik
        'daily' => $dailyRank,
        'weekly' => $weeklyRank
    ];
}

// Belirli bir zaman dilimine göre skorları filtrele
function filterScoresByTimeframe($scores, $timeframe) {
    $now = time();
    $filteredScores = [];
    
    // JSON yapısını kontrol et
    $scoresList = [];
    if (isset($scores['scores'])) {
        $scoresList = $scores['scores'];
    } elseif (is_array($scores)) {
        $scoresList = $scores;
    } else {
        return [];
    }
    
    foreach ($scoresList as $score) {
        $timestamp = isset($score['timestamp']) ? intval($score['timestamp']) / 1000 : 0;
        
        // Zaman dilimlerine göre filtrele
        if ($timeframe === 'hourly' && $now - $timestamp <= 3600) {
            $filteredScores[] = $score;
        } elseif ($timeframe === 'daily' && $now - $timestamp <= 86400) {
            $filteredScores[] = $score;
        } elseif ($timeframe === 'weekly' && $now - $timestamp <= 604800) {
            $filteredScores[] = $score;
        }
    }
    
    // Skorlara göre sırala
    usort($filteredScores, function($a, $b) {
        return $b['score'] - $a['score'];
    });
    
    return $filteredScores;
}

// Kullanıcının sıralamasını bul
function findRank($scoreList, $username) {
    if (!is_array($scoreList) || empty($scoreList)) {
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
    if (!is_array($scoreList) || empty($scoreList)) {
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