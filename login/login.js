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

// Function to store JWT token in cookies
function setAuthCookie(token) {
    document.cookie = `authToken=${token}; path=/; secure; samesite=strict`;
    console.log("✅ JWT Token stored in cookie:", token);
    console.log("✅ Cookies after setting:", document.cookie);
}

// Function to get JWT token from cookies
function getAuthToken() {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "authToken") {
            console.log("✅ Found JWT Token in cookies:", value);
            return value;
        }
    }
    console.log("❌ No JWT Token found in cookies.");
    return null;
}

// Function to handle login
document.addEventListener("DOMContentLoaded", function () {
    console.log("📢 Checking authentication on page load...");
    console.log("✅ Current Cookies:", document.cookie);

    const form = document.getElementById("loginform");

    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent form default submission

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                alert("Please enter both email and password.");
                return;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Get Firebase JWT Token
                const token = await user.getIdToken();

                // Store token in cookie
                setAuthCookie(token);

                console.log("✅ Login successful for:", user.email);
                console.log("✅ User Session Info:", user);
                console.log("✅ JWT Token from Firebase:", token);

                alert(`Login successful! Welcome, ${user.email}`);

                // Redirect to main.html
                window.location.href = "../main/main.html";

            } catch (error) {
                console.error("❌ Login Error:", error.message);
                alert("Error: " + error.message);
            }
        });
    } else {
        console.warn("⚠️ Login form not found. Make sure login.html has an element with id='loginform'.");
    }
});

// Google Login Function
window.googleLogin = async function () {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Get Firebase JWT Token
        const token = await user.getIdToken();

        // Store token in cookie
        setAuthCookie(token);

        console.log("✅ Google Login successful for:", user.displayName);
        console.log("✅ User Session Info:", user);
        console.log("✅ JWT Token from Firebase:", token);

        alert(`Google Login successful! Welcome, ${user.displayName}`);

        // Redirect to main.html
        window.location.href = "../main/main.html";

    } catch (error) {
        console.error("❌ Google Login Error:", error.message);
        alert("Error: " + error.message);
    }
};

// Function to check if the user is logged in and redirect if necessary
document.addEventListener("DOMContentLoaded", async function () {
    // Check if we're on the login page
    const isLoginPage = window.location.pathname.includes("login.html");
    const authToken = getAuthToken();

    if (!authToken && !isLoginPage) {
        console.log("❌ No valid session found. Redirecting to login page...");
        window.location.href = "../login/login.html";
    } else if (authToken && isLoginPage) {
        // If we're already logged in and on the login page, redirect to main
        console.log("✅ User is already authenticated. Redirecting to main page...");
        window.location.href = "../main/main.html";
    } else {
        console.log("✅ Authentication state is appropriate for current page.");
    }
});s

// Logout function
window.logout = function () {
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    
    console.log("✅ User logged out. JWT token cleared from cookies.");
    
    alert("Logged out successfully!");
    
    window.location.href = "../login/login.html";
};
