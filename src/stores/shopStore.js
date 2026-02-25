import { defineStore } from 'pinia';
import { supabase } from 'boot/supabase';
import { Notify } from 'quasar';
import {
  fetchProfilesByIds,
  fetchHistoryScoresByUser,
  fetchOffersReceivedByUserId,
  fetchOffersReceivedByName,
  fetchOffersReceivedByNameInsensitive,
  fetchOffersByCreator,
  insertOffer,
  markOfferPurchased,
  deleteOfferById,
  fetchAllProfiles,
  findProfileByName,
  findAnotherProfileWithName,
  upsertProfile
} from 'src/services/shopService';

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

    async _fetchProfilesByIds(userIds) {
      const data = await fetchProfilesByIds(userIds);
      const map = new Map();
      for (const p of data) {
        if (p?.id) map.set(p.id, p);
      }
      return map;
    },

    async _enrichOffersWithCreatorProfiles(offers) {
      try {
        const creatorIds = (offers || []).map(o => o?.criador_id).filter(Boolean);
        const profilesById = await this._fetchProfilesByIds(creatorIds);
        for (const offer of offers || []) {
          const p = profilesById.get(offer.criador_id);
          if (p?.avatar_url && !offer.criador_avatar) {
            offer.criador_avatar = p.avatar_url;
          }
          if (p?.name && !offer.criador_name) {
            offer.criador_name = p.name;
          }
        }
      } catch (e) {
        // If profiles are protected by RLS and cannot be fetched, fall back silently
      }
    },

    async carregarDados() {
      this.loading = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userName = (user.user_metadata?.name || user.email).toLowerCase();

        const historico = await fetchHistoryScoresByUser(user.id);

        this.saldoTotal = historico?.reduce((sum, item) => sum + (item.pontuacao || 0), 0) || 0;

        // Fetch offers by user ID first, fall back to name-based matching
        let ofertasRecebidas = [];
        try {
          ofertasRecebidas = await fetchOffersReceivedByUserId(user.id);
        } catch (_) {
          // Column may not exist yet — fall back to name-based
        }

        if (ofertasRecebidas.length === 0) {
          const exactMatch = await fetchOffersReceivedByName(userName);
          if (exactMatch.length > 0) {
            ofertasRecebidas = exactMatch;
          } else {
            ofertasRecebidas = await fetchOffersReceivedByNameInsensitive(userName);
          }
        }

        this.ofertasParaMim = ofertasRecebidas || [];
        await this._enrichOffersWithCreatorProfiles(this.ofertasParaMim);

        this.totalGasto = this.ofertasParaMim
          .filter(item => item.comprado)
          .reduce((sum, item) => sum + item.preco, 0);

        const ofertasCriadas = await fetchOffersByCreator(user.id);
        this.minhasOfertas = ofertasCriadas || [];
        await this._enrichOffersWithCreatorProfiles(this.minhasOfertas);

      } catch (error) {
        console.error("Erro ao carregar loja:", error);
        Notify.create({ message: 'Failed to load shop data', color: 'negative' });
      } finally {
        this.loading = false;
      }
    },

    async criarOferta(nomeDestino, titulo, preco) {
      try {
        // Validate price range
        const numericPrice = Number(preco);
        if (!Number.isFinite(numericPrice) || numericPrice < 1 || numericPrice > 99999) {
          Notify.create({ message: 'Price must be between 1 and 99,999 XP', color: 'warning' });
          return false;
        }
        const sanitizedPrice = Math.floor(numericPrice);

        const { data: { user } } = await supabase.auth.getUser();
        const userName = (user.user_metadata?.name || user.email).toLowerCase();
        const avatarUrl = user.user_metadata?.avatar_url || null;

        // Validate recipient exists by name (case-insensitive) in profiles table
        const cleanName = (nomeDestino || '').trim().toLowerCase();
        if (!cleanName) {
          Notify.create({ message: 'Recipient name is required', color: 'warning' });
          return false;
        }

        const recipient = await this.buscarUsuarioPorNome(cleanName);
        if (!recipient) {
          Notify.create({
            message: `No user found with name: ${cleanName}`,
            color: 'negative',
            icon: 'warning',
            position: 'top'
          });
          return false;
        }

        const offerData = {
          criador_id: user.id,
          criador_name: userName,
          destinatario_id: recipient.id,
          destinatario_name: cleanName,
          titulo: titulo,
          preco: sanitizedPrice
        };

        // Only add avatar if the column exists (for backwards compatibility)
        if (avatarUrl) {
          offerData.criador_avatar = avatarUrl;
        }

        await insertOffer(offerData);

        Notify.create({
          message: `ITEM LISTED! IT WILL APPEAR IN ${cleanName.toUpperCase()}'S SHOP.`,
          color: 'positive',
          icon: 'check_circle',
          classes: 'snes-font'
        });

        await this.carregarDados();
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
        await markOfferPurchased(item.id);

        Notify.create({
          message: `ITEM ACQUIRED! ${item.preco} XP DEDUCTED FROM WALLET.`,
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

    async deletarOferta(offerOrId) {
      try {
        const offerId = typeof offerOrId === 'object' && offerOrId !== null ? offerOrId.id : offerOrId;
        const knownComprado = typeof offerOrId === 'object' && offerOrId !== null ? offerOrId.comprado : undefined;
        const localOffer =
          this.ofertasParaMim.find(o => o.id === offerId) ||
          this.minhasOfertas.find(o => o.id === offerId);
        const isComprado = knownComprado ?? localOffer?.comprado;

        if (isComprado) {
          Notify.create({
            message: "You can't delete an offer that was already purchased.",
            color: 'warning',
            icon: 'lock',
            classes: 'snes-font'
          });
          return false;
        }

        await deleteOfferById(offerId);

        // Reload data to refresh the lists
        await this.carregarDados();

        Notify.create({
          message: 'OFFER DELETED! REMOVED FROM THE SHOP.',
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
        const data = await fetchAllProfiles();
        return data || [];
      } catch (error) {
        console.error('Error fetching all profiles:', error);
        return [];
      }
    },

    async buscarUsuarioPorNome(nome) {
      try {
        const nameLower = (nome || '').toLowerCase();
        const exactMatch = await findProfileByName(nameLower);

        return exactMatch || null;
      } catch (error) {
        console.error('Error searching user:', error);
        return null;
      }
    },

    async createUserProfile(userId, name, avatarUrl = null) {
      try {
        const nameLower = (name || '').toLowerCase();
        const hasNameCollision = await findAnotherProfileWithName(nameLower, userId);
        if (hasNameCollision) {
          Notify.create({
            message: 'Name already in use. Choose another.',
            color: 'warning',
            position: 'top',
            icon: 'warning'
          });
          return null;
        }

        const profileUpsert = {
          id: userId,
          name: nameLower,
          updated_at: new Date().toISOString()
        };

        // Avoid wiping existing avatar when the value isn't available
        if (avatarUrl) profileUpsert.avatar_url = avatarUrl;

        return await upsertProfile(profileUpsert);
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
