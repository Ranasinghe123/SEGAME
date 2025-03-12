const players = [
    { rank: 1, name: "Randika", score: 25 },
    { rank: 2, name: "RR", score: 30 },
    { rank: 3, name: "Supun", score: 35 },
    { rank: 4, name: "AKD", score: 40 }
];

function loadLeaderboard() {
    const leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.innerHTML = "";

    players.forEach(player => {
        const entry = document.createElement("div");
        entry.classList.add("entry");
        entry.innerHTML = `<span>${player.rank}</span> <span>${player.name}</span> <span>${player.score}</span>`;
        leaderboardList.appendChild(entry);
    });
}

// Load leaderboard on page load
window.onload = loadLeaderboard;
