// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJHzjy-B8F133WC2Bp3P3LU9UP5mZFSpE",
    authDomain: "se-game-dc697.firebaseapp.com",
    projectId: "se-game-dc697",
    storageBucket: "se-game-dc697.firebasestorage.app",
    messagingSenderId: "469363039216",
    appId: "1:469363039216:web:2eea4a87692aa0857a5b35",
    measurementId: "G-5S3RFQWND0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function loadLeaderboard() {
    const leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.innerHTML = ""; // Clear existing entries

    try {
        // Fetch all users
        const usersSnapshot = await db.collection('users').get();
        
        // Calculate total scores for each user
        const userScores = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const totalScore = userData.scores ? 
                Object.values(userData.scores).reduce((sum, score) => sum + score, 0) 
                : 0;
            
            // Only add users with scores
            if (totalScore > 0) {
                userScores.push({
                    name: userData.name || 'Anonymous', // Use name if available
                    totalScore: totalScore
                });
            }
        });

        // Sort users by total score in descending order
        userScores.sort((a, b) => b.totalScore - a.totalScore);

        // Add ranked entries to leaderboard
        userScores.forEach((user, index) => {
            const entry = document.createElement("div");
            entry.classList.add("entry");
            entry.innerHTML = `
                <span>${index + 1}</span> 
                <span>${user.name}</span> 
                <span>${user.totalScore}</span>
            `;
            leaderboardList.appendChild(entry);
        });
    } catch (error) {
        console.error("Error loading leaderboard:", error);
        leaderboardList.innerHTML = "<div>Error loading leaderboard</div>";
    }
}

// Load leaderboard on page load
window.onload = loadLeaderboard;