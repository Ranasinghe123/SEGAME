import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged,
    deleteUser,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// Function to calculate total score
const calculateTotalScore = (scores) => {
    return scores ? 
        Object.values(scores).reduce((sum, score) => sum + score, 0) 
        : 0;
};

// Function to safely update element text
const safeUpdateElementText = (elementId, text) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text || "N/A";
    }
};

// Function to get user details and rank
const fetchUserProfile = async (userId) => {
    try {
        // Fetch current user's document
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Calculate total score
            const totalScore = calculateTotalScore(userData.scores);

            // Fetch all users to determine global rank
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            
            // Calculate rank based on total score
            const userScores = [];
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                const score = calculateTotalScore(data.scores);
                userScores.push({
                    id: doc.id,
                    score: score
                });
            });

            // Sort users by score in descending order
            userScores.sort((a, b) => b.score - a.score);

            // Find current user's rank
            const rank = userScores.findIndex(u => u.id === userId) + 1;

            // Safely update user details
            safeUpdateElementText("userName", userData.name);
            safeUpdateElementText("userEmail", userData.email);
            safeUpdateElementText("userRank", rank.toString());
            safeUpdateElementText("userHighscore", totalScore.toString());

            // Optional: Display level-wise scores
            const scoresContainer = document.getElementById("levelScores");
            if (scoresContainer) {
                scoresContainer.innerHTML = ""; // Clear previous scores
                if (userData.scores) {
                    Object.entries(userData.scores).forEach(([level, score]) => {
                        const scoreEntry = document.createElement("div");
                        scoreEntry.textContent = `Level ${level}: ${score}`;
                        scoresContainer.appendChild(scoreEntry);
                    });
                } else {
                    scoresContainer.textContent = "No level scores available";
                }
            }
        } else {
            console.error("User document not found");
            alert("User profile not found!");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        
        // Provide more detailed error handling
        safeUpdateElementText("userName", "Error");
        safeUpdateElementText("userEmail", "Error");
        safeUpdateElementText("userRank", "Error");
        safeUpdateElementText("userHighscore", "Error");

        // Optional: Show error to user
        const scoresContainer = document.getElementById("levelScores");
        if (scoresContainer) {
            scoresContainer.innerHTML = `<div style="color: red;">Failed to load profile: ${error.message}</div>`;
        }
    }
};

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchUserProfile(user.uid);
    } else {
        alert("No user logged in!");
        window.location.href = "login.html"; // Redirect to login page if no user is logged in
    }
});

// Redirect to edit profile page
window.editProfile = function () {
    window.location.href = "change.html";
};

// Delete profile from Firebase
window.deleteProfile = async function () {
    const user = auth.currentUser;
    if (user) {
        const confirmDelete = confirm("Are you sure you want to delete your profile? This cannot be undone.");
        if (confirmDelete) {
            try {
                // Delete Firestore document
                await deleteDoc(doc(db, "users", user.uid));
                
                // Delete Authentication user
                await deleteUser(user);
                
                // Sign out and clear local storage
                await signOut(auth);
                localStorage.clear();
                
                alert("Profile deleted successfully!");
                window.location.href = "../register/register.html";
            } catch (error) {
                console.error("Error deleting profile:", error);
                alert("Failed to delete profile. Please try again.");
            }
        }
    }
};

// Logout functionality
window.logout = async function () {
    try {
        await signOut(auth);
        localStorage.clear();
        window.location.href = "../login/login.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to log out. Please try again.");
    }
};