import { useEffect, useRef, useState } from "react";
import { getMovieDetails } from "../Services/movieApi";
import "../css/MovieCard.css";
import { useMovieContext } from "../context/MovieContext";
import MovieDetailsModal from "./MovieDetailsModal";

function MovieCard({ movie, minRating = 0 }) {
    const cardRef = useRef(null);
    const [details, setDetails] = useState(movie);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(movie);
    const [selectedDetails, setSelectedDetails] = useState(details);



    const { user, addToFavorites, removeFromFavorites, isFavorite } = useMovieContext();
    const movieId = movie?.id ?? movie?.tmdb_id;
    const favorite = isFavorite(movieId);

    useEffect(() => {
        const card = cardRef.current;
        if (!card || !movieId) return;

        let cancelled = false;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            setLoading(true);
            getMovieDetails(movieId)
                .then((data) => {
                    if (!cancelled && data) setDetails(data);
                })
                .catch((error) => console.error(`Could not load details for ${movie.title}:`, error))
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, { rootMargin: "200px" });

        observer.observe(card);
        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [movieId, movie.title]);

    function onFavouriteClick(e) {
        e.preventDefault();
        if (!user) {
            alert("Please sign in to add movies to your favourites!");
            return;
        }

        if (favorite) removeFromFavorites(movieId);
        else addToFavorites({ ...movie, ...details, id: movieId });
    }

    const rating = Number(details?.user_rating ?? details?.vote_average ?? 0);
    if (minRating > 0 && details && rating < minRating) return null;

    const ratingClass = rating >= 7.5 ? 'rating-high' : rating >= 6 ? 'rating-mid' : 'rating-low';

    const poster = details?.poster || movie.poster;
    const genres = details?.genre_names?.length
        ? details.genre_names
        : (details?.genres || []).map((genre) => typeof genre === "string" ? genre : genre.name);

    return (
        <>
            <article className="movie-card" ref={cardRef}>
                <div className="movie-poster">
                    <img
                        src={poster || "https://placehold.co/300x450?text=No+Poster"}
                        alt={`${movie.title || "Movie"} poster`}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://placehold.co/300x450?text=No+Poster";
                        }}
                    />
                    <div className="movie-overlay">
                        <span className="movie-overlay-label">
                            {favorite ? "IN YOUR COLLECTION" : "DISCOVER"}
                        </span>
                        <button
                            type="button"
                            className={`favorite-btn ${favorite ? "active" : ""}`}
                            onClick={onFavouriteClick}
                            aria-label={favorite ? `Remove ${movie.title} from favourites` : `Add ${movie.title} to favourites`}
                            aria-pressed={favorite}
                            title={favorite ? "Remove from favourites" : "Add to favourites"}
                        >
                            {favorite ? "♥" : "♡"}

                        </button>
                    </div>
                    {loading && <div className="poster-loading"><span className="poster-spinner"></span></div>}
                    <div className="poster-bottom-glow"></div>
                </div>

                <div className="movie-info">
                    <h3 title={movie.title}>{movie.title}</h3>
                    <div className="movie-meta">
                        <span className="movie-release-date">
                            {details?.release_date || movie.year || "Year unknown"}
                        </span>
                        {Number.isFinite(rating) && rating > 0 && (
                            <span className={`movie-rating ${ratingClass}`}><div className="star">★ </div>{rating.toFixed(1)}</span>
                        )}
                        {genres.length > 0 && (
                            <span className="movie-genre">🎭 {genres.join(", ")}</span>
                        )}
                    </div>
                    <button
                        type="button"
                        className="view-details-btn"
                        onClick={() => {
                            setSelectedMovie(movie);
                            setSelectedDetails(details);
                            setShowDetails(true);
                        }}
                    >
                        View details ↗
                    </button>
                </div>
            </article>
            {showDetails && (
                <MovieDetailsModal
                    movie={selectedMovie}
                    details={selectedDetails}
                    onClose={() => setShowDetails(false)}
                    onSelectMovie={async (nextMovie) => {
                        setSelectedMovie(nextMovie);
                        setSelectedDetails(nextMovie);

                        try {
                            const fullDetails = await getMovieDetails(nextMovie.id);
                            if (fullDetails) {
                                setSelectedDetails(fullDetails);
                            }
                        } catch (error) {
                            console.error("Could not load selected movie details:", error);
                        }
                    }}
                />
            )}
        </>
    );
}

export default MovieCard;
