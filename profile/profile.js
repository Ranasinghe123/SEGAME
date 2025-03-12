import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

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

// Function to get user details
const fetchUserProfile = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            document.getElementById("userName").textContent = userData.name || "N/A";
            document.getElementById("userEmail").textContent = userData.email || "N/A";
            document.getElementById("userRank").textContent = userData.rank || "N/A";
            document.getElementById("userHighscore").textContent = userData.highscore || "N/A";
        } else {
            alert("User not found!");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
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
        const confirmDelete = confirm("Are you sure you want to delete your profile?");
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, "users", user.uid));
                alert("Profile deleted successfully!");
                localStorage.clear();
                window.location.href = "login.html"; // Redirect to login after deletion
            } catch (error) {
                console.error("Error deleting profile:", error);
                alert("Failed to delete profile.");
            }
        }
    }
};
