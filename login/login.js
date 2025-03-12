// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";


// Firebase Configuration
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Handle Login Form Submission
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginform");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            // Sign in with Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Show success message (instead of redirecting)
            alert(`Login successful! Welcome, ${user.email}`);

            // Optionally, display user info
            document.getElementById("login-status").innerText = `Logged in as: ${user.email}`;
        } catch (error) {
            alert("Error: " + error.message);
        }
    });
});

// Google Login Function
window.googleLogin = async function () {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Show success message instead of redirecting
        alert(`Google Login successful! Welcome, ${user.displayName}`);

        // Optionally, display user info
        document.getElementById("login-status").innerText = `Logged in as: ${user.displayName}`;
    } catch (error) {
        alert("Error: " + error.message);
    }
};
