import { AuthAudience } from '../../../../utils/authTheme';

export interface RegisterFormData {
  nome: string;
  sobreNome: string;
  cpf: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefone: string;
  fotoPerfil: File | null;
  companyNome: string;
  companyCnpj: string;
  companyTelefone: string;
  companyLogo: File | null;
  fotoPerfilUrl: string;
  companyLogoUrl: string;
  ddi: string;
  companyDdi: string;
}

export interface RegisterStepProps {
  formData: RegisterFormData;
  audience: AuthAudience;
  isEmailLocked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (name: 'telefone' | 'companyTelefone', value: string) => void;
  onDdiChange: (name: 'ddi' | 'companyDdi', value: string) => void;
}
