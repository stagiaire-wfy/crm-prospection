import { useState, useRef, useEffect } from 'react';
import { Search, User, X, ChevronDown } from 'lucide-react';
import type { Contact } from '../types/database';

type Props = {
  contacts: Contact[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
};

export default function ContactSearchSelect({ contacts, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = contacts.find(c => c.id === value) || null;

  const filtered = search.trim()
    ? contacts.filter(c => {
        const q = search.toLowerCase();
        return (
          c.prenom.toLowerCase().includes(q) ||
          c.nom.toLowerCase().includes(q) ||
          (c.entreprise || '').toLowerCase().includes(q) ||
          (c.ville || '').toLowerCase().includes(q)
        );
      })
    : contacts;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded-lg text-sm transition-colors text-left ${
          open ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 hover:border-slate-400'
        } bg-white`}
      >
        {selected ? (
          <>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="flex-1 text-slate-900 font-medium truncate">
              {selected.prenom} {selected.nom}
              {selected.entreprise && <span className="text-slate-400 font-normal"> · {selected.entreprise}</span>}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </>
        ) : (
          <>
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="flex-1 text-slate-400">Sélectionner un contact</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {required && !value && (
        <input
          tabIndex={-1}
          required
          value=""
          onChange={() => {}}
          className="absolute inset-0 w-full opacity-0 pointer-events-none"
        />
      )}

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un contact..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-400">Aucun contact trouvé</li>
            ) : (
              filtered.map(contact => (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(contact.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                      contact.id === value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-slate-600">
                      {contact.prenom[0]}{contact.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${contact.id === value ? 'text-blue-700' : 'text-slate-900'}`}>
                        {contact.prenom} {contact.nom}
                      </p>
                      {contact.entreprise && (
                        <p className="text-xs text-slate-400 truncate">{contact.entreprise}</p>
                      )}
                    </div>
                    {contact.ville && (
                      <span className="text-xs text-slate-400 flex-shrink-0">{contact.ville}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
