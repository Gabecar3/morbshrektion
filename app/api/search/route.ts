import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: "Missing TMDB_API_KEY",
      results: [],
    });
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}&include_adult=false`;

  const res = await fetch(url);
  const text = await res.text();

  // 🔥 DEBUG: show raw response from TMDb
  console.log("TMDb RAW RESPONSE:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({
      error: "Invalid JSON from TMDb",
      raw: text,
      results: [],
    });
  }

  return NextResponse.json({
    results: data.results || [],
    debug: {
      total_results: data.total_results,
      status_message: data.status_message,
    },
  });
}