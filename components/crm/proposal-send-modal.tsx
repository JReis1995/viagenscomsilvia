"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  parseDetalhesProposta,
  type CapaPreset,
  type PdfCancelamento,
  type PdfDestaque,
  type PdfPrecos,
  type PdfVoos,
} from "@/lib/crm/detalhes-proposta";
import type { LeadBoardRow } from "@/types/lead";

type Props = {
  lead: LeadBoardRow;
  onClose: () => void;
  /** Fecha o modal de proposta e abre o resumo do quiz (ex.: mesmo lead no Kanban). */
  onViewQuiz?: () => void;
};

function parsePipeLinks(raw: string): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf("|");
    if (idx === -1) continue;
    const label = line.slice(0, idx).trim();
    const url = line.slice(idx + 1).trim();
    if (label && url) out.push({ label, url });
  }
  return out;
}

function parseUrlLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCancelRows(raw: string): { periodo: string; condicao: string }[] {
  const out: { periodo: string; condicao: string }[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf("|");
    if (idx === -1) continue;
    const periodo = line.slice(0, idx).trim();
    const condicao = line.slice(idx + 1).trim();
    if (periodo && condicao) out.push({ periodo, condicao });
  }
  return out;
}

function buildPdfVoos(e: {
  tituloRota: string;
  idaTitulo: string;
  idaMeta: string;
  idaPartida: string;
  idaChegada: string;
  voltaTitulo: string;
  voltaMeta: string;
  voltaPartida: string;
  voltaChegada: string;
  bagagem: string;
}): PdfVoos | undefined {
  const leg = (
    titulo: string,
    meta: string,
    partida: string,
    chegada: string,
  ) => {
    const t = titulo.trim();
    const m = meta.trim();
    const p = partida.trim();
    const c = chegada.trim();
    if (!t && !m && !p && !c) return undefined;
    return {
      titulo: t || undefined,
      meta: m || undefined,
      partida: p || undefined,
      chegada: c || undefined,
    };
  };
  const ida = leg(e.idaTitulo, e.idaMeta, e.idaPartida, e.idaChegada);
  const volta = leg(e.voltaTitulo, e.voltaMeta, e.voltaPartida, e.voltaChegada);
  const tr = e.tituloRota.trim();
  const bg = e.bagagem.trim();
  if (!tr && !ida && !volta && !bg) return undefined;
  return {
    titulo_rota: tr || undefined,
    ida,
    volta,
    bagagem: bg || undefined,
  };
}

function buildPdfDestaques(slots: PdfDestaque[]): PdfDestaque[] | undefined {
  const filled = slots.filter((d) => d.titulo.trim() && d.texto.trim());
  return filled.length ? filled : undefined;
}

function buildPdfPrecos(e: {
  linhaResumo: string;
  precoBase: string;
  precoFinal: string;
  notaDesconto: string;
}): PdfPrecos | undefined {
  const linha_resumo = e.linhaResumo.trim();
  const preco_base = e.precoBase.trim();
  const preco_final = e.precoFinal.trim();
  const nota_desconto = e.notaDesconto.trim();
  if (!linha_resumo && !preco_base && !preco_final && !nota_desconto) {
    return undefined;
  }
  return {
    linha_resumo: linha_resumo || undefined,
    preco_base: preco_base || undefined,
    preco_final: preco_final || undefined,
    nota_desconto: nota_desconto || undefined,
  };
}

function buildPdfCancelamento(
  aviso: string,
  linhasRaw: string,
): PdfCancelamento | undefined {
  const linhas = parseCancelRows(linhasRaw);
  const a = aviso.trim();
  if (!a && !linhas.length) return undefined;
  return { aviso: a || undefined, linhas };
}

const CAPA_OPTIONS: { value: CapaPreset; label: string; hint: string }[] = [
  {
    value: "neutral",
    label: "Neutro (viagem genérica)",
    hint: "Sem praia — útil quando o destino ainda não está fechado.",
  },
  {
    value: "praia",
    label: "Praia & mar",
    hint: "Costa, ilhas, resort à beira-mar.",
  },
  {
    value: "cidade",
    label: "Cidade & urbano",
    hint: "City break, arquitectura, vida urbana.",
  },
  {
    value: "montanha",
    label: "Montanha & neve",
    hint: "Alpes, ski, trilhos de altitude.",
  },
  {
    value: "natureza",
    label: "Natureza & campo",
    hint: "Floresta, lagos, paisagem rural.",
  },
  {
    value: "cultura",
    label: "Cultura & património",
    hint: "Museus, história, ruas emblemáticas.",
  },
  {
    value: "familia",
    label: "Família",
    hint: "Viagem pensada para famílias com crianças.",
  },
];

function buildPayload(
  titulo: string,
  destino: string,
  datas: string,
  inclui: string,
  valorTotal: string,
  notas: string,
  atualizarEstado: boolean,
  apenasPrevizualizar: boolean,
  extras: {
    dataInicio: string;
    dataFim: string;
    slugDestino: string;
    lat: string;
    lng: string;
    linksRaw: string;
    galeriaRaw: string;
    capaPreset: CapaPreset;
    capaBannerUrl: string;
    capaAccentUrl: string;
    pdfTextoCapa: string;
    contactoTelefone: string;
    vooTituloRota: string;
    vooIdaTitulo: string;
    vooIdaMeta: string;
    vooIdaPartida: string;
    vooIdaChegada: string;
    vooVoltaTitulo: string;
    vooVoltaMeta: string;
    vooVoltaPartida: string;
    vooVoltaChegada: string;
    vooBagagem: string;
    destaquesSlots: PdfDestaque[];
    precoLinhaResumo: string;
    precoBase: string;
    precoFinal: string;
    precoNotaDesconto: string;
    exclusoesRaw: string;
    cancelAviso: string;
    cancelLinhasRaw: string;
  },
) {
  const links = parsePipeLinks(extras.linksRaw);
  const galeria = parseUrlLines(extras.galeriaRaw);
  const exclusoesList = parseUrlLines(extras.exclusoesRaw);
  const latN = extras.lat.trim() === "" ? null : Number(extras.lat);
  const lngN = extras.lng.trim() === "" ? null : Number(extras.lng);
  const pdf_voos = buildPdfVoos({
    tituloRota: extras.vooTituloRota,
    idaTitulo: extras.vooIdaTitulo,
    idaMeta: extras.vooIdaMeta,
    idaPartida: extras.vooIdaPartida,
    idaChegada: extras.vooIdaChegada,
    voltaTitulo: extras.vooVoltaTitulo,
    voltaMeta: extras.vooVoltaMeta,
    voltaPartida: extras.vooVoltaPartida,
    voltaChegada: extras.vooVoltaChegada,
    bagagem: extras.vooBagagem,
  });
  const pdf_destaques = buildPdfDestaques(extras.destaquesSlots);
  const pdf_precos = buildPdfPrecos({
    linhaResumo: extras.precoLinhaResumo,
    precoBase: extras.precoBase,
    precoFinal: extras.precoFinal,
    notaDesconto: extras.precoNotaDesconto,
  });
  const pdf_cancelamento = buildPdfCancelamento(
    extras.cancelAviso,
    extras.cancelLinhasRaw,
  );
  return {
    titulo,
    destino,
    datas,
    inclui,
    valor_total: valorTotal,
    notas: notas.trim() || undefined,
    atualizar_estado: atualizarEstado,
    apenas_previzualizar: apenasPrevizualizar,
    data_inicio: extras.dataInicio.trim() || null,
    data_fim: extras.dataFim.trim() || null,
    slug_destino: extras.slugDestino.trim() || null,
    latitude:
      latN !== null && !Number.isNaN(latN) ? latN : null,
    longitude:
      lngN !== null && !Number.isNaN(lngN) ? lngN : null,
    links_uteis: links.length ? links : undefined,
    galeria_urls: galeria.length ? galeria : undefined,
    capa_preset: extras.capaPreset,
    capa_banner_url: extras.capaBannerUrl.trim() || null,
    capa_accent_url: extras.capaAccentUrl.trim() || null,
    pdf_texto_capa: extras.pdfTextoCapa.trim() || undefined,
    ...(extras.contactoTelefone.trim()
      ? { contacto_telefone: extras.contactoTelefone.trim() }
      : {}),
    ...(pdf_voos ? { pdf_voos } : {}),
    ...(pdf_destaques ? { pdf_destaques } : {}),
    ...(pdf_precos ? { pdf_precos } : {}),
    ...(exclusoesList.length ? { pdf_exclusoes: exclusoesList } : {}),
    ...(pdf_cancelamento ? { pdf_cancelamento } : {}),
  };
}

export function ProposalSendModal({ lead, onClose, onViewQuiz }: Props) {
  const router = useRouter();
  const prev = parseDetalhesProposta(lead.detalhes_proposta);
  const previewObjectUrlRef = useRef<string | null>(null);

  const [titulo, setTitulo] = useState(
    prev?.titulo ?? "Proposta de viagem personalizada",
  );
  const [destino, setDestino] = useState(
    prev?.destino ?? lead.destino_sonho ?? "",
  );
  const [datas, setDatas] = useState(prev?.datas ?? "");
  const [inclui, setInclui] = useState(prev?.inclui?.join("\n") ?? "");
  const [valorTotal, setValorTotal] = useState(prev?.valor_total ?? "");
  const [notas, setNotas] = useState(prev?.notas ?? "");
  const [atualizarEstado, setAtualizarEstado] = useState(true);
  const [dataInicio, setDataInicio] = useState(prev?.data_inicio ?? "");
  const [dataFim, setDataFim] = useState(prev?.data_fim ?? "");
  const [slugDestino, setSlugDestino] = useState(prev?.slug_destino ?? "");
  const [lat, setLat] = useState(
    prev?.latitude != null ? String(prev.latitude) : "",
  );
  const [lng, setLng] = useState(
    prev?.longitude != null ? String(prev.longitude) : "",
  );
  const [linksRaw, setLinksRaw] = useState(
    prev?.links_uteis?.map((l) => `${l.label} | ${l.url}`).join("\n") ?? "",
  );
  const [galeriaRaw, setGaleriaRaw] = useState(
    prev?.galeria_urls?.join("\n") ?? "",
  );
  const [capaPreset, setCapaPreset] = useState<CapaPreset>(
    prev?.capa_preset ?? "neutral",
  );
  const [capaBannerUrl, setCapaBannerUrl] = useState(
    prev?.capa_banner_url ?? "",
  );
  const [capaAccentUrl, setCapaAccentUrl] = useState(
    prev?.capa_accent_url ?? "",
  );
  const [pdfTextoCapa, setPdfTextoCapa] = useState(
    prev?.pdf_texto_capa ?? "",
  );
  const [contactoTelefone, setContactoTelefone] = useState(
    prev?.contacto_telefone ?? "",
  );

  const pv = prev?.pdf_voos;
  const [vooTituloRota, setVooTituloRota] = useState(pv?.titulo_rota ?? "");
  const [vooIdaTitulo, setVooIdaTitulo] = useState(pv?.ida?.titulo ?? "");
  const [vooIdaMeta, setVooIdaMeta] = useState(pv?.ida?.meta ?? "");
  const [vooIdaPartida, setVooIdaPartida] = useState(pv?.ida?.partida ?? "");
  const [vooIdaChegada, setVooIdaChegada] = useState(pv?.ida?.chegada ?? "");
  const [vooVoltaTitulo, setVooVoltaTitulo] = useState(
    pv?.volta?.titulo ?? "",
  );
  const [vooVoltaMeta, setVooVoltaMeta] = useState(pv?.volta?.meta ?? "");
  const [vooVoltaPartida, setVooVoltaPartida] = useState(
    pv?.volta?.partida ?? "",
  );
  const [vooVoltaChegada, setVooVoltaChegada] = useState(
    pv?.volta?.chegada ?? "",
  );
  const [vooBagagem, setVooBagagem] = useState(pv?.bagagem ?? "");

  const [destaquesSlots, setDestaquesSlots] = useState<PdfDestaque[]>(() => {
    const from = prev?.pdf_destaques ?? [];
    const out: PdfDestaque[] = from.map((d) => ({
      titulo: d.titulo,
      texto: d.texto,
      estilo: d.estilo === "ouro" ? "ouro" : "normal",
    }));
    while (out.length < 6) {
      out.push({ titulo: "", texto: "", estilo: "normal" });
    }
    return out.slice(0, 6);
  });

  const pp = prev?.pdf_precos;
  const [precoLinhaResumo, setPrecoLinhaResumo] = useState(
    pp?.linha_resumo ?? "",
  );
  const [precoBase, setPrecoBase] = useState(pp?.preco_base ?? "");
  const [precoFinal, setPrecoFinal] = useState(pp?.preco_final ?? "");
  const [precoNotaDesconto, setPrecoNotaDesconto] = useState(
    pp?.nota_desconto ?? "",
  );

  const [exclusoesRaw, setExclusoesRaw] = useState(
    prev?.pdf_exclusoes?.join("\n") ?? "",
  );
  const pc = prev?.pdf_cancelamento;
  const [cancelAviso, setCancelAviso] = useState(pc?.aviso ?? "");
  const [cancelLinhasRaw, setCancelLinhasRaw] = useState(
    pc?.linhas?.map((l) => `${l.periodo} | ${l.condicao}`).join("\n") ?? "",
  );

  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extras = {
    dataInicio,
    dataFim,
    slugDestino,
    lat,
    lng,
    linksRaw,
    galeriaRaw,
    capaPreset,
    capaBannerUrl,
    capaAccentUrl,
    pdfTextoCapa,
    contactoTelefone,
    vooTituloRota,
    vooIdaTitulo,
    vooIdaMeta,
    vooIdaPartida,
    vooIdaChegada,
    vooVoltaTitulo,
    vooVoltaMeta,
    vooVoltaPartida,
    vooVoltaChegada,
    vooBagagem,
    destaquesSlots,
    precoLinhaResumo,
    precoBase,
    precoFinal,
    precoNotaDesconto,
    exclusoesRaw,
    cancelAviso,
    cancelLinhasRaw,
  };

  const revokePreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || sending) return;
      e.preventDefault();
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, sending]);

  const invalidatePreview = () => {
    revokePreview();
  };

  async function handlePreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/orcamento`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPayload(
            titulo,
            destino,
            datas,
            inclui,
            valorTotal,
            notas,
            atualizarEstado,
            true,
            extras,
          ),
        ),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Não foi possível gerar a pré-visualização.");
        setPreviewLoading(false);
        return;
      }

      const blob = await res.blob();
      if (blob.type && !blob.type.includes("pdf")) {
        setError("Resposta inválida do servidor.");
        setPreviewLoading(false);
        return;
      }

      revokePreview();
      const url = URL.createObjectURL(blob);
      previewObjectUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      setError("Erro de rede ao gerar o PDF.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!previewUrl) {
      setError("Pré-visualiza o PDF antes de enviar.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/crm/leads/${lead.id}/orcamento`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPayload(
            titulo,
            destino,
            datas,
            inclui,
            valorTotal,
            notas,
            atualizarEstado,
            false,
            extras,
          ),
        ),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Pedido falhou.");
        setSending(false);
        return;
      }

      revokePreview();
      onClose();
      router.refresh();
    } catch {
      setError("Erro de rede. Tenta de novo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/40 p-0 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-[min(100vw,1180px)] flex-col overflow-hidden rounded-none border-0 bg-white shadow-2xl sm:rounded-2xl sm:border sm:border-ocean-100 md:h-[min(100dvh-0.5rem,920px)] md:max-h-[min(100dvh-0.5rem,920px)]">
        <div className="shrink-0 border-b border-ocean-100 px-4 py-3 md:px-5">
          <h2
            id="proposal-modal-title"
            className="font-serif text-xl font-normal text-ocean-900 md:text-2xl"
          >
            Orçamento por email
          </h2>
          <p className="mt-1 text-sm text-ocean-600">
            Cliente:{" "}
            <span className="font-medium text-ocean-800">{lead.email}</span> ·
            Gera o PDF, pré-visualiza e só depois envia.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onViewQuiz ? (
              <button
                type="button"
                onClick={() => onViewQuiz()}
                disabled={sending}
                className="rounded-full border border-ocean-200 bg-sand/50 px-4 py-2 text-xs font-semibold text-ocean-800 transition hover:bg-sand disabled:opacity-50"
              >
                Ver respostas do pedido
              </button>
            ) : null}
            <span className="text-[11px] text-ocean-500">
              <kbd className="rounded border border-ocean-200 bg-ocean-50 px-1.5 py-0.5 font-mono text-[10px] text-ocean-700">
                Esc
              </kbd>{" "}
              fecha
            </span>
          </div>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:min-h-0 lg:grid-cols-[minmax(270px,420px)_minmax(0,1fr)] lg:gap-0"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div className="flex max-h-[min(44vh,380px)] min-h-0 w-full shrink-0 flex-col overflow-y-auto overscroll-contain border-b border-ocean-100 px-3 py-3 sm:max-h-[min(48vh,420px)] lg:max-h-full lg:min-h-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-4">
            {error ? (
              <p
                className="mb-4 rounded-xl border border-terracotta/40 bg-terracotta/10 px-3 py-2 text-sm text-ocean-900"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <p className="mb-4 text-xs text-ocean-500">
              Alterar o formulário invalida a pré-visualização — volta a gerar o
              PDF antes de enviar.
            </p>

            <div className="space-y-3">
              <details
                open
                className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Essencial
                </summary>
                <div className="space-y-4 border-t border-ocean-100 px-3 pb-4 pt-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Título da proposta
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    invalidatePreview();
                  }}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Destino
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    invalidatePreview();
                  }}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Datas / período
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={datas}
                  onChange={(e) => {
                    setDatas(e.target.value);
                    invalidatePreview();
                  }}
                  required
                  placeholder="ex.: 12–19 Julho 2026"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  O que inclui (uma linha por item)
                </span>
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={inclui}
                  onChange={(e) => {
                    setInclui(e.target.value);
                    invalidatePreview();
                  }}
                  rows={4}
                  placeholder="Voos diretos&#10;Alojamento BB&#10;Transfer aeroporto"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Valor total
                </span>
                <input
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={valorTotal}
                  onChange={(e) => {
                    setValorTotal(e.target.value);
                    invalidatePreview();
                  }}
                  required
                  placeholder="ex.: 2 450 € (duas pessoas)"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                  Notas (opcional)
                </span>
                <textarea
                  className="mt-1 min-h-[64px] w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                  value={notas}
                  onChange={(e) => {
                    setNotas(e.target.value);
                    invalidatePreview();
                  }}
                  rows={2}
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ocean-100 bg-ocean-50/50 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={atualizarEstado}
                  onChange={(e) => {
                    setAtualizarEstado(e.target.checked);
                    invalidatePreview();
                  }}
                />
                <span className="text-sm text-ocean-800">
                  Após enviar, passar a lead para{" "}
                  <strong>Proposta enviada</strong>
                </span>
              </label>
                </div>
              </details>

              <details className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Capa do PDF e texto de abertura
                </summary>
                <div className="space-y-4 border-t border-ocean-100 px-3 pb-4 pt-3">
                  <div className="rounded-xl border border-ocean-100 bg-ocean-50/40 px-3 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                      Imagens da capa
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ocean-500">
                      Escolhe o tema ou URLs https. O título da proposta aparece na
                      primeira página do PDF.
                    </p>
                    <label className="mt-3 block">
                      <span className="text-xs font-medium text-ocean-700">
                        Tema da imagem
                      </span>
                      <select
                        className="mt-1 w-full rounded-xl border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900"
                        value={capaPreset}
                        onChange={(e) => {
                          setCapaPreset(e.target.value as CapaPreset);
                          invalidatePreview();
                        }}
                      >
                        {CAPA_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[11px] text-ocean-500">
                        {
                          CAPA_OPTIONS.find((o) => o.value === capaPreset)
                            ?.hint ?? ""
                        }
                      </span>
                    </label>
                    <label className="mt-3 block text-xs">
                      <span className="text-ocean-600">
                        URL da foto de capa (opcional, https)
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                        value={capaBannerUrl}
                        onChange={(e) => {
                          setCapaBannerUrl(e.target.value);
                          invalidatePreview();
                        }}
                        placeholder="Substitui o tema — ex.: link Unsplash ou do teu site"
                      />
                    </label>
                    <label className="mt-2 block text-xs">
                      <span className="text-ocean-600">
                        URL do detalhe no rodapé do PDF (opcional, https)
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                        value={capaAccentUrl}
                        onChange={(e) => {
                          setCapaAccentUrl(e.target.value);
                          invalidatePreview();
                        }}
                        placeholder="Pequena imagem ao canto do rodapé"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                      Texto de abertura na capa (opcional)
                    </span>
                    <textarea
                      className="mt-1 min-h-[88px] w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm text-ocean-900"
                      value={pdfTextoCapa}
                      onChange={(e) => {
                        setPdfTextoCapa(e.target.value);
                        invalidatePreview();
                      }}
                      rows={4}
                      placeholder="Parágrafos separados por linha em branco. Vazio = texto gerado com destino e nome."
                    />
                  </label>
                </div>
              </details>

              <details className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Voos e bagagem (PDF)
                </summary>
                <div className="space-y-3 border-t border-ocean-100 px-3 pb-4 pt-3">
                  <label className="block text-xs">
                    <span className="text-ocean-600">Título da rota</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={vooTituloRota}
                      onChange={(e) => {
                        setVooTituloRota(e.target.value);
                        invalidatePreview();
                      }}
                      placeholder="ex.: Lisboa ↔ Cancún"
                    />
                  </label>
                  <p className="text-[11px] font-semibold text-ocean-600">
                    Ida
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-[11px]">
                      <span className="text-ocean-600">Título do bloco</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooIdaTitulo}
                        onChange={(e) => {
                          setVooIdaTitulo(e.target.value);
                          invalidatePreview();
                        }}
                        placeholder="Voo de ida"
                      />
                    </label>
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-ocean-600">Data e voo (linha)</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooIdaMeta}
                        onChange={(e) => {
                          setVooIdaMeta(e.target.value);
                          invalidatePreview();
                        }}
                        placeholder="Data: … | Voo: …"
                      />
                    </label>
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-ocean-600">Partida</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooIdaPartida}
                        onChange={(e) => {
                          setVooIdaPartida(e.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-ocean-600">Chegada</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooIdaChegada}
                        onChange={(e) => {
                          setVooIdaChegada(e.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] font-semibold text-ocean-600">
                    Regresso
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-[11px]">
                      <span className="text-ocean-600">Título do bloco</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooVoltaTitulo}
                        onChange={(e) => {
                          setVooVoltaTitulo(e.target.value);
                          invalidatePreview();
                        }}
                        placeholder="Voo de regresso"
                      />
                    </label>
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-ocean-600">Data e voo (linha)</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooVoltaMeta}
                        onChange={(e) => {
                          setVooVoltaMeta(e.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-ocean-600">Partida</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooVoltaPartida}
                        onChange={(e) => {
                          setVooVoltaPartida(e.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                    <label className="block text-[11px] sm:col-span-2">
                      <span className="text-ocean-600">Chegada</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={vooVoltaChegada}
                        onChange={(e) => {
                          setVooVoltaChegada(e.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                  </div>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Bagagem / notas de voo</span>
                    <textarea
                      className="mt-1 min-h-[56px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={vooBagagem}
                      onChange={(e) => {
                        setVooBagagem(e.target.value);
                        invalidatePreview();
                      }}
                      rows={2}
                    />
                  </label>
                </div>
              </details>

              <details className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Destaques — cartões no PDF (até 6)
                </summary>
                <div className="space-y-3 border-t border-ocean-100 px-3 pb-4 pt-3">
                  {destaquesSlots.map((d, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-ocean-100 bg-ocean-50/40 p-2.5"
                    >
                      <p className="mb-2 text-[11px] font-semibold text-ocean-600">
                        Cartão {i + 1}
                      </p>
                      <input
                        className="mb-2 w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={d.titulo}
                        placeholder="Título"
                        onChange={(e) => {
                          setDestaquesSlots((prev) =>
                            prev.map((x, j) =>
                              j === i ? { ...x, titulo: e.target.value } : x,
                            ),
                          );
                          invalidatePreview();
                        }}
                      />
                      <textarea
                        className="mb-2 min-h-[52px] w-full rounded-lg border border-ocean-200 px-2 py-1.5 text-sm"
                        value={d.texto}
                        placeholder="Texto"
                        rows={2}
                        onChange={(e) => {
                          setDestaquesSlots((prev) =>
                            prev.map((x, j) =>
                              j === i ? { ...x, texto: e.target.value } : x,
                            ),
                          );
                          invalidatePreview();
                        }}
                      />
                      <label className="flex items-center gap-2 text-[11px] text-ocean-700">
                        <span>Estilo do título:</span>
                        <select
                          className="rounded border border-ocean-200 bg-white px-2 py-1 text-sm"
                          value={d.estilo}
                          onChange={(e) => {
                            const estilo =
                              e.target.value === "ouro" ? "ouro" : "normal";
                            setDestaquesSlots((prev) =>
                              prev.map((x, j) =>
                                j === i ? { ...x, estilo } : x,
                              ),
                            );
                            invalidatePreview();
                          }}
                        >
                          <option value="normal">Normal</option>
                          <option value="ouro">Dourado</option>
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              </details>

              <details className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Preços detalhados no PDF
                </summary>
                <div className="space-y-3 border-t border-ocean-100 px-3 pb-4 pt-3">
                  <label className="block text-xs">
                    <span className="text-ocean-600">Resumo (ex.: para quantas pessoas)</span>
                    <textarea
                      className="mt-1 min-h-[48px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={precoLinhaResumo}
                      onChange={(e) => {
                        setPrecoLinhaResumo(e.target.value);
                        invalidatePreview();
                      }}
                      rows={2}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Preço base (riscado)</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={precoBase}
                      onChange={(e) => {
                        setPrecoBase(e.target.value);
                        invalidatePreview();
                      }}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Preço final na caixa (opcional)</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={precoFinal}
                      onChange={(e) => {
                        setPrecoFinal(e.target.value);
                        invalidatePreview();
                      }}
                      placeholder="Vazio = usa «Valor total»"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Nota sobre desconto</span>
                    <textarea
                      className="mt-1 min-h-[48px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={precoNotaDesconto}
                      onChange={(e) => {
                        setPrecoNotaDesconto(e.target.value);
                        invalidatePreview();
                      }}
                      rows={2}
                    />
                  </label>
                </div>
              </details>

              <details className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Transparência — exclusões e cancelamento
                </summary>
                <div className="space-y-3 border-t border-ocean-100 px-3 pb-4 pt-3">
                  <label className="block text-xs">
                    <span className="text-ocean-600">
                      O que não está incluído (uma linha por item)
                    </span>
                    <textarea
                      className="mt-1 min-h-[72px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={exclusoesRaw}
                      onChange={(e) => {
                        setExclusoesRaw(e.target.value);
                        invalidatePreview();
                      }}
                      rows={3}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Aviso legal (cancelamento)</span>
                    <textarea
                      className="mt-1 min-h-[48px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={cancelAviso}
                      onChange={(e) => {
                        setCancelAviso(e.target.value);
                        invalidatePreview();
                      }}
                      rows={2}
                      placeholder="ex.: bilhetes não reembolsáveis após emissão"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">
                      Tabela — uma linha: prazo | condição
                    </span>
                    <textarea
                      className="mt-1 min-h-[88px] w-full rounded-lg border border-ocean-200 px-2 py-2 font-mono text-[12px]"
                      value={cancelLinhasRaw}
                      onChange={(e) => {
                        setCancelLinhasRaw(e.target.value);
                        invalidatePreview();
                      }}
                      rows={4}
                      placeholder={"Até 30/04/2026 | Gastos de gestão (125€)"}
                    />
                  </label>
                </div>
              </details>

              <details className="rounded-xl border border-ocean-100 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-900">
                  Contacto na última página
                </summary>
                <div className="space-y-2 border-t border-ocean-100 px-3 pb-4 pt-3">
                  <p className="text-[11px] text-ocean-500">
                    Telefone mostrado no PDF. Se vazio, usa{" "}
                    <code className="rounded bg-ocean-100 px-1 text-[10px]">
                      NEXT_PUBLIC_CONSULTORA_TELEFONE_DISPLAY
                    </code>{" "}
                    no servidor.
                  </p>
                  <input
                    className="w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                    value={contactoTelefone}
                    onChange={(e) => {
                      setContactoTelefone(e.target.value);
                      invalidatePreview();
                    }}
                    placeholder="ex.: +351 917 012 869"
                  />
                </div>
              </details>

              <details className="rounded-xl border border-dashed border-ocean-200 bg-white/60 [&_summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-ocean-700">
                  Itinerário digital (área do cliente)
                </summary>
                <div className="border-t border-ocean-200/80 px-3 pb-4 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ocean-500">
                  Campos opcionais
                </p>
                <p className="mt-1 text-[11px] text-ocean-500">
                  Opcional. Aparece na página interativa do pedido (contador,
                  meteo, conteúdos ligados).
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs">
                    <span className="text-ocean-600">Início da viagem</span>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={dataInicio}
                      onChange={(e) => {
                        setDataInicio(e.target.value);
                        invalidatePreview();
                      }}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Fim da viagem</span>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={dataFim}
                      onChange={(e) => {
                        setDataFim(e.target.value);
                        invalidatePreview();
                      }}
                    />
                  </label>
                </div>
                <label className="mt-3 block text-xs">
                  <span className="text-ocean-600">
                    Slug destino (cruzar com publicações)
                  </span>
                  <input
                    className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                    value={slugDestino}
                    onChange={(e) => {
                      setSlugDestino(e.target.value);
                      invalidatePreview();
                    }}
                    placeholder="ex.: maldivas"
                  />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs">
                    <span className="text-ocean-600">Latitude</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={lat}
                      onChange={(e) => {
                        setLat(e.target.value);
                        invalidatePreview();
                      }}
                      placeholder="ex.: 3.2028"
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-ocean-600">Longitude</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                      value={lng}
                      onChange={(e) => {
                        setLng(e.target.value);
                        invalidatePreview();
                      }}
                      placeholder="ex.: 73.2207"
                    />
                  </label>
                </div>
                <label className="mt-3 block text-xs">
                  <span className="text-ocean-600">
                    Links úteis (uma linha: Rótulo | URL)
                  </span>
                  <textarea
                    className="mt-1 min-h-[64px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                    value={linksRaw}
                    onChange={(e) => {
                      setLinksRaw(e.target.value);
                      invalidatePreview();
                    }}
                    placeholder="Check-in do hotel | https://…"
                    rows={2}
                  />
                </label>
                <label className="mt-3 block text-xs">
                  <span className="text-ocean-600">
                    Galeria (URLs de imagens, uma por linha)
                  </span>
                  <textarea
                    className="mt-1 min-h-[64px] w-full rounded-lg border border-ocean-200 px-2 py-2 text-sm"
                    value={galeriaRaw}
                    onChange={(e) => {
                      setGaleriaRaw(e.target.value);
                      invalidatePreview();
                    }}
                    rows={2}
                  />
                </label>
                </div>
              </details>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sand/40 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:min-h-0 lg:px-4 lg:py-4">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-2 lg:pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ocean-600">
                Pré-visualização do PDF
              </p>
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={previewLoading}
                className="rounded-full border border-ocean-300 bg-white px-4 py-2 text-sm font-semibold text-ocean-800 shadow-sm hover:bg-ocean-50 disabled:opacity-60"
              >
                {previewLoading ? "A gerar…" : "Gerar / atualizar PDF"}
              </button>
            </div>

            {previewUrl ? (
              <p className="mb-2 md:hidden">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-ocean-700 underline decoration-ocean-300 underline-offset-2 hover:text-ocean-900"
                >
                  Abrir PDF no browser (recomendado no telemóvel)
                </a>
              </p>
            ) : null}

            <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-xl border border-ocean-200 bg-ocean-900/5 lg:min-h-0">
              {previewUrl ? (
                <iframe
                  title="Pré-visualização do PDF"
                  src={previewUrl}
                  className="absolute inset-0 h-full w-full min-h-[200px] border-0"
                />
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center lg:absolute lg:inset-0 lg:min-h-0">
                  <p className="text-sm text-ocean-600">
                    Clica em{" "}
                    <strong className="text-ocean-800">
                      Gerar / atualizar PDF
                    </strong>{" "}
                    para ver o documento com o branding{" "}
                    <span className="font-mono text-xs text-ocean-700">
                      viagenscomsilvia
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-3 pt-4 pb-1 sm:pb-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-ocean-200 px-5 py-2.5 text-sm font-medium text-ocean-700 hover:bg-white"
                disabled={sending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !previewUrl}
                className="rounded-full bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-50"
                title={
                  !previewUrl
                    ? "Pré-visualiza o PDF antes de enviar"
                    : undefined
                }
              >
                {sending ? "A enviar…" : "Enviar por email com PDF"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
