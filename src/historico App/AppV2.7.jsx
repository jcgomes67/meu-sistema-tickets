import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient'; 
import { 
  PlusCircle, Search, X, Calendar, Edit3, Save, Trash2, 
  ArrowUpDown, UserCheck, User, Clock, ChevronDown, ChevronUp,
  EyeOff, Eye, Download, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

const TEAM_EMAILS = [
  "jcgomes67@gmail.com","jcgomes@salesgroup.pt", "cmendes@salesgroup.pt", "cchau@salesgroup.pt",
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

  // --- FUNÇÕES DE AUXÍLIO (IMPORTANTE!) ---
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
    if (!error) setTickets(tickets.map(t => t.id === id ? { ...t, hidden: !currentHidden } : t));
  };

  const exportToExcel = () => {
    const dataToExport = filteredTickets.map(t => ({
      ID: t.id, Tarefa: t.subject, Prioridade: t.priority, Status: t.status,
      Executor: t.assignedTo, Solicitante: t.userEmail, Criado: t.createdOn, Entrega: t.endDate
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendentes");
    XLSX.writeFile(wb, `Report_Pendentes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const requestSort = (key) => {
    let direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (!showHidden) result = result.filter(t => !t.hidden);
    if (searchTerm) result = result.filter(t => t.subject?.toLowerCase().includes(searchTerm.toLowerCase()));
    
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

  if (loading) return <div className="p-8 text-center font-bold">A carregar sistema...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center" style={{ width: '190px' }}>
            <img src="/logo.png" alt="Logo" className="max-w-full h-auto" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Pendentes</h1>
            <button onClick={() => setShowHidden(!showHidden)} className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1">
              {showHidden ? <Eye size={14}/> : <EyeOff size={14}/>} {showHidden ? "Ocultar Arquivados" : "Ver Arquivados"}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Download size={18} /> Excel</button>
          <button onClick={() => { setEditingTicket(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><PlusCircle size={20} /> Nova</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="p-4">
                  <div onClick={() => requestSort('subject')} className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center gap-1 mb-2">Tarefa <ArrowUpDown size={12}/></div>
                  <input type="text" placeholder="Filtrar..." className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, subject: e.target.value})} />
                </th>
                <th className="p-4">
                  <div onClick={() => requestSort('priority')} className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center gap-1 mb-2">Prio <ArrowUpDown size={12}/></div>
                  <select className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, priority: e.target.value})}>
                    <option value="">Todas</option><option>Baixa</option><option>Alta</option><option>Crítica</option>
                  </select>
                </th>
                <th className="p-4 text-center">
                  <div onClick={() => requestSort('status')} className="text-xs font-bold text-gray-400 uppercase cursor-pointer flex items-center justify-center gap-1 mb-2">Status <ArrowUpDown size={12}/></div>
                  <select className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, status: e.target.value})}>
                    <option value="">Todos</option><option>Aberto</option><option>Resolvido</option>
                  </select>
                </th>
                <th className="p-4">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">Executor</div>
                  <input type="text" placeholder="Filtrar..." className="w-full p-1 text-xs border rounded" onChange={e => setColumnFilters({...columnFilters, assignedTo: e.target.value})} />
                </th>
                <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <tr className={`transition-colors ${ticket.hidden ? 'opacity-50 grayscale bg-gray-50' : ''} ${expandedRow === ticket.id ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{ticket.subject}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{ticket.createdOn}</div>
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
                    <td className="p-4 text-xs font-medium text-blue-600">{ticket.assignedTo?.split('@')[0]}</td>
                    <td className="p-4 text-right space-x-1">
                      <button onClick={() => toggleHideTicket(ticket.id, ticket.hidden)} title="Esconder/Mostrar" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                        {ticket.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button onClick={() => setExpandedRow(expandedRow === ticket.id ? null : ticket.id)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500">
                        {expandedRow === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button onClick={() => { setEditingTicket(ticket); setIsModalOpen(true); }} className="p-2 hover:bg-blue-100 rounded-lg text-blue-600">
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 text-left">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingTicket ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveTicket} className="space-y-4">
              <input name="subject" defaultValue={editingTicket?.subject} required className="w-full bg-gray-50 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Assunto" />
              <textarea name="description" defaultValue={editingTicket?.description} rows="3" className="w-full bg-gray-50 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descrição detalhada..." />
              <div className="grid grid-cols-2 gap-4">
                <select name="userEmail" defaultValue={editingTicket?.userEmail || "jcgomes@salesgroup.pt"} className="w-full bg-gray-50 border rounded-xl p-3 text-sm">
                  {TEAM_EMAILS.map(email => <option key={email} value={email}>{email}</option>)}
                </select>
                <select name="assignedTo" defaultValue={editingTicket?.assignedTo} required className="w-full bg-blue-50 border-blue-200 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Executor...</option>
                  {TEAM_EMAILS.map(email => <option key={email} value={email}>{email}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select name="type" defaultValue={editingTicket?.type} className="bg-gray-50 border rounded-xl p-3 text-sm">
                  <option>Segurança e Compliance</option><option>Comercial</option><option>ASP</option><option>Data Sales</option><option>DAF</option><option>Pessoal</option>
                </select>
                <select name="priority" defaultValue={editingTicket?.priority} className="bg-gray-50 border rounded-xl p-3 text-sm">
                  <option>Baixa</option><option>Alta</option><option>Crítica</option>
                </select>
              </div>
              <input name="endDate" type="date" defaultValue={editingTicket?.endDate} className="w-full bg-gray-50 border rounded-xl p-3 text-sm" />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2">
                <Save size={20} /> Guardar Tarefa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}