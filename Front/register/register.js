// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Handle Registration Form Submission
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("registerForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        let name = document.getElementById("name").value.trim();
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value.trim();

        if (!name || !email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user details in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            alert("Registration successful!");
            window.location.href = "../login/login.html"; // Redirect to login page
        } catch (error) {
            console.error("Registration Error:", error);
            alert("Error: " + error.message);
        }
    });
// Google Registration
document.getElementById("googleRegister").addEventListener("click", async function () {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save Google user details in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: user.displayName,
            email: user.email,
            uid: user.uid,
            createdAt: new Date().toISOString()
        });

        alert("Google Registration successful!");
        window.location.href = "../login/login.html"; // Redirect
    } catch (error) {
        console.error("Google Registration Error:", error);
        alert("Error: " + error.message);
    }
});
});
