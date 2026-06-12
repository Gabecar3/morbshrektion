"use client";

import { useEffect, useState } from "react";
import Triangle from "@/components/Triangle";
import MovieSearch from "@/components/MovieSearch";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  async function loadMovies() {
    const res = await fetch("/api/movies", {
      cache: "no-store",
    });

    const data = await res.json();
    setMovies(data || []);
  }

  useEffect(() => {
    loadMovies();

    const channel = supabase
      .channel("movies-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "movies",
        },
        () => loadMovies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleAdd(movie: any) {
    await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movie),
    });

    setSelectedMovie(null);
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col p-2">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold mb-2">
          MorbShrekTion
        </h1>

        {selectedMovie && (
          <div className="mb-2 text-sm">
            Selected: <b>{selectedMovie.title}</b>
          </div>
        )}

        <MovieSearch onSelect={setSelectedMovie} />
      </div>

      {/* Triangle */}
      <div className="flex-1 min-h-0">
        <Triangle
          movies={movies}
          selectedMovie={selectedMovie}
          onAdd={handleAdd}
        />
      </div>
    </main>
  );
}