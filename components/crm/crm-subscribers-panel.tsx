"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ExternalLink,
  Loader2,
  Mail,
  Pencil,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { CrmSubscriberRow } from "@/lib/crm/fetch-crm-subscribers";
import {
  defaultPromoCampaignBody,
  defaultPromoCampaignSubject,
} from "@/lib/crm/promo-campaign-templates";
import {
  deleteCrmSubscriberAction,
  generateImpersonateMagicLinkAction,
  sendPromoCampaignAction,
  updateCrmSubscriberAction,
} from "@/app/(dashboard)/crm/subscribers-actions";

type PostOption = { id: string; titulo: string };

type Props = {
  rows: CrmSubscriberRow[];
  posts: PostOption[];
  defaultFormBase: string;
  canSendCampaigns: boolean;
};

function promoOptInToFormValue(v: boolean | null): "unset" | "true" | "false" {
  if (v === true) return "true";
  if (v === false) return "false";
  return "unset";
}

export function CrmSubscribersPanel({
  rows,
  posts,
  defaultFormBase,
  canSendCampaigns,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [impersonateUser, setImpersonateUser] = useState<CrmSubscriberRow | null>(
    null,
  );
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [editRow, setEditRow] = useState<CrmSubscriberRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editOptIn, setEditOptIn] = useState<"unset" | "true" | "false">("unset");
  const [deleteRow, setDeleteRow] = useState<CrmSubscriberRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingImpersonate, startImpersonate] = useTransition();
  const [pendingSend, startSend] = useTransition();
  const [pendingEdit, startEdit] = useTransition();
  const [pendingDelete, startDelete] = useTransition();

  const [tituloPub, setTituloPub] = useState("");
  const [linkPub, setLinkPub] = useState("");
  const [linkFormBase, setLinkFormBase] = useState(defaultFormBase);
  const [discount, setDiscount] = useState(10);
  const [expiresLocal, setExpiresLocal] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [postId, setPostId] = useState("");
  const [subjectTpl, setSubjectTpl] = useState(defaultPromoCampaignSubject);
  const [bodyTpl, setBodyTpl] = useState(defaultPromoCampaignBody);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.displayName?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, query]);

  const optInSelectable = useMemo(
    () => filtered.filter((r) => r.promoOptIn === true),
    [filtered],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOptIn() {
    setSelected(new Set(optInSelectable.map((r) => r.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function openCampaign() {
    setFeedback(null);
    if (selected.size === 0) {
      setFeedback("Selecciona pelo menos um inscrito com opt-in activo.");
      return;
    }
    setCampaignOpen(true);
  }

  function handleSendCampaign() {
    setFeedback(null);
    const t = tituloPub.trim();
    const pub = linkPub.trim();
    const formBase = linkFormBase.trim();
    if (t.length < 2) {
      setFeedback(
        "Indica o título da publicação (mínimo 2 caracteres) — aparece no email.",
      );
      return;
    }
    if (!pub) {
      setFeedback(
        "Preenche o «Link da publicação»: URL do post ou página (ex.: link do Instagram / artigo). Não é o CAMPAIGN_LINK_SECRET.",
      );
      return;
    }
    if (!formBase) {
      setFeedback(
        "Preenche a «Base do formulário de pedido» (URL do site onde está o formulário).",
      );
      return;
    }
    startSend(async () => {
      const res = await sendPromoCampaignAction({
        recipientUserIds: Array.from(selected),
        titulo_publicacao: tituloPub,
        link_publicacao: linkPub,
        link_formulario_base: linkFormBase,
        discount_percent: discount,
        expires_at: new Date(expiresLocal).toISOString(),
        post_id: postId || "",
        subject: subjectTpl,
        body: bodyTpl,
      });
      if (!res.ok) {
        setFeedback(res.error);
        return;
      }
      setFeedback(
        `Enviados: ${res.sent}. Ignorados (sem opt-in ou erro): ${res.skipped}. Campanha ${res.campaignId.slice(0, 8)}…`,
      );
      setCampaignOpen(false);
      clearSelection();
    });
  }

  function runImpersonate() {
    if (!impersonateUser) return;
    startImpersonate(async () => {
      const res = await generateImpersonateMagicLinkAction({
        targetUserId: impersonateUser.id,
      });
      if (!res.ok) {
        setFeedback(res.error);
        setImpersonateOpen(false);
        return;
      }
      setImpersonateOpen(false);
      setImpersonateUser(null);
      window.open(
        res.url,
        "_blank",
        "noopener,noreferrer",
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ocean-900 md:text-3xl">
            Inscritos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ocean-700">
            Utilizadores com conta no site. Campanhas por email só para quem tem{" "}
            <strong className="font-semibold text-ocean-900">
              consentimentos
            </strong>{" "}
            activo — o mesmo campo é definido no primeiro acesso à Conta
            (consentimentos) e pode ser alterado depois em «Os teus pedidos».
            «Ver como cliente» gera um magic link (sessão real) — uso consciente
            (RGPD). Podes <strong className="font-semibold text-ocean-900">editar</strong>{" "}
            nome na conta e consentimento de promoções, ou{" "}
            <strong className="font-semibold text-ocean-900">eliminar</strong> a conta
            (irreversível, com confirmação explícita).
          </p>
          <p className="mt-2 max-w-2xl text-sm text-ocean-600">
            <strong className="font-medium text-ocean-800">Login social:</strong>{" "}
            no ecrã público de entrada os clientes podem usar Google ou Facebook.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAllOptIn}
            className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm font-medium text-ocean-800 hover:bg-ocean-50"
          >
            Seleccionar com consentimentos activos
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm font-medium text-ocean-800 hover:bg-ocean-50"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={openCampaign}
            disabled={!canSendCampaigns}
            className="inline-flex items-center gap-2 rounded-2xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            Enviar campanha ({selected.size})
          </button>
        </div>
      </div>

      {!canSendCampaigns ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Define{" "}
          <code className="rounded bg-white/80 px-1 text-xs">
            CAMPAIGN_LINK_SECRET
          </code>{" "}
          no servidor (segredo longo e aleatório) para gerar links assinados por
          destinatário. Sem isto, o envio de campanhas fica desactivado.
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-2xl border border-ocean-100 bg-white px-4 py-3 text-sm text-ocean-800 shadow-sm">
          {feedback}
        </div>
      ) : null}

      <div className="rounded-2xl border border-ocean-100 bg-white p-4 shadow-sm md:p-5">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ocean-500">
          Filtrar por email ou nome
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900 outline-none focus:border-ocean-400"
          placeholder="pesquisar…"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ocean-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-ocean-100 text-left text-sm">
          <thead className="bg-ocean-50/50 text-xs font-semibold uppercase tracking-wide text-ocean-600">
            <tr>
              <th className="w-10 px-3 py-3" scope="col">
                <span className="sr-only">Seleccionar</span>
              </th>
              <th className="px-3 py-3" scope="col">
                Email
              </th>
              <th className="px-3 py-3" scope="col">
                Consentimentos
              </th>
              <th className="px-3 py-3" scope="col">
                Registo
              </th>
              <th className="px-3 py-3" scope="col">
                Acções
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-50">
            {filtered.map((r) => {
              const canSelect = r.promoOptIn === true;
              return (
                <tr key={r.id} className="text-ocean-800">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      disabled={!canSelect}
                      onChange={() => toggle(r.id)}
                      title={
                        canSelect
                          ? "Incluir no envio em massa"
                          : "Só inscritos com opt-in explícito podem receber campanhas."
                      }
                      className="h-4 w-4 rounded border-ocean-300 text-ocean-800 disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-ocean-900">
                    {r.email}
                    {r.displayName ? (
                      <span className="mt-0.5 block text-xs font-normal text-ocean-500">
                        {r.displayName}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    {r.promoOptIn === true ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Sim
                      </span>
                    ) : r.promoOptIn === false ? (
                      <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-700">
                        Não
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Não definido
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-ocean-600">
                    {formatDatePt(r.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-[220px] flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditRow(r);
                          setEditName(r.displayName ?? "");
                          setEditOptIn(promoOptInToFormValue(r.promoOptIn));
                          setFeedback(null);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-ocean-200 px-2 py-1 text-xs font-medium text-ocean-800 hover:bg-ocean-50"
                      >
                        <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteRow(r);
                          setDeleteConfirm("");
                          setFeedback(null);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50/80 px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImpersonateUser(r);
                          setImpersonateOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-ocean-200 px-2 py-1 text-xs font-medium text-ocean-800 hover:bg-ocean-50"
                      >
                        <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Ver como cliente
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ocean-500">
            Nenhum resultado.
          </p>
        ) : null}
      </div>

      {editRow ? (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-subscriber-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-ocean-100 bg-white p-5 shadow-xl">
            <h2
              id="edit-subscriber-title"
              className="text-lg font-semibold text-ocean-900"
            >
              Editar inscrito
            </h2>
            <p className="mt-1 break-all text-sm text-ocean-600">{editRow.email}</p>
            <div className="mt-4 space-y-3">
              <Field label="Nome apresentado (metadata da conta)">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={200}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                  placeholder="Nome ou vazio para limpar"
                />
              </Field>
              <Field label="Consentimento — emails promocionais / campanhas">
                <select
                  value={editOptIn}
                  onChange={(e) =>
                    setEditOptIn(e.target.value as "unset" | "true" | "false")
                  }
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                >
                  <option value="unset">Não definido (remove registo interno)</option>
                  <option value="true">Sim — pode receber campanhas</option>
                  <option value="false">Não — sem campanhas</option>
                </select>
              </Field>
              <p className="text-xs text-ocean-500">
                «Não definido» apaga o registo em preferências de promo: na lista
                fica «Não definido» e o servidor não envia campanhas até a pessoa
                voltar a escolher em «Os teus pedidos» (ou completar o fluxo de
                consentimento, se ainda não tiver conta totalmente configurada).
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendingEdit}
                onClick={() => {
                  startEdit(async () => {
                    const res = await updateCrmSubscriberAction({
                      targetUserId: editRow.id,
                      promoOptIn: editOptIn,
                      displayName: editName,
                    });
                    if (!res.ok) {
                      setFeedback(res.error);
                      return;
                    }
                    setEditRow(null);
                    setFeedback("Alterações guardadas.");
                    router.refresh();
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pendingEdit ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteRow ? (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-subscriber-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-xl">
            <h2
              id="delete-subscriber-title"
              className="text-lg font-semibold text-red-950"
            >
              Eliminar conta no site
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ocean-800">
              Vais apagar para sempre a conta Auth de{" "}
              <strong className="break-all">{deleteRow.email}</strong>, incluindo
              wishlist, preferências de promo e mensagens ligadas ao{" "}
              <code className="rounded bg-ocean-50 px-1 text-xs">user_id</code> na
              base de dados.{" "}
              <strong className="text-red-900">Não há anulação.</strong> As leads
              por email no CRM mantêm-se como histórico de pedidos.
            </p>
            <p className="mt-3 text-sm text-ocean-700">
              Para confirmar, escreve o email completo (tal como na lista) ou a
              palavra <span className="font-mono font-semibold">ELIMINAR</span>.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
              placeholder="email ou ELIMINAR"
            />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteRow(null);
                  setDeleteConfirm("");
                }}
                className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendingDelete}
                onClick={() => {
                  startDelete(async () => {
                    const res = await deleteCrmSubscriberAction({
                      targetUserId: deleteRow.id,
                      confirmation: deleteConfirm,
                    });
                    if (!res.ok) {
                      setFeedback(res.error);
                      return;
                    }
                    setSelected((prev) => {
                      const next = new Set(prev);
                      next.delete(deleteRow.id);
                      return next;
                    });
                    setDeleteRow(null);
                    setDeleteConfirm("");
                    setFeedback("Conta eliminada.");
                    router.refresh();
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {pendingDelete ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {campaignOpen ? (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ocean-100 bg-white p-5 shadow-xl">
            <h2
              id="campaign-title"
              className="flex items-center gap-2 text-lg font-semibold text-ocean-900"
            >
              <Mail className="h-5 w-5" aria-hidden />
              Enviar campanha
            </h2>
            <p className="mt-2 text-xs text-ocean-600">
              Só quem tem opt-in recebe o email (revalidado no servidor). Variáveis:{" "}
              {"{nome}"}, {"{titulo_publicacao}"}, {"{link_publicacao}"},{" "}
              {"{percentagem}"}, {"{link_formulario}"}.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Título da publicação" required>
                <input
                  value={tituloPub}
                  onChange={(e) => setTituloPub(e.target.value)}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                  placeholder="Ex.: Maldivas em família"
                  autoComplete="off"
                />
              </Field>
              <Field label="Link da publicação (URL)" required>
                <input
                  type="text"
                  inputMode="url"
                  value={linkPub}
                  onChange={(e) => setLinkPub(e.target.value)}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                  placeholder="https://instagram.com/… ou https://teusite.com/…"
                  autoComplete="url"
                />
              </Field>
              <Field label="Base do formulário de pedido (URL)" required>
                <input
                  type="text"
                  inputMode="url"
                  value={linkFormBase}
                  onChange={(e) => setLinkFormBase(e.target.value)}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                  placeholder="Ex.: https://viagenscomsilvia.pt/"
                  autoComplete="url"
                />
              </Field>
              <Field label="Desconto %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Number.parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Expira em">
                <input
                  type="datetime-local"
                  value={expiresLocal}
                  onChange={(e) => setExpiresLocal(e.target.value)}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Publicação (opcional)">
                <select
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                >
                  <option value="">— nenhuma —</option>
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assunto (modelo)">
                <input
                  value={subjectTpl}
                  onChange={(e) => setSubjectTpl(e.target.value)}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Corpo (modelo)">
                <textarea
                  value={bodyTpl}
                  onChange={(e) => setBodyTpl(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm font-mono"
                />
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setCampaignOpen(false)}
                className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-medium text-ocean-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendingSend}
                onClick={() => handleSendCampaign()}
                className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pendingSend ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {impersonateOpen && impersonateUser ? (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-ocean-100 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-ocean-900">
              Sessão como cliente
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ocean-700">
              Vais abrir uma <strong>nova janela</strong> com sessão autenticada
              como <strong>{impersonateUser.email}</strong>. Isto acede a dados
              pessoais reais: usa só para suporte autorizado. O sistema regista
              este acesso (consultora, utilizador alvo, data).
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setImpersonateOpen(false);
                  setImpersonateUser(null);
                }}
                className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendingImpersonate}
                onClick={() => runImpersonate()}
                className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pendingImpersonate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Gerar link e abrir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ocean-600">
        {label}
        {required ? (
          <span className="text-terracotta" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function formatDatePt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
