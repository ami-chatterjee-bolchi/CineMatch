import { Routes, Route } from "react-router-dom";
import "./css/App.css";

import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";

import NavBar from "./components/NavBar";
import { MovieProvider } from "./context/MovieContext";

function App() {
  return (
    <MovieProvider>
      <NavBar />

      <main className="main-context">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </MovieProvider>
  );
}

export default App;