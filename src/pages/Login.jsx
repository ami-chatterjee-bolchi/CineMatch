import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/Login.css";
import { useMovieContext } from "../context/MovieContext";
import { supabase } from "../Services/supabase";

const LOGO_SRC = "/CM1.png";

const features = [
    "Find movies by mood, rating and runtime",
    "See where it streams in India",
    "Save favourites to watch later",
];

function EyeIcon({ off }) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {off ? (
                <>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.1A9.8 9.8 0 0112 6c5 0 8.5 4.2 9.5 6-.4.8-1.3 2-2.6 3.2M6.3 7.7C4.3 9 3 10.8 2.5 12c1 1.8 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.8" />
                    <path d="M9.9 10a3 3 0 004.1 4.1" />
                </>
            ) : (
                <>
                    <path d="M2.5 12C3.5 10.2 7 6 12 6s8.5 4.2 9.5 6c-1 1.8-4.5 6-9.5 6S3.5 13.8 2.5 12z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            )}
        </svg>
    );
}

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M4 7.5l8 5.5 8-5.5" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
            <path d="M8 10.5V8a4 4 0 018 0v2.5" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
            <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 019.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 000 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
    );
}

const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin,
        },
    });

    if (error) {
        console.error("Google sign-in error:", error.message);
        // setError(error.message);
    }
};


function Login({
    showGoogle = true,
    homeHref = "/",
}) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const { signIn, signUp, user, authLoading } = useMovieContext();

    const [mode, setMode] = useState(
        searchParams.get("mode") === "signup" ? "signup" : "signin"
    );

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isSignIn = mode === "signin";

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode(
            searchParams.get("mode") === "signup" ? "signup" : "signin"
        );
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && user) {
            navigate("/", { replace: true });
        }
    }, [user, authLoading, navigate]);

    const switchMode = () => {
        const nextMode = isSignIn ? "signup" : "signin";

        setMode(nextMode);
        setSearchParams(
            nextMode === "signup" ? { mode: "signup" } : {},
            { replace: true }
        );

        setError("");
        setPassword("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanEmail = email.trim();

        if (!isSignIn && password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        console.log("Current mode:", mode);
        console.log("Calling function:", isSignIn ? "signIn" : "signUp");

        try {
            setLoading(true);

            const { error: authError } = isSignIn
                ? await signIn(cleanEmail, password)
                : await signUp(cleanEmail, password);

            if (authError) {
                throw authError;
            }

            if (isSignIn) {
                navigate("/", { replace: true });
            } else {
                setError("");
                setPassword("");

                // With email confirmation disabled, Supabase should
                // create an authenticated session immediately.
                // The auth context will redirect when the session arrives.
                setError("Account created successfully! You can now continue.");
            }
        } catch (err) {
            setError(
                err?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <a className="auth-back" href={homeHref}>
                <span aria-hidden="true">←</span> Back to homepage
            </a>

            <div className="auth-card">
                {/* ---------- Brand panel ---------- */}
                <aside className="auth-brand">
                    <svg className="auth-rings" viewBox="0 0 400 400" fill="none" aria-hidden="true">
                        <circle cx="200" cy="200" r="190" stroke="rgba(150,165,255,.22)" />
                        <circle cx="200" cy="200" r="145" stroke="rgba(150,165,255,.12)" />
                        <circle cx="200" cy="200" r="95" stroke="rgba(150,165,255,.10)" />
                        <path d="M178 160v80l68-40-68-40z" fill="rgba(110,140,255,.08)" stroke="rgba(150,170,255,.3)" strokeLinejoin="round" />
                    </svg>

                    <div className="auth-logo">
                        <img src={LOGO_SRC} alt="" />
                        <span className="auth-wordmark">
                            Cine<b>Match</b><i>.</i>
                        </span>
                    </div>

                    <div className="auth-brand-body">
                        <span className="auth-eyebrow">YOUR PERSONAL MOVIE UNIVERSE</span>
                        <h2>
                            Discover your next <span>favourite movie.</span>
                        </h2>
                        <ul className="auth-features">
                            {features.map((item) => (
                                <li key={item}>
                                    <span className="auth-dot" aria-hidden="true" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* ---------- Form panel ---------- */}
                <section className="auth-panel">
                    <div className="auth-panel-head">
                        <h1>{isSignIn ? "Welcome back" : "Create your account"}</h1>
                        <p>
                            {isSignIn
                                ? "Sign in to pick up where you left off."
                                : "Join CineMatch to save favourites and get tailored picks."}
                        </p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit} noValidate={false}>
                        <div className="auth-field">
                            <label htmlFor="auth-email">Email</label>
                            <div className="auth-input">
                                <MailIcon />
                                <input
                                    id="auth-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <div className="auth-label-row">
                                <label htmlFor="auth-password">Password</label>
                                {/* {isSignIn && (
                                    <button type="button" className="auth-link-btn">
                                        Forgot password?
                                    </button>
                                )} */}
                            </div>
                            <div className="auth-input">
                                <LockIcon />
                                <input
                                    id="auth-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isSignIn ? "Enter your password" : "At least 8 characters"}
                                    autoComplete={isSignIn ? "current-password" : "new-password"}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <EyeIcon off={showPassword} />
                                </button>
                            </div>
                        </div>

                        <p className="auth-error" role="alert" aria-live="polite">
                            {error}
                        </p>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading
                                ? isSignIn ? "Signing in..." : "Creating account..."
                                : isSignIn ? "Sign In" : "Create Account"}
                        </button>
                    </form>

                    {showGoogle && (
                        <>
                            <div className="auth-divider"><span>or</span></div>
                            <button
                                type="button"
                                className="auth-google"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <GoogleIcon />
                                Continue with Google
                            </button>
                        </>
                    )}

                    <p className="auth-switch">
                        {isSignIn ? "New to CineMatch?" : "Already have an account?"}{" "}
                        <button type="button" className="auth-link-btn strong" onClick={switchMode}>
                            {isSignIn ? "Create an account" : "Sign in"}
                        </button>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Login;