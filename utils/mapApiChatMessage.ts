import { ChatMessage, ChatMessageMetadata } from '../types';
import {
  pickRecordBoolean,
  pickRecordField,
  pickRecordNumber,
} from './apiRecord';
const isEmpresaTipo = (tipo: unknown): boolean =>
  tipo === 0 ||
  tipo === '0' ||
  tipo === 'Admin' ||
  tipo === 'Empresa' ||
  tipo === 'admin' ||
  tipo === 'empresa';

export const mapApiChatMessage = (
  raw: unknown,
  idChat: number,
): ChatMessage => {
  const m = (raw ?? {}) as Record<string, unknown>;

  const tipoRaw = pickRecordField(m, 'tipo', 'Tipo', 'tipoUsuario', 'TipoUsuario');
  const tipoRemetente: 'Cliente' | 'Empresa' = isEmpresaTipo(tipoRaw)
    ? 'Empresa'
    : 'Cliente';

  const idRemetente = pickRecordNumber(
    m,
    'idRemetente',
    'IdRemetente',
    'idUsuario',
    'IdUsuario',
    'idUser',
    'IdUser',
  );

  const planoRaw = pickRecordField(m, 'plano', 'Plano');
  let metadata: ChatMessageMetadata | undefined;
  if (planoRaw && typeof planoRaw === 'object') {
    const plano = planoRaw as Record<string, unknown>;
    metadata = {
      idPlano: pickRecordNumber(plano, 'idPlano', 'IdPlano'),
      nomePlano: String(
        pickRecordField(plano, 'nomePlano', 'NomePlano') ?? '',
      ),
      valorMensalidade: pickRecordNumber(
        plano,
        'valorPlano',
        'ValorPlano',
        'valorMensalidade',
        'ValorMensalidade',
      ),
    };
  }

  const lida =
    pickRecordBoolean(
      m,
      'lida',
      'Lida',
      'visualizada',
      'Visualizada',
      'lidaDestinatario',
      'LidaDestinatario',
    ) ||
    Boolean(
      pickRecordField(
        m,
        'dataLeitura',
        'DataLeitura',
        'dataVisualizacao',
        'DataVisualizacao',
      ),
    );

  const conteudo = pickRecordField(m, 'conteudo', 'Conteudo', 'texto', 'Texto');

  return {
    idMensagem: pickRecordNumber(m, 'idMensagem', 'IdMensagem', 'id', 'Id'),
    idChat,
    texto: String(conteudo ?? ''),
    tipoRemetente,
    idRemetente,
    dataEnvio: String(
      pickRecordField(m, 'dataEnvio', 'DataEnvio') ??
        new Date().toISOString(),
    ),
    lida,
    metadata,
  };
};
