import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contact, Interaction } from '../types/database';
import { TrendingUp, Users, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import StatsChart from '../components/StatsChart';

type FilterPeriod = 'day' | 'week' | 'month';

type Stats = {
  contactsAdded: number;
  interactionsByType: Record<string, number>;
  totalInteractions: number;
};

type DayData = {
  contacts: number;
  interactions: number;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function Agenda() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [stats, setStats] = useState<Stats>({
    contactsAdded: 0,
    interactionsByType: {},
    totalInteractions: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [contacts, interactions, filterPeriod, selectedDate]);

  useEffect(() => {
    const date = new Date(selectedDate);
    setCalendarMonth(date.getMonth());
    setCalendarYear(date.getFullYear());
  }, [selectedDate]);

  const loadData = async () => {
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: interactionsData } = await supabase
      .from('interactions')
      .select('*')
      .order('date_heure', { ascending: false });

    if (contactsData) setContacts(contactsData);
    if (interactionsData) setInteractions(interactionsData);
  };

  const getDateRange = (date?: Date, period?: FilterPeriod) => {
    const d = date || new Date(selectedDate);
    const p = period || filterPeriod;
    let startDate: Date;
    let endDate: Date;

    if (p === 'day') {
      startDate = new Date(d);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(d);
      endDate.setHours(23, 59, 59, 999);
    } else if (p === 'week') {
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(d);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  const calculateStats = () => {
    const { startDate, endDate } = getDateRange();

    const filteredContacts = contacts.filter((contact) => {
      const createdDate = new Date(contact.created_at);
      return createdDate >= startDate && createdDate <= endDate;
    });

    const filteredInteractions = interactions.filter((interaction) => {
      const interactionDate = new Date(interaction.date_heure);
      return interactionDate >= startDate && interactionDate <= endDate;
    });

    const interactionsByType: Record<string, number> = {};
    filteredInteractions.forEach((interaction) => {
      interactionsByType[interaction.type] = (interactionsByType[interaction.type] || 0) + 1;
    });

    setStats({
      contactsAdded: filteredContacts.length,
      interactionsByType,
      totalInteractions: filteredInteractions.length,
    });
  };

  const getDayData = (year: number, month: number, day: number): DayData => {
    const dayStart = new Date(year, month, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

    const dayContacts = contacts.filter((c) => {
      const d = new Date(c.created_at);
      return d >= dayStart && d <= dayEnd;
    }).length;

    const dayInteractions = interactions.filter((i) => {
      const d = new Date(i.date_heure);
      return d >= dayStart && d <= dayEnd;
    }).length;

    return { contacts: dayContacts, interactions: dayInteractions };
  };

  const getPeriodLabel = () => {
    const date = new Date(selectedDate);
    if (filterPeriod === 'day') {
      return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (filterPeriod === 'week') {
      const { startDate, endDate } = getDateRange();
      return `Semaine du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
    } else {
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'Appel': return 'bg-blue-500';
      case 'WhatsApp': return 'bg-green-500';
      case 'SMS': return 'bg-orange-500';
      case 'Email': return 'bg-red-500';
      case 'Facebook': return 'bg-blue-700';
      case 'Instagram': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'Appel': return <Phone className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const buildCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const prevM = calendarMonth === 0 ? 11 : calendarMonth - 1;
      const prevY = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      days.push({ day: daysInPrevMonth - i, month: prevM, year: prevY, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: calendarMonth, year: calendarYear, isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = calendarMonth === 11 ? 0 : calendarMonth + 1;
      const nextY = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      days.push({ day: d, month: nextM, year: nextY, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = buildCalendarDays();
  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayClick = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setFilterPeriod('day');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Agenda et Statistiques</h1>
        <p className="text-gray-600">Suivez l'évolution de vos contacts et interactions</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {MONTHS_FR[calendarMonth]} {calendarYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const data = cell.isCurrentMonth ? getDayData(cell.year, cell.month, cell.day) : null;
              const dateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasActivity = data && (data.contacts > 0 || data.interactions > 0);

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(cell.year, cell.month, cell.day)}
                  className={`relative min-h-[72px] rounded-lg p-1.5 text-left transition-all border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isToday
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : cell.isCurrentMonth
                      ? 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300 text-gray-800'
                      : 'bg-gray-50 border-transparent text-gray-300'
                  }`}
                >
                  <span className={`text-sm font-semibold block mb-1 ${
                    isSelected ? 'text-white' : isToday ? 'text-blue-700' : ''
                  }`}>
                    {cell.day}
                  </span>
                  {hasActivity && (
                    <div className="space-y-0.5">
                      {data!.contacts > 0 && (
                        <div className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Users className="w-2.5 h-2.5" />
                          <span className="font-medium">{data!.contacts}</span>
                        </div>
                      )}
                      {data!.interactions > 0 && (
                        <div className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-700'
                        }`}>
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span className="font-medium">{data!.interactions}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                <Users className="w-3 h-3" />
                <span>N</span>
              </div>
              Nouveaux contacts
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-100 text-green-700 rounded px-2 py-0.5">
                <MessageSquare className="w-3 h-3" />
                <span>N</span>
              </div>
              Interactions
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex gap-2 mb-4">
              {(['day', 'week', 'month'] as FilterPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPeriod(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterPeriod === p
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-700 capitalize">{getPeriodLabel()}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Nouveaux contacts</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.contactsAdded}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total interactions</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalInteractions}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
          </div>

          <StatsChart interactions={interactions} selectedDate={selectedDate} filterPeriod={filterPeriod} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Interactions par Type</h2>

        {Object.keys(stats.interactionsByType).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Aucune interaction pour cette période</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.interactionsByType).map(([type, count]) => (
              <div
                key={type}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow text-center"
              >
                <div className={`w-10 h-10 rounded-lg ${getInteractionColor(type)} text-white flex items-center justify-center mx-auto mb-3`}>
                  {getInteractionIcon(type)}
                </div>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">{type}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
