"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { displayPostTitle } from "@/lib/marketing/hero-destinos";
import {
  formatJanelaDatasLabel,
  parsePedidoDataIso,
} from "@/lib/marketing/pedido-datas-url";
import { PublicacaoPassageirosForm } from "@/components/marketing/publicacao-passageiros-form";
import {
  campaignTokenPayloadForLead,
  stashCampaignTokenFromSearchParams,
} from "@/lib/marketing/campaign-token-client";
import { getLeadMarketingAttributionPayload } from "@/lib/marketing/session-attribution";
import type { SiteContent } from "@/lib/site/site-content";
import type { PublishedPost } from "@/types/post";
import type { PedidoOrcamentoPrefill } from "@/lib/marketing/pedido-orcamento";

type Props = {
  selectedPost: PublishedPost | null;
  quizCopy: SiteContent["quiz"];
  prefill?: PedidoOrcamentoPrefill | null;
};

function parseKidsAges(raw: string): number[] {
  return raw
    .split(",")
    .map((v) => Number.parseInt(v.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 17)
    .slice(0, 10);
}

export function PedidoDetalheExperience({
  selectedPost,
  quizCopy,
  prefill = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [adultos, setAdultos] = useState(searchParams.get("pedido_adultos") ?? "2");
  const [criancas, setCriancas] = useState(searchParams.get("pedido_criancas") ?? "0");
  const [idadesCriancas, setIdadesCriancas] = useState<number[]>(() => {
    const fromQuery = parseKidsAges(searchParams.get("pedido_idades_criancas") ?? "");
    const kids = Number.parseInt(searchParams.get("pedido_criancas") ?? "0", 10);
    if (!Number.isFinite(kids) || kids <= 0) return [];
    if (fromQuery.length >= kids) return fromQuery.slice(0, kids);
    return [...fromQuery, ...Array.from({ length: kids - fromQuery.length }, () => 7)];
  });
  const [pets, setPets] = useState(searchParams.get("pedido_animais_estimacao") ?? "");
  const [inicio, setInicio] = useState(searchParams.get("pedido_data_inicio") ?? "");
  const [fim, setFim] = useState(searchParams.get("pedido_data_fim") ?? "");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telemovel, setTelemovel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [querTransferes, setQuerTransferes] = useState(true);
  const [querSeguro, setQuerSeguro] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  const datasResumo = formatJanelaDatasLabel(
    parsePedidoDataIso(inicio),
    parsePedidoDataIso(fim),
  );
  const destinoResumo =
    prefill?.destinoSonho?.trim() ||
    selectedPost?.titulo?.trim() ||
    searchParams.get("pedido_destino")?.trim() ||
    "Destino por definir";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sb = createClient();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (cancelled || !user) return;
        setIsAuthed(true);
        setEmail(user.email ?? "");
        const fullName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : "";
        if (fullName.trim()) setNome(fullName.trim());
      } catch {
        /* sem bloqueio */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    stashCampaignTokenFromSearchParams(searchParams);
    getLeadMarketingAttributionPayload();
  }, [searchParams]);

  function syncKidAgesForCount(rawCount: string) {
    const c = Number.parseInt(rawCount || "0", 10);
    if (!Number.isFinite(c) || c <= 0) {
      setIdadesCriancas([]);
      return;
    }
    setIdadesCriancas((prev) => {
      if (prev.length === c) return prev;
      if (prev.length > c) return prev.slice(0, c);
      return [...prev, ...Array.from({ length: c - prev.length }, () => 7)];
    });
  }

  function syncUrl() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pedido_adultos", adultos || "2");
    params.set("pedido_criancas", criancas || "0");
    if (idadesCriancas.length > 0) {
      params.set("pedido_idades_criancas", idadesCriancas.join(","));
    } else {
      params.delete("pedido_idades_criancas");
    }
    if (pets === "sim" || pets === "nao") params.set("pedido_animais_estimacao", pets);
    else params.delete("pedido_animais_estimacao");
    if (parsePedidoDataIso(inicio)) params.set("pedido_data_inicio", inicio);
    else params.delete("pedido_data_inicio");
    if (parsePedidoDataIso(fim)) params.set("pedido_data_fim", fim);
    else params.delete("pedido_data_fim");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const loginHref = `/login?next=${encodeURIComponent(`${pathname}?${searchParams.toString()}`)}`;

  async function handleSubmitLead() {
    setMsg(null);
    if (nome.trim().length < 2) {
      setMsg("Indica o teu nome.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg("Indica um email válido.");
      return;
    }
    const telDigits = telemovel.replace(/\D/g, "");
    if (telemovel.trim() && (telDigits.length < 9 || telDigits.length > 15)) {
      setMsg("Telemóvel inválido (9 a 15 dígitos).");
      return;
    }
    const adultosNum = Number.parseInt(adultos || "2", 10);
    const criancasNum = Number.parseInt(criancas || "0", 10);
    setBusy(true);
    try {
      const linhasExtras: string[] = [];
      if (querTransferes) linhasExtras.push("Inclui transferes");
      if (querSeguro) linhasExtras.push("Adicionar seguro de viagem");
      if (observacoes.trim()) linhasExtras.push(`Notas: ${observacoes.trim()}`);
      const resumo =
        `${destinoResumo}\n\n` +
        `Dados do pedido: ${adultosNum} adulto(s)` +
        `${criancasNum > 0 ? `, ${criancasNum} criança(s)` : ""}` +
        `${idadesCriancas.length > 0 ? `, idades: ${idadesCriancas.join(", ")}` : ""}` +
        `${pets === "sim" ? ", com animais" : pets === "nao" ? ", sem animais" : ""}` +
        `${datasResumo ? `\n${datasResumo}` : ""}` +
        `${linhasExtras.length > 0 ? `\n\n${linhasExtras.join("\n")}` : ""}`;

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_rapido: true,
          nome: nome.trim(),
          email: email.trim(),
          telemovel: telemovel.trim(),
          destino_sonho: resumo.slice(0, 300),
          janela_datas: datasResumo ?? undefined,
          pedido_adultos: Number.isFinite(adultosNum) ? adultosNum : undefined,
          pedido_criancas: Number.isFinite(criancasNum) ? criancasNum : undefined,
          pedido_idades_criancas:
            idadesCriancas.length > 0 ? idadesCriancas : undefined,
          pedido_animais_estimacao:
            pets === "sim" ? true : pets === "nao" ? false : undefined,
          website_url: "",
          ...getLeadMarketingAttributionPayload(),
          ...campaignTokenPayloadForLead(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(
          data.error ??
            quizCopy.duplicateOpenLeadMessage.trim() ??
            "Não foi possível enviar o pedido.",
        );
        return;
      }
      router.push("/obrigado");
    } catch {
      setMsg("Erro de rede. Tenta novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-sand px-5 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-ocean-700 hover:text-ocean-900">
            ← Voltar ao site
          </Link>
          <Link href={loginHref} className="text-sm font-semibold text-ocean-700 underline">
            Entrar / criar conta
          </Link>
        </div>

        <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-500">
            Detalhe da oferta
          </p>
          <h1 className="mt-2 font-serif text-3xl text-ocean-900">
            {selectedPost ? displayPostTitle(selectedPost.titulo) : "Pedir proposta personalizada"}
          </h1>
          {selectedPost?.descricao?.trim() ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ocean-700">
              {selectedPost.descricao.trim()}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedPost?.preco_desde?.trim() ? (
              <span className="rounded-full bg-ocean-900 px-3 py-1 text-xs font-semibold text-white">
                Desde {selectedPost.preco_desde.trim()}
              </span>
            ) : null}
            {typeof selectedPost?.pets_allowed === "boolean" ? (
              <span className="rounded-full bg-ocean-100 px-3 py-1 text-xs font-semibold text-ocean-800">
                {selectedPost.pets_allowed ? "Aceita animais" : "Sem animais"}
              </span>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-serif text-2xl text-ocean-900">Confirma os teus dados de viagem</h2>
          <p className="mt-2 text-sm text-ocean-600">
            Ajusta datas, passageiros, idades e animais antes de submeteres o pedido.
          </p>
          <div className="mt-4">
            <PublicacaoPassageirosForm
              inicio={inicio}
              fim={fim}
              adultos={adultos}
              criancas={criancas}
              idadesCriancas={idadesCriancas}
              pets={pets}
              onInicioChange={setInicio}
              onFimChange={setFim}
              onAdultosChange={setAdultos}
              onCriancasChange={(value) => {
                setCriancas(value);
                syncKidAgesForCount(value);
              }}
              onIdadeCriancaChange={(index, value) => {
                setIdadesCriancas((prev) => prev.map((x, i) => (i === index ? value : x)));
              }}
              onPetsChange={setPets}
            />
          </div>
          {datasResumo ? <p className="mt-3 text-xs text-ocean-500">{datasResumo}</p> : null}
          <button type="button" onClick={() => { syncUrl(); setStep(2); }} className="mt-4 rounded-xl bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean-800">
            Continuar
          </button>
        </section>

        {step === 2 ? (
          <section id="pedido-orcamento" className="scroll-mt-20 rounded-3xl border border-ocean-100 bg-white p-5 shadow-sm md:p-7">
            <h2 className="font-serif text-2xl text-ocean-900">Dados de contacto e confirmação</h2>
            {!isAuthed ? (
              <p className="mt-2 text-sm text-ocean-600">
                Tens conta?{" "}
                <Link href={loginHref} className="font-semibold text-ocean-800 underline">
                  Entrar / criar conta
                </Link>{" "}
                acelera o processo, mas podes continuar sem conta.
              </p>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-ocean-700">
                Nome
                <input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2" />
              </label>
              <label className="text-sm text-ocean-700">
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2" />
              </label>
              <label className="text-sm text-ocean-700 md:col-span-2">
                Telemóvel (opcional)
                <input value={telemovel} onChange={(e) => setTelemovel(e.target.value)} className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2" />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-ocean-100 bg-ocean-50/40 p-4">
              <p className="text-sm font-semibold text-ocean-900">Confirmação do pedido</p>
              <p className="mt-1 text-sm text-ocean-700">
                {destinoResumo} · {adultos} adulto(s){Number.parseInt(criancas || "0", 10) > 0 ? ` · ${criancas} criança(s)` : ""}
                {datasResumo ? ` · ${datasResumo}` : ""}
              </p>
              <div className="mt-3 grid gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-ocean-700">
                  <input type="checkbox" checked={querTransferes} onChange={(e) => setQuerTransferes(e.target.checked)} />
                  Quero proposta com transferes
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-ocean-700">
                  <input type="checkbox" checked={querSeguro} onChange={(e) => setQuerSeguro(e.target.checked)} />
                  Quero opção com seguro
                </label>
              </div>
              <label className="mt-3 block text-sm text-ocean-700">
                Informações adicionais
                <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2" placeholder="Ex.: regime alimentar, tipo de quarto, horários, preferências..." />
              </label>
            </div>
            {msg ? <p className="mt-3 text-sm text-terracotta">{msg}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-ocean-200 px-4 py-2 text-sm font-semibold text-ocean-800">
                Voltar
              </button>
              <button type="button" disabled={busy} onClick={() => void handleSubmitLead()} className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? "A enviar..." : "Confirmar e enviar pedido"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
