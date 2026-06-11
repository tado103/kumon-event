import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Event } from "@/lib/types";
import { EventEditor } from "./event-editor";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!data) notFound();

  return <EventEditor event={data as Event} />;
}
