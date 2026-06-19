import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

type EventType = Database["public"]["Enums"]["event_type"];

export type LogTaskEventDetails = {
  old?: string | null;
  new?: string | null;
  note?: string | null;
};

// Point d'entrée UNIQUE d'écriture dans task_history (frontière d'historique).
// Toute Server Action qui modifie une tâche DOIT appeler ce helper.
export async function logTaskEvent(
  taskId: string,
  eventType: EventType,
  { old = null, new: newValue = null, note = null }: LogTaskEventDetails = {},
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("logTaskEvent : utilisateur non authentifié");
  }

  const { error } = await supabase.from("task_history").insert({
    task_id: taskId,
    author_id: user.id,
    event_type: eventType,
    old_value: old,
    new_value: newValue,
    note,
  });

  if (error) throw error;
}
