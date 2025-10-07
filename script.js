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
    let labelText =
      score < 41 ? "Risky" : score < 60 ? "Good" : "Excellent";

    // Animate circular gauge
    let offset = score;
    circle.style.transition = "stroke-dasharray 1.2s ease-out";
    circle.style.strokeDasharray = `${offset}, 100`;
    ratingText.textContent = score;
    label.textContent = `${labelText} (${score}/100)`;

    // Update mock playlist info (replace with real Spotify API later)
    document.getElementById("playlistTitle").textContent = "Analyzed Playlist";
    document.getElementById("playlistDescription").textContent =
      "Public playlist information displayed here.";
    document.getElementById("coverImage").src =
      "https://storage.googleapis.com/pai-images/playlistcoverexample.png";
  } catch (error) {
    label.textContent = "Error fetching playlist data.";
    console.error(error);
  }
}
