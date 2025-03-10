// Global değişkenler
let timer;
let timeLeft = 60; // 1 dakika
let words = [];
let currentWordIndex = 0;
let correctWords = 0;
let incorrectWords = 0;
let totalKeystrokes = 0;
let isPlaying = false;
let timerStarted = false;
let wordResults = [];
let incorrectWordsList = [];
let keyErrorStats = {};
let currentUsername = '';
let activeTabId = 'hourly';
let turkishWords = [];

// HTML elementlerini seçme
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result');
const startBtn = document.getElementById('start-btn');
const endGameBtn = document.getElementById('end-game-btn');
const timerElement = document.getElementById('timer');
const wordDisplay = document.getElementById('word-display');
const wordInput = document.getElementById('word-input');
const restartBtn = document.getElementById('restart-btn');

// Kullanıcı adını LocalStorage'dan alır
function getUsername() {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
        currentUsername = storedUsername;
        return storedUsername;
    }
    return null;
}

// Kullanıcı adını LocalStorage'a kaydeder
function saveUsername(username) {
    if (username && username.trim() !== '') {
        localStorage.setItem('username', username);
        currentUsername = username;
    }
}

// Hoşgeldin mesajını göster
function showWelcomeMessage() {
    const username = getUsername();
    const startScreen = document.getElementById('start-screen');
    
    // Eğer önceden oluşturulmuş hoşgeldin mesajı varsa kaldır
    const existingMessage = document.getElementById('welcome-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (username) {
        // Hoşgeldin mesajı oluştur
        const welcomeMsg = document.createElement('p');
        welcomeMsg.id = 'welcome-message';
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.textContent = `Hoşgeldin, ${username}!`;
        
        // HTML yapısına göre doğru konuma ekle
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            // Başla butonunun kendisinin üstüne ekle
            startScreen.insertBefore(welcomeMsg, startBtn);
        } else {
            // Buton bulunamazsa, startScreen'in başına ekle
            startScreen.prepend(welcomeMsg);
        }
    }
}

// Karıştırma algoritması (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Türkçe karakterleri normalleştirme fonksiyonu
function normalizeTurkishText(text) {
    return text.toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/û/g, 'u')
        .replace(/ô/g, 'o')
        .replace(/ê/g, 'e');
}

// Rastgele kelimeler oluştur
function generateWords() {
    let shuffled = shuffleArray([...turkishWords]);
    return shuffled.slice(0, 50); // 50 kelime seç
}

// Kelime görüntüsünü güncelle
function updateWordDisplay() {
    wordDisplay.innerHTML = '';
    words.forEach((word, index) => {
        const wordElement = document.createElement('span');
        wordElement.textContent = word;
        wordElement.classList.add('word');
        
        if (index === currentWordIndex) {
            wordElement.classList.add('current');
        } else if (index < currentWordIndex) {
            // Önceki kelimelerin doğru/yanlış durumlarını kontrol et
            if (wordResults[index] === false) {
                wordElement.classList.add('incorrect');
            } else {
                wordElement.classList.add('correct');
            }
        }
        
        wordDisplay.appendChild(wordElement);
    });
}

// Zamanı güncelle
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft === 0) {
        clearInterval(timer);
        endGame();
        
        // Kullanıcı adı varsa otomatik kaydet
        if (currentUsername) {
            setTimeout(saveUserScore, 500); // Sonuçlar oluştuktan sonra kaydet
        }
    } else {
        timeLeft--;
    }
}

// Kullanıcı veya skor sıralama bilgilerini getiren fonksiyon
function fetchUserRankings(usernameOrScore, isScore = false) {
    if (!usernameOrScore && !isScore) return;
    
    // Sıralama bilgisi container elementi
    const rankingContainer = document.getElementById('user-rankings');
    if (!rankingContainer) {
        // Eğer yoksa oluştur
        const skillLevelContainer = document.querySelector('.skill-level');
        if (skillLevelContainer) {
            const newRankingContainer = document.createElement('div');
            newRankingContainer.id = 'user-rankings';
            newRankingContainer.className = 'user-rankings';
            
            // Loading mesajı göster
            newRankingContainer.textContent = 'Sıralama bilgileri yükleniyor...';
            
            // Seviye bilgisinin hemen altına yerleştir
            skillLevelContainer.parentNode.insertBefore(newRankingContainer, skillLevelContainer.nextSibling);
            
            // Restart butonunun pozisyonunu güncelle
            setTimeout(moveRestartButton, 100);
        }
    } else {
        // Loading mesajı göster
        rankingContainer.textContent = 'Sıralama bilgileri yükleniyor...';
    }
    
    // API endpoint'i ve parametreleri belirle
    let apiUrl = `/api/get-user-rankings.php?score=${encodeURIComponent(usernameOrScore)}`;
    
    // Sunucudan sıralama bilgilerini al
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const rankingContainer = document.getElementById('user-rankings');
            if (!rankingContainer) return;
            
            // Debug bilgilerini konsola yaz
            console.log("Sıralama verileri:", data);
            
            if (data.success) {
                // Sıralama bilgilerini göster
                let rankingText = '';
                
                if (data.daily) {
                    rankingText += `Günlük: ${data.daily}. sıra`;
                } else {
                    rankingText += 'Günlük: -';
                }
                
                rankingText += ' | ';
                
                if (data.weekly) {
                    rankingText += `Haftalık: ${data.weekly}. sıra`;
                } else {
                    rankingText += 'Haftalık: -';
                }
                
                rankingText += ' | ';
                
                if (data.monthly) {
                    rankingText += `Aylık: ${data.monthly}. sıra`;
                } else {
                    rankingText += 'Aylık: -';
                }
                
                rankingContainer.textContent = rankingText;
            } else {
                rankingContainer.textContent = 'Sıralama bilgileri alınamadı.';
            }
        })
        .catch(error => {
            const rankingContainer = document.getElementById('user-rankings');
            if (rankingContainer) {
                rankingContainer.textContent = 'Sıralama bilgileri yüklenirken hata oluştu.';
            }
        });
}

// Tekrar oyna düğmesini seviye kısmının altına taşıma
function moveRestartButton() {
    const restartBtn = document.getElementById('restart-btn');
    const userRankingsContainer = document.getElementById('user-rankings');
    
    if (restartBtn) {
        // Restart düğmesini mevcut yerinden kaldır
        if (restartBtn.parentNode) {
            restartBtn.parentNode.removeChild(restartBtn);
        }
        
        // Kullanıcı sıralamaları varsa onun altına, yoksa seviye bilgisinin altına ekle
        if (userRankingsContainer) {
            userRankingsContainer.parentNode.insertBefore(restartBtn, userRankingsContainer.nextSibling);
        } else {
            const skillLevelContainer = document.querySelector('.skill-level');
            if (skillLevelContainer) {
                skillLevelContainer.parentNode.insertBefore(restartBtn, skillLevelContainer.nextSibling);
            }
        }
        
        // Biraz boşluk için stil ekle
        restartBtn.style.marginTop = '15px';
        restartBtn.style.marginBottom = '20px';
    }
}

// API yüklemek için fonksiyonu güncelle
function loadTurkishWords() {
    return fetch('/api/get-keywords.php')
        .then(response => response.json())
        .then(data => {
            turkishWords = data;
            console.log('Kelimeler yüklendi:', turkishWords.length);
            return turkishWords;
        })
        .catch(error => {
            console.error('Kelimeler yüklenirken hata oluştu:', error);
        });
}

// Oyunu başlat
function startGame() {
    // Değişkenleri sıfırla
    timeLeft = 60;
    correctWords = 0;
    incorrectWords = 0;
    totalKeystrokes = 0;
    isPlaying = true;
    timerStarted = false;
    wordResults = [];
    incorrectWordsList = [];
    keyErrorStats = {};
    
    // Oyun ekranını göster
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    resultScreen.style.display = 'none';
    
    // Skor tablosunu gizle
    document.getElementById('scoreboard-container').style.display = 'none';
    
    // Önce kelimeleri yükle, sonra oyunu başlat
    loadTurkishWords().then(() => {
        // Kelimeler yüklendikten sonra kelimeleri oluştur
        words = generateWords();
        currentWordIndex = 0;
        
        // Ekranı güncelle
        updateWordDisplay();
        timerElement.textContent = '01:00';
        
        // Input alanına odaklan
        wordInput.value = '';
        wordInput.focus();
    });
}

// Oyunu bitir
function endGame() {
    // Timer'ı temizle
    clearInterval(timer);
    
    // Oyun durumunu güncelle
    isPlaying = false;
    
    // İstatistikleri hesapla
    const totalWords = correctWords + incorrectWords;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    
    // Puanı hesapla
    let finalScore = Math.round((correctWords * 10) + (totalKeystrokes * 0.2));
    finalScore = Math.round(finalScore * (accuracy / 100)); // Doğruluk oranına göre puanı ayarla
    
    // Seviyeyi belirle
    let skillLevel = "Başlangıç";
    if (finalScore >= 100) skillLevel = "Uzman";
    else if (finalScore >= 80) skillLevel = "İleri";
    else if (finalScore >= 50) skillLevel = "Orta";
    else if (finalScore >= 30) skillLevel = "Acemi";
    
    // Sonuçları güncelle
    document.getElementById('final-score').textContent = finalScore;
    document.getElementById('correct-words').textContent = correctWords;
    document.getElementById('incorrect-words').textContent = incorrectWords;
    document.getElementById('accuracy').textContent = accuracy;
    document.getElementById('total-keystrokes').textContent = totalKeystrokes;
    document.getElementById('skill-level').textContent = skillLevel;
    
    // Kullanıcı adı değil, anlık skora göre sıralama bilgilerini getir
    fetchUserRankings(finalScore, true);
    
    // Yanlış yazılan kelimeleri göster
    displayIncorrectWords();
    
    // Tuş hata istatistiklerini göster
    displayKeyErrorStats();
    
    // Kullanıcı adı yerine skor bilgisini API'ye gönder
    const currentScore = finalScore;
    const username = currentUsername;
    
    // Kullanıcı adı varsa, skor kaydetme bölümünü gizle
    const saveScoreSection = document.querySelector('.save-score-section');
    if (currentUsername && saveScoreSection) {
        saveScoreSection.style.display = 'none';
    } else if (saveScoreSection) {
        saveScoreSection.style.display = 'block';
    }
    
    // Sonuç ekranını göster
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'block';
    document.getElementById('scoreboard-container').style.display = 'block';
    
    // Tekrar oyna düğmesini taşı
    setTimeout(moveRestartButton, 100);
}

// Kelimeyi kontrol et
function checkWord() {
    if (!isPlaying) return;
    
    const currentWord = words[currentWordIndex];
    const typedWord = wordInput.value.trim();
    
    if (typedWord === '') return;
    
    // Türkçe karakterleri normalleştirerek karşılaştır
    const normalizedCurrentWord = normalizeTurkishText(currentWord);
    const normalizedTypedWord = normalizeTurkishText(typedWord);
    
    let isCorrect = false;
    
    if (normalizedTypedWord === normalizedCurrentWord || typedWord === currentWord) {
        // Doğru kelime
        correctWords++;
        isCorrect = true;
    } else {
        // Yanlış kelime
        incorrectWords++;
        isCorrect = false;
        
        // Yanlış yazılan kelimeyi kaydet
        incorrectWordsList.push({
            expected: currentWord,
            typed: typedWord
        });
        
        // Harf bazında hataları analiz et
        analyzeTypingErrors(currentWord, typedWord);
    }
    
    // Kelime sonucunu kaydet
    wordResults[currentWordIndex] = isCorrect;
    
    // Sonraki kelimeye geç
    currentWordIndex++;
    
    // Son 5 kelimeye yaklaştıysak veya kelimeler bittiyse yeni kelimeler getir
    if (currentWordIndex >= words.length - 5) {
        // Yeni kelimeler oluştur
        words = words.concat(generateWords());
        // Yeni kelimeler için sonuç dizisini genişlet
        wordResults = wordResults.concat(new Array(words.length - wordResults.length));
    }
    
    updateWordDisplay();
    wordInput.value = '';
}

// Harf bazında hataları analiz etme fonksiyonu
function analyzeTypingErrors(expected, typed) {
    // İki kelimeyi de normalize et
    const normalizedExpected = normalizeTurkishText(expected);
    const normalizedTyped = normalizeTurkishText(typed);
    
    // İki kelimeden kısa olanın uzunluğunu al
    const minLength = Math.min(normalizedExpected.length, normalizedTyped.length);
    
    // Harf harf karşılaştır
    for (let i = 0; i < minLength; i++) {
        if (normalizedExpected[i] !== normalizedTyped[i]) {
            // Yanlış tuş basımı kaydedilir
            const expectedChar = normalizedExpected[i];
            const typedChar = normalizedTyped[i];
            
            if (!keyErrorStats[expectedChar]) {
                keyErrorStats[expectedChar] = {};
            }
            
            if (!keyErrorStats[expectedChar][typedChar]) {
                keyErrorStats[expectedChar][typedChar] = 0;
            }
            
            keyErrorStats[expectedChar][typedChar]++;
        }
    }
    
    // Eğer yazılan kelime daha kısaysa, eksik harfleri hesapla
    if (normalizedTyped.length < normalizedExpected.length) {
        for (let i = normalizedTyped.length; i < normalizedExpected.length; i++) {
            const expectedChar = normalizedExpected[i];
            
            if (!keyErrorStats[expectedChar]) {
                keyErrorStats[expectedChar] = {};
            }
            
            if (!keyErrorStats[expectedChar]["Yazılmamış"]) {
                keyErrorStats[expectedChar]["Yazılmamış"] = 0;
            }
            
            keyErrorStats[expectedChar]["Yazılmamış"]++;
        }
    }
    
    // Eğer yazılan kelime daha uzunsa, fazla harfleri hesapla
    if (normalizedTyped.length > normalizedExpected.length) {
        for (let i = normalizedExpected.length; i < normalizedTyped.length; i++) {
            const typedChar = normalizedTyped[i];
            
            if (!keyErrorStats["Fazladan Yazılan"]) {
                keyErrorStats["Fazladan Yazılan"] = {};
            }
            
            if (!keyErrorStats["Fazladan Yazılan"][typedChar]) {
                keyErrorStats["Fazladan Yazılan"][typedChar] = 0;
            }
            
            keyErrorStats["Fazladan Yazılan"][typedChar]++;
        }
    }
}

// Yanlış yazılan kelimeleri gösterme fonksiyonu
function displayIncorrectWords() {
    const incorrectWordsContainer = document.getElementById('incorrect-words-list');
    incorrectWordsContainer.innerHTML = '';
    
    if (incorrectWordsList.length === 0) {
        incorrectWordsContainer.innerHTML = '<p>Yanlış yazılan kelime bulunmamaktadır.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'error-table';
    
    // Tablo başlıkları
    const headerRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'Beklenen Kelime';
    const th2 = document.createElement('th');
    th2.textContent = 'Yazılan Kelime';
    headerRow.appendChild(th1);
    headerRow.appendChild(th2);
    table.appendChild(headerRow);
    
    // Yanlış kelimeler listesi
    incorrectWordsList.forEach(item => {
        const row = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.textContent = item.expected;
        
        const td2 = document.createElement('td');
        td2.textContent = item.typed;
        
        row.appendChild(td1);
        row.appendChild(td2);
        table.appendChild(row);
    });
    
    incorrectWordsContainer.appendChild(table);
}

// Tuş hata istatistiklerini gösterme fonksiyonu
function displayKeyErrorStats() {
    const keyErrorStatsContainer = document.getElementById('key-error-stats');
    keyErrorStatsContainer.innerHTML = '';
    
    if (Object.keys(keyErrorStats).length === 0) {
        keyErrorStatsContainer.innerHTML = '<p>Tuş hatası bulunmamaktadır.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'error-table';
    
    // Tablo başlıkları
    const headerRow = document.createElement('tr');
    const th1 = document.createElement('th');
    th1.textContent = 'Doğru Harf';
    const th2 = document.createElement('th');
    th2.textContent = 'Yazılan Harf';
    const th3 = document.createElement('th');
    th3.textContent = 'Hata Sayısı';
    headerRow.appendChild(th1);
    headerRow.appendChild(th2);
    headerRow.appendChild(th3);
    table.appendChild(headerRow);
    
    // Hata istatistiklerini sırala (en çok hata yapılanlar önce)
    const sortedStats = [];
    
    for (const expectedChar in keyErrorStats) {
        for (const typedChar in keyErrorStats[expectedChar]) {
            sortedStats.push({
                expected: expectedChar,
                typed: typedChar,
                count: keyErrorStats[expectedChar][typedChar]
            });
        }
    }
    
    sortedStats.sort((a, b) => b.count - a.count);
    
    // İstatistikleri tabloya ekle (en fazla 10 hata göster)
    const topErrors = sortedStats.slice(0, 10);
    
    topErrors.forEach(error => {
        const row = document.createElement('tr');
        
        const td1 = document.createElement('td');
        td1.textContent = error.expected;
        
        const td2 = document.createElement('td');
        td2.textContent = error.typed;
        
        const td3 = document.createElement('td');
        td3.textContent = error.count;
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        table.appendChild(row);
    });
    
    keyErrorStatsContainer.appendChild(table);
}

// Skor kaydet fonksiyonu
function saveUserScore() {
    let username = currentUsername;
    const saveMessage = document.getElementById('save-message');
    
    // Eğer mevcut bir kullanıcı adı yoksa, input'tan al
    if (!username) {
        const usernameInput = document.getElementById('username-input');
        username = usernameInput.value.trim();
        
        // Kullanıcı adı boşsa hata mesajı göster
        if (username === '') {
            saveMessage.textContent = 'Lütfen bir kullanıcı adı girin!';
            saveMessage.style.color = '#f5222d';
            saveMessage.style.display = 'block';
            return;
        }
        
        // Kullanıcı adını kaydet
        saveUsername(username);
    }
    
    // Input varsa değerini güncelle
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
        usernameInput.value = username;
    }
    
    // Kullanıcının son skorunu al
    const score = parseInt(document.getElementById('final-score').textContent) || 0;
    const wordCount = parseInt(document.getElementById('correct-words').textContent) || 0;
    const keystrokeCount = parseInt(document.getElementById('total-keystrokes').textContent) || 0;
    
    // Skoru kaydet
    const scoreData = {
        username: username,
        score: score,
        wordCount: wordCount,
        keystrokeCount: keystrokeCount,
        timestamp: Date.now()
    };
    
    // Mevcut skorları al (localStorage için)
    let scores = JSON.parse(localStorage.getItem('scoreboard')) || [];
    
    // Yeni skoru ekle
    scores.push(scoreData);
    
    // Skorları localStorage'a kaydet
    localStorage.setItem('scoreboard', JSON.stringify(scores));
    
    // PHP endpoint'e gönder
    fetch('/api/save-score.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Başarı mesajı göster
            saveMessage.textContent = 'Skorunuz başarıyla kaydedildi!';
            saveMessage.style.color = '#52c41a';
            
            // Skor tablosunu hemen güncelle
            const currentTab = document.querySelector('.tab-button.active');
            if (currentTab) {
                const timeFrame = currentTab.id.replace('-tab', '');
                fetchScoresFromServer(timeFrame);
            } else {
                // Aktif tab bulunamazsa saatlik olarak göster
                fetchScoresFromServer('hourly');
            }
            
            // Kullanıcı sıralama bilgilerini güncelle
            fetchUserRankings(score);
        } else {
            // Hata mesajı göster
            saveMessage.textContent = 'Skor kaydedilirken bir hata oluştu: ' + data.message;
            saveMessage.style.color = '#f5222d';
        }
        saveMessage.style.display = 'block';
    })
    .catch(error => {
        console.error('Hata:', error);
        saveMessage.textContent = 'Sunucu ile iletişim kurarken bir hata oluştu.';
        saveMessage.style.color = '#f5222d';
        saveMessage.style.display = 'block';
    });
}

// Skorları sunucudan alma fonksiyonu
function fetchScoresFromServer(timeFrame) {
    // api/ dizini olmadan tam URL kullan
    fetch(`/api/get-scores.php?timeFrame=${timeFrame}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.scores && data.scores.length > 0) {
                    renderScoreboard(data.scores);
                } else {
                    document.getElementById('scoreboard-body').innerHTML = '<tr><td colspan="6" style="text-align:center;">Bu zaman diliminde skor bulunamadı.</td></tr>';
                }
            } else {
                document.getElementById('scoreboard-body').innerHTML = '<tr><td colspan="6" style="text-align:center;">Skorlar yüklenemedi: ' + data.message + '</td></tr>';
            }
        })
        .catch(error => {
            document.getElementById('scoreboard-body').innerHTML = '<tr><td colspan="6" style="text-align:center;">Sunucu hatası oluştu: ' + error + '</td></tr>';
        });
}

// Skor tablosunu güncelleme fonksiyonu
function renderScoreboard(scores) {
    const tbody = document.getElementById('scoreboard-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Hiç skor yoksa mesaj göster
    if (!scores || scores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Henüz skor kaydedilmemiş.</td></tr>';
        return;
    }
    
    // Tabloyu oluştur
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        row.appendChild(rankCell);
        
        const userCell = document.createElement('td');
        userCell.textContent = score.username;
        row.appendChild(userCell);
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = score.score;
        row.appendChild(scoreCell);
        
        // Kelime sayısı hücresi
        const wordCountCell = document.createElement('td');
        wordCountCell.textContent = score.wordCount || 'N/A';
        row.appendChild(wordCountCell);
        
        // Vuruş sayısı hücresi
        const keystrokeCountCell = document.createElement('td');
        keystrokeCountCell.textContent = score.keystrokeCount || 'N/A';
        row.appendChild(keystrokeCountCell);
        
        const dateCell = document.createElement('td');
        // 24 saat formatında tarih gösterimi
        const date = new Date(score.timestamp);
        dateCell.textContent = date.toLocaleString('tr-TR', { 
            hour12: false, 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit', 
            minute: '2-digit'
        });
        row.appendChild(dateCell);
        
        tbody.appendChild(row);
    });
}

// Tab değiştirme fonksiyonu
function changeTab(timeFrame, element) {
    // Tüm tabları inaktif yap
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Tıklanan tabı aktif yap
    element.classList.add('active');
    activeTabId = timeFrame;
    
    // Sunucudan skorları getir ve göster
    fetchScoresFromServer(timeFrame);
}

// CSS stillerini ekle
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .score-input-row {
            display: flex;
            align-items: center;
            gap: 0;
            margin-bottom: 10px;
        }
        
        .input-container {
            flex: 1;
            margin: 0;
        }
        
        .save-btn {
            padding: 14px 20px;
            background-color: #1890ff;
            color: white;
            font-size: 16px;
            border: none;
            border-radius: 0 5px 5px 0;
            cursor: pointer;
            transition: background-color 0.3s;
            white-space: nowrap;
            margin-left: -1px;
        }
        
        .save-btn:hover {
            background-color: #096dd9;
        }
        
        .input-container {
            margin: 20px auto;
            max-width: 300px;
        }
        
        #username-input {
            width: 100%;
            padding: 12px 15px;
            font-size: 16px;
            border: 2px solid #d9d9d9;
            border-radius: 5px 0 0 5px;
            outline: none;
            transition: all 0.3s ease;
            background-color: #f9f9f9;
        }
        
        #username-input:focus {
            border-color: #1890ff;
            box-shadow: 0 0 8px rgba(24, 144, 255, 0.2);
            background-color: #fff;
        }
        
        #username-input::placeholder {
            color: #aaa;
            opacity: 0.8;
        }
        
        .scoreboard-tabs {
            display: flex;
            border-bottom: 1px solid #ccc;
            margin-bottom: 15px;
        }
        
        .tab-button {
            padding: 8px 16px;
            cursor: pointer;
            border: 1px solid #ccc;
            border-bottom: none;
            border-radius: 4px 4px 0 0;
            background-color: #f1f1f1;
            margin-right: 5px;
        }
        
        .tab-button.active {
            background-color: #fff;
            border-bottom: 2px solid #fff;
            margin-bottom: -1px;
            font-weight: bold;
        }
        
        #scoreboard-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        #scoreboard-table th, #scoreboard-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        #scoreboard-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        #scoreboard-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        #scoreboard-table tr:hover {
            background-color: #e9e9e9;
        }
        
        .end-game-btn {
            display: block;
            margin: 15px auto;
            padding: 10px 20px;
            background-color: #ff4d4f;
            color: white;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .end-game-btn:hover {
            background-color: #cf1322;
        }
        
        #result:not([style*="display: none"]) ~ #scoreboard-container {
            display: block !important;
            margin-top: 30px;
        }
        
        .error-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
        }
        
        .error-table th, .error-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        .error-table th {
            background-color: #f2f2f2;
        }
        
        .incorrect-word {
            display: inline-block;
            background-color: #ffebee;
            border: 1px solid #ffcdd2;
            border-radius: 3px;
            padding: 2px 6px;
            margin: 4px;
        }
        
        .welcome-message {
            font-size: 18px;
            color: #1890ff;
            margin-bottom: 15px;
            font-weight: bold;
            text-align: center;
        }
        
        .user-rankings {
            font-size: 16px;
            color: #555;
            margin-top: 15px;
            text-align: center;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
            border: 1px solid #eee;
        }
    `;
    document.head.appendChild(style);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // CSS stillerini ekle
    addStyles();
    
    // Kullanıcı adını al ve hoşgeldin mesajını göster
    getUsername();
    showWelcomeMessage();
    
    // Kullanıcı adı girildiğinde localStorage'a kaydet
    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
        // Eğer halihazırda bir kullanıcı adı varsa, input'a yerleştir
        if (currentUsername) {
            usernameInput.value = currentUsername;
        }
        
        usernameInput.addEventListener('change', function() {
            const newUsername = this.value.trim();
            if (newUsername !== '') {
                saveUsername(newUsername);
            }
        });
    }
    
    // Oyun tuş kontrolü
    wordInput.addEventListener('keydown', function(e) {
        if (!isPlaying) return;
        
        // Zamanlayıcıyı başlat
        if (!timerStarted) {
            timerStarted = true;
            timer = setInterval(updateTimer, 1000);
        }
        
        // Tuş vuruşlarını sayma (sadece harf, rakam ve noktalama işaretleri)
        if (e.key.length === 1) {
            totalKeystrokes++;
        }
        
        // Boşluk tuşu kontrolü
        if (e.key === ' ') {
            e.preventDefault();
            checkWord();
        }
    });
    
    // Başla butonuna tıklandığında oyunu başlat
    document.getElementById('start-btn').addEventListener('click', startGame);
    
    // Bitir butonuna tıklandığında oyunu bitir ve kullanıcı adı varsa otomatik kaydet
    document.getElementById('end-game-btn').addEventListener('click', function() {
        endGame();
        
        // Kullanıcı adı varsa otomatik kaydet
        if (currentUsername) {
            setTimeout(saveUserScore, 500); // Sonuçlar oluştuktan sonra kaydet
        }
    });
    
    // Yeniden başlat butonuna tıklandığında oyunu yeniden başlat
    document.getElementById('restart-btn').addEventListener('click', startGame);
    
    // Skoru kaydet butonuna tıklandığında skoru kaydet
    document.getElementById('save-score-btn').addEventListener('click', saveUserScore);
    
    // Tab butonlarına tıklama olaylarını ekle
    document.getElementById('hourly-tab').addEventListener('click', function() {
        changeTab('hourly', this);
    });
    
    document.getElementById('daily-tab').addEventListener('click', function() {
        changeTab('daily', this);
    });
    
    document.getElementById('weekly-tab').addEventListener('click', function() {
        changeTab('weekly', this);
    });
    
    // Başlangıçta saatlik skorbord'u göster
    const hourlyTab = document.getElementById('hourly-tab');
    changeTab('hourly', hourlyTab);
    
    // Sayfa yüklendiğinde de düğmeyi taşı (sayfa yenileme durumları için)
    moveRestartButton();
    
    // "Tekrar Başla" butonunu "Tekrar Oyna" olarak değiştir
    if (restartBtn) {
        restartBtn.textContent = 'Tekrar Oyna';
    }
}); 