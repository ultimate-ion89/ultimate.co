// Node.js script to save user data from localStorage to a file
const fs = require('fs');
const path = require('path');

// This script reads from a JSON file that the browser will create
// and saves it to users_data.txt in the same folder

const dataFile = path.join(__dirname, 'temp_users.json');
const outputFile = path.join(__dirname, 'users_data.txt');

function saveUsersToFile() {
    try {
        if (!fs.existsSync(dataFile)) {
            console.log('No data file found. Waiting for browser to create it...');
            return;
        }

        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        const users = data.users || {};
        
        let textContent = "=== MEMORY GAME USER DATABASE ===\n";
        textContent += "Generated: " + new Date().toLocaleString() + "\n";
        textContent += "Total Users: " + Object.keys(users).length + "\n";
        textContent += "================================\n\n";
        
        for (let email in users) {
            const user = users[email];
            textContent += "Email: " + email + "\n";
            textContent += "Username: " + user.username + "\n";
            textContent += "Password: " + user.password + "\n";
            textContent += "Level: " + (user.level || 1) + "\n";
            textContent += "Total Score: " + (user.totalScore || 0) + "\n";
            textContent += "Games Played: " + (user.gamesPlayed || 0) + "\n";
            textContent += "Best Round: " + (user.bestRound || 0) + "\n";
            textContent += "Snake High Score: " + (user.snakeHighScore || 0) + "\n";
            textContent += "Block Blast High Score: " + (user.blockBlastHighScore || 0) + "\n";
            textContent += "Wordle Wins: " + (user.wordleWins || 0) + "\n";
            textContent += "Wordle Streak: " + (user.wordleStreak || 0) + "\n";
            textContent += "Hangman Wins: " + (user.hangmanWins || 0) + "\n";
            textContent += "Hangman Streak: " + (user.hangmanStreak || 0) + "\n";
            textContent += "Minesweeper Wins: " + (user.minesweeperWins || 0) + "\n";
            textContent += "Minesweeper Best Time: " + (user.minesweeperBestTime || 'N/A') + "\n";
            textContent += "--------------------------------\n\n";
        }
        
        fs.writeFileSync(outputFile, textContent, 'utf8');
        console.log('Users data saved to users_data.txt');
        
        // Delete the temp file
        fs.unlinkSync(dataFile);
        
    } catch (err) {
        console.error('Error saving users:', err);
    }
}

// Watch for the temp file and save when it appears
console.log('Watching for user data updates...');
console.log('Press Ctrl+C to stop');

setInterval(() => {
    if (fs.existsSync(dataFile)) {
        saveUsersToFile();
    }
}, 1000);
