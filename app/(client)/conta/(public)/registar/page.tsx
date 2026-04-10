import { redirect } from "next/navigation";

/** URL legada — redireciona para o login unificado. */
export default function LegacyContaRegistarPage() {
  redirect("/login?registar=1&next=/conta");
}
