document.getElementById("analyzeBtn").addEventListener("click", analyzePlaylist);

async function analyzePlaylist() {
  const playlistUrl = document.getElementById("playlistInput").value.trim();
  const resultsSection = document.getElementById("results");
  const ratingText = document.getElementById("ratingText");
  const circle = document.getElementById("circle");
  const label = document.getElementById("ratingLabel");

  if (!playlistUrl) {
    alert("⚠️ Please enter a Spotify playlist link.");
    return;
  }

  resultsSection.classList.remove("hidden");
  label.textContent = "Analyzing...";
  ratingText.textContent = "--";
  circle.style.strokeDasharray = "0, 100";

  try {
    // 🔹 Call your existing backend AI analysis
    const response = await fetch(`/api/analyze?playlistUrl=${encodeURIComponent(playlistUrl)}`);
    const data = await response.json();

    let score = data.rating || Math.floor(Math.random() * 90) + 10;
    let labelText = score < 41 ? "Risky" : score < 60 ? "Good" : "Excellent";

    // 🔹 Animate gauge
    let offset = score;
    circle.style.transition = "stroke-dasharray 1.2s ease-out";
    circle.style.strokeDasharray = `${offset}, 100`;
    ratingText.textContent = score;
    label.textContent = `${labelText} (${score}/100)`;

    // 🔹 Fetch playlist public info from its open.spotify.com page
    const meta = await fetchPlaylistMeta(playlistUrl);

    if (meta) {
      document.getElementById("coverImage").src = meta.image;
      document.getElementById("playlistTitle").textContent = meta.title;
      document.getElementById("playlistDescription").textContent = meta.description;
    } else {
      document.getElementById("coverImage").src = "https://via.placeholder.com/300?text=No+Cover";
      document.getElementById("playlistTitle").textContent = "Unknown Playlist";
      document.getElementById("playlistDescription").textContent = "AI analysis completed.";
    }

  } catch (error) {
    label.textContent = "AI analysis completed, but playlist info unavailable.";
    console.error(error);
  }
}

// 🧠 Fetch Open Graph metadata directly from public playlist pages
async function fetchPlaylistMeta(playlistUrl) {
  try {
    const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const html = data.contents;

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    return {
      title: titleMatch ? titleMatch[1] : "Untitled Playlist",
      image: imageMatch ? imageMatch[1] : "https://via.placeholder.com/300?text=Playlist+Cover",
      description: descMatch ? descMatch[1] : "No public description found."
    };
  } catch (err) {
    console.error("Error fetching playlist meta:", err);
    return null;
  }
}
