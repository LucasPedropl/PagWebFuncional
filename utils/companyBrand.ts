/** Extrai até 2 iniciais do nome da empresa para exibição sem logo. */
export const getCompanyInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

/** Cor de fundo estável por id ou nome (para avatares sem logo). */
export const getCompanyAvatarTone = (seed: string | number): string => {
  const palette = [
    'bg-slate-700',
    'bg-blue-700',
    'bg-indigo-700',
    'bg-violet-700',
    'bg-teal-700',
    'bg-emerald-700',
    'bg-amber-700',
    'bg-rose-700',
  ];
  const key = String(seed);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % palette.length;
  }
  return palette[hash];
};
