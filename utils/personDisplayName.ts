/** Nome + sobrenome, sem duplicar se o primeiro já veio concatenado da API. */
export const formatPersonFullName = (
  nome?: string | null,
  sobreNome?: string | null,
): string => {
  const first = (nome ?? '').trim();
  const last = (sobreNome ?? '').trim();
  if (!first) return last;
  if (!last) return first;
  if (first.toLowerCase().includes(last.toLowerCase())) return first;
  return `${first} ${last}`;
};

export const isGenericChatClientLabel = (name: string): boolean =>
  name.trim().toLowerCase() === 'cliente';
