import React, { useState } from 'react';
import { PlusCircle, Search, Filter, Clock, AlertCircle, CheckCircle, X, Send } from 'lucide-react';

export default function App() {
  // --- ESTADOS (Lógica de funcionamento) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [tickets, setTickets] = useState([
    { id: '101', subject: 'Erro no Login', priority: 'Alta', status: 'Aberto', date: '2024-05-20' },
    { id: '102', subject: 'Atualizar Logo', priority: 'Baixa', status: 'Em progresso', date: '2024-05-21' },
  ]);

  // Função para adicionar novo ticket
  const handleAddTicket = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTicket = {
      id: Math.floor(Math.random() * 1000).toString(),
      subject: formData.get('subject'),
      priority: formData.get('priority'),
      status: 'Aberto',
      date: new Date().toLocaleDateString()
    };
    setTickets([...tickets, newTicket]);
    setIsModalOpen(false); // Fecha a janela após salvar
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
          <p className="text-gray-500">Gestão de incidentes</p>
        </div>
        {/* BOTÃO QUE ABRE O FORMULÁRIO */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
        >
          <PlusCircle size={20} /> Novo Ticket
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar ticket..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Tickets */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="grid grid-cols-1 md:grid-cols-5 p-4 hover:bg-gray-50 items-center">
              <span className="font-bold text-blue-600">#{ticket.id}</span>
              <span className="font-semibold text-gray-800">{ticket.subject}</span>
              <span><span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span></span>
              <span className="text-gray-600 text-sm">{ticket.status}</span>
              <span className="text-sm text-gray-400">{ticket.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DO FORMULÁRIO (Aparece apenas quando isModalOpen é true) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select name="priority" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Baixa</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
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