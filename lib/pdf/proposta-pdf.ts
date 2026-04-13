import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";

import type { DetalhesProposta, PdfVoos } from "@/lib/crm/detalhes-proposta";
import { BRAND_MARK } from "@/lib/site/brand";
import { pdfSafeText } from "@/lib/pdf/pdf-text-safe";
import {
  fetchProposalJpeg,
  resolveProposalImageUrls,
} from "@/lib/pdf/travel-assets";
import {
  CONSULTORA_PUBLIC_EMAIL,
  getInstagramProfileUrl,
} from "@/lib/site/social";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const LINE = 13;
const GAP_SM = 6;
const GAP_MD = 14;

const ocean = rgb(15 / 255, 61 / 255, 57 / 255);
const oceanMid = rgb(29 / 255, 122 / 255, 114 / 255);
const sand = rgb(245 / 255, 243 / 255, 239 / 255);
const sandLine = rgb(212 / 255, 235 / 255, 231 / 255);
const terracotta = rgb(217 / 255, 120 / 255, 92 / 255);
const muted = rgb(90 / 255, 110 / 255, 108 / 255);
const ink = rgb(28 / 255, 32 / 255, 34 / 255);
const goldLine = rgb(212 / 255, 175 / 255, 55 / 255);
const mintPanel = rgb(237 / 255, 246 / 255, 244 / 255);
const ctaHeadline = rgb(120 / 255, 95 / 255, 72 / 255);

const BRAND_DISPLAY = "Viagens com Sílvia";

const COVER_PANEL_W = PAGE_W * 0.52;
const SPLIT_IMG_W = PAGE_W * 0.46;

const splitBlueGrey = rgb(237 / 255, 242 / 255, 244 / 255);
const strikeRed = rgb(210 / 255, 60 / 255, 60 / 255);

type PDFFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function trimStr(x: string | undefined): string {
  return x?.trim() ?? "";
}

function pdfVoosHasContent(v: PdfVoos | undefined): boolean {
  if (!v) return false;
  if (trimStr(v.titulo_rota) || trimStr(v.bagagem)) return true;
  for (const leg of [v.ida, v.volta]) {
    if (!leg) continue;
    if (
      trimStr(leg.titulo) ||
      trimStr(leg.meta) ||
      trimStr(leg.partida) ||
      trimStr(leg.chegada)
    )
      return true;
  }
  return false;
}

function resolveTelefoneDisplay(p: DetalhesProposta): string | undefined {
  const t = trimStr(p.contacto_telefone);
  if (t) return pdfSafeText(t);
  const env = process.env.NEXT_PUBLIC_CONSULTORA_TELEFONE_DISPLAY?.trim();
  return env ? pdfSafeText(env) : undefined;
}

function transparenciaNeeded(p: DetalhesProposta): boolean {
  if (p.pdf_exclusoes?.length) return true;
  const c = p.pdf_cancelamento;
  return Boolean(trimStr(c?.aviso) || (c?.linhas && c.linhas.length > 0));
}

function pdfPrecosMeaningful(p: DetalhesProposta["pdf_precos"]): boolean {
  const x = p;
  if (!x) return false;
  return Boolean(
    trimStr(x.linha_resumo) ||
      trimStr(x.preco_base) ||
      trimStr(x.preco_final) ||
      trimStr(x.nota_desconto),
  );
}

function drawStrikethroughText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x, y, size, font, color: muted });
  const midY = y + size * 0.32;
  page.drawLine({
    start: { x, y: midY },
    end: { x: x + w, y: midY },
    thickness: 0.85,
    color: strikeRed,
  });
}

function drawFlightLegBlock(
  page: PDFPage,
  yTop: number,
  defaultTitle: string,
  leg:
    | { titulo?: string; meta?: string; partida?: string; chegada?: string }
    | undefined,
  font: PDFFont,
  fontBold: PDFFont,
): number {
  if (
    !leg ||
    (!trimStr(leg.meta) &&
      !trimStr(leg.partida) &&
      !trimStr(leg.chegada) &&
      !trimStr(leg.titulo))
  ) {
    return yTop;
  }
  let y = yTop;
  const title = trimStr(leg.titulo) || defaultTitle;
  page.drawText(title, {
    x: MARGIN,
    y,
    size: 10,
    font: fontBold,
    color: ink,
  });
  y -= LINE + 2;
  if (trimStr(leg.meta)) {
    for (const line of wrapLines(leg.meta!, font, 8, CONTENT_W)) {
      page.drawText(line, { x: MARGIN, y, size: 8, font, color: muted });
      y -= LINE - 1;
    }
    y -= 6;
  }
  const lineY = y - 10;
  page.drawLine({
    start: { x: MARGIN + 6, y: lineY },
    end: { x: PAGE_W - MARGIN - 6, y: lineY },
    thickness: 1.1,
    color: oceanMid,
  });
  page.drawCircle({
    x: MARGIN + 6,
    y: lineY,
    size: 4,
    color: oceanMid,
  });
  page.drawCircle({
    x: PAGE_W - MARGIN - 6,
    y: lineY,
    size: 4,
    color: oceanMid,
  });

  const wCol = CONTENT_W * 0.46;
  let yLeft = lineY - 20;
  if (trimStr(leg.partida)) {
    for (const line of wrapLines(leg.partida!, font, 9, wCol)) {
      page.drawText(line, { x: MARGIN, y: yLeft, size: 9, font, color: ink });
      yLeft -= LINE;
    }
  }
  let yRight = lineY - 20;
  if (trimStr(leg.chegada)) {
    for (const line of wrapLines(leg.chegada!, font, 9, wCol)) {
      page.drawText(line, {
        x: PAGE_W - MARGIN - wCol,
        y: yRight,
        size: 9,
        font,
        color: ink,
      });
      yRight -= LINE;
    }
  }
  return Math.min(yLeft, yRight) - 22;
}

function wrapLines(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxW: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const trial = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxW) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function primeiroNome(nome: string): string {
  const p = nome.trim().split(/\s+/)[0];
  return p || nome.trim();
}

function instagramHandleLabel(): string {
  try {
    const u = getInstagramProfileUrl();
    const path = new URL(u).pathname.replace(/\/$/, "");
    const seg = path.split("/").filter(Boolean).pop() ?? "viagenscomsilvia_";
    return `@${seg.replace(/^@/, "")}`;
  } catch {
    return "@viagenscomsilvia_";
  }
}

/** Largura da gaveta do ícone (envelope usa ~1,1× o tamanho nominal). */
const CONTACT_ICON_COL_W = 16;
const CONTACT_ICON_SIZE = 12;
const CONTACT_ICON_GAP = 10;

type PdfStrokeColor = typeof oceanMid;

/**
 * Centro óptico vertical do texto em relação à baseline (Helvetica ~ size×0,32).
 * Usado para alinhar bullets e ícones com a primeira linha.
 */
function textOpticalCenterYFromBaseline(baselineY: number, fontSize: number): number {
  return baselineY + fontSize * 0.32;
}

/** Ícones em traço (Helvetica não renderiza emoji no PDF). `centerY` = eixo vertical de alinhamento com o texto. */
function drawContactIconInstagram(
  page: PDFPage,
  left: number,
  centerY: number,
  s: number,
  stroke: PdfStrokeColor,
) {
  const bottom = centerY - s / 2;
  const m = s * 0.08;
  page.drawRectangle({
    x: left + m,
    y: bottom + m,
    width: s - 2 * m,
    height: s - 2 * m,
    borderColor: stroke,
    borderWidth: 0.55,
  });
  const cx = left + s / 2;
  const cyC = bottom + s / 2;
  const r = s * 0.185;
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a1 = (2 * Math.PI * i) / n;
    const a2 = (2 * Math.PI * (i + 1)) / n;
    page.drawLine({
      start: { x: cx + r * Math.cos(a1), y: cyC + r * Math.sin(a1) },
      end: { x: cx + r * Math.cos(a2), y: cyC + r * Math.sin(a2) },
      thickness: 0.5,
      color: stroke,
    });
  }
  const d = s * 0.09;
  page.drawRectangle({
    x: left + s * 0.72,
    y: bottom + s * 0.72,
    width: d,
    height: d,
    color: stroke,
  });
}

function drawContactIconEnvelope(
  page: PDFPage,
  left: number,
  centerY: number,
  s: number,
  stroke: PdfStrokeColor,
) {
  const baseY = centerY - s * 0.44;
  const w = s * 1.1;
  const hBottom = s * 0.52;
  page.drawRectangle({
    x: left,
    y: baseY,
    width: w,
    height: hBottom,
    borderColor: stroke,
    borderWidth: 0.55,
  });
  const topEdge = baseY + hBottom;
  const peakY = baseY + s * 0.88;
  const midX = left + w / 2;
  page.drawLine({
    start: { x: left, y: topEdge },
    end: { x: midX, y: peakY },
    thickness: 0.55,
    color: stroke,
  });
  page.drawLine({
    start: { x: midX, y: peakY },
    end: { x: left + w, y: topEdge },
    thickness: 0.55,
    color: stroke,
  });
}

function drawContactIconPhone(
  page: PDFPage,
  left: number,
  centerY: number,
  s: number,
  stroke: PdfStrokeColor,
) {
  const h = s * 0.82;
  const baseY = centerY - h / 2;
  const w = s * 0.36;
  const x = left + (s - w) / 2;
  page.drawRectangle({
    x,
    y: baseY,
    width: w,
    height: h,
    borderColor: stroke,
    borderWidth: 0.55,
  });
  const barW = w * 0.42;
  page.drawRectangle({
    x: x + (w - barW) / 2,
    y: baseY + h - 1.45,
    width: barW,
    height: 1.35,
    color: stroke,
  });
}

function drawContactIconWhatsApp(
  page: PDFPage,
  left: number,
  centerY: number,
  s: number,
  stroke: PdfStrokeColor,
) {
  const baseY = centerY - s * 0.48;
  const w = s * 0.88;
  const h = s * 0.58;
  const boxY = baseY + s * 0.28;
  page.drawRectangle({
    x: left,
    y: boxY,
    width: w,
    height: h,
    borderColor: stroke,
    borderWidth: 0.55,
  });
  page.drawLine({
    start: { x: left + s * 0.18, y: boxY },
    end: { x: left + s * 0.06, y: baseY + s * 0.1 },
    thickness: 0.55,
    color: stroke,
  });
  page.drawLine({
    start: { x: left + s * 0.06, y: baseY + s * 0.1 },
    end: { x: left + s * 0.32, y: boxY + h * 0.2 },
    thickness: 0.55,
    color: stroke,
  });
}

function drawContactValueRow(
  page: PDFPage,
  font: PDFFont,
  cardX: number,
  cardPad: number,
  cy: number,
  drawIcon: (
    page: PDFPage,
    left: number,
    centerY: number,
    s: number,
    stroke: PdfStrokeColor,
  ) => void,
  valueText: string,
) {
  const fontSize = 9;
  const iconLeft = cardX + cardPad;
  const textX = iconLeft + CONTACT_ICON_COL_W + CONTACT_ICON_GAP;
  const centerY = textOpticalCenterYFromBaseline(cy, fontSize);
  drawIcon(page, iconLeft, centerY, CONTACT_ICON_SIZE, oceanMid);
  page.drawText(valueText, {
    x: textX,
    y: cy,
    size: fontSize,
    font,
    color: ink,
  });
}

/** Imagem a cobrir rectângulo [0,pageW] x [0,pageH] (origem inferior esquerda). */
function drawFullBleedImage(
  page: PDFPage,
  img: Awaited<ReturnType<PDFDocument["embedJpg"]>>,
  pageW: number,
  pageH: number,
) {
  const scale = Math.max(pageW / img.width, pageH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const x = (pageW - dw) / 2;
  const y = pageH - dh;
  page.drawImage(img, { x, y, width: dw, height: dh });
}

function drawCoverIntroParagraphs(
  p: PDFPage,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  nomeLead: string,
  destino: string,
  customCapa: string | undefined,
  textX: number,
  textMaxW: number,
  startY: number,
): number {
  let y = startY;
  const size = 10;
  const blockGap = 12;

  const blocks: string[] = [];
  if (customCapa?.trim()) {
    for (const block of customCapa.trim().split(/\n\s*\n/)) {
      const t = block.trim().replace(/\n/g, " ");
      if (t) blocks.push(t);
    }
  }
  if (!blocks.length) {
    const pn = primeiroNome(nomeLead);
    blocks.push(
      `Olá${pn ? ` ${pn}` : ""}, sou a Sílvia — consultora de viagens à medida em ${BRAND_DISPLAY}. Esta proposta resume a experiência que idealizámos para ${destino}.`,
      "O meu compromisso é desenhar viagens autênticas e personalizadas, do primeiro contacto ao regresso a casa, com transparência e um acompanhamento próximo.",
    );
  }

  for (const para of blocks) {
    const lines = wrapLines(para, font, size, textMaxW);
    for (const line of lines) {
      p.drawText(line, { x: textX, y, size, font, color: ink });
      y -= LINE;
    }
    y -= blockGap;
  }
  return y;
}

export async function buildPropostaPdfBuffer(
  leadNome: string,
  p: DetalhesProposta,
): Promise<Buffer> {
  const nome = pdfSafeText(leadNome);
  const titulo = pdfSafeText(p.titulo);
  const destino = pdfSafeText(p.destino);
  const datas = pdfSafeText(p.datas);
  const inclui = p.inclui.map((line) => pdfSafeText(line));
  const valorTotal = pdfSafeText(p.valor_total);
  const notas = p.notas?.trim() ? pdfSafeText(p.notas.trim()) : undefined;
  const dataInicioRef = p.data_inicio?.trim()
    ? pdfSafeText(p.data_inicio.trim())
    : "";
  const dataFimRef = p.data_fim?.trim() ? pdfSafeText(p.data_fim.trim()) : "";
  const customCapa = p.pdf_texto_capa?.trim()
    ? pdfSafeText(p.pdf_texto_capa.trim())
    : undefined;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSerifBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const { bannerUrl, accentUrl } = resolveProposalImageUrls(p);
  const bannerBytes = await fetchProposalJpeg(bannerUrl);
  const accentBytes = await fetchProposalJpeg(accentUrl);
  let bannerImage = null as Awaited<ReturnType<PDFDocument["embedJpg"]>> | null;
  let accentImage = null as Awaited<ReturnType<PDFDocument["embedJpg"]>> | null;
  if (bannerBytes) {
    try {
      bannerImage = await doc.embedJpg(bannerBytes);
    } catch {
      bannerImage = null;
    }
  }
  if (accentBytes) {
    try {
      accentImage = await doc.embedJpg(accentBytes);
    } catch {
      accentImage = null;
    }
  }

  const padL = 44;
  const textW = COVER_PANEL_W - padL - 20;

  // ——— Página 1: capa lookbook (foto + painel branco) ———
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    if (bannerImage) {
      drawFullBleedImage(page, bannerImage, PAGE_W, PAGE_H);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        color: rgb(0, 0, 0),
        opacity: 0.12,
      });
    } else {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        color: ocean,
      });
    }

    page.drawRectangle({
      x: 0,
      y: 0,
      width: COVER_PANEL_W,
      height: PAGE_H,
      color: rgb(1, 1, 1),
    });

    let y = PAGE_H - 56;
    page.drawText(BRAND_MARK, {
      x: padL,
      y,
      size: 9,
      font: fontBold,
      color: terracotta,
    });
    y -= 10;
    page.drawText("proposta de viagem", {
      x: padL,
      y,
      size: 7,
      font,
      color: muted,
    });
    y -= 28;

    const titleLines = wrapLines(titulo, fontBold, 16, textW);
    for (const line of titleLines.slice(0, 4)) {
      page.drawText(line, {
        x: padL,
        y,
        size: 16,
        font: fontBold,
        color: oceanMid,
      });
      y -= LINE + 5;
    }
    y -= 8;

    drawCoverIntroParagraphs(
      page,
      font,
      nome,
      destino,
      customCapa,
      padL,
      textW,
      y,
    );
  }

  // ——— Página 2: resumo em duas colunas ———
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    const splitX = SPLIT_IMG_W;

    if (bannerImage) {
      drawFullBleedImage(page, bannerImage, PAGE_W, PAGE_H);
      page.drawRectangle({
        x: splitX,
        y: 0,
        width: PAGE_W - splitX,
        height: PAGE_H,
        color: sand,
      });
    } else {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: splitX,
        height: PAGE_H,
        color: ocean,
      });
      page.drawRectangle({
        x: splitX,
        y: 0,
        width: PAGE_W - splitX,
        height: PAGE_H,
        color: sand,
      });
    }

    const colPad = 36;
    const rightW = PAGE_W - splitX - colPad * 2;
    let y = PAGE_H - 52;

    page.drawText(BRAND_MARK, {
      x: splitX + colPad,
      y: PAGE_H - 22,
      size: 8,
      font: fontBold,
      color: ocean,
    });

    const headLines = wrapLines(titulo, fontBold, 15, rightW).slice(0, 3);
    for (const line of headLines) {
      page.drawText(line, {
        x: splitX + colPad,
        y,
        size: 15,
        font: fontBold,
        color: ink,
      });
      y -= LINE + 4;
    }
    y -= 6;

    page.drawText(datas, {
      x: splitX + colPad,
      y,
      size: 11,
      font: fontBold,
      color: oceanMid,
    });
    y -= LINE + 16;

    page.drawText("DESTINO", {
      x: splitX + colPad,
      y,
      size: 7,
      font: fontBold,
      color: terracotta,
    });
    y -= LINE + 2;
    for (const line of wrapLines(destino, font, 10, rightW)) {
      page.drawText(line, { x: splitX + colPad, y, size: 10, font, color: ink });
      y -= LINE;
    }
    y -= 14;

    page.drawText("O QUE ESTÁ INCLUÍDO", {
      x: splitX + colPad,
      y,
      size: 7,
      font: fontBold,
      color: terracotta,
    });
    y -= LINE + 6;

    const items = inclui.length ? inclui : ["—"];
    const dotS = 4;
    const listFontSize = 10;
    const listTextX = splitX + colPad + 12;
    for (const item of items) {
      const wrapped = wrapLines(item, font, listFontSize, rightW - 16);
      for (let i = 0; i < wrapped.length; i++) {
        if (y < 120) break;
        if (i === 0) {
          const bulletMidY = textOpticalCenterYFromBaseline(y, listFontSize);
          const dotBottom = bulletMidY - dotS / 2;
          page.drawRectangle({
            x: splitX + colPad,
            y: dotBottom,
            width: dotS,
            height: dotS,
            color: oceanMid,
          });
        }
        page.drawText(wrapped[i]!, {
          x: listTextX,
          y,
          size: listFontSize,
          font,
          color: ink,
        });
        y -= LINE;
      }
      y -= 4;
      if (y < 120) break;
    }

    if (notas && y > 140) {
      const calloutW = rightW;
      const firstBlock = notas.split(/\n\s*\n/)[0]?.trim() ?? notas;
      const callLines = wrapLines(firstBlock, font, 9, calloutW - 20);
      const callH = 14 + callLines.length * LINE + 14;
      const callBottom = Math.max(48, y - callH - 8);
      page.drawRectangle({
        x: splitX + colPad - 6,
        y: callBottom,
        width: calloutW + 12,
        height: callH,
        color: rgb(0.99, 0.98, 0.96),
        borderColor: sandLine,
        borderWidth: 0.4,
      });
      page.drawRectangle({
        x: splitX + colPad - 6,
        y: callBottom,
        width: 3,
        height: callH,
        color: goldLine,
      });
      let cy = callBottom + callH - 14;
      for (const line of callLines.slice(0, 6)) {
        page.drawText(line, {
          x: splitX + colPad + 4,
          y: cy,
          size: 9,
          font,
          color: muted,
        });
        cy -= LINE;
      }
    }
  }

  // ——— Voos (opcional) ———
  if (pdfVoosHasContent(p.pdf_voos)) {
    const v = p.pdf_voos!;
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 4,
      width: PAGE_W,
      height: 4,
      color: terracotta,
    });
    page.drawText(BRAND_MARK, {
      x: MARGIN,
      y: PAGE_H - 26,
      size: 8,
      font: fontBold,
      color: ocean,
    });
    let y = PAGE_H - 54;
    const routeTitle = trimStr(v.titulo_rota) || "A vossa rota";
    page.drawText(pdfSafeText(routeTitle), {
      x: MARGIN,
      y,
      size: 14,
      font: fontBold,
      color: ink,
    });
    y -= LINE + 14;
    y = drawFlightLegBlock(page, y, "Voo de ida", v.ida, font, fontBold);
    y = drawFlightLegBlock(page, y, "Voo de regresso", v.volta, font, fontBold);
    if (trimStr(v.bagagem)) {
      const bagLines = wrapLines(
        pdfSafeText(v.bagagem!.trim()),
        font,
        9,
        CONTENT_W - 28,
      );
      const bagH = 20 + bagLines.length * LINE + 18;
      const bagBottom = Math.max(MARGIN, y - bagH - 6);
      page.drawRectangle({
        x: MARGIN,
        y: bagBottom,
        width: CONTENT_W,
        height: bagH,
        color: rgb(0.92, 0.97, 0.96),
        borderColor: oceanMid,
        borderWidth: 0.55,
      });
      let by = bagBottom + bagH - 16;
      for (const line of bagLines) {
        page.drawText(line, {
          x: MARGIN + 14,
          y: by,
          size: 9,
          font,
          color: oceanMid,
        });
        by -= LINE;
      }
    }
  }

  // ——— Destaques / serviços (opcional, até 6 em duas filas) ———
  const destaquesRaw =
    p.pdf_destaques?.filter((d) => trimStr(d.titulo) && trimStr(d.texto)) ??
    [];
  if (destaquesRaw.length > 0) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 4,
      width: PAGE_W,
      height: 4,
      color: terracotta,
    });
    let topY = PAGE_H - MARGIN;
    page.drawText("Tudo orientado para o vosso conforto", {
      x: MARGIN,
      y: topY,
      size: 13,
      font: fontBold,
      color: ocean,
    });
    topY -= LINE + 20;
    const cardH = 102;
    const gap = 10;
    const rows = [
      destaquesRaw.slice(0, 3),
      destaquesRaw.slice(3, 6),
    ];
    for (const row of rows) {
      if (!row.length) continue;
      const n = row.length;
      const cardW = (CONTENT_W - gap * (n - 1)) / n;
      let x = MARGIN;
      const rowBottom = topY - cardH;
      for (const d of row) {
        page.drawRectangle({
          x,
          y: rowBottom,
          width: cardW,
          height: cardH,
          color: rgb(1, 1, 1),
          borderColor: sandLine,
          borderWidth: 0.5,
        });
        let ty = rowBottom + cardH - 12;
        const titleColor = d.estilo === "ouro" ? goldLine : ocean;
        for (const tl of wrapLines(
          pdfSafeText(d.titulo),
          fontBold,
          9,
          cardW - 14,
        )) {
          page.drawText(tl, {
            x: x + 8,
            y: ty,
            size: 9,
            font: fontBold,
            color: titleColor,
          });
          ty -= LINE;
        }
        ty -= 2;
        for (const ln of wrapLines(
          pdfSafeText(d.texto),
          font,
          8,
          cardW - 14,
        )) {
          page.drawText(ln, {
            x: x + 8,
            y: ty,
            size: 8,
            font,
            color: ink,
          });
          ty -= LINE - 1;
        }
        x += cardW + gap;
      }
      topY = rowBottom - 18;
    }
  }

  // ——— Investimento ———
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 4,
      width: PAGE_W,
      height: 4,
      color: terracotta,
    });

    const pr = p.pdf_precos;
    const hasPrecos = pdfPrecosMeaningful(pr);
    const panelPad = 48;
    let panelH = 168;
    if (hasPrecos && trimStr(pr?.linha_resumo)) {
      const lines = wrapLines(
        pdfSafeText(pr!.linha_resumo!.trim()),
        font,
        9,
        CONTENT_W - 2 * panelPad,
      );
      panelH += lines.length * LINE + 8;
    }
    if (hasPrecos && trimStr(pr?.preco_base)) panelH += 22;
    if (hasPrecos && (trimStr(pr?.preco_final) || trimStr(pr?.preco_base))) {
      panelH += 52;
    }
    if (hasPrecos && trimStr(pr?.nota_desconto)) {
      const nl = wrapLines(
        pdfSafeText(pr!.nota_desconto!.trim()),
        font,
        8,
        CONTENT_W - 2 * panelPad,
      );
      panelH += nl.length * LINE + 12;
    }
    if (!hasPrecos) panelH = 200;

    const panelY = PAGE_H / 2 - panelH / 2 + 50;
    page.drawRectangle({
      x: MARGIN,
      y: panelY,
      width: CONTENT_W,
      height: panelH,
      color: mintPanel,
      borderColor: sandLine,
      borderWidth: 0.5,
    });

    let py = panelY + panelH - 40;
    page.drawText("O vosso investimento", {
      x: MARGIN + panelPad,
      y: py,
      size: 14,
      font: fontBold,
      color: ink,
    });
    py -= 28;

    if (hasPrecos && trimStr(pr?.linha_resumo)) {
      for (const line of wrapLines(
        pdfSafeText(pr!.linha_resumo!.trim()),
        font,
        9,
        CONTENT_W - 2 * panelPad,
      )) {
        page.drawText(line, {
          x: MARGIN + panelPad,
          y: py,
          size: 9,
          font,
          color: ink,
        });
        py -= LINE;
      }
      py -= 6;
    }

    if (hasPrecos && trimStr(pr?.preco_base)) {
      drawStrikethroughText(
        page,
        pdfSafeText(pr!.preco_base!.trim()),
        MARGIN + panelPad,
        py,
        11,
        font,
      );
      py -= LINE + 10;
    }

    const precoFinalTxt = trimStr(pr?.preco_final)
      ? pdfSafeText(pr!.preco_final!.trim())
      : valorTotal;

    if (hasPrecos && (trimStr(pr?.preco_base) || trimStr(pr?.preco_final))) {
      const boxW = CONTENT_W - 2 * panelPad;
      const boxH = 40;
      const boxY = py - boxH + 8;
      page.drawRectangle({
        x: MARGIN + panelPad,
        y: boxY,
        width: boxW,
        height: boxH,
        borderColor: goldLine,
        borderWidth: 1.2,
        color: rgb(0.99, 0.98, 0.95),
      });
      page.drawText(`Preço final exclusivo: ${precoFinalTxt}`, {
        x: MARGIN + panelPad + 12,
        y: boxY + boxH - 26,
        size: 13,
        font: fontBold,
        color: ink,
      });
      py = boxY - 12;
    } else {
      page.drawText(precoFinalTxt, {
        x: MARGIN + panelPad,
        y: py,
        size: 22,
        font: fontBold,
        color: ocean,
      });
      py -= 28;
      if (!hasPrecos) {
        page.drawText("Valor indicado para o pacote descrito nesta proposta.", {
          x: MARGIN + panelPad,
          y: py,
          size: 9,
          font,
          color: muted,
        });
        py -= LINE + 4;
      }
    }

    if (hasPrecos && trimStr(pr?.nota_desconto)) {
      for (const line of wrapLines(
        pdfSafeText(pr!.nota_desconto!.trim()),
        font,
        8,
        CONTENT_W - 2 * panelPad,
      )) {
        page.drawText(line, {
          x: MARGIN + panelPad,
          y: py,
          size: 8,
          font,
          color: muted,
        });
        py -= LINE;
      }
    }

    let y = panelY - 28;
    if (dataInicioRef || dataFimRef) {
      const line =
        dataInicioRef && dataFimRef
          ? `Referência: ${dataInicioRef} → ${dataFimRef}`
          : `Referência: ${dataInicioRef || dataFimRef}`;
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: muted,
      });
      y -= LINE + 8;
    }

    if (notas && !transparenciaNeeded(p)) {
      page.drawText("Notas e transparência", {
        x: MARGIN,
        y,
        size: 11,
        font: fontBold,
        color: ocean,
      });
      y -= LINE + 6;
      for (const line of wrapLines(notas, font, 9, CONTENT_W)) {
        if (y < MARGIN + 40) break;
        page.drawText(line, { x: MARGIN, y, size: 9, font, color: ink });
        y -= LINE;
      }
    }
  }

  // ——— Transparência: exclusões + cancelamento (+ notas longas) ———
  if (transparenciaNeeded(p)) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    const splitX = PAGE_W * 0.48;
    page.drawRectangle({
      x: 0,
      y: 0,
      width: splitX,
      height: PAGE_H,
      color: splitBlueGrey,
    });
    page.drawRectangle({
      x: splitX,
      y: 0,
      width: PAGE_W - splitX,
      height: PAGE_H,
      color: rgb(1, 1, 1),
    });
    page.drawLine({
      start: { x: splitX, y: MARGIN },
      end: { x: splitX, y: PAGE_H - MARGIN },
      thickness: 0.8,
      color: oceanMid,
    });

    let yL = PAGE_H - MARGIN;
    page.drawText("Notas importantes & transparência", {
      x: MARGIN,
      y: yL,
      size: 12,
      font: fontBold,
      color: ink,
    });
    yL -= LINE + 10;
    page.drawText("O que não está incluído", {
      x: MARGIN,
      y: yL,
      size: 9,
      font: fontBold,
      color: ocean,
    });
    yL -= LINE + 6;
    const exclusoes = p.pdf_exclusoes ?? [];
    for (const ex of exclusoes) {
      const tx = pdfSafeText(ex);
      for (const line of wrapLines(tx, font, 8, splitX - MARGIN - 14)) {
        if (yL < MARGIN + 120) break;
        page.drawRectangle({
          x: MARGIN,
          y: yL - 2,
          width: 3,
          height: 3,
          color: oceanMid,
        });
        page.drawText(line, {
          x: MARGIN + 10,
          y: yL,
          size: 8,
          font,
          color: ink,
        });
        yL -= LINE;
      }
      yL -= 4;
    }

    let yR = PAGE_H - MARGIN;
    const colX = splitX + 18;
    const colW = PAGE_W - colX - MARGIN;
    page.drawText("Condições de cancelamento", {
      x: colX,
      y: yR,
      size: 11,
      font: fontBold,
      color: ink,
    });
    yR -= LINE + 4;
    const cancel = p.pdf_cancelamento;
    if (trimStr(cancel?.aviso)) {
      for (const line of wrapLines(
        pdfSafeText(cancel!.aviso!.trim()),
        font,
        8,
        colW,
      )) {
        page.drawText(line, {
          x: colX,
          y: yR,
          size: 8,
          font,
          color: muted,
        });
        yR -= LINE - 1;
      }
      yR -= 8;
    }
    for (const row of cancel?.linhas ?? []) {
      if (yR < MARGIN + 80) break;
      const per = pdfSafeText(row.periodo);
      const cond = pdfSafeText(row.condicao);
      page.drawText(per, {
        x: colX,
        y: yR,
        size: 8,
        font: fontBold,
        color: oceanMid,
      });
      yR -= LINE;
      for (const line of wrapLines(cond, font, 8, colW)) {
        page.drawText(line, {
          x: colX,
          y: yR,
          size: 8,
          font,
          color: ink,
        });
        yR -= LINE;
      }
      yR -= 6;
    }

    if (notas) {
      let yN = Math.min(yL, yR) - 24;
      if (yN < MARGIN + 60) yN = MARGIN + 40;
      page.drawLine({
        start: { x: MARGIN, y: yN + 16 },
        end: { x: PAGE_W - MARGIN, y: yN + 16 },
        thickness: 0.4,
        color: sandLine,
      });
      yN -= 8;
      page.drawText("Notas adicionais", {
        x: MARGIN,
        y: yN,
        size: 10,
        font: fontBold,
        color: ocean,
      });
      yN -= LINE + 4;
      for (const line of wrapLines(notas, font, 8, CONTENT_W)) {
        if (yN < MARGIN) break;
        page.drawText(line, { x: MARGIN, y: yN, size: 8, font, color: ink });
        yN -= LINE;
      }
    }
  }

  // ——— Página final: CTA + contactos ———
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    if (bannerImage) {
      drawFullBleedImage(page, bannerImage, PAGE_W, PAGE_H);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        color: rgb(0, 0, 0),
        opacity: 0.28,
      });
    } else {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: PAGE_W,
        height: PAGE_H,
        color: ocean,
      });
    }

    const cardW = CONTENT_W * 0.88;
    const cardX = (PAGE_W - cardW) / 2;
    const cardPad = 36;
    const innerW = cardW - cardPad * 2;

    const body1 =
      "Esta proposta foi pensada à medida. Para garantir os valores e a disponibilidade, convém confirmarmos dentro de um prazo razoável — estou disponível para avançar com a reserva ou ajustar o que for preciso.";

    const bodyLines = wrapLines(body1, font, 10, innerW);
    const wa = process.env.NEXT_PUBLIC_CONSULTORA_WHATSAPP_DISPLAY?.trim();
    const tel = resolveTelefoneDisplay(p);
    let contactBlockLines = 3;
    if (wa) contactBlockLines += 1;
    if (tel) contactBlockLines += 1;
    const cardH =
      cardPad +
      32 +
      (2 + bodyLines.length) * LINE +
      28 +
      contactBlockLines * LINE +
      cardPad +
      20;

    const cardY = (PAGE_H - cardH) / 2;
    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      color: rgb(1, 1, 1),
      borderColor: sandLine,
      borderWidth: 0.6,
    });

    let cy = cardY + cardH - cardPad - 8;
    page.drawText("Prontos para esta aventura?", {
      x: cardX + cardPad,
      y: cy,
      size: 22,
      font: fontSerifBold,
      color: ctaHeadline,
    });
    cy -= 36;
    for (const line of bodyLines) {
      page.drawText(line, {
        x: cardX + cardPad,
        y: cy,
        size: 10,
        font,
        color: ink,
      });
      cy -= LINE;
    }
    cy -= 16;

    const ig = pdfSafeText(instagramHandleLabel());
    const emailLine = pdfSafeText(CONSULTORA_PUBLIC_EMAIL);
    const waLine = wa ? pdfSafeText(wa) : "";

    drawContactValueRow(
      page,
      font,
      cardX,
      cardPad,
      cy,
      drawContactIconInstagram,
      ig,
    );
    cy -= LINE + 2;

    drawContactValueRow(
      page,
      font,
      cardX,
      cardPad,
      cy,
      drawContactIconEnvelope,
      emailLine,
    );
    cy -= LINE + 2;

    if (tel) {
      drawContactValueRow(
        page,
        font,
        cardX,
        cardPad,
        cy,
        drawContactIconPhone,
        tel,
      );
      cy -= LINE + 2;
    }

    if (waLine) {
      drawContactValueRow(
        page,
        font,
        cardX,
        cardPad,
        cy,
        drawContactIconWhatsApp,
        waLine,
      );
      cy -= LINE + 2;
    }

    cy -= 8;
    page.drawText(`Sílvia Milheiro · ${BRAND_DISPLAY}`, {
      x: cardX + cardPad,
      y: cy,
      size: 8,
      font,
      color: muted,
    });
    cy -= LINE;
    page.drawText(
      `Documento · ${new Date(p.enviado_em).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      {
        x: cardX + cardPad,
        y: cy,
        size: 7,
        font,
        color: muted,
      },
    );

    if (accentImage) {
      const tw = 72;
      const th = 48;
      const scale = Math.min(tw / accentImage.width, th / accentImage.height);
      const aw = accentImage.width * scale;
      const ah = accentImage.height * scale;
      page.drawImage(accentImage, {
        x: cardX + cardW - aw - 20,
        y: cardY + 16,
        width: aw,
        height: ah,
      });
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
