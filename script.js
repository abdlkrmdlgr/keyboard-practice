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
let lastRefreshIndex = 0; // Son kelime yenileme indeksi - bunu ekledik

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

// Geri sayım öğesini taşıyacak kod
const countdownElement = document.getElementById('countdown');
const inputElement = document.getElementById('inputText');

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
    
    // İndeks 19'a geldiğinde ilk 19 kelimeyi kaldır, 19 yeni kelime ekle
    if (currentWordIndex >= 19) {
        // İlk 19 kelimeyi kaldır, son 5 kelimeyi tut
        words = words.slice(19);
        wordResults = wordResults.slice(19);
        
        // Kelime indeksini güncelle (19 kelime çıkarıldığı için)
        currentWordIndex -= 19;
        
        // Yeni kelimeler oluştur - 19 kelime ekle
        const newWords = generateWords().slice(0, 19);
        
        // Kelimeleri listenin sonuna ekle
        words = words.concat(newWords);
        
        // Yeni kelimeler için sonuç dizisini genişlet
        wordResults = wordResults.concat(new Array(newWords.length).fill(null));
    }
    
    // İlk 24 kelimeyi göster
    const startIndex = 0;
    const endIndex = Math.min(24, words.length);
    const wordsToShow = words.slice(startIndex, endIndex);
    
    // Kelimeleri ekrana yerleştir
    wordsToShow.forEach((word, index) => {
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

// Kelimeleri ekrana yerleştiren yardımcı fonksiyon
function displayWords(wordsArray, startIndex) {
    wordsArray.forEach((word, index) => {
        const wordElement = document.createElement('span');
        wordElement.textContent = word;
        wordElement.classList.add('word');
        
        const actualIndex = startIndex + index;
        
        if (actualIndex === currentWordIndex) {
            wordElement.classList.add('current');
        } else if (actualIndex < currentWordIndex) {
            // Önceki kelimelerin doğru/yanlış durumlarını kontrol et
            if (wordResults[actualIndex] === false) {
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
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
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
    
    // API'ye zaman parametresi ekleyerek önbellek sorunlarını önle
    apiUrl += `&_t=${Date.now()}`;
    
    // Sunucudan sıralama bilgilerini al
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const rankingContainer = document.getElementById('user-rankings');
            if (!rankingContainer) return;
            
            // API yanıtını konsola yazdırarak hata ayıklama
            console.log("API Yanıtı:", data);
            
            if (data.success) {
                // Sıralama bilgilerini göster
                let rankingText = '';
                
                // API yanıtının yapısını kontrol et
                // Eğer hourly özelliği yoksa, monthly özelliğini kullan (geriye dönük uyumluluk için)
                const hourlyRank = data.hourly !== undefined ? data.hourly : (data.monthly !== undefined ? data.monthly : '-');
                const dailyRank = data.daily !== undefined ? data.daily : '-';
                const weeklyRank = data.weekly !== undefined ? data.weekly : '-';
                
                rankingText = `Saatlik: ${hourlyRank}${typeof hourlyRank === 'number' ? '. sıra' : ''} | `;
                rankingText += `Günlük: ${dailyRank}${typeof dailyRank === 'number' ? '. sıra' : ''} | `;
                rankingText += `Haftalık: ${weeklyRank}${typeof weeklyRank === 'number' ? '. sıra' : ''}`;
                
                rankingContainer.textContent = rankingText;
            } else {
                rankingContainer.textContent = 'Sıralama bilgileri alınamadı: ' + (data.message || 'Bilinmeyen hata');
            }
        })
        .catch(error => {
            console.error("Sıralama bilgisi hatası:", error);
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

// Türkçe kelimeleri yükleyen fonksiyonu kontrol et
function loadTurkishWords() {
    return new Promise((resolve) => {
        // Eğer kelimeler zaten yüklendiyse, hemen tamamla
        if (turkishWords.length > 0) {
            resolve();
            return;
        }
        
        // Türkçe kelimeler yükleniyor...
        
        // Backend'den kelime getirme kodu
        fetch('/api/get-keywords.php')
            .then(response => {
                return response.json();
            })
            .then(data => {
                // API veri yapısı...
                
                // API yanıtı kontrol edilir
                if (data) {
                    // API yanıtında kelimeler doğrudan kök seviyede bir dizi olabilir
                    if (Array.isArray(data)) {
                        turkishWords = data;
                    }
                    // API yanıtı bir nesne ve içinde words veya keywords alanı olabilir
                    else if (typeof data === 'object') {
                        if (data.success && (data.words || data.keywords)) {
                            turkishWords = data.words || data.keywords || [];
                        } 
                        // API yanıtında başka bir anahtar altında kelimeler olabilir
                        else if (data.data || data.kelimeler || data.content) {
                            turkishWords = data.data || data.kelimeler || data.content || [];
                        }
                        // API yanıtının anahtarlarını kontrol edelim
                        else {
                            const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
                            if (possibleArrays.length > 0) {
                                // İlk dizi tipindeki değeri kullanalım
                                turkishWords = possibleArrays[0];
                            } else {
                                console.error("API yanıtında kelime dizisi bulunamadı");
                                turkishWords = ["merhaba", "dünya", "klavye", "bilgisayar", "yazılım"];
                            }
                        }
                    } else {
                        console.error("API yanıtı beklenmeyen bir formatta:", typeof data);
                        turkishWords = ["merhaba", "dünya", "klavye", "bilgisayar", "yazılım"];
                    }
                } else {
                    console.error("API yanıtı boş veya geçersiz");
                    turkishWords = ["merhaba", "dünya", "klavye", "bilgisayar", "yazılım"];
                }
                
                resolve();
            })
            .catch(error => {
                console.error("Backend bağlantı hatası:", error);
                turkishWords = ["merhaba", "dünya", "klavye", "bilgisayar", "yazılım"];
                resolve();
            });
    });
}

// Puanı hesapla ve seviyeyi belirle
function calculateScore(correctWords, totalKeystrokes, accuracy) {
    // Temel puanı hesapla
    let finalScore = Math.round((correctWords * 10) + (totalKeystrokes * 0.2));
    
    // Doğruluk oranına göre puanı ayarla
    finalScore = Math.round(finalScore * (accuracy / 100));
    
    // Seviyeyi belirle
    let skillLevel = "Başlangıç";
    if (finalScore >= 1000) skillLevel = "Uzman";
    else if (finalScore >= 800) skillLevel = "İleri";
    else if (finalScore >= 500) skillLevel = "Orta";
    else if (finalScore >= 300) skillLevel = "Acemi";
    
    return {
        score: finalScore,
        skillLevel: skillLevel
    };
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
    lastRefreshIndex = 0;
    
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
    
    // Puanı ve seviyeyi hesapla
    const result = calculateScore(correctWords, totalKeystrokes, accuracy);
    
    // Önce DOM güncellemelerini yap
    // Sonuçları güncelle
    document.getElementById('final-score').textContent = result.score;
    document.getElementById('correct-words').textContent = correctWords;
    document.getElementById('incorrect-words').textContent = incorrectWords;
    document.getElementById('accuracy').textContent = accuracy;
    document.getElementById('total-keystrokes').textContent = totalKeystrokes;
    document.getElementById('skill-level').textContent = result.skillLevel;
    
    // Yanlış yazılan kelimeleri göster
    displayIncorrectWords();
    
    // Tuş hata istatistiklerini göster
    displayKeyErrorStats();
    
    // Kullanıcı adı varsa, skor kaydetme bölümünü gizle
    const saveScoreSection = document.querySelector('.save-score-section');
    if (currentUsername && saveScoreSection) {
        saveScoreSection.style.display = 'none';
    } else if (saveScoreSection) {
        saveScoreSection.style.display = 'block';
    }
    
    // Ekranları güncelle
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'block';
    document.getElementById('scoreboard-container').style.display = 'block';
    
    // Aktif tabı hourly olarak ayarla
    activeTabId = 'hourly';
    
    // Tüm tabları inaktif yap
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Hourly tabı aktif yap
    const hourlyTab = document.getElementById('hourly-tab');
    if (hourlyTab) hourlyTab.classList.add('active');
    
    // Direkt kontrol kodları
    console.log("Skorlar yükleniyor...");
    
    // Skor tablosunu güncelle
    loadScores('last1Hour').then(() => {
        // Kullanıcı sıralama bilgilerini güncelle
        fetchUserRankings(result.score, true);
        // Tekrar oyna düğmesini taşı
        moveRestartButton();
    });
}

// Tablo kontrol ve doldurma fonksiyonu (tek bir güvenilir fonksiyon)
function fillScoreTable(tableBodyId, scores, includeExtraColumns = false) {
    console.log(`Tabloya ${scores.length} skor yerleştiriliyor: ${tableBodyId}`);
    
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) {
        console.error(`Tablo bulunamadı: ${tableBodyId}`);
        return false;
    }
    
    // Tabloyu temizle
    tbody.innerHTML = '';
    
    // Skorlar boşsa mesaj göster
    if (!scores || scores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${includeExtraColumns ? 6 : 4}" style="text-align:center;">Bu zaman aralığında skor bulunamadı</td></tr>`;
        return true;
    }
    
    // Skorları tabloya ekle
    scores.forEach((score, index) => {
        const tr = document.createElement('tr');
        
        // Temel sütunlar
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.username || 'İsimsiz'}</td>
            <td>${score.score}</td>
        `;
        
        // Eğer genişletilmiş tablo ise ekstra sütunları da ekle
        if (includeExtraColumns) {
            tr.innerHTML += `
                <td>${score.wordCount || 'N/A'}</td>
                <td>${score.keystrokeCount || 'N/A'}</td>
            `;
        }
        
        // Tarih sütunu
        tr.innerHTML += `<td>${new Date(score.timestamp).toLocaleString('tr-TR')}</td>`;
        
        tbody.appendChild(tr);
    });
    
    return true;
}

// Skorları yükleyip tüm tabloları güncelleme fonksiyonu
function loadScores(timeFrame = 'last1Hour') {
    console.log(`Skorlar yükleniyor: ${timeFrame}`);
    
    // UI formatını API formatına dönüştür
    const timeFrameMap = {
        'hourly': 'last1Hour',
        'daily': 'last1Day',
        'weekly': 'last1Week'
    };
    
    // Eğer UI formatı geldiyse, API formatına dönüştür
    const apiTimeFrame = timeFrameMap[timeFrame] || timeFrame;
    
    return fetch('/api/get-scores.php')
        .then(response => response.json())
        .then(data => {
            console.log("API yanıtı:", data);
            
            if (!data.success) {
                console.error("API hatası:", data.message);
                return false;
            }
            
            // Cache'i güncelle
            window.cachedScores = {
                hourly: data.last1Hour || [],
                daily: data.last1Day || [],
                weekly: data.last1Week || []
            };
            
            // Doğru API formatını kullan
            const scores = data[apiTimeFrame] || [];
            console.log(`${apiTimeFrame} için ${scores.length} skor bulundu`);
            
            // Ana skorbord tablosunu güncelle 
            fillScoreTable('scoreboard-body', scores, true);
            
            // Sonuç tablosunu güncelle (eğer varsa)
            const resultTable = document.querySelector('#scoreTable tbody');
            if (resultTable && resultTable.id === 'scoreTable-body') {
                fillScoreTable('scoreTable-body', scores, false);
            } else if (resultTable) {
                // ID farklıysa doğrudan DOM ile güncelle
                resultTable.innerHTML = '';
                
                if (scores.length === 0) {
                    resultTable.innerHTML = '<tr><td colspan="4" style="text-align:center;">Bu zaman aralığında skor bulunamadı</td></tr>';
                } else {
                    scores.forEach((score, index) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${score.username || 'İsimsiz'}</td>
                            <td>${score.score}</td>
                            <td>${new Date(parseInt(score.timestamp)).toLocaleString('tr-TR')}</td>
                        `;
                        resultTable.appendChild(tr);
                    });
                }
            }
            
            return true;
        })
        .catch(error => {
            console.error("Skor yükleme hatası:", error);
            return false;
        });
}

// Tab değiştirme fonksiyonunu basitleştir
function changeTab(timeFrame, element) {
    // Tüm tabları inaktif yap
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Tıklanan tabı aktif yap
    element.classList.add('active');
    activeTabId = timeFrame;
    
    // Direkt olarak loadScores'a UI formatını gönder
    loadScores(timeFrame);
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
    
    // Kelime gösterimini güncelle (burada kelimeler kontrol edilecek)
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
    
    // Score, tuş vuruş sayısı ve doğruluk oranını al
    const score = parseInt(document.getElementById('final-score').textContent) || 0;
    const keystrokeCount = parseInt(document.getElementById('total-keystrokes').textContent) || 0;
    const correctWords = parseInt(document.getElementById('correct-words').textContent) || 0;
    const incorrectWords = parseInt(document.getElementById('incorrect-words').textContent) || 0;
    const accuracy = parseInt(document.getElementById('accuracy').textContent) || 0;
    
    // Score ve tuş vuruş sayısı kontrolü
    if (score <= 0 || keystrokeCount <= 0) {
        saveMessage.textContent = 'Score ve tuş vuruş sayısı sıfırdan büyük olmalıdır!';
        saveMessage.style.color = '#f5222d';
        saveMessage.style.display = 'block';
        return;
    }

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
    
    // Skoru kaydet
    const scoreData = {
        username: username,
        score: score,
        wordCount: correctWords,
        incorrectWords: incorrectWords,
        keystrokeCount: keystrokeCount,
        accuracy: accuracy,
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
                loadScores(timeFrame);
            } else {
                // Aktif tab bulunamazsa saatlik olarak göster
                loadScores('hourly');
            }
            
            // Kullanıcı sıralama bilgilerini güncelle
            fetchUserRankings(score);
        } else {
            saveMessage.textContent = data.message || 'Skor kaydedilirken bir hata oluştu';
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
    
    // WordInput için event listener ekleyin
    wordInput.addEventListener('input', function() {
        if (!isPlaying) return;
        
        // Anlık yazılan metni al
        const typedText = this.value.trim();
        
        // Yazılan metin boşsa kontrol etme
        if (typedText === '') return;
        
        // Şu anki kelimeyi bul
        const currentWord = words[currentWordIndex];
        
        // Kelimeyi hemen kontrol et
        checkCurrentTyping(typedText, currentWord);
    });
    
    // Başla butonuna tıklandığında oyunu başlat
    document.getElementById('start-btn').addEventListener('click', startGame);
    
    // Oyunu Bitir düğmesi kontrolü - önce elementin var olup olmadığını kontrol et
    const endGameBtn = document.getElementById('end-game-btn');
    if (endGameBtn) {
        endGameBtn.addEventListener('click', function() {
            endGame();
            
            // Kullanıcı adı varsa otomatik kaydet
            if (currentUsername) {
                setTimeout(saveUserScore, 500); // Sonuçlar oluştuktan sonra kaydet
            }
        });
    }
    
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
    
    // Başlangıçta saatlik tabı aktif yap ve skorları yükle
    const hourlyTab = document.getElementById('hourly-tab');
    if (hourlyTab) {
        hourlyTab.classList.add('active');
        activeTabId = 'hourly';
        
        // Başlangıç skorlarını yükle
        setTimeout(() => {
            loadScores('last1Hour');
        }, 200);
    }
});

// Anlık yazım kontrolü
function checkCurrentTyping(typedText, actualWord) {
    // Mevcut kelime elementini bul
    const wordElements = wordDisplay.querySelectorAll('.word');
    const currentWordElement = wordElements[currentWordIndex];
    
    if (!currentWordElement) return;
    
    // Harf harf kontrol et
    let isCorrect = true;
    
    // Şu ana kadar yazılan harfleri kontrol et
    for (let i = 0; i < typedText.length; i++) {
        // Eğer kelimeden daha uzun yazılmışsa veya harf yanlışsa
        if (i >= actualWord.length || 
            normalizeTurkishText(typedText[i]) !== normalizeTurkishText(actualWord[i])) {
            isCorrect = false;
            break;
        }
    }
    
    // Hataları göster
    if (!isCorrect) {
        // Yanlış yazım - kırmızı vurgula
        currentWordElement.classList.add('typing-error');
    } else {
        // Doğru yazım - normal göster
        currentWordElement.classList.remove('typing-error');
    }
} 