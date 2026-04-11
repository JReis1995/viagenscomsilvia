"use client";

import type { ContactChannelLinks } from "@/lib/marketing/contact-channels";

function iconWrapClass(extra?: string) {
  return `flex h-12 w-12 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-800 shadow-sm transition hover:border-ocean-400 hover:bg-ocean-50 hover:text-ocean-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400/50 ${extra ?? ""}`;
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3.75" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.25" cy="6.75" r="1.25" fill="currentColor" />
    </svg>
  );
}

type Props = {
  channels: ContactChannelLinks;
  /** Título curto acima dos ícones (ex. «Falar com a Sílvia»). */
  title: string;
  /** Quando false, é o único conteúdo do cartão (sem linha separadora no topo). */
  embedded?: boolean;
};

export function FalarComSilviaIconLinks({
  channels,
  title,
  embedded = true,
}: Props) {
  const { email, whatsapp, instagram } = channels;
  if (!email && !whatsapp && !instagram) return null;

  return (
    <div
      className={
        embedded ? "mt-5 border-t border-ocean-100/80 pt-5" : ""
      }
    >
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean-500 md:text-left">
        {title}
      </p>
      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-3 md:justify-start"
        role="group"
        aria-label={title}
      >
        {email ? (
          <a
            href={email}
            className={iconWrapClass()}
            aria-label="Enviar email à Sílvia"
          >
            <IconMail />
          </a>
        ) : null}
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrapClass("text-[#128C7E] hover:text-[#0e7a6f]")}
            aria-label="Abrir conversa no WhatsApp"
          >
            <IconWhatsApp />
          </a>
        ) : null}
        {instagram ? (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrapClass("text-[#E4405F] hover:text-[#c73552]")}
            aria-label="Abrir perfil no Instagram para enviar mensagem"
          >
            <IconInstagram />
          </a>
        ) : null}
      </div>
    </div>
  );
}
