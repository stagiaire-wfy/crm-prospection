import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Contact } from '../types/database';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons not resolving under Vite bundling
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [46.5, 2.5];

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

function buildAddressQuery(contact: Contact): string {
  return [contact.adresse, contact.code_postal, contact.ville, contact.pays].filter(Boolean).join(', ');
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
  const resp = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
  if (!resp.ok) return [];
  return resp.json();
}

function FlyToPosition({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 15, { duration: 0.8 });
  }, [position, map]);
  return null;
}

type Props = {
  contact: Contact;
  onContactUpdated: () => void;
};

export default function ContactAddressMap({ contact, onContactUpdated }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(
    contact.latitude != null && contact.longitude != null ? [contact.latitude, contact.longitude] : null
  );
  const [autoLocating, setAutoLocating] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const autoTriedRef = useRef(false);

  useEffect(() => {
    setPosition(contact.latitude != null && contact.longitude != null ? [contact.latitude, contact.longitude] : null);
    autoTriedRef.current = false;
  }, [contact.id, contact.latitude, contact.longitude]);

  useEffect(() => {
    const addressQuery = buildAddressQuery(contact);
    if (position || autoTriedRef.current || !addressQuery.trim()) return;
    autoTriedRef.current = true;
    setAutoLocating(true);
    searchAddress(addressQuery)
      .then(async res => {
        if (res[0]) {
          const lat = parseFloat(res[0].lat);
          const lon = parseFloat(res[0].lon);
          await supabase.from('contacts').update({ latitude: lat, longitude: lon }).eq('id', contact.id);
          setPosition([lat, lon]);
          onContactUpdated();
        }
      })
      .finally(() => setAutoLocating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const res = await searchAddress(query);
    setResults(res);
    setShowResults(true);
    setSearching(false);
  };

  const selectResult = async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    setShowResults(false);
    setQuery('');
    await supabase.from('contacts').update({ latitude: lat, longitude: lon }).eq('id', contact.id);
    onContactUpdated();
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div ref={searchBoxRef} className="relative mb-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une adresse..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Chercher
          </button>
        </form>

        {showResults && results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {results.map((r, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {showResults && results.length === 0 && !searching && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs text-slate-400">
            Aucun résultat
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 relative" style={{ height: 220 }}>
        {autoLocating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        )}
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={position ? 15 : 5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <>
              <Marker position={position} />
              <FlyToPosition position={position} />
            </>
          )}
        </MapContainer>
        {!position && !autoLocating && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 pointer-events-none">
            <p className="text-xs text-slate-400 text-center px-6">
              Aucune position — recherchez une adresse ci-dessus
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
