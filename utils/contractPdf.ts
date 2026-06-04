import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getContractFetchUrl } from './api';
import { sessionService } from '../services/session';

async function fetchContractPdfBytes(contractPath: string): Promise<ArrayBuffer> {
  const url = getContractFetchUrl(contractPath);
  const { token } = sessionService.getSession();

  const response = await fetch(url, {
    headers: {
      accept: 'application/pdf,*/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar contrato (HTTP ${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const header = new Uint8Array(buffer.slice(0, 4));
  const isPdf =
    header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;

  if (!isPdf) {
    throw new Error('Arquivo retornado não é um PDF válido');
  }

  return buffer;
}

async function embedImageFromDataUrl(pdfDoc: PDFDocument, dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Imagem inválida');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  if (dataUrl.includes('image/png')) {
    return pdfDoc.embedPng(bytes);
  }
  return pdfDoc.embedJpg(bytes);
}

async function appendEvidencePage(
  pdfDoc: PDFDocument,
  signatureDataUrl: string | null,
  photoDataUrl: string | null
) {
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const margin = 48;

  page.drawText('Anexo — Registro de assinatura e identificação', {
    x: margin,
    y: height - margin,
    size: 14,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
    x: margin,
    y: height - margin - 22,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const contentTop = height - margin - 50;
  const halfWidth = (width - margin * 3) / 2;

  if (photoDataUrl) {
    const photo = await embedImageFromDataUrl(pdfDoc, photoDataUrl);
    const dims = photo.scale(1);
    const maxW = halfWidth;
    const maxH = 280;
    const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);
    const w = dims.width * scale;
    const h = dims.height * scale;

    page.drawText('Foto do signatário', {
      x: margin,
      y: contentTop + 8,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawImage(photo, {
      x: margin,
      y: contentTop - h,
      width: w,
      height: h,
    });
  }

  if (signatureDataUrl) {
    const signature = await embedImageFromDataUrl(pdfDoc, signatureDataUrl);
    const dims = signature.scale(1);
    const maxW = halfWidth;
    const maxH = 120;
    const scale = Math.min(maxW / dims.width, maxH / dims.height, 1);
    const w = dims.width * scale;
    const h = dims.height * scale;

    const sigX = photoDataUrl ? margin * 2 + halfWidth : margin;
    const sigY = photoDataUrl ? contentTop - 320 : contentTop - h;

    page.drawText('Assinatura do signatário', {
      x: sigX,
      y: sigY + h + 12,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawImage(signature, {
      x: sigX,
      y: sigY,
      width: w,
      height: h,
    });
  }

  if (!signatureDataUrl && !photoDataUrl) {
    page.drawText('Nenhum registro de assinatura ou foto anexado.', {
      x: margin,
      y: contentTop - 40,
      size: 11,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}

/**
 * Carrega o PDF do contrato (se existir) e acrescenta uma página com assinatura e foto.
 */
export async function buildContractPdfWithEvidence(
  contractPath: string | null,
  signatureDataUrl: string | null,
  photoDataUrl: string | null
): Promise<Blob> {
  let pdfDoc: PDFDocument;

  if (contractPath) {
    try {
      const bytes = await fetchContractPdfBytes(contractPath);
      pdfDoc = await PDFDocument.load(bytes);
    } catch (loadError) {
      console.warn('Não foi possível carregar PDF do contrato:', loadError);
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const { width: pageWidth } = page.getSize();
      page.drawText('Contrato original', {
        x: 48,
        y: 780,
        size: 16,
        font,
      });
      page.drawText(
        'Não foi possível incorporar o PDF do plano neste preview. O anexo com assinatura e foto segue abaixo.',
        {
          x: 48,
          y: 755,
          size: 10,
          font,
          color: rgb(0.45, 0.45, 0.45),
          maxWidth: pageWidth - 96,
        }
      );
    }
  } else {
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('Contrato / termo de adesão', {
      x: 48,
      y: 780,
      size: 16,
      font,
    });
    page.drawText('Documento sem PDF original cadastrado. Registros abaixo.', {
      x: 48,
      y: 755,
      size: 10,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
  }

  if (signatureDataUrl || photoDataUrl) {
    await appendEvidencePage(pdfDoc, signatureDataUrl, photoDataUrl);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/** Monta o PDF final com contrato do plano + assinatura/foto para envio à API. */
export async function buildSignedContractFile(
  contractPath: string | null,
  signatureDataUrl: string | null,
  photoDataUrl: string | null
): Promise<File> {
  const blob = await buildContractPdfWithEvidence(
    contractPath,
    signatureDataUrl,
    photoDataUrl
  );
  return new File([blob], 'contrato-assinado.pdf', { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
