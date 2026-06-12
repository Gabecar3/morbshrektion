import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();

  const { title, tmdb_id, year, poster, shrek, inception, morbius } = body;

  const { data, error } = await supabase
    .from("movies")
    .insert([
      {
        title,
        tmdb_id,
        year,
        poster_url: poster,
        shrek,
        inception,
        morbius,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data?.[0]);
}