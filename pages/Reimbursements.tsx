
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, CreditCard, Clock, FileText, Upload } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Label } from '../components/ui/UiComponents';
import { ReimbursementRequest } from '../types';

export const Reimbursements: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

  const user = base44.auth.me();
  const isAdmin = user?.role === 'Président' || user?.role === 'Trésorier';

  // Form State
  const [newRequest, setNewRequest] = useState({
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['reimbursements'],
    queryFn: base44.entities.ReimbursementRequest.list,
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => base44.entities.ReimbursementRequest.create({
      ...data,
      amount: parseFloat(data.amount),
      memberId: user?.id || '1',
      memberName: `${user?.firstName} ${user?.lastName}`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      setIsModalOpen(false);
      setNewRequest({ amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReimbursementRequest['status'] }) => 
      base44.entities.ReimbursementRequest.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reimbursements'] })
  });

  const displayedRequests = activeTab === 'my' 
    ? requests.filter(r => r.memberId === user?.id)
    : requests;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Demandes de Remboursement</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Nouvelle Demande
        </Button>
      </div>

      {isAdmin && (
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 w-fit">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'my' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Mes demandes
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Toutes les demandes
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <p>Chargement...</p>
        ) : displayedRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucune demande</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle demande de remboursement.</p>
          </div>
        ) : (
          displayedRequests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg hidden sm:block">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{req.reason}</h3>
                        <span className="text-sm text-gray-500 hidden sm:inline">• {new Date(req.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="text-sm text-gray-500">Demandé par : {req.memberName}</p>
                      <div className="flex items-center gap-2 mt-2 md:hidden">
                         <span className="text-sm text-gray-500">{new Date(req.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <span className="text-xl font-bold text-gray-900">{req.amount.toFixed(2)} €</span>
                    <Badge variant={
                      req.status === 'approved' ? 'success' : 
                      req.status === 'paid' ? 'success' : 
                      req.status === 'rejected' ? 'destructive' : 'warning'
                    }>
                      {req.status === 'pending' ? 'En attente' :
                       req.status === 'approved' ? 'Validé' :
                       req.status === 'paid' ? 'Payé' : 'Refusé'}
                    </Badge>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && activeTab === 'all' && req.status === 'pending' && (
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                     <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                    >
                      <X size={16} className="mr-2" /> Refuser
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}
                    >
                      <Check size={16} className="mr-2" /> Valider
                    </Button>
                  </div>
                )}

                {isAdmin && activeTab === 'all' && req.status === 'approved' && (
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button 
                      size="sm" 
                      variant="primary"
                      onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'paid' })}
                    >
                      <CreditCard size={16} className="mr-2" /> Marquer comme payé
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nouvelle demande</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Motif du remboursement</Label>
                <Input 
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  placeholder="Ex: Achat fournitures bureau"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Montant (€)</Label>
                <Input 
                  type="number" 
                  value={newRequest.amount}
                  onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Date de la dépense</Label>
                <Input 
                  type="date" 
                  value={newRequest.date}
                  onChange={(e) => setNewRequest({...newRequest, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Justificatif</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Cliquez pour ajouter une photo</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="flex-1" onClick={() => createMutation.mutate(newRequest)} isLoading={createMutation.isPending}>
                  Soumettre
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
