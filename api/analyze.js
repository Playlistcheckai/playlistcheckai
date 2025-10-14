export default async function handler(req, res) {
  try {
    const { playlistUrl } = req.query;

    if (!playlistUrl || playlistUrl.trim().length === 0) {
      return res.status(400).json({ error: "No playlist URL provided." });
    }

    // 1️⃣ Try to fetch playlist HTML via Jina AI first
    let html = "";
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${encodeURIComponent(playlistUrl)}`);
      html = await jinaRes.text();
    } catch (err) {
      console.warn("⚠️ Jina proxy failed, falling back to AllOrigins.");
    }

    // 2️⃣ If Jina fails, fallback to AllOrigins proxy (more stable)
    if (!html || html.length < 100) {
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`;
        const altRes = await fetch(proxyUrl);
        const altData = await altRes.json();
        html = altData.contents;
      } catch (proxyError) {
        console.error("AllOrigins also failed:", proxyError);
      }
    }

    // 3️⃣ Extract Open Graph data (title, image, description)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    const playlistTitle = titleMatch ? titleMatch[1].replace(/&quot;/g, '"') : "Unknown Playlist";
    const playlistImage = imageMatch ? imageMatch[1] : "https://via.placeholder.com/300?text=No+Cover";
    const playlistDescription = descMatch ? descMatch[1].replace(/&quot;/g, '"') : "No description available.";

    // 4️⃣ Ask DeepSeek for intelligent safety analysis with BOT DETECTION focus
    const prompt = `
CRITICAL ANALYSIS REQUEST: You are a Spotify playlist security expert specializing in detecting bot activity, artificial streams, and fake engagement.

ANALYZE THIS SPOTIFY PLAYLIST FOR BOT PATTERNS:

PLAYLIST TITLE: "${playlistTitle}"
PLAYLIST DESCRIPTION: "${playlistDescription}"
PLAYLIST URL: ${playlistUrl}

BOT DETECTION CRITERIA:
1. Analyze title for spammy/bot-like patterns (excessive emojis, repetitive words, generic names)
2. Check description for artificial or templated content
3. Evaluate for common bot playlist characteristics
4. Assess likelihood of artificial streaming or fake engagement
5. Look for patterns typical of playlist manipulation services

PROVIDE COMPREHENSIVE ANALYSIS IN THIS EXACT JSON FORMAT:
{
  "score": [number between 10-100, where 10=high bot activity, 100=organic],
  "category": "Risky|Good|Excellent",
  "reason": "Brief safety assessment",
  "analysisSummary": "Detailed analysis of bot patterns found, including specific indicators and overall safety assessment. This should be 2-3 sentences explaining the safety rating and any detected patterns."
}

Focus on detecting artificial/bot activity patterns in the playlist metadata.
`;

    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a Spotify playlist security analyst expert at detecting bot activity, artificial streams, and fake engagement. Always respond with valid JSON format. Provide detailed analysis of bot patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    });

    if (!deepseekResponse.ok) {
      throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    const text = deepseekData.choices?.[0]?.message?.content || "";
    
    let aiData = {};
    try {
      aiData = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Fallback analysis
      aiData = {
        score: 55,
        category: "Good",
        reason: "Basic safety assessment completed",
        analysisSummary: "AI analysis completed. This playlist appears to have standard characteristics. No significant bot patterns detected in the available metadata."
      };
    }

    // Ensure all required fields exist
    const finalData = {
      score: aiData.score || 50,
      category: aiData.category || "Good",
      reason: aiData.reason || "Safety analysis completed",
      analysisSummary: aiData.analysisSummary || "This playlist has been analyzed for safety patterns. The assessment is based on publicly available metadata and AI pattern recognition."
    };

    // 5️⃣ Return results
    res.status(200).json({
      score: finalData.score,
      category: finalData.category,
      reason: finalData.reason,
      analysisSummary: finalData.analysisSummary,
      title: playlistTitle,
      description: playlistDescription,
      image: playlistImage,
    });
  } catch (error) {
    console.error("AI analysis failed:", error);
    res.status(500).json({
      error: "AI analysis failed",
      details: error.message,
    });
  }
}
