import { useEffect, useRef, useState } from "react";
import { getMovieSources, getSimilarMovies } from "../Services/movieApi";
import "../css/MovieDetailsModal.css";

const NO_POSTER = "https://placehold.co/300x450?text=No+Poster";

const getPlatformUrl = (platformName, movieTitle) => {
    const title = encodeURIComponent(movieTitle);
    const platform = platformName?.toLowerCase().trim();

    if (!platform || !movieTitle) return null;

    if (platform.includes("netflix")) return `https://www.netflix.com/search?q=${title}`;
    if (platform.includes("prime video") || platform.includes("amazon video"))
        return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${title}`;
    if (platform.includes("hotstar")) return `https://www.hotstar.com/in/search?q=${title}`;
    if (platform.includes("zee5")) return `https://www.zee5.com/search?q=${title}`;
    if (platform.includes("sony liv")) return `https://www.sonyliv.com/search/${title}`;
    if (platform.includes("apple tv")) return `https://tv.apple.com/in/search?term=${title}`;
    if (platform.includes("youtube")) return `https://www.youtube.com/results?search_query=${title}`;

    return null;
};

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const ratingTone = (rating) => (rating >= 7.5 ? "high" : rating >= 6 ? "mid" : "low");


function MovieDetailsModal({ movie, details, onClose, onSelectMovie }) {
    const [sources, setSources] = useState([]);
    const [sourcesLoading, setSourcesLoading] = useState(true);
    const [sourcesError, setSourcesError] = useState(false);
    const [similarMovies, setSimilarMovies] = useState([]);
    const [similarLoading, setSimilarLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const movieId = movie?.id ?? movie?.tmdb_id;

    useEffect(() => {
        let cancelled = false;
        async function loadSources() {
            setSourcesLoading(true);
            setSourcesError(false);
            try {
                const result = await getMovieSources(movieId);
                if (!cancelled) setSources(Array.isArray(result) ? result : []);
            } catch (error) {
                console.error("Could not load TMDB watch providers:", error);
                if (!cancelled) {
                    setSourcesError(true);
                    setSources([]);
                }
            } finally {
                if (!cancelled) setSourcesLoading(false);
            }
        }
        loadSources();
        return () => { cancelled = true; };
    }, [movieId]);

    useEffect(() => {
        if (!movie?.id) return;
        let cancelled = false;

        async function loadSimilarMovies() {
            setSimilarLoading(true);
            setSimilarMovies([]);
            try {
                const results = await getSimilarMovies(movie.id);
                if (!cancelled) setSimilarMovies((results || []).slice(0, 8));
            } catch (error) {
                console.error("Failed to load similar movies:", error);
                if (!cancelled) setSimilarMovies([]);
            } finally {
                if (!cancelled) setSimilarLoading(false);
            }
        }

        loadSimilarMovies();
        return () => { cancelled = true; };
    }, [movie?.id]);

    // When another movie is opened inside the same modal, jump back to the top
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, [movieId]);

    const title = movie?.title || details?.title || "Movie";
    const poster = details?.poster || movie?.poster || NO_POSTER;

    const genreList = Array.isArray(details?.genre_names) && details.genre_names.length
        ? details.genre_names
        : Array.isArray(details?.genres)
            ? details.genres
                .map((genre) => (typeof genre === "string" ? genre : genre?.name))
                .filter(Boolean)
            : [];

    const rating = Number(details?.user_rating ?? details?.vote_average ?? 0);
    const releaseDate =
        formatDate(details?.release_date || movie?.release_date) || movie?.year || "Year unknown";
    const runtime = details?.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="movie-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`${title} details`}
            >
                {/* Ambient blurred poster glow */}
                <div
                    className="modal-ambient"
                    style={{ backgroundImage: `url("${poster}")` }}
                    aria-hidden="true"
                />

                <button type="button" className="modal-close" onClick={onClose} aria-label="Close movie details">
                    ×
                </button>

                <div className="modal-scroll" ref={scrollRef}>
                    {/* ---------- Top: poster + info ---------- */}
                    <div className="modal-main">
                        <img
                            className="modal-poster"
                            src={poster}
                            alt={`${title} poster`}
                            onError={(e) => { e.currentTarget.src = NO_POSTER; }}
                        />

                        <div className="modal-content">
                            <span className="modal-label">CINEMATCH DISCOVERY</span>
                            <h2>{title}</h2>

                            <div className="modal-meta">
                                {rating > 0 && (
                                    <span className={`modal-rating tone-${ratingTone(rating)}`}>
                                        ★ {rating.toFixed(1)}
                                        <small>/10</small>
                                    </span>
                                )}
                                <span>{releaseDate}</span>
                                {runtime && <span>{runtime}</span>}
                            </div>

                            {genreList.length > 0 && (
                                <div className="modal-genres">
                                    {genreList.map((genre) => (
                                        <span className="genre-chip" key={genre}>{genre}</span>
                                    ))}
                                </div>
                            )}

                            <h3>Overview</h3>
                            <p className="modal-overview">
                                {details
                                    ? details.overview || "No overview is available for this movie."
                                    : "Loading movie details..."}
                            </p>

                            <h3>Where to Watch</h3>
                            <div className="streaming-platforms">
                                {sourcesLoading ? (
                                    <p className="modal-note">Finding streaming platforms...</p>
                                ) : sourcesError ? (
                                    <p className="modal-note">Could not load streaming information. Please try again later.</p>
                                ) : sources.length > 0 ? (
                                    <>
                                        {sources.map((source) => {
                                            const url = getPlatformUrl(source.name, title);
                                            const content = (
                                                <>
                                                    {source.logo && <img src={source.logo} alt="" width="22" height="22" />}
                                                    <span>{source.name || "Streaming service"}</span>
                                                    {url && <em aria-hidden="true">↗</em>}
                                                </>
                                            );

                                            return url ? (
                                                <a
                                                    key={source.provider_id || source.name}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="streaming-platform"
                                                >
                                                    {content}
                                                </a>
                                            ) : (
                                                <span
                                                    key={source.provider_id || source.name}
                                                    className="streaming-platform is-static"
                                                >
                                                    {content}
                                                </span>
                                            );
                                        })}
                                        <p className="provider-attribution">
                                            Streaming availability provided by TMDB; availability may change.
                                        </p>
                                    </>
                                ) : (
                                    <p className="modal-note">No streaming information is available for this movie in India.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* similar movies */}

                    <section className="similar-movies-section">
                        <div className="similar-header">
                            <div>
                                <span className="similar-eyebrow">MORE LIKE THIS</span>
                                <h2>You Might Also Like</h2>
                            </div>
                        </div>

                        {similarLoading ? (
                            <div className="similar-movies-row" aria-busy="true">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div className="similar-skeleton" key={i}>
                                        <div className="skeleton-poster" />
                                        <div className="skeleton-line" />
                                        <div className="skeleton-line short" />
                                    </div>
                                ))}
                            </div>
                        ) : similarMovies.length > 0 ? (
                            <div className="similar-movies-row">
                                {similarMovies.map((similarMovie) => {
                                    const similarRating = Number(
                                        similarMovie.rating ?? similarMovie.vote_average ?? 0
                                    );

                                    return (
                                        <button
                                            type="button"
                                            className="similar-movie-card"
                                            key={similarMovie.id}
                                            onClick={() => onSelectMovie?.(similarMovie)}
                                            aria-label={`View ${similarMovie.title}`}
                                        >
                                            <div className="similar-poster">
                                                <img
                                                    src={similarMovie.poster || NO_POSTER}
                                                    alt=""
                                                    loading="lazy"
                                                    onError={(e) => { e.currentTarget.src = NO_POSTER; }}
                                                />
                                                {similarRating > 0 && (
                                                    <span className={`similar-rating tone-${ratingTone(similarRating)}`}>
                                                        ★ {similarRating.toFixed(1)}
                                                    </span>
                                                )}
                                                <span className="similar-hover">View details</span>
                                            </div>
                                            <h3>{similarMovie.title}</h3>
                                            {similarMovie.year && <p>{similarMovie.year}</p>}
                                        </button>
                                    );


                                })}
                            </div>
                        ) : (
                            <p className="modal-note">No similar movies found.</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default MovieDetailsModal;