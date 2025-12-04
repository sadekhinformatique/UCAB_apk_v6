
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Download, Calendar, Mail, MessageCircle, Share2, FileText, CheckCircle } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui/UiComponents';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const Reports: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: base44.entities.Transaction.list,
    initialData: []
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: base44.entities.AppSettings.get
  });

  const generatePDF = (period: 'month' | 'year') => {
    const doc = new jsPDF();
    const title = period === 'month' ? `Rapport Mensuel - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : `Bilan Annuel ${new Date().getFullYear()}`;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 100, 235);
    doc.text(settings?.appName || "SAS Finance", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 38);

    // Summary
    const totalIncome = transactions
        .filter(t => t.type === 'entree' && t.status === 'approved')
        .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === 'sortie' && t.status === 'approved')
        .reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    doc.setFillColor(240, 240, 240);
    doc.rect(14, 45, 180, 25, 'F');
    doc.text(`Total Entrées: ${totalIncome.toFixed(2)} €`, 20, 55);
    doc.text(`Total Sorties: ${totalExpense.toFixed(2)} €`, 20, 62);
    // Fix: Explicitly use "helvetica" instead of undefined
    doc.setFont("helvetica", 'bold');
    doc.text(`Balance: ${balance.toFixed(2)} €`, 120, 60);

    // Table
    const tableData = transactions.map(t => [
        new Date(t.date).toLocaleDateString('fr-FR'),
        t.label,
        t.category,
        t.type === 'entree' ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`,
        t.status
    ]);

    autoTable(doc, {
        startY: 75,
        head: [['Date', 'Libellé', 'Catégorie', 'Montant', 'Statut']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`${title.replace(/ /g, '_')}.pdf`);
  };

  const handleSendReport = async (channel: 'email' | 'whatsapp') => {
    setIsSending(true);
    try {
        await base44.services.sendReport(channel, 'monthly');
        setSendSuccess(channel === 'email' ? 'Email envoyé !' : 'WhatsApp envoyé !');
        setTimeout(() => setSendSuccess(''), 3000);
    } catch (e) {
        alert("Erreur lors de l'envoi");
    } finally {
        setIsSending(false);
    }
  };

  // Process data for charts
  const monthlyData = transactions.reduce((acc: any[], curr) => {
    if (curr.status !== 'approved') return acc;
    const month = new Date(curr.date).toLocaleString('fr-FR', { month: 'short' });
    
    const existing = acc.find(m => m.name === month);
    if (existing) {
      if (curr.type === 'entree') existing.Entrées += curr.amount;
      else existing.Sorties += curr.amount;
    } else {
      acc.push({
        name: month,
        Entrées: curr.type === 'entree' ? curr.amount : 0,
        Sorties: curr.type === 'sortie' ? curr.amount : 0
      });
    }
    return acc;
  }, []);

  const totalIncome = transactions
    .filter(t => t.type === 'entree' && t.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'sortie' && t.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const net = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" onClick={() => generatePDF('month')}>
            <FileText size={18} className="mr-2" />
            PDF Mensuel
           </Button>
           <Button onClick={() => generatePDF('year')}>
            <Download size={18} className="mr-2" />
            PDF Annuel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-blue-600">Total Revenus</p>
            <h2 className="text-3xl font-bold text-blue-900 mt-2">{totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h2>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-red-600">Total Dépenses</p>
            <h2 className="text-3xl font-bold text-red-900 mt-2">{totalExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h2>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${net >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Résultat Net</p>
            <h2 className={`text-3xl font-bold mt-2 ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {net > 0 ? '+' : ''}{net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </h2>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Share2 size={20} /> Diffusion Automatique
              </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                      Envoyer le rapport mensuel automatiquement aux membres du bureau.
                  </p>
                  <div className="flex gap-3">
                      <Button 
                        variant="secondary" 
                        onClick={() => handleSendReport('whatsapp')}
                        isLoading={isSending}
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                          <MessageCircle size={18} className="mr-2" /> Via WhatsApp
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleSendReport('email')}
                        isLoading={isSending}
                      >
                          <Mail size={18} className="mr-2" /> Via Email
                      </Button>
                  </div>
              </div>
              {sendSuccess && (
                  <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center animate-pulse">
                      <CheckCircle size={16} className="mr-2" /> {sendSuccess}
                  </div>
              )}
          </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution Mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.length > 0 ? monthlyData : [{name: 'Oct', Entrées: 0, Sorties: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Entrées" fill="#2563eb" name="Revenus" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sorties" fill="#ef4444" name="Dépenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance de la Balance</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData.length > 0 ? monthlyData : [{name: 'Oct', Entrées: 0, Sorties: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Entrées" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="Sorties" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
