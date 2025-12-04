
import { createClient } from '@supabase/supabase-js';
import { Member, Transaction, ReimbursementRequest, User, CommunityMessage, AppSettings, Notification } from '../types';

// Configuration Supabase
// Note: Assurez-vous d'avoir créé un fichier .env avec VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

// Safe access to environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    const env = (import.meta as any).env || {};
    return env[key] || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://njlnotuysheuntclexef.supabase.co');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbG5vdHV5c2hldW50Y2xleGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ2NjAsImV4cCI6MjA4MDI5MDY2MH0.EwoZhX8M-s1wJqGqPFtMJgFgGl84ncc146ZfA8kvnl8');

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers pour mapper snake_case (DB) <-> camelCase (App)
const mapMemberFromDb = (data: any): Member => ({
  id: data.id,
  email: data.email,
  firstName: data.first_name,
  lastName: data.last_name,
  role: data.role || 'Membre',
  status: data.status || 'active',
  phone: data.phone,
  identifier: data.identifier,
  filiere: data.filiere,
  niveau: data.niveau,
  avatarUrl: data.avatar_url,
});

const mapTransactionFromDb = (data: any): Transaction => ({
  id: data.id,
  type: data.type,
  amount: data.amount,
  category: data.category,
  label: data.label,
  description: data.description,
  date: data.date,
  memberId: data.member_id,
  memberName: data.members ? `${data.members.first_name} ${data.members.last_name}` : 'Inconnu',
  status: data.status,
  receiptUrl: data.receipt_url,
});

const mapReimbursementFromDb = (data: any): ReimbursementRequest => ({
  id: data.id,
  memberId: data.member_id,
  memberName: data.members ? `${data.members.first_name} ${data.members.last_name}` : 'Inconnu',
  amount: data.amount,
  reason: data.reason,
  status: data.status,
  date: data.requested_date || data.created_at,
  receiptUrl: data.receipt_url,
});

const mapMessageFromDb = (data: any): CommunityMessage => ({
  id: data.id,
  authorId: data.author_id,
  authorName: data.members ? `${data.members.first_name} ${data.members.last_name}` : 'Inconnu',
  content: data.content,
  date: data.created_at,
  attachmentUrl: data.attachment_url,
});

export const base44 = {
  auth: {
    signup: async (email: string, password: string, firstName: string, lastName: string): Promise<{ user: User | null; error: string | null }> => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (authError) return { user: null, error: authError.message };
      
      // Note: Le trigger SQL handle_new_user créera automatiquement l'entrée dans la table public.members
      // Cependant, pour l'UX immédiate, on peut retourner une structure User basique
      
      return { 
        user: authData.user ? {
          id: authData.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: 'Membre',
          status: 'active'
        } as Member : null, 
        error: null 
      };
    },

    login: async (email: string, password?: string): Promise<{ user: User | null; error: string | null }> => {
      // 1. Auth avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'password123', // Fallback pour démo si pas de champ password dans UI
      });

      if (authError) return { user: null, error: authError.message };
      if (!authData.user) return { user: null, error: "Utilisateur non trouvé" };

      // 2. Récupérer les détails du profil depuis la table 'members'
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', authData.user.id) // Note: Si id de members != id auth, utiliser user_id. Ici schema suppose id = id.
        .maybeSingle(); 
        // Si memberData est null (ex: le trigger a failli ou id match direct), on tente par ID direct si le trigger utilise NEW.id
        
      let finalMemberData = memberData;
      if (!finalMemberData) {
         const { data: memberDataById } = await supabase.from('members').select('*').eq('id', authData.user.id).maybeSingle();
         finalMemberData = memberDataById;
      }

      let user: Member;
      
      if (finalMemberData) {
        user = mapMemberFromDb(finalMemberData);
      } else {
        // Fallback si pas encore de profil créé (latence trigger)
        user = {
            id: authData.user.id,
            email: email,
            firstName: authData.user.user_metadata?.first_name || 'Utilisateur',
            lastName: authData.user.user_metadata?.last_name || '',
            role: 'Membre',
            status: 'active'
        };
      }

      // 3. Mettre en cache local pour l'accès synchrone (compatibilité legacy)
      localStorage.setItem('sas_user', JSON.stringify(user));
      localStorage.setItem('sb_access_token', authData.session?.access_token || '');

      return { user, error: null };
    },

    logout: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('sas_user');
      localStorage.removeItem('sb_access_token');
      window.location.hash = '#/login';
    },

    me: (): User | null => {
      // Accès synchrone pour l'UI, basé sur le cache mis à jour au login
      const stored = localStorage.getItem('sas_user');
      return stored ? JSON.parse(stored) : null;
    },

    isAuthenticated: () => {
       // Vérification simple du token ou de l'utilisateur
       return !!localStorage.getItem('sas_user');
    },
    
    // Fonction utilitaire pour récupérer la session réelle si besoin
    getSession: async () => {
        return await supabase.auth.getSession();
    }
  },

  entities: {
    Transaction: {
      list: async (): Promise<Transaction[]> => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, members(first_name, last_name)')
          .order('date', { ascending: false });
        
        if (error) throw error;
        return data.map(mapTransactionFromDb);
      },
      create: async (data: Omit<Transaction, 'id' | 'memberName'>) => {
        const dbData = {
          type: data.type,
          amount: data.amount,
          category: data.category,
          label: data.label,
          description: data.description,
          date: data.date,
          member_id: data.memberId,
          status: data.status,
          receipt_url: data.receiptUrl
        };
        const { data: res, error } = await supabase.from('transactions').insert(dbData).select().single();
        if (error) throw error;
        return mapTransactionFromDb(res); // Note: memberName sera manquant ici sans refetch, gérer dans UI
      },
      delete: async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      },
      updateStatus: async (id: string, status: Transaction['status']) => {
        const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
        if (error) throw error;
      }
    },

    Member: {
      list: async (): Promise<Member[]> => {
        const { data, error } = await supabase.from('members').select('*').order('last_name');
        if (error) throw error;
        return data.map(mapMemberFromDb);
      },
      create: async (data: Omit<Member, 'id'>) => {
        // Attention: Normalement la création se fait via Auth SignUp trigger
        // Ici on suppose une création administrative directe
        const dbData = {
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          status: data.status,
          phone: data.phone,
          identifier: data.identifier,
          filiere: data.filiere,
          niveau: data.niveau
        };
        const { data: res, error } = await supabase.from('members').insert(dbData).select().single();
        if (error) throw error;
        return mapMemberFromDb(res);
      },
      update: async (id: string, data: Partial<Member>) => {
        const dbData: any = {};
        if (data.firstName) dbData.first_name = data.firstName;
        if (data.lastName) dbData.last_name = data.lastName;
        if (data.role) dbData.role = data.role;
        if (data.status) dbData.status = data.status;
        if (data.phone) dbData.phone = data.phone;
        if (data.identifier) dbData.identifier = data.identifier;
        if (data.filiere) dbData.filiere = data.filiere;
        if (data.niveau) dbData.niveau = data.niveau;
        if (data.avatarUrl) dbData.avatar_url = data.avatarUrl;

        const { data: res, error } = await supabase
            .from('members')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Mise à jour du cache local si c'est l'utilisateur courant
        const currentUser = base44.auth.me();
        if (currentUser && currentUser.id === id) {
            localStorage.setItem('sas_user', JSON.stringify(mapMemberFromDb(res)));
        }

        return mapMemberFromDb(res);
      }
    },

    ReimbursementRequest: {
      list: async (): Promise<ReimbursementRequest[]> => {
        const { data, error } = await supabase
          .from('reimbursement_requests')
          .select('*, members(first_name, last_name)')
          .order('requested_date', { ascending: false });
        if (error) throw error;
        return data.map(mapReimbursementFromDb);
      },
      create: async (data: Omit<ReimbursementRequest, 'id' | 'status' | 'memberName'>) => {
        const dbData = {
            member_id: data.memberId,
            amount: data.amount,
            reason: data.reason,
            requested_date: data.date,
            status: 'pending'
        };
        const { data: res, error } = await supabase.from('reimbursement_requests').insert(dbData).select().single();
        if (error) throw error;
        return mapReimbursementFromDb(res);
      },
      updateStatus: async (id: string, status: ReimbursementRequest['status']) => {
        const { error } = await supabase.from('reimbursement_requests').update({ status }).eq('id', id);
        if (error) throw error;
      }
    },

    CommunityMessage: {
      list: async (): Promise<CommunityMessage[]> => {
        const { data, error } = await supabase
            .from('community_messages')
            .select('*, members(first_name, last_name)')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data.map(mapMessageFromDb);
      },
      create: async (data: Omit<CommunityMessage, 'id' | 'authorName'>) => {
        const dbData = {
            author_id: data.authorId,
            content: data.content,
            created_at: data.date,
            attachment_url: data.attachmentUrl
        };
        const { data: res, error } = await supabase.from('community_messages').insert(dbData).select().single();
        if (error) throw error;
        return mapMessageFromDb(res);
      }
    },

    AppSettings: {
      get: async (): Promise<AppSettings> => {
        const { data, error } = await supabase.from('app_settings').select('*').single();
        if (error) {
            // Si pas de settings, retourner défaut
            return { appName: 'SAS Finance', primaryColor: '#2563eb', logoUrl: '' };
        }
        return {
            appName: data.app_name,
            primaryColor: data.primary_color,
            logoUrl: data.logo_url
        };
      },
      update: async (data: Partial<AppSettings>) => {
        // On suppose une seule ligne dans app_settings, on update la première trouvée ou par ID fixe
        // Pour simplifier, on fait un upsert avec un ID fixe ou on update tout
        const dbData: any = {};
        if (data.appName) dbData.app_name = data.appName;
        if (data.primaryColor) dbData.primary_color = data.primaryColor;
        if (data.logoUrl) dbData.logo_url = data.logoUrl;

        // Note: Cela suppose que la table app_settings a une ligne initialisée
        const { error } = await supabase.from('app_settings').update(dbData).neq('id', '00000000-0000-0000-0000-000000000000'); 
        if (error) throw error;
      }
    },

    Notification: {
      list: async (): Promise<Notification[]> => {
        const { data, error } = await supabase.from('notifications').select('*').order('date', { ascending: false });
        if (error) return []; // Table peut ne pas exister encore dans votre schéma
        return data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: n.date,
            read: n.read,
            type: n.type
        }));
      },
      create: async (data: Omit<Notification, 'id' | 'read' | 'date'>) => {
        const dbData = {
            title: data.title,
            message: data.message,
            type: data.type,
            read: false,
            date: new Date().toISOString()
        };
        // Utiliser .catch pour éviter de planter si la table n'existe pas
        const { error } = await supabase.from('notifications').insert(dbData);
        if (error) console.warn('Notifs non configurées', error);
      },
      markRead: async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      }
    }
  },

  services: {
    sendReport: async (type: 'email' | 'whatsapp', period: string) => {
        // Appeler une Edge Function Supabase ici idéalement
        console.log(`Sending ${period} report via ${type} (Supabase Edge Function Call)`);
        await new Promise(r => setTimeout(r, 1000));
        return true;
    }
  },

  storage: {
    uploadFile: async (file: File) => {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('files') // Assurez-vous d'avoir créé un bucket 'files' public
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName);
        
      return publicUrl;
    }
  }
};
