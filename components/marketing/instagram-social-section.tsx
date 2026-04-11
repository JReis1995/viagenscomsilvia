import type { SiteContent } from "@/lib/site/site-content";

type Props = {
  copy: SiteContent["socialFeed"];
};

export function InstagramSocialSection({ copy }: Props) {
  const urls = copy.postUrls
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const hasEmbed = copy.embedHtml.trim().length > 0;
  if (!hasEmbed && urls.length === 0) return null;

  return (
    <section
      id="instagram-feed"
      className="border-t border-ocean-100/80 bg-white py-16 md:py-20"
    >
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean-500">
          {copy.eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-normal text-ocean-900 md:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ocean-600 md:text-base">
          {copy.subtitle}
        </p>

        {hasEmbed ? (
          <div
            className="mt-10 [&_iframe]:max-h-[480px] [&_iframe]:min-h-[320px] [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: copy.embedHtml }}
          />
        ) : null}

        {!hasEmbed && urls.length > 0 ? (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {urls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[52px] items-center justify-center rounded-2xl border border-ocean-200 bg-sand/40 px-4 py-3 text-center text-sm font-semibold text-ocean-800 transition hover:border-ocean-300 hover:bg-sand/70"
                >
                  Ver no Instagram ↗
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
