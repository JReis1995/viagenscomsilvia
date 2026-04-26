import { z } from "zod";

import { DEFAULT_HOME_ORDER_CSV } from "@/lib/site/home-section-order";

const line = z.string().max(4000);

const siteContentSchema = z.object({
  layout: z
    .object({
      /** hero,feed,social,consultora,quiz — ordem dos blocos na home. */
      homeOrderCsv: z.string().max(120),
    })
    .strict(),
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
      /** Cartão branco antes de «Começar o pedido». */
      introCardTitle: line,
      introCardBody: line,
      introCardCtaLabel: line,
      eyebrow: line,
      title: line,
      body: line,
      climaQuestion: line,
      climaHint: line,
      climaLabelNeve: line,
      climaLabelPraia: line,
      climaLabelCidade: line,
      climaLabelMisto: line,
      /** Linha pequena acima da prova social (ex.: «Confiança»). */
      socialProofEyebrow: line,
      /** Frase de confiança ao lado do formulário; editável no CRM. */
      socialProofStat: line,
      /** CTA secundário (ex. WhatsApp); o href pode ficar vazio e usar variáveis de ambiente. */
      falarComSilviaLabel: line,
      /** WhatsApp alternativo: wa.me… se quiseres sobrescrever o env; também aceita mailto:. */
      falarComSilviaUrl: z.string().max(2048),
      /** Perfil Instagram (mensagens); ou usa NEXT_PUBLIC_CONTACT_INSTAGRAM_URL. */
      falarComSilviaInstagramUrl: z.string().max(2048),
      /** Aviso quando já existe pedido em aberto (mesmo email/telemóvel). */
      duplicateOpenLeadMessage: line,
      /** Passos finais do pedido (datas e voos/hotel). */
      janelaDatasQuestion: line,
      janelaDatasHint: line,
      janelaDatasPlaceholder: line,
      flexDatasQuestion: line,
      flexDatasHint: line,
      flexDatasLabelFixas: line,
      flexDatasLabelMaisMenosUmaSemana: line,
      flexDatasLabelTotalmenteFlex: line,
      voosHotelQuestion: line,
      voosHotelHint: line,
      voosHotelLabelNada: line,
      voosHotelLabelSoVoos: line,
      voosHotelLabelSoHotel: line,
      voosHotelLabelAmbos: line,
      /** Passos imersivos — nome, email, telemóvel. */
      pedidoStep1Title: line,
      pedidoStep1Hint: line,
      pedidoStep1Placeholder: line,
      pedidoStep2Title: line,
      pedidoStep2Hint: line,
      pedidoStep2Placeholder: line,
      pedidoStep3Title: line,
      pedidoStep3Hint: line,
      pedidoStep3Placeholder: line,
      pedidoStep5Title: line,
      pedidoStep5Hint: line,
      pedidoStep6Title: line,
      pedidoStep6Hint: line,
      pedidoStep7Title: line,
      pedidoStep7Hint: line,
      pedidoStep7Placeholder: line,
      pedidoStep8Title: line,
      pedidoStep8Hint: line,
      pedidoStep12Title: line,
      pedidoStep12Hint: line,
      pedidoRapidoCardTitle: line,
      pedidoRapidoCardBody: line,
      pedidoRapidoCardCta: line,
      pedidoRapidoModalTitle: line,
      pedidoRapidoModalBody: line,
      pedidoRapidoModalPlaceholder: line,
      pedidoRapidoModalSubmit: line,
      pedidoRapidoModalBack: line,
    })
    .strict(),
  /** Textos do quadro de leads (SLA visível, exportação). Editável no CRM. */
  crm: z
    .object({
      /** Horas até ao indicador verde (número em texto, ex. 24). */
      slaGreenMaxHours: z.string().max(20),
      /** Horas até ao limite amarelo; acima fica vermelho. */
      slaYellowMaxHours: z.string().max(20),
      csvExportHint: line,
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
      nextStepsTitle: line,
      nextStepsBody: line,
      whatsappCtaLabel: line,
      calendlyCtaLabel: line,
      criarContaCtaLabel: line,
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
      /** Parágrafo opcional na página Obrigado, acima da caixa de benefícios. */
      thankYouAccountIntro: line,
      /** Secção na home: linha pequena (vazio = não mostra o bloco na home). */
      homeEyebrow: line,
      /** Secção na home: título (vazio = não mostra o bloco). */
      homeTitle: line,
      homeBody: line,
      homeCtaLabel: line,
      homeLoginLabel: line,
    })
    .strict(),
  /** Histórias curtas tipo «3 noites em X · orçamento Y» — junto ao feed, editável no CRM. */
  travelStories: z
    .object({
      eyebrow: line,
      title: line,
      subtitle: line,
      items: z
        .array(
          z
            .object({
              headline: line,
              nightsBudgetLine: line,
              blurb: line,
              linkUrl: z.string().max(2048),
              linkLabel: line,
            })
            .strict(),
        )
        .max(12),
    })
    .strict(),
  /** Transparência: passos, primeiro contacto e prazos. */
  howWeWork: z
    .object({
      eyebrow: line,
      title: line,
      subtitle: line,
      steps: z
        .array(
          z
            .object({
              title: line,
              body: line,
            })
            .strict(),
        )
        .max(8),
      firstContactTitle: line,
      firstContactBody: line,
      timingsTitle: line,
      timingsBody: line,
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
  layout: {
    homeOrderCsv: DEFAULT_HOME_ORDER_CSV,
  },
  hero: {
    eyebrow: "Consultoria de viagens",
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
    introCardTitle: "Vamos desenhar a tua próxima viagem",
    introCardBody:
      "Partilha os teus dados de contacto e as observações principais da viagem que imaginas. A Sílvia analisa cada pedido manualmente e responde com uma proposta ajustada ao teu perfil.",
    introCardCtaLabel: "Começar o meu pedido",
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
    socialProofEyebrow: "Confiança",
    socialProofStat:
      "A Sílvia lê cada pedido em pessoa e responde por email ou telefone — sem robôs nem orçamentos genéricos. Quanto mais claro fores aqui, mais personalizada fica a primeira resposta.",
    falarComSilviaLabel: "Falar com a Sílvia",
    falarComSilviaUrl: "",
    falarComSilviaInstagramUrl: "",
    duplicateOpenLeadMessage:
      "Já tens um pedido em aberto connosco — vamos tratar disso por esse contacto. Se for mesmo um pedido novo ou urgente, envia um email ou mensagem a dizer que é uma segunda intenção.",
    janelaDatasQuestion: "Que janela de datas tens em mente?",
    janelaDatasHint:
      "Mesmo aproximada (mês, feriado, férias escolares) — ajuda a preparar orçamentos sem idas e voltas.",
    janelaDatasPlaceholder:
      "Ex.: 10 a 20 de agosto · ou «qualquer fim de semana de setembro»",
    flexDatasQuestion: "Quão fixas são essas datas?",
    flexDatasHint:
      "Quanto mais margem tiveres, mais opções costumam aparecer nos voos e hotéis.",
    flexDatasLabelFixas: "Datas fixas (não posso mudar)",
    flexDatasLabelMaisMenosUmaSemana: "Posso flexibilizar cerca de uma semana",
    flexDatasLabelTotalmenteFlex: "Totalmente flexível — o melhor preço manda",
    voosHotelQuestion: "Já tens voos ou hotel reservados?",
    voosHotelHint:
      "Sabermos isto evita duplicar trabalho e alinha a proposta ao que já tens.",
    voosHotelLabelNada: "Ainda não — quero ajuda com tudo",
    voosHotelLabelSoVoos: "Já tenho voos",
    voosHotelLabelSoHotel: "Já tenho hotel / alojamento",
    voosHotelLabelAmbos: "Já tenho voos e hotel",
    pedidoStep1Title: "Como te chamas?",
    pedidoStep1Hint:
      "O nome que preferires que usemos nas mensagens.",
    pedidoStep1Placeholder: "O teu nome",
    pedidoStep2Title: "O teu email",
    pedidoStep2Hint:
      "Para te enviarmos confirmação e a proposta quando estiver pronta.",
    pedidoStep2Placeholder: "nome@email.com",
    pedidoStep3Title: "O teu telemóvel",
    pedidoStep3Hint:
      "Para a Sílvia te poder ligar com rapidez se fizer sentido — não partilhamos o número fora deste contacto.",
    pedidoStep3Placeholder: "Ex.: 912 345 678 ou +351 912 345 678",
    pedidoStep5Title: "Que experiência te faz brilhar os olhos?",
    pedidoStep5Hint:
      "Escolhe a que mais se aproxima — depois afinamos ao pormenor.",
    pedidoStep6Title: "Com quem imaginas partir à descoberta?",
    pedidoStep6Hint:
      "Ajuda-nos a pensar em quartos, ritmo e tipo de experiência.",
    pedidoStep7Title: "Onde queres que a história comece?",
    pedidoStep7Hint:
      "País, ilha, cidade ou até uma ideia vaga — se vieste de uma publicação, já deixámos uma sugestão; podes alterar à vontade.",
    pedidoStep7Placeholder:
      "Ex.: Maldivas em bungalow sobre a água, Japão na primavera…",
    pedidoStep8Title: "Em que faixa te queres mover?",
    pedidoStep8Hint:
      "Por pessoa ou por casal — como fizer sentido para ti. É só uma referência para calibrarmos expectativas.",
    pedidoStep12Title: "Está tudo como imaginaste?",
    pedidoStep12Hint:
      "Revê os detalhes — depois é connosco: a Sílvia trata do resto.",
    pedidoRapidoCardTitle: "Preferes não continuar com todos os passos agora?",
    pedidoRapidoCardBody:
      "Envia um pedido rápido com o teu contacto e uma observação sobre a viagem ideal — a Sílvia trata do resto.",
    pedidoRapidoCardCta: "Usar pedido rápido (contacto + destino)",
    pedidoRapidoModalTitle: "Pedido rápido",
    pedidoRapidoModalBody:
      "Uma linha sobre onde queres ir ou o que imaginaste — depois completamos pormenores contigo.",
    pedidoRapidoModalPlaceholder: "Ex.: Lua-de-mel nas Maldivas em maio…",
    pedidoRapidoModalSubmit: "Enviar pedido rápido",
    pedidoRapidoModalBack: "Continuar o pedido completo",
  },
  crm: {
    slaGreenMaxHours: "24",
    slaYellowMaxHours: "48",
    csvExportHint:
      "Exporta todas as leads em CSV (UTF-8) para folha de cálculo.",
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
    nextStepsTitle: "O que acontece nas próximas 24–48 horas",
    nextStepsBody:
      "A Sílvia lê o teu pedido com calma. Podes receber um email ou uma mensagem com perguntas de afinação. Depois disso, avançamos com ideias e valores alinhados com o que pediste — sem pressa e sem pacotes genéricos.",
    whatsappCtaLabel: "Mensagem no WhatsApp",
    calendlyCtaLabel: "Marcar uma conversa",
    criarContaCtaLabel: "Criar conta de cliente",
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
    thankYouAccountIntro:
      "Criar conta é gratuito e ajuda-nos a manter o diálogo: guardas a wishlist, vês roteiros na tua área e, quando voltares a pedir ajuda, já vamos ao que interessa — um segundo pedido costuma ser um excelente sinal de confiança.",
    homeEyebrow: "Área de cliente",
    homeTitle: "Continua a conversa com uma conta gratuita",
    homeBody:
      "A wishlist e os roteiros ficam na tua área autenticada. Assim guardas inspiração do feed e, quando enviares um novo pedido já com sessão iniciada, a primeira resposta encaixa melhor no que já conversámos — poupa tempo a ti e à Sílvia.",
    homeCtaLabel: "Criar conta",
    homeLoginLabel: "Já tenho conta — entrar",
  },
  travelStories: {
    eyebrow: "Ideias com números",
    title: "Histórias rápidas para te orientares",
    subtitle:
      "Exemplos reais de como combinamos noites, destino e faixa de investimento — inspira e ajuda a qualificar o teu próximo pedido.",
    items: [],
  },
  howWeWork: {
    eyebrow: "Processo por variantes",
    title: "Como trabalhamos",
    subtitle:
      "Um fluxo simples: escolhes base, variantes e preferências; nós validamos e afinamos a proposta contigo.",
    steps: [
      {
        title: "1. Escolhes a publicação e personalizas",
        body: "No detalhe da publicação ajustas as opções da viagem, defines datas, passageiros e quantos quartos precisas.",
      },
      {
        title: "2. Registamos o pedido com contexto real",
        body: "As escolhas ficam guardadas no CRM com resumo completo para evitar retrabalho e acelerar a resposta.",
      },
      {
        title: "3. Validação humana da Sílvia",
        body: "A Sílvia revê pessoalmente o pedido, confirma disponibilidade e ajusta detalhes para chegar a uma proposta viável.",
      },
      {
        title: "4. Ajustes finais e reserva",
        body: "Depois da tua confirmação, fechamos fornecedores e acompanhamos todo o processo até à viagem.",
      },
    ],
    firstContactTitle: "O que inclui o primeiro contacto",
    firstContactBody:
      "Confirmação do pedido, validação rápida das escolhas feitas nas variantes e perguntas essenciais para fechar o cenário certo.",
    timingsTitle: "Prazos que podes contar",
    timingsBody:
      "Resposta inicial: normalmente em 24–48 horas úteis. Cenários com múltiplas variantes ou datas sensíveis podem exigir mais tempo, e avisamos sempre.",
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

const LEGACY_HOME_ORDER_NORM =
  "hero,feed,social,consultora,quiz".replace(/\s/g, "");

function upgradeHomeOrderIfLegacy(homeOrderCsv: string): string {
  if (homeOrderCsv.replace(/\s/g, "") === LEGACY_HOME_ORDER_NORM) {
    return DEFAULT_HOME_ORDER_CSV;
  }
  return homeOrderCsv;
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
    layout: (() => {
      const lo = mergeSection(
        base.layout,
        p.layout as Record<string, unknown> | undefined,
      ) as SiteContent["layout"];
      return {
        ...lo,
        homeOrderCsv: upgradeHomeOrderIfLegacy(lo.homeOrderCsv),
      };
    })(),
    hero: mergeSection(base.hero, p.hero as Record<string, unknown>) as SiteContent["hero"],
    feed: mergeSection(base.feed, p.feed as Record<string, unknown>) as SiteContent["feed"],
    featuredVideo: mergeSection(
      base.featuredVideo,
      p.featuredVideo as Record<string, unknown>,
    ) as SiteContent["featuredVideo"],
    quiz: mergeSection(base.quiz, p.quiz as Record<string, unknown>) as SiteContent["quiz"],
    crm: mergeSection(base.crm, p.crm as Record<string, unknown>) as SiteContent["crm"],
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
    travelStories: (() => {
      const d = base.travelStories;
      const raw = p.travelStories;
      if (typeof raw !== "object" || raw === null) return d;
      const o = raw as Record<string, unknown>;
      const eyebrow = typeof o.eyebrow === "string" ? o.eyebrow : d.eyebrow;
      const title = typeof o.title === "string" ? o.title : d.title;
      const subtitle =
        typeof o.subtitle === "string" ? o.subtitle : d.subtitle;
      let items = d.items;
      if (Array.isArray(o.items)) {
        items = o.items
          .filter(
            (x): x is Record<string, unknown> =>
              typeof x === "object" && x !== null,
          )
          .map((x) => ({
            headline:
              typeof x.headline === "string" ? x.headline : "",
            nightsBudgetLine:
              typeof x.nightsBudgetLine === "string"
                ? x.nightsBudgetLine
                : "",
            blurb: typeof x.blurb === "string" ? x.blurb : "",
            linkUrl: typeof x.linkUrl === "string" ? x.linkUrl : "",
            linkLabel: typeof x.linkLabel === "string" ? x.linkLabel : "",
          }))
          .slice(0, 12);
      }
      return { eyebrow, title, subtitle, items };
    })(),
    howWeWork: (() => {
      const d = base.howWeWork;
      const raw = p.howWeWork;
      if (typeof raw !== "object" || raw === null) return d;
      const o = raw as Record<string, unknown>;
      const eyebrow = typeof o.eyebrow === "string" ? o.eyebrow : d.eyebrow;
      const title = typeof o.title === "string" ? o.title : d.title;
      const subtitle =
        typeof o.subtitle === "string" ? o.subtitle : d.subtitle;
      const firstContactTitle =
        typeof o.firstContactTitle === "string"
          ? o.firstContactTitle
          : d.firstContactTitle;
      const firstContactBody =
        typeof o.firstContactBody === "string"
          ? o.firstContactBody
          : d.firstContactBody;
      const timingsTitle =
        typeof o.timingsTitle === "string" ? o.timingsTitle : d.timingsTitle;
      const timingsBody =
        typeof o.timingsBody === "string" ? o.timingsBody : d.timingsBody;
      let steps = d.steps;
      if (Array.isArray(o.steps)) {
        steps = o.steps
          .filter(
            (x): x is Record<string, unknown> =>
              typeof x === "object" && x !== null,
          )
          .map((x) => ({
            title: typeof x.title === "string" ? x.title : "",
            body: typeof x.body === "string" ? x.body : "",
          }))
          .slice(0, 8);
      }
      return {
        eyebrow,
        title,
        subtitle,
        steps,
        firstContactTitle,
        firstContactBody,
        timingsTitle,
        timingsBody,
      };
    })(),
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
