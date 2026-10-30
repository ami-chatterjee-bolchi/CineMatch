import "../css/Favorites.css";
import { useMovieContext } from "../context/MovieContext";
import MovieCard from "../components/MovieCard";

function Favorites() {
    const { favorites } = useMovieContext();

    if (favorites.length > 0) {
        return (
            <div className="favorites-page">
                <section className="favorites-header">
                    <span className="favorites-eyebrow">
                        YOUR PERSONAL COLLECTION
                    </span>

                    <h1>
                        Your <span>Favorites</span>
                    </h1>

                    <p>
                        Every great story deserves a place in your collection.
                    </p>

                    <div className="favorites-count">
                        <span>{favorites.length}</span>
                        {favorites.length === 1
                            ? " movie in your collection"
                            : " movies in your collection"}
                    </div>
                </section>

                <div className="movies-grid">
                    {favorites.map((movie) => (
                        <MovieCard movie={movie} key={movie.id ?? movie.tmdb_id} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="favorites-page favorites-empty">
            <div className="empty-favorites-icon" aria-hidden="true">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                </svg>
            </div>

            <span className="favorites-eyebrow">
                YOUR COLLECTION AWAITS
            </span>

            <h1>
                Nothing here <span>yet.</span>
            </h1>

            <p>
                Every great movie collection starts somewhere.
                Explore the cinematic universe and save the stories
                you want to experience.
            </p>

            <a href="/" className="explore-movies-btn">
                <span>Explore Movies</span>
                <span aria-hidden="true">↗</span>
            </a>

            <div className="empty-favorites-decoration" aria-hidden="true">
                Cine<span>Match.</span>
            </div>
        </div>
    );
}

export default Favorites;