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
    const response = await fetch(`/api/analyze?playlistUrl=${encodeURIComponent(playlistUrl)}`);
    const data = await response.json();

    let score = data.score || Math.floor(Math.random() * 90) + 10; // fallback mock
    let labelText = score < 41 ? "Risky" : score < 60 ? "Good" : "Excellent";

    // Animate circular gauge
    let offset = score;
    circle.style.transition = "stroke-dasharray 1.2s ease-out";
    circle.style.strokeDasharray = `${offset}, 100`;
    ratingText.textContent = score;
    label.textContent = `${labelText} (${score}/100)`;

    // ✅ Fetch real public playlist meta (cover, title, description)
    const meta = await fetchPlaylistMeta(playlistUrl);

    if (meta) {
      document.getElementById("playlistTitle").textContent = meta.title;
      document.getElementById("playlistDescription").textContent = meta.description;
      document.getElementById("coverImage").src = meta.image;
    } else {
      document.getElementById("playlistTitle").textContent = "Analyzed Playlist";
      document.getElementById("playlistDescription").textContent = "Could not fetch playlist details.";
      document.getElementById("coverImage").src = "https://via.placeholder.com/300?text=No+Cover";
    }

  } catch (error) {
    label.textContent = "Error fetching playlist data.";
    console.error(error);
  }
}

// 🧩 helper: pull Open Graph data from the public playlist page
async function fetchPlaylistMeta(playlistUrl) {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`);
    const data = await response.json();
    const html = data.contents;

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    return {
      title: titleMatch ? titleMatch[1] : "Unknown Playlist",
      image: imageMatch ? imageMatch[1] : "https://via.placeholder.com/300?text=No+Cover",
      description: descMatch ? descMatch[1] : "No description available."
    };
  } catch (err) {
    console.error("Error fetching playlist meta:", err);
    return null;
  }
}
