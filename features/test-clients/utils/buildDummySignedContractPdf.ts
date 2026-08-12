import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * PDF mínimo usado no auto-aceite de assinaturas de clientes de teste.
 * Cobre planos com TipoContrato=Contrato (API exige IFormFile Contrato).
 */
export const buildDummySignedContractPdfFile = async (
  clientEmail: string,
): Promise<File> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  const margin = 48;

  page.drawText('Contrato de teste — aceite automático', {
    x: margin,
    y: height - margin,
    size: 14,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`Cliente: ${clientEmail}`, {
    x: margin,
    y: height - margin - 28,
    size: 11,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });
  page.drawText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
    x: margin,
    y: height - margin - 48,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('Documento sintético para massa de teste PagWeb.', {
    x: margin,
    y: height - margin - 72,
    size: 10,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  const bytes = await pdfDoc.save();
  return new File([bytes], 'contrato-teste-auto.pdf', { type: 'application/pdf' });
};
