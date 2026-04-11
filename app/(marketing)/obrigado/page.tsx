import type { Metadata } from "next";

import { ThankYouBoardingPass } from "@/components/marketing/thank-you-boarding-pass";
import { fetchSiteContent } from "@/lib/site/fetch-site-content";

export const metadata: Metadata = {
  title: "Pedido recebido",
  description: "A tua viagem já começou a ser desenhada.",
};

export const dynamic = "force-dynamic";

export default async function ObrigadoPage() {
  const site = await fetchSiteContent();
  const whatsappUrl = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_URL?.trim() || null;
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() || null;

  return (
    <main className="min-h-[min(100dvh,900px)] bg-gradient-to-b from-sand to-ocean-50/30">
      <ThankYouBoardingPass
        copy={site.quizSuccess}
        registerIncentive={site.registerIncentive}
        whatsappUrl={whatsappUrl}
        calendlyUrl={calendlyUrl}
      />
    </main>
  );
}
