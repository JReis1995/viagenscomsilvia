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
      heroVideoUrl: line,
      heroVideoPosterUrl: line,
      promptQuestion: line,
      promptBtn1Label: line,
      promptBtn1Vibe: line,
      promptBtn2Label: line,
      promptBtn2Vibe: line,
      promptBtn3Label: line,
      promptBtn3Vibe: line,
    })
    .strict(),
  feed: z
    .object({
      eyebrow: line,
      title: line,
      subtitle: line,
      moreLabel: line,
      emptyMessage: line,
      filterAllLabel: line,
      filterChip1Label: line,
      filterChip1Slug: line,
      filterChip2Label: line,
      filterChip2Slug: line,
      filterChip3Label: line,
      filterChip3Slug: line,
      filterHint: line,
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
      climaQuestion: line,
      climaHint: line,
      climaLabelNeve: line,
      climaLabelPraia: line,
      climaLabelCidade: line,
      climaLabelMisto: line,
    })
    .strict(),
  quizSuccess: z
    .object({
      greetingLine: line,
      headline: line,
      body: line,
      spotifyLabel: line,
      spotifyUrl: line,
      backHomeLabel: line,
      emailConfirmLine: line,
      cardBackgroundUrl: line,
    })
    .strict(),
  almaTestimonials: z
    .object({
      eyebrow: line,
      title: line,
      items: z
        .array(
          z
            .object({
              imageUrl: z.string().max(2048),
              quote: z.string().max(2000),
              attribution: z.string().max(200),
            })
            .strict(),
        )
        .max(12),
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
  registerIncentive: z
    .object({
      headline: line,
      bullet1: line,
      bullet2: line,
      bullet3: line,
    })
    .strict(),
  socialFeed: z
    .object({
      eyebrow: line,
      title: line,
      subtitle: line,
      postUrls: z.string().max(12000),
      embedHtml: z.string().max(80000),
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
    heroVideoUrl: "",
    heroVideoPosterUrl: "",
    promptQuestion: "",
    promptBtn1Label: "",
    promptBtn1Vibe: "",
    promptBtn2Label: "",
    promptBtn2Vibe: "",
    promptBtn3Label: "",
    promptBtn3Vibe: "",
  },
  feed: {
    eyebrow: "Curadoria",
    title: "Inspirações e ofertas",
    subtitle:
      "Aqui encontras o vídeo em destaque da Sílvia e o feed de promoções, vídeos e inspiração — atualizado por ela.",
    moreLabel: "Mais do feed",
    emptyMessage:
      "Em breve: novas inspirações e ofertas exclusivas. Entretanto, pede já a tua proposta — a Sílvia adora um desafio em branco.",
    filterAllLabel: "Tudo",
    filterChip1Label: "Romance",
    filterChip1Slug: "romance",
    filterChip2Label: "Retiro",
    filterChip2Slug: "retiro",
    filterChip3Label: "Adrenalina",
    filterChip3Slug: "adrenalina",
    filterHint:
      "Nas publicações, usa os mesmos slugs (ex.: romance, retiro) separados por vírgula.",
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
    climaQuestion: "Que clima te chama mais neste momento?",
    climaHint:
      "É só um ponto de partida — depois combinamos pormenores e alternativas.",
    climaLabelNeve: "Neve e montanha",
    climaLabelPraia: "Sol e praia",
    climaLabelCidade: "Cidade e cultura",
    climaLabelMisto: "Quero misturar tudo",
  },
  quizSuccess: {
    greetingLine: "Olá, {nome}!",
    headline: "A tua viagem já começou a ser desenhada.",
    body: "A Sílvia está a analisar o teu perfil e entrará em contacto nas próximas 48 horas. Enquanto tanto, respira fundo — o melhor está a chegar.",
    spotifyLabel:
      "Enquanto preparo o teu orçamento, entra no clima com a playlist «Mundo» curada pela Sílvia.",
    spotifyUrl: "",
    backHomeLabel: "Voltar à página inicial",
    emailConfirmLine:
      "Enviámos um email de confirmação — verifica a pasta de spam se não o vires.",
    cardBackgroundUrl: "",
  },
  almaTestimonials: {
    eyebrow: "Viagens com alma",
    title: "Histórias de quem já partiu com a Sílvia",
    items: [],
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
  registerIncentive: {
    headline: "Com a tua conta de cliente desbloqueias mais do site",
    bullet1: "Roteiros e conteúdos exclusivos para quem se regista",
    bullet2: "Wishlist para guardares destinos e inspirações",
    bullet3: "Alertas opcionais quando há novas promoções no site",
  },
  socialFeed: {
    eyebrow: "Instagram",
    title: "Últimas partilhas",
    subtitle:
      "Cola abaixo os links dos teus posts ou reels (um por linha), ou o código embed oficial do Instagram. O site fica sempre com cara actualizada.",
    postUrls: "",
    embedHtml: "",
  },
};

function mergeSection(
  defaults: Record<string, string>,
  db: Record<string, unknown> | undefined,
): Record<string, string> {
  const out: Record<string, string> = { ...defaults };
  if (!db || typeof db !== "object") return out;
  for (const key of Object.keys(defaults)) {
    if (!Object.prototype.hasOwnProperty.call(db, key)) {
      continue;
    }
    const v = db[key];
    if (typeof v === "string") {
      out[key] = v;
    } else if (v === null) {
      out[key] = "";
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

/**
 * Junta payload da BD com os defaults. Chaves **em falta** no JSON usam o texto por omissão;
 * chave presente com `""` ou só espaços mantém-se (campo limpo de propósito no CRM).
 */
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
    quizSuccess: mergeSection(
      base.quizSuccess,
      p.quizSuccess as Record<string, unknown>,
    ) as SiteContent["quizSuccess"],
    almaTestimonials: (() => {
      const d = base.almaTestimonials;
      const raw = p.almaTestimonials;
      if (typeof raw !== "object" || raw === null) return d;
      const o = raw as Record<string, unknown>;
      const eyebrow =
        typeof o.eyebrow === "string" ? o.eyebrow : d.eyebrow;
      const title = typeof o.title === "string" ? o.title : d.title;
      let items = d.items;
      if (Array.isArray(o.items)) {
        items = o.items
          .filter(
            (x): x is Record<string, unknown> =>
              typeof x === "object" && x !== null,
          )
          .map((x) => ({
            imageUrl:
              typeof x.imageUrl === "string" ? x.imageUrl : "",
            quote: typeof x.quote === "string" ? x.quote : "",
            attribution:
              typeof x.attribution === "string" ? x.attribution : "",
          }))
          .slice(0, 12);
      }
      return { eyebrow, title, items };
    })(),
    consultora: mergeSection(
      base.consultora,
      p.consultora as Record<string, unknown>,
    ) as SiteContent["consultora"],
    registerIncentive: mergeSection(
      base.registerIncentive,
      p.registerIncentive as Record<string, unknown>,
    ) as SiteContent["registerIncentive"],
    socialFeed: (() => {
      const sf =
        typeof p.socialFeed === "object" && p.socialFeed !== null
          ? (p.socialFeed as Record<string, unknown>)
          : {};
      const head = mergeSection(
        {
          eyebrow: base.socialFeed.eyebrow,
          title: base.socialFeed.title,
          subtitle: base.socialFeed.subtitle,
        },
        {
          eyebrow: sf.eyebrow as string | undefined,
          title: sf.title as string | undefined,
          subtitle: sf.subtitle as string | undefined,
        },
      );
      return {
        eyebrow: head.eyebrow,
        title: head.title,
        subtitle: head.subtitle,
        postUrls:
          typeof sf.postUrls === "string" ? sf.postUrls : base.socialFeed.postUrls,
        embedHtml:
          typeof sf.embedHtml === "string"
            ? sf.embedHtml
            : base.socialFeed.embedHtml,
      };
    })(),
  };
  return replaceLegacyQuizWording(merged);
}

export function parseSiteContentForSave(raw: unknown): SiteContent | null {
  const r = siteContentSchema.safeParse(raw);
  return r.success ? r.data : null;
}
