
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Search, Edit2, XCircle } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, Input, Badge, Button, Select, Label } from '../components/ui/UiComponents';
import { Member, UserRole } from '../types';

export const Members: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = base44.auth.me();
  const isAdmin = currentUser?.role === 'Président';
  
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: base44.entities.Member.list,
    initialData: []
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { id: string, role: UserRole }) => 
        base44.entities.Member.update(data.id, { role: data.role }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
        setEditingMember(null);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
          <p className="text-gray-500">Gérez les membres de l'association</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input className="pl-9" placeholder="Rechercher un membre..." />
          </div>
          <Button>Ajouter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          members.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardContent className="pt-0 relative">
                <div className="flex justify-between items-start">
                  <div className="-mt-10 mb-4">
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500 shadow-sm overflow-hidden">
                      {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : member.firstName.charAt(0) + member.lastName.charAt(0)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col items-end gap-1">
                    <Badge variant={member.role === 'Président' ? 'default' : member.role === 'Trésorier' ? 'warning' : 'outline'}>
                      {member.role}
                    </Badge>
                    {isAdmin && (
                        <button onClick={() => setEditingMember(member)} className="text-xs text-blue-600 hover:underline flex items-center">
                            <Edit2 size={10} className="mr-1" /> Modifier rôle
                        </button>
                    )}
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-gray-900">{member.firstName} {member.lastName}</h3>
                <p className="text-sm text-gray-500 mb-4">{member.filiere} • {member.niveau}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Mail size={16} className="mr-2 opacity-70" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone size={16} className="mr-2 opacity-70" />
                    <span>{member.phone || 'Non renseigné'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                  <span>Matricule: {member.identifier || 'N/A'}</span>
                  <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

       {/* Edit Role Modal */}
       {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Modifier le rôle</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Modifier le rôle pour <strong>{editingMember.firstName} {editingMember.lastName}</strong></p>
                <div className="space-y-2">
                    <Label>Rôle</Label>
                    <Select 
                        defaultValue={editingMember.role}
                        onChange={(e) => updateRoleMutation.mutate({ id: editingMember.id, role: e.target.value as UserRole })}
                    >
                        <option value="Membre">Membre</option>
                        <option value="Trésorier">Trésorier</option>
                        <option value="Président">Président</option>
                    </Select>
                </div>
                <div className="pt-2 flex justify-end">
                    <Button variant="outline" onClick={() => setEditingMember(null)}>Annuler</Button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};