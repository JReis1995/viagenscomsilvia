import { redirect } from "next/navigation";

import { ContaHeader } from "@/components/conta/conta-header";
import { FirstLoginConsentGate } from "@/components/conta/first-login-consent-gate";
import { clientNeedsConsentScreen } from "@/lib/auth/consent";
import { isConsultoraEmailAsync } from "@/lib/auth/consultora";
import { createClient } from "@/lib/supabase/server";

export default async function ContaAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/conta");
  }

  if (await isConsultoraEmailAsync(user.email, supabase)) {
    redirect("/crm");
  }

  const needsConsent = clientNeedsConsentScreen(user);
  const privacyPolicyUrl =
    process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL?.trim() || null;

  let initialMarketingOptIn = false;
  if (needsConsent && user.id) {
    const { data: promoPrefs } = await supabase
      .from("promo_alert_prefs")
      .select("opt_in")
      .eq("user_id", user.id)
      .maybeSingle();
    initialMarketingOptIn = promoPrefs?.opt_in === true;
  }

  const email = user.email?.trim() ?? "";

  return (
    <>
      <ContaHeader email={user.email} />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-6 py-8 md:py-10">
        {needsConsent && email ? (
          <FirstLoginConsentGate
            email={email}
            initialMarketingOptIn={initialMarketingOptIn}
            privacyPolicyUrl={privacyPolicyUrl}
          />
        ) : null}
        {needsConsent ? (
          <div className="min-h-[50vh]" aria-hidden />
        ) : (
          children
        )}
      </main>
    </>
  );
}
