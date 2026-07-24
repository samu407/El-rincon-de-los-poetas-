// Alternativa a Firebase Functions: Vercel Serverless Function.
// Despliega este archivo en un proyecto de Vercel bajo /api/spotify-token.js
// Las variables SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET se configuran
// en el dashboard de Vercel (Project Settings > Environment Variables),
// NUNCA en este código.

let cachedToken = null;
let cachedExpiryMs = 0;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // restringe a tu dominio en producción

  try {
    const now = Date.now();
    if (cachedToken && now < cachedExpiryMs - 60000) {
      return res.status(200).json({ access_token: cachedToken, cached: true });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    if (!tokenRes.ok) throw new Error(`Spotify token error: ${tokenRes.status}`);

    const data = await tokenRes.json();
    cachedToken = data.access_token;
    cachedExpiryMs = now + data.expires_in * 1000;

    res.status(200).json({ access_token: cachedToken, cached: false });
  } catch (err) {
    console.error("Error obteniendo token de Spotify:", err);
    res.status(500).json({ error: "no se pudo obtener el token de Spotify" });
  }
}
