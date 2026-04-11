import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Primeiros passos",
  description: "Checklist técnica do painel CRM.",
};

export const dynamic = "force-dynamic";

const VERCEL_CRON_DOCS =
  "https://vercel.com/docs/cron-jobs";

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
            Para enviar mensagens a partir do CRM (sem abrir Gmail) e ver o
            texto no histórico, define{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              RESEND_API_KEY
            </code>{" "}
            e{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">RESEND_FROM</code>{" "}
            no servidor. Se a gravação falhar por tabela em falta, executa no
            Supabase:{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              sql/add_lead_crm_emails.sql
            </code>{" "}
            e, para gravar respostas recebidas,{" "}
            <code className="rounded bg-ocean-50 px-1 text-xs">
              sql/add_lead_crm_emails_inbound.sql
            </code>
            .
          </p>
          <p className="mt-2 text-sm text-ocean-600">
            Respostas por email: por omissão o cliente responde à tua caixa
            (Reply-To). Usa o bloco{" "}
            <strong className="font-medium text-ocean-800">
              Registar resposta recebida
            </strong>{" "}
            no detalhe da lead, ou configura{" "}
            <a
              href="https://resend.com/docs/dashboard/receiving/introduction"
              className="font-medium text-ocean-800 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resend Inbound
            </a>{" "}
            com webhook{" "}
            <code className="rounded bg-ocean-50 px-1 text-[11px]">
              POST …/api/webhooks/resend
            </code>{" "}
            e{" "}
            <code className="rounded bg-ocean-50 px-1 text-[11px]">
              RESEND_WEBHOOK_SECRET
            </code>{" "}
            (o remetente do email tem de existir como lead — associação pela
            lead mais recente com o mesmo email).
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
