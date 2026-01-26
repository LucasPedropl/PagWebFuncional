import React, { useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';

// Mock Data
const MOCK_CLIENTS = [
  { id: 1, nome: 'João da Silva', cpf: '123.456.789-00', email: 'joao@empresa.com', telefone: '(11) 99999-9999', status: 'Ativo', data: '15/08/2023' },
  { id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-11', email: 'maria@loja.com', telefone: '(21) 98888-8888', status: 'Inativo', data: '01/03/2023' },
  { id: 3, nome: 'Carlos Ferreira', cpf: '456.789.123-22', email: 'carlos@tech.com', telefone: '(31) 97777-7777', status: 'Ativo', data: '10/09/2023' },
];

export const Clientes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Implement save logic here
    console.log('Saving client:', formData);
    setIsModalOpen(false);
    setFormData({ nome: '', sobrenome: '', cpf: '', email: '', telefone: '', endereco: '' });
  };

  return (
    <BusinessLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
          <p className="text-gray-500 mt-1">Cadastro de pessoas físicas.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="text-gray-600">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">CPF</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data Cadastro</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_CLIENTS.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{client.cpf}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{client.email}</span>
                      <span className="text-xs text-gray-400">{client.telefone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'Ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        client.status === 'Ativo' ? 'bg-green-600' : 'bg-red-600'
                      }`}></span>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{client.data}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-indigo-600 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Cliente"
        size="lg"
        footer={
          <>
            <Button onClick={handleSave}>Cadastrar Cliente</Button>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Dados Pessoais</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Nome" 
                placeholder="Primeiro nome" 
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
              />
              <Input 
                label="Sobrenome" 
                placeholder="Sobrenome" 
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleInputChange}
              />
            </div>
            <Input 
              label="CPF" 
              placeholder="000.000.000-00" 
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contato & Endereço</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Email" 
                placeholder="email@exemplo.com" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <Input 
                label="Telefone" 
                placeholder="(00) 00000-0000" 
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
              />
            </div>
            <Input 
              label="Endereço Completo" 
              placeholder="Rua, Número, Bairro, Cidade - UF" 
              name="endereco"
              value={formData.endereco}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </Modal>
    </BusinessLayout>
  );
};