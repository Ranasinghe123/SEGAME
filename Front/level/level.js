// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJHzjy-B8F133WC2Bp3P3LU9UP5mZFSpE",
    authDomain: "se-game-dc697.firebaseapp.com",
    projectId: "se-game-dc697",
    storageBucket: "se-game-dc697.appspot.com",
    messagingSenderId: "469363039216",
    appId: "1:469363039216:web:2eea4a87692aa0857a5b35",
    measurementId: "G-5S3RFQWND0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM elements
const levelList = document.getElementById('level-list');
const userProgressElement = document.getElementById('user-progress');
const backBtn = document.getElementById('back-btn');

// Total number of levels in the game
const totalLevels = 10;

// Initialize the level selection page
function initLevelSelection() {
    // Set up event listeners
    backBtn.addEventListener('click', () => {
        window.location.href = '../main/main.html';
    });
    
    // Check authentication status
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, get their progress
            fetchUserProgress(user.uid);
        } else {
            // User is not signed in, create anonymous user
            auth.signInAnonymously()
                .then((userCredential) => {
                    // Anonymous user signed in
                    fetchUserProgress(userCredential.user.uid);
                })
                .catch(error => {
                    console.error("Error creating anonymous user:", error);
                    // Default to only level 1 unlocked
                    renderLevelButtons([1], [], 1);
                });
        }
    });
}

// Fetch user's progress from Firestore
function fetchUserProgress(userId) {
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                const unlockedLevels = userData.unlockedLevels || [1];
                const completedLevels = userData.completedLevels || [];
                const lastPlayedLevel = userData.lastPlayedLevel || 1;
                
                renderLevelButtons(unlockedLevels, completedLevels, lastPlayedLevel);
                updateUserProgress(completedLevels.length);
            } else {
                // Create user document if it doesn't exist
                db.collection('users').doc(userId).set({
                    unlockedLevels: [1],
                    completedLevels: [],
                    lastPlayedLevel: 1
                }).then(() => {
                    renderLevelButtons([1], [], 1);
                    updateUserProgress(0);
                });
            }
        })
        .catch(error => {
            console.error("Error fetching user progress:", error);
            // Default to only level 1 unlocked
            renderLevelButtons([1], [], 1);
            updateUserProgress(0);
        });
}

// Render the level selection buttons
function renderLevelButtons(unlockedLevels, completedLevels, lastPlayedLevel) {
    // Clear existing buttons
    levelList.innerHTML = '';
    
    // Create buttons for each level
    for (let i = 1; i <= totalLevels; i++) {
        const levelButton = document.createElement('button');
        levelButton.classList.add('level-btn');
        
        if (unlockedLevels.includes(i)) {
            // Level is unlocked
            levelButton.classList.add('unlocked');
            
            // Add completed class if level is completed
            if (completedLevels.includes(i)) {
                levelButton.classList.add('completed');
                levelButton.innerHTML = `Level ${i} ✓`;
            } else {
                levelButton.textContent = `Level ${i}`;
            }
            
            // Highlight the last played level
            if (i === lastPlayedLevel) {
                levelButton.classList.add('last-played');
            }
            
            levelButton.addEventListener('click', () => {
                // Update last played level before navigating
                updateLastPlayedLevel(i);
                window.location.href = `../play/play.html?level=${i}`;
            });
        } else {
            // Level is locked
            levelButton.classList.add('locked');
            levelButton.innerHTML = `Level ${i} <span class="lock-icon">🔒</span>`;
            levelButton.disabled = true;
        }
        
        levelList.appendChild(levelButton);
    }
    
    // Add a "Continue" button that goes to the last played level
    const continueButton = document.createElement('button');
    continueButton.classList.add('continue-btn');
    continueButton.textContent = `Continue Level ${lastPlayedLevel}`;
    continueButton.addEventListener('click', () => {
        window.location.href = `../play/play.html?level=${lastPlayedLevel}`;
    });
    
    // Add the continue button at the top
    levelList.insertBefore(continueButton, levelList.firstChild);
}

// Update the user progress display
function updateUserProgress(completedCount) {
    userProgressElement.textContent = `${completedCount}/${totalLevels}`;
}

// Update the last played level in Firestore
function updateLastPlayedLevel(level) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    db.collection('users').doc(userId).update({
        lastPlayedLevel: level
    }).catch(error => {
        console.error("Error updating last played level:", error);
    });
}

// Export helper functions for play.js to use
window.levelHelpers = {
    // Function to mark a level as completed
    markLevelCompleted: function(level) {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const completedLevels = userData.completedLevels || [];
                    
                    if (!completedLevels.includes(level)) {
                        completedLevels.push(level);
                        db.collection('users').doc(userId).update({
                            completedLevels: completedLevels
                        });
                    }
                }
            })
            .catch(error => {
                console.error("Error marking level as completed:", error);
            });
    },
    
    // Function to unlock the next level
    unlockNextLevel: function(completedLevel) {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const nextLevel = completedLevel + 1;
        
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    let unlockedLevels = userData.unlockedLevels || [1];
                    
                    if (!unlockedLevels.includes(nextLevel) && nextLevel <= totalLevels) {
                        unlockedLevels.push(nextLevel);
                        db.collection('users').doc(userId).update({
                            unlockedLevels: unlockedLevels
                        });
                    }
                }
            })
            .catch(error => {
                console.error("Error unlocking next level:", error);
            });
    }
};

// Add event listener for when the page loads
window.addEventListener('DOMContentLoaded', initLevelSelection);