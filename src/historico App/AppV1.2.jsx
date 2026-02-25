import React, { useState, useEffect } from 'react';
// Importação da ligação ao banco de dados
import { supabase } from './supabaseClient'; 
// Importação dos ícones
import { PlusCircle, Search, X, Send, Calendar, Tag } from 'lucide-react';

export default function App() {
  // --- 1. ESTADOS (Memória do Componente) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]); // Começa vazio, será preenchido pelo Supabase
  const [loading, setLoading] = useState(true);

  // --- 2. FUNÇÃO PARA LER OS TICKETS (FETCH) ---
  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao procurar tickets:', error.message);
    } else {
      // Mapeamos os nomes das colunas do Supabase para o nosso padrão local
      const ticketsFormatados = data.map(t => ({
        id: t.id,
        subject: t.Title,
        description: t.Description,
        priority: t.Priority,
        type: t.Type,
        status: t.Status,
        endDate: t["End Date"]
      }));
      setTickets(ticketsFormatados);
    }
    setLoading(false);
  };

  // --- 3. EXECUTAR AO ABRIR O SITE ---
  useEffect(() => {
    fetchTickets();
  }, []);

  // --- 4. FUNÇÃO PARA CRIAR NOVO TICKET (SAVE) ---
  const handleAddTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const novoTicketParaEnviar = {
      Title: formData.get('subject'),
      Description: formData.get('description'),
      Priority: formData.get('priority'),
      Type: formData.get('type'),
      Status: 'Aberto',
      "End Date": formData.get('endDate'),
      "Created On": new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase
      .from('tickets')
      .insert([novoTicketParaEnviar]);

    if (error) {
      alert("Erro ao gravar: " + error.message);
    } else {
      alert("Ticket guardado na nuvem!");
      setIsModalOpen(false);
      fetchTickets(); // Atualiza a lista automaticamente
    }
  };

  // --- 5. LÓGICA DE CORES E FILTRO ---
  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Crítica': return 'text-red-600 bg-red-100';
      case 'Alta': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suporte Central</h1>
          <p className="text-gray-500">Gestão de incidentes em tempo real</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
        >
          <PlusCircle size={20} /> Novo Ticket
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por assunto..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA DE TICKETS */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 italic">A carregar tickets do Supabase...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">ID</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Assunto / Tipo</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Prioridade</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Previsão</th>
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
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm font-medium">{ticket.status}</td>
                    <td className="p-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1"><Calendar size={14} /> {ticket.endDate || '---'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORMULÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Abrir Incidente</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleAddTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assunto</label>
                <input name="subject" required className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Erro no servidor" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                <textarea name="description" rows="2" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalhes do problema..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <select name="type" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>Suporte</option>
                    <option>Manutenção</option>
                    <option>Financeiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridade</label>
                  <select name="priority" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>Baixa</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Previsão de Conclusão</label>
                <input name="endDate" type="date" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2 mt-4">
                <Send size={18} /> Enviar Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}