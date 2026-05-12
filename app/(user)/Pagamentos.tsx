
import React, { useEffect, useState } from 'react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Download, Filter, Search, FileText, Loader2, ArrowRight, CreditCard, QrCode, Barcode, CheckCircle2, Lock, PlusCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { ClientInvoice, SavedCard } from '../../types';
import { useToast } from '../../context/ToastContext';
import { jsPDF } from 'jspdf';
import { SearchSelect } from '../../components/ui/SearchSelect';

export const Pagamentos: React.FC = () => {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'Todos',
    dateFrom: '',
    dateTo: '',
    valueMin: '',
    valueMax: '',
  });

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Credit Card Specific State
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | 'new'>('new'); // 'new' ou id do cartão
  const [cardForm, setCardForm] = useState({
      number: '',
      holder: '',
      expiry: '',
      cvv: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fetch saved cards when opening modal with Credit Card selected or switching to it
  useEffect(() => {
      if (isPaymentModalOpen && paymentMethod === 'CREDIT_CARD') {
          loadSavedCards();
      }
  }, [isPaymentModalOpen, paymentMethod]);

  const loadSavedCards = async () => {
      try {
          const cards = await userService.listSavedCards();
          setSavedCards(cards);
          // Se tiver cartões salvos, seleciona o primeiro por padrão
          if (cards.length > 0) {
              setSelectedCardId(cards[0].idCartao);
          }
      } catch (error) {
          console.warn("Falha ao carregar cartões salvos", error);
      }
  };

  const fetchInvoices = async () => {
    try {
      const data = await userService.listClientInvoices();
      const sorted = data.sort((a, b) => b.idMensalidade - a.idMensalidade);
      setInvoices(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReceiptPDF = (invoice: ClientInvoice) => {
    try {
      const doc = new jsPDF();
      
      // Colors
      const primaryColor = '#0f172a'; // slate-900
      const secondaryColor = '#64748b'; // slate-500
      const accentColor = '#10b981'; // emerald-500
      const lightGray = '#f8fafc'; // slate-50
      
      // Header Background
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 45, 'F');
      
      // Header Text
      doc.setTextColor('#ffffff');
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROVANTE DE PAGAMENTO', 105, 28, { align: 'center' });
      
      // Receipt Info Box
      doc.setFillColor(lightGray);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(15, 60, 180, 130, 4, 4, 'FD');
      
      // Content
      doc.setTextColor(primaryColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhes da Transação', 25, 75);
      
      doc.setFontSize(11);
      doc.setTextColor(secondaryColor);
      
      // Left column labels
      doc.setFont('helvetica', 'normal');
      doc.text('ID da Fatura:', 25, 95);
      doc.text('Estabelecimento:', 25, 110);
      doc.text('Referência:', 25, 125);
      doc.text('Data de Vencimento:', 25, 140);
      doc.text('Status:', 25, 155);
      
      // Right column values
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${invoice.idMensalidade}`, 75, 95);
      doc.text(invoice.nomeEmpresa, 75, 110);
      doc.text(invoice.mesReferencia, 75, 125);
      doc.text(invoice.vencimento, 75, 140);
      
      // Status with color
      doc.setTextColor(accentColor);
      doc.text(invoice.status.toUpperCase(), 75, 155);
      
      // Divider
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineDashPattern([2, 2], 0);
      doc.line(25, 165, 185, 165);
      doc.setLineDashPattern([], 0);
      
      // Total
      doc.setTextColor(secondaryColor);
      doc.setFont('helvetica', 'normal');
      doc.text('Valor Total Pago:', 25, 178);
      
      doc.setTextColor(primaryColor);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${invoice.valor.toFixed(2).replace('.', ',')}`, 185, 179, { align: 'right' });
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor);
      doc.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(`Comprovante gerado em ${today}`, 105, 275, { align: 'center' });
      doc.text('Este documento é um comprovante válido de pagamento.', 105, 280, { align: 'center' });
      
      // Save
      doc.save(`comprovante_fatura_${invoice.idMensalidade}.pdf`);
      addToast('success', 'Download Iniciado', 'O comprovante foi gerado com sucesso.');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      addToast('error', 'Erro', 'Não foi possível gerar o comprovante em PDF.');
    }
  };

  const handlePayClick = (invoice: ClientInvoice) => {
      setSelectedInvoice(invoice);
      setPaymentMethod('PIX'); // Default
      setPaymentSuccess(false);
      setCardForm({ number: '', holder: '', expiry: '', cvv: '' });
      setSelectedCardId('new');
      setIsPaymentModalOpen(true);
  };

  // Mascaras para os inputs
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let formattedValue = value;

      if (name === 'number') {
          // Apenas números, agrupados de 4 em 4
          formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
      } else if (name === 'expiry') {
          // MM/AA
          formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').substring(0, 5);
      } else if (name === 'cvv') {
          // Max 4 digitos
          formattedValue = value.replace(/\D/g, '').substring(0, 4);
      } else if (name === 'holder') {
          // Uppercase
          formattedValue = value.toUpperCase();
      }

      setCardForm(prev => ({ ...prev, [name]: formattedValue }));
  };

  const confirmPayment = async () => {
      if (!selectedInvoice) return;
      
      // Validação básica de cartão se for 'Novo'
      if (paymentMethod === 'CREDIT_CARD' && selectedCardId === 'new') {
          if (cardForm.number.length < 16 || !cardForm.expiry || !cardForm.cvv || !cardForm.holder) {
              addToast('error', 'Dados Inválidos', 'Por favor, preencha corretamente os dados do cartão.');
              return;
          }
      }

      try {
          setIsProcessingPayment(true);
          
          // Mapeamento: 0 = PIX, 1 = Cartão, 2 = Boleto
          const methodMap: Record<string, number> = {
            'PIX': 0,
            'CREDIT_CARD': 1,
            'BOLETO': 2
          };
          
          const methodEnum = methodMap[paymentMethod];

          // Chama serviço de pagamento
          await userService.payInvoice(selectedInvoice.idMensalidade, methodEnum);
          
          setPaymentSuccess(true);
          addToast('success', 'Pagamento Confirmado', 'Sua fatura foi quitada com sucesso!');
          
          // Notificar Sidebar para atualizar badges
          window.dispatchEvent(new CustomEvent('pagweb:refresh-counts'));
          
          // Atualiza lista em background
          await fetchInvoices();
      } catch (error: any) {
          addToast('error', 'Falha no Pagamento', error.message);
      } finally {
          setIsProcessingPayment(false);
      }
  };

  const closePaymentModal = () => {
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentSuccess(false);
  };

  const filteredInvoices = invoices.filter(inv => {
    // Search
    const matchesSearch = 
      inv.nomeEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.idMensalidade.toString().includes(searchTerm);
    
    // Status
    const matchesStatus = filters.status === 'Todos' || inv.status === filters.status;

    // Date Range
    let matchesDate = true;
    if (filters.dateFrom || filters.dateTo) {
      const parts = inv.vencimento.split('/');
      if (parts.length === 3) {
        const invDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom + 'T00:00:00');
          if (invDate < fromDate) matchesDate = false;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo + 'T23:59:59');
          if (invDate > toDate) matchesDate = false;
        }
      }
    }

    // Value Range
    let matchesValue = true;
    if (filters.valueMin) {
      if (inv.valor < Number(filters.valueMin)) matchesValue = false;
    }
    if (filters.valueMax) {
      if (inv.valor > Number(filters.valueMax)) matchesValue = false;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesValue;
  });

  return (
    <UserLayout>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Faturas</h1>
          <p className="text-gray-500 mt-1">Histórico de cobranças e comprovantes.</p>
        </div>
        <Button variant="outline" className="bg-white">
            <Download className="w-4 h-4 mr-2" />
            Baixar Comprovantes
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar fatura por empresa ou ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white text-gray-900 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant={isFilterOpen ? "default" : "outline"} 
            className={isFilterOpen ? "bg-slate-900 text-white" : "bg-white text-gray-600"}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
              <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <SearchSelect 
                options={[
                  { value: 'Todos', label: 'Todos' },
                  { value: 'Aberto', label: 'Aberto' },
                  { value: 'Pago', label: 'Pago' },
                  { value: 'Atrasado', label: 'Atrasado' },
                  { value: 'Baixado', label: 'Baixado' },
                ]}
                value={filters.status}
                onChange={(val) => setFilters({...filters, status: val.toString()})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Inicial (Vencimento)</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-gray-900"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Final (Vencimento)</label>
              <input 
                type="date" 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-gray-900"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor Mín (R$)</label>
                <input 
                  type="number" 
                  placeholder="0,00"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-gray-900"
                  value={filters.valueMin}
                  onChange={(e) => setFilters({...filters, valueMin: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor Máx (R$)</label>
                <input 
                  type="number" 
                  placeholder="0,00"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-gray-900"
                  value={filters.valueMax}
                  onChange={(e) => setFilters({...filters, valueMax: e.target.value})}
                />
              </div>
            </div>
            
            <div className="md:col-span-4 flex justify-end">
               <button 
                 onClick={() => setFilters({ status: 'Todos', dateFrom: '', dateTo: '', valueMin: '', valueMax: '' })}
                 className="text-xs text-gray-500 hover:text-gray-700 underline"
               >
                 Limpar Filtros
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-4">Vencimento</th>
                        <th className="px-6 py-4">Estabelecimento</th>
                        <th className="px-6 py-4">Referência</th>
                        {/* Removido coluna Método */}
                        <th className="px-6 py-4">Valor</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {isLoading ? (
                         <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-2" />
                                    <p>Carregando faturas...</p>
                                </div>
                            </td>
                        </tr>
                    ) : filteredInvoices.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                    <FileText className="w-10 h-10 text-gray-300 mb-2" />
                                    <p>Nenhuma fatura encontrada.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <tr key={inv.idMensalidade} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-gray-600">{inv.vencimento}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{inv.nomeEmpresa}</td>
                                <td className="px-6 py-4 text-gray-500">{inv.mesReferencia}</td>
                                <td className="px-6 py-4 font-bold text-gray-900">R$ {inv.valor.toFixed(2).replace('.', ',')}</td>
                                <td className="px-6 py-4">
                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        inv.status === 'Pago' || inv.status === 'Baixado'
                                        ? 'bg-green-100 text-green-800' 
                                        : inv.status === 'Atrasado'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {inv.status === 'Aberto' || inv.status === 'Atrasado' ? (
                                        <button 
                                            onClick={() => handlePayClick(inv)}
                                            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center transition-colors"
                                        >
                                            Pagar <ArrowRight className="w-3 h-3 ml-1" />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => generateReceiptPDF(inv)}
                                            className="text-gray-400 hover:text-gray-600 text-xs inline-flex items-center"
                                        >
                                            <Download className="w-3 h-3 mr-1" />
                                            Ver Recibo
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Payment Modal Page */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        title={paymentSuccess ? "Pagamento Realizado" : "Realizar Pagamento"}
        size="lg"
        footer={
          !paymentSuccess && (
            <div className="flex justify-between w-full items-center">
                 <div className="flex items-center text-xs text-gray-400">
                    <Lock className="w-3 h-3 mr-1" /> Ambiente Seguro
                 </div>
                 <div className="flex gap-3">
                    <Button variant="outline" onClick={closePaymentModal} disabled={isProcessingPayment}>Cancelar</Button>
                    <Button onClick={confirmPayment} isLoading={isProcessingPayment} className="bg-green-600 hover:bg-green-700 text-white">
                        Confirmar Pagamento
                    </Button>
                 </div>
            </div>
          )
        }
      >
        {paymentSuccess ? (
             <div className="text-center py-8 animate-fadeIn">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
                <p className="text-gray-500 mb-8">
                    O pagamento da fatura <strong>#{selectedInvoice?.idMensalidade}</strong> foi processado com sucesso.
                </p>
                <Button onClick={closePaymentModal} className="w-full max-w-xs mx-auto">
                    Fechar e Voltar
                </Button>
             </div>
        ) : (
            <div className="flex flex-col md:flex-row gap-8">
                {/* Resumo da Fatura */}
                <div className="w-full md:w-1/3 bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumo</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-400">Beneficiário</p>
                            <p className="font-medium text-gray-900">{selectedInvoice?.nomeEmpresa}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Referência</p>
                            <p className="font-medium text-gray-900">{selectedInvoice?.mesReferencia}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Vencimento</p>
                            <p className="font-medium text-gray-900">{selectedInvoice?.vencimento}</p>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-400">Valor a Pagar</p>
                            <p className="text-2xl font-bold text-gray-900">
                                R$ {selectedInvoice?.valor.toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seleção de Método */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Selecione a forma de pagamento</h3>
                    
                    <div className="space-y-3">
                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'PIX' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input 
                                type="radio" 
                                name="method" 
                                className="sr-only" 
                                checked={paymentMethod === 'PIX'}
                                onChange={() => setPaymentMethod('PIX')}
                            />
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 mr-4 border border-gray-100">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">PIX</p>
                                <p className="text-xs text-gray-500">Aprovação imediata</p>
                            </div>
                            {paymentMethod === 'PIX' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </label>

                        <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'CREDIT_CARD' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <div className="flex items-center w-full">
                                <input 
                                    type="radio" 
                                    name="method" 
                                    className="sr-only"
                                    checked={paymentMethod === 'CREDIT_CARD'}
                                    onChange={() => setPaymentMethod('CREDIT_CARD')}
                                />
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 mr-4 border border-gray-100">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                                    <p className="text-xs text-gray-500">Até 12x sem juros</p>
                                </div>
                                {paymentMethod === 'CREDIT_CARD' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </div>

                            {/* Área de Seleção de Cartão Salvo ou Novo */}
                            {paymentMethod === 'CREDIT_CARD' && (
                                <div className="w-full mt-4 pt-4 border-t border-blue-100 animate-fadeIn">
                                    
                                    {savedCards.length > 0 && (
                                        <div className="mb-4 space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Seus Cartões Salvos</p>
                                            {savedCards.map(card => (
                                                <label key={card.idCartao} className={`flex items-center p-3 rounded-lg border cursor-pointer bg-white hover:bg-gray-50 ${
                                                    selectedCardId === card.idCartao ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                                                }`}>
                                                    <input 
                                                        type="radio" 
                                                        name="selectedCard"
                                                        value={card.idCartao}
                                                        checked={selectedCardId === card.idCartao}
                                                        onChange={() => setSelectedCardId(card.idCartao)}
                                                        className="sr-only"
                                                    />
                                                    <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium text-gray-900 uppercase">•••• {card.ultimosDigitos}</span>
                                                        <span className="text-xs text-gray-500 ml-2">{card.bandeira} - {card.mesAnoExpiracao}</span>
                                                    </div>
                                                    {selectedCardId === card.idCartao && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                                </label>
                                            ))}
                                            
                                            <label className={`flex items-center p-3 rounded-lg border cursor-pointer bg-white hover:bg-gray-50 ${
                                                    selectedCardId === 'new' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                                                }`}>
                                                    <input 
                                                        type="radio" 
                                                        name="selectedCard"
                                                        value="new"
                                                        checked={selectedCardId === 'new'}
                                                        onChange={() => setSelectedCardId('new')}
                                                        className="sr-only"
                                                    />
                                                    <PlusCircle className="w-4 h-4 text-gray-400 mr-3" />
                                                    <span className="text-sm font-medium text-gray-900">Usar outro cartão</span>
                                            </label>
                                        </div>
                                    )}

                                    {/* Formulário de Novo Cartão */}
                                    {(selectedCardId === 'new') && (
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Dados do Novo Cartão</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Número do Cartão" 
                                                    className="w-full col-span-2 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                                                    name="number"
                                                    value={cardForm.number}
                                                    onChange={handleCardInputChange}
                                                    maxLength={19}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="MM/AA" 
                                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                                                    name="expiry"
                                                    value={cardForm.expiry}
                                                    onChange={handleCardInputChange}
                                                    maxLength={5}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="CVV" 
                                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                                                    name="cvv"
                                                    value={cardForm.cvv}
                                                    onChange={handleCardInputChange}
                                                    maxLength={4}
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Nome no Cartão" 
                                                    className="w-full col-span-2 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                                                    name="holder"
                                                    value={cardForm.holder}
                                                    onChange={handleCardInputChange}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </label>

                        <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'BOLETO' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <input 
                                type="radio" 
                                name="method" 
                                className="sr-only"
                                checked={paymentMethod === 'BOLETO'}
                                onChange={() => setPaymentMethod('BOLETO')}
                            />
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 mr-4 border border-gray-100">
                                <Barcode className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Boleto Bancário</p>
                                <p className="text-xs text-gray-500">Compensação em até 3 dias úteis</p>
                            </div>
                            {paymentMethod === 'BOLETO' && <CheckCircle2 className="w-5 h-5 text-orange-600" />}
                        </label>
                    </div>

                </div>
            </div>
        )}
      </Modal>

    </UserLayout>
  );
};
