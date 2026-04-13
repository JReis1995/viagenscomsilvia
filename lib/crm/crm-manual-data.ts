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
  Users,
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
      "Leads no quadro (Trabalho e Arquivo), exportar CSV, e Dashboard com KPIs, filtros de datas (presets ou intervalo UTC) e estados, guardados por browser.",
    topics: [
      {
        id: "metricas-iniciais",
        question: "Como está organizada a página Leads?",
        answer:
          "No menu CRM tens várias entradas:\n\n• Leads — separadores Quadro (trabalhar pedidos) e Exportar CSV. No Quadro escolhes Trabalho (pipeline activo: Nova lead, Em contacto, Proposta enviada — colunas ou Hoje) ou Arquivo (Ganhas, Canceladas, Arquivo geral, com contagens).\n\n• Dashboard — números de resumo (por estado, abertas, ganhas, canceladas, taxas). Filtras por data do pedido: atalhos (todo o período, últimos 30 ou 90 dias, em UTC) ou intervalo personalizado com início e fim do dia em UTC; em «Filtros» também escolhes quais estados entram nas contagens. As preferências de período e estados guardam-se neste browser (`crm-dashboard-filters:v1`); «Personalizar widgets» controla só quais cartões vês (`crm-dashboard-widgets:v1`).\n\n• Inscritos — contas na área de cliente; editar nome/opt-in, eliminar conta (com confirmação), ver como cliente e campanhas por email com link rastreável.\n\n• Site, Publicações e Manual — como descrito noutras secções deste guia.\n\nNo Trabalho, em vista Quadro, vês três colunas e quantas fichas tem cada uma. Na vista Hoje vês uma fila só de leads activas no pipeline, por ordem de urgência.\n\nAs fichas entram quando alguém pede orçamento no site ou quando crias uma linha com «Nova lead manual».\n\nSe ainda não há pedidos, aparece uma mensagem a dizer que as fichas surgem quando chegam pedidos pelo site.",
      },
      {
        id: "fluxo-diario",
        question: "Que fluxo faz sentido no dia-a-dia?",
        answer:
          "1) Abre o separador Quadro e fica em Trabalho; escolhe vista Quadro (três colunas do pipeline) ou Hoje (só leads activas).\n\n2) Se alguém pediu orçamento por telefone, WhatsApp ou amigo, regista com «Nova lead manual» para não perderes o fio à meada.\n\n3) Repara nas bordas coloridas dos cartões (tempo desde o pedido) e no ponto vermelho (há email por responder).\n\n4) Usa Ver detalhes para ver tudo sobre o pedido, notas tuas, PDFs e conversa, ajustar o follow-up automático por ficha e enviar o lembrete inicial com revisão se precisares; o ícone de conversa abre só o histórico em formato chat.\n\n5) Responde por email (envelope) ou envia orçamento em PDF quando fizer sentido.\n\n6) Arrasta o cartão entre as três colunas do pipeline; para marcar Ganho ou Cancelado usa as ligações no cartão (passam para o Arquivo no grupo certo). Arquivar guarda a ficha no Arquivo geral sem apagar.\n\n7) Usa Exportar CSV só quando precisares de uma lista em Excel ou similar; trata os dados com cuidado (RGPD).",
        mediaPlaceholder: true,
      },
      {
        id: "visao-consultora-edicao",
        question: "Na visão da consultora no CRM, o que posso editar livremente?",
        answer:
          "No painel da consultora tudo o que é trabalho do dia-a-dia — o que vês em formulários e caixas de texto antes de confirmar — é contigo: no email à lead, o modelo só sugere assunto e corpo e podes alterar palavra a palavra até enviares (incluindo o modelo «Lembrete inicial (igual ao automático)»). No detalhe da lead escreves notas internas, registas respostas recebidas, ligas ou desligas o follow-up automático por ficha (caixa em «Follow-up automático (cron)»), envias o lembrete inicial com pré-visualização antes de confirmar, e preenches o envio de orçamento em PDF quando o ícone estiver disponível. Em CRM → Site alteras conteúdos públicos (textos e imagens) até publicares; em Publicações geres cartões da página inicial. No Dashboard escolhes período (presets ou datas em UTC), filtros de estados e, em «Personalizar widgets», os cartões — preferências no teu browser; os números vêm do servidor. Em Inscritos editas nome e opt-in, podes eliminar contas de clientes (com confirmação), preparas campanhas (assunto e corpo editáveis) e usas «Ver como cliente» conforme o guia nessa secção. A assinatura automática dos emails é acrescentada pelo sistema; não precisas de a copiar para a mensagem. Este Manual (CRM → Manual) é leitura para te orientares; os textos alinham-se com o produto quando há actualizações. O que não se mexe no CRM (código, chaves em servidor, OAuth no Supabase) fica a quem gere a parte técnica.",
      },
      {
        id: "atalhos-pagina",
        question: "Onde estão os atalhos dentro do próprio ecrã?",
        answer:
          "No bloco «Vista do painel» podes alternar entre vista Quadro e vista Hoje, e abrir «Nova lead manual» para pedidos que não vieram do site.\n\nAcima disso, os separadores Trabalho e Arquivo mudam o que estás a ver: pipeline activo vs fichas em Ganho, Canceladas ou arquivo geral (com chips e contagens).\n\nEm cada cartão no Trabalho: copiar email, email ao cliente, histórico, envio de orçamento em PDF, WhatsApp se aplicável, Ganho, Cancelado, Arquivar e Ver detalhes.",
      },
      {
        id: "dashboard-kpis",
        question: "O que significam os números no Dashboard (CRM → Dashboard)?",
        answer:
          "Primeiro escolhes o universo: período pela data em que o pedido entrou (`data_pedido`) — atalhos (todo, últimos 30 ou 90 dias, rolantes em UTC) ou intervalo personalizado com limite máximo de dois anos de calendário; em UTC, cada dia vai das 00:00:00 às 23:59:59.999 desse dia.\n\nOpcionalmente, em «Filtros (datas e estados)», limitas quais estados entram nas contagens (incluindo «Outros estados» para fichas com estado antigo ou invulgar). Se não seleccionares nenhum estado, o universo fica vazio (zeros). Tudo o que se segue aplica-se só a esse universo.\n\n• Leads em aberto — não estão em Ganho, Cancelado nem Arquivado.\n\n• Taxa de conversão (decisão) — Ganho ÷ (Ganho + Cancelado). O Arquivado não entra no denominador: mede a decisão entre ganhar ou cancelar.\n\n• Hit ratio — Ganho ÷ fichas com pelo menos um envio de orçamento/proposta registado (`data_envio_orcamento`). É uma métrica diferente da taxa de conversão: o denominador são leads com proposta enviada por essa via, não (Ganho + Cancelado).\n\nNa página há o texto em cada cartão. Para reproduzir na base de dados, usa `sql/crm_dashboard_verification.sql` (inclui notas sobre filtro de estados na URL).",
      },
    ],
  },
  {
    id: "leads-kanban",
    title: "Gestão de Leads (Kanban)",
    icon: Columns3,
    description:
      "Pipeline de três colunas, arrastar, vista Hoje, arquivo com Ganhas/Canceladas/arquivo geral, SLA e mensagens novas.",
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
          "No separador Trabalho, o quadro mostra só o pipeline (da esquerda para a direita):\n\n• Nova lead — primeiro contacto, pedido acabou de entrar.\n\n• Em contacto — estás a perceber o que a pessoa quer.\n\n• Proposta enviada — já enviaste proposta e estás à espera de resposta.\n\nGanho e Cancelado já não têm coluna aqui: no cartão usas «Ganho» ou «Cancelado» e a ficha vai para o separador Arquivo, nos chips Ganhas ou Canceladas (cada um com a sua contagem). «Arquivar» manda a ficha para o grupo Arquivo geral (pausado / sem conversão), também fora do quadro.\n\nNo Arquivo geral, «Retirar do arquivo» repõe a ficha no estado que escolheres no quadro de trabalho. Em Ganhas ou Canceladas, «Gravar estado» permite mudar para qualquer estado (incluindo voltar ao pipeline ou arquivar).\n\nNo pipeline, para mudar entre as três colunas: arrasta o cartão. Enquanto grava, fica mais claro; se falhar, aparece aviso e o cartão volta ao sítio anterior.\n\nNão precisas de preencher notas para mudar de coluna.",
      },
      {
        id: "outros-estados",
        question: "O que é a coluna «Outros estados»?",
        answer:
          "Só aparece se alguma ficha tiver um estado antigo ou diferente dos que o painel conhece (por exemplo dados de teste).\n\nO cartão mostra qual é esse estado. Arrasta para uma coluna do pipeline (Nova lead, Em contacto ou Proposta enviada) para ficar tudo alinhado.",
      },
      {
        id: "vista-hoje",
        question: "Em que difere a vista «Hoje» do «Quadro»?",
        answer:
          "Quadro: vês três colunas lado a lado (com scroll horizontal no telemóvel): Nova lead, Em contacto e Proposta enviada.\n\nHoje: uma única lista só com leads nesses três estados, ordenada por urgência (Ganho, Cancelado e Arquivado não aparecem — estão no separador Arquivo).\n\nEm cada cartão, no topo, vês sempre em que estado a ficha está.\n\nSe já enviaste orçamento e a ficha está em «Proposta enviada» ou «Em contacto», ao abrir o email a partir do cartão o sistema pode abrir já com o modelo «Follow-up formal (proposta)»; na mesma janela podes mudar para outro modelo (confirmação de receção, pedido de informação, etc.) ou «Em branco», e editar tudo antes de enviar.",
      },
      {
        id: "slas-cores",
        question: "O que significam as cores da borda e o «há X horas»?",
        answer:
          "Em cada cartão vês há quanto tempo foi feito o pedido — é só informativo.\n\nA borda usa dois limites em horas que podes mudar em Conteúdo do site → grupo «Quadro de leads» (por omissão 24 h e 48 h):\n\n• Até ao primeiro número, a borda fica neutra.\n\n• Entre o primeiro e o segundo, fica amarela.\n\n• Acima do segundo, fica vermelha.\n\nNo separador Arquivo (Ganhas, Canceladas, arquivo geral) a borda fica neutra para não distrair; no Trabalho aplica-se a legenda ao pipeline.\n\nA legenda por baixo do quadro lembra estes tempos.\n\nO ponto vermelho no canto do cartão quer dizer que há mensagem por tratar; quando abres o histórico ou Ver detalhes, o sistema tenta marcar como visto e o ponto some.",
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
      "Histórico em estilo conversa, emails a partir do painel, lembrete inicial (modelo do cron) com revisão, opt-out do automático por ficha e registo de respostas.",
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
          "O ícone de envelope abre a janela para escreveres a mensagem. O envio sai pelo serviço de email ligado ao site e fica registado no histórico.\n\nHá um menu «Modelo de mensagem»: «Em branco» começa sem texto; os outros preenchem assunto e corpo com frases formais (usa o primeiro nome da lead e o destino quando faz sentido). O modelo «Follow-up formal (proposta)» corresponde ao texto de acompanhamento depois de enviada a proposta. O modelo «Lembrete inicial (igual ao automático)» usa o mesmo texto base que o cron diário envia às leads em «Nova Lead» sem orçamento — mas aqui o email sai com a assinatura CRM (site, redes, área de cliente) como qualquer outro envio teu a partir do painel. Em qualquer caso podes alterar assunto e mensagem à vontade antes de carregar em Enviar.\n\nAo enviar, o sistema acrescenta automaticamente uma assinatura discreta com ligação ao site, Instagram, TikTok, o email silviaamaralmilheiro@viagenscomsilvia.com e um atalho para a área de cliente (/conta), com endereço completo correcto no servidor (configurado com NEXT_PUBLIC_SITE_URL ou equivalente em produção).\n\nNa vista Hoje, se já enviaste orçamento e a ficha está em «Proposta enviada» ou «Em contacto», a janela pode abrir já com o follow-up formal; noutros casos costuma abrir em «Em branco». Em Ver detalhes também podes abrir o email a partir do endereço da pessoa (abre em branco por omissão) ou usar o botão do lembrete inicial — vê o tópico dedicado aos lembretes.\n\nSe o envio falhar, a mensagem de erro aparece na própria janela — nesse caso quem gere a parte técnica do site deve confirmar as definições de email.",
      },
      {
        id: "lembrete-inicial-e-cron",
        question:
          "Lembrete automático por email: condições, opt-out por ficha e envio manual",
        answer:
          "Um trabalho agendado no servidor (cron) pode enviar um único lembrete por email a fichas que ainda estão em «Nova Lead», sem data de orçamento enviado, com a caixa de follow-up automático activa nesta lead, sem lembrete automático já registado (`data_ultimo_followup` vazio), e com o interruptor global activo na base de dados (`global_auto_followup` na tabela `configuracoes_globais`). Esse interruptor global não aparece no CRM; quem gere a base de dados ajusta se for preciso desligar tudo de uma vez.\n\nO número mínimo de dias entre o pedido e o primeiro envio automático define-se no servidor com a variável `FOLLOWUP_LEAD_MIN_DAYS` (por omissão 3; em produção podes pedir para a equipa técnica fixar 2 ou outro valor).\n\nEm Ver detalhes, na área «Follow-up automático (cron)», podes desligar ou voltar a ligar o lembrete só para aquela ficha, sem afectar as outras.\n\nSe quiseres enviar tu própria a mesma ideia de mensagem com tempo para rever: usa «Lembrete inicial (modelo do automático) — rever e enviar». Abre-se a janela de email com o texto base igual ao do cron; editas se quiseres e envias. O cliente recebe o email com a assinatura CRM habitual. Depois de um envio bem sucedido com esse modelo seleccionado, o sistema grava a data em `data_ultimo_followup` na ficha (como faz o cron), para o automático não repetir de imediato a mesma linha de contacto.\n\nNo histórico da ficha podes ver quando foi esse registo (evento de sistema). Emails que envias a partir do painel com outros modelos não alteram esse campo.",
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
          "Em Ver detalhes: no topo tens os contactos e, se for o caso, indicação de «Pedido rápido». Mais abaixo, «O que o cliente indicou» junta telemóvel, data do pedido, preferências de clima e estilo, com quem viaja, destino, orçamento indicado, datas, se já tem voos ou hotel, e de onde veio o pedido no site (página, campanha, etc.). Na mesma zona, «Follow-up automático (cron)» permite ligar ou desligar lembretes automáticos por email só para essa ficha e abrir o envio manual do lembrete inicial com pré-visualização.\n\nAs notas internas ficam no início — são só para ti e para a equipa, o visitante não vê.",
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
          "Notas internas, emails e CSV contêm informação sensível. Usa apenas o CRM e canais profissionais acordados. Evita exportar para sítios partilhados inseguros; apaga ficheiros temporários quando deixares de precisar deles.\n\nO WhatsApp no cartão existe para conveniência mas mostra aviso de consentimento — só usa quando a lead tiver aceitado contacto por esse canal.\n\nEmails promocionais em massa e alertas de publicações: só para contas com opt-in explícito registado (primeiro ecrã na Conta ou caixa em «Os teus pedidos»). Não assumas consentimento só porque a pessoa te segue nas redes.",
      },
    ],
  },
  {
    id: "inscritos-campanhas",
    title: "Inscritos e campanhas promo",
    icon: Users,
    description:
      "Contas na área de cliente, opt-in de promoções, ver como cliente e envio de campanhas com link rastreável.",
    topics: [
      {
        id: "lista-inscritos",
        question: "O que é o ecrã CRM → Inscritos?",
        answer:
          "Lista utilizadores registados (conta no site) com email, data de registo e estado do opt-in de promoções (sim, não ou ainda não definido).\n\nEm cada linha tens Editar (nome apresentado na conta e consentimento de promoções), Eliminar conta (irreversível, com confirmação por email ou palavra ELIMINAR) e Ver como cliente (magic link).\n\nA coluna opt-in vem da mesma fonte que a área Conta: na primeira vez que a pessoa entra na Conta (depois de criar sessão com email/palavra-passe, Google ou Facebook), aparece um ecrã obrigatório de consentimentos. Aí confirma o tratamento de dados e, se quiser, marca o envio de emails promocionais — isso grava na tabela de preferências de alertas e é o mesmo sinal que vês aqui e que o servidor usa para avisos de novas publicações e para campanhas. Mais tarde a pessoa pode mudar o opt-in em «Os teus pedidos». Só quem tem opt-in activo pode ser seleccionado para envio em massa; o servidor volta a confirmar antes de enviar.\n\nNo topo deste ecrã há também uma nota sobre login social: Google e Facebook estão disponíveis no login público; login directo com Instagram não é suportado de forma fiável para aplicações como esta — orienta clientes a usarem Google, Facebook ou email.\n\nQuem gere a parte técnica precisa de `SUPABASE_SERVICE_ROLE_KEY` no servidor para listar utilizadores (API de administração) e de `CAMPAIGN_LINK_SECRET` para assinar links únicos por pessoa nas campanhas. Para OAuth, no Supabase Dashboard devem estar activos os fornecedores Google e Facebook e as URL de redirecção para `/auth/callback` (vê `sql/sprint5_oauth_consent.sql`). Para registar eliminações de conta na base de dados, executa também `sql/sprint6_subscriber_delete_audit.sql`.",
      },
      {
        id: "editar-inscrito",
        question: "Como edito nome ou consentimento de um inscrito?",
        answer:
          "Carrega em Editar na linha da pessoa.\n\n• Nome — actualiza os campos `full_name` e `name` na metadata Auth (o que o site usa para saudações e para mostrar por baixo do email na lista).\n\n• Consentimento — Sim ou Não grava ou actualiza a linha em `promo_alert_prefs` com o email correcto da conta. «Não definido» apaga essa linha: na lista aparece «Não definido» e campanhas em massa não incluem essa pessoa até voltar a haver um registo explícito (por exemplo em «Os teus pedidos» na Conta).\n\nNão podes editar contas que sejam de consultoras (o servidor recusa).",
      },
      {
        id: "eliminar-inscrito",
        question: "Como elimino a conta de um inscrito no site?",
        answer:
          "Carrega em Eliminar, lê o aviso e confirma escrevendo o email completo da pessoa (igual ao da lista, sem sensibilidade a maiúsculas) ou a palavra ELIMINAR.\n\nO sistema apaga primeiro dados ligados ao `user_id` na base pública (wishlist, preferências de promo, actualizações e decisões na área do cliente associadas a esse id), remove o utilizador em Auth e regista um evento mínimo na tabela `crm_subscriber_delete_audit` (quem eliminou, email alvo, quando) — desde que o SQL Sprint 6 esteja aplicado; se falhar o registo, a conta já foi apagada mas convém corrigir o SQL para manter rastre RGPD.\n\nÉ irreversível. As leads com o email da pessoa no CRM podem manter-se como histórico de pedidos; não são apagadas automaticamente.\n\nNão podes eliminar a tua própria sessão nem contas de consultoras.",
      },
      {
        id: "oauth-supabase-checklist",
        question: "O que preciso de saber sobre entrada com Google ou Facebook?",
        answer:
          "O site oferece botões «Continuar com Google» e «Continuar com Facebook» na página de login/registo. Depois do regresso do Google ou da Meta, o utilizador cai no mesmo fluxo que com email: se for cliente, na primeira visita à Conta vê o ecrã de consentimentos antes de ver pedidos.\n\nA configuração dos fornecedores (chaves OAuth, domínios autorizados) faz-se no painel do Supabase e nas consolas Google/Meta — não é editável dentro do CRM. O ficheiro `sql/sprint5_oauth_consent.sql` no projecto resume os passos (redirect URLs, Site URL).\n\nInstagram: não há botão «Entrar com Instagram» porque a API pública da Meta não oferece um fluxo de login estável e genérico como o do Facebook para este caso; quem te segue no Instagram deve criar sessão com Google, Facebook ou email.",
      },
      {
        id: "ver-como-cliente",
        question: "Como funciona «Ver como cliente»?",
        answer:
          "Gera um magic link do Supabase. O link não manda o browser directamente para /conta: primeiro passa por /auth/callback no site (como no login Google ou Facebook). Aí o servidor troca o código de sessão de forma fiável e só depois te redirecciona para a área de cliente (/conta).\n\nIsto é importante: só quando a sessão activa é mesmo a desse cliente é que a página Conta abre normalmente. Se por algum motivo o browser ainda tivesse sessão de consultora, o layout da Conta redireccionaria para o CRM — por isso o fluxo correcto passa sempre por este callback.\n\nAbre preferencialmente numa nova janela ou separador: vês a Conta como a pessoa vê (suporte autorizado; dados pessoais reais).\n\nAntes de gerar, lê o aviso RGPD. O sistema regista na base de dados um evento mínimo: quem pediu (consultora), qual o utilizador alvo e quando.\n\nFecha a janela quando terminares e não partilhes o link.",
      },
      {
        id: "enviar-campanha",
        question: "Como envio uma campanha com desconto e link para o formulário?",
        answer:
          "Selecciona só linhas com opt-in activo (a caixa de selecção está desactivada para os outros). Carrega em «Enviar campanha», preenche título e link da publicação, a percentagem de desconto, a data de expiração da oferta, a base do URL do formulário (normalmente a página inicial do site com endereço completo), e opcionalmente uma publicação interna para referência.\n\nPodes editar o assunto e o corpo do email: usa as variáveis {nome}, {titulo_publicacao}, {link_publicacao}, {percentagem} e {link_formulario}. Esta última é gerada automaticamente por pessoa — inclui um token assinado. Quando a pessoa pede orçamento no site com o mesmo email do token e dentro do prazo, a lead fica ligada à campanha na base de dados.\n\nPara testar: escolhe duas contas com opt-in, envia a campanha e confirma a recepção; submete o formulário a partir do link de uma delas e verifica na lead o campo de campanha (após o SQL Sprint 4 estar aplicado).",
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
