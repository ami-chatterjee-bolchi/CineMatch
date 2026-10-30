import { NavLink, Link, useLocation } from "react-router-dom";
import { useMovieContext } from "../context/MovieContext";
import "../css/NavBar.css";
import logo from "/CM1.png";


function NavBar() {
    const { pathname } = useLocation();
    const { user, signOut, authLoading } = useMovieContext();

    if (pathname === "/login") return null;

    const initial = (
        user?.user_metadata?.name ||
        user?.email ||
        "?"
    ).trim().charAt(0).toUpperCase();

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="wrap">
                    <img className="logo" src={logo} alt="Cinematch logo" />
                    <Link to="/" className="navbar-brand">
                        Cine<span>Match</span>
                        <span className="brand-dot">.</span>
                    </Link>
                </div>

                <div className="navbar-links">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/favorites"
                        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                    >
                        Favorites
                    </NavLink>

                    <span className="nav-divider" aria-hidden="true" />

                    {authLoading ? null : user ? (
                        <>
                            <span
                                className="nav-avatar"
                                title={user.email || "Signed-in user"}
                            >
                                {initial}
                            </span>

                            <button
                                type="button"
                                className="nav-btn nav-btn-ghost"
                                onClick={async () => {
                                    const { error } = await signOut();

                                    if (error) {
                                        console.error("Could not sign out:", error.message);
                                    }
                                }}
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="nav-btn nav-btn-ghost nav-signin"
                            >
                                Sign In
                            </Link>

                            <Link
                                to="/login?mode=signup"
                                className="nav-btn nav-btn-primary"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavBar;