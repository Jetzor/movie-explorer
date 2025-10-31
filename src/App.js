import React, { useEffect, useState, useMemo } from "react";
import "./App.css";

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function App() {
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!API_KEY) {
            setError("Missing TMDB API key. Add REACT_APP_TMDB_API_KEY in .env.local");
            return;
        }

        const controller = new AbortController();
        async function fetchMovies() {
            setIsLoading(true);
            setError("");

            const isSearching = searchTerm.trim().length > 0;

            const baseUrl = isSearching
                ? "https://api.themoviedb.org/3/search/movie"
                : "https://api.themoviedb.org/3/discover/movie";

            const url = new URL(baseUrl);
            url.searchParams.set("api_key", API_KEY);
            url.searchParams.set("language", "en-US");
            url.searchParams.set("page", page);

            if (isSearching) {
                url.searchParams.set("query", searchTerm);
            } else {
                url.searchParams.set("sort_by", "popularity.desc");
            }

            try {
                const res = await fetch(url.toString(), { signal: controller.signal });
                if (!res.ok) {
                    throw new Error("Failed to fetch movies");
                }
                const data = await res.json();


                setMovies(data.results || []);
                setTotalPages(data.total_pages || 1);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchMovies();

        return () => controller.abort();
    }, [page, searchTerm]);

    const sortedMovies = useMemo(() => {
        let list = [...movies];
        if (sortBy === "date") {
            list.sort((a, b) => {
                const da = a.release_date ? new Date(a.release_date) : 0;
                const db = b.release_date ? new Date(b.release_date) : 0;
                return db - da;
            });
        } else if (sortBy === "rating") {
            list.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        }
        return list;
    }, [movies, sortBy]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const goPrev = () => {
        setPage((p) => Math.max(1, p - 1));
    };

    const goNext = () => {
        setPage((p) => Math.min(totalPages, p + 1));
    };

    return (
        <div className="app">
            <header className="top-bar">
                <h1>Movie Explorer</h1>
            </header>

            <section className="controls">
                <input
                    type="text"
                    placeholder="Search for a movie..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />

                <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="">Sort By</option>
                    <option value="date">Release Date (Newest)</option>
                    <option value="rating">Average Rating (High ? Low)</option>
                </select>
            </section>

            <main className="movie-grid">
                {isLoading && <p className="status">Loading movies…</p>}
                {error && <p className="status error">{error}</p>}

                {!isLoading && !error && sortedMovies.length === 0 && (
                    <p className="status">No movies found.</p>
                )}

                {!isLoading &&
                    !error &&
                    sortedMovies.map((movie) => (
                        <article key={movie.id} className="movie-card">
                            <div className="poster-wrapper">
                                {movie.poster_path ? (
                                    <img
                                        src={`${IMAGE_BASE}${movie.poster_path}`}
                                        alt={movie.title}
                                        className="movie-poster"
                                    />
                                ) : (
                                    <div className="poster-placeholder">No Image</div>
                                )}
                            </div>
                            <h2 className="movie-title">{movie.title}</h2>
                            <p className="movie-meta">
                                <strong>Release Date:</strong>{" "}
                                {movie.release_date ? movie.release_date : "N/A"}
                            </p>
                            <p className="movie-meta">
                                <strong>Rating:</strong>{" "}
                                {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                            </p>
                        </article>
                    ))}
            </main>


            <footer className="pagination-bar">
                <button onClick={goPrev} disabled={page === 1}>
                    Previous
                </button>
                <span>
                    Page {page} of {totalPages > 500 ? 500 : totalPages}
                </span>
                <button
                    onClick={goNext}
                    disabled={page === totalPages || page === 500}
                >
                    Next
                </button>
            </footer>
        </div>
    );
}

export default App;