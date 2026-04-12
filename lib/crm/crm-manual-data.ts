import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Columns3,
  Database,
  LayoutDashboard,
  Mail,
  Newspaper,
  Plug,
  ReceiptText,
} from "lucide-react";

/** Tópico de ajuda dentro de uma categoria. */
export type CrmManualTopic = {
  id: string;
  question: string;
  /** Parágrafos separados por linha dupla (`\\n\\n`). */
  answer: string;
  /** Caixa reservada para GIF/imagem. */
  mediaPlaceholder?: boolean;
};

export type CrmManualCategory = {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  topics: CrmManualTopic[];
};

/**
 * Manual da Sílvia — alinhado com o código e ecrãs actuais (`/crm`, Kanban, modais, site).
 * Para alterar textos sem mexer no componente visual, edita só este ficheiro.
 */
export const manualData: CrmManualCategory[] = [
  {
    id: "visao-geral",
    title: "Visão Geral & Dashboard",
    icon: LayoutDashboard,
    description:
      "Página Leads: separador para trabalhar pedidos, outro só para exportar lista; dentro do trabalho há Trabalho e Arquivo.",
    topics: [
      {
        id: "metricas-iniciais",
        question: "Como está organizada a página Leads?",
        answer:
          "No topo há dois separadores principais:\n\n• Quadro — é aqui que tratas os pedidos. Dentro dele escolhes Trabalho (o quadro em si, com colunas ou vista Hoje) ou Arquivo (fichas que guardaste de lado, sem ocupar o quadro).\n\n• Exportar CSV — só para descarregar uma folha de cálculo com os dados; não é o sítio onde se trabalha o dia-a-dia.\n\nNo Trabalho, em vista Quadro, cada coluna mostra quantas fichas tem. Na vista Hoje vês uma fila por ordem do que merece mais atenção primeiro.\n\nAs fichas entram quando alguém pede orçamento no site ou quando crias uma linha com «Nova lead manual».\n\nSe ainda não há pedidos, aparece uma mensagem a dizer que as fichas surgem quando chegam pedidos pelo site.",
      },
      {
        id: "fluxo-diario",
        question: "Que fluxo faz sentido no dia-a-dia?",
        answer:
          "1) Abre o separador Quadro e fica em Trabalho; escolhe vista Quadro (por colunas) ou Hoje (por prioridade).\n\n2) Se alguém pediu orçamento por telefone, WhatsApp ou amigo, regista com «Nova lead manual» para não perderes o fio à meada.\n\n3) Repara nas bordas coloridas dos cartões (tempo desde o pedido) e no ponto vermelho (há email por responder).\n\n4) Usa Ver detalhes para ver tudo sobre o pedido, notas tuas, PDFs e conversa; o ícone de conversa abre só o histórico em formato chat.\n\n5) Responde por email (envelope) ou envia orçamento em PDF quando fizer sentido.\n\n6) Arrasta o cartão entre colunas quando o estado mudar, ou carrega em Arquivar para tirar a ficha do quadro sem a apagar — fica no separador Arquivo.\n\n7) Usa Exportar CSV só quando precisares de uma lista em Excel ou similar; trata os dados com cuidado (RGPD).",
        mediaPlaceholder: true,
      },
      {
        id: "atalhos-pagina",
        question: "Onde estão os atalhos dentro do próprio ecrã?",
        answer:
          "No bloco «Vista do painel» podes alternar entre vista Quadro e vista Hoje, e abrir «Nova lead manual» para pedidos que não vieram do site.\n\nAcima disso, os separadores Trabalho e Arquivo mudam o que estás a ver: trabalho activo vs fichas guardadas.\n\nEm cada cartão: copiar email, email ao cliente, histórico, envio de orçamento em PDF (não aparece em certos estados finais), WhatsApp só se a pessoa aceitou, Ver detalhes e Arquivar.",
      },
    ],
  },
  {
    id: "leads-kanban",
    title: "Gestão de Leads (Kanban)",
    icon: Columns3,
    description:
      "Colunas do quadro, arrastar, vista Hoje, arquivo à parte, avisos de tempo e de mensagens novas.",
    topics: [
      {
        id: "lead-manual",
        question: "Como registo um pedido que não veio pelo site (amigo, telefone, WhatsApp)?",
        answer:
          "No bloco «Vista do painel», carrega em «Nova lead manual». Preenche nome e email (obrigatórios), telemóvel se tiveres, um texto sobre o destino ou pedido se quiseres, notas tuas só para ti, e se queres o lembrete automático por email como nos pedidos do site.\n\nA ficha nasce em «Nova lead». Não se manda email automático ao cliente — estás só a criar o registo no painel.\n\nEm Ver detalhes, na parte de origem do pedido, vês indicação de que foi registo manual (não veio do formulário público).\n\nSe já existir outra ficha «aberta» com o mesmo email ou telemóvel (nova, em contacto ou proposta enviada), o sistema não deixa duplicar: usa a ficha que já existe ou fecha a anterior primeiro — igual ao site.",
      },
      {
        id: "mover-leads",
        question: "Quais são as colunas do quadro e o que significam?",
        answer:
          "No separador Trabalho, o quadro tem estas colunas (da esquerda para a direita):\n\n• Nova lead — primeiro contacto, pedido acabou de entrar.\n\n• Em contacto — estás a perceber o que a pessoa quer.\n\n• Proposta enviada — já enviaste proposta e estás à espera de resposta.\n\n• Ganho — reserva ou negócio fechado.\n\n• Cancelado — a pessoa desistiu ou cancelou.\n\nAs fichas arquivadas não têm coluna no quadro: usas «Arquivar» no cartão e elas passam para o separador Arquivo (lista à parte), para o quadro não ficar uma coluna gigante. No Arquivo, em cada ficha podes escolher o estado e carregar «Retirar do arquivo» para ela voltar ao Trabalho.\n\nPara mudar de coluna: arrasta o cartão. Enquanto grava, fica mais claro; se falhar, aparece aviso e o cartão volta ao sítio anterior.\n\nNão precisas de preencher notas para mudar de coluna.",
      },
      {
        id: "outros-estados",
        question: "O que é a coluna «Outros estados»?",
        answer:
          "Só aparece se alguma ficha tiver um estado antigo ou diferente dos que o painel conhece (por exemplo dados de teste).\n\nO cartão mostra qual é esse estado. Arrasta para uma coluna normal (Nova lead, Em contacto, etc.) para ficar tudo alinhado.",
      },
      {
        id: "vista-hoje",
        question: "Em que difere a vista «Hoje» do «Quadro»?",
        answer:
          "Quadro: vês colunas lado a lado (com scroll horizontal no telemóvel), uma por estado.\n\nHoje: uma única lista de cima a baixo, com o que precisa mais da tua atenção primeiro (pedidos novos e propostas à espera de resposta sobem; ganhos, cancelados e o que está só em arquivo não aparecem aqui — arquivo está no outro separador).\n\nEm cada cartão, no topo, vês sempre em que estado a ficha está.\n\nSe já enviaste orçamento e a ficha está em «Proposta enviada» ou «Em contacto», ao abrir o email a partir do cartão o sistema pode trazer um rascunho de follow-up já preparado.",
      },
      {
        id: "slas-cores",
        question: "O que significam as cores da borda e o «há X horas»?",
        answer:
          "Em cada cartão vês há quanto tempo foi feito o pedido — é só informativo.\n\nA borda usa dois limites em horas que podes mudar em Conteúdo do site → grupo «Quadro de leads» (por omissão 24 h e 48 h):\n\n• Até ao primeiro número, a borda fica neutra.\n\n• Entre o primeiro e o segundo, fica amarela.\n\n• Acima do segundo, fica vermelha.\n\nEm estados como Ganho, Cancelado, ou fichas em arquivo / outros estados especiais, a borda fica neutra para não distrair.\n\nA legenda por baixo do quadro lembra estes tempos.\n\nO ponto vermelho no canto do cartão quer dizer que há mensagem por tratar; quando abres o histórico ou Ver detalhes, o sistema tenta marcar como visto e o ponto some.",
        mediaPlaceholder: true,
      },
      {
        id: "arquivo-csv",
        question: "O que é o separador «Exportar CSV»?",
        answer:
          "É só para descarregar um ficheiro de lista (abre em Excel ou folha de cálculo). O texto de ajuda ao lado do botão podes alterar em Conteúdo do site → área do painel de leads.\n\nCuidado com dados pessoais: não partilhes por sítios inseguros e apaga cópias quando não precisares delas.",
      },
    ],
  },
  {
    id: "comunicacoes",
    title: "Comunicações e Emails",
    icon: Mail,
    description:
      "Histórico em estilo conversa, emails a partir do painel e registo de respostas.",
    topics: [
      {
        id: "mensagens-nao-lidas",
        question: "Como sei que há mensagens novas por tratar?",
        answer:
          "No cartão aparece um ponto vermelho no canto quando há email ou mensagem por rever.\n\nAo abrires o Histórico (ícone de conversa) ou Ver detalhes, o painel tenta marcar como visto; se correr bem, o ponto desaparece.",
      },
      {
        id: "historico-tipos",
        question: "Que tipos de entradas aparecem no histórico?",
        answer:
          "O histórico mostra tudo por ordem de tempo. As bolhas da tua lado aparecem num tom mais forte; as da pessoa em cinzento; avisos automáticos do sistema aparecem ao centro.\n\nVais encontrar, entre outros:\n\n• Registo do pedido quando entrou (site ou manual).\n\n• Cada orçamento em PDF que enviaste, com valor e resumo quando está preenchido.\n\n• Lembretes automáticos que o sistema enviou por email.\n\n• Emails que escreveste a partir do painel e respostas que chegaram por email.\n\n• Mensagens que a pessoa deixou na área «Conta» do site.\n\n• Quando aprova a proposta ou pede alterações a partir da área de cliente.\n\nO ícone de conversa no cartão abre a mesma conversa resumida que vês dentro de Ver detalhes.",
      },
      {
        id: "email-crm",
        question: "Como funciona o «Email ao cliente»?",
        answer:
          "O ícone de envelope abre a janela para escreveres a mensagem. O envio sai pelo serviço de email ligado ao site e fica registado no histórico.\n\nNa vista Hoje, se já enviaste orçamento e a ficha está em «Proposta enviada» ou «Em contacto», pode aparecer um rascunho de follow-up; noutros casos começas em branco. Em Ver detalhes também podes abrir o email a partir do endereço da pessoa.\n\nSe o envio falhar, a mensagem de erro aparece na própria janela — nesse caso quem gere a parte técnica do site deve confirmar as definições de email.",
      },
      {
        id: "registar-resposta-manual",
        question: "E se a resposta da pessoa não aparecer sozinha no painel?",
        answer:
          "Em Ver detalhes, na secção «Resposta da lead por email», cola o assunto e o texto que recebeste na tua caixa e carrega em «Registar resposta recebida». Assim fica guardado no histórico como mensagem recebida.\n\nSe o email do site estiver bem ligado às respostas automáticas, às vezes isto já acontece sozinho; se não, este passo manual resolve.",
        mediaPlaceholder: true,
      },
    ],
  },
  {
    id: "propostas",
    title: "Propostas e Orçamentos",
    icon: ReceiptText,
    description:
      "Modal de envio, pré-visualização PDF, estado «Proposta enviada», histórico de envios e decisões na área do cliente.",
    topics: [
      {
        id: "brief-quiz",
        question: "Onde leio o pedido completo da pessoa?",
        answer:
          "Em Ver detalhes: no topo tens os contactos e, se for o caso, indicação de «Pedido rápido». Mais abaixo, «O que o cliente indicou» junta telemóvel, data do pedido, preferências de clima e estilo, com quem viaja, destino, orçamento indicado, datas, se já tem voos ou hotel, se quer lembretes automáticos, e de onde veio o pedido no site (página, campanha, etc.).\n\nAs notas internas ficam no início — são só para ti e para a equipa, o visitante não vê.",
      },
      {
        id: "enviar-orcamento",
        question: "Como envio ou pré-visualizo o orçamento em PDF?",
        answer:
          "No cartão usa o ícone de PDF. Esse ícone não aparece quando a ficha está em Ganho, Cancelado ou Arquivado (incluindo no separador Arquivo).\n\nAbre-se um formulário com título, destino, datas, lista do que a viagem inclui (uma linha por frase), valor total, notas tuas, e campos opcionais: página do destino no site, mapa, links úteis (em cada linha escreve o texto do link, uma barra vertical |, e o endereço web) e fotos para galeria (um endereço por linha).\n\nPodes só gerar o PDF para veres no ecrã ou enviar por email. Ao enviar, podes pedir para a ficha passar automaticamente para «Proposta enviada».\n\nCada envio fica na lista de orçamentos dentro de Ver detalhes, com opção de descarregar cada versão em PDF. No cartão pode aparecer o último valor enviado.",
        mediaPlaceholder: true,
      },
      {
        id: "aprovacoes-cliente",
        question: "Onde aparecem aprovações ou pedidos de alteração?",
        answer:
          "Quando a lead usa a área de cliente para responder à proposta, o sistema regista decisões do tipo «Orçamento aprovado» ou «Pediu alterações» (com nota opcional). Estas entradas surgem no histórico como recebidas, misturadas na cronologia com emails e mensagens.\n\nO teu trabalho no CRM continua a ser mover o cartão para o estado que reflecte a realidade (ex.: Ganho após confirmação de reserva) e usar notas internas para contexto.",
      },
    ],
  },
  {
    id: "clientes",
    title: "Base de Dados de Clientes",
    icon: Database,
    description:
      "Uma ficha por pedido, duplicados, marketing e cuidados com dados pessoais.",
    topics: [
      {
        id: "historico-geral",
        question: "Como relaciono vários pedidos da mesma pessoa?",
        answer:
          "Cada linha na lista é uma lead (um pedido). O mesmo email pode ter várias linhas ao longo do tempo. Filtra mentalmente pelo email ou nome no quadro e abre cada Ver detalhes para ver o histórico específico dessa ficha.\n\nO site bloqueia um segundo pedido «em aberto» com o mesmo email (ignorando maiúsculas) ou o mesmo telemóvel (mínimo 9 dígitos normalizados) quando já existe lead em Nova Lead, Em contacto ou Proposta enviada: a API responde com erro 409 e uma mensagem a pedir que a pessoa use o contacto existente ou escreva a dizer que é uma nova intenção — evita duplicar trabalho no quadro.",
      },
      {
        id: "rgpd",
        question: "Boas práticas com dados pessoais",
        answer:
          "Notas internas, emails e CSV contêm informação sensível. Usa apenas o CRM e canais profissionais acordados. Evita exportar para sítios partilhados inseguros; apaga ficheiros temporários quando deixares de precisar deles.\n\nO WhatsApp no cartão existe para conveniência mas mostra aviso de consentimento — só usa quando a lead tiver aceitado contacto por esse canal.",
      },
    ],
  },
  {
    id: "integracoes",
    title: "Site — definições de conteúdo",
    icon: Plug,
    description:
      "Onde mudar textos e imagens da página inicial e o que os campos «só do painel» fazem.",
    topics: [
      {
        id: "conteudo-site",
        question: "Onde edito textos, imagens e o questionário da página inicial?",
        answer:
          "Menu CRM → Site.\n\nHá duas formas de trabalhar:\n\n• Modo sobre a página (recomendado): vês o site como os visitantes, com caixas por cima das frases — clicas e editas. Faz scroll para chegar a todas as zonas (histórias, «como trabalhamos», convite a criar conta, etc.). Até carregares em publicar, o público continua a ver a versão antiga.\n\n• Modo lista: no fim do endereço da página podes acrescentar ?lista=1 para ver todos os campos numa lista, com a mesma pré-visualização ao lado (ou por baixo no telemóvel).\n\nO botão «Publicar no site» é o que torna as alterações visíveis para toda a gente.\n\nOs cartões grandes da página inicial (viagens em destaque) não se editam aqui — gerem-se em CRM → Publicações.",
      },
      {
        id: "secao-crm-cms",
        question: "O que são os campos «Quadro de leads» dentro de Conteúdo do site?",
        answer:
          "São três coisas que só mudam o painel de leads, não a página pública:\n\n• Quantas horas depois do pedido a borda do cartão deixa de ser neutra.\n\n• Até quantas horas fica amarela antes de passar a vermelha.\n\n• O texto de ajuda que aparece junto ao botão de exportar lista (CSV).\n\nPor omissão são 24 h e 48 h; podes ajustar ao teu ritmo de resposta.",
      },
      {
        id: "redes-e-media",
        question: "Onde estão vídeo, fotos ou link do Spotify?",
        answer:
          "No mesmo sítio CRM → Site, nos blocos correspondentes (zona da consultora, página de agradecimento depois do questionário, testemunhos com fotos, etc.). Tanto dá para usar o modo sobre a página como a lista; a pré-visualização ajuda a ver o resultado antes de publicar.",
      },
    ],
  },
  {
    id: "site-publicacoes",
    title: "Publicações na página inicial",
    icon: Newspaper,
    description:
      "Cartões de viagens ou destaques na home: criar, ordenar e publicar.",
    topics: [
      {
        id: "publicar",
        question: "Como funcionam as Publicações?",
        answer:
          "Menu CRM → Publicações. É aqui que crias e editas os cartões que aparecem na página inicial (viagens em destaque, ofertas, etc.).\n\nEm cada cartão podes definir, entre outras coisas: título, texto curto, imagem ou vídeo, preço «desde», botão com link, se já está visível no site ou ainda é rascunho, data de publicação, ordem (número mais baixo = aparece mais à frente na fila), se é conteúdo só para quem tem conta, e dados do mapa se quiseres mostrar o sítio no mundo.\n\nA ordem no site controla a sequência dos cartões na home — ajusta até ficar como queres.\n\nSe o painel mostrar aviso de ligação ao servidor, quem trata da parte técnica tem de confirmar as chaves de acesso na hospedagem do site.",
      },
      {
        id: "preview-site",
        question: "Consigo ver o site antes de publicar?",
        answer:
          "Sim. Ao editar em CRM → Site, a pré-visualização mostra o rascunho; o público só vê as alterações depois de carregares em «Publicar no site».\n\nAs publicações entram na home quando estão marcadas como publicadas e com a ordem certa.\n\nPara veres exactamente como um visitante vê tudo depois de publicar, abre a página inicial noutro separador ou em janela privada do browser.",
      },
    ],
  },
  {
    id: "recursos",
    title: "Recursos & Referência rápida",
    icon: BookOpen,
    description:
      "Alguns termos úteis em linguagem simples.",
    topics: [
      {
        id: "glossario",
        question: "Glossário rápido",
        answer:
          "Ficha / lead — uma linha no quadro: um pedido que veio do site ou que criaste com «Nova lead manual».\n\nEstado — em que fase está o pedido (nova, em contacto, proposta enviada, ganho, cancelado ou arquivado). No site público o cliente pode ver palavras mais simples para o mesmo estado (ex.: «Pedido recebido»).\n\nPedido rápido — quando a pessoa preencheu o formulário curto ou criaste a ficha manual assim; no detalhe pode aparecer esse selo.\n\nOrçamento no cartão — resume o último valor que enviaste; o histórico completo de todas as versões está em Ver detalhes.\n\nBordas coloridas — lembrete visual de há quanto tempo está o pedido sem fechar; regula em Conteúdo do site → Quadro de leads.\n\nPonto vermelho — há mensagem por ler.\n\nÁrea de cliente — sítio onde a pessoa entra com login (Conta): o que ela escreve ou decide sobre a proposta aparece no histórico da ficha no painel.",
      },
    ],
  },
];
