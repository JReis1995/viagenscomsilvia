"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { sendLeadCrmEmailAction } from "@/app/(dashboard)/crm/actions";
import {
  CRM_EMAIL_TEMPLATE_OPTIONS,
  defaultCrmEmailTemplateFromPreset,
  getCrmEmailDraftForLead,
  type CrmEmailTemplateId,
} from "@/lib/email/crm-email-templates";
import type { LeadBoardRow } from "@/types/lead";

export type EmailComposePreset =
  | "free"
  | "followup"
  | "initial_followup_reminder";

type Props = {
  lead: LeadBoardRow;
  preset: EmailComposePreset;
  onClose: () => void;
};

export function LeadEmailComposeModal({ lead, preset, onClose }: Props) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<CrmEmailTemplateId>(() =>
    defaultCrmEmailTemplateFromPreset(preset),
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const prevLeadIdRef = useRef<string | undefined>(undefined);
  const prevPresetRef = useRef<EmailComposePreset | undefined>(undefined);

  useEffect(() => {
    const leadSwitch =
      prevLeadIdRef.current !== undefined &&
      prevLeadIdRef.current !== lead.id;
    const presetSwitch =
      prevPresetRef.current !== undefined && prevPresetRef.current !== preset;

    let activeTemplate = templateId;
    if (
      prevLeadIdRef.current === undefined ||
      leadSwitch ||
      presetSwitch
    ) {
      activeTemplate = defaultCrmEmailTemplateFromPreset(preset);
      setTemplateId(activeTemplate);
    }

    prevLeadIdRef.current = lead.id;
    prevPresetRef.current = preset;

    const d = getCrmEmailDraftForLead(lead, activeTemplate);
    setSubject(d.subject);
    setBody(d.body);
    setError(null);
  }, [lead.id, preset, templateId, lead.nome, lead.destino_sonho]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      if (!pending) onClose();
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, pending]);

  function submit() {
    setError(null);
    startTransition(() => {
      void (async () => {
        const res = await sendLeadCrmEmailAction(lead.id, subject, body, {
          markFollowupReminderSent:
            templateId === "initial_followup_reminder",
        });
        if (res.ok) {
          router.refresh();
          onClose();
        } else {
          setError(res.error);
        }
      })();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ocean-950/50 p-0 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-compose-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={() => (!pending ? onClose() : undefined)}
      />
      <div className="relative z-10 flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ocean-100 bg-white shadow-xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-ocean-100 px-4 py-3 sm:px-5">
          <h2
            id="email-compose-title"
            className="font-serif text-lg text-ocean-900"
          >
            Email à lead
          </h2>
          <p className="mt-1 text-xs text-ocean-600">
            Envia via Resend (marca viagenscomsilvia). Para:{" "}
            <span className="font-mono text-ocean-800">{lead.email}</span>
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5">
          <label className="block text-xs font-medium text-ocean-700">
            Modelo de mensagem
            <select
              value={templateId}
              onChange={(e) =>
                setTemplateId(e.target.value as CrmEmailTemplateId)
              }
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
            >
              {CRM_EMAIL_TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] leading-snug text-ocean-500">
            O email enviado inclui automaticamente uma assinatura discreta (site,
            Instagram, TikTok, contacto) e um atalho para a área de cliente
            (/conta). Podes alterar o assunto e o texto abaixo como quiseres
            antes de enviar.
            {templateId === "initial_followup_reminder" ? (
              <>
                {" "}
                Com o modelo «Lembrete inicial», após enviar com sucesso o sistema
                regista a data do lembrete na ficha (como o cron), para não
                voltar a enviar o automático logo a seguir com o mesmo tipo de
                mensagem.
              </>
            ) : null}
          </p>
          <label className="block text-xs font-medium text-ocean-700">
            Assunto
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={pending}
              className="mt-1 w-full rounded-lg border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
            />
          </label>
          <label className="block text-xs font-medium text-ocean-700">
            Mensagem
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              disabled={pending}
              className="mt-1 w-full resize-y rounded-lg border border-ocean-200 px-3 py-2 text-sm text-ocean-900 shadow-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-200 disabled:opacity-60"
            />
          </label>
          {error ? (
            <p className="rounded-lg border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-xs text-ocean-900">
              {error}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 space-y-2 border-t border-ocean-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={pending || !subject.trim() || !body.trim()}
            onClick={() => submit()}
            className="w-full rounded-xl bg-ocean-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-800 disabled:opacity-50"
          >
            {pending ? "A enviar…" : "Enviar email"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="w-full rounded-xl border border-ocean-200 py-2 text-sm font-medium text-ocean-800 hover:bg-ocean-50 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
