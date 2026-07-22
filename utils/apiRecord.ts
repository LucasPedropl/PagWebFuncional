/** Lê propriedade em camelCase ou PascalCase (respostas .NET). */
export const pickRecordField = (
  record: Record<string, unknown>,
  ...keys: string[]
): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
};

export const pickRecordNumber = (
  record: Record<string, unknown>,
  ...keys: string[]
): number => {
  const raw = pickRecordField(record, ...keys);
  if (raw === undefined || raw === null || raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

export const pickRecordBoolean = (
  record: Record<string, unknown>,
  ...keys: string[]
): boolean => {
  const raw = pickRecordField(record, ...keys);
  if (raw === true || raw === 'true' || raw === 1 || raw === '1') return true;
  return false;
};
