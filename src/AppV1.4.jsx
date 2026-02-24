import React, { useState, useEffect } from 'react';
// Importação da configuração do Supabase
import { supabase } from './supabaseClient'; 
// Importação dos ícones
import { PlusCircle, Search, X, Send, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function App() {
  // --- 1. ESTADOS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]); // Lista começa vazia para receber dados reais
  const [loading, setLoading] = useState(true);

  // --- 2. FUNÇÃO PARA LER OS TICKETS (FETCH) ---
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      // Mapeamento rigoroso de acordo com as colunas da tua tabela
      const ticketsFormatados = data.map(t => ({
        id: t.id,
        subject: t.Title,        // Mapeia 'Title' do banco para 'subject'
        description: t.Description,
        priority: t.Priority,
        type: t.Type,
        status: t.Status,
        endDate: t["End Date"],  // Nome com espaço exige esta sintaxe
        createdOn: t["Created On"]
      }));
      
      setTickets(ticketsFormatados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. CARREGAMENTO INICIAL ---
  useEffect(() => {
    fetchTickets();
  }, []);

  // --- 4. FUNÇÃO PARA CRIAR TICKET (INSERT) ---
  const handleAddTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Objeto com as chaves exatas das tuas colunas no Supabase
    const novoTicketParaEnviar = {
      "Title": formData.get('subject'),
      "Description": formData.get('description'),
      "Priority": formData.get('priority'),
      "Type": formData.get('type'),
      "Status": 'Aberto',
      "End Date": formData.get('endDate'),
      "Created On": new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase
      .from('tickets')
      .insert([novoTicketParaEnviar]);

    if (error) {
      alert("Erro ao gravar: " + error.message);
    } else {
      alert("Ticket guardado com sucesso!");
      setIsModalOpen(false);
      fetchTickets(); // <--- Atualiza a lista automaticamente após gravar
    }
  };

  // --- 5. AUXILIARES DE DESIGN ---
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Suporte Central</h1>
          <p className="text-gray-500">Dados em tempo real do Supabase 🚀</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg active:scale-95"
        >
          <PlusCircle size={20} /> Novo Ticket
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por assunto..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTA DE TICKETS */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-400 animate-pulse font-medium">A sincronizar com a nuvem...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
            <p>Nenhum ticket encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Assunto</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Prioridade</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Previsão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors cursor-default">
                    <td className="p-4 font-bold text-blue-600">#{ticket.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{ticket.subject}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Tag size={12} /> {ticket.type}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                       <span className="text-gray-600 text-sm font-medium flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                         {ticket.status}
                       </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} /> {ticket.endDate || 'S/ Data'}
                      </div>
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Abrir Novo Ticket</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assunto</label>
                <input name="subject" required className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200" placeholder="Título curto do problema" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                <textarea name="description" rows="3" className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200" placeholder="Explique os detalhes..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <select name="type" className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200 cursor-pointer">
                    <option>Suporte</option>
                    <option>Manutenção</option>
                    <option>Financeiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridade</label>
                  <select name="priority" className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200 cursor-pointer">
                    <option>Baixa</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Previsão de Conclusão</label>
                <input name="endDate" type="date" className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95">
                <Send size={18} /> Publicar no Supabase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}