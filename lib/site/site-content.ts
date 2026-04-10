import { z } from "zod";

const line = z.string().max(4000);

const siteContentSchema = z.object({
  hero: z
    .object({
      eyebrow: line,
      line1: line,
      line2Italic: line,
      line3: line,
      body: line,
      ctaPrimary: line,
      ctaSecondary: line,
      trust1: line,
      trust2: line,
      consultoraLinkLabel: line,
      scrollHint: line,
      heroImageUrl: line,
    })
    .strict(),
  feed: z
    .object({
      eyebrow: line,
      title: line,
      subtitle: line,
      moreLabel: line,
      emptyMessage: line,
    })
    .strict(),
  featuredVideo: z
    .object({
      eyebrow: line,
      kicker: line,
      title: line,
      subtitle: line,
      posterUrl: line,
      instagramUrl: line,
    })
    .strict(),
  quiz: z
    .object({
      eyebrow: line,
      title: line,
      body: line,
    })
    .strict(),
  consultora: z
    .object({
      eyebrow: line,
      title: line,
      p1: line,
      p2: line,
      quote: line,
      linkPhoto: line,
      linkVideo: line,
      ctaQuiz: line,
      portraitUrl: line,
    })
    .strict(),
});

export type SiteContent = z.infer<typeof siteContentSchema>;

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Consultoria de viagens · Boutique",
    line1: "O mundo não espera.",
    line2Italic: "A tua próxima viagem",
    line3: "começa aqui.",
    body: "Mar, cidade selvagem ou ilha remota — desenhamos a experiência à tua medida, com o cuidado de quem vive de histórias bem contadas.",
    ctaPrimary: "Pedir proposta à medida",
    ctaSecondary: "Ver inspirações e ofertas",
    trust1: "Destinos à medida",
    trust2: "Sem pacotes genéricos",
    consultoraLinkLabel: "Área da consultora",
    scrollHint: "Descer",
    heroImageUrl: "",
  },
  feed: {
    eyebrow: "Curadoria",
    title: "Inspirações e ofertas",
    subtitle:
      "Aqui encontras o vídeo em destaque da Sílvia e o feed de promoções, vídeos e inspiração — atualizado por ela.",
    moreLabel: "Mais do feed",
    emptyMessage:
      "Em breve: novas inspirações e ofertas exclusivas. Entretanto, pede já a tua proposta — a Sílvia adora um desafio em branco.",
  },
  featuredVideo: {
    eyebrow: "Publicações",
    kicker: "Vídeo em destaque",
    title: "Vê a Sílvia a partilhar destinos e dicas no Instagram",
    subtitle:
      "Abre no Instagram — e quando estiveres pronta, desce e pede a tua proposta à medida.",
    posterUrl: "",
    instagramUrl: "",
  },
  quiz: {
    eyebrow: "Da inspiração ao plano",
    title: "Inspiraste-te com uma publicação? Agora faz esse sonho ganhar forma",
    body: "Este é o teu pedido de proposta: em minutos a Sílvia percebe o teu estilo, quem te acompanha, o destino que imaginaste (mesmo que ainda seja uma ideia) e a faixa de investimento. Quanto mais claro fores, mais personalizada será a primeira resposta.",
  },
  consultora: {
    eyebrow: "A tua consultora",
    title: "Olá, sou a Sílvia",
    p1: "Trabalho como consultora de viagens independente porque acredito que planear uma viagem deve ser tão memorável quanto viver a viagem. Ouço primeiro, pergunto depois, e só então desenho um percurso que respeita o teu ritmo, orçamento e curiosidade.",
    p2: "Sem call centers nem pacotes engessados — só conversa directa, fornecedores escolhidos a dedo e o acompanhamento que gostarias de ter numa amiga que percebe de mapas e mesas boas.",
    quote:
      "“O melhor elogio que recebo é quando dizem que a viagem pareceu feita à medida — porque foi.”",
    linkPhoto: "",
    linkVideo: "",
    ctaQuiz: "Quero a minha proposta",
    portraitUrl: "",
  },
};

function mergeSection(
  defaults: Record<string, string>,
  db: Record<string, unknown> | undefined,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  if (!db || typeof db !== "object") return out;
  for (const key of Object.keys(defaults)) {
    const v = db[key];
    if (typeof v === "string" && v.trim() !== "") {
      out[key] = v;
    }
  }
  return out;
}

function normKey(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Textos antigos do CMS (ex. «Quiz de viagem») → cópia actual, sem ir à BD à mão. */
function replaceLegacyQuizWording(site: SiteContent): SiteContent {
  const d = DEFAULT_SITE_CONTENT;
  const hero = { ...site.hero };
  if (normKey(hero.ctaPrimary) === normKey("Quiz de viagem")) {
    hero.ctaPrimary = d.hero.ctaPrimary;
  }

  const consultora = { ...site.consultora };
  if (normKey(consultora.ctaQuiz) === normKey("Quiz de viagem")) {
    consultora.ctaQuiz = d.consultora.ctaQuiz;
  }

  const quiz = { ...site.quiz };
  if (normKey(quiz.eyebrow) === normKey("Passo natural")) {
    quiz.eyebrow = d.quiz.eyebrow;
  }
  if (
    normKey(quiz.title) ===
    normKey("Inspiraste-te? Agora conta-nos o teu cenário ideal")
  ) {
    quiz.title = d.quiz.title;
  }
  const oldQuizBody =
    "O quiz ajuda a Sílvia a preparar uma primeira resposta alinhada com o que viste no feed — estilo de viagem, companhia, destino e orçamento.";
  if (normKey(quiz.body) === normKey(oldQuizBody)) {
    quiz.body = d.quiz.body;
  }

  const feed = { ...site.feed };
  const oldEmpty =
    "Em breve: novas inspirações e ofertas exclusivas. Entretanto, faz o quiz e conta-nos o que procuras.";
  if (normKey(feed.emptyMessage) === normKey(oldEmpty)) {
    feed.emptyMessage = d.feed.emptyMessage;
  }

  return { ...site, hero, consultora, quiz, feed };
}

/** Junta payload guardado na BD com os textos por omissão (campos vazios na BD usam default). */
export function mergeSiteContentFromDb(payload: unknown): SiteContent {
  const base = DEFAULT_SITE_CONTENT;
  if (!payload || typeof payload !== "object") {
    return base;
  }
  const p = payload as Record<string, unknown>;
  const merged: SiteContent = {
    hero: mergeSection(base.hero, p.hero as Record<string, unknown>) as SiteContent["hero"],
    feed: mergeSection(base.feed, p.feed as Record<string, unknown>) as SiteContent["feed"],
    featuredVideo: mergeSection(
      base.featuredVideo,
      p.featuredVideo as Record<string, unknown>,
    ) as SiteContent["featuredVideo"],
    quiz: mergeSection(base.quiz, p.quiz as Record<string, unknown>) as SiteContent["quiz"],
    consultora: mergeSection(
      base.consultora,
      p.consultora as Record<string, unknown>,
    ) as SiteContent["consultora"],
  };
  return replaceLegacyQuizWording(merged);
}

export function parseSiteContentForSave(raw: unknown): SiteContent | null {
  const r = siteContentSchema.safeParse(raw);
  return r.success ? r.data : null;
}
