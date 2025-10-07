export default async function handler(req, res) {
  try {
    const { playlistText } = req.body;

    if (!playlistText || playlistText.trim().length === 0) {
      return res.status(400).json({ error: "No playlist text provided." });
    }

    // 🔹 Define the two models we’ll use
    const models = {
      sentiment: "cardiffnlp/twitter-roberta-base-sentiment",
      toxicity: "unitary/toxic-bert",
    };

    // 🔹 Helper function to call a Hugging Face model
    async function callHFModel(model, inputs) {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`Error from ${model}:`, err);
        return null;
      }

      return response.json();
    }

    // 🔹 Run both models in parallel
    const [sentimentData, toxicityData] = await Promise.all([
      callHFModel(models.sentiment, playlistText),
      callHFModel(models.toxicity, playlistText),
    ]);

    // 🔹 Interpret Sentiment Result
    const sentimentLabel = sentimentData?.[0]?.[0]?.label || "neutral";
    const sentimentScore = sentimentData?.[0]?.[0]?.score || 0.5;

    // 🔹 Interpret Toxicity Result
    const toxicityScore = toxicityData?.[0]?.[0]?.score || 0; // 0 = safe, 1 = toxic

    // 🔹 Combine both for AI Rating
    // The lower the toxicity and higher the sentiment, the safer the playlist.
    const aiSafetyIndex = Math.round((sentimentScore * (1 - toxicityScore)) * 100);

    let category = "Good";
    let color = "yellow";

    if (aiSafetyIndex < 40) {
      category = "Risky";
      color = "red";
    } else if (aiSafetyIndex >= 60) {
      category = "Excellent";
      color = "green";
    }

    res.status(200).json({
      rating: aiSafetyIndex,
      category,
      sentiment: sentimentLabel,
      sentimentScore,
      toxicityScore,
      color,
    });
  } catch (error) {
    console.error("AI analysis failed:", error);
    res.status(500).json({
      error: "AI analysis failed",
      details: error.message,
    });
  }
}
