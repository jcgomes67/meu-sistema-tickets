import React, { useState } from 'react';
import { PlusCircle, Search, Filter, Clock, AlertCircle, CheckCircle, X, Send, Calendar, Tag } from 'lucide-react';

export default function App() {
  // --- ESTADOS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  
  // Lista inicial atualizada com os novos campos
  const [tickets, setTickets] = useState([
    { 
      id: '101', 
      subject: 'Erro no Login', 
      description: 'Utilizadores não conseguem aceder à área restrita.',
      type: 'Suporte',
      priority: 'Alta', 
      status: 'Aberto', 
      date: '2024-05-20',
      endDate: '2024-05-25'
    },
  ]);

  // Função para adicionar novo ticket (Local)
  const handleAddTicket = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newTicket = {
      id: Math.floor(Math.random() * 1000).toString(),
      subject: formData.get('subject'),
      description: formData.get('description'), // Novo campo
      type: formData.get('type'),               // Novo campo
      priority: formData.get('priority'),
      status: 'Aberto',
      date: new Date().toLocaleDateString(),
      endDate: formData.get('endDate')          // Novo campo
    };
    
    setTickets([...tickets, newTicket]);
    setIsModalOpen(false);
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Crítica': return 'text-red-600 bg-red-100';
      case 'Alta': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const filteredTickets = tickets.filter(t => 
    (t.subject.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'Todos' || t.status === filterStatus)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suporte Central</h1>
          <p className="text-gray-500">Gestão de incidentes (Versão Local Atualizada)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
        >
          <PlusCircle size={20} /> Novo Ticket
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar ticket pelo assunto..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Tickets (Tabela melhorada) */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Assunto / Tipo</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Prioridade</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Previsão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-blue-600">#{ticket.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{ticket.subject}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1"><Tag size={12} /> {ticket.type}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{ticket.status}</td>
                  <td className="p-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1"><Calendar size={14} /> {ticket.endDate || 'N/A'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DO FORMULÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Novo Ticket</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input name="subject" required className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="description" rows="2" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalhes do problema..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select name="type" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Suporte</option>
                    <option>Manutenção</option>
                    <option>Financeiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select name="priority" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Baixa</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Entrega</label>
                <input name="endDate" type="date" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Send size={18} /> Criar Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}