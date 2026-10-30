const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
// const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

function getCachedData(key) {
    try {
        const cached = sessionStorage.getItem(key);
        if (!cached) return null;
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            sessionStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function setCachedData(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
        // Caching is optional.
    }
}

async function tmdbFetch(path, cacheKey = path) {
    const cached = getCachedData(`${API_BASE_URL}:${cacheKey}`);
    if (cached !== null) return cached;

    const response = await fetch(`${API_BASE_URL}/api/tmdb${path}`);

    if (!response.ok) {
        const message = response.status === 401
            ? "TMDB rejected the server API key. Check the backend TMDB_API_KEY environment variable."
            : `TMDB request failed (${response.status}).`;
        throw new Error(message);
    }

    const data = await response.json();
    setCachedData(`${API_BASE_URL}:${cacheKey}`, data);
    return data;
}

export function getPosterUrl(path, size = "w500") {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

function normalizeMovie(movie) {
    const releaseDate = movie.release_date || "";
    return {
        ...movie,
        id: movie.id,
        title: movie.title || movie.original_title || "Untitled movie",
        poster: getPosterUrl(movie.poster_path),
        year: releaseDate ? releaseDate.slice(0, 4) : "Year unknown",
        release_date: releaseDate || "Release date unavailable",
        user_rating: Number(movie.vote_average || 0),
        genre_names: movie.genres?.map((genre) => genre.name) || [],
        overview: movie.overview || "",
        tmdb_id: movie.id,
    };
}

export async function getPopularMovies() {
    const movies = await getIndianFirst(
        "/discover/movie?include_adult=false&language=en-US&page=1&sort_by=popularity.desc&region=IN",
        "tmdb:popular:india"
    );

    return movies.slice(0, 150);
}

export async function searchMovies(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const data = await tmdbFetch(
        `/search/movie?query=${encodeURIComponent(query.trim())}&include_adult=false&language=en-US&page=1&region=IN`,
        `tmdb:search:${normalized}`
    );
    return (data.results || []).map(normalizeMovie);
}

export async function getMovieDetails(movieId) {
    if (!movieId) return null;
    const data = await tmdbFetch(
        `/movie/${encodeURIComponent(movieId)}?language=en-US`,
        `tmdb:details:${movieId}`
    );
    return normalizeMovie(data);
}

export async function getMovieSources(movieId) {
    if (!movieId) return [];
    const data = await tmdbFetch(
        `/movie/${encodeURIComponent(movieId)}/watch/providers`,
        `tmdb:providers:${movieId}`
    );

    const india = data.results?.IN;
    if (!india) return [];

    const providers = [
        ...(india.flatrate || []),
        ...(india.rent || []),
        ...(india.buy || []),
        ...(india.free || []),
        ...(india.ads || []),
    ];

    const seen = new Set();
    return providers.filter((provider) => {
        if (seen.has(provider.provider_id)) return false;
        seen.add(provider.provider_id);
        return true;
    }).map((provider) => ({
        name: provider.provider_name,
        web_url: india.link || `https://www.themoviedb.org/movie/${movieId}/watch`,
        region: "IN",
        logo: getPosterUrl(provider.logo_path, "w92"),
        provider_id: provider.provider_id,
    }));
}

const GENRES = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "mystery": 9648,
    "romance": 10749,
    "science fiction": 878,
    "sci-fi": 878,
    "thriller": 53,
    "war": 10752,
    "western": 37,
};


const PLATFORM_ALIASES = {
    netflix: ["netflix"],
    prime: ["amazon prime video", "prime video", "amazon video"],
    jiohotstar: ["jiohotstar", "hotstar", "disney plus hotstar"],
    zee5: ["zee5"],
    sonyliv: ["sonyliv", "sony liv"],
    appletv: ["apple tv+", "apple tv plus", "apple tv"],
    youtube: ["youtube movies", "youtube"],
};

async function getIndianProviderId(platformKey) {
    if (!platformKey) return null;
    const aliases = PLATFORM_ALIASES[platformKey];
    if (!aliases) throw new Error("Unsupported streaming platform.");

    const data = await tmdbFetch(
        "/watch/providers/movie?watch_region=IN&language=en-US",
        "tmdb:watch-providers:IN"
    );
    const providers = data.results || [];
    const normalizedName = (name) => name.toLowerCase().replace(/[^a-z0-9+ ]/g, "").replace(/\s+/g, " ").trim();
    const match = providers.find((provider) =>
        aliases.some((alias) => normalizedName(provider.provider_name) === normalizedName(alias))
    ) || providers.find((provider) =>
        aliases.some((alias) => normalizedName(provider.provider_name).includes(normalizedName(alias)))
    );

    if (!match) {
        throw new Error("TMDB doesn't currently list this platform for India.");
    }
    return match.provider_id;
}

async function mapWithConcurrency(items, limit, mapper) {
    const output = new Array(items.length);
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            output[index] = await mapper(items[index]);
        }
    });
    await Promise.all(workers);
    return output;
}

export async function getMoviesByGenre(genreName = "", minRating = 0, filters = {}) {
    const normalizedGenre = (genreName || "").trim().toLowerCase();
    const genreId = normalizedGenre ? GENRES[normalizedGenre] : null;

    if (normalizedGenre && !genreId) {
        throw new Error(`Genre "${genreName}" is not supported by TMDB.`);
    }

    const params = new URLSearchParams({
        include_adult: "false",
        language: "en-US",
        page: "1",
        sort_by: "popularity.desc",
        region: "IN",
    });

    // Genre is optional.
    if (genreId) {
        params.set("with_genres", String(genreId));
    }

    // Rating is optional.
    if (minRating > 0) {
        params.set("vote_average.gte", String(minRating));
        params.set("vote_count.gte", "50");
    }

    if (filters.language) {
        params.set("with_original_language", filters.language);
    }

    const runtimeRanges = {
        under90: [0, 89],
        "90to120": [90, 120],
        "120to150": [121, 150],
        over150: [151, 400],
    };

    const runtimeRange = runtimeRanges[filters.runtime];

    if (runtimeRange) {
        params.set("with_runtime.gte", String(runtimeRange[0]));
        params.set("with_runtime.lte", String(runtimeRange[1]));
    }

    let providerId = null;

    if (filters.platform) {
        providerId = await getIndianProviderId(filters.platform);
        params.set("watch_region", "IN");
        params.set("with_watch_providers", String(providerId));
        params.set("with_watch_monetization_types", "flatrate");
    }

    const filterKey = [
        genreId || "any-genre",
        minRating,
        filters.runtime || "any-runtime",
        providerId || "any-platform",
        filters.language || "any-language",
    ].join(":");

    let movies = await getIndianFirst(
        `/discover/movie?${params.toString()}`,
        `tmdb:discover:${filterKey}`
    );

    // Verify actual runtime when a duration filter is selected.
    if (runtimeRange) {
        const details = await mapWithConcurrency(movies, 5, async (movie) => {
            try {
                return await getMovieDetails(movie.id);
            } catch (error) {
                console.warn(`Could not verify runtime for ${movie.title}:`, error);
                return null;
            }
        });

        movies = movies.filter((movie, index) => {
            const runtime = Number(details[index]?.runtime || 0);
            return runtime >= runtimeRange[0] && runtime <= runtimeRange[1];
        });
    }

    return movies.slice(0, 100);
}

async function getIndianFirst(path, cacheKey) {
    const fetchPages = async (indianOnly) => {
        const results = [];

        for (let page = 1; page <= 5; page++) {
            const url = new URL(path, "https://placeholder.local");
            url.searchParams.set("page", String(page));

            if (indianOnly) {
                url.searchParams.set("with_origin_country", "IN");
            }

            const data = await tmdbFetch(
                url.pathname + url.search,
                `${cacheKey}:${indianOnly ? "indian" : "global"}:page:${page}`
            );

            results.push(...(data.results || []));

            if (page >= (data.total_pages || 1)) break;
        }

        return results;
    };

    const [indianMovies, globalMovies] = await Promise.all([
        fetchPages(true),
        fetchPages(false)
    ]);

    const seen = new Set();

    return [...indianMovies, ...globalMovies]
        .filter(movie => {
            if (seen.has(movie.id)) return false;
            seen.add(movie.id);
            return true;
        })
        .map(normalizeMovie);
}


export async function getSimilarMovies(movieId) {
    if (!movieId) return [];

    // Get TMDB's recommendations for the selected movie.
    const similarData = await tmdbFetch(
        `/movie/${encodeURIComponent(movieId)}/similar?language=en-US&page=1`,
        `tmdb:similar:source:${movieId}`
    );

    const similarMovies = similarData.results || [];

    if (similarMovies.length === 0) return [];

    // Fetch each candidate's details to identify its origin country.
    const details = await mapWithConcurrency(
        similarMovies,
        5,
        async (movie) => {
            try {
                return await tmdbFetch(
                    `/movie/${movie.id}?language=en-US`,
                    `tmdb:details:${movie.id}`
                );
            } catch (error) {
                console.warn(`Could not check origin for ${movie.title}:`, error);
                return null;
            }
        }
    );

    const indianMovies = [];
    const internationalMovies = [];

    similarMovies.forEach((movie, index) => {
        if (Number(movie.id) === Number(movieId)) return;

        const originCountries = details[index]?.origin_country || [];

        if (originCountries.includes("IN")) {
            indianMovies.push(movie);
        } else {
            internationalMovies.push(movie);
        }
    });

    // Indian movies first, followed by other similar movies.
    const orderedMovies = [...indianMovies, ...internationalMovies];

    return orderedMovies.map(normalizeMovie).slice(0, 100);
}

