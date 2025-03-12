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
    hintBtn: document.getElementById("hint-btn"),
    submitBtn: document.getElementById("submit-btn"),
    closeBtn: document.getElementById("close-btn"),
    backBtn: document.getElementById("back-btn"),
    hintModal: document.getElementById("hint-modal"),
    hintText: document.getElementById("hint-text"),
    bananaModal: document.getElementById("banana-modal"),
    bananaImage: document.getElementById("banana-image"),
    bananaAnswerInput: document.getElementById("banana-answer"),
    bananaSubmit: document.getElementById("banana-submit"),
    bananaResult: document.getElementById("banana-result"),
    closeButtons: document.querySelectorAll(".close")
};

// API Endpoints
const api = {
    shortWords: "https://random-word-api.herokuapp.com/word?length=3",
    randomWord: "https://random-word-api.herokuapp.com/word",
    dictionary: "https://api.dictionaryapi.dev/api/v2/entries/en/"
};

// Initialize the game
function initGame() {
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
        const wordUrl = gameState.currentLevel <= 2 ? api.shortWords : api.randomWord;
        const wordResponse = await fetch(wordUrl);
        const words = await wordResponse.json();
        const word = words[0];

        const dictResponse = await fetch(`${api.dictionary}${word}`);
        if (!dictResponse.ok) {
            // Retry if the word doesn't exist in the dictionary
            loadNewWord();
            return;
        }

        const dictData = await dictResponse.json();
        gameState.currentWord = word;
        gameState.currentWordDefinition = dictData[0]?.meanings[0]?.definitions[0]?.definition || "No definition available.";

        displayWordPuzzle();
    } catch (error) {
        console.error("Error loading word:", error);
        elements.wordPuzzle.textContent = "Error loading word. Try again.";
        // Retry fetching a new word
        loadNewWord();
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
}

// Function to fetch Banana question from API
const fetchBananaQuestion = async () => {
    let retries = 3; // Number of retries
    while (retries > 0) {
        try {
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
                alert("Failed to fetch banana question. Please try again later.");
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
    
    // Provide option to retry or go back after timeout
    setTimeout(() => {
        if (confirm("Time's up! Would you like to try again?")) {
            resetLevel();
        } else {
            goBack();
        }
    }, 1500);
}

// Reset the current level
function resetLevel() {
    elements.answerInput.disabled = false;
    elements.submitBtn.disabled = false;
    elements.errorMsg.classList.add("hidden");
    elements.answerInput.value = "";
    loadNewWord();
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

        // Save the score to Firestore
        saveScore(gameState.userId, gameState.currentLevel, gameState.score);

        setTimeout(() => {
            advanceToNextLevel();
        }, 1000);
    } else {
        elements.errorMsg.textContent = "❌ Incorrect. Try again!";
        elements.errorMsg.classList.remove("hidden");
        
        // Clear the error message after a short delay
        setTimeout(() => {
            elements.errorMsg.classList.add("hidden");
        }, 1500);
    }
}

// Advance to the next level
function advanceToNextLevel() {
    if (gameState.currentLevel >= config.maxLevels) {
        endGame();
        return;
    }

    gameState.currentLevel++;
    elements.answerInput.value = "";
    elements.answerInput.disabled = false;
    elements.submitBtn.disabled = false;
    elements.errorMsg.classList.add("hidden");

    updateUI();
    loadNewWord();
    startTimer();
}

// End the game
function endGame() {
    clearInterval(gameState.timer);
    
    // Save the final score to Firestore
    saveScore(gameState.userId, gameState.currentLevel, gameState.score);
    
    alert(`🎉 Congratulations! You've completed all levels!\nFinal Score: ${gameState.score}`);
    goBack();
}

// Save score to Firestore
async function saveScore(userId, level, score) {
    if (!userId) return; // Do not save if the user is not logged in

    try {
        const userDocRef = db.collection('users').doc(userId);
        const doc = await userDocRef.get();

        if (!doc.exists) {
            // Create a new document for the user
            await userDocRef.set({
                scores: {
                    [level]: score
                }
            });
        } else {
            // Update the score only if it's higher than the existing score
            const existingScore = doc.data().scores?.[level] || 0;
            if (score > existingScore) {
                await userDocRef.update({
                    [`scores.${level}`]: score
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
    // Handle hint button click
    elements.hintBtn.addEventListener("click", async () => {
        pauseTimer(); // Pause the timer when the hint button is clicked
        const solution = await fetchBananaQuestion();
        if (solution) {
            // Ensure solution is a string and then set it as lowercase
            elements.bananaSubmit.dataset.solution = String(solution).toLowerCase();
            elements.bananaModal.style.display = "block";
        } else {
            alert("Failed to load hint. Please try again later.");
            resumeTimer(); // Resume the timer if the hint fails
        }
    });

    // Handle banana answer submission
    elements.bananaSubmit.addEventListener("click", () => {
        const userAnswer = elements.bananaAnswerInput.value.trim().toLowerCase();
        const correctAnswer = elements.bananaSubmit.dataset.solution;

        if (userAnswer === correctAnswer) {
            elements.bananaResult.textContent = "🎉 Correct! Here's your hint.";
            elements.hintText.textContent = gameState.currentWordDefinition;
            elements.bananaResult.classList.remove("hidden");
            
            setTimeout(() => {
                elements.bananaModal.style.display = "none";
                elements.hintModal.style.display = "block";
                elements.bananaAnswerInput.value = ""; // Clear input for next time
                elements.bananaResult.classList.add("hidden");
                resumeTimer(); // Resume the timer after the hint is shown
            }, 1500);
        } else {
            elements.bananaResult.textContent = "❌ Incorrect. Try again!";
            elements.bananaResult.classList.remove("hidden");
            
            setTimeout(() => {
                elements.bananaResult.classList.add("hidden");
            }, 1500);
        }
    });

    // Close modal buttons
    elements.closeButtons.forEach(closeBtn => {
        closeBtn.addEventListener("click", () => {
            closeBtn.closest(".modal").style.display = "none";
            resumeTimer(); // Resume the timer when the modal is closed
        });
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
            resumeTimer(); // Resume the timer when the modal is closed
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
        if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
            goBack();
        }
    });
    
    // Close button
    elements.closeBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
            goBack();
        }
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