"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { clientNoteSchema } from "@/lib/validations/client-note";

export type AddNoteResult = { ok: true } | { ok: false; error: string };

export async function addLeadClientNote(
  _prev: AddNoteResult | null,
  formData: FormData,
): Promise<AddNoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entra de novo." };
  }

  const parsed = clientNoteSchema.safeParse({
    leadId: formData.get("leadId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().fieldErrors.message?.[0] ?? "Dados inválidos.",
    };
  }

  const { error } = await supabase.from("lead_client_updates").insert({
    lead_id: parsed.data.leadId,
    user_id: user.id,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[conta] insert lead_client_updates:", error.message);
    return {
      ok: false,
      error:
        "Não foi possível guardar. Confirma que o pedido é teu e que a base de dados já tem a tabela de notas (SQL Sprint 1).",
    };
  }

  revalidatePath("/conta");
  revalidatePath("/crm");
  return { ok: true };
}
