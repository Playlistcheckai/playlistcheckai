// FAQ functionality for AEO
document.addEventListener('DOMContentLoaded', function() {
    // FAQ toggle functionality
    const faqItems = document.querySelectorAll('.faq-item h3');
    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');
        });
    });
    
    // Auto-expand first FAQ for better AEO
    if (faqItems.length > 0) {
        faqItems[0].parentElement.classList.add('active');
    }
});

document.getElementById("analyzeBtn").addEventListener("click", analyzePlaylist);

// Allow Enter key to trigger analysis
document.getElementById("playlistInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        analyzePlaylist();
    }
});

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

    // Validate Spotify URL
    if (!playlistUrl.includes('open.spotify.com/playlist/')) {
        alert("❌ Please enter a valid Spotify playlist URL");
        return;
    }

    // Show loading state
    resultsSection.classList.remove("hidden");
    label.textContent = "Analyzing...";
    ratingText.textContent = "--";
    circle.style.strokeDasharray = "0, 100";
    
    // Clear previous results
    document.getElementById("coverImage").src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop";
    document.getElementById("playlistTitle").textContent = "Loading...";
    document.getElementById("playlistDescription").textContent = "Fetching playlist data...";
    document.getElementById("tracks").innerHTML = "<li>Analyzing playlist safety patterns...</li>";

    try {
        // Call backend AI analysis
        const response = await fetch(`/api/analyze?playlistUrl=${encodeURIComponent(playlistUrl)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed");
        }

        const score = data.score || 50;
        const category = data.category || (score < 40 ? "Risky" : score < 70 ? "Good" : "Excellent");

        // Update gauge animation
        circle.style.transition = "stroke-dasharray 1.2s ease-out";
        circle.style.strokeDasharray = `${score}, 100`;
        ratingText.textContent = score;
        label.textContent = `${category} (${score}/100)`;

        // Update playlist info
        document.getElementById("coverImage").src = data.image;
        document.getElementById("playlistTitle").textContent = data.title;
        document.getElementById("playlistDescription").textContent = data.description;

        // Display AI Analysis Summary
        const tracksList = document.getElementById("tracks");
        if (data.analysisSummary) {
            tracksList.innerHTML = `<li>${data.analysisSummary}</li>`;
        } else {
            tracksList.innerHTML = `<li>Safety analysis completed. This playlist rated ${score}/100 for organic engagement and authenticity.</li>`;
        }

    } catch (error) {
        console.error("Analysis error:", error);
        
        // Show error state
        label.textContent = "Analysis Failed";
        ratingText.textContent = "ERR";
        
        // Provide helpful error message
        const tracksList = document.getElementById("tracks");
        tracksList.innerHTML = `<li>Unable to analyze playlist. Please ensure:
            <br>• The playlist URL is correct
            <br>• The playlist is public
            <br>• Try again in a moment</li>`;
        
        document.getElementById("playlistTitle").textContent = "Analysis Error";
        document.getElementById("playlistDescription").textContent = "Please check the playlist URL and try again.";
    }
}

// 🧠 Fetch Open Graph metadata directly from public playlist pages (fallback)
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
