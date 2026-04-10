import { redirect } from "next/navigation";

/** URL legada — redireciona para o login unificado. */
export default function LegacyContaEntrarPage() {
  redirect("/login?next=/conta");
}
