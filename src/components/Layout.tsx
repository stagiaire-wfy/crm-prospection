import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

type LayoutProps = {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
};

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Tableau de bord',
  contacts: 'Contacts',
  interactions: 'Interactions',
  taches: 'Tâches & Relances',
  agenda: 'Agenda',
  pointage: 'Pointage',
  rapport: 'Rapports & KPI',
  templates: 'Templates',
  parametres: 'Paramètres',
};

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const title = PAGE_TITLES[currentPage] || '';

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="flex-1 ml-64 min-w-0 flex flex-col overflow-x-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400 capitalize hidden sm:block">{today}</p>
            <NotificationBell onNavigate={onNavigate} />
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-6 min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
