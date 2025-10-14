import OpenAI from "openai";

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
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`;
      const altRes = await fetch(proxyUrl);
      const altData = await altRes.json();
      html = altData.contents;
    }

    // 3️⃣ Extract Open Graph data (title, image, description)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    const playlistTitle = titleMatch ? titleMatch[1] : "Unknown Playlist";
    const playlistImage =
      imageMatch?.[1] || "https://via.placeholder.com/300?text=No+Cover";
    const playlistDescription =
      descMatch?.[1] || "No description available.";

    // 4️⃣ Ask OpenAI for intelligent safety analysis
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are an AI that evaluates Spotify playlists for safety and legitimacy.
Given the title and description below, score the playlist from 10 (risky, likely bot streams or explicit themes)
to 100 (excellent, genuine, and safe).
Provide a concise JSON result:
{"score": number, "category": "Risky|Good|Excellent", "reason": "short reason"}

Playlist title: ${playlistTitle}
Playlist description: ${playlistDescription}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content || "";
    let aiData = {};
    try {
      aiData = JSON.parse(text);
    } catch {
      aiData = {
        score: 55,
        category: "Good",
        reason: "AI could not parse structured output; defaulting to safe middle rating.",
      };
    }

    // 5️⃣ Return results
    res.status(200).json({
      score: aiData.score,
      category: aiData.category,
      reason: aiData.reason,
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

