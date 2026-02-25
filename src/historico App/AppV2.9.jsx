import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient'; 
import { 
  PlusCircle, Search, X, Calendar, Edit3, Save, Trash2, 
  ArrowUpDown, UserCheck, User, Clock, ChevronDown, ChevronUp,
  EyeOff, Eye, Download, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- CONFIGURAÇÃO DA EQUIPA ---
const TEAM_EMAILS = [
  "jcgomes@salesgroup.pt", "cmendes@salesgroup.pt", "cchau@salesgroup.pt", 
  "vsilva@salesgrouop.pt", "pbacalhau@salesgroup.pt"
];

export default function App() {
  const [tickets, setTickets] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  
  const [columnFilters, setColumnFilters] = useState({
    subject: '',
    priority: '',
    status: '',
    assignedTo: ''
  });

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tickets').select('*');
      if (error) throw error;
      setTickets(data.map(t => ({
        id: t.id,
        subject: t.Title,
        description: t.Description,
        priority: t.Priority,
        type: t.Type,
        status: t.Status,
        endDate: t["End Date"],
        createdOn: t["Created On"],
        userEmail: t["User Email"],
        assignedTo: t["Assigned To"],
        hidden: t.hidden || false 
      })));
    } catch (error) { console.error('Erro:', error.message); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Crítica': return 'text-red-600 bg-red-100';
      case 'Alta': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

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
      "Assigned To": formData.get('assignedTo'),
      "Status": editingTicket ? editingTicket.status : 'Aberto',
      "Created On": editingTicket ? editingTicket.createdOn : new Date().toISOString().split('T')[0]
    };

    const { error } = editingTicket 
      ? await supabase.from('tickets').update(ticketData).eq('id', editingTicket.id)
      : await supabase.from('tickets').insert([ticketData]);

    if (error) alert(error.message);
    else { setIsModalOpen(false); setEditingTicket(null); fetchTickets(); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Aberto' ? 'Resolvido' : 'Aberto';
    const { error } = await supabase.from('tickets').update({ Status: nextStatus }).eq('id', id);
    if (!error) fetchTickets();
  };

  const toggleHideTicket = async (id, currentHidden) => {
    const { error } = await supabase.from('tickets').update({ hidden: !currentHidden }).eq('id', id);
    if (!error) fetchTickets();
  };

  // --- FUNÇÃO APAGAR REGISTO ---
  const handleDeleteTicket = async (id) => {
    if (window.confirm("Tem a certeza que deseja eliminar permanentemente este registo?")) {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) alert("Erro ao eliminar: " + error.message);
      else fetchTickets();
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredTickets.map(t => ({
      ID: t.id, Tarefa: t.subject, Prioridade: t.priority, Status: t.status,
      Executor: t.assignedTo, Solicitante: t.userEmail, Criado: t.createdOn, Conclusao: t.endDate
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendentes");
    XLSX.writeFile(wb, `Gestao_Pendentes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const requestSort = (key) => {
    let direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (!showHidden) result = result.filter(t => !t.hidden);
    if (searchTerm) {
      result = result.filter(t => 
        t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    Object.keys(columnFilters).forEach(key => {
      if (columnFilters[key]) {
        result = result.filter(t => t[key]?.toString().toLowerCase().includes(columnFilters[key].toLowerCase()));
      }
    });
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tickets, sortConfig, searchTerm, columnFilters, showHidden]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 text-left">
      {/* HEADER ATUALIZADO */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center" style={{ width: '190px' }}>
            <img src="/logo.png" alt="Logo" className="max-w-full h-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Pendentes</h1>
            <p className="text-gray-600 font-bold text-sm uppercase tracking-wider">Tarefas: João Costa Gomes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><Download size={18} /> Excel</button>
          <button onClick={() => { setEditingTicket(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><PlusCircle size={20} /> Nova</button>
        </div>
      </div>

      {/* FERRAMENTAS DE VISUALIZAÇÃO */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Pesquisar..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowHidden(!showHidden)} className="bg-white border px-4 py-3 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
          {showHidden ? <Eye size={16}/> : <EyeOff size={16}/>} {showHidden ? "Ocultar Arquivados" : "Ver Arquivados"}
        </button>
      </div>

      {/* TABELA PRINCIPAL */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="p-4">
                  <div onClick={() => requestSort('subject')} className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer flex items-center gap-1 mb-2">Tarefa <ArrowUpDown size={12}/></div>
                  <input type="text" placeholder="Filtrar..." className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, subject: e.target.value})} />
                </th>
                <th className="p-4 w-32">
                  <div onClick={() => requestSort('priority')} className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer flex items-center gap-1 mb-2">Prio <ArrowUpDown size={12}/></div>
                  <select className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, priority: e.target.value})}>
                    <option value="">Todas</option><option>Baixa</option><option>Alta</option><option>Crítica</option>
                  </select>
                </th>
                <th className="p-4 w-40 text-center">
                  <div onClick={() => requestSort('status')} className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer flex items-center justify-center gap-1 mb-2">Status <ArrowUpDown size={12}/></div>
                  <select className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, status: e.target.value})}>
                    <option value="">Todos</option><option>Aberto</option><option>Resolvido</option>
                  </select>
                </th>
                <th className="p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Executor</div>
                  <input type="text" placeholder="Filtrar..." className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, assignedTo: e.target.value})} />
                </th>
                <th className="p-4 text-right text-[10px] font-bold text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr className={`transition-colors ${ticket.hidden ? 'opacity-50 grayscale bg-gray-50' : ''} ${expandedRow === ticket.id ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{ticket.subject}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Criado em: {ticket.createdOn}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleStatus(ticket.id, ticket.status)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${ticket.status === 'Resolvido' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'}`}>
                        {ticket.status}
                      </button>
                    </td>
                    <td className="p-4 text-xs font-medium text-blue-600">{ticket.assignedTo?.split('@')[0]}</td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <button onClick={() => toggleHideTicket(ticket.id, ticket.hidden)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                        {ticket.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
                        {expandedRow === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button onClick={() => { setEditingTicket(ticket); setIsModalOpen(true); }} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDeleteTicket(ticket.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  
                  {/* VISUALIZAÇÃO DO DETALHE (EXPANSÃO) */}
                  {expandedRow === ticket.id && (
                    <tr className="bg-gray-50/80">
                      <td colSpan="5" className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="md:col-span-2">
                            <h4 className="flex items-center gap-2 font-bold text-gray-400 uppercase text-[10px] mb-3"><FileText size={14}/> Descrição Detalhada</h4>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-gray-700 leading-relaxed min-h-[100px]">
                              {ticket.description || 'Sem descrição registada para esta tarefa.'}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                              <h4 className="font-bold text-gray-400 uppercase text-[10px] border-b pb-2">Informação Geral</h4>
                              <p className="flex items-center gap-2 text-xs text-gray-600"><User size={14} className="text-gray-400"/> <b>Solicitante:</b> {ticket.userEmail}</p>
                              <p className="flex items-center gap-2 text-xs text-blue-700 font-bold"><UserCheck size={14} className="text-blue-500"/> <b>Executor:</b> {ticket.assignedTo}</p>
                              <p className="flex items-center gap-2 text-xs text-gray-600"><Clock size={14} className="text-gray-400"/> <b>Conclusão:</b> {ticket.endDate || 'Sem data'}</p>
                            </div>
                            <div className="text-[10px] text-gray-400 px-2 font-medium">Ticket ID: #{ticket.id}</div>
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
              <h2 className="text-2xl font-bold">{editingTicket ? 'Editar Registo' : 'Novo Registo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors"><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Assunto</label>
                <input name="subject" defaultValue={editingTicket?.subject} required className="w-full bg-gray-50 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Título da tarefa..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Descrição</label>
                <textarea name="description" defaultValue={editingTicket?.description} rows="3" className="w-full bg-gray-50 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Detalhes do pendente..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Solicitante</label>
                  <select name="userEmail" defaultValue={editingTicket?.userEmail || "jcgomes@salesgroup.pt"} className="w-full bg-gray-50 border rounded-xl p-3 text-sm">
                    {TEAM_EMAILS.map(email => <option key={email} value={email}>{email}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-600 uppercase ml-1">Executor</label>
                  <select name="assignedTo" defaultValue={editingTicket?.assignedTo} required className="w-full bg-blue-50 border-blue-200 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-blue-800 outline-none">
                    <option value="">Escolher...</option>
                    {TEAM_EMAILS.map(email => <option key={email} value={email}>{email}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Setor</label>
                  <select name="type" defaultValue={editingTicket?.type} className="w-full bg-gray-50 border rounded-xl p-3 text-sm">
                    <option>Segurança e Compliance</option><option>Comercial</option><option>ASP</option><option>Data Sales</option><option>DAF</option><option>Pessoal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Prioridade</label>
                  <select name="priority" defaultValue={editingTicket?.priority} className="w-full bg-gray-50 border rounded-xl p-3 text-sm">
                    <option>Baixa</option><option>Alta</option><option>Crítica</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data Conclusão</label>
                <input name="endDate" type="date" defaultValue={editingTicket?.endDate} className="w-full bg-gray-50 border rounded-xl p-3 text-sm outline-none" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                <Save size={20} /> Guardar Registo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}