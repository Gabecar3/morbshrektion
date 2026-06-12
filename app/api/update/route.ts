import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { id, shrek, inception, morbius } = await req.json();

  const { error } = await supabase
    .from("movies")
    .update({
      shrek,
      inception,
      morbius,
    })
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}