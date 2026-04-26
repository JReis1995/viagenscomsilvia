"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  createCrmPostAction,
  createCrmPostDraftAction,
  deleteCrmPostAction,
  updateCrmPostAction,
  type CrmPostInput,
} from "@/app/(dashboard)/crm/actions";
import {
  createPostExtraAction,
  createPostFlightOptionAction,
  createPostHotelAction,
  createPostHotelMediaAction,
  createPostHotelRoomOptionAction,
  deletePostExtraAction,
  deletePostFlightOptionAction,
  deletePostHotelAction,
  deletePostHotelMediaAction,
  deletePostHotelRoomOptionAction,
  listPostVariantsAction,
  reorderPostExtrasAction,
  reorderPostFlightOptionsAction,
  reorderPostHotelsAction,
  updatePostExtraAction,
  updatePostFlightOptionAction,
  updatePostHotelAction,
  updatePostHotelRoomOptionAction,
} from "@/app/(dashboard)/crm/actions/post-variants";
import { PostCardPreview } from "@/components/crm/post-card-preview";
import { createClient } from "@/lib/supabase/client";
import {
  getYoutubeThumbnailUrl,
  getYoutubeVideoId,
  isDirectVideoFileUrl,
} from "@/lib/marketing/media";

export type CrmPostRow = {
  id: string;
  tipo: string;
  slug?: string | null;
  titulo: string;
  descricao: string | null;
  media_url: string;
  preco_desde: string | null;
  preco_base_eur?: number | null;
  has_variants?: boolean;
  link_cta: string | null;
  status: boolean;
  data_publicacao: string;
  data_fim_publicacao?: string | null;
  ordem_site: number | null;
  membros_apenas?: boolean | null;
  slug_destino?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  feed_vibe_slugs?: string[] | null;
  hover_line?: string | null;
  pets_allowed?: boolean | null;
  capacidade_min?: number | null;
  capacidade_max?: number | null;
};

type Props = {
  initialPosts: CrmPostRow[];
};

type HotelMediaRow = {
  id: string;
  ordem: number;
  kind: "image" | "video";
  url: string;
  alt: string | null;
};

type HotelRow = {
  id: string;
  ordem: number;
  nome: string;
  descricao: string | null;
  regime: string | null;
  condicoes: string | null;
  site_url: string | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  capacidade_min: number | null;
  capacidade_max: number | null;
  pets_allowed: boolean | null;
  status: boolean;
  media: HotelMediaRow[];
  room_options: HotelRoomOptionRow[];
};

type HotelRoomOptionRow = {
  id: string;
  ordem: number;
  nome: string;
  capacidade_adultos: number | null;
  capacidade_criancas: number | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  status: boolean;
};

type ExtraRow = {
  id: string;
  ordem: number;
  tipo:
    | "transfer"
    | "guia"
    | "seguro"
    | "experiencia"
    | "viatura_aluguer"
    | "custom";
  nome: string;
  descricao: string | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  pets_allowed: boolean | null;
  default_selected: boolean;
  status: boolean;
};

type FlightRow = {
  id: string;
  ordem: number;
  label: string;
  origem_iata: string | null;
  destino_iata: string | null;
  data_partida: string | null;
  data_regresso: string | null;
  cia: string | null;
  classe: "economy" | "premium_economy" | "business" | "first" | null;
  bagagem_text: string | null;
  descricao: string | null;
  preco_delta_eur: number | null;
  preco_label: string | null;
  pets_allowed: boolean | null;
  status: boolean;
};

type HotelDraft = {
  nome: string;
  descricao: string;
  regime: string;
  condicoes: string;
  site_url: string;
  preco_delta_eur: string;
  preco_label: string;
  pets_allowed: "indiferente" | "sim" | "nao";
  status: boolean;
};

type ExtraDraft = {
  tipo: ExtraRow["tipo"];
  nome: string;
  descricao: string;
  preco_delta_eur: string;
  preco_label: string;
  pets_allowed: "indiferente" | "sim" | "nao";
  default_selected: boolean;
  status: boolean;
};

type FlightDraft = {
  label: string;
  origem_iata: string;
  destino_iata: string;
  data_partida: string;
  data_regresso: string;
  horario_ida: string;
  horario_regresso: string;
  cia: string;
  classe: "" | "economy" | "premium_economy" | "business" | "first";
  bagagem_text: string;
  descricao: string;
  preco_delta_eur: string;
  preco_label: string;
  pets_allowed: "indiferente" | "sim" | "nao";
  status: boolean;
};

type RoomDraft = {
  nome: string;
  capacidade_adultos: string;
  capacidade_criancas: string;
  preco_delta_eur: string;
  preco_label: string;
  status: boolean;
};

/** Estado do formulário: inclui CSV editável para slugs do filtro do feed. */
type PostFormState = CrmPostInput & { vibe_slugs_csv: string };

function parseFeedVibeSlugCsv(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const s = part
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (s.length > 0 && !out.includes(s)) out.push(s);
  }
  return out.slice(0, 12);
}

function localNowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(): PostFormState {
  return {
    tipo: "inspiracao",
    slug: "",
    titulo: "",
    descricao: "",
    media_url: "",
    preco_desde: "",
    preco_base_eur: null,
    has_variants: false,
    link_cta: "",
    status: true,
    data_publicacao: localNowForInput(),
    data_fim_publicacao: null,
    ordem_site: 0,
    membros_apenas: false,
    slug_destino: "",
    latitude: null,
    longitude: null,
    feed_vibe_slugs: [],
    hover_line: "",
    pets_allowed: null,
    capacidade_min: null,
    capacidade_max: null,
    variants_publish_confirmed: false,
    vibe_slugs_csv: "",
  };
}

function toCrmPayload(form: PostFormState): CrmPostInput {
  return {
    tipo: form.tipo,
    slug: form.slug,
    titulo: form.titulo,
    descricao: form.descricao,
    media_url: form.media_url,
    preco_desde: form.preco_desde,
    preco_base_eur:
      typeof form.preco_base_eur === "number" ? form.preco_base_eur : null,
    has_variants: form.has_variants,
    link_cta: form.link_cta,
    status: form.status,
    data_publicacao: form.data_publicacao,
    data_fim_publicacao: form.data_fim_publicacao,
    ordem_site: form.ordem_site,
    membros_apenas: form.membros_apenas,
    slug_destino: form.slug_destino,
    latitude: form.latitude,
    longitude: form.longitude,
    feed_vibe_slugs: parseFeedVibeSlugCsv(form.vibe_slugs_csv),
    hover_line: form.hover_line?.trim() || null,
    pets_allowed: form.pets_allowed ?? null,
    capacidade_min: form.capacidade_min ?? null,
    capacidade_max: form.capacidade_max ?? null,
    variants_publish_confirmed: form.variants_publish_confirmed ?? false,
  };
}

function toDatetimeLocalValue(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return localNowForInput();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return localNowForInput();
  }
}

function thumbForRow(p: CrmPostRow): string {
  const u = p.media_url?.trim() ?? "";
  if (!u) return "";
  if (p.tipo === "video") {
    const id = getYoutubeVideoId(u);
    if (id) return getYoutubeThumbnailUrl(id);
    if (isDirectVideoFileUrl(u)) return "";
  }
  return u;
}

const POST_MEDIA_BUCKET = "post-media";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function sanitizeUploadBasename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").slice(0, 80);
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "imagem.jpg";
}

export function CrmPostsManager({ initialPosts }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PostFormState>(() => emptyForm());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const [dragOverMedia, setDragOverMedia] = useState(false);
  const [variantsTab, setVariantsTab] = useState<"hoteis" | "extras" | "voos">(
    "hoteis",
  );
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [flights, setFlights] = useState<FlightRow[]>([]);
  const [newRoomByHotel, setNewRoomByHotel] = useState<Record<string, RoomDraft>>({});
  const [hotelRoomsOpenByHotel, setHotelRoomsOpenByHotel] = useState<
    Record<string, boolean>
  >({});
  const [variantsBusy, startVariantsTransition] = useTransition();
  const [newHotel, setNewHotel] = useState<HotelDraft>({
    nome: "",
    descricao: "",
    regime: "",
    condicoes: "",
    site_url: "",
    preco_delta_eur: "",
    preco_label: "",
    pets_allowed: "indiferente",
    status: true,
  });
  const [newExtra, setNewExtra] = useState<ExtraDraft>({
    tipo: "custom",
    nome: "",
    descricao: "",
    preco_delta_eur: "",
    preco_label: "",
    pets_allowed: "indiferente",
    default_selected: false,
    status: true,
  });
  const [newFlight, setNewFlight] = useState<FlightDraft>({
    label: "",
    origem_iata: "",
    destino_iata: "",
    data_partida: "",
    data_regresso: "",
    horario_ida: "",
    horario_regresso: "",
    cia: "",
    classe: "",
    bagagem_text: "",
    descricao: "",
    preco_delta_eur: "",
    preco_label: "",
    pets_allowed: "indiferente",
    status: true,
  });

  function emptyRoomDraft(): RoomDraft {
    return {
      nome: "",
      capacidade_adultos: "",
      capacidade_criancas: "",
      preco_delta_eur: "",
      preco_label: "",
      status: true,
    };
  }

  function syncHotelRoomsVisibility(
    nextHotels: HotelRow[],
    previous: Record<string, boolean>,
  ): Record<string, boolean> {
    return Object.fromEntries(
      nextHotels.map((hotel) => [hotel.id, previous[hotel.id] ?? false]),
    );
  }

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  function loadForEdit(p: CrmPostRow) {
    setEditingId(p.id);
    setForm({
      tipo: p.tipo as CrmPostInput["tipo"],
      slug: p.slug ?? "",
      titulo: p.titulo,
      descricao: p.descricao ?? "",
      media_url: p.media_url,
      preco_desde: p.preco_desde ?? "",
      preco_base_eur: p.preco_base_eur ?? null,
      has_variants: p.has_variants === true,
      link_cta: p.link_cta ?? "",
      status: p.status,
      data_publicacao: toDatetimeLocalValue(p.data_publicacao),
      data_fim_publicacao:
        typeof p.data_fim_publicacao === "string" && p.data_fim_publicacao.trim()
          ? toDatetimeLocalValue(p.data_fim_publicacao)
          : null,
      ordem_site: p.ordem_site ?? 0,
      membros_apenas: p.membros_apenas === true,
      slug_destino: p.slug_destino ?? "",
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      feed_vibe_slugs: Array.isArray(p.feed_vibe_slugs) ? p.feed_vibe_slugs : [],
      hover_line: p.hover_line ?? "",
      pets_allowed:
        typeof p.pets_allowed === "boolean" ? p.pets_allowed : null,
      capacidade_min: p.capacidade_min ?? null,
      capacidade_max: p.capacidade_max ?? null,
      variants_publish_confirmed: false,
      vibe_slugs_csv: (Array.isArray(p.feed_vibe_slugs) ? p.feed_vibe_slugs : []).join(
        ", ",
      ),
    });
    setMessage(null);
    setUploadHint(null);
    startVariantsTransition(() => {
      void (async () => {
        const res = await listPostVariantsAction(p.id);
        if (res.ok) {
          const loadedHotels = (res.data.hotels as unknown as HotelRow[]) ?? [];
          setHotels(loadedHotels);
          setNewRoomByHotel(
            Object.fromEntries(loadedHotels.map((hotel) => [hotel.id, emptyRoomDraft()])),
          );
          setHotelRoomsOpenByHotel((prev) =>
            syncHotelRoomsVisibility(loadedHotels, prev),
          );
          setExtras((res.data.extras as unknown as ExtraRow[]) ?? []);
          setFlights((res.data.flights as unknown as FlightRow[]) ?? []);
        } else {
          setMessage(`Erro: ${res.error}`);
          setHotels([]);
          setHotelRoomsOpenByHotel({});
          setExtras([]);
          setFlights([]);
        }
      })();
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetNew() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage(null);
    setUploadHint(null);
    setHotels([]);
    setExtras([]);
    setFlights([]);
    setNewRoomByHotel({});
    setHotelRoomsOpenByHotel({});
  }

  function submit() {
    setMessage(null);
    if (
      typeof form.capacidade_min === "number" &&
      typeof form.capacidade_max === "number" &&
      form.capacidade_max < form.capacidade_min
    ) {
      setMessage("Erro: a capacidade máxima deve ser igual ou superior à mínima.");
      return;
    }
    const payload: CrmPostInput = {
      ...toCrmPayload(form),
      data_publicacao: new Date(form.data_publicacao).toISOString(),
      data_fim_publicacao:
        typeof form.data_fim_publicacao === "string" &&
        form.data_fim_publicacao.trim().length > 0
          ? new Date(form.data_fim_publicacao).toISOString()
          : null,
    };

    startTransition(() => {
      void (async () => {
        if (editingId) {
          const res = await updateCrmPostAction(editingId, payload);
          if (res.ok) {
            setMessage("Alterações guardadas.");
            setUploadHint(null);
            setPosts((prev) =>
              prev.map((p) =>
                p.id === editingId
                  ? {
                      ...p,
                      ...payload,
                      slug: payload.slug || null,
                      descricao: payload.descricao || null,
                      preco_desde: payload.preco_desde || null,
                      preco_base_eur: payload.preco_base_eur ?? null,
                      has_variants: payload.has_variants ?? false,
                      link_cta: payload.link_cta || null,
                      data_publicacao: payload.data_publicacao,
                      data_fim_publicacao: payload.data_fim_publicacao || null,
                      membros_apenas: payload.membros_apenas,
                      slug_destino: payload.slug_destino || null,
                      latitude: payload.latitude ?? null,
                      longitude: payload.longitude ?? null,
                      feed_vibe_slugs: payload.feed_vibe_slugs,
                      hover_line: payload.hover_line || null,
                      pets_allowed:
                        typeof payload.pets_allowed === "boolean"
                          ? payload.pets_allowed
                          : null,
                      capacidade_min: payload.capacidade_min ?? null,
                      capacidade_max: payload.capacidade_max ?? null,
                    }
                  : p,
              ),
            );
          } else {
            setMessage(`Erro: ${res.error}`);
          }
        } else {
          const res = await createCrmPostAction(payload);
          if (res.ok) {
            setMessage("Publicação criada.");
            setUploadHint(null);
            resetNew();
            router.refresh();
          } else {
            setMessage(`Erro: ${res.error}`);
          }
        }
      })();
    });
  }

  async function createDraftForVariants(): Promise<string | null> {
    const payload: CrmPostInput = {
      ...toCrmPayload(form),
      has_variants: true,
      status: false,
      data_publicacao: new Date(form.data_publicacao).toISOString(),
      data_fim_publicacao:
        typeof form.data_fim_publicacao === "string" &&
        form.data_fim_publicacao.trim().length > 0
          ? new Date(form.data_fim_publicacao).toISOString()
          : null,
    };
    if (payload.titulo.trim().length < 2 || payload.media_url.trim().length < 5) {
      const draftRes = await createCrmPostDraftAction();
      if (!draftRes.ok) {
        setMessage(`Erro: ${draftRes.error}`);
        return null;
      }
      setEditingId(draftRes.id);
      setMessage("Rascunho criado. Já podes configurar variantes.");
      router.refresh();
      return draftRes.id;
    }
    const createRes = await createCrmPostAction(payload);
    if (!createRes.ok) {
      setMessage(`Erro: ${createRes.error}`);
      return null;
    }
    router.refresh();
    setMessage("Rascunho criado. Já podes configurar variantes.");
    return null;
  }

  function remove(id: string) {
    if (!window.confirm("Eliminar esta publicação do site?")) return;
    setMessage(null);
    startTransition(() => {
      void (async () => {
        const res = await deleteCrmPostAction(id);
        if (res.ok) {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          if (editingId === id) resetNew();
        } else {
          setMessage(`Erro: ${res.error}`);
        }
      })();
    });
  }

  async function uploadImageFile(file: File | undefined | null) {
    if (!file) return;
    setMessage(null);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setUploadHint(null);
      setMessage(
        "Erro: Formato não suportado. Usa uma fotografia JPEG, PNG, WebP ou GIF.",
      );
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadHint(null);
      setMessage("Erro: A fotografia é demasiado grande (máximo 20 MB).");
      return;
    }
    setUploadBusy(true);
    setUploadHint(null);
    try {
      const supabase = createClient();
      const path = `posts/${crypto.randomUUID()}-${sanitizeUploadBasename(file.name)}`;
      const { data, error } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        setMessage(
          `Erro: não foi possível enviar a fotografia. ${error.message}`,
        );
        return;
      }
      const { data: pub } = supabase.storage
        .from(POST_MEDIA_BUCKET)
        .getPublicUrl(data.path);
      setForm((f) => ({ ...f, media_url: pub.publicUrl }));
      setUploadHint(
        "Fotografia carregada. Toca em «Guardar» ou «Criar publicação» para aplicar no site.",
      );
    } finally {
      setUploadBusy(false);
    }
  }

  function onMediaFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    void uploadImageFile(f);
    e.target.value = "";
  }

  async function uploadVideoFile(file: File | undefined | null) {
    if (!file) return;
    setMessage(null);
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      setUploadHint(null);
      setMessage(
        "Erro: Usa MP4, WebM ou MOV (QuickTime). Outros formatos podem não ser aceites.",
      );
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setUploadHint(null);
      setMessage("Erro: O vídeo é demasiado grande (máximo 200 MB).");
      return;
    }
    setUploadBusy(true);
    setUploadHint(null);
    try {
      const supabase = createClient();
      const path = `posts/${crypto.randomUUID()}-${sanitizeUploadBasename(file.name)}`;
      const { data, error } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        setMessage(`Erro: não foi possível enviar o vídeo. ${error.message}`);
        return;
      }
      const { data: pub } = supabase.storage
        .from(POST_MEDIA_BUCKET)
        .getPublicUrl(data.path);
      setForm((f) => ({ ...f, media_url: pub.publicUrl }));
      setUploadHint(
        "Vídeo carregado. Toca em «Guardar» ou «Criar publicação» para aplicar no site.",
      );
    } finally {
      setUploadBusy(false);
    }
  }

  function onVideoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    void uploadVideoFile(f);
    e.target.value = "";
  }

  function requireEditingPostId(): string | null {
    if (!editingId) {
      setMessage("Erro: guarda primeiro a publicação para gerir variantes.");
      return null;
    }
    return editingId;
  }

  function moveByOrder<T extends { id: string }>(
    rows: T[],
    id: string,
    dir: -1 | 1,
  ): T[] {
    const index = rows.findIndex((x) => x.id === id);
    if (index < 0) return rows;
    const next = index + dir;
    if (next < 0 || next >= rows.length) return rows;
    const clone = [...rows];
    const [item] = clone.splice(index, 1);
    clone.splice(next, 0, item);
    return clone;
  }

  function toNumberOrNull(value: string): number | null {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toIntOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeIata(value: string): string | null {
    const code = value.trim().toUpperCase();
    if (!code) return null;
    return /^[A-Z]{3}$/.test(code) ? code : null;
  }

  function buildFlightDescricao(
    horarioIda: string,
    horarioRegresso: string,
    notas: string,
  ): string | null {
    const lines: string[] = [];
    if (horarioIda.trim()) lines.push(`Horario ida: ${horarioIda.trim()}`);
    if (horarioRegresso.trim()) {
      lines.push(`Horario regresso: ${horarioRegresso.trim()}`);
    }
    if (notas.trim()) lines.push(`Notas: ${notas.trim()}`);
    return lines.length > 0 ? lines.join("\n") : null;
  }

  async function uploadHotelMediaFile(
    hotelId: string,
    file: File,
    kind: "image" | "video",
  ) {
    setMessage(null);
    const isImage = kind === "image";
    if (isImage) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        setMessage("Erro: tipo de imagem inválido.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setMessage("Erro: imagem > 20 MB.");
        return;
      }
    } else {
      if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
        setMessage("Erro: tipo de vídeo inválido.");
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        setMessage("Erro: vídeo > 200 MB.");
        return;
      }
    }
    setUploadBusy(true);
    try {
      const supabase = createClient();
      const path = `post-hotels/${hotelId}/${crypto.randomUUID()}-${sanitizeUploadBasename(file.name)}`;
      const { data, error } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        setMessage(`Erro: ${error.message}`);
        return;
      }
      const { data: pub } = supabase.storage
        .from(POST_MEDIA_BUCKET)
        .getPublicUrl(data.path);
      const hotel = hotels.find((h) => h.id === hotelId);
      const ordem = (hotel?.media.length ?? 0) + 1;
      const res = await createPostHotelMediaAction(hotelId, {
        ordem,
        kind,
        url: pub.publicUrl,
        alt: null,
      });
      if (!res.ok) {
        setMessage(`Erro: ${res.error}`);
        return;
      }
      const postId = editingId;
      if (!postId) return;
      const listRes = await listPostVariantsAction(postId);
      if (listRes.ok) {
        setHotels((listRes.data.hotels as unknown as HotelRow[]) ?? []);
        setExtras((listRes.data.extras as unknown as ExtraRow[]) ?? []);
        setFlights((listRes.data.flights as unknown as FlightRow[]) ?? []);
      }
    } finally {
      setUploadBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2 text-sm focus:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-100";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href="/#publicacoes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-ocean-200 bg-white px-4 py-2.5 text-sm font-medium text-ocean-800 shadow-sm transition hover:bg-ocean-50"
        >
          Ver secção de publicações no site
          <span aria-hidden>↗</span>
        </a>
        <Link
          href="/crm/site"
          className="text-sm font-medium text-ocean-600 underline-offset-2 hover:text-ocean-900 hover:underline"
        >
          Editar textos da página inicial
        </Link>
      </div>

      <div className="rounded-2xl border border-ocean-100 bg-gradient-to-br from-ocean-50/80 to-white p-5">
        <p className="text-sm font-medium text-ocean-900">Resumo rápido</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ocean-700">
          <li>
            <span className="font-semibold text-ocean-800">Ordem:</span> número
            mais baixo aparece primeiro no site.
          </li>
          <li>
            <span className="font-semibold text-ocean-800">Data:</span> só
            aparece depois desta data e hora (e com «visível» ligado).
          </li>
          <li>
            <span className="font-semibold text-ocean-800">Imagem:</span> toca
            para escolher da galeria ou tira uma fotografia — não precisas de
            copiar links.
          </li>
        </ul>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg text-ocean-900 md:text-xl">
            As tuas publicações
          </h2>
          <button
            type="button"
            onClick={() => resetNew()}
            className="rounded-2xl bg-ocean-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-ocean-800"
          >
            + Nova publicação
          </button>
        </div>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-ocean-200 bg-white px-6 py-10 text-center text-ocean-600">
            Ainda não tens cartões. Clica em «Nova publicação» e preenche o
            formulário abaixo.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const thumb = thumbForRow(p);
              const active = editingId === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => loadForEdit(p)}
                    className={`flex w-full overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                      active
                        ? "border-ocean-500 ring-2 ring-ocean-200"
                        : "border-ocean-100 hover:border-ocean-300 hover:shadow-md"
                    }`}
                  >
                    <div className="relative h-24 w-24 shrink-0 bg-ocean-100">
                      {p.tipo === "video" &&
                      isDirectVideoFileUrl(p.media_url ?? "") ? (
                        <video
                          src={p.media_url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          aria-hidden
                        />
                      ) : thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-ocean-400">
                          sem img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 p-3">
                      <p className="line-clamp-2 font-medium text-ocean-900">
                        {p.titulo}
                      </p>
                      <p className="mt-1 text-xs text-ocean-500">
                        {p.tipo} · pos. {p.ordem_site ?? 0} ·{" "}
                        {p.status ? "visível" : "rascunho"}
                        {p.membros_apenas ? " · membros" : ""}
                        {p.latitude != null && p.longitude != null
                          ? " · mapa"
                          : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        <div className="space-y-6 rounded-2xl border border-ocean-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="font-serif text-xl text-ocean-900">
              {editingId ? "Editar esta publicação" : "Criar publicação"}
            </h2>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetNew()}
                className="mt-2 text-sm text-ocean-600 underline-offset-2 hover:underline"
              >
                Cancelar edição e criar nova
              </button>
            ) : null}
          </div>

          {message ? (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                message.startsWith("Erro")
                  ? "border-terracotta/40 bg-terracotta/10 text-ocean-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              {message}
            </p>
          ) : null}

          {uploadHint ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900">
              {uploadHint}
            </p>
          ) : null}

          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 1
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Tipo de cartão e imagem
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Tipo de cartão</span>
                <select
                  className={inputCls}
                  value={form.tipo}
                  onChange={(e) => {
                    setUploadHint(null);
                    setForm((f) => ({
                      ...f,
                      tipo: e.target.value as CrmPostInput["tipo"],
                    }));
                  }}
                >
                  <option value="promocao">Promoção (destaque laranja)</option>
                  <option value="video">Vídeo (YouTube ou ficheiro)</option>
                  <option value="inspiracao">Inspiração</option>
                </select>
              </label>

              {form.tipo === "video" ? (
                <div className="mt-4 space-y-4">
                  <label className="block text-sm">
                    <span className="text-ocean-700">
                      Link do YouTube (opcional se enviares ficheiro)
                    </span>
                    <span className="mt-0.5 block text-xs text-ocean-500">
                      Partilhar → copiar ligação. Se carregares um MP4 abaixo,
                      este link é ignorado no cartão.
                    </span>
                    <input
                      className={inputCls}
                      value={
                        isDirectVideoFileUrl(form.media_url ?? "")
                          ? ""
                          : form.media_url
                      }
                      onChange={(e) =>
                        setForm((f) => ({ ...f, media_url: e.target.value }))
                      }
                      placeholder="https://www.youtube.com/watch?v=…"
                    />
                  </label>
                  <p className="text-center text-xs font-medium text-ocean-500">
                    ou carrega um vídeo
                  </p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="sr-only"
                    onChange={onVideoFileChange}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Zona para carregar ficheiro de vídeo"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        videoInputRef.current?.click();
                      }
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(true);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(false);
                      void uploadVideoFile(e.dataTransfer.files?.[0]);
                    }}
                    className={`flex min-h-[11rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 ${
                      dragOverMedia
                        ? "border-ocean-500 bg-ocean-50"
                        : "border-ocean-200 bg-ocean-50/40 hover:border-ocean-300"
                    }`}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <span className="text-sm font-semibold text-ocean-900">
                      {uploadBusy
                        ? "A enviar o vídeo…"
                        : "Toca para escolher ou larga aqui um vídeo"}
                    </span>
                    <button
                      type="button"
                      disabled={uploadBusy}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        videoInputRef.current?.click();
                      }}
                      className="min-h-11 min-w-[11rem] rounded-xl bg-ocean-900 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-50"
                    >
                      Escolher vídeo
                    </button>
                    <span className="max-w-xs text-xs leading-relaxed text-ocean-600">
                      MP4, WebM ou MOV · até 200 MB. Pode demorar com ficheiros
                      grandes.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={onMediaFileChange}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Zona para carregar fotografia da publicação"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(true);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverMedia(false);
                      void uploadImageFile(e.dataTransfer.files?.[0]);
                    }}
                    className={`flex min-h-[11rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 ${
                      dragOverMedia
                        ? "border-ocean-500 bg-ocean-50"
                        : "border-ocean-200 bg-ocean-50/40 hover:border-ocean-300"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-sm font-semibold text-ocean-900">
                      {uploadBusy
                        ? "A enviar a fotografia…"
                        : "Toca para escolher ou larga aqui uma imagem"}
                    </span>
                    <button
                      type="button"
                      disabled={uploadBusy}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="min-h-11 min-w-[11rem] rounded-xl bg-ocean-900 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-50"
                    >
                      Escolher fotografia
                    </button>
                    <span className="max-w-xs text-xs leading-relaxed text-ocean-600">
                      JPEG, PNG, WebP ou GIF · até 20 MB. No telemóvel podes usar
                      a galeria ou a câmara.
                    </span>
                  </div>
                  <p className="text-xs text-ocean-500">
                    Fotografias HEIC (iPhone) podem não aparecer — exporta como
                    JPEG nas definições ou converte antes de enviar.
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 2
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Título e texto
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Título</span>
                <input
                  className={inputCls}
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titulo: e.target.value }))
                  }
                  placeholder="Ex.: Maldivas em privado"
                />
                <p className="mt-1.5 text-xs leading-relaxed text-ocean-500">
                  O URL técnico da publicação é gerido automaticamente em background.
                </p>
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Descrição curta</span>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={form.descricao ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descricao: e.target.value }))
                  }
                  placeholder="Aparece por baixo do título no cartão (regime, noites, notas…)"
                />
              </label>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 3
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Preço e destino do clique
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">
                  Preço indicativo «a partir de» (destaca no cartão)
                </span>
                <input
                  className={inputCls}
                  value={form.preco_desde ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, preco_desde: e.target.value }))
                  }
                  placeholder='Ex.: a partir de 1 200 € por pessoa'
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Preço base indicativo (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputCls}
                  value={form.preco_base_eur ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      preco_base_eur:
                        e.target.value.trim() === "" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="Ex.: 2450"
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Para onde leva o clique</span>
                <input
                  className={inputCls}
                  value={form.link_cta ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_cta: e.target.value }))
                  }
                  placeholder="Opcional — página externa ou deixa vazio"
                />
                <p className="mt-1.5 text-xs leading-relaxed text-ocean-500">
                  Se deixares vazio, o clique abre o pedido no site com os
                  valores indicativos. O preço final é sempre fechado pela
                  Sílvia na proposta.
                </p>
              </label>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                Passo 4
              </p>
              <p className="text-sm font-medium text-ocean-800">
                Ordem, data e visibilidade
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">
                  Posição no site (0 = primeiro)
                </span>
                <input
                  type="number"
                  className={inputCls}
                  value={form.ordem_site}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ordem_site: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Quando publicar</span>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={form.data_publicacao}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, data_publicacao: e.target.value }))
                  }
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="text-ocean-700">Data de fim (opcional)</span>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={form.data_fim_publicacao ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      data_fim_publicacao: e.target.value || null,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-ocean-500">
                  Depois desta data, a publicação deixa de aparecer automaticamente no site.
                </p>
              </label>
              <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-ocean-100 bg-ocean-50/50 p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-ocean-300"
                  checked={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.checked }))
                  }
                />
                <span>
                  <span className="font-medium text-ocean-900">
                    Visível no site
                  </span>
                  <span className="mt-1 block text-ocean-600">
                    Desliga para guardar como rascunho (ninguém vê no site
                    público).
                  </span>
                </span>
              </label>
              {form.status && form.has_variants ? (
                <label className="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-ocean-300"
                    checked={form.variants_publish_confirmed ?? false}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        variants_publish_confirmed: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    <span className="font-medium text-ocean-900">
                      Confirmo que validei as variantes antes de publicar
                    </span>
                    <span className="mt-1 block text-xs text-ocean-600">
                      Obrigatório quando esta publicação tem variantes configuradas.
                    </span>
                  </span>
                </label>
              ) : null}
              <label className="mt-3 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-ocean-200 bg-white p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-ocean-300"
                  checked={form.membros_apenas}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      membros_apenas: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="font-medium text-ocean-900">
                    Só para quem tem conta
                  </span>
                  <span className="mt-1 block text-xs text-ocean-600">
                    Não aparece no site público — só em «Roteiros secretos» na
                    área do cliente.
                  </span>
                </span>
              </label>
            </div>

            <details className="group rounded-2xl border border-ocean-100 bg-ocean-50/30 px-4 py-3">
              <summary className="min-h-11 cursor-pointer list-none text-sm font-semibold text-ocean-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  Mais opções
                  <span className="text-xs font-normal text-ocean-500 group-open:hidden">
                    (ligação da imagem, filtros, mapa…)
                  </span>
                </span>
              </summary>
              <div className="mt-4 space-y-4 border-t border-ocean-100 pt-4">
                <label className="block text-sm">
                  <span className="text-ocean-700">
                    {form.tipo === "video"
                      ? "Colar URL do vídeo (YouTube ou link público)"
                      : "Colar link da imagem (opcional)"}
                  </span>
                  <span className="mt-0.5 block text-xs text-ocean-500">
                    {form.tipo === "video"
                      ? "Substitui o ficheiro carregado se colares aqui outro endereço."
                      : "Só se precisares de uma imagem já alojada noutro sítio."}
                  </span>
                  <input
                    className={inputCls}
                    value={form.media_url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, media_url: e.target.value }))
                    }
                    placeholder="https://…"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ocean-700">Frase no hover (opcional)</span>
                  <span className="mt-0.5 block text-xs text-ocean-500">
                    Linha extra ao passar o rato (computador) ou foco
                  </span>
                  <textarea
                    className={`${inputCls} min-h-[72px]`}
                    value={form.hover_line ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hover_line: e.target.value }))
                    }
                    placeholder="Ex.: Acorda com o som do Índico na tua varanda…"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-ocean-700">
                      Animais de estimação no alojamento
                    </span>
                    <select
                      className={inputCls}
                      value={
                        form.pets_allowed === true
                          ? "sim"
                          : form.pets_allowed === false
                            ? "nao"
                            : ""
                      }
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          pets_allowed:
                            e.target.value === "sim"
                              ? true
                              : e.target.value === "nao"
                                ? false
                                : null,
                        }))
                      }
                    >
                      <option value="">Não definido</option>
                      <option value="sim">Permitidos</option>
                      <option value="nao">Não permitidos</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="text-ocean-700">
                      Capacidade mínima (pessoas)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      className={inputCls}
                      value={form.capacidade_min ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          capacidade_min:
                            e.target.value.trim() === ""
                              ? null
                              : Number(e.target.value),
                        }))
                      }
                      placeholder="ex.: 2"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-ocean-700">
                    Capacidade máxima (pessoas)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    className={inputCls}
                    value={form.capacidade_max ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        capacidade_max:
                          e.target.value.trim() === ""
                            ? null
                            : Number(e.target.value),
                      }))
                    }
                    placeholder="ex.: 4"
                  />
                </label>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                    Mapa (opcional)
                  </p>
                  <p className="text-sm font-medium text-ocean-800">
                    Coordenadas do destino
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-ocean-700">Latitude</span>
                      <input
                        className={inputCls}
                        value={form.latitude ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setForm((f) => ({
                            ...f,
                            latitude: v === "" ? null : Number(v),
                          }));
                        }}
                        placeholder="ex.: 3.2028"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-ocean-700">Longitude</span>
                      <input
                        className={inputCls}
                        value={form.longitude ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setForm((f) => ({
                            ...f,
                            longitude: v === "" ? null : Number(v),
                          }));
                        }}
                        placeholder="ex.: 73.2207"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-ocean-500">
                    Com latitude e longitude preenchidas, o pin aparece em{" "}
                    <strong className="text-ocean-800">/mapa</strong> no site.
                  </p>
                </div>
              </div>
            </details>

            <section className="rounded-2xl border border-ocean-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ocean-400">
                    Variantes
                  </p>
                  <p className="text-sm font-medium text-ocean-800">
                    Hotéis, extras e voos por publicação
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-ocean-700">
                  <input
                    type="checkbox"
                    checked={form.has_variants ?? false}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, has_variants: e.target.checked }))
                    }
                  />
                  Tem variantes
                </label>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVariantsTab("hoteis")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    variantsTab === "hoteis"
                      ? "bg-ocean-900 text-white"
                      : "border border-ocean-200 text-ocean-700"
                  }`}
                >
                  Hotéis
                </button>
                <button
                  type="button"
                  onClick={() => setVariantsTab("extras")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    variantsTab === "extras"
                      ? "bg-ocean-900 text-white"
                      : "border border-ocean-200 text-ocean-700"
                  }`}
                >
                  Extras
                </button>
                <button
                  type="button"
                  onClick={() => setVariantsTab("voos")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    variantsTab === "voos"
                      ? "bg-ocean-900 text-white"
                      : "border border-ocean-200 text-ocean-700"
                  }`}
                >
                  Voos
                </button>
              </div>

              {!editingId ? (
                <div className="mt-3 rounded-xl border border-ocean-200 bg-ocean-50/50 p-3">
                  <p className="text-xs text-ocean-600">
                    Para configurares variantes já, cria primeiro um rascunho temporário.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        void createDraftForVariants();
                      });
                    }}
                    disabled={pending}
                    className="mt-2 rounded-lg border border-ocean-200 bg-white px-3 py-1.5 text-xs font-semibold text-ocean-800 disabled:opacity-50"
                  >
                    Criar rascunho para variantes
                  </button>
                </div>
              ) : null}

              {variantsTab === "hoteis" ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-ocean-200 bg-ocean-50/40 p-3">
                    <p className="text-sm font-semibold text-ocean-900">
                      Adicionar hotel
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={newHotel.nome}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, nome: e.target.value }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Nome do hotel"
                      />
                      <input
                        type="text"
                        value={newHotel.regime}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, regime: e.target.value }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Regime (PA, MP, TI...)"
                      />
                      <input
                        type="text"
                        value={newHotel.preco_delta_eur}
                        onChange={(e) =>
                          setNewHotel((prev) => ({
                            ...prev,
                            preco_delta_eur: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Delta preço EUR (ex: 120)"
                      />
                      <input
                        type="url"
                        value={newHotel.site_url}
                        onChange={(e) =>
                          setNewHotel((prev) => ({
                            ...prev,
                            site_url: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Site do hotel (https://...)"
                      />
                      <input
                        type="text"
                        value={newHotel.preco_label}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, preco_label: e.target.value }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Label preço (opcional)"
                      />
                      <select
                        value={newHotel.pets_allowed}
                        onChange={(e) =>
                          setNewHotel((prev) => ({
                            ...prev,
                            pets_allowed: e.target.value as HotelDraft["pets_allowed"],
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      >
                        <option value="indiferente">Animais: indiferente</option>
                        <option value="sim">Animais permitidos</option>
                        <option value="nao">Animais não permitidos</option>
                      </select>
                      <textarea
                        value={newHotel.descricao}
                        onChange={(e) =>
                          setNewHotel((prev) => ({ ...prev, descricao: e.target.value }))
                        }
                        className="sm:col-span-2 rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Descrição do hotel"
                        rows={2}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!editingId || variantsBusy || newHotel.nome.trim().length < 2}
                      onClick={() => {
                        const postId = requireEditingPostId();
                        if (!postId) return;
                        startVariantsTransition(() => {
                          void (async () => {
                            const res = await createPostHotelAction(postId, {
                              ordem: hotels.length,
                              nome: newHotel.nome.trim(),
                              descricao: newHotel.descricao.trim() || null,
                              regime: newHotel.regime.trim() || null,
                              condicoes: newHotel.condicoes.trim() || null,
                              site_url: newHotel.site_url.trim() || null,
                              preco_delta_eur: toNumberOrNull(newHotel.preco_delta_eur),
                              preco_label: newHotel.preco_label.trim() || null,
                              capacidade_min: null,
                              capacidade_max: null,
                              pets_allowed:
                                newHotel.pets_allowed === "indiferente"
                                  ? null
                                  : newHotel.pets_allowed === "sim",
                              status: newHotel.status,
                            });
                            if (!res.ok) {
                              setMessage(`Erro: ${res.error}`);
                              return;
                            }
                            setNewHotel({
                              nome: "",
                              descricao: "",
                              regime: "",
                              condicoes: "",
                              site_url: "",
                              preco_delta_eur: "",
                              preco_label: "",
                              pets_allowed: "indiferente",
                              status: true,
                            });
                            const list = await listPostVariantsAction(postId);
                            if (list.ok) {
                              const loadedHotels =
                                (list.data.hotels as unknown as HotelRow[]) ?? [];
                              setHotels(loadedHotels);
                              setHotelRoomsOpenByHotel((prev) =>
                                syncHotelRoomsVisibility(loadedHotels, prev),
                              );
                            }
                          })();
                        });
                      }}
                      className="mt-3 rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      + Adicionar hotel
                    </button>
                    <p className="mt-2 text-xs text-ocean-600">
                      Depois de criares o hotel, aparece a secção{" "}
                      <strong>Quartos do hotel</strong> para definires as
                      tipologias de quarto (nome, ocupação e preço).
                    </p>
                  </div>
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="rounded-xl border border-ocean-100 p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={hotel.nome}
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id ? { ...h, nome: e.target.value } : h,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Nome do hotel"
                        />
                        <input
                          type="text"
                          value={hotel.regime ?? ""}
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id ? { ...h, regime: e.target.value } : h,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Regime"
                        />
                        <input
                          type="text"
                          value={hotel.preco_delta_eur ?? ""}
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id
                                  ? { ...h, preco_delta_eur: toNumberOrNull(e.target.value) }
                                  : h,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Delta EUR"
                        />
                        <input
                          type="url"
                          value={hotel.site_url ?? ""}
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id
                                  ? { ...h, site_url: e.target.value }
                                  : h,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Site do hotel (https://...)"
                        />
                        <input
                          type="text"
                          value={hotel.preco_label ?? ""}
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id
                                  ? { ...h, preco_label: e.target.value }
                                  : h,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Label preço"
                        />
                        <select
                          value={
                            hotel.pets_allowed === true
                              ? "sim"
                              : hotel.pets_allowed === false
                                ? "nao"
                                : "indiferente"
                          }
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id
                                  ? {
                                      ...h,
                                      pets_allowed:
                                        e.target.value === "indiferente"
                                          ? null
                                          : e.target.value === "sim",
                                    }
                                  : h,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        >
                          <option value="indiferente">Animais: indiferente</option>
                          <option value="sim">Animais permitidos</option>
                          <option value="nao">Animais não permitidos</option>
                        </select>
                        <textarea
                          value={hotel.descricao ?? ""}
                          onChange={(e) =>
                            setHotels((prev) =>
                              prev.map((h) =>
                                h.id === hotel.id ? { ...h, descricao: e.target.value } : h,
                              ),
                            )
                          }
                          className="sm:col-span-2 rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Descrição"
                          rows={2}
                        />
                      </div>
                      <div className="mt-3 rounded-lg border border-ocean-100 bg-ocean-50/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-ocean-800">
                            Quartos do hotel
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setHotelRoomsOpenByHotel((prev) => ({
                                ...prev,
                                [hotel.id]: !(prev[hotel.id] === true),
                              }))
                            }
                            className="rounded-lg border border-ocean-200 bg-white px-2 py-1 text-xs font-medium text-ocean-800"
                          >
                            {hotelRoomsOpenByHotel[hotel.id] === true
                              ? "Ocultar quartos"
                              : `Ver quartos (${hotel.room_options.length})`}
                          </button>
                        </div>
                        {hotelRoomsOpenByHotel[hotel.id] === true ? (
                          <>
                            {hotel.room_options.length === 0 ? (
                              <p className="mt-1 text-xs text-ocean-600">
                                Ainda sem quartos definidos para este hotel.
                              </p>
                            ) : null}
                            <div className="mt-2 space-y-2">
                              {(hotel.room_options ?? []).map((room) => (
                                <div
                                  key={room.id}
                                  className="grid gap-2 rounded-lg border border-ocean-100 bg-white p-2 sm:grid-cols-2"
                                >
                                  <input
                                    type="text"
                                    value={room.nome}
                                    onChange={(e) =>
                                      setHotels((prev) =>
                                        prev.map((h) =>
                                          h.id !== hotel.id
                                            ? h
                                            : {
                                                ...h,
                                                room_options: h.room_options.map((x) =>
                                                  x.id === room.id
                                                    ? { ...x, nome: e.target.value }
                                                    : x,
                                                ),
                                              },
                                        ),
                                      )
                                    }
                                    className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                    placeholder="Nome do quarto"
                                  />
                                  <input
                                    type="text"
                                    value={room.preco_label ?? ""}
                                    onChange={(e) =>
                                      setHotels((prev) =>
                                        prev.map((h) =>
                                          h.id !== hotel.id
                                            ? h
                                            : {
                                                ...h,
                                                room_options: h.room_options.map((x) =>
                                                  x.id === room.id
                                                    ? { ...x, preco_label: e.target.value }
                                                    : x,
                                                ),
                                              },
                                        ),
                                      )
                                    }
                                    className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                    placeholder="Label preço"
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={room.capacidade_adultos ?? ""}
                                    onChange={(e) =>
                                      setHotels((prev) =>
                                        prev.map((h) =>
                                          h.id !== hotel.id
                                            ? h
                                            : {
                                                ...h,
                                                room_options: h.room_options.map((x) =>
                                                  x.id === room.id
                                                    ? {
                                                        ...x,
                                                        capacidade_adultos: toIntOrNull(e.target.value),
                                                      }
                                                    : x,
                                                ),
                                              },
                                        ),
                                      )
                                    }
                                    className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                    placeholder="Adultos"
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    value={room.capacidade_criancas ?? ""}
                                    onChange={(e) =>
                                      setHotels((prev) =>
                                        prev.map((h) =>
                                          h.id !== hotel.id
                                            ? h
                                            : {
                                                ...h,
                                                room_options: h.room_options.map((x) =>
                                                  x.id === room.id
                                                    ? {
                                                        ...x,
                                                        capacidade_criancas: toIntOrNull(e.target.value),
                                                      }
                                                    : x,
                                                ),
                                              },
                                        ),
                                      )
                                    }
                                    className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                    placeholder="Crianças"
                                  />
                                  <input
                                    type="text"
                                    value={room.preco_delta_eur ?? ""}
                                    onChange={(e) =>
                                      setHotels((prev) =>
                                        prev.map((h) =>
                                          h.id !== hotel.id
                                            ? h
                                            : {
                                                ...h,
                                                room_options: h.room_options.map((x) =>
                                                  x.id === room.id
                                                    ? {
                                                        ...x,
                                                        preco_delta_eur: toNumberOrNull(e.target.value),
                                                      }
                                                    : x,
                                                ),
                                              },
                                        ),
                                      )
                                    }
                                    className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                    placeholder="Delta EUR"
                                  />
                                  <div className="flex gap-2 sm:justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        startVariantsTransition(() => {
                                          void updatePostHotelRoomOptionAction(room.id, room);
                                        });
                                      }}
                                      className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                                    >
                                      Guardar quarto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        startVariantsTransition(() => {
                                          void deletePostHotelRoomOptionAction(room.id);
                                        });
                                        setHotels((prev) =>
                                          prev.map((h) =>
                                            h.id !== hotel.id
                                              ? h
                                              : {
                                                  ...h,
                                                  room_options: h.room_options.filter(
                                                    (x) => x.id !== room.id,
                                                  ),
                                                },
                                          ),
                                        );
                                      }}
                                      className="rounded-lg border border-terracotta/40 px-2 py-1 text-xs text-terracotta"
                                    >
                                      Apagar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 grid gap-2 rounded-lg border border-dashed border-ocean-200 bg-white p-2 sm:grid-cols-2">
                              <input
                                type="text"
                                value={newRoomByHotel[hotel.id]?.nome ?? ""}
                                onChange={(e) =>
                                  setNewRoomByHotel((prev) => ({
                                    ...prev,
                                    [hotel.id]: {
                                      ...(prev[hotel.id] ?? emptyRoomDraft()),
                                      nome: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                placeholder="Novo quarto"
                              />
                              <input
                                type="text"
                                value={newRoomByHotel[hotel.id]?.preco_label ?? ""}
                                onChange={(e) =>
                                  setNewRoomByHotel((prev) => ({
                                    ...prev,
                                    [hotel.id]: {
                                      ...(prev[hotel.id] ?? emptyRoomDraft()),
                                      preco_label: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                placeholder="Label preço"
                              />
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={newRoomByHotel[hotel.id]?.capacidade_adultos ?? ""}
                                onChange={(e) =>
                                  setNewRoomByHotel((prev) => ({
                                    ...prev,
                                    [hotel.id]: {
                                      ...(prev[hotel.id] ?? emptyRoomDraft()),
                                      capacidade_adultos: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                placeholder="Adultos"
                              />
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={newRoomByHotel[hotel.id]?.capacidade_criancas ?? ""}
                                onChange={(e) =>
                                  setNewRoomByHotel((prev) => ({
                                    ...prev,
                                    [hotel.id]: {
                                      ...(prev[hotel.id] ?? emptyRoomDraft()),
                                      capacidade_criancas: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                placeholder="Crianças"
                              />
                              <input
                                type="text"
                                value={newRoomByHotel[hotel.id]?.preco_delta_eur ?? ""}
                                onChange={(e) =>
                                  setNewRoomByHotel((prev) => ({
                                    ...prev,
                                    [hotel.id]: {
                                      ...(prev[hotel.id] ?? emptyRoomDraft()),
                                      preco_delta_eur: e.target.value,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                                placeholder="Delta EUR"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const draft = newRoomByHotel[hotel.id] ?? emptyRoomDraft();
                                  if (draft.nome.trim().length < 2) {
                                    setMessage("Indica o nome do quarto.");
                                    return;
                                  }
                                  startVariantsTransition(() => {
                                    void (async () => {
                                      const res = await createPostHotelRoomOptionAction(hotel.id, {
                                        ordem: hotel.room_options.length,
                                        nome: draft.nome.trim(),
                                        capacidade_adultos: toIntOrNull(draft.capacidade_adultos),
                                        capacidade_criancas: toIntOrNull(draft.capacidade_criancas),
                                        preco_delta_eur: toNumberOrNull(draft.preco_delta_eur),
                                        preco_label: draft.preco_label.trim() || null,
                                        status: draft.status,
                                      });
                                      if (!res.ok) {
                                        setMessage(`Erro: ${res.error}`);
                                        return;
                                      }
                                      const postId = requireEditingPostId();
                                      if (!postId) return;
                                      const list = await listPostVariantsAction(postId);
                                      if (list.ok) {
                                        const loadedHotels =
                                          (list.data.hotels as unknown as HotelRow[]) ?? [];
                                        setHotels(loadedHotels);
                                        setHotelRoomsOpenByHotel((prev) => ({
                                          ...syncHotelRoomsVisibility(loadedHotels, prev),
                                          [hotel.id]: true,
                                        }));
                                      }
                                      setNewRoomByHotel((prev) => ({
                                        ...prev,
                                        [hotel.id]: emptyRoomDraft(),
                                      }));
                                    })();
                                  });
                                }}
                                className="rounded-lg bg-ocean-900 px-3 py-2 text-sm font-semibold text-white"
                              >
                                + Adicionar quarto
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            startVariantsTransition(() => {
                              void (async () => {
                                const res = await updatePostHotelAction(hotel.id, {
                                  ordem: hotel.ordem,
                                  nome: hotel.nome,
                                  descricao: hotel.descricao,
                                  regime: hotel.regime,
                                  condicoes: hotel.condicoes,
                                  site_url: hotel.site_url,
                                  preco_delta_eur: hotel.preco_delta_eur,
                                  preco_label: hotel.preco_label,
                                  capacidade_min: hotel.capacidade_min,
                                  capacidade_max: hotel.capacidade_max,
                                  pets_allowed: hotel.pets_allowed,
                                  status: hotel.status,
                                });
                                if (!res.ok) {
                                  setMessage(`Erro: ${res.error}`);
                                  return;
                                }
                                setMessage("Hotel guardado.");
                              })();
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          Guardar hotel
                        </button>
                        <div className="ml-auto flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingId) return;
                              const ordered = moveByOrder(hotels, hotel.id, -1);
                              setHotels(ordered);
                              startVariantsTransition(() => {
                                void reorderPostHotelsAction(
                                  editingId,
                                  ordered.map((x) => x.id),
                                );
                              });
                            }}
                            className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingId) return;
                              const ordered = moveByOrder(hotels, hotel.id, +1);
                              setHotels(ordered);
                              startVariantsTransition(() => {
                                void reorderPostHotelsAction(
                                  editingId,
                                  ordered.map((x) => x.id),
                                );
                              });
                            }}
                            className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm("Remover hotel?")) return;
                              startVariantsTransition(() => {
                                void (async () => {
                                  const res = await deletePostHotelAction(hotel.id);
                                  if (!res.ok) {
                                    setMessage(`Erro: ${res.error}`);
                                    return;
                                  }
                                  setHotels((prev) => prev.filter((h) => h.id !== hotel.id));
                                  setHotelRoomsOpenByHotel((prev) => {
                                    const next = { ...prev };
                                    delete next[hotel.id];
                                    return next;
                                  });
                                })();
                              });
                            }}
                            className="rounded-lg border border-terracotta/40 px-2 py-1 text-xs text-terracotta"
                          >
                            Apagar
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="rounded-lg border border-ocean-200 px-2 py-1 text-xs">
                          Upload foto
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="ml-2"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              void uploadHotelMediaFile(hotel.id, file, "image");
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <label className="rounded-lg border border-ocean-200 px-2 py-1 text-xs">
                          Upload vídeo
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="ml-2"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              void uploadHotelMediaFile(hotel.id, file, "video");
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {hotel.media.length > 0 ? (
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {hotel.media.map((m) => (
                            <div key={m.id} className="relative overflow-hidden rounded-lg border border-ocean-100">
                              {m.kind === "video" ? (
                                <video src={m.url} className="h-20 w-full object-cover" muted />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.url} alt={m.alt ?? ""} className="h-20 w-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  startVariantsTransition(() => {
                                    void (async () => {
                                      const res = await deletePostHotelMediaAction(m.id);
                                      if (!res.ok) {
                                        setMessage(`Erro: ${res.error}`);
                                        return;
                                      }
                                      setHotels((prev) =>
                                        prev.map((h) =>
                                          h.id === hotel.id
                                            ? { ...h, media: h.media.filter((x) => x.id !== m.id) }
                                            : h,
                                        ),
                                      );
                                    })();
                                  });
                                }}
                                className="absolute right-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-white"
                              >
                                x
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {variantsTab === "extras" ? (
                <div className="mt-4 space-y-2">
                  <div className="rounded-xl border border-ocean-200 bg-ocean-50/40 p-3">
                    <p className="text-sm font-semibold text-ocean-900">
                      Adicionar extra
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <select
                        value={newExtra.tipo}
                        onChange={(e) =>
                          setNewExtra((prev) => ({
                            ...prev,
                            tipo: e.target.value as ExtraRow["tipo"],
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      >
                        <option value="custom">Custom</option>
                        <option value="transfer">Transfer</option>
                        <option value="guia">Guia</option>
                        <option value="seguro">Seguro</option>
                        <option value="experiencia">Experiencia</option>
                        <option value="viatura_aluguer">Viatura aluguer</option>
                      </select>
                      <input
                        type="text"
                        value={newExtra.nome}
                        onChange={(e) =>
                          setNewExtra((prev) => ({ ...prev, nome: e.target.value }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Nome do extra"
                      />
                      <input
                        type="text"
                        value={newExtra.preco_delta_eur}
                        onChange={(e) =>
                          setNewExtra((prev) => ({
                            ...prev,
                            preco_delta_eur: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="A partir de (EUR)"
                      />
                      <input
                        type="text"
                        value={newExtra.preco_label}
                        onChange={(e) =>
                          setNewExtra((prev) => ({
                            ...prev,
                            preco_label: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder='Ex: "a partir de 45 EUR/dia"'
                      />
                      <select
                        value={newExtra.pets_allowed}
                        onChange={(e) =>
                          setNewExtra((prev) => ({
                            ...prev,
                            pets_allowed: e.target.value as ExtraDraft["pets_allowed"],
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      >
                        <option value="indiferente">Animais: indiferente</option>
                        <option value="sim">Animais permitidos</option>
                        <option value="nao">Animais não permitidos</option>
                      </select>
                      <textarea
                        value={newExtra.descricao}
                        onChange={(e) =>
                          setNewExtra((prev) => ({
                            ...prev,
                            descricao: e.target.value,
                          }))
                        }
                        className="sm:col-span-2 rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Descrição do extra"
                        rows={2}
                      />
                    </div>
                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-ocean-700">
                      <input
                        type="checkbox"
                        checked={newExtra.default_selected}
                        onChange={(e) =>
                          setNewExtra((prev) => ({
                            ...prev,
                            default_selected: e.target.checked,
                          }))
                        }
                      />
                      Selecionado por defeito
                    </label>
                    <button
                      type="button"
                      disabled={!editingId || variantsBusy || newExtra.nome.trim().length < 2}
                      onClick={() => {
                        const postId = requireEditingPostId();
                        if (!postId) return;
                        startVariantsTransition(() => {
                          void (async () => {
                            const res = await createPostExtraAction(postId, {
                              ordem: extras.length,
                              tipo: newExtra.tipo,
                              nome: newExtra.nome.trim(),
                              descricao: newExtra.descricao.trim() || null,
                              preco_delta_eur: toNumberOrNull(newExtra.preco_delta_eur),
                              preco_label: newExtra.preco_label.trim() || null,
                              pets_allowed:
                                newExtra.pets_allowed === "indiferente"
                                  ? null
                                  : newExtra.pets_allowed === "sim",
                              default_selected: newExtra.default_selected,
                              status: newExtra.status,
                            });
                            if (!res.ok) {
                              setMessage(`Erro: ${res.error}`);
                              return;
                            }
                            setNewExtra({
                              tipo: "custom",
                              nome: "",
                              descricao: "",
                              preco_delta_eur: "",
                              preco_label: "",
                              pets_allowed: "indiferente",
                              default_selected: false,
                              status: true,
                            });
                            const list = await listPostVariantsAction(postId);
                            if (list.ok) {
                              setExtras((list.data.extras as unknown as ExtraRow[]) ?? []);
                            }
                          })();
                        });
                      }}
                      className="mt-3 rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      + Adicionar extra
                    </button>
                  </div>
                  {extras.map((extra) => (
                    <div key={extra.id} className="rounded-xl border border-ocean-100 p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          value={extra.tipo}
                          onChange={(e) =>
                            setExtras((prev) =>
                              prev.map((x) =>
                                x.id === extra.id
                                  ? { ...x, tipo: e.target.value as ExtraRow["tipo"] }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        >
                          <option value="custom">Custom</option>
                          <option value="transfer">Transfer</option>
                          <option value="guia">Guia</option>
                          <option value="seguro">Seguro</option>
                          <option value="experiencia">Experiencia</option>
                          <option value="viatura_aluguer">Viatura aluguer</option>
                        </select>
                        <input
                          type="text"
                          value={extra.nome}
                          onChange={(e) =>
                            setExtras((prev) =>
                              prev.map((x) =>
                                x.id === extra.id
                                  ? { ...x, nome: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Nome"
                        />
                        <input
                          type="text"
                          value={extra.preco_delta_eur ?? ""}
                          onChange={(e) =>
                            setExtras((prev) =>
                              prev.map((x) =>
                                x.id === extra.id
                                  ? {
                                      ...x,
                                      preco_delta_eur: toNumberOrNull(e.target.value),
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="A partir de (EUR)"
                        />
                        <input
                          type="text"
                          value={extra.preco_label ?? ""}
                          onChange={(e) =>
                            setExtras((prev) =>
                              prev.map((x) =>
                                x.id === extra.id
                                  ? { ...x, preco_label: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder='Ex: "a partir de 45 EUR/dia"'
                        />
                        <select
                          value={
                            extra.pets_allowed === true
                              ? "sim"
                              : extra.pets_allowed === false
                                ? "nao"
                                : "indiferente"
                          }
                          onChange={(e) =>
                            setExtras((prev) =>
                              prev.map((x) =>
                                x.id === extra.id
                                  ? {
                                      ...x,
                                      pets_allowed:
                                        e.target.value === "indiferente"
                                          ? null
                                          : e.target.value === "sim",
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        >
                          <option value="indiferente">Animais: indiferente</option>
                          <option value="sim">Animais permitidos</option>
                          <option value="nao">Animais não permitidos</option>
                        </select>
                        <textarea
                          value={extra.descricao ?? ""}
                          onChange={(e) =>
                            setExtras((prev) =>
                              prev.map((x) =>
                                x.id === extra.id
                                  ? { ...x, descricao: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="sm:col-span-2 rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Descrição"
                          rows={2}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-xs text-ocean-700">
                          <input
                            type="checkbox"
                            checked={extra.default_selected}
                            onChange={(e) =>
                              setExtras((prev) =>
                                prev.map((x) =>
                                  x.id === extra.id
                                    ? { ...x, default_selected: e.target.checked }
                                    : x,
                                ),
                              )
                            }
                          />
                          Defeito
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            startVariantsTransition(() => {
                              void updatePostExtraAction(extra.id, extra);
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          Guardar extra
                        </button>
                        <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingId) return;
                            const ordered = moveByOrder(extras, extra.id, -1);
                            setExtras(ordered);
                            startVariantsTransition(() => {
                              void reorderPostExtrasAction(editingId, ordered.map((x) => x.id));
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingId) return;
                            const ordered = moveByOrder(extras, extra.id, +1);
                            setExtras(ordered);
                            startVariantsTransition(() => {
                              void reorderPostExtrasAction(editingId, ordered.map((x) => x.id));
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            startVariantsTransition(() => {
                              void deletePostExtraAction(extra.id);
                            });
                            setExtras((prev) => prev.filter((x) => x.id !== extra.id));
                          }}
                          className="rounded-lg border border-terracotta/40 px-2 py-1 text-xs text-terracotta"
                        >
                          Apagar
                        </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {variantsTab === "voos" ? (
                <div className="mt-4 space-y-2">
                  <div className="rounded-xl border border-ocean-200 bg-ocean-50/40 p-3">
                    <p className="text-sm font-semibold text-ocean-900">
                      Adicionar voo
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={newFlight.label}
                        onChange={(e) =>
                          setNewFlight((prev) => ({ ...prev, label: e.target.value }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Resumo (ex: Lisboa -> Punta Cana)"
                      />
                      <input
                        type="text"
                        value={newFlight.cia}
                        onChange={(e) =>
                          setNewFlight((prev) => ({ ...prev, cia: e.target.value }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Companhia"
                      />
                      <input
                        type="text"
                        maxLength={3}
                        value={newFlight.origem_iata}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            origem_iata: e.target.value.toUpperCase(),
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Origem IATA (LIS)"
                      />
                      <input
                        type="text"
                        maxLength={3}
                        value={newFlight.destino_iata}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            destino_iata: e.target.value.toUpperCase(),
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Destino IATA (PUJ)"
                      />
                      <input
                        type="date"
                        value={newFlight.data_partida}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            data_partida: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={newFlight.data_regresso}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            data_regresso: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={newFlight.horario_ida}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            horario_ida: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Horario ida (ex: 10:30)"
                      />
                      <input
                        type="text"
                        value={newFlight.horario_regresso}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            horario_regresso: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Horario regresso (ex: 18:45)"
                      />
                      <input
                        type="text"
                        value={newFlight.bagagem_text}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            bagagem_text: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Bagagem (ex: 1 mala 23kg)"
                      />
                      <select
                        value={newFlight.classe}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            classe: e.target.value as FlightDraft["classe"],
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      >
                        <option value="">Classe (opcional)</option>
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium economy</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                      <input
                        type="text"
                        value={newFlight.preco_delta_eur}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            preco_delta_eur: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="A partir de (EUR)"
                      />
                      <input
                        type="text"
                        value={newFlight.preco_label}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            preco_label: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder='Ex: "a partir de 350 EUR"'
                      />
                      <select
                        value={newFlight.pets_allowed}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            pets_allowed: e.target.value as FlightDraft["pets_allowed"],
                          }))
                        }
                        className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                      >
                        <option value="indiferente">Animais: indiferente</option>
                        <option value="sim">Animais permitidos</option>
                        <option value="nao">Animais não permitidos</option>
                      </select>
                      <textarea
                        value={newFlight.descricao}
                        onChange={(e) =>
                          setNewFlight((prev) => ({
                            ...prev,
                            descricao: e.target.value,
                          }))
                        }
                        className="sm:col-span-2 rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        placeholder="Horários / notas operacionais"
                        rows={2}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!editingId || variantsBusy || newFlight.label.trim().length < 2}
                      onClick={() => {
                        const postId = requireEditingPostId();
                        if (!postId) return;
                        startVariantsTransition(() => {
                          void (async () => {
                            const res = await createPostFlightOptionAction(postId, {
                              ordem: flights.length,
                              label: newFlight.label.trim(),
                              origem_iata: normalizeIata(newFlight.origem_iata),
                              destino_iata: normalizeIata(newFlight.destino_iata),
                              data_partida: newFlight.data_partida || null,
                              data_regresso: newFlight.data_regresso || null,
                              cia: newFlight.cia.trim() || null,
                              classe: newFlight.classe || null,
                              bagagem_text: newFlight.bagagem_text.trim() || null,
                              descricao: buildFlightDescricao(
                                newFlight.horario_ida,
                                newFlight.horario_regresso,
                                newFlight.descricao,
                              ),
                              preco_delta_eur: toNumberOrNull(newFlight.preco_delta_eur),
                              preco_label: newFlight.preco_label.trim() || null,
                              pets_allowed:
                                newFlight.pets_allowed === "indiferente"
                                  ? null
                                  : newFlight.pets_allowed === "sim",
                              status: newFlight.status,
                            });
                            if (!res.ok) {
                              setMessage(`Erro: ${res.error}`);
                              return;
                            }
                            setNewFlight({
                              label: "",
                              origem_iata: "",
                              destino_iata: "",
                              data_partida: "",
                              data_regresso: "",
                              horario_ida: "",
                              horario_regresso: "",
                              cia: "",
                              classe: "",
                              bagagem_text: "",
                              descricao: "",
                              preco_delta_eur: "",
                              preco_label: "",
                              pets_allowed: "indiferente",
                              status: true,
                            });
                            const list = await listPostVariantsAction(postId);
                            if (list.ok) {
                              setFlights((list.data.flights as unknown as FlightRow[]) ?? []);
                            }
                          })();
                        });
                      }}
                      className="mt-3 rounded-xl bg-ocean-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      + Adicionar voo
                    </button>
                  </div>
                  {flights.map((flight) => (
                    <div key={flight.id} className="rounded-xl border border-ocean-100 p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={flight.label}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, label: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Resumo do voo"
                        />
                        <input
                          type="text"
                          value={flight.cia ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, cia: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Companhia"
                        />
                        <input
                          type="text"
                          maxLength={3}
                          value={flight.origem_iata ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, origem_iata: e.target.value.toUpperCase() }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Origem IATA"
                        />
                        <input
                          type="text"
                          maxLength={3}
                          value={flight.destino_iata ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, destino_iata: e.target.value.toUpperCase() }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Destino IATA"
                        />
                        <input
                          type="date"
                          value={flight.data_partida ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, data_partida: e.target.value || null }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        />
                        <input
                          type="date"
                          value={flight.data_regresso ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, data_regresso: e.target.value || null }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={flight.bagagem_text ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, bagagem_text: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Bagagem"
                        />
                        <select
                          value={flight.classe ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? {
                                      ...x,
                                      classe:
                                        e.target.value === ""
                                          ? null
                                          : (e.target.value as FlightRow["classe"]),
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        >
                          <option value="">Classe (opcional)</option>
                          <option value="economy">Economy</option>
                          <option value="premium_economy">Premium economy</option>
                          <option value="business">Business</option>
                          <option value="first">First</option>
                        </select>
                        <input
                          type="text"
                          value={flight.preco_delta_eur ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? {
                                      ...x,
                                      preco_delta_eur: toNumberOrNull(e.target.value),
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Delta EUR"
                        />
                        <input
                          type="text"
                          value={flight.preco_label ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, preco_label: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Label preço (opcional)"
                        />
                        <select
                          value={
                            flight.pets_allowed === true
                              ? "sim"
                              : flight.pets_allowed === false
                                ? "nao"
                                : "indiferente"
                          }
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? {
                                      ...x,
                                      pets_allowed:
                                        e.target.value === "indiferente"
                                          ? null
                                          : e.target.value === "sim",
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                        >
                          <option value="indiferente">Animais: indiferente</option>
                          <option value="sim">Animais permitidos</option>
                          <option value="nao">Animais não permitidos</option>
                        </select>
                        <textarea
                          value={flight.descricao ?? ""}
                          onChange={(e) =>
                            setFlights((prev) =>
                              prev.map((x) =>
                                x.id === flight.id
                                  ? { ...x, descricao: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="sm:col-span-2 rounded-lg border border-ocean-200 px-3 py-2 text-sm"
                          placeholder="Horários / notas"
                          rows={2}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            startVariantsTransition(() => {
                              void updatePostFlightOptionAction(flight.id, flight);
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          Guardar voo
                        </button>
                        <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingId) return;
                            const ordered = moveByOrder(flights, flight.id, -1);
                            setFlights(ordered);
                            startVariantsTransition(() => {
                              void reorderPostFlightOptionsAction(
                                editingId,
                                ordered.map((x) => x.id),
                              );
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingId) return;
                            const ordered = moveByOrder(flights, flight.id, +1);
                            setFlights(ordered);
                            startVariantsTransition(() => {
                              void reorderPostFlightOptionsAction(
                                editingId,
                                ordered.map((x) => x.id),
                              );
                            });
                          }}
                          className="rounded-lg border border-ocean-200 px-2 py-1 text-xs"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            startVariantsTransition(() => {
                              void deletePostFlightOptionAction(flight.id);
                            });
                            setFlights((prev) => prev.filter((x) => x.id !== flight.id));
                          }}
                          className="rounded-lg border border-terracotta/40 px-2 py-1 text-xs text-terracotta"
                        >
                          Apagar
                        </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <div className="flex flex-col gap-3 border-t border-ocean-100 pt-6 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={pending}
                onClick={() => submit()}
                className="flex-1 rounded-2xl bg-ocean-900 py-3 text-sm font-semibold text-white shadow-md hover:bg-ocean-800 disabled:opacity-60"
              >
                {pending
                  ? "A guardar…"
                  : editingId
                    ? "Guardar alterações"
                    : "Criar publicação"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(editingId)}
                  className="rounded-2xl border border-terracotta/50 px-5 py-3 text-sm font-semibold text-terracotta hover:bg-terracotta/10 disabled:opacity-50"
                >
                  Apagar
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <p className="mb-3 text-center text-sm font-medium text-ocean-700">
            Pré-visualização ao vivo
          </p>
          <p className="mb-4 text-center text-xs text-ocean-500">
            Actualiza enquanto escreves — é assim que o cartão vai parecer no
            site.
          </p>
          <PostCardPreview form={form} />
        </div>
      </div>
    </div>
  );
}
