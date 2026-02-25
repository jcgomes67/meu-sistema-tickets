import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import { 
  PlusCircle, Search, X, Send, Calendar, Tag, 
  AlertCircle, CheckCircle2, Clock, ChevronDown, 
  ChevronUp, Edit3, Save, Trash2 
} from 'lucide-react';

export default function App() {
  // --- ESTADOS ---
  const [tickets, setTickets] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- LEITURA (FETCH) ---
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
        createdOn: t["Created On"],
        userEmail: t["User Email"]
      }));
      setTickets(ticketsFormatados);
    } catch (error) {
      console.error('Erro ao carregar:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  // --- NOVA FUNÇÃO: APAGAR TAREFA (DELETE) ---
  const handleDeleteTicket = async (id) => {
    if (window.confirm("Deseja eliminar esta tarefa permanentemente?")) {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao eliminar: " + error.message);
      } else {
        // Remove da lista local instantaneamente
        setTickets(tickets.filter(t => t.id !== id));
      }
    }
  };

  // --- CRIAR OU EDITAR (UPSERT) ---
  const handleSaveTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const ticketData = {
      "Title": formData.get('subject'),
      "Description": formData.get('description'),
      "Priority": formData.get('priority'),
      "Type": formData.get('type'),
      "End Date": formData.get('endDate'),
      "User Email": formData.get('userEmail'),
      "Status": editingTicket ? editingTicket.status : 'Aberto',
      "Created On": editingTicket ? editingTicket.createdOn : new Date().toISOString().split('T')[0]
    };

    let error;
    if (editingTicket) {
      const result = await supabase.from('tickets').update(ticketData).eq('id', editingTicket.id);
      error = result.error;
    } else {
      const result = await supabase.from('tickets').insert([ticketData]);
      error = result.error;
    }

    if (error) {
      alert("Erro ao gravar: " + error.message);
    } else {
      setIsModalOpen(false);
      setEditingTicket(null);
      fetchTickets();
    }
  };

  // --- ALTERNAR STATUS RÁPIDO ---
  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Aberto' ? 'Resolvido' : 'Aberto';
    const { error } = await supabase.from('tickets').update({ Status: nextStatus }).eq('id', id);
    if (!error) {
      setTickets(tickets.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    }
  };

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Crítica': return 'text-red-600 bg-red-100';
      case 'Alta': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const filteredTickets = tickets.filter(t => t.subject?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center" style={{ width: '190px' }}>
            <img src="/logo.png" alt="Logo Sales Group" className="max-w-full h-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestão de Pendentes</h1>
            <p className="text-gray-500 font-medium">Tarefas: João Costa Gomes</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingTicket(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
        >
          <PlusCircle size={20} /> Novo Ticket
        </button>
      </div>

      {/* LISTA */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Tarefa</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Prioridade</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr className={`transition-colors ${expandedRow === ticket.id ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{ticket.subject}</div>
                      <div className="text-xs text-gray-400">#{ticket.id} • {ticket.type}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleStatus(ticket.id, ticket.status)} className={`px-3 py-1 rounded-full text-xs font-bold border ${ticket.status === 'Resolvido' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                        {ticket.status}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                        {expandedRow === ticket.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <button onClick={() => { setEditingTicket(ticket); setIsModalOpen(true); }} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors">
                        <Edit3 size={18} />
                      </button>
                      {/* BOTÃO DE APAGAR */}
                      <button onClick={() => handleDeleteTicket(ticket.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>

                  {expandedRow === ticket.id && (
                    <tr className="bg-gray-50/80">
                      <td colSpan="4" className="p-6 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2 tracking-widest">Descrição Completa</h4>
                            <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">{ticket.description || 'Sem descrição detalhada.'}</p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-1">Informações Adicionais</h4>
                              <p className="flex items-center gap-2 text-gray-600"><Calendar size={14}/> Criado em: {ticket.createdOn}</p>
                              <p className="flex items-center gap-2 text-gray-600 mt-1"><Calendar size={14}/> Previsão de Conclusão: {ticket.endDate || 'N/A'}</p>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-1">Responsável</h4>
                              <p className="text-blue-600 font-medium">{ticket.userEmail || 'Não atribuído'}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingTicket ? 'Editar Tarefa' : 'Novo Ticket'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveTicket} className="space-y-4">
              <input name="subject" defaultValue={editingTicket?.subject} required className="w-full bg-gray-50 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Assunto" />
              <textarea name="description" defaultValue={editingTicket?.description} rows="3" className="w-full bg-gray-50 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descrição detalhada..." />
              <div className="grid grid-cols-2 gap-4">
                <select name="type" defaultValue={editingTicket?.type} className="bg-gray-50 border rounded-xl p-3 text-sm">
                  <option>Segurança e Compliance</option><option>Comercial</option><option>ASP</option><option>Data Sales</option><option>Pessoal</option><option>DAF</option>
                </select>
                <select name="priority" defaultValue={editingTicket?.priority} className="bg-gray-50 border rounded-xl p-3 text-sm">
                  <option>Baixa</option><option>Alta</option><option>Crítica</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="endDate" type="date" defaultValue={editingTicket?.endDate} className="bg-gray-50 border rounded-xl p-3 text-sm" />
                <input name="userEmail" type="email" defaultValue={editingTicket?.userEmail} className="bg-gray-50 border rounded-xl p-3 text-sm" placeholder="Email do requerente" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Save size={20} /> {editingTicket ? 'Guardar Alterações' : 'Criar Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}