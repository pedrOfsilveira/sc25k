import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'
import { Notify } from 'quasar'

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
      this.loading = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Calcular Saldo Total (XP de todo o histórico)
        const { data: historico, error: erroHist } = await supabase
          .from('historico_treinos')
          .select('pontuacao')
          .eq('user_id', user.id)

        if (erroHist) throw erroHist

        this.saldoTotal = historico?.reduce((sum, item) => sum + (item.pontuacao || 0), 0) || 0

        // 2. Buscar Ofertas para MIM (Comprar)
        const { data: ofertasRecebidas, error: erroRecebidas } = await supabase
          .from('loja_ofertas')
          .select('*')
          .ilike('destinatario_email', user.email)
          .order('comprado', { ascending: true })
          .order('created_at', { ascending: false })

        if (erroRecebidas) throw erroRecebidas
        this.ofertasParaMim = ofertasRecebidas || []

        // 3. Calcular Gastos
        this.totalGasto = this.ofertasParaMim
          .filter(item => item.comprado)
          .reduce((sum, item) => sum + item.preco, 0)

        // 4. Buscar Minhas Ofertas (Vender)
        const { data: ofertasCriadas, error: erroCriadas } = await supabase
          .from('loja_ofertas')
          .select('*')
          .eq('criador_id', user.id)
          .order('created_at', { ascending: false })

        if (erroCriadas) throw erroCriadas
        this.minhasOfertas = ofertasCriadas || []

      } catch (error) {
        console.error("Erro ao carregar loja:", error)
        Notify.create({ message: 'Failed to load shop data', color: 'negative' })
      } finally {
        this.loading = false
      }
    },

    async criarOferta(emailDestino, titulo, preco) {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('loja_ofertas').insert({
          criador_id: user.id,
          criador_email: user.email,
          destinatario_email: emailDestino.trim(),
          titulo: titulo,
          preco: preco
        })

        if (error) throw error

        Notify.create({
          message: 'ITEM LISTED SUCCESSFULLY!',
          color: 'positive',
          icon: 'check_circle',
          classes: 'snes-font'
        })

        this.carregarDados()
        return true

      } catch (error) {
        Notify.create({ message: 'Error listing item', color: 'negative' })
        return false
      }
    },

    async comprarItem(item) {
      // Validação de Saldo
      if (this.saldoDisponivel < item.preco) {
        Notify.create({
          message: 'NOT ENOUGH EXP POINTS!',
          color: 'negative',
          icon: 'warning',
          classes: 'snes-font'
        })
        return false
      }

      // Confirmação
      if(!confirm(`EXCHANGE ${item.preco} XP FOR "${item.titulo}"?`)) return false

      try {
        const { error } = await supabase
          .from('loja_ofertas')
          .update({ comprado: true, comprado_em: new Date() })
          .eq('id', item.id)

        if (error) throw error

        Notify.create({
          message: 'ITEM ACQUIRED! GENERATING TICKET...',
          color: 'positive',
          icon: 'print',
          classes: 'snes-font'
        })

        // Atualização Local
        item.comprado = true
        this.totalGasto += item.preco

        return true // Retorna true para gerar o ticket visual

      } catch (error) {
        Notify.create({ message: 'Transaction failed', color: 'negative' })
        return false
      }
    }
  }
})
