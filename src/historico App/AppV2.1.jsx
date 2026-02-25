import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import { PlusCircle, Search, X, Send, Calendar, Tag, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      const ticketsFormatados = data.map(t => ({
        id: t.id,
        subject: t.Title,
        description: t.Description,
        priority: t.Priority,
        type: t.Type,
        status: t.Status,
        endDate: t["End Date"],
        createdOn: t["Created On"]
      }));
      
      setTickets(ticketsFormatados);
    } catch (error) {
      console.error('Erro ao carregar:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NOVA FUNÇÃO: ALTERNAR STATUS ---
  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Aberto' ? 'Resolvido' : 'Aberto';
    
    const { error } = await supabase
      .from('tickets')
      .update({ Status: nextStatus })
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
    } else {
      // Atualiza apenas o ticket alterado no estado para ser mais rápido
      setTickets(tickets.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAddTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const novoTicketParaEnviar = {
      "Title": formData.get('subject'),
      "Description": formData.get('description'),
      "Priority": formData.get('priority'),
      "Type": formData.get('type'),
      "Status": 'Aberto',
      "End Date": formData.get('endDate'),
      "Created On": new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('tickets').insert([novoTicketParaEnviar]);

    if (error) {
      alert("Erro: " + error.message);
    } else {
      setIsModalOpen(false);
      fetchTickets();
    }
  };

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
          <p className="text-gray-500">Gestão Dinâmica de Status</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg">
          <PlusCircle size={20} /> Novo Ticket
        </button>
      </div>

      {/* LISTA */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">A carregar...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">ID</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Assunto</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Prioridade</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Status (Clique)</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase">Previsão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
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
                    <td className="p-4">
                       <button 
                         onClick={() => toggleStatus(ticket.id, ticket.status)}
                         className={`mx-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                           ticket.status === 'Resolvido' 
                           ? 'bg-green-50 border-green-200 text-green-700' 
                           : 'bg-amber-50 border-amber-200 text-amber-700'
                         }`}
                       >
                         {ticket.status === 'Resolvido' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                         {ticket.status}
                       </button>
                    </td>
                    <td className="p-4 text-sm text-gray-400 font-medium">
                      {ticket.endDate || 'S/ Data'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL (Mantido igual ao anterior) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Ticket</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleAddTicket} className="space-y-4">
              <input name="subject" required className="w-full border rounded-lg p-2" placeholder="Assunto" />
              <textarea name="description" className="w-full border rounded-lg p-2" placeholder="Descrição" />
              <div className="grid grid-cols-2 gap-4">
                <select name="type" className="border rounded-lg p-2"><option>Suporte</option><option>Manutenção</option></select>
                <select name="priority" className="border rounded-lg p-2"><option>Baixa</option><option>Alta</option><option>Crítica</option></select>
              </div>
              <input name="endDate" type="date" className="w-full border rounded-lg p-2" />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Criar Ticket</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}