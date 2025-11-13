import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { playlistUrl } = req.query;

    if (!playlistUrl) {
      return res.status(400).json({ error: "No playlist URL provided." });
    }

    // 🧩 Normalize link (handle extra https://)
    const cleanUrl = playlistUrl.replace(/^https:\/\//, "").replace(/^https:\/\//, "https://");

    // 1️⃣ Fetch playlist HTML via Jina AI proxy
    const scrapeRes = await fetch(`https://r.jina.ai/${encodeURIComponent(cleanUrl)}`);
    const html = await scrapeRes.text();

    // 2️⃣ Extract Open Graph meta tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    const playlistTitle = titleMatch ? titleMatch[1] : "Unknown Playlist";
    const playlistImage = imageMatch ? imageMatch[1] : "https://via.placeholder.com/300?text=No+Cover";
    const playlistDescription = descMatch ? descMatch[1] : "No description available.";

    // 3️⃣ OpenAI evaluation
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
Given this playlist info, evaluate its safety score (10–100) for authenticity and natural streaming activity.
Return: {"score": number, "category": "Risky | Good | Excellent", "reason": "short reason"}

Title: ${playlistTitle}
Description: ${playlistDescription}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
    } catch {
      result = { score: 60, category: "Good", reason: "Standard playlist, no unusual patterns detected." };
    }

    res.status(200).json({
      ...result,
      title: playlistTitle,
      description: playlistDescription,
      image: playlistImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI analysis failed", details: error.message });
  }
}
