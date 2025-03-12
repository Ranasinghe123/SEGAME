document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("profileForm").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        let name = document.getElementById("name").value.trim();
        let email = document.getElementById("email").value.trim();

        if (name && email) {
            alert("Profile saved successfully!");
        } else {
            alert("Please fill in all fields.");
        }
    });
});

// Cancel button function
function cancelProfile() {
    window.location.href = "profile.html"; // Redirects to profile.html
}
