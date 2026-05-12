export interface Country {
  name: string;
  code: string;
  ddi: string;
  flag: string;
}

export const countries: Country[] = [
  { name: 'Brasil', code: 'BR', ddi: '55', flag: '🇧🇷' },
  { name: 'Estados Unidos', code: 'US', ddi: '1', flag: '🇺🇸' },
  { name: 'Portugal', code: 'PT', ddi: '351', flag: '🇵🇹' },
  { name: 'Argentina', code: 'AR', ddi: '54', flag: '🇦🇷' },
  { name: 'Espanha', code: 'ES', ddi: '34', flag: '🇪🇸' },
  { name: 'França', code: 'FR', ddi: '33', flag: '🇫🇷' },
  { name: 'Reino Unido', code: 'GB', ddi: '44', flag: '🇬🇧' },
  { name: 'Alemanha', code: 'DE', ddi: '49', flag: '🇩🇪' },
  { name: 'Itália', code: 'IT', ddi: '39', flag: '🇮🇹' },
  { name: 'Canadá', code: 'CA', ddi: '1', flag: '🇨🇦' },
  { name: 'Japão', code: 'JP', ddi: '81', flag: '🇯🇵' },
  { name: 'China', code: 'CN', ddi: '86', flag: '🇨🇳' },
  { name: 'México', code: 'MX', ddi: '52', flag: '🇲🇽' },
  { name: 'Chile', code: 'CL', ddi: '56', flag: '🇨🇱' },
  { name: 'Colômbia', code: 'CO', ddi: '57', flag: '🇨🇴' },
  { name: 'Uruguai', code: 'UY', ddi: '598', flag: '🇺🇾' },
  { name: 'Paraguai', code: 'PY', ddi: '595', flag: '🇵🇾' },
].sort((a, b) => a.name.localeCompare(b.name));

// Coloca o Brasil no topo
const brazilIndex = countries.findIndex(c => c.code === 'BR');
if (brazilIndex > -1) {
  const brazil = countries.splice(brazilIndex, 1)[0];
  countries.unshift(brazil);
}
