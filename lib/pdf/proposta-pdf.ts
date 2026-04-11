import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";

import type { DetalhesProposta } from "@/lib/crm/detalhes-proposta";
import { BRAND_MARK } from "@/lib/site/brand";
import { pdfSafeText } from "@/lib/pdf/pdf-text-safe";
import {
  PROPOSAL_ACCENT_JPG,
  PROPOSAL_BANNER_JPG,
  fetchProposalJpeg,
} from "@/lib/pdf/travel-assets";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const LINE = 13;
const BANNER_H = 128;
const GAP_SM = 6;
const GAP_MD = 12;

const ocean = rgb(15 / 255, 61 / 255, 57 / 255);
const oceanMid = rgb(29 / 255, 122 / 255, 114 / 255);
const sand = rgb(245 / 255, 243 / 255, 239 / 255);
const sandLine = rgb(212 / 255, 235 / 255, 231 / 255);
const terracotta = rgb(217 / 255, 120 / 255, 92 / 255);
const muted = rgb(90 / 255, 110 / 255, 108 / 255);

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

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const bannerBytes = await fetchProposalJpeg(PROPOSAL_BANNER_JPG);
  const accentBytes = await fetchProposalJpeg(PROPOSAL_ACCENT_JPG);
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

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  const drawBanner = () => {
    if (bannerImage) {
      const scale = Math.max(PAGE_W / bannerImage.width, BANNER_H / bannerImage.height);
      const dw = bannerImage.width * scale;
      const dh = bannerImage.height * scale;
      const x = (PAGE_W - dw) / 2;
      const bottomY = PAGE_H - dh;
      page.drawImage(bannerImage, { x, y: bottomY, width: dw, height: dh });
      page.drawRectangle({
        x: 0,
        y: bottomY,
        width: PAGE_W,
        height: dh,
        color: rgb(15 / 255, 61 / 255, 57 / 255),
        opacity: 0.25,
      });
    } else {
      page.drawRectangle({
        x: 0,
        y: PAGE_H - BANNER_H,
        width: PAGE_W,
        height: BANNER_H,
        color: ocean,
      });
    }
    y = PAGE_H - BANNER_H - 28;
  };

  const drawBrandHeader = (large: boolean) => {
    const brandSize = large ? 20 : 11;
    page.drawText(BRAND_MARK, {
      x: MARGIN,
      y,
      size: brandSize,
      font: fontBold,
      color: ocean,
    });
    y -= large ? LINE + 6 : LINE + 2;
    if (large) {
      page.drawText("proposta de viagem", {
        x: MARGIN,
        y,
        size: 8,
        font,
        color: terracotta,
      });
      y -= LINE + GAP_MD;
    }
  };

  const ensureSpace = (need: number) => {
    if (y - need < MARGIN + 72) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      page.drawRectangle({
        x: 0,
        y: PAGE_H - 4,
        width: PAGE_W,
        height: 4,
        color: terracotta,
      });
      page.drawText(BRAND_MARK, {
        x: MARGIN,
        y,
        size: 11,
        font: fontBold,
        color: ocean,
      });
      y -= LINE + 2;
      page.drawText("continuação", {
        x: MARGIN,
        y,
        size: 8,
        font,
        color: muted,
      });
      y -= LINE + GAP_MD;
    }
  };

  const drawSection = (label: string, body: string, bodySize = 10) => {
    const innerPad = 12;
    const labelSize = 8;
    const bodyLines = wrapLines(body, font, bodySize, CONTENT_W - innerPad * 2);
    const blockH =
      innerPad +
      labelSize +
      4 +
      bodyLines.length * LINE +
      innerPad +
      GAP_SM;

    ensureSpace(blockH + 8);

    const yTop = y;
    const yBottom = y - blockH;
    page.drawRectangle({
      x: MARGIN,
      y: yBottom,
      width: CONTENT_W,
      height: blockH,
      color: sand,
      borderColor: sandLine,
      borderWidth: 0.6,
    });

    let ty = yTop - innerPad - labelSize;
    page.drawText(label.toUpperCase(), {
      x: MARGIN + innerPad,
      y: ty,
      size: labelSize,
      font: fontBold,
      color: terracotta,
    });
    ty -= 4 + LINE;
    for (const line of bodyLines) {
      page.drawText(line, {
        x: MARGIN + innerPad,
        y: ty,
        size: bodySize,
        font,
        color: ocean,
      });
      ty -= LINE;
    }
    y = yBottom - GAP_MD;
  };

  const drawBulletList = (label: string, items: string[]) => {
    const innerPad = 12;
    const labelSize = 8;
    const list = items.length ? items : ["-"];
    let linesH = 0;
    const rendered: string[] = [];
    for (const item of list) {
      const wrapped = wrapLines(`- ${item}`, font, 10, CONTENT_W - innerPad * 2 - 6);
      rendered.push(...wrapped);
      linesH += wrapped.length * LINE;
    }
    const blockH = innerPad + labelSize + 4 + linesH + innerPad + GAP_SM;

    ensureSpace(blockH + 8);

    const yTop = y;
    const yBottom = y - blockH;
    page.drawRectangle({
      x: MARGIN,
      y: yBottom,
      width: CONTENT_W,
      height: blockH,
      color: sand,
      borderColor: sandLine,
      borderWidth: 0.6,
    });

    let ty = yTop - innerPad - labelSize;
    page.drawText(label.toUpperCase(), {
      x: MARGIN + innerPad,
      y: ty,
      size: labelSize,
      font: fontBold,
      color: terracotta,
    });
    ty -= 4 + LINE;
    for (const line of rendered) {
      page.drawText(line, {
        x: MARGIN + innerPad,
        y: ty,
        size: 10,
        font,
        color: ocean,
      });
      ty -= LINE;
    }
    y = yBottom - GAP_MD;
  };

  drawBanner();
  drawBrandHeader(true);

  page.drawText(`Preparado para ${nome}`, {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: oceanMid,
  });
  y -= LINE + GAP_MD;

  ensureSpace(52);
  const titleLines = wrapLines(titulo, fontBold, 16, CONTENT_W);
  for (const line of titleLines) {
    page.drawText(line, {
      x: MARGIN,
      y,
      size: 16,
      font: fontBold,
      color: ocean,
    });
    y -= LINE + 4;
  }
  y -= GAP_SM;

  drawSection("Destino", destino);
  drawSection("Datas / período", datas);
  if (dataInicioRef || dataFimRef) {
    const line =
      dataInicioRef && dataFimRef
        ? `${dataInicioRef} -> ${dataFimRef}`
        : dataInicioRef || dataFimRef || "-";
    drawSection("Datas da viagem (referência digital)", line);
  }
  drawBulletList("O que inclui", inclui);
  drawSection("Investimento", valorTotal, 14);

  if (notas) {
    drawSection("Notas", notas);
  }

  /* Rodapé com imagem de viagem + marca */
  const footH = 88;
  const gapFoot = 14;
  ensureSpace(footH + gapFoot + 24);
  const footBottom = y - gapFoot - footH;
  page.drawRectangle({
    x: MARGIN,
    y: footBottom,
    width: CONTENT_W,
    height: footH,
    color: rgb(0.97, 0.98, 0.97),
    borderColor: sandLine,
    borderWidth: 0.5,
  });

  if (accentImage) {
    const tw = 112;
    const th = 72;
    const scale = Math.min(tw / accentImage.width, th / accentImage.height);
    const aw = accentImage.width * scale;
    const ah = accentImage.height * scale;
    const ax = MARGIN + CONTENT_W - aw - 14;
    const ay = footBottom + footH - ah - 10;
    page.drawImage(accentImage, { x: ax, y: ay, width: aw, height: ah });
  }

  const footTextY = footBottom + footH - 22;
  page.drawText(BRAND_MARK, {
    x: MARGIN + 14,
    y: footTextY,
    size: 10,
    font: fontBold,
    color: ocean,
  });
  page.drawText(
    `Documento · ${new Date(p.enviado_em).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    {
      x: MARGIN + 14,
      y: footTextY - LINE - 2,
      size: 8,
      font,
      color: muted,
    },
  );

  y = footBottom - GAP_MD;

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
