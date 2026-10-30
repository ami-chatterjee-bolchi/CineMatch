import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import MovieFinder from "../components/MovieFinder";
import "../css/Home.css";

import {
    getPopularMovies,
    searchMovies,
    getMoviesByGenre,
} from "../Services/movieApi";

function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [movies, setMovies] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeMinRating, setActiveMinRating] = useState(0);

    useEffect(() => {
        const loadPopularMovies = async () => {
            try {
                const popularMovies = await getPopularMovies();
                setMovies(popularMovies);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("We couldn't load the movies. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        loadPopularMovies();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();

        const query = searchQuery.trim();

        if (!query || loading) return;

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const searchResults = await searchMovies(query);
            setMovies(searchResults);
            setSearchQuery("");
        } catch (err) {
            console.error(err);
            setError("Something went wrong while searching. Please try again.");
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    const showPopularMovies = async () => {
        setSearchQuery("");
        setHasSearched(false);
        setLoading(true);
        setError(null);
        setActiveMinRating(0);

        try {
            const popularMovies = await getPopularMovies();
            setMovies(popularMovies);
        } catch (err) {
            console.error(err);
            setError("We couldn't load the movies. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMoodRecommendation = async (genre, minRating = 0, filters = {}) => {
        setLoading(true);
        setError(null);
        setSearchQuery("");
        setHasSearched(true);
        setActiveMinRating(minRating);

        try {
            const results = await getMoviesByGenre(genre, minRating, filters);
            setMovies(results);
        } catch (err) {
            console.error("Mood recommendation error:", err);
            setError(err.message || "Unable to find movies. Please try again.");
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-orb hero-orb-one"></div>
                <div className="hero-orb hero-orb-two"></div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        YOUR PERSONAL MOVIE UNIVERSE
                    </div>

                    <h1 className="hero-title">
                        Your next
                        <br />
                        <span>obsession</span> awaits.
                    </h1>

                    <p className="hero-description">
                        From hidden gems to unforgettable classics,
                        discover the movies that speak to you.
                    </p>

                    {/* Cosmic Search Bar */}
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="galaxy-search">
                            <div className="nebula" />
                            <div className="starfield" />
                            <div className="cosmic-dust" />
                            <div className="stardust" />
                            <div className="cosmic-ring" />

                            <div className="search-main">
                                <input
                                    type="text"
                                    name="text"
                                    placeholder="Search for movies..."
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />

                                <button
                                    type="submit"
                                    className="search-button"
                                    aria-label="Search movies"
                                    disabled={loading}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="23"
                                        height="23"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <line
                                            x1="21"
                                            y1="21"
                                            x2="16.65"
                                            y2="16.65"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </form>

                    <MovieFinder
                        onRecommend={handleMoodRecommendation}
                        loading={loading}
                    />

                    <div className="hero-footnote">
                        <span>✦</span> A universe of stories. One search away.
                    </div>
                </div>

                <div className="hero-bottom-glow"></div>
            </section>

            {/* Movie Discovery Section */}
            <section className="discovery-section">
                <div className="section-heading">
                    <div className="section-heading-left">
                        <span className="section-eyebrow">
                            {hasSearched
                                ? "THE RESULTS ARE IN"
                                : "HANDPICKED FOR YOU"}
                        </span>

                        <h2>
                            {hasSearched ? (
                                <>
                                    Search <span>results.</span>
                                </>
                            ) : (
                                <>
                                    Popular <span>right now.</span>
                                </>
                            )}
                        </h2>

                        <p className="section-description">
                            {hasSearched
                                ? "Exploring movies."
                                : "Your next movie night starts here."}
                        </p>
                    </div>

                    {hasSearched && (
                        <button
                            className="back-to-popular"
                            onClick={showPopularMovies}
                            type="button"
                        >
                            ← Explore popular
                        </button>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        <span className="status-icon">!</span>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={
                                hasSearched
                                    ? handleSearch
                                    : showPopularMovies
                            }
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>

                        <p>
                            {hasSearched
                                ? "Searching the universe..."
                                : "Discovering your next favourite..."}
                        </p>

                        <span>Good movies are worth the wait.</span>
                    </div>
                ) : !error && movies.length > 0 ? (
                    <div className="movies-grid">
                        {movies.map((movie) => (
                            <MovieCard
                                movie={movie}
                                key={movie.id}
                                minRating={activeMinRating}
                            />
                        ))}
                    </div>
                ) : !error ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">✦</div>

                        <h3>No movies found in this orbit.</h3>

                        <p>
                            Try another title. Your next favourite might be
                            hiding behind a different search.
                        </p>

                        <button
                            type="button"
                            className="back-to-popular"
                            onClick={showPopularMovies}
                        >
                            Explore popular movies
                        </button>
                    </div>
                ) : null}

                {!loading && !error && movies.length > 0 && (
                    <div className="results-footer">
                        <span className="footer-line"></span>
                        <p>YOU'VE REACHED THE EDGE OF THIS DISCOVERY</p>
                        <span className="footer-line"></span>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <span className="footer-brand">
                    Cine<span>Match.</span>
                </span>

                <p>Made for the love of movies.</p>

                <span className="footer-star">✦</span>
            </footer>
        </div>
    );
}

export default Home;
