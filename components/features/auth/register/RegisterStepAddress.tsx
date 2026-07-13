import React from 'react';
import { EnderecoFormFields } from '../../../../features/address/components/EnderecoFormFields';
import { RegisterStepProps } from './registerTypes';

interface RegisterStepAddressProps extends Pick<RegisterStepProps, 'formData' | 'onEnderecoChange'> {
  isBusiness: boolean;
}

export const RegisterStepAddress: React.FC<RegisterStepAddressProps> = ({
  formData,
  onEnderecoChange,
  isBusiness,
}) => (
  <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
    <EnderecoFormFields
      value={formData.endereco}
      onChange={onEnderecoChange}
      title={isBusiness ? 'Endereço da empresa' : 'Endereço de residência'}
      subtitle={
        isBusiness
          ? 'Usado na vitrine e nos dados cadastrais do estabelecimento.'
          : 'Obrigatório para processar pagamentos (PIX, boleto, etc.).'
      }
    />
  </div>
);
