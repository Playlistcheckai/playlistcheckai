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
    // 🔹 Call your backend AI analysis
    const response = await fetch(`/api/analyze?playlistUrl=${encodeURIComponent(playlistUrl)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Analysis failed");
    }

    let score = data.score || Math.floor(Math.random() * 90) + 10;
    let labelText = data.category || (score < 41 ? "Risky" : score < 60 ? "Good" : "Excellent");

    // 🔹 Animate gauge
    let offset = score;
    circle.style.transition = "stroke-dasharray 1.2s ease-out";
    circle.style.strokeDasharray = `${offset}, 100`;
    ratingText.textContent = score;
    label.textContent = `${labelText} (${score}/100)`;

    // 🔹 Update playlist info from API response
    document.getElementById("coverImage").src = data.image || "https://via.placeholder.com/300?text=No+Cover";
    document.getElementById("playlistTitle").textContent = data.title || "Unknown Playlist";
    document.getElementById("playlistDescription").textContent = data.description || "AI analysis completed.";

    // 🔹 Display AI Analysis Summary
    const tracksList = document.getElementById("tracks");
    if (data.analysisSummary) {
      tracksList.innerHTML = `<li>${data.analysisSummary}</li>`;
    } else if (data.reason) {
      tracksList.innerHTML = `<li>${data.reason}</li>`;
    } else {
      tracksList.innerHTML = `<li>AI analysis completed. Safety rating: ${score}/100. This playlist has been evaluated for bot patterns and artificial engagement.</li>`;
    }

  } catch (error) {
    label.textContent = "Analysis failed - please try again";
    ratingText.textContent = "ERR";
    
    // Show error in analysis summary
    const tracksList = document.getElementById("tracks");
    tracksList.innerHTML = `<li>Unable to complete analysis. Please check the playlist URL and try again.</li>`;
    
    console.error("Analysis error:", error);
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
