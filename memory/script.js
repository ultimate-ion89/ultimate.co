// Game State
let currentUser = null;
const OWNER_EMAIL = 'billupsjim8@gmail.com';
const ENCRYPTION_KEY = 'MemoryGame2025SecretKey!@#';

// Rank System
const RANKS = {
    USER: 'user',
    ADMIN: 'admin',
    CO_OWNER: 'co-owner',
    OWNER: 'owner'
};

// Encryption/Decryption Functions
function simpleEncrypt(text) {
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        encrypted += String.fromCharCode(charCode ^ keyChar);
    }
    return btoa(encrypted); // Base64 encode
}

function simpleDecrypt(encrypted) {
    try {
        const decoded = atob(encrypted); // Base64 decode
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i);
            const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
            decrypted += String.fromCharCode(charCode ^ keyChar);
        }
        return decrypted;
    } catch (e) {
        return null;
    }
}

// Cheat System
let cheatsEnabled = {
    autoPlay: false,
    unlimitedLives: false,
    revealAnswers: false
};

let cheatMenuEnabled = true;
let autoPlayInterval = null;

function isOwner() {
    return currentUser === OWNER_EMAIL;
}

function getUserRank() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const user = users[currentUser];
    if (!user) return RANKS.USER;
    if (currentUser === OWNER_EMAIL) return RANKS.OWNER;
    return user.rank || RANKS.USER;
}

function hasPermission(requiredRank) {
    const rankHierarchy = [RANKS.USER, RANKS.ADMIN, RANKS.CO_OWNER, RANKS.OWNER];
    const userRank = getUserRank();
    return rankHierarchy.indexOf(userRank) >= rankHierarchy.indexOf(requiredRank);
}

function showCheatButton() {
    const cheatBtn = document.getElementById('cheat-toggle-btn');
    if (isOwner() && cheatMenuEnabled) {
        cheatBtn.classList.remove('hidden');
    } else {
        cheatBtn.classList.add('hidden');
    }
}

function toggleCheatMenuEnabled() {
    if (!isOwner()) return;
    
    cheatMenuEnabled = !cheatMenuEnabled;
    
    const statusText = document.getElementById('cheat-status');
    const settingBtn = document.getElementById('cheat-menu-toggle-setting');
    
    statusText.textContent = cheatMenuEnabled ? 'ON' : 'OFF';
    
    // Visual feedback on button
    if (cheatMenuEnabled) {
        statusText.style.color = '#27ae60';
        settingBtn.style.borderColor = '#27ae60';
    } else {
        statusText.style.color = '#e74c3c';
        settingBtn.style.borderColor = '#e74c3c';
    }
    
    showCheatButton();
    
    // Close cheat menu if disabling
    if (!cheatMenuEnabled) {
        document.getElementById('cheat-menu').classList.add('hidden');
        alert('🔒 Cheat menu has been disabled');
    } else {
        alert('✅ Cheat menu has been enabled');
    }
    
    playSound(cheatMenuEnabled ? 659 : 523, 100);
}

function toggleCheatMenu() {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    if (!cheatMenuEnabled) {
        alert('⚠️ Cheat menu is disabled. Enable it in Settings first.');
        return;
    }
    
    const menu = document.getElementById('cheat-menu');
    menu.classList.toggle('hidden');
}

function toggleAutoPlay() {
    if (!isOwner()) return;
    
    cheatsEnabled.autoPlay = document.getElementById('cheat-autoplay').checked;
    
    if (cheatsEnabled.autoPlay) {
        playSound(659, 100);
        // Auto-play will be handled by each game individually
    } else {
        playSound(523, 100);
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
}

function addPoints() {
    if (!isOwner()) return;
    
    const userData = getUserData();
    userData.totalScore = (userData.totalScore || 0) + 1000;
    userData.level = Math.floor(userData.totalScore / 500) + 1;
    saveUserData(userData);
    
    playSound(659, 100);
    alert('✅ Added 1000 points!');
    
    // Update displays
    if (document.getElementById('lobby-screen').classList.contains('active')) {
        showLobby();
    }
}

function maxLevel() {
    if (!isOwner()) return;
    
    const userData = getUserData();
    userData.level = 99;
    userData.totalScore = 49500; // Level 99 = 49,500 points
    saveUserData(userData);
    
    playSound(659, 100);
    alert('✅ Set to Level 99!');
    
    if (document.getElementById('lobby-screen').classList.contains('active')) {
        showLobby();
    }
}

function unlimitedLives() {
    if (!isOwner()) return;
    
    cheatsEnabled.unlimitedLives = !cheatsEnabled.unlimitedLives;
    
    if (cheatsEnabled.unlimitedLives) {
        playSound(659, 100);
        alert('✅ Unlimited Lives Activated!');
    } else {
        playSound(523, 100);
        alert('❌ Unlimited Lives Deactivated');
    }
}

function instantWin() {
    if (!isOwner()) return;
    
    playSound(659, 200);
    
    // Check which game is active and trigger win
    const screens = ['game-screen', 'snake-screen', 'block-blast-screen', 'tic-tac-toe-screen', 
                     'wordle-screen', 'hangman-screen', 'minesweeper-screen', 'geometry-dash-screen'];
    
    for (const screenId of screens) {
        const screen = document.getElementById(screenId);
        if (screen && !screen.classList.contains('hidden')) {
            triggerInstantWin(screenId);
            return;
        }
    }
    
    alert('⚠️ No active game to win!');
}

function triggerInstantWin(screenId) {
    switch(screenId) {
        case 'game-screen':
            endGame();
            break;
        case 'snake-screen':
            endSnakeGame();
            break;
        case 'block-blast-screen':
            // Add massive score
            blockBlastGame.score += 10000;
            document.getElementById('block-blast-score').textContent = blockBlastGame.score;
            alert('✅ Added 10,000 Block Blast points!');
            break;
        case 'tic-tac-toe-screen':
            // Force win by setting board
            ticTacToeGame.board = ['X', 'X', 'X', '', '', '', '', '', ''];
            checkTicTacToeWinner();
            break;
        case 'wordle-screen':
            // Auto-solve wordle
            wordleGame.guesses[wordleGame.currentRow] = wordleGame.targetWord.split('');
            wordleGame.currentGuess = '';
            submitWordleGuess();
            break;
        case 'hangman-screen':
            // Reveal all letters
            hangmanGame.guessedLetters = hangmanGame.word.split('');
            updateHangmanWordDisplay();
            setTimeout(() => endHangmanGame(true), 100);
            break;
        case 'minesweeper-screen':
            // Reveal all non-mine cells
            for (let r = 0; r < minesweeperGame.rows; r++) {
                for (let c = 0; c < minesweeperGame.cols; c++) {
                    if (minesweeperGame.board[r][c] !== 'M') {
                        minesweeperGame.revealed[r][c] = true;
                    }
                }
            }
            checkMinesweeperWin();
            break;
        case 'geometry-dash-screen':
            // Instantly complete level
            geometryDashGame.distance = geometryDashGame.levelEndX;
            gdLevelComplete();
            break;
    }
}

function revealAnswers() {
    if (!isOwner()) return;
    
    cheatsEnabled.revealAnswers = !cheatsEnabled.revealAnswers;
    
    if (cheatsEnabled.revealAnswers) {
        playSound(659, 100);
        
        // Show answer based on current game
        if (!document.getElementById('wordle-screen').classList.contains('hidden')) {
            alert(`💡 Wordle Answer: ${wordleGame.targetWord}`);
        } else if (!document.getElementById('hangman-screen').classList.contains('hidden')) {
            alert(`💡 Hangman Answer: ${hangmanGame.word}`);
        } else if (!document.getElementById('game-screen').classList.contains('hidden')) {
            alert(`💡 Pattern: ${gameState.pattern.join(', ')}`);
        } else {
            alert('💡 Answer reveal activated! (Game-specific)');
        }
    } else {
        playSound(523, 100);
        alert('❌ Answer Reveal Deactivated');
    }
}

let gameState = {
    buttonCount: 4,
    pattern: [],
    playerPattern: [],
    round: 1,
    score: 0,
    isPlaying: false,
    canClick: false
};

// Snake Game State
let snakeGame = {
    canvas: null,
    ctx: null,
    snake: [],
    food: {},
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    gameLoop: null,
    isRunning: false,
    gridSize: 20,
    tileCount: 20
};

// Block Blast Game State
let blockBlastGame = {
    canvas: null,
    ctx: null,
    grid: [],
    score: 0,
    linesCleared: 0,
    currentBlocks: [],
    selectedBlock: null,
    isRunning: false,
    gridSize: 8,
    cellSize: 50,
    draggedBlock: null,
    draggedBlockElement: null,
    isDragging: false
};

// Tic Tac Toe Game State
let ticTacToeGame = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameMode: 'bot', // 'bot' or 'player'
    botDifficulty: 'medium', // 'easy', 'medium', 'hard'
    isGameOver: false,
    winner: null
};

// Wordle Game State
let wordleGame = {
    targetWord: '',
    currentRow: 0,
    currentGuess: '',
    guesses: [],
    gameOver: false,
    keyboardState: {}
};

// Hangman Game State
let hangmanGame = {
    word: '',
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrongs: 6,
    gameOver: false
};

// Minesweeper Game State
let minesweeperGame = {
    board: [],
    revealed: [],
    flagged: [],
    mines: [],
    rows: 8,
    cols: 8,
    mineCount: 10,
    gameOver: false,
    startTime: null,
    timer: null
};

// Geometry Dash Game State
let geometryDashGame = {
    canvas: null,
    ctx: null,
    player: { x: 100, y: 250, width: 30, height: 30, velocityY: 0, isJumping: false },
    obstacles: [],
    spikes: [],
    platforms: [],
    currentLevel: 1,
    maxLevel: 10,
    deaths: 0,
    scrollSpeed: 5,
    gravity: 0.8,
    jumpPower: -15,
    gameRunning: false,
    distance: 0,
    levelComplete: false
};

// Block shapes for Block Blast
const blockShapes = [
    [[1]], // single
    [[1, 1]], // 2 horizontal
    [[1], [1]], // 2 vertical
    [[1, 1, 1]], // 3 horizontal
    [[1], [1], [1]], // 3 vertical
    [[1, 1], [1, 1]], // 2x2 square
    [[1, 1, 0], [0, 1, 1]], // Z shape
    [[0, 1, 1], [1, 1, 0]], // S shape
    [[1, 1, 1], [1, 0, 0]], // L shape
    [[1, 1, 1], [0, 0, 1]], // reverse L
];

// Color emojis for buttons
const buttonSymbols = ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣', '⚪', '🟤', '⚫'];

// Sounds (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration = 200) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

const buttonFrequencies = [262, 330, 392, 523, 440, 494, 349, 294, 196];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAutoLogin();
    applySavedTheme();
    checkActiveBroadcasts();
    
    // Admin function to clear all data (type resetAllData() in console)
    window.resetAllData = function() {
        if (confirm('⚠️ WARNING: This will delete ALL users and data. Are you absolutely sure?')) {
            localStorage.removeItem('memoryGameUsers');
            localStorage.removeItem('currentUser');
            alert('All data has been cleared!');
            location.reload();
        }
    };
    
    // Admin function to delete specific user (type deleteUser('email') in console)
    window.deleteUser = function(email) {
        const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
        if (users[email]) {
            delete users[email];
            localStorage.setItem('memoryGameUsers', JSON.stringify(users));
            alert(`User ${email} has been deleted!`);
            if (currentUser === email) {
                logout();
            }
        } else {
            alert('User not found!');
        }
    };
});

// Authentication Functions
function showSignup() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    clearErrors();
}

function showLogin() {
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    clearErrors();
}

function showOwnerLoginList() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const modal = document.getElementById('owner-login-modal');
    const loginList = document.getElementById('owner-login-list');
    
    if (Object.keys(users).length === 0) {
        loginList.innerHTML = '<p style="text-align: center; color: #666;">No users found</p>';
    } else {
        let html = '';
        
        for (const email in users) {
            const user = users[email];
            html += `
                <div class="owner-login-item">
                    <div class="owner-login-info">
                        <div class="owner-login-username">${user.username || 'Unknown'}</div>
                        <div class="owner-login-email">${email}</div>
                    </div>
                    <button onclick="ownerLoginAs('${email}')" class="owner-login-btn">
                        Login
                    </button>
                </div>
            `;
        }
        
        loginList.innerHTML = html;
    }
    
    modal.classList.remove('hidden');
}

function ownerLoginAs(email) {
    currentUser = email;
    localStorage.setItem('currentUser', email);
    closeOwnerLoginModal();
    showLobby();
    playSound(659, 100);
}

function closeOwnerLoginModal() {
    document.getElementById('owner-login-modal').classList.add('hidden');
}

function clearErrors() {
    document.getElementById('login-error').textContent = '';
    document.getElementById('signup-error').textContent = '';
}

function signup() {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorElement = document.getElementById('signup-error');

    if (!username || !email || !password || !confirm) {
        errorElement.textContent = 'All fields are required';
        return;
    }

    if (username.length < 2) {
        errorElement.textContent = 'Username must be at least 2 characters';
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorElement.textContent = 'Please enter a valid email address';
        return;
    }

    if (password !== confirm) {
        errorElement.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 4) {
        errorElement.textContent = 'Password must be at least 4 characters';
        return;
    }

    // Get existing users
    let users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');

    // Check if email already exists
    if (users[email]) {
        errorElement.textContent = 'Email already registered';
        return;
    }

    // Check if username already exists
    for (let userEmail in users) {
        const existingUsername = users[userEmail].username;
        if (existingUsername && existingUsername.toLowerCase() === username.toLowerCase()) {
            errorElement.textContent = 'Username already taken';
            return;
        }
    }

    // Create new user
    users[email] = {
        username: username,
        password: password,
        totalScore: 0,
        gamesPlayed: 0,
        bestRound: 0,
        level: 1,
        scores: []
    };

    localStorage.setItem('memoryGameUsers', JSON.stringify(users));
    
    // Save to text file
    saveUserDataToFile(users);
    
    // Auto login after signup
    currentUser = email;
    localStorage.setItem('currentUser', email);
    showLobby();
}

function login() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    if (!email || !password) {
        errorElement.textContent = 'All fields are required';
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorElement.textContent = 'Please enter a valid email address';
        return;
    }

    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');

    if (!users[email]) {
        errorElement.textContent = 'Email not found';
        return;
    }

    if (users[email].password !== password) {
        errorElement.textContent = 'Incorrect password';
        return;
    }

    // Save to text file on login
    saveUserDataToFile(users);

    currentUser = email;
    
    // Don't save owner to localStorage for auto-login
    if (email !== OWNER_EMAIL) {
        localStorage.setItem('currentUser', email);
    }
    
    showLobby();
}

function checkAutoLogin() {
    const savedUser = localStorage.getItem('currentUser');
    
    // Don't auto-login if the saved user is the owner
    if (savedUser === OWNER_EMAIL) {
        localStorage.removeItem('currentUser');
        showScreen('auth-screen');
        return;
    }
    
    if (savedUser) {
        const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
        if (users[savedUser]) {
            currentUser = savedUser;
            showLobby();
            return;
        }
    }
    
    showScreen('auth-screen');
}

async function saveUserDataToFile(users) {
    // Encrypt sensitive user data for file export
    const encryptedUsers = {};
    
    for (let email in users) {
        const user = users[email];
        encryptedUsers[simpleEncrypt(email)] = {
            username: simpleEncrypt(user.username || ''),
            password: simpleEncrypt(user.password || ''),
            rank: user.rank || RANKS.USER,
            level: user.level || 1,
            totalScore: user.totalScore || 0,
            gamesPlayed: user.gamesPlayed || 0,
            bestRound: user.bestRound || 0,
            snakeHighScore: user.snakeHighScore || 0,
            blockBlastHighScore: user.blockBlastHighScore || 0,
            wordleWins: user.wordleWins || 0,
            wordleStreak: user.wordleStreak || 0,
            hangmanWins: user.hangmanWins || 0,
            hangmanStreak: user.hangmanStreak || 0,
            minesweeperWins: user.minesweeperWins || 0,
            minesweeperBestTime: user.minesweeperBestTime || 'N/A'
        };
    }
    
    // Save encrypted temp JSON for Node.js script
    try {
        const tempData = { 
            users: encryptedUsers, 
            encrypted: true,
            timestamp: new Date().toISOString() 
        };
        const jsonBlob = new Blob([JSON.stringify(tempData, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = 'temp_users.json';
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);
    } catch (err) {
        console.error('Error creating temp JSON:', err);
    }
    
    // Create encrypted text file
    let textContent = "=== ENCRYPTED MEMORY GAME USER DATABASE ===\n";
    textContent += "⚠️ This file contains encrypted user data\n";
    textContent += "Generated: " + new Date().toLocaleString() + "\n";
    textContent += "Total Users: " + Object.keys(users).length + "\n";
    textContent += "Encryption: Active (XOR + Base64)\n";
    textContent += "============================================\n\n";
    
    for (let encEmail in encryptedUsers) {
        const user = encryptedUsers[encEmail];
        textContent += "Email (ENC): " + encEmail + "\n";
        textContent += "Username (ENC): " + user.username + "\n";
        textContent += "Password (ENC): " + user.password + "\n";
        textContent += "Rank: " + user.rank + "\n";
        textContent += "Level: " + user.level + "\n";
        textContent += "Total Score: " + user.totalScore + "\n";
        textContent += "Games Played: " + user.gamesPlayed + "\n";
        textContent += "Best Round: " + user.bestRound + "\n";
        textContent += "Snake High Score: " + user.snakeHighScore + "\n";
        textContent += "Block Blast High Score: " + user.blockBlastHighScore + "\n";
        textContent += "Wordle Wins: " + user.wordleWins + "\n";
        textContent += "Hangman Wins: " + user.hangmanWins + "\n";
        textContent += "Minesweeper Wins: " + user.minesweeperWins + "\n";
        textContent += "----------------------------------------\n\n";
    }
    
    // Create text file and download
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_data_encrypted.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function logout() {
    const wasOwner = isOwner();
    
    localStorage.removeItem('currentUser');
    currentUser = null;
    clearGameState(); // Clear any active game state
    showScreen('auth-screen');
    
    // If was owner, show owner section but don't save to localStorage
    if (wasOwner) {
    
    // Clear input fields
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    
    // Update cheat status display for owner
    if (isOwner()) {
        const statusText = document.getElementById('cheat-status');
        const settingBtn = document.getElementById('cheat-menu-toggle-setting');
        
        if (statusText && settingBtn) {
            statusText.textContent = cheatMenuEnabled ? 'ON' : 'OFF';
            
            // Set colors based on status
            if (cheatMenuEnabled) {
                statusText.style.color = '#27ae60';
                settingBtn.style.borderLeft = '4px solid #27ae60';
            } else {
                statusText.style.color = '#e74c3c';
                settingBtn.style.borderLeft = '4px solid #e74c3c';
            }
        }
    }
    
    // Update visibility for all rank-based controls
    updateSettingsVisibility();
    
    modal.classList.toggle('hidden');
}

function viewAllUserData() {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    const modal = document.getElementById('owner-modal');
    const userList = document.getElementById('owner-user-list');
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    
    if (Object.keys(users).length === 0) {
        userList.innerHTML = '<p style="text-align: center; color: #666;">No users found</p>';
    } else {
        let html = '';
        
        for (const email in users) {
            const user = users[email];
            const isOwnerUser = email === OWNER_EMAIL;
            const userRank = user.rank || RANKS.USER;
            
            // Rank badge
            let rankBadge = '';
            if (isOwnerUser) {
                rankBadge = '<div class="owner-badge">👑 OWNER</div>';
            } else if (userRank === RANKS.CO_OWNER) {
                rankBadge = '<div class="rank-badge co-owner">⭐ CO-OWNER</div>';
            } else if (userRank === RANKS.ADMIN) {
                rankBadge = '<div class="rank-badge admin">🛡️ ADMIN</div>';
            }
            
            // Rank promotion buttons (only for non-owner users)
            let rankButtons = '';
            if (!isOwnerUser) {
                rankButtons = `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <div style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 5px;">Manage Rank:</div>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button onclick="setUserRank('${email}', 'user')" class="rank-btn ${userRank === RANKS.USER ? 'active' : ''}">
                                👤 User
                            </button>
                            <button onclick="setUserRank('${email}', 'admin')" class="rank-btn ${userRank === RANKS.ADMIN ? 'active' : ''}">
                                🛡️ Admin
                            </button>
                            <button onclick="setUserRank('${email}', 'co-owner')" class="rank-btn ${userRank === RANKS.CO_OWNER ? 'active' : ''}">
                                ⭐ Co-Owner
                            </button>
                        </div>
                    </div>
                `;
            }
            
            html += `
                <div class="owner-user-card ${isOwnerUser ? 'is-owner' : ''}">
                    <div class="owner-user-header">
                        <div class="owner-user-title">${user.username || 'Unknown'}</div>
                        ${rankBadge}
                    </div>
                    
                    <div class="owner-user-info">
                        <div class="owner-info-item">
                            <div class="owner-info-label">📧 Email</div>
                            <div class="owner-info-value">${email}</div>
                        </div>
                        <div class="owner-info-item">
                            <div class="owner-info-label">🔑 Password</div>
                            <div class="owner-info-value">${user.password || 'N/A'}</div>
                        </div>
                        <div class="owner-info-item">
                            <div class="owner-info-label">👤 Username</div>
                            <div class="owner-info-value">${user.username || 'N/A'}</div>
                        </div>
                        <div class="owner-info-item">
                            <div class="owner-info-label">📊 Level & Score</div>
                            <div class="owner-info-value">Level ${user.level || 1} • ${user.totalScore || 0} pts</div>
                        </div>
                    </div>
                    ${rankButtons}
                    
                    <div class="owner-stats-grid">
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">🎯 Pattern</div>
                            <div class="owner-stat-value">${user.highScore || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">🐍 Snake</div>
                            <div class="owner-stat-value">${user.snakeHighScore || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">🧱 Block</div>
                            <div class="owner-stat-value">${user.blockBlastScore || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">❌⭕ TicTac</div>
                            <div class="owner-stat-value">${user.ticTacToeWins || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">📝 Wordle</div>
                            <div class="owner-stat-value">${user.wordleWins || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">🎭 Hangman</div>
                            <div class="owner-stat-value">${user.hangmanWins || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">💣 Mines</div>
                            <div class="owner-stat-value">${user.minesweeperWins || 0}</div>
                        </div>
                        <div class="owner-stat-item">
                            <div class="owner-stat-label">🎮 GeoDash</div>
                            <div class="owner-stat-value">Lv ${user.gdBestLevel || 0}</div>
                        </div>
                    </div>
                    
                    ${!isOwnerUser ? `
                        <div style="margin-top: 15px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                            <button onclick="ownerLoginAsUser('${email}')" class="owner-login-as-btn">
                                🔑 Login as User
                            </button>
                            <button onclick="ownerDeleteUser('${email}')" class="owner-delete-btn">
                                🗑️ Delete This User
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        userList.innerHTML = html;
    }
    
    modal.classList.remove('hidden');
    toggleSettings(); // Close settings modal
}

function closeOwnerModal() {
    document.getElementById('owner-modal').classList.add('hidden');
}

function ownerDeleteUser(emailToDelete) {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    if (emailToDelete === OWNER_EMAIL) {
        alert('Cannot delete the owner account!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const username = users[emailToDelete]?.username || emailToDelete;
    
    if (!confirm(`Are you sure you want to delete user "${username}" (${emailToDelete})?\n\nThis action cannot be undone!`)) {
        return;
    }
    
    // Delete the user
    delete users[emailToDelete];
    localStorage.setItem('memoryGameUsers', JSON.stringify(users));
    
    // Save to file
    saveUserDataToFile(users);
    
    alert(`User "${username}" has been deleted successfully`);
    
    // Refresh the owner panel
    viewAllUserData();
}

function ownerLoginAsUser(email) {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const user = users[email];
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    const username = user.username || email;
    
    if (confirm(`Login as "${username}"?\n\nYou will be logged in as this user.`)) {
        currentUser = email;
        localStorage.setItem('currentUser', email);
        
        closeOwnerModal();
        showLobby();
        
        playSound(659, 100);
        setTimeout(() => {
            alert(`✅ Logged in as: ${username}`);
        }, 500);
    }
}

function setUserRank(email, rank) {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const user = users[email];
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    // Prevent promoting to OWNER rank
    if (rank === RANKS.OWNER) {
        alert('Cannot promote users to OWNER rank!');
        return;
    }
    
    // Validate rank
    const validRanks = [RANKS.USER, RANKS.ADMIN, RANKS.CO_OWNER];
    if (!validRanks.includes(rank)) {
        alert('Invalid rank!');
        return;
    }
    
    const username = user.username || email;
    const rankNames = {
        [RANKS.USER]: 'User',
        [RANKS.ADMIN]: 'Admin',
        [RANKS.CO_OWNER]: 'Co-Owner'
    };
    
    // Update rank
    users[email].rank = rank;
    localStorage.setItem('memoryGameUsers', JSON.stringify(users));
    
    // Save to file
    saveUserDataToFile();
    
    // Refresh display
    viewAllUserData();
    
    // Confirmation
    playSound(523, 100);
    alert(`✅ ${username} promoted to ${rankNames[rank]}!`);
}

function deleteAccount() {
    if (!confirm('⚠️ WARNING: This will permanently delete your account and all data!\n\nAre you absolutely sure you want to delete your account?\n\nThis action CANNOT be undone!')) {
        return;
    }
    
    if (!confirm('This is your final warning. Delete account permanently?')) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const username = users[currentUser]?.username || 'User';
    
    if (users[currentUser]) {
        delete users[currentUser];
        localStorage.setItem('memoryGameUsers', JSON.stringify(users));
        
        // Save updated data to file
        saveUserDataToFile(users);
        
        // Logout
        localStorage.removeItem('currentUser');
        currentUser = null;
        
        alert(`Account "${username}" has been permanently deleted.`);
        showScreen('auth-screen');
        
        // Clear input fields
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm').value = '';
    }
}

function resetPoints() {
    if (!confirm('Are you sure you want to reset all your points, games played, and best round? This cannot be undone!')) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    if (users[currentUser]) {
        users[currentUser].totalScore = 0;
        users[currentUser].gamesPlayed = 0;
        users[currentUser].bestRound = 0;
        users[currentUser].level = 1;
        users[currentUser].scores = [];
        users[currentUser].snakeHighScore = 0;
        users[currentUser].blockBlastHighScore = 0;
        users[currentUser].wordleWins = 0;
        users[currentUser].wordleStreak = 0;
        users[currentUser].hangmanWins = 0;
        users[currentUser].hangmanStreak = 0;
        users[currentUser].minesweeperWins = 0;
        users[currentUser].minesweeperBestTime = null;
        localStorage.setItem('memoryGameUsers', JSON.stringify(users));
        
        // Save updated data to file
        saveUserDataToFile(users);
        
        // Refresh the display
        showLobby();
        alert('All points and stats have been reset!');
    }
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showLobby() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];

    // Ensure backward compatibility
    if (!userData.level) {
        userData.level = 1;
    }
    if (!userData.username) {
        userData.username = currentUser;
    }
    localStorage.setItem('memoryGameUsers', JSON.stringify(users));

    const displayName = userData.username || currentUser;
    
    // Rank badge logic
    let rankBadge = '';
    const userRank = getUserRank();
    
    if (userRank === RANKS.OWNER) {
        rankBadge = ' <span class="owner-badge">👑 OWNER</span>';
    } else if (userRank === RANKS.CO_OWNER) {
        rankBadge = ' <span class="rank-badge co-owner">⭐ CO-OWNER</span>';
    } else if (userRank === RANKS.ADMIN) {
        rankBadge = ' <span class="rank-badge admin">�️ ADMIN</span>';
    }
    
    document.getElementById('lobby-username-display').innerHTML = displayName + rankBadge;
    document.getElementById('lobby-level').textContent = userData.level || 1;
    document.getElementById('lobby-score').textContent = userData.totalScore || 0;
    document.getElementById('lobby-best').textContent = userData.bestRound || 0;

    showCheatButton();
    updateLobbyGames();
    showScreen('lobby-screen');
}

function showGameSetup() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];

    const displayName = userData.username || currentUser;
    document.getElementById('username-display').textContent = displayName;
    document.getElementById('player-level-display').textContent = userData.level || 1;
    document.getElementById('total-score').textContent = userData.totalScore || 0;
    document.getElementById('best-round').textContent = userData.bestRound || 0;

    updateLeaderboard();
    showScreen('setup-screen');
}

function backToLobby() {
    showLobby();
}

function updateLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    // Convert users object to array
    for (const email in users) {
        const user = users[email];
        leaderboardData.push({
            email: email,
            username: user.username || email,
            level: user.level || 1,
            totalScore: user.totalScore || 0,
            bestRound: user.bestRound || 0
        });
    }

    // Sort by total score (descending)
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);

    // Display top 10
    const leaderboardElement = document.getElementById('leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players yet</div>';
        return;
    }

    leaderboardElement.innerHTML = '';
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.email === currentUser;
        const rankClass = `rank-${rank}`;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${rankClass} ${isCurrentUser ? 'current-user' : ''}`;
        
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
                <div class="leaderboard-level">Level ${user.level}</div>
            </div>
            <div class="leaderboard-stats">
                <div class="leaderboard-score">${user.totalScore}</div>
                <div class="leaderboard-rounds">Best: Round ${user.bestRound}</div>
            </div>
        `;
        
        leaderboardElement.appendChild(item);
    });
}

function showSetupScreen() {
    showGameSetup();
}

// Game Functions
function startGame(buttonCount) {
    gameState.buttonCount = buttonCount;
    gameState.pattern = [];
    gameState.playerPattern = [];
    gameState.round = 1;
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.canClick = false;
    
    // Track game state for spectators
    updateGameState('Pattern Memory', {
        round: 1,
        score: 0,
        buttons: buttonCount
    });
    
    // Create game board
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    gameBoard.className = `game-board grid-${buttonCount}`;
    
    for (let i = 0; i < buttonCount; i++) {
        const button = document.createElement('button');
        button.className = 'card disabled';
        button.dataset.index = i;
        button.textContent = buttonSymbols[i];
        button.onclick = () => handleButtonClick(i);
        gameBoard.appendChild(button);
    }
    
    // Update display
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];
    const displayName = userData.username || currentUser;
    
    document.getElementById('game-username').textContent = displayName;
    document.getElementById('player-level').textContent = userData.level || 1;
    document.getElementById('round-number').textContent = '1';
    document.getElementById('current-score').textContent = '0';
    document.getElementById('game-status').textContent = 'Watch the pattern!';
    
    showScreen('game-screen');
    
    // Start first round
    setTimeout(() => nextRound(), 1000);
}

function nextRound() {
    gameState.playerPattern = [];
    gameState.canClick = false;
    
    // Add new random button to pattern
    const randomButton = Math.floor(Math.random() * gameState.buttonCount);
    gameState.pattern.push(randomButton);
    
    document.getElementById('round-number').textContent = gameState.round;
    document.getElementById('game-status').textContent = 'Watch the pattern!';
    
    // Disable all buttons
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('disabled');
    });
    
    // Play the pattern
    playPattern();
}

async function playPattern() {
    for (let i = 0; i < gameState.pattern.length; i++) {
        await sleep(400);
        await lightUpButton(gameState.pattern[i]);
    }
    
    // Enable player input
    gameState.canClick = true;
    document.getElementById('game-status').textContent = 'Your turn!';
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('disabled');
    });
    
    // Auto-play if cheat is enabled
    if (cheatsEnabled.autoPlay && isOwner()) {
        setTimeout(() => autoPlayPattern(), 500);
    }
}

async function autoPlayPattern() {
    if (!cheatsEnabled.autoPlay || !gameState.isPlaying) return;
    
    for (let i = 0; i < gameState.pattern.length; i++) {
        await sleep(600);
        handleButtonClick(gameState.pattern[i]);
    }
}

function lightUpButton(index) {
    return new Promise(resolve => {
        const button = document.querySelector(`[data-index="${index}"]`);
        button.classList.add('active');
        playSound(buttonFrequencies[index]);
        
        setTimeout(() => {
            button.classList.remove('active');
            resolve();
        }, 400);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function handleButtonClick(index) {
    if (!gameState.canClick || !gameState.isPlaying) return;
    
    // Light up the button
    const button = document.querySelector(`[data-index="${index}"]`);
    button.classList.add('active');
    playSound(buttonFrequencies[index]);
    
    setTimeout(() => {
        button.classList.remove('active');
    }, 200);
    
    // Add to player pattern
    gameState.playerPattern.push(index);
    
    // Check if correct
    const currentStep = gameState.playerPattern.length - 1;
    if (gameState.playerPattern[currentStep] !== gameState.pattern[currentStep]) {
        // Wrong button!
        gameOver();
        return;
    }
    
    // Check if pattern complete
    if (gameState.playerPattern.length === gameState.pattern.length) {
        // Correct! Move to next round
        gameState.canClick = false;
        
        // Get user's current level for score calculation
        const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
        const userData = users[currentUser];
        const currentLevel = userData.level || 1;
        
        // Score increases with both round and level
        const scoreEarned = gameState.round * 10 * currentLevel;
        gameState.score += scoreEarned;
        document.getElementById('current-score').textContent = gameState.score;
        document.getElementById('game-status').textContent = 'Correct! Get ready...';
        
        // Show correct feedback
        gameState.playerPattern.forEach((btnIndex, i) => {
            setTimeout(() => {
                const btn = document.querySelector(`[data-index="${btnIndex}"]`);
                btn.classList.add('correct');
                setTimeout(() => btn.classList.remove('correct'), 500);
            }, i * 100);
        });
        
        gameState.round++;
        setTimeout(() => nextRound(), 2000);
    }
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.canClick = false;
    
    document.getElementById('game-status').textContent = 'Game Over!';
    
    // Show wrong animation
    gameState.playerPattern.forEach((btnIndex, i) => {
        setTimeout(() => {
            const btn = document.querySelector(`[data-index="${btnIndex}"]`);
            btn.classList.add('wrong');
        }, i * 100);
    });
    
    // Play error sound
    playSound(150, 500);
    
    // Update user stats
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];
    userData.totalScore += gameState.score;
    userData.gamesPlayed++;
    if (gameState.round - 1 > (userData.bestRound || 0)) {
        userData.bestRound = gameState.round - 1;
    }
    
    // Level up system: Every 500 total score = 1 level
    const newLevel = Math.floor(userData.totalScore / 500) + 1;
    if (newLevel > (userData.level || 1)) {
        userData.level = newLevel;
    }
    
    userData.scores.push({
        score: gameState.score,
        round: gameState.round - 1,
        patternLength: gameState.pattern.length,
        buttonCount: gameState.buttonCount,
        date: new Date().toISOString()
    });
    localStorage.setItem('memoryGameUsers', JSON.stringify(users));
    
    // Show game over screen
    setTimeout(() => {
        document.getElementById('final-round').textContent = gameState.round - 1;
        document.getElementById('turn-score').textContent = gameState.score;
        document.getElementById('pattern-length').textContent = gameState.pattern.length;
        document.getElementById('game-over').classList.remove('hidden');
    }, 1500);
}

function exitGame() {
    gameState.isPlaying = false;
    clearGameState();
    showGameSetup();
}

function backToSetup() {
    document.getElementById('game-over').classList.add('hidden');
    clearGameState();
    showGameSetup();
}

// Snake Game Functions
function showSnakeGame() {
    snakeGame.canvas = document.getElementById('snakeCanvas');
    snakeGame.ctx = snakeGame.canvas.getContext('2d');
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];
    const displayName = userData.username || currentUser;
    
    document.getElementById('snake-username').textContent = displayName;
    document.getElementById('snake-high-score').textContent = userData.snakeHighScore || 0;
    document.getElementById('snake-start-btn').disabled = false;
    document.getElementById('snake-game-over').classList.add('hidden');
    
    updateSnakeLeaderboard();
    showScreen('snake-screen');
    
    // Setup keyboard controls
    document.removeEventListener('keydown', handleSnakeKeys);
    document.addEventListener('keydown', handleSnakeKeys);
}

function updateSnakeLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.snakeHighScore && user.snakeHighScore > 0) {
            leaderboardData.push({
                email: email,
                username: user.username || email,
                score: user.snakeHighScore
            });
        }
    }

    leaderboardData.sort((a, b) => b.score - a.score);

    const leaderboardElement = document.getElementById('snake-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No scores yet</div>';
        return;
    }

    leaderboardElement.innerHTML = '';
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.email === currentUser;
        const rankClass = `rank-${rank}`;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${rankClass} ${isCurrentUser ? 'current-user' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
            </div>
            <div class="leaderboard-stats">
                <div class="leaderboard-score">${user.score}</div>
            </div>
        `;
        leaderboardElement.appendChild(item);
    });
}

function handleSnakeKeys(e) {
    if (!snakeGame.isRunning) return;
    
    const key = e.key.toLowerCase();
    
    // Prevent default for arrow keys
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
    }
    
    // Change direction (can't go backwards)
    if ((key === 'arrowup' || key === 'w') && snakeGame.direction !== 'DOWN') {
        snakeGame.nextDirection = 'UP';
    } else if ((key === 'arrowdown' || key === 's') && snakeGame.direction !== 'UP') {
        snakeGame.nextDirection = 'DOWN';
    } else if ((key === 'arrowleft' || key === 'a') && snakeGame.direction !== 'RIGHT') {
        snakeGame.nextDirection = 'LEFT';
    } else if ((key === 'arrowright' || key === 'd') && snakeGame.direction !== 'LEFT') {
        snakeGame.nextDirection = 'RIGHT';
    }
}

function startSnake() {
    // Reset game state
    snakeGame.snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    snakeGame.direction = 'RIGHT';
    snakeGame.nextDirection = 'RIGHT';
    snakeGame.score = 0;
    snakeGame.isRunning = true;
    
    document.getElementById('snake-score').textContent = '0';
    document.getElementById('snake-start-btn').disabled = true;
    document.getElementById('snake-game-over').classList.add('hidden');
    
    spawnFood();
    
    if (snakeGame.gameLoop) {
        clearInterval(snakeGame.gameLoop);
    }
    
    snakeGame.gameLoop = setInterval(updateSnake, 100);
}

function spawnFood() {
    let validPosition = false;
    
    while (!validPosition) {
        snakeGame.food = {
            x: Math.floor(Math.random() * snakeGame.tileCount),
            y: Math.floor(Math.random() * snakeGame.tileCount)
        };
        
        // Check if food spawns on snake
        validPosition = !snakeGame.snake.some(segment => 
            segment.x === snakeGame.food.x && segment.y === snakeGame.food.y
        );
    }
}

function updateSnake() {
    if (!snakeGame.isRunning) return;
    
    // Auto-play AI for snake
    if (cheatsEnabled.autoPlay && isOwner()) {
        snakeAutoPlay();
    }
    
    // Update direction
    snakeGame.direction = snakeGame.nextDirection;
    
    // Calculate new head position
    const head = {...snakeGame.snake[0]};
    
    switch (snakeGame.direction) {
        case 'UP':
            head.y--;
            break;
        case 'DOWN':
            head.y++;
            break;
        case 'LEFT':
            head.x--;
            break;
        case 'RIGHT':
            head.x++;
            break;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= snakeGame.tileCount || 
        head.y < 0 || head.y >= snakeGame.tileCount) {
        endSnake();
        return;
    }
    
    // Check self collision
    if (snakeGame.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endSnake();
        return;
    }
    
    // Add new head
    snakeGame.snake.unshift(head);
    
    // Check if food eaten
    if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
        snakeGame.score += 10;
        document.getElementById('snake-score').textContent = snakeGame.score;
        playSound(523, 100);
        spawnFood();
    } else {
        // Remove tail if no food eaten
        snakeGame.snake.pop();
    }
    
    drawSnake();
}

function snakeAutoPlay() {
    const head = snakeGame.snake[0];
    const food = snakeGame.food;
    
    // Simple AI: move towards food
    const dx = food.x - head.x;
    const dy = food.y - head.y;
    
    let newDirection = snakeGame.direction;
    
    // Prioritize horizontal or vertical movement
    if (Math.abs(dx) > Math.abs(dy)) {
        // Move horizontally
        if (dx > 0 && snakeGame.direction !== 'LEFT') {
            newDirection = 'RIGHT';
        } else if (dx < 0 && snakeGame.direction !== 'RIGHT') {
            newDirection = 'LEFT';
        } else if (dy > 0 && snakeGame.direction !== 'UP') {
            newDirection = 'DOWN';
        } else if (dy < 0 && snakeGame.direction !== 'DOWN') {
            newDirection = 'UP';
        }
    } else {
        // Move vertically
        if (dy > 0 && snakeGame.direction !== 'UP') {
            newDirection = 'DOWN';
        } else if (dy < 0 && snakeGame.direction !== 'DOWN') {
            newDirection = 'UP';
        } else if (dx > 0 && snakeGame.direction !== 'LEFT') {
            newDirection = 'RIGHT';
        } else if (dx < 0 && snakeGame.direction !== 'RIGHT') {
            newDirection = 'LEFT';
        }
    }
    
    snakeGame.nextDirection = newDirection;
}

function drawSnake() {
    const ctx = snakeGame.ctx;
    const gridSize = snakeGame.gridSize;
    
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, snakeGame.canvas.width, snakeGame.canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= snakeGame.tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, snakeGame.canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(snakeGame.canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Draw food
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(
        snakeGame.food.x * gridSize + gridSize / 2,
        snakeGame.food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Draw snake
    snakeGame.snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = '#667eea';
        } else {
            // Body
            ctx.fillStyle = '#764ba2';
        }
        
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });
}

function endSnake() {
    snakeGame.isRunning = false;
    clearInterval(snakeGame.gameLoop);
    
    playSound(150, 500);
    
    const applesEaten = Math.floor(snakeGame.score / 10);
    
    // Update user stats
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];
    
    if (!userData.snakeHighScore || snakeGame.score > userData.snakeHighScore) {
        userData.snakeHighScore = snakeGame.score;
        document.getElementById('snake-high-score').textContent = snakeGame.score;
    }
    
    // Award points to total score (snake score / 10)
    const pointsEarned = Math.floor(snakeGame.score / 10);
    userData.totalScore += pointsEarned;
    
    // Update level
    const newLevel = Math.floor(userData.totalScore / 500) + 1;
    if (newLevel > (userData.level || 1)) {
        userData.level = newLevel;
    }
    
    if (!userData.snakeScores) {
        userData.snakeScores = [];
    }
    userData.snakeScores.push({
        score: snakeGame.score,
        apples: applesEaten,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('memoryGameUsers', JSON.stringify(users));
    
    // Show game over
    document.getElementById('snake-final-score').textContent = snakeGame.score;
    document.getElementById('snake-apples').textContent = applesEaten;
    document.getElementById('snake-start-btn').disabled = false;
    document.getElementById('snake-game-over').classList.remove('hidden');
}

function exitSnake() {
    if (snakeGame.isRunning) {
        snakeGame.isRunning = false;
        clearInterval(snakeGame.gameLoop);
    }
    document.removeEventListener('keydown', handleSnakeKeys);
    showLobby();
}

// Block Blast Game Functions
function showBlockBlast() {
    blockBlastGame.canvas = document.getElementById('blockblastCanvas');
    blockBlastGame.ctx = blockBlastGame.canvas.getContext('2d');
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];
    const displayName = userData.username || currentUser;
    
    document.getElementById('blockblast-username').textContent = displayName;
    document.getElementById('blockblast-high-score').textContent = userData.blockBlastHighScore || 0;
    document.getElementById('blockblast-start-btn').disabled = false;
    document.getElementById('blockblast-game-over').classList.add('hidden');
    
    updateBlockBlastLeaderboard();
    showScreen('blockblast-screen');
    
    // Setup drag and drop on canvas
    blockBlastGame.canvas.addEventListener('dragover', handleCanvasDragOver);
    blockBlastGame.canvas.addEventListener('drop', handleCanvasDrop);
    blockBlastGame.canvas.onclick = handleBlockBlastClick;
}

function updateBlockBlastLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.blockBlastHighScore && user.blockBlastHighScore > 0) {
            leaderboardData.push({
                email: email,
                username: user.username || email,
                score: user.blockBlastHighScore
            });
        }
    }

    leaderboardData.sort((a, b) => b.score - a.score);

    const leaderboardElement = document.getElementById('blockblast-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No scores yet</div>';
        return;
    }

    leaderboardElement.innerHTML = '';
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.email === currentUser;
        const rankClass = `rank-${rank}`;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${rankClass} ${isCurrentUser ? 'current-user' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
            </div>
            <div class="leaderboard-stats">
                <div class="leaderboard-score">${user.score}</div>
            </div>
        `;
        leaderboardElement.appendChild(item);
    });
}

function startBlockBlast() {
    // Initialize empty grid
    blockBlastGame.grid = Array(blockBlastGame.gridSize).fill(null).map(() => 
        Array(blockBlastGame.gridSize).fill(0)
    );
    
    blockBlastGame.score = 0;
    blockBlastGame.linesCleared = 0;
    blockBlastGame.isRunning = true;
    blockBlastGame.selectedBlock = null;
    
    document.getElementById('blockblast-score').textContent = '0';
    document.getElementById('blockblast-start-btn').disabled = true;
    document.getElementById('blockblast-game-over').classList.add('hidden');
    
    generateNewBlocks();
    drawBlockBlastGrid();
}

function generateNewBlocks() {
    blockBlastGame.currentBlocks = [];
    for (let i = 0; i < 3; i++) {
        const randomShape = blockShapes[Math.floor(Math.random() * blockShapes.length)];
        blockBlastGame.currentBlocks.push({
            shape: randomShape,
            used: false
        });
    }
    displayNextBlocks();
}

function displayNextBlocks() {
    const container = document.getElementById('next-blocks-display');
    container.innerHTML = '';
    
    blockBlastGame.currentBlocks.forEach((block, index) => {
        if (!block.used) {
            const preview = document.createElement('canvas');
            preview.className = 'next-block-preview';
            preview.width = 60;
            preview.height = 60;
            preview.style.cursor = 'grab';
            preview.draggable = true;
            const ctx = preview.getContext('2d');
            
            // Draw block preview
            const cellSize = 60 / Math.max(block.shape.length, block.shape[0].length);
            block.shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        ctx.fillStyle = '#667eea';
                        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                    }
                });
            });
            
            // Add drag event listeners
            preview.addEventListener('dragstart', (e) => handleBlockDragStart(e, index));
            preview.addEventListener('dragend', handleBlockDragEnd);
            preview.onclick = () => selectBlock(index);
            
            container.appendChild(preview);
        }
    });
}

function selectBlock(index) {
    if (blockBlastGame.currentBlocks[index].used) return;
    blockBlastGame.selectedBlock = index;
    displayNextBlocks();
}

function handleBlockDragStart(e, index) {
    if (!blockBlastGame.isRunning || blockBlastGame.currentBlocks[index].used) {
        e.preventDefault();
        return;
    }
    
    blockBlastGame.draggedBlock = index;
    blockBlastGame.isDragging = true;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    
    // Visual feedback
    e.target.style.opacity = '0.5';
}

function handleBlockDragEnd(e) {
    e.target.style.opacity = '1';
    blockBlastGame.isDragging = false;
    
    // Remove visual feedback from canvas
    blockBlastGame.canvas.classList.remove('drag-over');
}

function handleCanvasDragOver(e) {
    if (!blockBlastGame.isDragging || blockBlastGame.draggedBlock === null) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback
    blockBlastGame.canvas.classList.add('drag-over');
}

function handleCanvasDrop(e) {
    e.preventDefault();
    
    // Remove visual feedback
    blockBlastGame.canvas.classList.remove('drag-over');
    
    if (!blockBlastGame.isRunning || blockBlastGame.draggedBlock === null) return;
    
    const rect = blockBlastGame.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / blockBlastGame.cellSize);
    const y = Math.floor((e.clientY - rect.top) / blockBlastGame.cellSize);
    
    if (canPlaceBlock(x, y, blockBlastGame.draggedBlock)) {
        placeBlock(x, y, blockBlastGame.draggedBlock);
        blockBlastGame.currentBlocks[blockBlastGame.draggedBlock].used = true;
        blockBlastGame.draggedBlock = null;
        blockBlastGame.selectedBlock = null;
        
        clearLines();
        drawBlockBlastGrid();
        displayNextBlocks();
        
        // Check if all blocks used
        if (blockBlastGame.currentBlocks.every(b => b.used)) {
            generateNewBlocks();
        }
        
        // Check game over
        if (!hasValidMoves()) {
            endBlockBlast();
        }
    } else {
        blockBlastGame.draggedBlock = null;
    }
}

function handleBlockBlastClick(e) {
    if (!blockBlastGame.isRunning || blockBlastGame.selectedBlock === null) return;
    
    const rect = blockBlastGame.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / blockBlastGame.cellSize);
    const y = Math.floor((e.clientY - rect.top) / blockBlastGame.cellSize);
    
    if (canPlaceBlock(x, y, blockBlastGame.selectedBlock)) {
        placeBlock(x, y, blockBlastGame.selectedBlock);
        blockBlastGame.currentBlocks[blockBlastGame.selectedBlock].used = true;
        blockBlastGame.selectedBlock = null;
        
        clearLines();
        drawBlockBlastGrid();
        displayNextBlocks();
        
        // Check if all blocks used
        if (blockBlastGame.currentBlocks.every(b => b.used)) {
            generateNewBlocks();
        }
        
        // Check game over
        if (!hasValidMoves()) {
            endBlockBlast();
        }
    }
}

function canPlaceBlock(gridX, gridY, blockIndex) {
    const block = blockBlastGame.currentBlocks[blockIndex];
    if (!block || block.used) return false;
    
    for (let y = 0; y < block.shape.length; y++) {
        for (let x = 0; x < block.shape[y].length; x++) {
            if (block.shape[y][x]) {
                const newX = gridX + x;
                const newY = gridY + y;
                
                if (newX < 0 || newX >= blockBlastGame.gridSize || 
                    newY < 0 || newY >= blockBlastGame.gridSize ||
                    blockBlastGame.grid[newY][newX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBlock(gridX, gridY, blockIndex) {
    const block = blockBlastGame.currentBlocks[blockIndex];
    let cellsPlaced = 0;
    
    for (let y = 0; y < block.shape.length; y++) {
        for (let x = 0; x < block.shape[y].length; x++) {
            if (block.shape[y][x]) {
                blockBlastGame.grid[gridY + y][gridX + x] = 1;
                cellsPlaced++;
            }
        }
    }
    
    blockBlastGame.score += cellsPlaced * 10;
    document.getElementById('blockblast-score').textContent = blockBlastGame.score;
}

function clearLines() {
    let linesCleared = 0;
    
    // Check rows
    for (let y = 0; y < blockBlastGame.gridSize; y++) {
        if (blockBlastGame.grid[y].every(cell => cell === 1)) {
            blockBlastGame.grid[y].fill(0);
            linesCleared++;
        }
    }
    
    // Check columns
    for (let x = 0; x < blockBlastGame.gridSize; x++) {
        let columnFull = true;
        for (let y = 0; y < blockBlastGame.gridSize; y++) {
            if (blockBlastGame.grid[y][x] === 0) {
                columnFull = false;
                break;
            }
        }
        if (columnFull) {
            for (let y = 0; y < blockBlastGame.gridSize; y++) {
                blockBlastGame.grid[y][x] = 0;
            }
            linesCleared++;
        }
    }
    
    if (linesCleared > 0) {
        blockBlastGame.linesCleared += linesCleared;
        blockBlastGame.score += linesCleared * 100;
        document.getElementById('blockblast-score').textContent = blockBlastGame.score;
        playSound(523, 100);
    }
}

function hasValidMoves() {
    for (let blockIndex = 0; blockIndex < blockBlastGame.currentBlocks.length; blockIndex++) {
        if (blockBlastGame.currentBlocks[blockIndex].used) continue;
        
        for (let y = 0; y < blockBlastGame.gridSize; y++) {
            for (let x = 0; x < blockBlastGame.gridSize; x++) {
                if (canPlaceBlock(x, y, blockIndex)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function drawBlockBlastGrid() {
    const ctx = blockBlastGame.ctx;
    const cellSize = blockBlastGame.cellSize;
    
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, blockBlastGame.canvas.width, blockBlastGame.canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= blockBlastGame.gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, blockBlastGame.canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(blockBlastGame.canvas.width, i * cellSize);
        ctx.stroke();
    }
    
    // Draw placed blocks
    for (let y = 0; y < blockBlastGame.gridSize; y++) {
        for (let x = 0; x < blockBlastGame.gridSize; x++) {
            if (blockBlastGame.grid[y][x]) {
                ctx.fillStyle = '#667eea';
                ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
            }
        }
    }
}

function endBlockBlast() {
    blockBlastGame.isRunning = false;
    playSound(150, 500);
    
    // Update user stats
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const userData = users[currentUser];
    
    if (!userData.blockBlastHighScore || blockBlastGame.score > userData.blockBlastHighScore) {
        userData.blockBlastHighScore = blockBlastGame.score;
        document.getElementById('blockblast-high-score').textContent = blockBlastGame.score;
    }
    
    // Award points (block blast score / 10)
    const pointsEarned = Math.floor(blockBlastGame.score / 10);
    userData.totalScore += pointsEarned;
    
    // Update level
    const newLevel = Math.floor(userData.totalScore / 500) + 1;
    if (newLevel > (userData.level || 1)) {
        userData.level = newLevel;
    }
    
    if (!userData.blockBlastScores) {
        userData.blockBlastScores = [];
    }
    userData.blockBlastScores.push({
        score: blockBlastGame.score,
        linesCleared: blockBlastGame.linesCleared,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('memoryGameUsers', JSON.stringify(users));
    updateBlockBlastLeaderboard();
    
    // Show game over
    document.getElementById('blockblast-final-score').textContent = blockBlastGame.score;
    document.getElementById('blockblast-lines').textContent = blockBlastGame.linesCleared;
    document.getElementById('blockblast-start-btn').disabled = false;
    document.getElementById('blockblast-game-over').classList.remove('hidden');
}

function exitBlockBlast() {
    blockBlastGame.isRunning = false;
    showLobby();
}

// Tic Tac Toe Functions
function showTicTacToeSetup() {
    showScreen('tictactoe-setup-screen');
}

function showBotDifficultySelection() {
    showScreen('tictactoe-difficulty-screen');
}

function startTicTacToe(mode, difficulty) {
    ticTacToeGame.board = ['', '', '', '', '', '', '', '', ''];
    ticTacToeGame.currentPlayer = 'X';
    ticTacToeGame.gameMode = mode;
    ticTacToeGame.botDifficulty = difficulty;
    ticTacToeGame.isGameOver = false;
    ticTacToeGame.winner = null;
    
    let modeText = '';
    if (mode === 'bot') {
        const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        modeText = `Player (X) vs Bot (O) - ${difficultyName}`;
        document.getElementById('tictactoe-difficulty-display').textContent = `Difficulty: ${difficultyName}`;
        document.getElementById('tictactoe-difficulty-display').style.display = 'block';
    } else {
        modeText = 'Player vs Player';
        document.getElementById('tictactoe-difficulty-display').style.display = 'none';
    }
    
    document.getElementById('tictactoe-mode-display').textContent = modeText;
    document.getElementById('tictactoe-turn').textContent = 'X';
    document.getElementById('tictactoe-status-text').textContent = "X's Turn";
    document.getElementById('tictactoe-game-over').classList.add('hidden');
    
    // Reset board cells
    const cells = document.querySelectorAll('.tictactoe-cell');
    cells.forEach((cell, index) => {
        cell.textContent = '';
        cell.disabled = false;
        cell.classList.remove('winner');
        cell.onclick = () => handleTicTacToeClick(index);
    });
    
    showScreen('tictactoe-screen');
}

function handleTicTacToeClick(index) {
    if (ticTacToeGame.isGameOver || ticTacToeGame.board[index] !== '') return;
    
    // Player makes move
    makeMove(index, ticTacToeGame.currentPlayer);
    
    // Check for winner or draw
    if (checkWinner()) {
        endTicTacToeGame(ticTacToeGame.winner);
        return;
    }
    
    if (isBoardFull()) {
        endTicTacToeGame('draw');
        return;
    }
    
    // Switch player
    ticTacToeGame.currentPlayer = ticTacToeGame.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();
    
    // Bot makes move if in bot mode
    if (ticTacToeGame.gameMode === 'bot' && ticTacToeGame.currentPlayer === 'O') {
        setTimeout(() => {
            makeBotMove();
        }, 500);
    }
}

function makeMove(index, player) {
    ticTacToeGame.board[index] = player;
    const cell = document.querySelector(`.tictactoe-cell[data-index="${index}"]`);
    cell.textContent = player;
    cell.disabled = true;
}

function updateTurnDisplay() {
    document.getElementById('tictactoe-turn').textContent = ticTacToeGame.currentPlayer;
    document.getElementById('tictactoe-status-text').textContent = `${ticTacToeGame.currentPlayer}'s Turn`;
}

function makeBotMove() {
    if (ticTacToeGame.isGameOver) return;
    
    if (ticTacToeGame.botDifficulty === 'easy') {
        makeEasyBotMove();
    } else if (ticTacToeGame.botDifficulty === 'medium') {
        makeMediumBotMove();
    } else if (ticTacToeGame.botDifficulty === 'hard') {
        makeHardBotMove();
    }
}

function makeEasyBotMove() {
    // Easy: Random move only
    const move = getRandomMove();
    
    if (move !== -1) {
        makeMove(move, 'O');
        
        if (checkWinner()) {
            endTicTacToeGame(ticTacToeGame.winner);
            return;
        }
        
        if (isBoardFull()) {
            endTicTacToeGame('draw');
            return;
        }
        
        ticTacToeGame.currentPlayer = 'X';
        updateTurnDisplay();
    }
}

function makeMediumBotMove() {
    // Medium: Try to win, block player, or random
    let move = findWinningMove('O');
    if (move === -1) move = findWinningMove('X'); // Block player
    if (move === -1) move = getRandomMove();
    
    if (move !== -1) {
        makeMove(move, 'O');
        
        if (checkWinner()) {
            endTicTacToeGame(ticTacToeGame.winner);
            return;
        }
        
        if (isBoardFull()) {
            endTicTacToeGame('draw');
            return;
        }
        
        ticTacToeGame.currentPlayer = 'X';
        updateTurnDisplay();
    }
}

function makeHardBotMove() {
    // Hard: Use minimax algorithm for perfect play
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
        if (ticTacToeGame.board[i] === '') {
            ticTacToeGame.board[i] = 'O';
            const score = minimax(0, false);
            ticTacToeGame.board[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    if (bestMove !== -1) {
        makeMove(bestMove, 'O');
        
        if (checkWinner()) {
            endTicTacToeGame(ticTacToeGame.winner);
            return;
        }
        
        if (isBoardFull()) {
            endTicTacToeGame('draw');
            return;
        }
        
        ticTacToeGame.currentPlayer = 'X';
        updateTurnDisplay();
    }
}

function minimax(depth, isMaximizing) {
    // Check terminal states
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (ticTacToeGame.board[a] !== '' &&
            ticTacToeGame.board[a] === ticTacToeGame.board[b] &&
            ticTacToeGame.board[a] === ticTacToeGame.board[c]) {
            if (ticTacToeGame.board[a] === 'O') return 10 - depth;
            if (ticTacToeGame.board[a] === 'X') return depth - 10;
        }
    }
    
    if (ticTacToeGame.board.every(cell => cell !== '')) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (ticTacToeGame.board[i] === '') {
                ticTacToeGame.board[i] = 'O';
                const score = minimax(depth + 1, false);
                ticTacToeGame.board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (ticTacToeGame.board[i] === '') {
                ticTacToeGame.board[i] = 'X';
                const score = minimax(depth + 1, true);
                ticTacToeGame.board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function findWinningMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        const values = [ticTacToeGame.board[a], ticTacToeGame.board[b], ticTacToeGame.board[c]];
        
        // Check if two cells have the player and one is empty
        if (values.filter(v => v === player).length === 2 && values.includes('')) {
            if (ticTacToeGame.board[a] === '') return a;
            if (ticTacToeGame.board[b] === '') return b;
            if (ticTacToeGame.board[c] === '') return c;
        }
    }
    
    return -1;
}

function getRandomMove() {
    const emptyIndices = [];
    ticTacToeGame.board.forEach((cell, index) => {
        if (cell === '') emptyIndices.push(index);
    });
    
    if (emptyIndices.length > 0) {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }
    
    return -1;
}

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (ticTacToeGame.board[a] !== '' &&
            ticTacToeGame.board[a] === ticTacToeGame.board[b] &&
            ticTacToeGame.board[a] === ticTacToeGame.board[c]) {
            
            ticTacToeGame.winner = ticTacToeGame.board[a];
            
            // Highlight winning cells
            [a, b, c].forEach(index => {
                document.querySelector(`.tictactoe-cell[data-index="${index}"]`).classList.add('winner');
            });
            
            return true;
        }
    }
    
    return false;
}

function isBoardFull() {
    return ticTacToeGame.board.every(cell => cell !== '');
}

function endTicTacToeGame(result) {
    ticTacToeGame.isGameOver = true;
    
    const resultElement = document.getElementById('tictactoe-result');
    
    if (result === 'draw') {
        resultElement.textContent = "It's a Draw!";
        document.getElementById('tictactoe-status-text').textContent = "Game Tied!";
    } else {
        const winnerText = ticTacToeGame.gameMode === 'bot' && result === 'O' ? 
            'Bot Wins!' : `${result} Wins!`;
        resultElement.textContent = winnerText;
        document.getElementById('tictactoe-status-text').textContent = winnerText;
        playSound(523, 200);
    }
    
    // Disable all cells
    document.querySelectorAll('.tictactoe-cell').forEach(cell => {
        cell.disabled = true;
    });
    
    setTimeout(() => {
        document.getElementById('tictactoe-game-over').classList.remove('hidden');
    }, 500);
}

function restartTicTacToe() {
    startTicTacToe(ticTacToeGame.gameMode, ticTacToeGame.botDifficulty);
}

function exitTicTacToe() {
    showLobby();
}

// Wordle Functions
const WORDLE_WORDS = ['APPLE', 'BRAVE', 'CHAIR', 'DANCE', 'EARTH', 'FLAME', 'GRACE', 'HAPPY', 'IMAGE', 'JUICE', 
                      'KNIFE', 'LAUGH', 'MAGIC', 'NIGHT', 'OCEAN', 'PEACE', 'QUIET', 'RIVER', 'STORM', 'TABLE',
                      'UNDER', 'VOICE', 'WATER', 'YOUNG', 'ZEBRA', 'BLOCK', 'CROWN', 'DREAM', 'FIELD', 'GLOVE',
                      'HEART', 'LIGHT', 'MOUNT', 'NOISE', 'PLANT', 'QUEEN', 'ROUND', 'SWEET', 'TOWER', 'WHEEL',
                      'BLANK', 'CHALK', 'DRIFT', 'FLAME', 'FROST', 'GHOST', 'GRAPE', 'HOUSE', 'LEMON', 'MOUSE',
                      'PIZZA', 'SHARK', 'SHINE', 'SNAKE', 'SPACE', 'SPARK', 'STONE', 'TRADE', 'TRAIN', 'TRUCK'];

function showWordleGame() {
    showScreen('wordle-screen');
    const userData = getUserData();
    document.getElementById('wordle-username').textContent = userData.username;
    document.getElementById('wordle-wins').textContent = userData.wordleWins || 0;
    document.getElementById('wordle-streak').textContent = userData.wordleStreak || 0;
    
    updateWordleLeaderboard();
    
    // Setup keyboard controls
    document.removeEventListener('keydown', handleWordleKeys);
    document.addEventListener('keydown', handleWordleKeys);
    
    startWordle();
}

function startWordle() {
    // Reset game state
    wordleGame.targetWord = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    wordleGame.currentRow = 0;
    wordleGame.currentGuess = '';
    wordleGame.guesses = [];
    wordleGame.gameOver = false;
    wordleGame.keyboardState = {};
    
    console.log('Wordle answer:', wordleGame.targetWord); // For testing
    
    document.getElementById('wordle-game-over').classList.add('hidden');
    
    // Create game board (6 rows x 5 columns)
    const board = document.getElementById('wordle-board');
    board.innerHTML = '';
    
    for (let row = 0; row < 6; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'wordle-row';
        rowDiv.dataset.row = row;
        
        for (let col = 0; col < 5; col++) {
            const tile = document.createElement('div');
            tile.className = 'wordle-tile';
            tile.dataset.row = row;
            tile.dataset.col = col;
            rowDiv.appendChild(tile);
        }
        
        board.appendChild(rowDiv);
    }
    
    // Create keyboard
    buildWordleKeyboard();
}

function buildWordleKeyboard() {
    const keyboard = document.getElementById('wordle-keyboard');
    keyboard.innerHTML = '';
    
    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];
    
    keyboardLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'wordle-keyboard-row';
        
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'wordle-key';
            btn.textContent = key;
            btn.dataset.key = key;
            
            if (key === 'ENTER' || key === '⌫') {
                btn.style.minWidth = '65px';
            }
            
            btn.onclick = () => handleWordleKeyPress(key);
            rowDiv.appendChild(btn);
        });
        
        keyboard.appendChild(rowDiv);
    });
}

function handleWordleKeys(e) {
    if (wordleGame.gameOver) return;
    
    if (e.key === 'Enter') {
        handleWordleKeyPress('ENTER');
    } else if (e.key === 'Backspace') {
        handleWordleKeyPress('⌫');
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        handleWordleKeyPress(e.key.toUpperCase());
    }
}

function handleWordleKeyPress(key) {
    if (wordleGame.gameOver) return;
    
    if (key === '⌫') {
        // Backspace
        if (wordleGame.currentGuess.length > 0) {
            wordleGame.currentGuess = wordleGame.currentGuess.slice(0, -1);
            updateWordleTiles();
        }
    } else if (key === 'ENTER') {
        // Submit guess
        if (wordleGame.currentGuess.length === 5) {
            submitWordleGuess();
        }
    } else if (wordleGame.currentGuess.length < 5) {
        // Add letter
        wordleGame.currentGuess += key;
        updateWordleTiles();
    }
}

function updateWordleTiles() {
    const row = wordleGame.currentRow;
    
    for (let col = 0; col < 5; col++) {
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const letter = wordleGame.currentGuess[col] || '';
        
        tile.textContent = letter;
        
        if (letter) {
            tile.classList.add('filled');
        } else {
            tile.classList.remove('filled');
        }
    }
}

function submitWordleGuess() {
    const guess = wordleGame.currentGuess;
    const target = wordleGame.targetWord;
    
    // Count letter frequency in target word
    const targetLetters = {};
    for (let letter of target) {
        targetLetters[letter] = (targetLetters[letter] || 0) + 1;
    }
    
    // First pass: mark correct letters (green)
    const result = Array(5).fill('absent');
    const tempTarget = {...targetLetters};
    
    for (let i = 0; i < 5; i++) {
        if (guess[i] === target[i]) {
            result[i] = 'correct';
            tempTarget[guess[i]]--;
        }
    }
    
    // Second pass: mark present letters (yellow)
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'absent' && tempTarget[guess[i]] > 0) {
            result[i] = 'present';
            tempTarget[guess[i]]--;
        }
    }
    
    // Animate tiles
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`[data-row="${wordleGame.currentRow}"][data-col="${i}"]`);
        
        setTimeout(() => {
            tile.classList.add('flip');
            setTimeout(() => {
                tile.classList.remove('filled');
                tile.classList.add(result[i]);
                updateWordleKeyboard(guess[i], result[i]);
            }, 150);
        }, i * 150);
    }
    
    // Check win/lose after animation
    setTimeout(() => {
        if (guess === target) {
            endWordleGame(true);
        } else if (wordleGame.currentRow === 5) {
            endWordleGame(false);
        } else {
            wordleGame.currentRow++;
            wordleGame.currentGuess = '';
        }
    }, 750 + 300);
}

function updateWordleKeyboard(letter, state) {
    const key = document.querySelector(`.wordle-key[data-key="${letter}"]`);
    if (!key) return;
    
    // Only update if new state is better
    if (state === 'correct') {
        key.classList.remove('absent', 'present');
        key.classList.add('correct');
    } else if (state === 'present' && !key.classList.contains('correct')) {
        key.classList.remove('absent');
        key.classList.add('present');
    } else if (state === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
        key.classList.add('absent');
    }
}

function endWordleGame(won) {
    wordleGame.gameOver = true;
    const userData = getUserData();
    
    if (won) {
        userData.wordleWins = (userData.wordleWins || 0) + 1;
        userData.wordleStreak = (userData.wordleStreak || 0) + 1;
        userData.totalScore = (userData.totalScore || 0) + 50;
        
        // Update level
        const newLevel = Math.floor(userData.totalScore / 500) + 1;
        userData.level = newLevel;
        
        playSound(523, 100);
        setTimeout(() => playSound(659, 100), 100);
        setTimeout(() => playSound(784, 200), 200);
        
        document.getElementById('wordle-result').textContent = '🎉 You Won!';
    } else {
        userData.wordleStreak = 0;
        playSound(200, 300);
        document.getElementById('wordle-result').textContent = '😢 Game Over!';
    }
    
    saveUserData(userData);
    
    document.getElementById('wordle-wins').textContent = userData.wordleWins || 0;
    document.getElementById('wordle-streak').textContent = userData.wordleStreak || 0;
    document.getElementById('wordle-answer').textContent = wordleGame.targetWord;
    
    updateWordleLeaderboard();
    
    setTimeout(() => {
        document.getElementById('wordle-game-over').classList.remove('hidden');
    }, 500);
}

function updateWordleLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.wordleWins && user.wordleWins > 0) {
            leaderboardData.push({
                email: email,
                username: user.username || email,
                wins: user.wordleWins || 0,
                streak: user.wordleStreak || 0
            });
        }
    }

    leaderboardData.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.streak - a.streak;
    });

    const leaderboardElement = document.getElementById('wordle-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No scores yet</div>';
        return;
    }

    const currentUserEmail = currentUser;
    leaderboardElement.innerHTML = '';
    
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.email === currentUserEmail;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
            <div class="leaderboard-score">${user.wins} wins • ${user.streak} streak</div>
        `;
        leaderboardElement.appendChild(item);
    });
}

function exitWordle() {
    document.removeEventListener('keydown', handleWordleKeys);
    showLobby();
}

// Hangman Functions

function startWordle() {
    wordleGame.targetWord = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    wordleGame.currentRow = 0;
    wordleGame.currentGuess = '';
    wordleGame.guesses = [];
    wordleGame.gameOver = false;
    wordleGame.keyboardState = {};
    
    document.getElementById('wordle-game-over').classList.add('hidden');
    
    // Create board
    const board = document.getElementById('wordle-board');
    board.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'wordle-row';
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'wordle-tile';
            tile.dataset.row = i;
            tile.dataset.col = j;
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
    
    // Create keyboard
    createWordleKeyboard();
}

function createWordleKeyboard() {
    const keyboard = document.getElementById('wordle-keyboard');
    keyboard.innerHTML = '';
    
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
    ];
    
    rows.forEach(rowKeys => {
        const row = document.createElement('div');
        row.className = 'wordle-keyboard-row';
        rowKeys.forEach(key => {
            const button = document.createElement('button');
            button.className = 'wordle-key';
            button.textContent = key;
            button.onclick = () => handleWordleKey(key);
            row.appendChild(button);
        });
        keyboard.appendChild(row);
    });
}

function handleWordleKey(key) {
    if (wordleGame.gameOver) return;
    
    if (key === 'BACK') {
        if (wordleGame.currentGuess.length > 0) {
            wordleGame.currentGuess = wordleGame.currentGuess.slice(0, -1);
            updateCurrentRow();
        }
    } else if (key === 'ENTER') {
        if (wordleGame.currentGuess.length === 5) {
            submitGuess();
        }
    } else if (wordleGame.currentGuess.length < 5) {
        wordleGame.currentGuess += key;
        updateCurrentRow();
    }
}

function updateCurrentRow() {
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`[data-row="${wordleGame.currentRow}"][data-col="${i}"]`);
        tile.textContent = wordleGame.currentGuess[i] || '';
        tile.className = wordleGame.currentGuess[i] ? 'wordle-tile filled' : 'wordle-tile';
    }
}

function submitGuess() {
    const guess = wordleGame.currentGuess;
    wordleGame.guesses.push(guess);
    
    // Color tiles
    const letterCount = {};
    for (let letter of wordleGame.targetWord) {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    
    const result = new Array(5).fill('absent');
    
    // First pass: mark correct positions
    for (let i = 0; i < 5; i++) {
        if (guess[i] === wordleGame.targetWord[i]) {
            result[i] = 'correct';
            letterCount[guess[i]]--;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'absent' && letterCount[guess[i]] > 0) {
            result[i] = 'present';
            letterCount[guess[i]]--;
        }
    }
    
    // Update tiles
    for (let i = 0; i < 5; i++) {
        const tile = document.querySelector(`[data-row="${wordleGame.currentRow}"][data-col="${i}"]`);
        setTimeout(() => {
            tile.classList.add(result[i]);
        }, i * 100);
        
        // Update keyboard
        const keyButton = Array.from(document.querySelectorAll('.wordle-key')).find(k => k.textContent === guess[i]);
        if (keyButton) {
            const currentClass = keyButton.className;
            if (!currentClass.includes('correct') && (result[i] === 'correct' || (result[i] === 'present' && !currentClass.includes('present')))) {
                keyButton.classList.add(result[i]);
            } else if (result[i] === 'absent' && !currentClass.includes('correct') && !currentClass.includes('present')) {
                keyButton.classList.add('absent');
            }
        }
    }
    
    // Check win/lose
    if (guess === wordleGame.targetWord) {
        setTimeout(() => endWordleGame(true), 600);
    } else if (wordleGame.currentRow === 5) {
        setTimeout(() => endWordleGame(false), 600);
    } else {
        wordleGame.currentRow++;
        wordleGame.currentGuess = '';
    }
}

function endWordleGame(won) {
    wordleGame.gameOver = true;
    const userData = getUserData();
    
    if (won) {
        userData.wordleWins = (userData.wordleWins || 0) + 1;
        userData.wordleStreak = (userData.wordleStreak || 0) + 1;
        userData.totalScore = (userData.totalScore || 0) + 50;
        playSound(523, 100);
        playSound(659, 100);
        playSound(784, 200);
    } else {
        userData.wordleStreak = 0;
        playSound(200, 300);
    }
    
    saveUserData(userData);
    updateWordleLeaderboard();
    
    document.getElementById('wordle-wins').textContent = userData.wordleWins || 0;
    document.getElementById('wordle-streak').textContent = userData.wordleStreak || 0;
    document.getElementById('wordle-answer').textContent = wordleGame.targetWord;
    document.getElementById('wordle-result').textContent = won ? 'You Won!' : 'Game Over!';
    document.getElementById('wordle-game-over').classList.remove('hidden');
}

function updateWordleLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.wordleWins) {
            leaderboardData.push({
                username: user.username || email,
                wins: user.wordleWins || 0,
                streak: user.wordleStreak || 0
            });
        }
    }

    leaderboardData.sort((a, b) => b.wins - a.wins);

    const leaderboardElement = document.getElementById('wordle-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players yet</div>';
        return;
    }

    leaderboardElement.innerHTML = '';
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-name">${user.username}</div>
            <div class="leaderboard-score">${user.wins} wins (${user.streak} streak)</div>
        `;
        leaderboardElement.appendChild(item);
    });
}

function exitWordle() {
    document.removeEventListener('keydown', handleWordleKeys);
    showLobby();
}

// Hangman Functions
const HANGMAN_WORDS = ['JAVASCRIPT', 'PYTHON', 'PROGRAMMING', 'COMPUTER', 'KEYBOARD', 'MONITOR', 'SOFTWARE', 
                       'HARDWARE', 'INTERNET', 'DATABASE', 'ALGORITHM', 'FUNCTION', 'VARIABLE', 'INTERFACE',
                       'DEVELOPER', 'ENGINEER', 'WEBSITE', 'APPLICATION', 'FRAMEWORK', 'LIBRARY', 'NETWORK',
                       'BROWSER', 'DOCUMENT', 'ELEMENT', 'VIRTUAL', 'TERMINAL', 'CONSOLE', 'MESSAGE', 'BOOLEAN'];

function showHangmanGame() {
    showScreen('hangman-screen');
    const userData = getUserData();
    document.getElementById('hangman-username').textContent = userData.username;
    document.getElementById('hangman-wins').textContent = userData.hangmanWins || 0;
    document.getElementById('hangman-streak').textContent = userData.hangmanStreak || 0;
    
    updateHangmanLeaderboard();
    
    // Setup keyboard controls
    document.removeEventListener('keydown', handleHangmanKeys);
    document.addEventListener('keydown', handleHangmanKeys);
    
    startHangman();
}

function startHangman() {
    // Reset game state
    hangmanGame.word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    hangmanGame.guessedLetters = [];
    hangmanGame.wrongGuesses = 0;
    hangmanGame.gameOver = false;
    
    console.log('Hangman word:', hangmanGame.word); // For testing
    
    document.getElementById('hangman-game-over').classList.add('hidden');
    document.getElementById('hangman-lives').textContent = hangmanGame.maxWrongs;
    
    // Display word
    updateHangmanWordDisplay();
    
    // Build keyboard
    buildHangmanKeyboard();
    
    // Draw hangman
    drawHangmanStand();
}

function buildHangmanKeyboard() {
    const keyboard = document.getElementById('hangman-keyboard');
    keyboard.innerHTML = '';
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    letters.forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'hangman-key';
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.onclick = () => handleHangmanGuess(letter);
        keyboard.appendChild(btn);
    });
}

function handleHangmanKeys(e) {
    if (hangmanGame.gameOver) return;
    
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        handleHangmanGuess(e.key.toUpperCase());
    }
}

function handleHangmanGuess(letter) {
    if (hangmanGame.gameOver) return;
    if (hangmanGame.guessedLetters.includes(letter)) return;
    
    hangmanGame.guessedLetters.push(letter);
    
    // Update button
    const btn = document.querySelector(`.hangman-key[data-letter="${letter}"]`);
    if (btn) {
        btn.disabled = true;
    }
    
    // Check if letter is in word
    if (hangmanGame.word.includes(letter)) {
        // Correct guess
        if (btn) btn.classList.add('correct');
        playSound(523, 100);
        
        updateHangmanWordDisplay();
        
        // Check for win
        const allLettersGuessed = hangmanGame.word.split('').every(l => 
            hangmanGame.guessedLetters.includes(l)
        );
        
        if (allLettersGuessed) {
            setTimeout(() => endHangmanGame(true), 500);
        }
    } else {
        // Wrong guess
        if (btn) btn.classList.add('incorrect');
        
        // Don't increase wrong guesses if unlimited lives cheat is on
        if (!cheatsEnabled.unlimitedLives || !isOwner()) {
            hangmanGame.wrongGuesses++;
        }
        
        const livesLeft = hangmanGame.maxWrongs - hangmanGame.wrongGuesses;
        document.getElementById('hangman-lives').textContent = livesLeft;
        
        playSound(200, 100);
        drawHangmanPart(hangmanGame.wrongGuesses);
        
        // Check for loss (not if unlimited lives)
        if (hangmanGame.wrongGuesses >= hangmanGame.maxWrongs && !(cheatsEnabled.unlimitedLives && isOwner())) {
            setTimeout(() => endHangmanGame(false), 500);
        }
    }
}

function updateHangmanWordDisplay() {
    const display = document.getElementById('hangman-word');
    const wordDisplay = hangmanGame.word.split('').map(letter => {
        return hangmanGame.guessedLetters.includes(letter) ? letter : '_';
    }).join(' ');
    
    display.textContent = wordDisplay;
}

function drawHangmanStand() {
    const canvas = document.getElementById('hangmanCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Draw gallows
    // Base
    ctx.beginPath();
    ctx.moveTo(10, 240);
    ctx.lineTo(190, 240);
    ctx.stroke();
    
    // Vertical post
    ctx.beginPath();
    ctx.moveTo(50, 240);
    ctx.lineTo(50, 10);
    ctx.stroke();
    
    // Top beam
    ctx.beginPath();
    ctx.moveTo(50, 10);
    ctx.lineTo(150, 10);
    ctx.stroke();
    
    // Rope
    ctx.beginPath();
    ctx.moveTo(150, 10);
    ctx.lineTo(150, 40);
    ctx.stroke();
}

function drawHangmanPart(partNumber) {
    const canvas = document.getElementById('hangmanCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    switch(partNumber) {
        case 1: // Head
            ctx.beginPath();
            ctx.arc(150, 60, 20, 0, Math.PI * 2);
            ctx.stroke();
            break;
        case 2: // Body
            ctx.beginPath();
            ctx.moveTo(150, 80);
            ctx.lineTo(150, 150);
            ctx.stroke();
            break;
        case 3: // Left arm
            ctx.beginPath();
            ctx.moveTo(150, 100);
            ctx.lineTo(120, 130);
            ctx.stroke();
            break;
        case 4: // Right arm
            ctx.beginPath();
            ctx.moveTo(150, 100);
            ctx.lineTo(180, 130);
            ctx.stroke();
            break;
        case 5: // Left leg
            ctx.beginPath();
            ctx.moveTo(150, 150);
            ctx.lineTo(130, 190);
            ctx.stroke();
            break;
        case 6: // Right leg
            ctx.beginPath();
            ctx.moveTo(150, 150);
            ctx.lineTo(170, 190);
            ctx.stroke();
            break;
    }
}

function endHangmanGame(won) {
    hangmanGame.gameOver = true;
    const userData = getUserData();
    
    if (won) {
        userData.hangmanWins = (userData.hangmanWins || 0) + 1;
        userData.hangmanStreak = (userData.hangmanStreak || 0) + 1;
        userData.totalScore = (userData.totalScore || 0) + 30;
        
        // Update level
        const newLevel = Math.floor(userData.totalScore / 500) + 1;
        userData.level = newLevel;
        
        playSound(523, 100);
        setTimeout(() => playSound(659, 200), 100);
        
        document.getElementById('hangman-result').textContent = '🎉 You Won!';
    } else {
        userData.hangmanStreak = 0;
        playSound(200, 300);
        document.getElementById('hangman-result').textContent = '😢 Game Over!';
    }
    
    saveUserData(userData);
    
    document.getElementById('hangman-wins').textContent = userData.hangmanWins || 0;
    document.getElementById('hangman-streak').textContent = userData.hangmanStreak || 0;
    document.getElementById('hangman-answer').textContent = hangmanGame.word;
    
    // Show complete word
    document.getElementById('hangman-word').textContent = hangmanGame.word.split('').join(' ');
    
    updateHangmanLeaderboard();
    
    setTimeout(() => {
        document.getElementById('hangman-game-over').classList.remove('hidden');
    }, 800);
}

function updateHangmanLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.hangmanWins && user.hangmanWins > 0) {
            leaderboardData.push({
                email: email,
                username: user.username || email,
                wins: user.hangmanWins || 0,
                streak: user.hangmanStreak || 0
            });
        }
    }

    leaderboardData.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.streak - a.streak;
    });

    const leaderboardElement = document.getElementById('hangman-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No scores yet</div>';
        return;
    }

    const currentUserEmail = currentUser;
    leaderboardElement.innerHTML = '';
    
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.email === currentUserEmail;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
            <div class="leaderboard-score">${user.wins} wins • ${user.streak} streak</div>
        `;
        leaderboardElement.appendChild(item);
    });
}

// Minesweeper Functions
function showMinesweeperGame() {
    showScreen('minesweeper-screen');
    document.getElementById('minesweeper-username').textContent = getUserData().username;
    updateMinesweeperLeaderboard();
}

function startMinesweeper(difficulty = 'easy') {
    if (minesweeperGame.timer) {
        clearInterval(minesweeperGame.timer);
    }
    
    // Set difficulty
    if (difficulty === 'easy') {
        minesweeperGame.rows = 8;
        minesweeperGame.cols = 8;
        minesweeperGame.mineCount = 10;
    } else if (difficulty === 'medium') {
        minesweeperGame.rows = 12;
        minesweeperGame.cols = 12;
        minesweeperGame.mineCount = 20;
    } else {
        minesweeperGame.rows = 16;
        minesweeperGame.cols = 16;
        minesweeperGame.mineCount = 40;
    }
    
    minesweeperGame.board = [];
    minesweeperGame.revealed = [];
    minesweeperGame.flagged = [];
    minesweeperGame.mines = [];
    minesweeperGame.gameOver = false;
    minesweeperGame.startTime = null;
    
    document.getElementById('minesweeper-game-over').classList.add('hidden');
    document.getElementById('minesweeper-mines').textContent = minesweeperGame.mineCount;
    document.getElementById('minesweeper-flags').textContent = '0/' + minesweeperGame.mineCount;
    document.getElementById('minesweeper-time').textContent = '0';
    
    // Initialize board
    for (let r = 0; r < minesweeperGame.rows; r++) {
        minesweeperGame.board[r] = [];
        minesweeperGame.revealed[r] = [];
        minesweeperGame.flagged[r] = [];
        for (let c = 0; c < minesweeperGame.cols; c++) {
            minesweeperGame.board[r][c] = 0;
            minesweeperGame.revealed[r][c] = false;
            minesweeperGame.flagged[r][c] = false;
        }
    }
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < minesweeperGame.mineCount) {
        const r = Math.floor(Math.random() * minesweeperGame.rows);
        const c = Math.floor(Math.random() * minesweeperGame.cols);
        if (minesweeperGame.board[r][c] !== 'M') {
            minesweeperGame.board[r][c] = 'M';
            minesweeperGame.mines.push({r, c});
            minesPlaced++;
        }
    }
    
    // Calculate numbers
    for (let r = 0; r < minesweeperGame.rows; r++) {
        for (let c = 0; c < minesweeperGame.cols; c++) {
            if (minesweeperGame.board[r][c] !== 'M') {
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < minesweeperGame.rows && nc >= 0 && nc < minesweeperGame.cols) {
                            if (minesweeperGame.board[nr][nc] === 'M') count++;
                        }
                    }
                }
                minesweeperGame.board[r][c] = count;
            }
        }
    }
    
    createMinesweeperBoard();
}

function createMinesweeperBoard() {
    const boardElement = document.getElementById('minesweeper-board');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${minesweeperGame.cols}, 30px)`;
    
    for (let r = 0; r < minesweeperGame.rows; r++) {
        for (let c = 0; c < minesweeperGame.cols; c++) {
            const cell = document.createElement('button');
            cell.className = 'minesweeper-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.onclick = () => revealCell(r, c);
            cell.oncontextmenu = (e) => {
                e.preventDefault();
                toggleFlag(r, c);
            };
            boardElement.appendChild(cell);
        }
    }
}

function revealCell(r, c) {
    if (minesweeperGame.gameOver || minesweeperGame.revealed[r][c] || minesweeperGame.flagged[r][c]) return;
    
    if (!minesweeperGame.startTime) {
        minesweeperGame.startTime = Date.now();
        minesweeperGame.timer = setInterval(updateMinesweeperTimer, 1000);
    }
    
    minesweeperGame.revealed[r][c] = true;
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    cell.classList.add('revealed');
    
    if (minesweeperGame.board[r][c] === 'M') {
        cell.classList.add('mine');
        cell.textContent = '💣';
        endMinesweeperGame(false);
        return;
    }
    
    const num = minesweeperGame.board[r][c];
    if (num > 0) {
        cell.textContent = num;
        cell.classList.add(`num-${num}`);
    } else {
        // Reveal adjacent cells
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < minesweeperGame.rows && nc >= 0 && nc < minesweeperGame.cols) {
                    if (!minesweeperGame.revealed[nr][nc]) {
                        revealCell(nr, nc);
                    }
                }
            }
        }
    }
    
    playSound(440, 50);
    checkMinesweeperWin();
}

function toggleFlag(r, c) {
    if (minesweeperGame.gameOver || minesweeperGame.revealed[r][c]) return;
    
    minesweeperGame.flagged[r][c] = !minesweeperGame.flagged[r][c];
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    
    if (minesweeperGame.flagged[r][c]) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
    } else {
        cell.classList.remove('flagged');
        cell.textContent = '';
    }
    
    const flagCount = minesweeperGame.flagged.flat().filter(f => f).length;
    document.getElementById('minesweeper-flags').textContent = flagCount + '/' + minesweeperGame.mineCount;
}

function updateMinesweeperTimer() {
    const elapsed = Math.floor((Date.now() - minesweeperGame.startTime) / 1000);
    document.getElementById('minesweeper-time').textContent = elapsed;
}

function checkMinesweeperWin() {
    let cellsToReveal = minesweeperGame.rows * minesweeperGame.cols - minesweeperGame.mineCount;
    let revealedCount = minesweeperGame.revealed.flat().filter(r => r).length;
    
    if (revealedCount === cellsToReveal) {
        endMinesweeperGame(true);
    }
}

function endMinesweeperGame(won) {
    minesweeperGame.gameOver = true;
    
    if (minesweeperGame.timer) {
        clearInterval(minesweeperGame.timer);
    }
    
    const finalTime = minesweeperGame.startTime ? Math.floor((Date.now() - minesweeperGame.startTime) / 1000) : 0;
    
    if (won) {
        const userData = getUserData();
        const bestTime = userData.minesweeperBestTime || Infinity;
        if (finalTime < bestTime) {
            userData.minesweeperBestTime = finalTime;
        }
        userData.minesweeperWins = (userData.minesweeperWins || 0) + 1;
        userData.totalScore = (userData.totalScore || 0) + 100;
        saveUserData(userData);
        updateMinesweeperLeaderboard();
        
        playSound(523, 100);
        playSound(659, 100);
        playSound(784, 200);
    } else {
        // Reveal all mines
        minesweeperGame.mines.forEach(({r, c}) => {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            cell.classList.add('mine');
            cell.textContent = '💣';
        });
        playSound(200, 300);
    }
    
    document.getElementById('minesweeper-result').textContent = won ? 'You Won!' : 'Game Over!';
    document.getElementById('minesweeper-final-time').textContent = finalTime;
    
    setTimeout(() => {
        document.getElementById('minesweeper-game-over').classList.remove('hidden');
    }, 500);
}

function updateMinesweeperLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.minesweeperWins) {
            leaderboardData.push({
                username: user.username || email,
                wins: user.minesweeperWins || 0,
                bestTime: user.minesweeperBestTime || Infinity
            });
        }
    }

    leaderboardData.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.bestTime - b.bestTime;
    });

    const leaderboardElement = document.getElementById('minesweeper-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players yet</div>';
        return;
    }

    leaderboardElement.innerHTML = '';
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        const timeText = user.bestTime === Infinity ? 'N/A' : `${user.bestTime}s`;
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-name">${user.username}</div>
            <div class="leaderboard-score">${user.wins} wins (Best: ${timeText})</div>
        `;
        leaderboardElement.appendChild(item);
    });
}

function exitMinesweeper() {
    if (minesweeperGame.timer) {
        clearInterval(minesweeperGame.timer);
    }
    showLobby();
}

// Geometry Dash Functions
function showGeometryDash() {
    showScreen('geometry-dash-screen');
    const userData = getUserData();
    document.getElementById('gd-username').textContent = userData.username;
    document.getElementById('gd-best-level').textContent = userData.gdBestLevel || 0;
    
    geometryDashGame.currentLevel = 1;
    geometryDashGame.deaths = 0;
    document.getElementById('gd-current-level').textContent = geometryDashGame.currentLevel;
    document.getElementById('gd-deaths').textContent = geometryDashGame.deaths;
    
    updateGDLeaderboard();
    startGDLevel();
}

function startGDLevel() {
    geometryDashGame.canvas = document.getElementById('gdCanvas');
    geometryDashGame.ctx = geometryDashGame.canvas.getContext('2d');
    
    // Reset game state
    geometryDashGame.player = { x: 100, y: 250, width: 30, height: 30, velocityY: 0, isJumping: false };
    geometryDashGame.obstacles = [];
    geometryDashGame.spikes = [];
    geometryDashGame.platforms = [];
    geometryDashGame.distance = 0;
    geometryDashGame.scrollSpeed = 4 + geometryDashGame.currentLevel * 0.5;
    geometryDashGame.gameRunning = true;
    geometryDashGame.levelComplete = false;
    
    document.getElementById('gd-game-over').classList.add('hidden');
    document.getElementById('gd-controls-hint').style.display = 'block';
    
    // Generate level obstacles
    generateGDLevel(geometryDashGame.currentLevel);
    
    // Controls
    document.removeEventListener('keydown', gdJump);
    document.addEventListener('keydown', gdJump);
    geometryDashGame.canvas.onclick = gdJump;
    
    // Start game loop
    if (geometryDashGame.gameLoop) {
        cancelAnimationFrame(geometryDashGame.gameLoop);
    }
    gdGameLoop();
}

function generateGDLevel(level) {
    // Level difficulty increases
    const obstacleCount = 5 + level * 2;
    const spikeCount = 3 + level;
    
    // Add ground platforms
    for (let i = 0; i < 100; i++) {
        geometryDashGame.platforms.push({
            x: i * 80,
            y: 350,
            width: 80,
            height: 50
        });
    }
    
    // Add obstacles (blocks)
    for (let i = 0; i < obstacleCount; i++) {
        const x = 600 + i * (400 + Math.random() * 300);
        const height = 40 + Math.random() * 40;
        geometryDashGame.obstacles.push({
            x: x,
            y: 350 - height,
            width: 40,
            height: height,
            type: 'block'
        });
    }
    
    // Add spikes
    for (let i = 0; i < spikeCount; i++) {
        const x = 800 + i * (500 + Math.random() * 400);
        geometryDashGame.spikes.push({
            x: x,
            y: 330,
            width: 30,
            height: 20
        });
    }
    
    // Level end marker
    geometryDashGame.levelEndX = 600 + (obstacleCount + spikeCount) * 400 + 500;
}

function gdJump(e) {
    if ((e.type === 'keydown' && e.code === 'Space') || e.type === 'click') {
        e.preventDefault();
        if (geometryDashGame.gameRunning && !geometryDashGame.player.isJumping) {
            geometryDashGame.player.velocityY = geometryDashGame.jumpPower;
            geometryDashGame.player.isJumping = true;
            playSound(523, 50);
            document.getElementById('gd-controls-hint').style.display = 'none';
        }
    }
}

function gdGameLoop() {
    if (!geometryDashGame.gameRunning) return;
    
    const ctx = geometryDashGame.ctx;
    const canvas = geometryDashGame.canvas;
    const player = geometryDashGame.player;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky and ground
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, 300);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 300, canvas.width, 100);
    
    // Update distance
    geometryDashGame.distance += geometryDashGame.scrollSpeed;
    
    // Apply gravity
    player.velocityY += geometryDashGame.gravity;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y >= 320) {
        player.y = 320;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Draw player (cube)
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Update and draw obstacles
    geometryDashGame.obstacles.forEach(obs => {
        obs.x -= geometryDashGame.scrollSpeed;
        
        // Draw obstacle
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        
        // Collision detection
        if (checkGDCollision(player, obs)) {
            gdDeath();
        }
    });
    
    // Update and draw spikes
    geometryDashGame.spikes.forEach(spike => {
        spike.x -= geometryDashGame.scrollSpeed;
        
        // Draw spike (triangle)
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Collision detection
        if (checkGDCollision(player, spike)) {
            gdDeath();
        }
    });
    
    // Draw platforms
    geometryDashGame.platforms.forEach(plat => {
        plat.x -= geometryDashGame.scrollSpeed;
        ctx.fillStyle = '#654321';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    });
    
    // Draw progress
    const progress = Math.min((geometryDashGame.distance / geometryDashGame.levelEndX) * 100, 100);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(10, 10, progress * 2, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${Math.floor(progress)}%`, 100, 25);
    
    // Check level complete
    if (geometryDashGame.distance >= geometryDashGame.levelEndX && !geometryDashGame.levelComplete) {
        gdLevelComplete();
        return;
    }
    
    // Auto-play cheat
    if (cheatsEnabled.autoPlay && isOwner()) {
        gdAutoPlay();
    }
    
    geometryDashGame.gameLoop = requestAnimationFrame(gdGameLoop);
}

function checkGDCollision(player, obj) {
    return player.x < obj.x + obj.width &&
           player.x + player.width > obj.x &&
           player.y < obj.y + obj.height &&
           player.y + player.height > obj.y;
}

function gdAutoPlay() {
    // Simple AI: jump when obstacle is near
    const player = geometryDashGame.player;
    const nearbyObstacles = [...geometryDashGame.obstacles, ...geometryDashGame.spikes]
        .filter(obj => obj.x > player.x && obj.x < player.x + 150);
    
    if (nearbyObstacles.length > 0 && !player.isJumping && player.y >= 320) {
        player.velocityY = geometryDashGame.jumpPower;
        player.isJumping = true;
    }
}

function gdDeath() {
    geometryDashGame.gameRunning = false;
    geometryDashGame.deaths++;
    document.getElementById('gd-deaths').textContent = geometryDashGame.deaths;
    
    playSound(200, 200);
    
    setTimeout(() => {
        if (confirm('You died! Try again?')) {
            startGDLevel();
        } else {
            exitGeometryDash();
        }
    }, 100);
}

function gdLevelComplete() {
    geometryDashGame.gameRunning = false;
    geometryDashGame.levelComplete = true;
    
    const userData = getUserData();
    
    // Update best level
    if (geometryDashGame.currentLevel > (userData.gdBestLevel || 0)) {
        userData.gdBestLevel = geometryDashGame.currentLevel;
    }
    
    // Award points
    const points = geometryDashGame.currentLevel * 100;
    userData.totalScore = (userData.totalScore || 0) + points;
    userData.level = Math.floor(userData.totalScore / 500) + 1;
    
    saveUserData(userData);
    
    playSound(523, 100);
    setTimeout(() => playSound(659, 100), 100);
    setTimeout(() => playSound(784, 200), 200);
    
    document.getElementById('gd-best-level').textContent = userData.gdBestLevel;
    document.getElementById('gd-result').textContent = `Level ${geometryDashGame.currentLevel} Complete!`;
    document.getElementById('gd-message').textContent = `+${points} points! Deaths: ${geometryDashGame.deaths}`;
    document.getElementById('gd-game-over').classList.remove('hidden');
    
    updateGDLeaderboard();
}

function nextGDLevel() {
    if (geometryDashGame.currentLevel < geometryDashGame.maxLevel) {
        geometryDashGame.currentLevel++;
        document.getElementById('gd-current-level').textContent = geometryDashGame.currentLevel;
        startGDLevel();
    } else {
        alert('🎉 Congratulations! You completed all 10 levels!');
        exitGeometryDash();
    }
}

function restartGDLevel() {
    startGDLevel();
}

function exitGeometryDash() {
    geometryDashGame.gameRunning = false;
    if (geometryDashGame.gameLoop) {
        cancelAnimationFrame(geometryDashGame.gameLoop);
    }
    document.removeEventListener('keydown', gdJump);
    showLobby();
}

function updateGDLeaderboard() {
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const leaderboardData = [];

    for (const email in users) {
        const user = users[email];
        if (user.gdBestLevel && user.gdBestLevel > 0) {
            leaderboardData.push({
                email: email,
                username: user.username || email,
                bestLevel: user.gdBestLevel || 0
            });
        }
    }

    leaderboardData.sort((a, b) => b.bestLevel - a.bestLevel);

    const leaderboardElement = document.getElementById('gd-leaderboard');
    if (leaderboardData.length === 0) {
        leaderboardElement.innerHTML = '<div class="leaderboard-loading">No scores yet</div>';
        return;
    }

    const currentUserEmail = currentUser;
    leaderboardElement.innerHTML = '';
    
    leaderboardData.slice(0, 10).forEach((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.email === currentUserEmail;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${rankEmoji}</div>
            <div class="leaderboard-name">${user.username}${isCurrentUser ? ' (You)' : ''}</div>
            <div class="leaderboard-score">Level ${user.bestLevel}</div>
        `;
        leaderboardElement.appendChild(item);
    });
}

// ============================================
// THEME SWAPPER SYSTEM (CO-OWNER)
// ============================================

function showThemeSelector() {
    if (!hasPermission(RANKS.CO_OWNER)) {
        alert('Access Denied: Co-Owner permissions required');
        return;
    }
    
    const currentTheme = localStorage.getItem('gameTheme') || 'default';
    
    // Remove active class from all
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active to current
    const activeBtn = document.getElementById(`theme-${currentTheme}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    document.getElementById('theme-modal').classList.remove('hidden');
}

function closeThemeModal() {
    document.getElementById('theme-modal').classList.add('hidden');
}

function setTheme(theme) {
    if (!hasPermission(RANKS.CO_OWNER)) {
        alert('Access Denied: Co-Owner permissions required');
        return;
    }
    
    // Remove all theme classes
    document.body.classList.remove('theme-retro', 'theme-neon', 'theme-spooky');
    
    // Add new theme if not default
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    
    // Save preference
    localStorage.setItem('gameTheme', theme);
    
    // Update UI
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`theme-${theme}`).classList.add('active');
    
    playSound(523, 100);
    setTimeout(() => {
        alert(`✅ Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}!`);
    }, 100);
}

// Apply saved theme on load
function applySavedTheme() {
    const savedTheme = localStorage.getItem('gameTheme');
    if (savedTheme && savedTheme !== 'default') {
        document.body.classList.add(`theme-${savedTheme}`);
    }
}

// ============================================
// HIDDEN PONG GAME (ADMIN/CO-OWNER)
// ============================================

let pongGame = null;
let hiddenGameEnabled = false;

function toggleHiddenGame() {
    if (!hasPermission(RANKS.ADMIN)) {
        alert('Access Denied: Admin permissions required');
        return;
    }
    
    hiddenGameEnabled = !hiddenGameEnabled;
    localStorage.setItem('hiddenGameEnabled', hiddenGameEnabled);
    
    // Update both status displays
    const statusText = hiddenGameEnabled ? 'ON' : 'OFF';
    const coOwnerStatus = document.getElementById('hidden-game-status');
    const adminStatus = document.getElementById('admin-hidden-game-status');
    
    if (coOwnerStatus) coOwnerStatus.textContent = statusText;
    if (adminStatus) adminStatus.textContent = statusText;
    
    // Show/hide in lobby
    updateLobbyGames();
    
    playSound(659, 100);
    alert(`✅ Hidden Game ${hiddenGameEnabled ? 'Enabled' : 'Disabled'}!`);
}

function openHiddenGame() {
    if (!hiddenGameEnabled) return;
    
    document.getElementById('hidden-pong-game').classList.remove('hidden');
    initPongGame();
}

function closeHiddenGame() {
    document.getElementById('hidden-pong-game').classList.add('hidden');
    if (pongGame) {
        pongGame.running = false;
        pongGame = null;
    }
}

function initPongGame() {
    const canvas = document.getElementById('pong-canvas');
    const ctx = canvas.getContext('2d');
    
    pongGame = {
        running: true,
        canvas: canvas,
        ctx: ctx,
        ball: { x: 300, y: 200, dx: 4, dy: 4, radius: 8 },
        leftPaddle: { x: 10, y: 150, width: 10, height: 80, dy: 0 },
        rightPaddle: { x: 580, y: 150, width: 10, height: 80, dy: 0 },
        score: { left: 0, right: 0 }
    };
    
    // Keyboard controls
    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === 'w' || e.key === 's') e.preventDefault();
    });
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    function updatePong() {
        if (!pongGame || !pongGame.running) return;
        
        const { ball, leftPaddle, rightPaddle } = pongGame;
        
        // Move left paddle (player)
        if (keys['w'] && leftPaddle.y > 0) leftPaddle.y -= 6;
        if (keys['s'] && leftPaddle.y < 320) leftPaddle.y += 6;
        
        // AI for right paddle
        const targetY = ball.y - rightPaddle.height / 2;
        if (rightPaddle.y < targetY) rightPaddle.y += 4;
        if (rightPaddle.y > targetY) rightPaddle.y -= 4;
        
        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Ball collision with top/bottom
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > 400) {
            ball.dy *= -1;
        }
        
        // Ball collision with paddles
        if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
            ball.y > leftPaddle.y && ball.y < leftPaddle.y + leftPaddle.height) {
            ball.dx = Math.abs(ball.dx);
            playSound(440, 50);
        }
        
        if (ball.x + ball.radius > rightPaddle.x &&
            ball.y > rightPaddle.y && ball.y < rightPaddle.y + rightPaddle.height) {
            ball.dx = -Math.abs(ball.dx);
            playSound(440, 50);
        }
        
        // Score
        if (ball.x < 0) {
            pongGame.score.right++;
            resetPongBall();
        }
        if (ball.x > 600) {
            pongGame.score.left++;
            resetPongBall();
        }
        
        drawPong();
        requestAnimationFrame(updatePong);
    }
    
    function resetPongBall() {
        pongGame.ball.x = 300;
        pongGame.ball.y = 200;
        pongGame.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
        pongGame.ball.dy = (Math.random() - 0.5) * 8;
        document.getElementById('pong-score').textContent = 
            `${pongGame.score.left} - ${pongGame.score.right}`;
    }
    
    function drawPong() {
        const { ctx, canvas, ball, leftPaddle, rightPaddle } = pongGame;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Center line
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(300, 0);
        ctx.lineTo(300, 400);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Paddles
        ctx.fillStyle = '#fff';
        ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
        ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
        
        // Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    updatePong();
}

// ============================================
// BLOCK CODING STUDIO (ADMIN/CO-OWNER)
// ============================================

let blockWorkspace = [];
let blockPreviewCtx = null;

function openBlockCoding() {
    if (!hasPermission(RANKS.ADMIN)) {
        alert('Access Denied: Admin permissions required');
        return;
    }
    
    showScreen('block-coding-screen');
    initBlockCoding();
}

function closeBlockCoding() {
    showLobby();
}

function initBlockCoding() {
    blockWorkspace = [];
    blockPreviewCtx = document.getElementById('block-preview-canvas').getContext('2d');
    
    // Clear preview
    blockPreviewCtx.fillStyle = '#fff';
    blockPreviewCtx.fillRect(0, 0, 300, 300);
    
    // Initialize drag and drop
    const workspace = document.getElementById('code-workspace');
    const blocks = document.querySelectorAll('.code-block[draggable="true"]');
    
    let draggedBlock = null;
    
    blocks.forEach(block => {
        block.addEventListener('dragstart', (e) => {
            draggedBlock = e.target.cloneNode(true);
            draggedBlock.classList.add('in-workspace');
            draggedBlock.removeAttribute('draggable');
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    
    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedBlock) {
            // Clear placeholder text if first block
            if (blockWorkspace.length === 0) {
                workspace.innerHTML = '';
            }
            
            const blockType = draggedBlock.getAttribute('data-block-type');
            blockWorkspace.push(blockType);
            workspace.appendChild(draggedBlock);
            draggedBlock = null;
            
            playSound(523, 50);
        }
    });
}

function clearBlockCode() {
    blockWorkspace = [];
    const workspace = document.getElementById('code-workspace');
    workspace.innerHTML = '<p style="color: #999; text-align: center; margin-top: 100px;">Drag blocks here to build your program</p>';
    
    // Clear preview
    if (blockPreviewCtx) {
        blockPreviewCtx.fillStyle = '#fff';
        blockPreviewCtx.fillRect(0, 0, 300, 300);
    }
    
    playSound(330, 100);
}

function runBlockCode() {
    if (blockWorkspace.length === 0) {
        alert('Add some blocks first!');
        return;
    }
    
    playSound(659, 100);
    
    // Execute blocks
    const ctx = blockPreviewCtx;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 300, 300);
    
    let x = 150;
    let y = 150;
    let angle = 0;
    let currentColor = '#667eea';
    
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    function executeBlock(index) {
        if (index >= blockWorkspace.length) {
            ctx.stroke();
            alert('✅ Code execution complete!');
            return;
        }
        
        const block = blockWorkspace[index];
        
        setTimeout(() => {
            switch (block) {
                case 'move':
                    x += Math.cos(angle) * 30;
                    y += Math.sin(angle) * 30;
                    ctx.lineTo(x, y);
                    break;
                    
                case 'turn-right':
                    angle += Math.PI / 2;
                    break;
                    
                case 'turn-left':
                    angle -= Math.PI / 2;
                    break;
                    
                case 'draw-square':
                    ctx.strokeRect(x - 15, y - 15, 30, 30);
                    break;
                    
                case 'draw-circle':
                    ctx.beginPath();
                    ctx.arc(x, y, 15, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.moveTo(x, y);
                    break;
                    
                case 'change-color':
                    const colors = ['#667eea', '#ff6b9d', '#4facfe', '#43e97b'];
                    currentColor = colors[Math.floor(Math.random() * colors.length)];
                    ctx.strokeStyle = currentColor;
                    break;
            }
            
            executeBlock(index + 1);
        }, 300);
    }
    
    executeBlock(0);
}

// ============================================
// UPDATE SETTINGS VISIBILITY
// ============================================

function updateLobbyGames() {
    // This function would add/remove the hidden game button from lobby
    // For now, we'll add it directly to the lobby when needed
    const lobbyGames = document.querySelector('.lobby-games');
    if (!lobbyGames) return;
    
    let hiddenGameBtn = document.getElementById('hidden-game-lobby-btn');
    
    if (hiddenGameEnabled) {
        if (!hiddenGameBtn) {
            hiddenGameBtn = document.createElement('button');
            hiddenGameBtn.id = 'hidden-game-lobby-btn';
            hiddenGameBtn.className = 'game-option';
            hiddenGameBtn.onclick = openHiddenGame;
            hiddenGameBtn.innerHTML = `
                <span class="game-icon">🕹️</span>
                <span class="game-name">Secret Pong</span>
            `;
            lobbyGames.appendChild(hiddenGameBtn);
        }
    } else {
        if (hiddenGameBtn) {
            hiddenGameBtn.remove();
        }
    }
}

// ============================================
// BROADCAST MESSAGE SYSTEM (OWNER)
// ============================================

function showBroadcastModal() {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    document.getElementById('broadcast-message').value = '';
    document.getElementById('broadcast-urgent').checked = false;
    document.getElementById('broadcast-persistent').checked = false;
    
    // Load broadcast history
    const history = JSON.parse(localStorage.getItem('broadcastHistory') || '[]');
    const historyDiv = document.getElementById('broadcast-history');
    
    if (history.length === 0) {
        historyDiv.innerHTML = 'No broadcasts sent yet.';
    } else {
        historyDiv.innerHTML = history.slice(-5).reverse().map((msg, index) => {
            const actualIndex = history.length - 1 - index; // Get actual index in array
            const date = new Date(msg.timestamp);
            return `<div style="padding: 8px; background: #f8f9fa; border-radius: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-size: 11px; color: #999;">${date.toLocaleString()}</div>
                    <div>${msg.text}</div>
                </div>
                <button onclick="deleteBroadcast(${actualIndex})" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; margin-left: 10px;">🗑️</button>
            </div>`;
        }).join('');
    }
    
    document.getElementById('broadcast-modal').classList.remove('hidden');
}

function closeBroadcastModal() {
    document.getElementById('broadcast-modal').classList.add('hidden');
}

function deleteBroadcast(index) {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    const history = JSON.parse(localStorage.getItem('broadcastHistory') || '[]');
    
    if (confirm('Delete this broadcast?')) {
        history.splice(index, 1);
        localStorage.setItem('broadcastHistory', JSON.stringify(history));
        
        // Also clear from active broadcasts if it's the latest
        const activeBroadcasts = JSON.parse(localStorage.getItem('activeBroadcasts') || '[]');
        if (activeBroadcasts.length > 0 && activeBroadcasts[activeBroadcasts.length - 1].timestamp === history[index]?.timestamp) {
            activeBroadcasts.pop();
            localStorage.setItem('activeBroadcasts', JSON.stringify(activeBroadcasts));
        }
        
        playSound(330, 100);
        showBroadcastModal(); // Refresh the modal
    }
}
function sendBroadcast() {
    const message = document.getElementById('broadcast-message').value.trim();
    
    if (!message) {
        alert('Please enter a message!');
        return;
    }
    
    const isUrgent = document.getElementById('broadcast-urgent').checked;
    const isPersistent = document.getElementById('broadcast-persistent').checked;
    
    // Save to history
    const history = JSON.parse(localStorage.getItem('broadcastHistory') || '[]');
    history.push({
        text: message,
        timestamp: Date.now(),
        urgent: isUrgent,
        persistent: isPersistent
    });
    localStorage.setItem('broadcastHistory', JSON.stringify(history));
    
    // Save to active broadcasts
    const activeBroadcasts = JSON.parse(localStorage.getItem('activeBroadcasts') || '[]');
    activeBroadcasts.push({
        text: message,
        urgent: isUrgent,
        persistent: isPersistent,
        timestamp: Date.now()
    });
    localStorage.setItem('activeBroadcasts', JSON.stringify(activeBroadcasts));
    
    // Show notification
    showBroadcastNotification(message, isUrgent, isPersistent);
    
    playSound(659, 100);
    closeBroadcastModal();
    
    alert('✅ Broadcast sent to all players!');
}

function showBroadcastNotification(message, isUrgent = false, isPersistent = false) {
    const notification = document.getElementById('broadcast-notification');
    const content = document.getElementById('broadcast-content');
    const text = document.getElementById('broadcast-text');
    
    text.textContent = message;
    
    if (isUrgent) {
        content.classList.add('broadcast-urgent');
    } else {
        content.classList.remove('broadcast-urgent');
    }
    
    notification.classList.remove('hidden');
    
    // Auto-dismiss if not persistent
    if (!isPersistent) {
        setTimeout(() => {
            dismissBroadcast();
        }, 10000);
    }
}

function dismissBroadcast() {
    document.getElementById('broadcast-notification').classList.add('hidden');
}

// Check for active broadcasts on load
function checkActiveBroadcasts() {
    const activeBroadcasts = JSON.parse(localStorage.getItem('activeBroadcasts') || '[]');
    
    if (activeBroadcasts.length > 0) {
        const latestBroadcast = activeBroadcasts[activeBroadcasts.length - 1];
        
        // Show if less than 1 hour old or persistent
        const hourAgo = Date.now() - (60 * 60 * 1000);
        if (latestBroadcast.timestamp > hourAgo || latestBroadcast.persistent) {
            setTimeout(() => {
                showBroadcastNotification(
                    latestBroadcast.text, 
                    latestBroadcast.urgent, 
                    latestBroadcast.persistent
                );
            }, 1000);
        }
    }
}

// ============================================
// SPECTATOR MODE (OWNER)
// ============================================

let spectatorInterval = null;
let spectatedPlayer = null;

function showSpectatorMode() {
    if (!isOwner()) {
        alert('Access Denied: Owner permissions required');
        return;
    }
    
    // Populate player list
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const select = document.getElementById('spectator-player-select');
    
    select.innerHTML = '<option value="">-- Choose a player --</option>';
    
    Object.keys(users).forEach(email => {
        if (email !== currentUser) {
            const username = users[email].username || email;
            const option = document.createElement('option');
            option.value = email;
            option.textContent = `${username} (${email})`;
            select.appendChild(option);
        }
    });
    
    document.getElementById('spectator-modal').classList.remove('hidden');
}

function closeSpectatorModal() {
    document.getElementById('spectator-modal').classList.add('hidden');
    stopSpectating();
}

function startSpectating() {
    const select = document.getElementById('spectator-player-select');
    const email = select.value;
    
    if (!email) {
        document.getElementById('spectator-view').classList.add('hidden');
        return;
    }
    
    spectatedPlayer = email;
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const user = users[email];
    
    if (!user) {
        alert('Player not found!');
        return;
    }
    
    // Show spectator view
    document.getElementById('spectator-view').classList.remove('hidden');
    document.getElementById('spectator-username').textContent = user.username || email;
    document.getElementById('spectator-level').textContent = user.level || 1;
    document.getElementById('spectator-score').textContent = user.totalScore || 0;
    
    // Add log entry
    addSpectatorLog(`Started spectating ${user.username || email}`);
    
    // Start monitoring (simulated)
    spectatorInterval = setInterval(() => {
        updateSpectatorView();
    }, 2000);
    
    playSound(523, 100);
}

function stopSpectating() {
    if (spectatorInterval) {
        clearInterval(spectatorInterval);
        spectatorInterval = null;
    }
    spectatedPlayer = null;
}

function updateSpectatorView() {
    if (!spectatedPlayer) return;
    
    const users = JSON.parse(localStorage.getItem('memoryGameUsers') || '{}');
    const user = users[spectatedPlayer];
    
    if (!user) {
        addSpectatorLog('Player disconnected');
        stopSpectating();
        return;
    }
    
    // Update stats
    document.getElementById('spectator-level').textContent = user.level || 1;
    document.getElementById('spectator-score').textContent = user.totalScore || 0;
    
    // Check for active game state
    const gameState = JSON.parse(localStorage.getItem(`gameState_${spectatedPlayer}`) || 'null');
    const status = document.getElementById('spectator-status');
    const canvas = document.getElementById('spectator-canvas');
    const ctx = canvas.getContext('2d');
    
    if (gameState && gameState.active) {
        status.style.display = 'none';
        canvas.style.display = 'block';
        
        // Draw the game state
        drawSpectatorGame(ctx, gameState);
        
        addSpectatorLog(`Watching ${gameState.gameName || 'game'}...`);
    } else {
        status.style.display = 'block';
        canvas.style.display = 'none';
        status.textContent = '👁️ Player is in lobby or not playing...';
    }
}

function drawSpectatorGame(ctx, gameState) {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 600, 400);
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    if (gameState.gameName === 'Pattern Memory') {
        ctx.fillText(`🎮 ${gameState.gameName}`, 300, 30);
        ctx.fillText(`Round: ${gameState.round || 0}`, 300, 60);
        ctx.fillText(`Score: ${gameState.score || 0}`, 300, 90);
        ctx.fillText('(Live game view)', 300, 200);
    } else if (gameState.gameName === 'Snake') {
        ctx.fillText(`🐍 ${gameState.gameName}`, 300, 30);
        ctx.fillText(`Score: ${gameState.score || 0}`, 300, 60);
        ctx.fillText(`Length: ${gameState.length || 0}`, 300, 90);
    } else {
        ctx.fillText(`🎮 ${gameState.gameName || 'Unknown Game'}`, 300, 30);
        ctx.fillText(`Score: ${gameState.score || 0}`, 300, 60);
    }
}

// Helper function to track game state (call this from games)
function updateGameState(gameName, data) {
    const gameState = {
        active: true,
        gameName: gameName,
        timestamp: Date.now(),
        ...data
    };
    localStorage.setItem(`gameState_${currentUser}`, JSON.stringify(gameState));
}

// Helper function to clear game state when game ends
function clearGameState() {
    localStorage.removeItem(`gameState_${currentUser}`);
}

function addSpectatorLog(message) {
    const log = document.getElementById('spectator-log');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${timestamp}] ${message}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// ============================================
// UPDATE SETTINGS VISIBILITY (UNIFIED)
// ============================================

function updateSettingsVisibility() {
    const userRank = getUserRank();
    
    // Hide old separate sections (if they still exist)
    const ownerControls = document.getElementById('owner-controls');
    const coOwnerControls = document.getElementById('co-owner-controls');
    const adminControls = document.getElementById('admin-controls');
    
    if (ownerControls) ownerControls.classList.add('hidden');
    if (coOwnerControls) coOwnerControls.classList.add('hidden');
    if (adminControls) adminControls.classList.add('hidden');
    
    // Show unified rank controls section
    const rankControls = document.getElementById('rank-controls');
    if (!rankControls) return;
    
    // Show/hide based on rank
    if (userRank === RANKS.USER) {
        rankControls.classList.add('hidden');
        return;
    }
    
    rankControls.classList.remove('hidden');
    
    // Update title based on rank
    const rankIcon = document.getElementById('rank-icon');
    const rankTitle = document.getElementById('rank-title');
    
    if (userRank === RANKS.OWNER) {
        rankIcon.textContent = '👑';
        rankTitle.textContent = 'Owner Controls';
    } else if (userRank === RANKS.CO_OWNER) {
        rankIcon.textContent = '⭐';
        rankTitle.textContent = 'Co-Owner Controls';
    } else if (userRank === RANKS.ADMIN) {
        rankIcon.textContent = '🛡️';
        rankTitle.textContent = 'Admin Controls';
    }
    
    // Show/hide sections based on rank
    const ownerOnly = document.getElementById('owner-only-controls');
    const coOwnerPlus = document.getElementById('co-owner-plus-controls');
    const adminPlus = document.getElementById('admin-plus-controls');
    
    if (ownerOnly) {
        ownerOnly.style.display = userRank === RANKS.OWNER ? 'block' : 'none';
    }
    
    if (coOwnerPlus) {
        coOwnerPlus.style.display = 
            (userRank === RANKS.CO_OWNER || userRank === RANKS.OWNER) ? 'block' : 'none';
    }
    
    if (adminPlus) {
        adminPlus.style.display = 
            (userRank === RANKS.ADMIN || userRank === RANKS.CO_OWNER || userRank === RANKS.OWNER) 
            ? 'block' : 'none';
    }
    
    // Update hidden game status
    const savedHiddenGame = localStorage.getItem('hiddenGameEnabled') === 'true';
    hiddenGameEnabled = savedHiddenGame;
    
    const statusText = hiddenGameEnabled ? 'ON' : 'OFF';
    const unifiedStatus = document.getElementById('unified-hidden-game-status');
    
    if (unifiedStatus) unifiedStatus.textContent = statusText;
    
    // Update all hidden game status displays
    const coOwnerStatus = document.getElementById('co-owner-hidden-status');
    const adminStatus = document.getElementById('admin-hidden-status');
    if (coOwnerStatus) coOwnerStatus.textContent = statusText;
    if (adminStatus) adminStatus.textContent = statusText;
}

// ============================================
// TAB SWITCHING FOR RANK CONTROLS
// ============================================

function switchRankTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.rank-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.rank-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab-content`).classList.add('active');
}

