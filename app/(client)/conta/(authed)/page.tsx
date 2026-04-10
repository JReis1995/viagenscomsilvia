import type { Metadata } from "next";

import { ClientLeadNoteForm } from "@/components/conta/client-lead-note-form";
import { parseDetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { leadStatusLabelForClient } from "@/lib/crm/lead-status-client";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pedidos",
  description: "Estado dos teus pedidos de viagem.",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Search = Promise<{ crm?: string }>;

export default async function ContaHomePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { crm } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select(
      "id, nome, telemovel, status, data_pedido, data_envio_orcamento, detalhes_proposta, destino_sonho",
    )
    .order("data_pedido", { ascending: false });

  const { data: myNotesRaw, error: notesError } = await supabase
    .from("lead_client_updates")
    .select("id, lead_id, message, created_at")
    .order("created_at", { ascending: false });

  if (notesError) {
    console.error("[conta] lead_client_updates:", notesError.message);
  }

  type NoteRow = {
    id: string;
    lead_id: string;
    message: string;
    created_at: string;
  };

  const notesByLead = new Map<string, NoteRow[]>();
  for (const n of (notesError ? [] : myNotesRaw) ?? []) {
    const list = notesByLead.get(n.lead_id) ?? [];
    list.push(n);
    notesByLead.set(n.lead_id, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-normal text-ocean-900 md:text-3xl">
          Os teus pedidos
        </h1>
        <p className="mt-2 text-sm text-ocean-600 md:text-base">
          Aqui vês o estado de cada pedido e podes enviar informação extra à
          Sílvia.
        </p>
      </div>

      {crm === "forbidden" ? (
        <div
          className="rounded-2xl border border-ocean-200 bg-ocean-50/80 px-4 py-3 text-sm text-ocean-800"
          role="status"
        >
          O painel CRM é só para a consultora. Esta é a tua área de cliente.
        </div>
      ) : null}

      {leadsError ? (
        <div
          className="rounded-2xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-ocean-900"
          role="alert"
        >
          Não foi possível carregar os pedidos. Se acabaste de aplicar o SQL
          Sprint 1, confirma que o email da conta coincide com o do pedido.
        </div>
      ) : null}

      {!leadsError && (!leads || leads.length === 0) ? (
        <div className="rounded-2xl border border-ocean-100 bg-white p-8 shadow-md">
          <p className="text-ocean-800">
            Ainda não encontrámos pedidos com o email{" "}
            <span className="font-medium">{user?.email}</span>.
          </p>
          <p className="mt-3 text-sm text-ocean-600">
            Usa o <strong className="text-ocean-800">mesmo email</strong> no
            registo que usaste no pedido de proposta da página inicial. Se o
            pedido foi feito
            por outra pessoa, entra com o email desse pedido.
          </p>
        </div>
      ) : null}

      {!leadsError && leads && leads.length > 0 ? (
        <ul className="space-y-8">
          {leads.map((lead) => {
            const proposta = parseDetalhesProposta(lead.detalhes_proposta);
            const notas = notesByLead.get(lead.id) ?? [];

            return (
              <li
                key={lead.id}
                className="rounded-2xl border border-ocean-100 bg-white p-6 shadow-md md:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
                      Pedido
                    </p>
                    <h2 className="mt-1 font-medium text-ocean-900">
                      {lead.destino_sonho?.trim() || "Viagem sob consulta"}
                    </h2>
                    <p className="mt-1 text-sm text-ocean-600">
                      Registado a {formatDate(lead.data_pedido)}
                    </p>
                  </div>
                  <span className="rounded-full border border-ocean-200 bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-800">
                    {leadStatusLabelForClient(lead.status)}
                  </span>
                </div>

                <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-sand/60 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                      Orçamento enviado
                    </dt>
                    <dd className="mt-0.5 text-ocean-900">
                      {lead.data_envio_orcamento
                        ? formatDate(lead.data_envio_orcamento)
                        : "Ainda em preparação — a consultora contacta-te em breve."}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-sand/60 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                      Nome no pedido
                    </dt>
                    <dd className="mt-0.5 text-ocean-900">{lead.nome}</dd>
                  </div>
                  <div className="rounded-xl bg-sand/60 px-3 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                      Telemóvel
                    </dt>
                    <dd className="mt-0.5 text-ocean-900">
                      {lead.telemovel?.trim() ? (
                        <a
                          href={`tel:${lead.telemovel.replace(/\s/g, "")}`}
                          className="font-medium text-ocean-800 underline-offset-2 hover:underline"
                        >
                          {lead.telemovel.trim()}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                </dl>

                {proposta ? (
                  <div className="mt-6 border-t border-ocean-100 pt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                      Última proposta enviada
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-ocean-800">
                      <li>
                        <span className="text-ocean-500">Título: </span>
                        {proposta.titulo}
                      </li>
                      <li>
                        <span className="text-ocean-500">Destino: </span>
                        {proposta.destino}
                      </li>
                      <li>
                        <span className="text-ocean-500">Datas: </span>
                        {proposta.datas}
                      </li>
                      <li>
                        <span className="text-ocean-500">Valor: </span>
                        {proposta.valor_total}
                      </li>
                    </ul>
                  </div>
                ) : null}

                {notas.length > 0 ? (
                  <div className="mt-6 border-t border-ocean-100 pt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ocean-500">
                      As tuas mensagens
                    </p>
                    <ul className="mt-3 space-y-3">
                      {notas.map((n) => (
                        <li
                          key={n.id}
                          className="rounded-xl border border-ocean-100/90 bg-ocean-50/40 px-3 py-2 text-sm text-ocean-800"
                        >
                          <p className="whitespace-pre-wrap">{n.message}</p>
                          <p className="mt-1 text-[11px] text-ocean-500">
                            {formatDate(n.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <ClientLeadNoteForm leadId={lead.id} />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
