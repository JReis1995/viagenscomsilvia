import { revalidatePath } from "next/cache";

/**
 * A página inicial vive em `app/(marketing)/page.tsx`. Só `revalidatePath("/")`
 * pode não bater com as tags implícitas do App Router (route group), deixando
 * ISR a servir HTML/RSC antigo após guardar no CRM.
 */
export function revalidatePublicHome() {
  revalidatePath("/");
  revalidatePath("/(marketing)", "layout");
}
