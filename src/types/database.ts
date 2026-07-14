export type PageSpeedCategoryScores = {
  performance: number | null;
  accessibility: number | null;
  best_practices: number | null;
  seo: number | null;
  agentic_passed: number | null;
  agentic_total: number | null;
};

export type PageSpeedDetails = {
  mobile?: PageSpeedCategoryScores;
  desktop?: PageSpeedCategoryScores;
  checked_at?: string;
};

export type Contact = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  entreprise: string;
  tags: string[];
  statut: 'Nouveau' | 'En cours' | 'Converti' | 'Perdu';
  pays: 'France' | 'Israël';
  secteur_activite: string;
  adresse: string;
  ville: string;
  code_postal: string;
  latitude: number | null;
  longitude: number | null;
  instagram: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  siren_siret: string;
  notes_entreprise: string;
  site_web: string;
  pagespeed_mobile: number | null;
  pagespeed_desktop: number | null;
  pagespeed_checked_at: string | null;
  pagespeed_details: PageSpeedDetails | null;
  derniere_interaction: string | null;
  created_at: string;
  updated_at: string;
};

export type Interaction = {
  id: string;
  contact_id: string;
  type: 'Appel' | 'Email' | 'WhatsApp' | 'SMS' | 'Facebook' | 'Instagram';
  date_heure: string;
  duree: number;
  resultat: 'Pas de réponse' | 'Répondu' | 'Intéressé' | 'Non intéressé' | 'Relance' | '';
  notes: string;
  created_at: string;
};

export type Tache = {
  id: string;
  contact_id: string | null;
  titre: string;
  description: string;
  date_echeance: string | null;
  statut: 'En attente' | 'Terminé';
  created_at: string;
  updated_at: string;
};

export type Objectif = {
  id: string;
  date: string;
  appels_objectif: number;
  messages_objectif: number;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  titre: string;
  type: 'Email' | 'WhatsApp' | 'SMS';
  contenu: string;
  variables: string[];
  created_at: string;
  updated_at: string;
};

export type ScriptPhoning = {
  id: string;
  titre: string;
  contenu: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type Relance = {
  id: string;
  contact_id: string;
  interaction_id: string | null;
  etape: number;
  date_relance: string;
  statut: 'en_attente' | 'fait' | 'ignore';
  tache_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ContactDocument = {
  id: string;
  contact_id: string;
  nom_fichier: string;
  storage_path: string;
  taille_octets: number;
  created_at: string;
};

export type SessionTravail = {
  id: string;
  user_id: string;
  debut: string;
  fin: string | null;
  duree_minutes: number | null;
  notes: string;
  type_session: 'travail' | 'prospection';
  created_at: string;
};

export type RecapJournalier = {
  id: string;
  user_id: string;
  jour: string;
  minutes_travail: number;
  minutes_prospection: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>;
      };
      interactions: {
        Row: Interaction;
        Insert: Omit<Interaction, 'id' | 'created_at'>;
        Update: Partial<Omit<Interaction, 'id' | 'created_at'>>;
      };
      taches: {
        Row: Tache;
        Insert: Omit<Tache, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tache, 'id' | 'created_at' | 'updated_at'>>;
      };
      objectifs: {
        Row: Objectif;
        Insert: Omit<Objectif, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Objectif, 'id' | 'created_at' | 'updated_at'>>;
      };
      templates: {
        Row: Template;
        Insert: Omit<Template, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Template, 'id' | 'created_at' | 'updated_at'>>;
      };
      scripts_phoning: {
        Row: ScriptPhoning;
        Insert: Omit<ScriptPhoning, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ScriptPhoning, 'id' | 'created_at' | 'updated_at'>>;
      };
      sessions_travail: {
        Row: SessionTravail;
        Insert: Omit<SessionTravail, 'id' | 'created_at'>;
        Update: Partial<Omit<SessionTravail, 'id' | 'created_at'>>;
      };
      recaps_journaliers: {
        Row: RecapJournalier;
        Insert: Omit<RecapJournalier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecapJournalier, 'id' | 'created_at' | 'updated_at'>>;
      };
      relances: {
        Row: Relance;
        Insert: Omit<Relance, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Relance, 'id' | 'created_at' | 'updated_at'>>;
      };
      contact_documents: {
        Row: ContactDocument;
        Insert: Omit<ContactDocument, 'id' | 'created_at'>;
        Update: Partial<Omit<ContactDocument, 'id' | 'created_at'>>;
      };
    };
  };
};
