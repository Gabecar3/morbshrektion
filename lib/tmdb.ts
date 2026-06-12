const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY!;
const BASE = "https://api.themoviedb.org/3";

export async function searchMovies(query: string) {
  const res = await fetch(
    `${BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );

  const data = await res.json();

  return data.results.map((m: any) => ({
    tmdb_id: m.id,
    title: m.title,
    year: m.release_date?.slice(0, 4),
    poster: m.poster_path
      ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
      : null,
  }));
}