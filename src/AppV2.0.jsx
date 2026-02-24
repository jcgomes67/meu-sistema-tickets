import React, { useState, useEffect } from 'react';
import { Plus, Search, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [filtro, setFiltro] = useState('');

  // Estado para o novo ticket (seguindo a tua estrutura do Supabase)
  const [novoTicket, setNovoTicket] = useState({
    Title: '',
    Description: '',
    Priority: 'Baixa',
    Type: 'Suporte',
    Status: 'Aberto',
    "End Date": ''
  });

  // 1. Função para carregar tickets do Supabase
  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao procurar tickets:', error.message);
    } else {
      setTickets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 2. Função para salvar novo ticket
  const handleSaveTicket = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          Title: novoTicket.Title,
          Description: novoTicket.Description,
          Priority: novoTicket.Priority,
          Type: novoTicket.Type,
          Status: 'Aberto',
          "End Date": novoTicket["End Date"],
          "Created On": new Date().toISOString().split('T')[0]
        }
      ]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setModalAberto(false);
      setNovoTicket({ Title: '', Description: '', Priority: 'Baixa', Type: 'Suporte', "End Date": '' });
      fetchTickets(); // Atualiza a lista automaticamente
    }
  };

  const ticketsFiltrados = tickets.filter(t => 
    t.Title?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suporte Central</h1>
          <p className="text-gray-500">Gestão de incidentes em tempo real (Supabase)</p>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
        >
          <Plus size={20} /> Novo Ticket
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar ticket por título..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-500">A carregar dados do servidor...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">ID</th>
                <th className="p-4 font-semibold text-gray-600">Título / Tipo</th>
                <th className="p-4 font-semibold text-gray-600">Prioridade</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Previsão Entrega</th>
              </tr>
            </thead>
            <tbody>
              {ticketsFiltrados.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-blue-600 font-bold">#{ticket.id}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{ticket.Title}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">{ticket.Type}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.Priority === 'Alta' ? 'bg-red-100 text-red-600' : 
                      ticket.Priority === 'Média' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {ticket.Priority}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{ticket.Status}</td>
                  <td className="p-4 text-gray-500">{ticket["End Date"] || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Novo Ticket */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Abrir Novo Incidente</h2>
            <form onSubmit={handleSaveTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input required className="w-full p-2 border rounded-lg" type="text" 
                  onChange={e => setNovoTicket({...novoTicket, Title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea className="w-full p-2 border rounded-lg" rows="3"
                  onChange={e => setNovoTicket({...novoTicket, Description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select className="w-full p-2 border rounded-lg" 
                    onChange={e => setNovoTicket({...novoTicket, Priority: e.target.value})}>
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select className="w-full p-2 border rounded-lg"
                    onChange={e => setNovoTicket({...novoTicket, Type: e.target.value})}>
                    <option value="Suporte">Suporte</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Financeiro">Financeiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista de Entrega</label>
                <input className="w-full p-2 border rounded-lg" type="date"
                  onChange={e => setNovoTicket({...novoTicket, "End Date": e.target.value})} />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Criar Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;