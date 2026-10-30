import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow command-line tools / health checks without an Origin header.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.get("/health", (_req, res) => res.json({ ok: true, service: "cinematch-tmdb-proxy" }));

app.get("/api/tmdb/*", async (req, res) => {
  if (!TMDB_API_KEY) return res.status(500).json({ error: "Server TMDB_API_KEY is not configured." });
  try {
    const tmdbPath = req.originalUrl.replace(/^\/api\/tmdb/, "");
    const target = new URL(`https://api.themoviedb.org/3${tmdbPath}`);
    target.searchParams.set("api_key", TMDB_API_KEY);
    const upstream = await fetch(target, { headers: { Accept: "application/json" } });
    const body = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get("content-type") || "application/json").send(body);
  } catch (error) {
    console.error("TMDB proxy error:", error.message);
    res.status(502).json({ error: "Could not connect to TMDB from the backend." });
  }
});

app.listen(PORT, () => console.log(`Cinematch TMDB proxy listening on port ${PORT}`));
