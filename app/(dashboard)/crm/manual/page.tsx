import type { Metadata } from "next";

import { CRMManual } from "@/components/crm/CRMManual";

export const metadata: Metadata = {
  title: "Manual do CRM",
  description: "Base de conhecimento e guia de utilização do painel.",
};

export const dynamic = "force-dynamic";

export default function CrmManualPage() {
  return <CRMManual />;
}
