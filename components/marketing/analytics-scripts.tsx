import Script from "next/script";

/**
 * Carrega analytics só quando as variáveis públicas estão definidas.
 * Plausible: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` = domínio registado (ex. viagenscomsilvia.pt)
 * GA4: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = G-XXXXXXXXXX
 */
export function AnalyticsScripts() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <>
      {plausibleDomain ? (
        <Script
          defer
          src="https://plausible.io/js/script.js"
          data-domain={plausibleDomain}
          strategy="afterInteractive"
        />
      ) : null}
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaId)}, { send_page_view: true });
`,
            }}
          />
        </>
      ) : null}
    </>
  );
}
