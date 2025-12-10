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

        const userName = user.user_metadata?.name || user.email;

        const { data: historico, error: erroHist } = await supabase
          .from('historico_treinos')
          .select('pontuacao')
          .eq('user_id', user.id);

        if (erroHist) throw erroHist;

        this.saldoTotal = historico?.reduce((sum, item) => sum + (item.pontuacao || 0), 0) || 0;

        const { data: ofertasRecebidas, error: erroRecebidas } = await supabase
          .from('loja_ofertas')
          .select('*')
          .ilike('destinatario_name', userName)
          .order('comprado', { ascending: true })
          .order('created_at', { ascending: false });

        if (erroRecebidas) throw erroRecebidas;
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
        const userName = user.user_metadata?.name || user.email;
        const avatarUrl = user.user_metadata?.avatar_url || null;

        const offerData = {
          criador_id: user.id,
          criador_name: userName,
          destinatario_name: nomeDestino.trim(),
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

        if (error) throw error;

        Notify.create({
          message: 'OFFER DELETED!',
          color: 'positive',
          icon: 'delete',
          classes: 'snes-font'
        });

        this.carregarDados();
        return true;

      } catch (error) {
        Notify.create({ message: 'Failed to delete offer', color: 'negative' });
        return false;
      }
    },

    async buscarUsuarioPorNome(nome) {
      try {
        // This requires a user_profiles table or similar
        // For now, we'll just return the name since we're using metadata
        return { name: nome, avatar_url: '' };
      } catch (error) {
        console.error('Error searching user:', error);
        return null;
      }
    }
  }
});
