"use client";

import { useEffect, useState } from "react";

export default function MovieSearch({ onSelect }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    const trimmed = q.trim();

    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(trimmed)}`
      );

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) search(query);
      else setResults([]);
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  function handleKeyDown(e: any) {
    if (e.key === "Enter") {
      search(query);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* INPUT */}
      <input
        className="border p-2 w-full"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {/* DROPDOWN */}
      {results.length > 0 && (
        <div
          className="
            absolute
            z-50
            w-full
            mt-1
            border
            bg-white
            shadow-lg
          "
        >
          {/* scroll container */}
          <div className="max-h-48 overflow-y-auto">
            {results.map((movie: any) => (
              <div
                key={movie.id}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => {
                  onSelect(movie);
                  setQuery(movie.title);
                  setResults([]);
                }}
              >
                {movie.title}
              </div>
            ))}
          </div>

          {/* footer hint */}
          {results.length > 5 && (
            <div className="text-xs text-gray-400 px-2 py-1 border-t">
              Scroll for more results
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-xs text-gray-400 mt-1">
          Searching...
        </div>
      )}
    </div>
  );
}