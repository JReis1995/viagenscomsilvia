import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Primeiros passos",
  description: "Checklist técnica do painel CRM.",
};

export const dynamic = "force-dynamic";

const VERCEL_CRON_DOCS =
  "https://vercel.com/docs/cron-jobs";

const RESEND_RECEIVING_DOCS =
  "https://resend.com/docs/dashboard/receiving/introduction";

const RESEND_WEBHOOKS_DOCS =
  "https://resend.com/docs/dashboard/webhooks/introduction";

export default function CrmPrimeirosPassosPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h1 className="font-serif text-2xl font-normal tracking-tight text-ocean-900 md:text-3xl">
          Primeiros passos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ocean-600 md:text-base">
          Checklist para o site e o CRM funcionarem sem surpresas. Cada passo
          abre mais detalhe — podes ir marcando mentalmente à medida que
          confirmas.
        </p>
      </div>

      <ol className="space-y-4">
        <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Passo 1
          </p>
          <h2 className="mt-1 font-semibold text-ocean-900">
            Variáveis de ambiente no servidor
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            O CRM e o envio de emails leem estas chaves no servidor (por
            exemplo Vercel → Settings → Environment Variables). Sem elas,
            vês erros genéricos ou emails que não saem.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ocean-800">
            <li>
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              — o painel usa-a só no servidor para listar leads sem depender
              das políticas RLS. O cron de lembretes também precisa dela.
            </li>
            <li>
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              e{" "}
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              — login e cliente público.
            </li>
            <li>
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                RESEND_API_KEY
              </code>{" "}
              e{" "}
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                RESEND_FROM
              </code>{" "}
              — envio de orçamentos e notificações (Resend).
            </li>
            <li>
              Opcional —{" "}
              <strong className="font-medium text-ocean-800">
                respostas automáticas no CRM
              </strong>
              :{" "}
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                RESEND_WEBHOOK_SECRET
              </code>{" "}
              (assinatura do webhook) e{" "}
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                RESEND_INBOUND_REPLY_TO
              </code>{" "}
              (endereço que a Resend recebe, ex.{" "}
              <code className="rounded bg-ocean-50 px-1 text-[11px]">
                respostas@teudominio.com
              </code>
              ) — ver passo 4.
            </li>
            <li>
              <code className="rounded bg-ocean-50 px-1.5 py-0.5 text-xs">
                CRON_SECRET
              </code>{" "}
              — protege o endpoint do cron (Authorization: Bearer).
            </li>
          </ul>
          <p className="mt-3 text-xs text-ocean-500">
            Perspectiva futura: com políticas RLS bem definidas para a
            consultora, pode ser possível reduzir o uso da service role no
            carregamento do CRM e simplificar o deploy para quem não é técnica.
          </p>
        </li>

        <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Passo 2
          </p>
          <h2 className="mt-1 font-semibold text-ocean-900">
            Cron de follow-up configurado
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            O lembrete automático a leads em «Nova Lead» corre via GET
            protegido:
          </p>
          <code className="mt-2 block overflow-x-auto rounded-lg bg-ocean-950 px-3 py-2 text-xs text-ocean-100">
            /api/cron/follow-up
          </code>
          <p className="mt-3 text-sm text-ocean-600">
            Na Vercel, agenda um Cron Job diário para esse URL com o header{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              Authorization: Bearer {"{"}CRON_SECRET{"}"}
            </code>
            . Opcional:{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              FOLLOWUP_LEAD_MIN_DAYS
            </code>{" "}
            (dias mínimos antes de enviar; omissão 3). SQL relacionado:{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              sql/add_lead_data_ultimo_followup.sql
            </code>
            .
          </p>
          <a
            href={VERCEL_CRON_DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-ocean-800 underline underline-offset-2"
          >
            Documentação Vercel — Cron Jobs
          </a>
        </li>

        <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Passo 3
          </p>
          <h2 className="mt-1 font-semibold text-ocean-900">
            Testar envio de orçamento
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Em{" "}
            <Link href="/crm" className="font-medium text-ocean-800 underline">
              Leads
            </Link>
            , abre uma lead de teste (ou cria um pedido no site), usa{" "}
            <strong className="font-medium text-ocean-800">
              Enviar orçamento (PDF + email)
            </strong>
            , pré-visualiza o PDF e envia. Confirma que o email chegou e que a
            data de envio aparece no cartão.
          </p>
        </li>

        <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Passo 4
          </p>
          <h2 className="mt-1 font-semibold text-ocean-900">
            Receber respostas por email no CRM (automático)
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Objetivo: quando a lead responde a um email enviado pelo site/CRM, a
            mensagem aparece no <strong className="font-medium text-ocean-800">histórico</strong>{" "}
            com badge <strong className="font-medium text-ocean-800">Recebido</strong> e o cartão ganha{" "}
            <strong className="font-medium text-ocean-800">anel verde</strong> nas últimas 72h.
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-ocean-800">
            <li>
              No Supabase, garante a migração{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">
                sql/add_lead_crm_emails_inbound.sql
              </code>{" "}
              (coluna <code className="rounded bg-ocean-50 px-1 text-xs">direction</code>{" "}
              aceita <code className="rounded bg-ocean-50 px-1 text-xs">inbound</code>).
            </li>
            <li>
              Na Resend, com o <strong>mesmo domínio</strong> já usado em{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">RESEND_FROM</code>, ativa{" "}
              <strong>Receiving / Inbound</strong> e cria um endereço (ex.{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">
                respostas@teudominio.com
              </code>
              ). Segue o assistente da Resend (registos MX se pedidos).{" "}
              <a
                href={RESEND_RECEIVING_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ocean-800 underline underline-offset-2"
              >
                Documentação Receiving
              </a>
              .
            </li>
            <li>
              Em <strong>Webhooks</strong> na Resend, cria um endpoint apontando para a
              URL pública de produção:{" "}
              <code className="break-all rounded bg-ocean-950 px-2 py-1 text-xs text-ocean-100">
                https://teu-dominio.vercel.app/api/webhooks/resend
              </code>
              , com o evento{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">email.received</code>. Copia o{" "}
              <strong>signing secret</strong> para a variável{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">
                RESEND_WEBHOOK_SECRET
              </code>{" "}
              na Vercel (Production).{" "}
              <a
                href={RESEND_WEBHOOKS_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ocean-800 underline underline-offset-2"
              >
                Webhooks Resend
              </a>
              .
            </li>
            <li>
              Na Vercel, define também{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">
                RESEND_INBOUND_REPLY_TO
              </code>{" "}
              com <strong>exactamente</strong> o mesmo endereço de inbound (ex.{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">
                respostas@teudominio.com
              </code>
              ).               Assim, os emails de <strong>boas-vindas do formulário</strong>,{" "}
              <strong>orçamento PDF</strong> e <strong>mensagem pelo CRM</strong> usam esse
              Reply-To: a resposta da lead entra na Resend → o webhook grava o texto na
              lead (associação pelo <strong>email do remetente</strong> = lead mais recente
              com esse email).
            </li>
            <li>
              Faz deploy, envia um email de teste a partir do CRM para uma lead de
              teste e responde a esse email. Confirma nos logs da Vercel (rota{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">/api/webhooks/resend</code>
              ) e no histórico da lead. Se não definires{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">
                RESEND_INBOUND_REPLY_TO
              </code>
              , o Reply-To continua a ser o teu email pessoal — aí as respostas{" "}
              <strong>não</strong> passam pela Resend; usa{" "}
              <strong>Registar resposta recebida</strong> no detalhe da lead.
            </li>
          </ol>
        </li>

        <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Extra
          </p>
          <h2 className="mt-1 font-semibold text-ocean-900">
            Notas internas nas leads
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Se ao gravar notas vires erro de coluna em falta, executa no
            Supabase:{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              sql/add_lead_notas_internas.sql
            </code>
            .
          </p>
        </li>

        <li className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
            Extra
          </p>
          <h2 className="mt-1 font-semibold text-ocean-900">
            Email à lead (Resend + histórico)
          </h2>
          <p className="mt-2 text-sm text-ocean-600">
            Para enviar mensagens a partir do CRM e ver o texto no histórico,
            define{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              RESEND_API_KEY
            </code>{" "}
            e{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">RESEND_FROM</code>
            . SQL:{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              sql/add_lead_crm_emails.sql
            </code>
            . Respostas automáticas: passo 4 acima.
          </p>
        </li>
      </ol>

      <p className="text-center text-sm text-ocean-600">
        <Link
          href="/crm"
          className="font-medium text-ocean-800 underline underline-offset-2"
        >
          ← Voltar ao quadro de leads
        </Link>
      </p>
    </div>
  );
}
