import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPasswordRules } from '../../utils/validators';

interface PasswordRequirementsProps {
  password: string;
}

/**
 * A lista de regras da senha, marcada ao vivo enquanto o usuário digita.
 *
 * Existe porque a alternativa é só reprovar no "Continuar": o usuário descobre a regra depois
 * de escrever a senha inteira, e descobre uma por vez. Aqui ele vê as quatro desde o começo e
 * cada uma fecha sozinha.
 *
 * Some quando o campo está vazio — uma parede de X vermelhos antes de o usuário digitar a
 * primeira letra é reprovar alguém que ainda não tentou.
 */
export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password }) => {
  if (!password) return null;

  const rules = checkPasswordRules(password);

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            rule.met ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {rule.met ? (
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : (
            <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
          )}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
};
