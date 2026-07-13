import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Interactions from './pages/Interactions';
import Taches from './pages/Taches';
import Agenda from './pages/Agenda';
import Templates from './pages/Templates';
import Parametres from './pages/Parametres';
import Rapport from './pages/Rapport';
import Pointage from './pages/Pointage';
import ProgrammationAppels from './pages/ProgrammationAppels';
import { supabase } from './lib/supabase';
import type { Contact } from './types/database';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [editContactTarget, setEditContactTarget] = useState<Contact | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
      });

      return () => subscription.unsubscribe();
    })();
  }, []);

  const navigateToContact = (id: string) => {
    setSelectedContactId(id);
    setCurrentPage('contact-detail');
  };

  const handleEditContact = (contact: Contact) => {
    setEditContactTarget(contact);
    setCurrentPage('contacts');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== 'contact-detail') setSelectedContactId(null);
    setEditContactTarget(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'contacts':
        return (
          <Contacts
            onOpenContact={navigateToContact}
            editTarget={editContactTarget}
            onEditTargetHandled={() => setEditContactTarget(null)}
          />
        );
      case 'contact-detail':
        return selectedContactId ? (
          <ContactDetail
            contactId={selectedContactId}
            onBack={() => { setCurrentPage('contacts'); setSelectedContactId(null); }}
            onEdit={handleEditContact}
          />
        ) : null;
      case 'interactions':
        return <Interactions onOpenContact={navigateToContact} />;
      case 'taches':
        return <Taches />;
      case 'agenda':
        return <Agenda />;
      case 'templates':
        return <Templates />;
      case 'parametres':
        return <Parametres />;
      case 'rapport':
        return <Rapport />;
      case 'pointage':
        return <Pointage />;
      case 'programmation-appels':
        return <ProgrammationAppels onOpenContact={navigateToContact} />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
