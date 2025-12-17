import { defineStore } from 'pinia';
import { supabase } from 'boot/supabase';
import { Notify } from 'quasar';

export const useShopStore = defineStore('shop', {
  state: () => ({
    ofertasParaMim: [],
    minhasOfertas: [],
    saldoTotal: 0,
    totalGasto: 0,
    loading: false
  }),

  getters: {
    saldoDisponivel: (state) => state.saldoTotal - state.totalGasto
  },

  actions: {

    async carregarDados() {
      this.loading = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userName = (user.user_metadata?.name || user.email).toLowerCase();

        const { data: historico, error: erroHist } = await supabase
          .from('historico_treinos')
          .select('pontuacao')
          .eq('user_id', user.id);

        if (erroHist) throw erroHist;

        this.saldoTotal = historico?.reduce((sum, item) => sum + (item.pontuacao || 0), 0) || 0;

        // Try exact match first, then case-insensitive
        let ofertasRecebidas;
        let erroRecebidas;

        const { data: exactMatch, error: errorExact } = await supabase
          .from('loja_ofertas')
          .select('*')
          .eq('destinatario_name', userName)
          .order('comprado', { ascending: true })
          .order('created_at', { ascending: false });

        if (exactMatch && exactMatch.length > 0) {
          ofertasRecebidas = exactMatch;
          erroRecebidas = null;
        } else {
          // Fall back to case-insensitive search
          const { data: caseInsensitive, error: errorCI } = await supabase
            .from('loja_ofertas')
            .select('*')
            .ilike('destinatario_name', userName)
            .order('comprado', { ascending: true })
            .order('created_at', { ascending: false });
          ofertasRecebidas = caseInsensitive;
          erroRecebidas = errorCI;
        }

        if (erroRecebidas) throw erroRecebidas;
        console.log('Offers for user:', { userName, count: ofertasRecebidas?.length || 0, offers: ofertasRecebidas });
        this.ofertasParaMim = ofertasRecebidas || [];

        this.totalGasto = this.ofertasParaMim
          .filter(item => item.comprado)
          .reduce((sum, item) => sum + item.preco, 0);

        const { data: ofertasCriadas, error: erroCriadas } = await supabase
          .from('loja_ofertas')
          .select('*')
          .eq('criador_id', user.id)
          .order('created_at', { ascending: false });

        if (erroCriadas) throw erroCriadas;
        this.minhasOfertas = ofertasCriadas || [];

      } catch (error) {
        console.error("Erro ao carregar loja:", error);
        Notify.create({ message: 'Failed to load shop data', color: 'negative' });
      } finally {
        this.loading = false;
      }
    },

    async criarOferta(nomeDestino, titulo, preco) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = (user.user_metadata?.name || user.email).toLowerCase();
        const avatarUrl = user.user_metadata?.avatar_url || null;

        // Validate recipient exists by name (case-insensitive) in profiles table
        const cleanName = (nomeDestino || '').trim().toLowerCase();
        if (!cleanName) {
          Notify.create({ message: 'Recipient name is required', color: 'warning' });
          return false;
        }

        console.log('Looking for user with name:', cleanName);
        const recipient = await this.buscarUsuarioPorNome(cleanName);
        if (!recipient) {
          console.log('Recipient not found:', cleanName);
          Notify.create({
            message: `No user found with name: ${cleanName}`,
            color: 'negative',
            icon: 'warning',
            position: 'top'
          });
          return false;
        }

        console.log('Recipient found:', recipient);
        const offerData = {
          criador_id: user.id,
          criador_name: userName,
          destinatario_name: cleanName,
          titulo: titulo,
          preco: preco
        };

        // Only add avatar if the column exists (for backwards compatibility)
        if (avatarUrl) {
          offerData.criador_avatar = avatarUrl;
        }

        const { error } = await supabase.from('loja_ofertas').insert(offerData);

        if (error) {
          console.error('Error creating offer:', error);
          throw error;
        }

        Notify.create({
          message: 'ITEM LISTED SUCCESSFULLY!',
          color: 'positive',
          icon: 'check_circle',
          classes: 'snes-font'
        });

        this.carregarDados();
        return true;

      } catch (error) {
        console.error('Error creating offer:', error);
        const errorMsg = error.message || error.details || 'Error listing item';
        Notify.create({
          message: errorMsg,
          color: 'negative',
          timeout: 5000,
          position: 'top'
        });
        return false;
      }
    },

    async comprarItem(item) {
      if (this.saldoDisponivel < item.preco) {
        Notify.create({
          message: 'NOT ENOUGH EXP POINTS!',
          color: 'negative',
          icon: 'warning',
          classes: 'snes-font'
        });
        return false;
      }

      try {
        const { error } = await supabase
          .from('loja_ofertas')
          .update({ comprado: true, comprado_em: new Date() })
          .eq('id', item.id);

        if (error) throw error;

        Notify.create({
          message: 'ITEM ACQUIRED! GENERATING TICKET...',
          color: 'positive',
          icon: 'print',
          classes: 'snes-font'
        });

        item.comprado = true;
        this.totalGasto += item.preco;

        return true;

      } catch (error) {
        Notify.create({ message: 'Transaction failed', color: 'negative' });
        return false;
      }
    },

    async deletarOferta(offerId) {
      try {
        const { error } = await supabase
          .from('loja_ofertas')
          .delete()
          .eq('id', offerId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }

        // Reload data to refresh the lists
        await this.carregarDados();

        Notify.create({
          message: 'OFFER DELETED!',
          color: 'positive',
          icon: 'delete',
          classes: 'snes-font'
        });

        return true;

      } catch (error) {
        console.error('Failed to delete offer:', error);
        Notify.create({
          message: error.message || 'Failed to delete offer',
          color: 'negative',
          timeout: 5000
        });
        return false;
      }
    },

    async getAllProfiles() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url');

        if (error) throw error;
        console.log('All profiles in DB:', data);
        return data || [];
      } catch (error) {
        console.error('Error fetching all profiles:', error);
        return [];
      }
    },

    async buscarUsuarioPorNome(nome) {
      try {
        const nameLower = (nome || '').toLowerCase();
        // Exact match on lowercase name
        const { data: exactMatch, error: error1 } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('name', nameLower)
          .limit(1);

        if (!error1 && Array.isArray(exactMatch) && exactMatch.length > 0) {
          console.log('Found exact match:', exactMatch[0]);
          return exactMatch[0];
        }

        console.log('No user found with name:', nameLower);
        return null;
      } catch (error) {
        console.error('Error searching user:', error);
        return null;
      }
    },

    async createUserProfile(userId, name, avatarUrl = null) {
      try {
        const nameLower = (name || '').toLowerCase();
        console.log('Creating profile for user:', { userId, name: nameLower, avatarUrl });
        // Enforce unique names (case-insensitive via lowercase storage)
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('name', nameLower)
          .neq('id', userId)
          .limit(1);

        if (checkError) throw checkError;
        if (Array.isArray(existing) && existing.length > 0) {
          Notify.create({
            message: 'Name already in use. Choose another.',
            color: 'warning',
            position: 'top',
            icon: 'warning'
          });
          return null;
        }

        const { data, error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              name: nameLower,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
          )
          .select();

        if (error) throw error;
        console.log('Profile created successfully:', data);
        return data;
      } catch (error) {
        console.error('Error creating user profile:', error);
        Notify.create({
          message: 'Error creating profile: ' + error.message,
          color: 'negative',
          timeout: 5000
        });
        return null;
      }
    }
  }
});
