
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  FileText, 
  LogOut, 
  Menu,
  X,
  Wallet,
  Settings,
  MessageCircle,
  User as UserIcon,
  Bell
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import { Button } from './ui/UiComponents';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = base44.auth.me();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: base44.entities.AppSettings.get
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: base44.entities.Notification.list,
    refetchInterval: 10000 // Poll every 10s
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/members', label: 'Membres', icon: Users },
    { path: '/reimbursements', label: 'Remboursements', icon: Wallet },
    { path: '/reports', label: 'Rapports', icon: FileText },
    { path: '/community', label: 'Communauté', icon: MessageCircle },
    { path: '/settings', label: 'Paramètres', icon: Settings, adminOnly: true },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 items-center px-6 border-b border-gray-100 justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary overflow-hidden">
            {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
            ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                  SAS
                </div>
            )}
            <span className="truncate">{settings?.appName || 'Finance'}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
               if (item.adminOnly && user?.role === 'Membre') return null;
               
               const Icon = item.icon;
               const isActive = location.pathname === item.path;
               return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 pt-4">
            <div 
              className="flex items-center gap-3 px-3 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => {
                navigate('/profile');
                setIsSidebarOpen(false);
              }}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-primary font-bold overflow-hidden">
                 {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : (user?.firstName?.charAt(0) || 'U')}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Menu size={20} />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 font-semibold text-sm">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.slice().reverse().map(notif => (
                          <div key={notif.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 text-sm ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                            <p className="font-medium text-gray-900">{notif.title}</p>
                            <p className="text-gray-500 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(notif.date).toLocaleString('fr-FR')}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">Aucune notification</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="text-sm text-gray-500 hidden sm:inline-block border-l pl-4 border-gray-200">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <button 
              onClick={() => navigate('/profile')} 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              title="Mon Profil"
            >
              <UserIcon size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};