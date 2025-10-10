import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { playlistUrl } = req.query;

    if (!playlistUrl || playlistUrl.trim().length === 0) {
      return res.status(400).json({ error: "No playlist URL provided." });
    }

    // 1️⃣ Fetch playlist HTML via Jina AI (public scraping proxy)
    const scrapeRes = await fetch(`https://r.jina.ai/${encodeURIComponent(playlistUrl)}`);
    const html = await scrapeRes.text();

    // 2️⃣ Extract title, image, and description from Open Graph meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    const playlistTitle = titleMatch ? titleMatch[1] : "Unknown Playlist";
    const playlistImage = imageMatch
      ? imageMatch[1]
      : "https://via.placeholder.com/300?text=No+Cover";
    const playlistDescription = descMatch
      ? descMatch[1]
      : "No description available.";

    // 3️⃣ Use OpenAI for intelligent risk/safety evaluation
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are an AI content safety evaluator.
Given the following Spotify playlist information (public data), estimate a "playlist safety rating"
from 10 (very risky) to 100 (excellent and safe for all audiences).
Consider title and description tone, likely artist or content nature, and possible explicit or harmful themes.

Return a compact JSON like this:
{"score": number, "category": "Risky | Good | Excellent", "reason": "short one-sentence reasoning"}

Playlist title: ${playlistTitle}
Playlist description: ${playlistDescription}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    let aiData = {};
    try {
      aiData = JSON.parse(responseText);
    } catch {
      aiData = {
        score: 55,
        category: "Good",
        reason: "AI could not parse exact result, defaulting to balanced safety rating.",
      };
    }

    // 4️⃣ Return everything to frontend
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

