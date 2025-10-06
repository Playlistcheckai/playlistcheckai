function analyzePlaylist() {
  const input = document.getElementById("playlistInput").value;
  const resultDiv = document.getElementById("result");

  if (!input) {
    resultDiv.innerText = "⚠️ Please enter a Spotify playlist link.";
    resultDiv.style.color = "yellow";
    return;
  }

  // Mock AI logic for MVP
  const randomScore = Math.floor(Math.random() * 91) + 10; // 10–100
  let label = "";
  let color = "";

  if (randomScore <= 40) {
    label = "Risky";
    color = "red";
  } else if (randomScore <= 59) {
    label = "Good";
    color = "yellow";
  } else {
    label = "Excellent";
    color = "#1DB954"; // Spotify green
  }

  resultDiv.innerText = `Rating: ${randomScore} (${label})`;
  resultDiv.style.color = color;
}

// Mock playlist search
function searchPlaylists() {
  const query = document.getElementById("searchInput").value.trim();
  const resultsList = document.getElementById("searchResults");
  resultsList.innerHTML = "";

  if (!query) {
    resultsList.innerHTML = "<li>⚠️ Please enter a keyword.</li>";
    return;
  }

  // Mock data (later this will call Spotify API)
  const mockPlaylists = [
    { name: "Top Hits 2025", url: "https://open.spotify.com/playlist/111" },
    { name: "Chill Vibes", url: "https://open.spotify.com/playlist/222" },
    { name: "Workout Energy", url: "https://open.spotify.com/playlist/333" }
  ];

  const filtered = mockPlaylists.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    resultsList.innerHTML = "<li>No playlists found.</li>";
  } else {
    filtered.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${p.name}</strong><br><a href="${p.url}" target="_blank">${p.url}</a>`;
      resultsList.appendChild(li);
    });
  }
}
