
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Download, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Badge } from '../components/ui/UiComponents';
import { Transaction } from '../types';

export const Transactions: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Transaction Form State
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'sortie',
    category: '',
    label: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: base44.entities.Transaction.list,
    initialData: []
  });

  const user = base44.auth.me();
  const isAdmin = user?.role === 'Président' || user?.role === 'Trésorier';

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
        await base44.entities.Transaction.create({
            ...data,
            amount: parseFloat(data.amount),
            memberId: user?.id || '1',
            memberName: `${user?.firstName} ${user?.lastName}`,
            status: isAdmin ? 'approved' : 'pending'
        });
        
        // Notify
        await base44.entities.Notification.create({
            title: data.type === 'entree' ? 'Nouvelle entrée' : 'Nouvelle dépense',
            message: `${data.label} : ${data.amount}€ ajouté par ${user?.firstName}`,
            type: 'info'
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Update notifs
      setIsModalOpen(false);
      setNewTransaction({ amount: '', type: 'sortie', category: '', label: '', date: new Date().toISOString().split('T')[0] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Transaction['status'] }) => 
      base44.entities.Transaction.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  const deleteMutation = useMutation({
    mutationFn: base44.entities.Transaction.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Transactions</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Nouvelle Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Historique</CardTitle>
          <div className="flex items-center gap-2">
            <Select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-32"
            >
              <option value="all">Tout</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
            </Select>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Membre</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-4">Chargement...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4 text-gray-500">Aucune transaction trouvée</td></tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">{t.label}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t.memberName}</td>
                      <td className={`px-4 py-3 font-bold ${t.type === 'entree' ? 'text-green-600' : 'text-gray-900'}`}>
                        {t.type === 'entree' ? '+' : '-'}{t.amount.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.status === 'approved' ? 'success' : t.status === 'rejected' ? 'destructive' : 'warning'}>
                          {t.status === 'approved' ? 'Validé' : t.status === 'rejected' ? 'Rejeté' : 'En attente'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {t.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => updateStatusMutation.mutate({ id: t.id, status: 'approved' })}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approuver"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => updateStatusMutation.mutate({ id: t.id, status: 'rejected' })}
                                  className="text-red-500 hover:text-red-700"
                                  title="Rejeter"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => deleteMutation.mutate(t.id)}
                              className="text-gray-400 hover:text-red-500 ml-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Modal using absolute positioning for demo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ajouter une transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      checked={newTransaction.type === 'entree'} 
                      onChange={() => setNewTransaction({...newTransaction, type: 'entree'})}
                    /> Entrée
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      checked={newTransaction.type === 'sortie'} 
                      onChange={() => setNewTransaction({...newTransaction, type: 'sortie'})}
                    /> Sortie
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Montant (€)</label>
                <Input 
                  type="number" 
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Libellé</label>
                <Input 
                  type="text" 
                  value={newTransaction.label}
                  onChange={(e) => setNewTransaction({...newTransaction, label: e.target.value})}
                  placeholder="Ex: Achat fournitures"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <Select 
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Subvention">Subvention</option>
                  <option value="Cotisation">Cotisation</option>
                  <option value="Événement">Événement</option>
                  <option value="Matériel">Matériel</option>
                  <option value="Autre">Autre</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input 
                  type="date" 
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="flex-1" onClick={() => createMutation.mutate(newTransaction)} isLoading={createMutation.isPending}>
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};