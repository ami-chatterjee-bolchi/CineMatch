import {
    createContext,
    useState,
    useContext,
    useEffect,
    useCallback,
} from "react";

import { supabase } from "../Services/supabase";

const MovieContext = createContext();

const getMovieId = (movie) =>
    movie?._id ?? movie?._tmdb_id ?? movie?.id ?? null;

// eslint-disable-next-line react-refresh/only-export-components
export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [authLoading, setAuthLoading] = useState(true);
    const [favoritesLoading, setFavoritesLoading] = useState(false);

    // Listen for login, logout, and session changes.
    useEffect(() => {
        let mounted = true;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            // console.log("Supabase auth event:", event);
            // console.log("Supabase session user:", session?.user ?? null);

            if (mounted) {
                setUser(session?.user ?? null);
            }
        });

        const initializeAuth = async () => {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (!mounted) return;

            if (error) {
                console.error("Could not retrieve session:", error.message);
            }

            setUser(session?.user ?? null);
            setAuthLoading(false);
        };

        initializeAuth();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Load the signed-in user's favourites from Supabase.
    const loadFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([]);
            alert("To add favourite, Sign in first.");
            return;
        }

        setFavoritesLoading(true);

        try {
            const { data, error } = await supabase
                .from("favourites")
                .select("movie_id, movie_data")
                .eq("user_id", user.id);

            if (error) throw error;

            setFavorites(
                (data ?? []).map((item) => item.movie_data)
            );
        } catch (error) {
            console.error("Could not load favourites:", error.message);
        } finally {
            setFavoritesLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;

        let cancelled = false;

        const fetchFavorites = async () => {
            if (!user) {
                setFavorites([]);
                return;
            }

            setFavoritesLoading(true);

            try {
                const { data, error } = await supabase
                    .from("favourites")
                    .select("movie_id, movie_data")
                    .eq("user_id", user.id);

                if (error) throw error;

                if (!cancelled) {
                    setFavorites(
                        (data ?? []).map((item) => item.movie_data)
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Could not load favourites:",
                        error.message
                    );
                }
            } finally {
                if (!cancelled) {
                    setFavoritesLoading(false);
                }
            }
        };

        fetchFavorites();

        return () => {
            cancelled = true;
        };
    }, [authLoading, user]);

    // Add a movie to the signed-in user's collection.
    const addToFavorites = async (movie) => {
        if (!user) {
            return {
                success: false,
                reason: "not_signed_in",
            };
        }

        const movieId = getMovieId(movie);

        if (movieId == null) {
            return {
                success: false,
                reason: "missing_movie_id",
            };
        }

        const normalizedId = String(movieId);

        if (favorites.some(
            (item) => String(getMovieId(item)) === normalizedId
        )) {
            return { success: true };
        }

        const { error } = await supabase
            .from("favourites")
            .upsert(
                {
                    user_id: user.id,
                    movie_id: normalizedId,
                    movie_data: movie,
                },
                {
                    onConflict: "user_id,movie_id",
                    ignoreDuplicates: true,
                }
            );

        if (error) {
            console.error("Could not add favourite:", error.message);

            return {
                success: false,
                reason: "database_error",
            };
        }

        setFavorites((previous) => {
            if (
                previous.some(
                    (item) =>
                        String(getMovieId(item)) === normalizedId
                )
            ) {
                return previous;
            }

            return [...previous, movie];
        });

        return { success: true };
    };

    // Remove a movie from the signed-in user's collection.
    const removeFromFavorites = async (movieId) => {
        if (!user || movieId == null) return;

        const normalizedId = String(movieId);

        const { error } = await supabase
            .from("favourites")
            .delete()
            .eq("user_id", user.id)
            .eq("movie_id", normalizedId);

        if (error) {
            console.error("Could not remove favourite:", error.message);
            return;
        }

        setFavorites((previous) =>
            previous.filter(
                (movie) =>
                    String(getMovieId(movie)) !== normalizedId
            )
        );
    };

    const isFavorite = (movieId) =>
        movieId != null &&
        favorites.some(
            (movie) =>
                String(getMovieId(movie)) === String(movieId)
        );

    const signUp = async (email, password) => {
        return await supabase.auth.signUp({
            email,
            password,
        });
    };

    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Could not sign out:", error.message);
        }

        return { error };
    };

    return (
        <MovieContext.Provider
            value={{
                user,
                favorites,
                authLoading,
                favoritesLoading,
                addToFavorites,
                removeFromFavorites,
                isFavorite,
                signUp,
                signIn,
                signOut,
                loadFavorites,
            }}
        >
            {children}
        </MovieContext.Provider>
    );
};