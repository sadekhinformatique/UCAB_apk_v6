import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Clock } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/UiComponents';
import { Transaction } from '../types';

export const Dashboard: React.FC = () => {
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: base44.entities.Transaction.list,
    initialData: []
  });

  const { data: reimbursements } = useQuery({
    queryKey: ['reimbursements'],
    queryFn: base44.entities.ReimbursementRequest.list,
    initialData: []
  });

  // Calculate Stats
  const totalIncome = transactions
    .filter(t => t.type === 'entree' && t.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'sortie' && t.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;
  const pendingRequests = reimbursements.filter(r => r.status === 'pending').length;

  // Chart Data Preparation
  const categoryData = transactions
    .filter(t => t.status === 'approved')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);

  const monthlyData = [
    { name: 'Jan', Entrées: 4000, Sorties: 2400 },
    { name: 'Fév', Entrées: 3000, Sorties: 1398 },
    { name: 'Mar', Entrées: 2000, Sorties: 9800 },
    { name: 'Avr', Entrées: 2780, Sorties: 3908 },
    { name: 'Mai', Entrées: 1890, Sorties: 4800 },
    { name: 'Juin', Entrées: 2390, Sorties: 3800 },
  ]; // Using mock for history as our list is small

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-gray-500">Balance Totale</span>
              <WalletIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> +2.5% depuis le mois dernier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-gray-500">Entrées (Mois)</span>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">+{totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-gray-500">Sorties (Mois)</span>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">-{totalExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-gray-500">À Valider</span>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-gray-500 mt-1">Demandes de remboursement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aperçu Financier</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Entrées" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sorties" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Répartition par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-xs">
                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${transaction.type === 'entree' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {transaction.type === 'entree' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.label}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString('fr-FR')} • {transaction.memberName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.type === 'entree' ? 'text-green-600' : 'text-gray-900'}`}>
                    {transaction.type === 'entree' ? '+' : '-'}{transaction.amount.toFixed(2)} €
                  </p>
                  <Badge variant={transaction.status === 'approved' ? 'success' : 'warning'}>
                    {transaction.status === 'approved' ? 'Approuvé' : 'En attente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-8Z" />
  </svg>
);
