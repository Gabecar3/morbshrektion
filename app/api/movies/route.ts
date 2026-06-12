import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase.from("movies").select("*");
  return Response.json(data || []);
}