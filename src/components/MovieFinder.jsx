import { useState } from "react";
import "../css/MovieFinder.css";

const moods = [
    { name: "Happy", genre: "Comedy", emoji: "☀️", accent: "#f5b842", description: "Feel-good movies and laughter" },
    { name: "Adventurous", genre: "Adventure", emoji: "🚀", accent: "#4fa3ff", description: "Explore extraordinary worlds" },
    { name: "Thrilled", genre: "Thriller", emoji: "🌑", accent: "#9b7bff", description: "Suspense, mystery and twists" },
    { name: "Romantic", genre: "Romance", emoji: "💗", accent: "#ff6f9f", description: "Stories that touch the heart" },
    { name: "Scared", genre: "Horror", emoji: "👻", accent: "#8f9bb8", description: "For your next frightening night" },
    { name: "Curious", genre: "Science Fiction", emoji: "🪐", accent: "#3ed3c0", description: "Discover the unknown" },
];

const platforms = [
    { label: "Any platform", value: "" },
    { label: "Netflix", value: "netflix" },
    { label: "Amazon Prime Video", value: "prime" },
    { label: "JioHotstar", value: "jiohotstar" },
    { label: "ZEE5", value: "zee5" },
    { label: "Sony LIV", value: "sonyliv" },
    { label: "Apple TV+", value: "appletv" },
    { label: "YouTube Movies", value: "youtube" },
];

const languages = [
    { label: "All languages", value: "" },
    { label: "English", value: "en" },
    { label: "Hindi", value: "hi" },
    { label: "Bengali", value: "bn" },
    { label: "Tamil", value: "ta" },
    { label: "Telugu", value: "te" },
    { label: "Malayalam", value: "ml" },
    { label: "Kannada", value: "kn" },
    { label: "Marathi", value: "mr" },
    { label: "Punjabi", value: "pa" },
    { label: "Japanese", value: "ja" },
    { label: "Korean", value: "ko" },
    { label: "Chinese", value: "zh" },
    { label: "French", value: "fr" },
    { label: "Spanish", value: "es" },
    { label: "German", value: "de" },
];

function MovieFinder({ onRecommend, loading }) {
    const [minRating, setMinRating] = useState("0");
    const [runtime, setRuntime] = useState("");
    const [providerId, setProviderId] = useState("");
    const [selectedGenre, setSelectedGenre] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("");

    const activeCount = [
        minRating !== "0",
        runtime,
        providerId,
        selectedLanguage,
        selectedGenre,
    ].filter(Boolean).length;

    const applyFilters = (genre = selectedGenre) => {
        onRecommend(genre, Number(minRating), {
            runtime,
            platform: providerId,
            language: selectedLanguage,
        });
    };

    // Clicking a mood selects it (and searches); clicking it again deselects it
    const handleMood = (genre) => {
        const next = selectedGenre === genre ? "" : genre;
        setSelectedGenre(next);
        applyFilters(next);
    };

    const clearFilters = () => {
        setMinRating("0");
        setRuntime("");
        setProviderId("");
        setSelectedGenre("");
        setSelectedLanguage("");
        onRecommend("", 0, {});
    };

    return (
        <section className="movie-finder">
            <div className="finder-heading">
                <span className="finder-eyebrow">YOUR NEXT WATCH, SIMPLIFIED</span>
                <h2>What are you in the <span>mood for?</span></h2>
                <p>Choose a mood, apply individual filters, or combine them.</p>
            </div>

            <div className="mood-grid">
                {moods.map((mood) => {
                    const active = selectedGenre === mood.genre;
                    return (
                        <button
                            className={`mood-card ${active ? "active" : ""}`}
                            style={{ "--accent": mood.accent }}
                            key={mood.name}
                            onClick={() => handleMood(mood.genre)}
                            disabled={loading}
                            aria-pressed={active}
                            type="button"
                        >
                            <span className="mood-emoji">{mood.emoji}</span>
                            <span className="mood-name">{mood.name}</span>
                            <span className="mood-description">{mood.description}</span>
                            <span className="mood-arrow" aria-hidden="true">{active ? "✓" : "↗"}</span>
                        </button>
                    );
                })}
            </div>

            <div className="finder-panel">
                <div className="finder-panel-head">
                    <div>
                        <span className="panel-eyebrow">REFINE</span>
                        <h3>Fine-tune your picks</h3>
                    </div>
                    {activeCount > 0 && (
                        <span className="active-count">{activeCount} active</span>
                    )}
                </div>

                <div className="finder-filters">
                    <div className="rating-filter">
                        <label htmlFor="language-filter">🌐 Language</label>
                        <select
                            id="language-filter"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            disabled={loading}
                        >
                            {languages.map((language) => (
                                <option key={language.value || "all"} value={language.value}>
                                    {language.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rating-filter">
                        <label htmlFor="minimum-rating">★ Minimum rating</label>
                        <select
                            id="minimum-rating"
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            disabled={loading}
                        >
                            <option value="0">Any rating</option>
                            <option value="6">6.0+</option>
                            <option value="7">7.0+</option>
                            <option value="8">8.0+</option>
                            <option value="9">9.0+</option>
                        </select>
                    </div>

                    <div className="rating-filter">
                        <label htmlFor="runtime-filter">⏱ Duration</label>
                        <select
                            id="runtime-filter"
                            value={runtime}
                            onChange={(e) => setRuntime(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Any duration</option>
                            <option value="under90">Under 90 minutes</option>
                            <option value="90to120">90–120 minutes</option>
                            <option value="120to150">121–150 minutes</option>
                            <option value="over150">Over 150 minutes</option>
                        </select>
                    </div>

                    <div className="rating-filter">
                        <label htmlFor="platform-filter">▶ Streaming (India)</label>
                        <select
                            id="platform-filter"
                            value={providerId}
                            onChange={(e) => setProviderId(e.target.value)}
                            disabled={loading}
                        >
                            {platforms.map((platform) => (
                                <option key={platform.value} value={platform.value}>
                                    {platform.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="finder-actions">
                    <p className="finder-hint">Tip: combine a mood with filters for sharper results.</p>
                    <div className="finder-buttons">
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={clearFilters}
                            disabled={loading || activeCount === 0}
                        >
                            Clear filters
                        </button>
                        <button
                            type="button"
                            className="find-btn"
                            onClick={() => applyFilters()}
                            disabled={loading}
                        >
                            {loading ? "Finding movies..." : "Find Movies →"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MovieFinder;