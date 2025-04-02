// Game Configuration
const config = {
    maxLevels: 10,
    initialTime: 60,
    timeDecrease: 5,
    initialScore: 0,
    maxLettersHidden: {
        1: 2,
        3: 3,
        5: 4,
        7: 5,
        9: 6
    }
};

// Game State
let gameState = {
    currentLevel: 1,
    score: 0,
    timeLeft: config.initialTime,
    currentWord: "",
    currentWordDefinition: "",
    timer: null,
    lettersToHide: 2,
    userId: null,
    isTimerPaused: false // Track if the timer is paused
};

// DOM Elements
const elements = {
    level: document.getElementById("level"),
    score: document.getElementById("score"),
    progress: document.getElementById("progress"),
    timer: document.getElementById("timer"),
    wordPuzzle: document.getElementById("word-puzzle"),
    answerInput: document.getElementById("answer"),
    errorMsg: document.getElementById("error-msg"),
    submitBtn: document.getElementById("submit-btn"),
    closeBtn: document.getElementById("close-btn"),
    backBtn: document.getElementById("back-btn"),
    gameOverModal: document.getElementById("game-over-modal"),
    getLifeBtn: document.getElementById("get-life-btn"),
    bananaModal: document.getElementById("banana-modal"),
    bananaImage: document.getElementById("banana-image"),
    bananaAnswerInput: document.getElementById("banana-answer"),
    bananaSubmit: document.getElementById("banana-submit"),
    bananaResult: document.getElementById("banana-result"),
    closeButtons: document.querySelectorAll(".close"),
    definitionHint: document.getElementById("definition-hint")
};

// API Endpoints
const api = {
    shortWords: "https://random-word-api.herokuapp.com/word?length=3",
    randomWord: "https://random-word-api.herokuapp.com/word",
    dictionary: "https://api.dictionaryapi.dev/api/v2/entries/en/",
    datamuse: "https://api.datamuse.com/words?sp="
};

// Initialize the game
function initGame() {
    // Hide all modals and popups at startup
    elements.gameOverModal.style.display = "none";
    elements.bananaModal.style.display = "none";
    elements.errorMsg.classList.add("hidden");
    
    // Check for level parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const levelParam = urlParams.get('level');
    
    // Set initial level from URL parameter or default to 1
    if (levelParam && !isNaN(parseInt(levelParam))) {
        gameState.currentLevel = Math.min(parseInt(levelParam), config.maxLevels);
    }
    
    // Reset score to 0 at the beginning of each level
    gameState.score = 0;
    
    updateUI();
    loadNewWord();
    startTimer();
    setupEventListeners();
}

// Update UI elements
function updateUI() {
    elements.level.textContent = gameState.currentLevel;
    elements.score.textContent = gameState.score;
    elements.timer.textContent = gameState.timeLeft;
    elements.progress.textContent = `${gameState.currentLevel}/${config.maxLevels}`;
    gameState.lettersToHide = config.maxLettersHidden[gameState.currentLevel] || 2;
}

// Load a new word from the API
async function loadNewWord() {
    try {
        elements.wordPuzzle.textContent = "Loading...";
        
        // Determine word length based on level
        const wordLength = gameState.currentLevel <= 2 ? 3 : getWordLengthForLevel(gameState.currentLevel);
        
        // Use Datamuse API to get a random word with the specified length
        const word = await fetchWordFromDatamuse(wordLength);
        
        if (!word) {
            // Fallback to original API if Datamuse fails
            const wordUrl = gameState.currentLevel <= 2 ? api.shortWords : api.randomWord;
            const wordResponse = await fetch(wordUrl);
            const words = await wordResponse.json();
            gameState.currentWord = words[0];
        } else {
            gameState.currentWord = word;
        }

        // Get definition from dictionary API
        const dictResponse = await fetch(`${api.dictionary}${gameState.currentWord}`);
        if (!dictResponse.ok) {
            // Retry if the word doesn't exist in the dictionary
            loadNewWord();
            return;
        }

        const dictData = await dictResponse.json();
        gameState.currentWordDefinition = dictData[0]?.meanings[0]?.definitions[0]?.definition || "No definition available.";

        displayWordPuzzle();
    } catch (error) {
        console.error("Error loading word:", error);
        elements.wordPuzzle.textContent = "Error loading word. Try again.";
        // Retry fetching a new word
        setTimeout(() => loadNewWord(), 1000);
    }
}

// Get an appropriate word length based on the level
function getWordLengthForLevel(level) {
    // Gradually increase word length with level
    if (level <= 2) return 3;
    if (level <= 4) return 4;
    if (level <= 6) return 5;
    if (level <= 8) return 6;
    return 7; // Levels 9-10
}

// Fetch a word from Datamuse API with the specified length
async function fetchWordFromDatamuse(length) {
    try {
        // Create a pattern with the specified length (e.g., "?????" for length 5)
        const pattern = "?".repeat(length);
        
        // Fetch a random word with the specified pattern
        const response = await fetch(`${api.datamuse}${pattern}&max=100`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch from Datamuse API");
        }
        
        const words = await response.json();
        
        // If we got some words, pick a random one
        if (words && words.length > 0) {
            // Filter words to ensure they have definitions
            const validWords = words.filter(wordObj => wordObj.word && 
                                               wordObj.word.length === length &&
                                               /^[a-z]+$/.test(wordObj.word)); // Only include words with letters
            
            if (validWords.length > 0) {
                // Pick a random word from the filtered list
                const randomIndex = Math.floor(Math.random() * validWords.length);
                return validWords[randomIndex].word;
            }
        }
        
        return null; // Return null if no suitable word was found
    } catch (error) {
        console.error("Error fetching from Datamuse API:", error);
        return null; // Return null to trigger fallback
    }
}

// Display the word puzzle with hidden letters
function displayWordPuzzle() {
    const word = gameState.currentWord;
    const indices = Array.from({ length: word.length }, (_, i) => i);
    shuffleArray(indices);

    const lettersToHide = Math.min(gameState.lettersToHide, word.length - 1);
    const indicesToHide = indices.slice(0, lettersToHide);

    let puzzle = "";
    for (let i = 0; i < word.length; i++) {
        puzzle += indicesToHide.includes(i) ? "_" : word[i];
    }

    elements.wordPuzzle.textContent = puzzle.split("").join(" ");
    
    // Display the definition as a hint
    elements.definitionHint.textContent = `Hint: ${gameState.currentWordDefinition}`;
}

// Function to fetch Banana question from API
const fetchBananaQuestion = async () => {
    let retries = 3; // Number of retries
    while (retries > 0) {
        try {
            elements.bananaImage.src = ""; // Clear previous image
            const response = await fetch("https://marcconrad.com/uob/banana/api.php");
            if (!response.ok) {
                throw new Error("Failed to fetch banana question.");
            }

            const data = await response.json();
            console.log("Banana API Response:", data); // Debugging

            // Ensure the response contains the required fields
            if (!data.solution || !data.question) {
                throw new Error("Invalid API response: missing fields.");
            }

            // Always convert solution to string before using toLowerCase()
            const solution = String(data.solution);

            // Set the image source using the 'question' field
            elements.bananaImage.src = data.question;

            return solution;
        } catch (error) {
            console.error("Error fetching banana question:", error);
            retries--;
            if (retries === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch banana question. Please try again later.',
                });
                return "";
            }
        }
    }
};

// Start the game timer
function startTimer() {
    if (gameState.timer) clearInterval(gameState.timer);

    gameState.timeLeft = Math.max(config.initialTime - (gameState.currentLevel - 1) * config.timeDecrease, 15);
    elements.timer.textContent = gameState.timeLeft;
    gameState.isTimerPaused = false;

    gameState.timer = setInterval(() => {
        if (!gameState.isTimerPaused) { // Only decrement if the timer is not paused
            gameState.timeLeft--;
            elements.timer.textContent = gameState.timeLeft;

            if (gameState.timeLeft <= 0) {
                clearInterval(gameState.timer);
                handleTimeUp();
            }
        }
    }, 1000);
}

// Pause the timer
function pauseTimer() {
    gameState.isTimerPaused = true;
}

// Resume the timer
function resumeTimer() {
    gameState.isTimerPaused = false;
}

// Handle when time is up
function handleTimeUp() {
    elements.errorMsg.textContent = "⏳ Time's up!";
    elements.errorMsg.classList.remove("hidden");
    elements.answerInput.disabled = true;
    elements.submitBtn.disabled = true;
    
    // Show the game over modal with option to get life
    setTimeout(() => {
        elements.gameOverModal.style.display = "block";
    }, 1000);
}

// Try to get an extra life by answering the banana question
async function tryGetExtraLife() {
    pauseTimer(); // Ensure timer is paused
    
    // Close game over modal and show banana question
    elements.gameOverModal.style.display = "none";
    elements.bananaAnswerInput.value = ""; // Clear previous answer
    elements.bananaResult.classList.add("hidden"); // Hide previous result
    
    const solution = await fetchBananaQuestion();
    if (solution) {
        // Ensure solution is a string and then set it as lowercase
        elements.bananaSubmit.dataset.solution = String(solution).toLowerCase();
        elements.bananaModal.style.display = "block";
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load question. Please try again later.',
        });
        goBack(); // Go back to main menu if banana question can't be loaded
    }
}

// Reset the current level after getting an extra life
function resetAfterExtraLife() {
    clearInterval(gameState.timer); // Clear existing timer
    elements.answerInput.disabled = false;
    elements.submitBtn.disabled = false;
    elements.errorMsg.classList.add("hidden");
    elements.answerInput.value = "";
    
    // Load a new word for the new life
    loadNewWord();
    
    // Reset the timer to the full time for the current level
    gameState.timeLeft = Math.max(config.initialTime - (gameState.currentLevel - 1) * config.timeDecrease, 15);
    elements.timer.textContent = gameState.timeLeft;
    
    // Start a new timer
    startTimer();
}

// Check the player's answer
function checkAnswer() {
    const playerAnswer = elements.answerInput.value.toLowerCase().trim();
    const correctAnswer = gameState.currentWord.toLowerCase();

    if (playerAnswer === correctAnswer) {
        clearInterval(gameState.timer);
        gameState.score += 100;
        elements.score.textContent = gameState.score;

        elements.errorMsg.textContent = "🎉 Correct!";
        elements.errorMsg.classList.remove("hidden");

        // Save the score to Firestore - we only store the score for the current level
        saveScore(gameState.userId, gameState.currentLevel, gameState.score);
        
        // Mark the level as completed
        markLevelAsCompleted(gameState.currentLevel);

        // Show SweetAlert2 notification for completing the level
        Swal.fire({
            title: 'Level Completed!',
            text: 'You have successfully completed the level. 100 points added!',
            icon: 'success',
            confirmButtonText: 'Next Level',
            showConfirmButton: true,
            timer: 3000,
            timerProgressBar: true
        }).then(() => {
            advanceToNextLevel();
        });
    } else {
        elements.errorMsg.textContent = "❌ Incorrect. Try again!";
        elements.errorMsg.classList.remove("hidden");
        
        // Clear the error message after a short delay
        setTimeout(() => {
            elements.errorMsg.classList.add("hidden");
        }, 1500);
    }
}

// Mark a level as completed in Firestore
async function markLevelAsCompleted(level) {
    if (!gameState.userId) return;

    try {
        const userDocRef = db.collection('users').doc(gameState.userId);
        const doc = await userDocRef.get();

        if (doc.exists) {
            const userData = doc.data();
            let completedLevels = userData.completedLevels || [];
            
            // Add the level to completed levels if not already included
            if (!completedLevels.includes(level)) {
                completedLevels.push(level);
                await userDocRef.update({
                    completedLevels: completedLevels
                });
            }
            
            // Unlock the next level
            const nextLevel = level + 1;
            if (nextLevel <= config.maxLevels) {
                let unlockedLevels = userData.unlockedLevels || [1];
                if (!unlockedLevels.includes(nextLevel)) {
                    unlockedLevels.push(nextLevel);
                    await userDocRef.update({
                        unlockedLevels: unlockedLevels
                    });
                }
            }
        } else {
            // Create document if it doesn't exist
            await userDocRef.set({
                completedLevels: [level],
                unlockedLevels: level + 1 <= config.maxLevels ? [1, level + 1] : [1],
                lastPlayedLevel: level
            });
        }
    } catch (error) {
        console.error("Error marking level as completed:", error);
    }
}

// Advance to the next level
function advanceToNextLevel() {
    if (gameState.currentLevel >= config.maxLevels) {
        endGame();
        return;
    }

    gameState.currentLevel++;
    
    // Update the last played level in Firestore
    updateLastPlayedLevel(gameState.currentLevel);
    
    // Reset score for the new level
    gameState.score = 0;
    
    elements.answerInput.value = "";
    elements.answerInput.disabled = false;
    elements.submitBtn.disabled = false;
    elements.errorMsg.classList.add("hidden");

    updateUI();
    loadNewWord();
    startTimer();
}

// Update the last played level in Firestore
async function updateLastPlayedLevel(level) {
    if (!gameState.userId) return;
    
    try {
        await db.collection('users').doc(gameState.userId).update({
            lastPlayedLevel: level
        });
    } catch (error) {
        console.error("Error updating last played level:", error);
    }
}

// End the game
function endGame() {
    clearInterval(gameState.timer);
    
    // Save the final score to Firestore
    saveScore(gameState.userId, gameState.currentLevel, gameState.score);
    
    // Use SweetAlert2 for the final congratulations message
    Swal.fire({
        title: 'Congratulations!',
        text: `You've completed all levels! Final Score: ${gameState.score}`,
        icon: 'success',
        confirmButtonText: 'Back to Menu',
        showConfirmButton: true
    }).then(() => {
        goBack();
    });
}

// Save score to Firestore - MODIFIED to save only the level score without adding previous scores
async function saveScore(userId, level, score) {
    if (!userId) return; // Do not save if the user is not logged in

    try {
        const userDocRef = db.collection('users').doc(userId);
        const doc = await userDocRef.get();

        // Get current user's display name
        const userName = auth.currentUser ? 
            (auth.currentUser.displayName || auth.currentUser.email.split('@')[0]) 
            : 'Anonymous';

        if (!doc.exists) {
            // Create a new document for the user
            await userDocRef.set({
                name: userName,
                scores: {
                    [level]: score
                },
                lastPlayedLevel: level
            });
        } else {
            // Update the score only if it's higher than the existing score
            const existingScore = doc.data().scores?.[level] || 0;
            if (score > existingScore) {
                await userDocRef.update({
                    name: userName, // Ensure name is updated
                    [`scores.${level}`]: score,
                    lastPlayedLevel: level
                });
            } else {
                // Only update the lastPlayedLevel
                await userDocRef.update({
                    lastPlayedLevel: level
                });
            }
        }
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// Go back to previous page
function goBack() {
    window.location.href = "../level/level.html";
}

// Setup event listeners
function setupEventListeners() {
    // Get Life button in Game Over modal
    elements.getLifeBtn.addEventListener("click", tryGetExtraLife);

    // Handle banana answer submission
    elements.bananaSubmit.addEventListener("click", () => {
        const userAnswer = elements.bananaAnswerInput.value.trim().toLowerCase();
        const correctAnswer = elements.bananaSubmit.dataset.solution;

        if (userAnswer === correctAnswer) {
            // Show SweetAlert2 success notification
            Swal.fire({
                title: 'Extra Life!',
                text: 'Correct! You got an extra life!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            
            elements.bananaModal.style.display = "none";
            elements.bananaAnswerInput.value = ""; // Clear input for next time
            
            // Give player an extra life and resume the game
            resetAfterExtraLife();
        } else {
            elements.bananaResult.textContent = "❌ Incorrect. Try again or exit.";
            elements.bananaResult.classList.remove("hidden");
            
            setTimeout(() => {
                elements.bananaResult.classList.add("hidden");
            }, 1500);
        }
    });

    // Close modal buttons
    elements.closeButtons.forEach(closeBtn => {
        closeBtn.addEventListener("click", () => {
            const modal = closeBtn.closest(".modal");
            modal.style.display = "none";
            
            // If closing the banana modal without getting a life, go back to main menu
            if (modal === elements.bananaModal && elements.answerInput.disabled) {
                goBack();
            }
        });
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
            
            // If closing the banana modal without getting a life, go back to main menu
            if (event.target === elements.bananaModal && elements.answerInput.disabled) {
                goBack();
            }
        }
    };

    // Submit answer button
    elements.submitBtn.addEventListener("click", checkAnswer);
    
    // Enter key in answer input
    elements.answerInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") checkAnswer();
    });
    
    // Back button
    elements.backBtn.addEventListener("click", () => {
        Swal.fire({
            title: 'Exit Game?',
            text: 'Are you sure you want to exit? Your progress will be saved.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                goBack();
            }
        });
    });
    
    // Close button
    elements.closeBtn.addEventListener("click", () => {
        Swal.fire({
            title: 'Exit Game?',
            text: 'Are you sure you want to exit? Your progress will be saved.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                goBack();
            }
        });
    });
    
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            gameState.userId = user.uid;
        }
    });
}

// Helper function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Start the game when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initGame);