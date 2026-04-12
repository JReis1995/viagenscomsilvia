import { redirect } from "next/navigation";

/** Página descontinuada — o manual no CRM cobre o dia-a-dia. */
export default function CrmPrimeirosPassosRedirectPage() {
  redirect("/crm/manual");
}
