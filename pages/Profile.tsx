
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User as UserIcon, Mail, Phone, Hash, BookOpen, Save, History } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Select } from '../components/ui/UiComponents';
import { Member } from '../types';

export const Profile: React.FC = () => {
  const user = base44.auth.me() as Member | null;
  const [formData, setFormData] = useState<Partial<Member>>({});

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: base44.entities.Transaction.list,
    initialData: []
  });

  // Filter transactions for this user
  const myHistory = transactions.filter(t => t.memberId === user?.id);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Member>) => base44.entities.Member.update(user!.id, data),
    onSuccess: () => {
      alert("Profil mis à jour avec succès !");
      window.location.reload(); 
    }
  });

  if (!user) return null;

  const FILIERES: Record<string, string[]> = {
    'Année préparatoire': ['AP'],
    'Informatique de gestion': ['L1', 'L2', 'L3'],
    'Administration': ['L1', 'L2', 'L3'],
    'Electromécanique': ['L1', 'L2', 'L3']
  };

  const handleFiliereChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFiliere = e.target.value;
    const availableNiveaux = FILIERES[newFiliere] || [];
    setFormData({
      ...formData,
      filiere: newFiliere,
      niveau: availableNiveaux[0] || '' 
    });
  };

  const handleSubmit = () => {
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400 mb-4 border-4 border-white shadow-sm overflow-hidden">
               {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.firstName.charAt(0) + user.lastName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <Badge className="mt-2" variant={user.role === 'Président' ? 'default' : user.role === 'Trésorier' ? 'warning' : 'outline'}>
              {user.role}
            </Badge>
            <div className="w-full mt-6 pt-6 border-t border-gray-100 space-y-3 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={16} className="mr-3 opacity-70" /> {user.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Hash size={16} className="mr-3 opacity-70" /> ID: {user.identifier || 'Non défini'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Form */}
        <div className="md:col-span-2 space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input defaultValue={user.firstName} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input defaultValue={user.lastName} disabled className="bg-gray-50" />
                </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                        className="pl-9" 
                        value={formData.phone || ''} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Non renseigné" 
                    />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    <Input type="date" />
                </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen size={18} /> Informations Académiques
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label>Filière</Label>
                    <Select 
                        value={formData.filiere || ''} 
                        onChange={handleFiliereChange}
                    >
                        <option value="" disabled>Sélectionner une filière</option>
                        {Object.keys(FILIERES).map(f => (
                        <option key={f} value={f}>{f}</option>
                        ))}
                    </Select>
                    </div>
                    <div className="space-y-2">
                    <Label>Niveau</Label>
                    <Select 
                        value={formData.niveau || ''} 
                        onChange={(e) => setFormData({...formData, niveau: e.target.value})}
                        disabled={!formData.filiere}
                    >
                        <option value="" disabled>Sélectionner un niveau</option>
                        {formData.filiere && FILIERES[formData.filiere]?.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                    </Select>
                    </div>
                </div>
                </div>

                <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} isLoading={updateProfileMutation.isPending}>
                    <Save size={16} className="mr-2" /> Enregistrer les modifications
                </Button>
                </div>
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" /> Historique Financier
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {myHistory.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">Aucune transaction enregistrée.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2">Label</th>
                                        <th className="px-4 py-2 text-right">Montant</th>
                                        <th className="px-4 py-2 text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {myHistory.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-4 py-2">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-4 py-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${t.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.type === 'entree' ? 'Cotisation' : 'Dépense'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">{t.label}</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {t.type === 'entree' ? '+' : '-'}{t.amount.toFixed(2)} €
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Badge variant={t.status === 'approved' ? 'success' : 'warning'}>
                                                    {t.status === 'approved' ? 'Validé' : 'En attente'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};