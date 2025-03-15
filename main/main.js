// Function to get JWT token from cookies
function getAuthToken() {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === "authToken") {
            return value;
        }
    }
    return null;
}

// Check if user is authenticated
document.addEventListener("DOMContentLoaded", async function () {
    const userInfo = document.getElementById("user-info");
    const logoutBtn = document.getElementById("logout-btn");
    const authToken = getAuthToken();

    if (!authToken) {
        // Redirect to login page if token is missing
        window.location.href = "../login/login.html";
        return;
    }

    // Display login status
    userInfo.innerText = `Logged in successfully`;
    logoutBtn.style.display = "block";
});

// Logout function
function logout() {
    // Clear auth token from cookies
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    
    alert("Logged out successfully!");
    
    // Redirect to login page
    window.location.href = "../login/login.html";
}

// Function to start the game
function startGame() {
    // Redirect to the game page
    window.location.href = "../play/play.html"; 
}

// Function to open profile page
function openProfile() {
    // Redirect to the profile page
    window.location.href = "../profile/profile.html"; 
}

// Function to open leaderboard
function openLeaderboard() {
    // Redirect to the leaderboard page
    window.location.href = "../board/board.html"; 
}
