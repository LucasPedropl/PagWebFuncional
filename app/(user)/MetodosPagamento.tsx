import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CreditCard, PlusCircle, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { SavedCard } from '../../types';
import { useToast } from '../../context/ToastContext';
import { CreditCardVisual } from '../../components/ui/CreditCardVisual';

// Luhn algorithm for credit card validation
const isValidLuhn = (number: string) => {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Expiry validation
const isValidExpiry = (expiry: string) => {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  
  const [month, year] = expiry.split('/').map(num => parseInt(num, 10));
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
};

const detectBrand = (number: string) => {
  const cleanNumber = number.replace(/\D/g, '');
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[0-1]\d|2720)/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^(4011|4312|4389|4514|5066|5067|5090|636368)/.test(cleanNumber)) return 'elo';
  if (/^(30[15]|36|38)/.test(cleanNumber)) return 'diners';
  if (/^(6011|622|64|65)/.test(cleanNumber)) return 'discover';
  if (/^6062/.test(cleanNumber)) return 'hipercard';
  return 'unknown';
};

export const MetodosPagamento: React.FC = () => {
  const { addToast } = useToast();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const [cardForm, setCardForm] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    isDefault: false
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const data = await userService.listSavedCards();
      setCards(data);
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao carregar cartões.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (card?: SavedCard) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        number: card.numCartao ? card.numCartao.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19) : `**** **** **** ${card.ultimosDigitos}`,
        holder: card.nomeNoCartao,
        expiry: card.mesAnoExpiracao,
        cvv: card.ccv || '***',
        isDefault: card.isDefault
      });
    } else {
      setEditingCard(null);
      setCardForm({
        number: '',
        holder: '',
        expiry: '',
        cvv: '',
        isDefault: cards.length === 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setCardForm(prev => ({ ...prev, [name]: checked }));
      return;
    }

    let formattedValue = value;

    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
    } else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').substring(0, 5);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (name === 'holder') {
      formattedValue = value.toUpperCase();
    }

    setCardForm(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidLuhn(cardForm.number)) {
      addToast('error', 'Cartão Inválido', 'O número do cartão de crédito é inválido.');
      return;
    }
    if (!isValidExpiry(cardForm.expiry)) {
      addToast('error', 'Validade Inválida', 'A data de validade é inválida ou o cartão está expirado.');
      return;
    }
    if (cardForm.cvv.length < 3) {
      addToast('error', 'CVV Inválido', 'O código de segurança deve ter 3 ou 4 dígitos.');
      return;
    }
    if (cardForm.holder.trim().length < 3) {
      addToast('error', 'Nome Inválido', 'O nome impresso no cartão é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCard) {
        await userService.updateSavedCard(editingCard.idCartao, {
          nomeNoCartao: cardForm.holder,
          numCartao: cardForm.number,
          ccv: cardForm.cvv,
          bandeira: detectBrand(cardForm.number).toUpperCase(),
          mesAnoExpiracao: cardForm.expiry,
          isDefault: cardForm.isDefault
        });
        addToast('success', 'Sucesso', 'Cartão atualizado com sucesso.');
      } else {
        await userService.createSavedCard({
          nomeNoCartao: cardForm.holder,
          numCartao: cardForm.number,
          ccv: cardForm.cvv,
          bandeira: detectBrand(cardForm.number).toUpperCase(),
          mesAnoExpiracao: cardForm.expiry,
          isDefault: cardForm.isDefault
        });
        addToast('success', 'Sucesso', 'Cartão adicionado com sucesso.');
      }
      
      handleCloseModal();
      loadCards();
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao salvar cartão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este cartão?')) return;
    
    try {
      await userService.deleteSavedCard(id);
      addToast('success', 'Sucesso', 'Cartão removido com sucesso.');
      loadCards();
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Falha ao remover cartão.');
    }
  };

  return (
    <UserLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métodos de Pagamento</h1>
          <p className="text-gray-500 mt-1">Gerencie seus cartões de crédito para pagamentos.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          Adicionar Cartão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-2" />
            <p>Carregando cartões...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum cartão salvo</h3>
            <p className="mb-6">Adicione um cartão de crédito para facilitar seus pagamentos.</p>
            <div className="flex justify-center">
              <Button onClick={() => handleOpenModal()} variant="outline">
                Adicionar Cartão
              </Button>
            </div>
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.idCartao} className="relative group w-[320px] mx-auto">
              {card.isDefault && (
                <div className="absolute -top-2 -right-2 z-20 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  Principal
                </div>
              )}
              
              <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(card)}
                  className="p-1.5 text-white bg-black/40 hover:bg-blue-600 rounded-lg backdrop-blur-md transition-colors shadow-sm"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(card.idCartao)}
                  className="p-1.5 text-white bg-black/40 hover:bg-red-600 rounded-lg backdrop-blur-md transition-colors shadow-sm"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="transform transition-transform group-hover:scale-[1.02] duration-300">
                <CreditCardVisual 
                  number={`**** **** **** ${card.ultimosDigitos}`}
                  holder={card.nomeNoCartao}
                  expiry={card.mesAnoExpiracao}
                  brand={card.bandeira}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCard ? "Editar Cartão" : "Adicionar Novo Cartão"}
        size="2xl"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Lado Esquerdo: Desenho do Cartão */}
          <div className="flex-shrink-0 flex items-center justify-center md:items-start md:pt-4">
            <CreditCardVisual 
              number={cardForm.number}
              holder={cardForm.holder}
              expiry={cardForm.expiry}
              cvv={cardForm.cvv}
              isFlipped={isFlipped}
            />
          </div>

          {/* Lado Direito: Formulário */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingCard && (
                <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 flex gap-2 items-start mb-4">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Os dados do seu cartão são criptografados e armazenados de forma segura pelo nosso gateway de pagamento.</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número do Cartão</label>
                  <input 
                    type="text" 
                    name="number"
                    value={cardForm.number}
                    onChange={handleInputChange}
                    onFocus={() => setIsFlipped(false)}
                    placeholder="0000 0000 0000 0000" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                    maxLength={19}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome impresso no cartão</label>
                  <input 
                    type="text" 
                    name="holder"
                    value={cardForm.holder}
                    onChange={handleInputChange}
                    onFocus={() => setIsFlipped(false)}
                    placeholder="NOME DO TITULAR" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                    <input 
                      type="text" 
                      name="expiry"
                      value={cardForm.expiry}
                      onChange={handleInputChange}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="MM/AA" 
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input 
                      type="text" 
                      name="cvv"
                      value={cardForm.cvv}
                      onChange={handleInputChange}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      placeholder="123" 
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isDefault"
                    checked={cardForm.isDefault}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Definir como cartão principal</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isSubmitting} className="bg-slate-900 hover:bg-slate-800 text-white">
                  {editingCard ? 'Salvar Alterações' : 'Adicionar Cartão'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </UserLayout>
  );
};
