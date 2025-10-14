export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { playlistUrl } = req.query;

    console.log('Processing playlist:', playlistUrl);

    if (!playlistUrl || playlistUrl.trim().length === 0) {
      return res.status(400).json({ error: "No playlist URL provided." });
    }

    // 1️⃣ Extract playlist ID
    const playlistId = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) {
      return res.status(400).json({ error: "Invalid Spotify playlist URL" });
    }

    // 2️⃣ Fetch playlist data using multiple proxy methods
    let html = '';
    let success = false;

    // Method 1: Try direct Spotify fetch
    try {
      console.log('Trying direct Spotify fetch...');
      const spotifyRes = await fetch(`https://open.spotify.com/playlist/${playlistId}`);
      if (spotifyRes.ok) {
        html = await spotifyRes.text();
        success = true;
        console.log('Direct fetch success');
      }
    } catch (e) {}

    // Method 2: Try AllOrigins
    if (!success) {
      try {
        console.log('Trying AllOrigins...');
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://open.spotify.com/playlist/${playlistId}`)}`;
        const altRes = await fetch(proxyUrl);
        const altData = await altRes.json();
        html = altData.contents;
        success = true;
        console.log('AllOrigins success');
      } catch (e) {}
    }

    // Method 3: Try CORS proxy
    if (!success) {
      try {
        console.log('Trying CORS proxy...');
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://open.spotify.com/playlist/${playlistId}`)}`;
        const corsRes = await fetch(proxyUrl);
        if (corsRes.ok) {
          html = await corsRes.text();
          success = true;
          console.log('CORS proxy success');
        }
      } catch (e) {}
    }

    if (!success) {
      return res.status(500).json({ error: "Failed to fetch playlist data from all sources" });
    }

    // 3️⃣ Extract Open Graph data
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]*)"/);

    const playlistTitle = titleMatch && titleMatch[1] ? 
      titleMatch[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'") : "Unknown Playlist";
    
    const playlistImage = imageMatch && imageMatch[1] ? 
      imageMatch[1] : "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop";
    
    const playlistDescription = descMatch && descMatch[1] ? 
      descMatch[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'") : "No description available";

    console.log('Extracted:', { 
      title: playlistTitle.substring(0, 50), 
      hasImage: !!playlistImage 
    });

    // 4️⃣ Generate AI Analysis (Free method - no API key needed)
    const analysisResult = generateAIAnalysis(playlistTitle, playlistDescription);

    // 5️⃣ Return successful results
    res.status(200).json({
      score: analysisResult.score,
      category: analysisResult.category,
      reason: analysisResult.reason,
      analysisSummary: analysisResult.analysisSummary,
      title: playlistTitle,
      description: playlistDescription,
      image: playlistImage,
    });

  } catch (error) {
    console.error("Analysis failed:", error);
    res.status(500).json({
      error: "Analysis failed: " + error.message,
    });
  }
}

// Free AI analysis using pattern detection (no API calls)
function generateAIAnalysis(title, description) {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Bot pattern detection
  const botIndicators = [
    { pattern: 'bot', weight: 0.8 },
    { pattern: 'fake', weight: 0.7 },
    { pattern: 'stream', weight: 0.6 },
    { pattern: 'follow', weight: 0.5 },
    { pattern: 'like', weight: 0.5 },
    { pattern: 'subscriber', weight: 0.6 },
    { pattern: 'promotion', weight: 0.4 },
    { pattern: '💰', weight: 0.7 },
    { pattern: '🎵', weight: 0.3 },
    { pattern: '🔥', weight: 0.3 }
  ];

  let botScore = 0;
  let detectedPatterns = [];

  // Analyze title and description for bot patterns
  botIndicators.forEach(indicator => {
    if (titleLower.includes(indicator.pattern) || descLower.includes(indicator.pattern)) {
      botScore += indicator.weight;
      detectedPatterns.push(indicator.pattern);
    }
  });

  // Calculate safety score (100 = safe, 10 = risky)
  let safetyScore = Math.max(10, 100 - (botScore * 30));
  safetyScore = Math.min(100, Math.round(safetyScore));

  // Determine category
  let category = "Excellent";
  let reason = "Clean and organic playlist";
  
  if (safetyScore < 40) {
    category = "Risky";
    reason = "Multiple bot patterns detected";
  } else if (safetyScore < 70) {
    category = "Good";
    reason = "Some patterns require caution";
  }

  // Generate detailed analysis
  let analysisSummary = `This playlist "${title}" appears to be ${category.toLowerCase()}. `;
  
  if (detectedPatterns.length > 0) {
    analysisSummary += `Detected patterns: ${detectedPatterns.join(', ')}. `;
  }
  
  if (safetyScore >= 70) {
    analysisSummary += "The playlist shows organic characteristics with no significant bot activity detected in the metadata.";
  } else if (safetyScore >= 40) {
    analysisSummary += "Some indicators require attention, but overall appears mostly legitimate.";
  } else {
    analysisSummary += "Multiple risk factors detected suggesting potential artificial engagement.";
  }

  return {
    score: safetyScore,
    category,
    reason,
    analysisSummary
  };
}
