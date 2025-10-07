export default async function handler(req, res) {
  try {
    const { playlistUrl } = req.query;

    if (!playlistUrl) {
      return res.status(400).json({ error: "Missing playlist URL" });
    }

    // Get Spotify access token
    const authResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Extract playlist ID from URL
    const playlistId = playlistUrl.split("/playlist/")[1]?.split("?")[0];
    if (!playlistId) {
      return res.status(400).json({ error: "Invalid Spotify playlist link" });
    }

    // Fetch playlist data from Spotify
  const playlistResponse = await fetch(
  `https://api.spotify.com/v1/playlists/${playlistId}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  }
);

    const playlistData = await playlistResponse.json();

    if (!playlistData.tracks) {
      return res.status(400).json({ error: "Could not fetch playlist tracks" });
    }

    // Analyze explicit content
    const tracks = playlistData.tracks.items.map((item) => ({
      name: item.track.name,
      explicit: item.track.explicit,
    }));

    const explicitCount = tracks.filter((t) => t.explicit).length;
    const explicitScore = Math.max(0, 100 - explicitCount * 5);

    // Simple rating logic
    const score = explicitScore;
    let label = "Excellent";
    if (score <= 40) label = "Risky";
    else if (score <= 59) label = "Good";

    res.status(200).json({
      playlist: playlistData.name,
      totalTracks: tracks.length,
      explicitCount,
      score,
      label,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
}
