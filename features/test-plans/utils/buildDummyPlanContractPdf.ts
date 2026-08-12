import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** PDF modelo anexado ao plano de teste com TipoContrato=Contrato. */
export const buildDummyPlanContractPdfFile = async (
  planName: string,
): Promise<File> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  const margin = 48;

  page.drawText('Contrato modelo — plano de teste PagWeb', {
    x: margin,
    y: height - margin,
    size: 14,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`Plano: ${planName}`, {
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
  page.drawText('Documento sintético para testes de assinatura/visualização.', {
    x: margin,
    y: height - margin - 72,
    size: 10,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  page.drawText('Cláusula 1 — Objeto: prestação de serviço de teste.', {
    x: margin,
    y: height - margin - 110,
    size: 10,
    font,
  });
  page.drawText('Cláusula 2 — Vigência: conforme período da assinatura.', {
    x: margin,
    y: height - margin - 128,
    size: 10,
    font,
  });
  page.drawText('Cláusula 3 — Assinatura digital e foto quando exigidas.', {
    x: margin,
    y: height - margin - 146,
    size: 10,
    font,
  });

  const bytes = await pdfDoc.save();
  return new File([bytes], 'contrato-plano-teste.pdf', { type: 'application/pdf' });
};
