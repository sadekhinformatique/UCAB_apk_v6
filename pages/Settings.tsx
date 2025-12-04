
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Bell, Shield, Palette, Upload, Image as ImageIcon } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select } from '../components/ui/UiComponents';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const user = base44.auth.me();
  const isAdmin = user?.role === 'Président' || user?.role === 'Trésorier';

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: base44.entities.AppSettings.get,
    initialData: { appName: '', primaryColor: '', logoUrl: '' }
  });

  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: base44.entities.AppSettings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Force reload to update Layout logo immediately in this mock env
      setTimeout(() => window.location.reload(), 500); 
    }
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const publicUrl = await base44.storage.uploadFile(file);
        setFormData({ ...formData, logoUrl: publicUrl });
      } catch (err) {
        console.error("Erreur upload:", err);
        alert("Erreur lors de l'upload de l'image. Vérifiez que le bucket 'files' existe et est public.");
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Shield className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Accès Refusé</h2>
        <p className="text-gray-500 mt-2">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'application</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle>Apparence & Général</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Logo de l'association</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="text-gray-400" />
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  id="logo-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                  <Upload size={14} className="mr-2" /> Changer le logo
                </Button>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nom de l'association</Label>
            <Input 
              value={formData.appName} 
              onChange={(e) => setFormData({...formData, appName: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Couleur principale</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={formData.primaryColor} 
                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                className="w-12 p-1 h-10"
              />
              <Input 
                value={formData.primaryColor} 
                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                className="uppercase"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={() => updateSettingsMutation.mutate(formData)}>
              <Save size={16} className="mr-2" /> Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Nouvelles demandes</Label>
              <p className="text-sm text-gray-500">Recevoir un email lors d'une nouvelle demande de remboursement</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
             <div className="space-y-0.5">
              <Label className="text-base">Rapport mensuel</Label>
              <p className="text-sm text-gray-500">Recevoir le récapitulatif mensuel automatique</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
