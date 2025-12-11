<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useShopStore } from 'stores/shopStore'
import html2canvas from 'html2canvas'
import { Notify } from 'quasar'

const shopStore = useShopStore();
const tab = ref('buy');

const novoTitulo = ref('');
const novoNome = ref('');
const novoPreco = ref(null);

const ticketRef = ref(null);
const ticketData = ref(null);
const showTicketDialog = ref(false);
const generatedTicketImg = ref(null);
const generatingTicket = ref(false);
const currentOfferId = ref(null);
const showConfirmDialog = ref(false);
const offerToBuy = ref(null);

onMounted(() => {
  shopStore.carregarDados();
});

const downloadTicket = () => {
  if (!generatedTicketImg.value || !ticketData.value) return

  const date = new Date()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const fileName = `ticket-${dateStr}.png`

  const link = document.createElement('a')
  link.href = generatedTicketImg.value
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
};

const criarOferta = async () => {
  const sucesso = await shopStore.criarOferta(novoNome.value, novoTitulo.value, novoPreco.value)
  if (sucesso) {
    novoTitulo.value = ''
    novoNome.value = ''
    novoPreco.value = null
  }
};

const askToBuy = (offer) => {
  offerToBuy.value = offer
  showConfirmDialog.value = true
};

const gerarTicketVisual = async (offer) => {
  ticketData.value = offer
  await nextTick()

  try {
    const canvas = await html2canvas(ticketRef.value, {
      backgroundColor: null,
      scale: 2
    })
    generatedTicketImg.value = canvas.toDataURL('image/png')
    showTicketDialog.value = true
  } catch (error) {
    console.error(error)
    Notify.create({ message: "Error generating ticket.", color: 'negative' })
  }
};

// Reabrir ticket já comprado
const viewTicket = async (offer) => {
  currentOfferId.value = offer.id // Para loading visual se quiseres
  await gerarTicketVisual(offer)
  currentOfferId.value = null
};

const confirmPurchase = async () => {
  if (!offerToBuy.value) return

  showConfirmDialog.value = false

  const offer = offerToBuy.value
  currentOfferId.value = offer.id
  generatingTicket.value = true

  const success = await shopStore.comprarItem(offer)

  if (success) {
    await gerarTicketVisual(offer)
  }

  generatingTicket.value = false
  currentOfferId.value = null
  offerToBuy.value = null
};
</script>

<template>
  <q-page class="page-container q-pa-md">
    <div class="star-background">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>

    <div class="content-wrapper q-px-md">
      <div class="text-center q-mb-md">
        <h2 class="text-h4 star-font text-accent snes-blink" style="text-shadow: 4px 4px 0 #000; margin-bottom: 10px;">
          ITEM SHOP
        </h2>

        <div class="xp-wallet q-pa-md q-mb-lg">
          <div class="row justify-between items-center">
            <span class="alien-font text-grey-5" style="font-size: 10px;">TOTAL EARNED:</span>
            <span class="star-font text-white">{{ shopStore.saldoTotal }}</span>
          </div>
          <div class="row justify-between items-center">
            <span class="alien-font text-grey-5" style="font-size: 10px;">SPENT:</span>
            <span class="star-font text-negative">-{{ shopStore.totalGasto }}</span>
          </div>
          <q-separator color="grey-6" class="q-my-xs" />
          <div class="row justify-between items-center">
            <span class="alien-font text-accent" style="font-size: 12px;">AVAILABLE:</span>
            <span class="star-font text-accent text-h6">{{ shopStore.saldoDisponivel }} XP</span>
          </div>
        </div>
      </div>

      <q-tabs
        v-model="tab"
        class="text-white alien-font q-mb-md"
        active-color="accent"
        indicator-color="accent"
        align="justify"
        dense
      >
        <q-tab name="buy" label="BUY (FOR ME)" />
        <q-tab name="sell" label="SELL (CREATE)" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="bg-transparent">
        <q-tab-panel name="buy" class="q-px-none">
          <div v-if="shopStore.loading" class="text-center text-white alien-font snes-blink">
            LOADING ITEMS...
          </div>

          <div v-else-if="shopStore.ofertasParaMim.length === 0" class="empty-shop q-pa-lg">
            <q-icon name="remove_shopping_cart" color="grey-6" size="xl" />
            <div class="text-grey alien-font q-mt-md" style="font-size: 10px">
              NO OFFERS RECEIVED.
            </div>
          </div>

          <div v-else class="q-gutter-y-md">
            <q-card
              v-for="offer in shopStore.ofertasParaMim"
              :key="offer.id"
              class="offer-card"
              :class="{ 'item-sold': offer.comprado }"
            >
              <!-- Top section: Avatar + Info -->
              <div class="offer-card-header">
                <div class="offer-avatar">
                  <img v-if="offer.criador_avatar" :src="offer.criador_avatar" />
                  <q-icon v-else name="person" color="grey-6" size="md" />
                </div>
                <div class="offer-seller-info">
                  <span class="alien-font text-grey-5">FROM</span>
                  <span class="star-font text-white">{{ offer.criador_name || 'Unknown' }}</span>
                </div>
                <div class="offer-price-tag">
                  <span class="alien-font text-grey-5">PRICE</span>
                  <span class="star-font text-cyan">{{ offer.preco }} XP</span>
                </div>
              </div>

              <!-- Middle section: Item title -->
              <div class="offer-card-body">
                <div class="offer-title star-font text-accent">{{ offer.titulo }}</div>
                <span
                  v-if="offer.comprado"
                  class="alien-font status-badge status-complete"
                >
                  OWNED
                </span>
              </div>

              <!-- Bottom section: Actions -->
              <div class="offer-card-actions">
                <q-btn
                  v-if="offer.comprado"
                  flat
                  size="sm"
                  color="accent"
                  label="VIEW TICKET"
                  icon="confirmation_number"
                  class="border-btn alien-font"
                  @click="viewTicket(offer)"
                />
                <q-btn
                  v-else
                  flat
                  size="sm"
                  color="info"
                  label="BUY NOW"
                  icon="shopping_cart"
                  class="border-btn alien-font buy-btn"
                  :loading="generatingTicket && currentOfferId === offer.id"
                  @click="askToBuy(offer)"
                />
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="negative"
                  icon="delete"
                  class="border-btn alien-font delete-btn"
                  @click="shopStore.deletarOferta(offer.id)"
                />
              </div>
            </q-card>
          </div>
        </q-tab-panel>

        <q-tab-panel name="sell" class="q-px-none">
          <q-card class="offer-card q-mb-lg">
            <div class="offer-card-header create-offer-header">
              <q-icon name="add_circle" color="accent" size="lg" />
              <div class="star-font text-white text-h6">CREATE OFFER</div>
            </div>
            <div class="offer-card-body" style="flex-direction: column; align-items: stretch;">
              <q-input
                v-model="novoTitulo"
                dark
                outlined
                dense
                label="ITEM NAME"
                class="retro-input q-mb-md alien-font"
                color="accent"
              />
              <q-input
                v-model="novoNome"
                dark
                outlined
                dense
                label="FOR (NAME)"
                class="retro-input q-mb-md alien-font"
                color="accent"
              />
              <q-input
                v-model.number="novoPreco"
                type="number"
                dark
                outlined
                dense
                label="PRICE (XP)"
                class="retro-input alien-font"
                color="accent"
              />
            </div>
            <div class="offer-card-actions">
              <q-btn
                flat
                label="LIST ITEM"
                icon="sell"
                color="accent"
                class="alien-font border-btn full-width"
                :disable="!novoTitulo || !novoNome || !novoPreco"
                @click="criarOferta"
              />
            </div>
          </q-card>

          <div class="text-grey alien-font q-mb-sm" style="font-size: 10px">MY LISTINGS:</div>

          <div v-if="shopStore.minhasOfertas.length === 0" class="empty-shop q-pa-lg">
            <q-icon name="inventory_2" color="grey-6" size="lg" />
            <div class="text-grey alien-font q-mt-md" style="font-size: 10px">
              NO LISTINGS YET.
            </div>
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="offer in shopStore.minhasOfertas"
              :key="offer.id"
              class="listing-card"
              :class="{ 'listing-sold': offer.comprado }"
            >
              <div class="listing-info">
                <div class="star-font text-white" style="font-size: 12px;">{{ offer.titulo }}</div>
                <div class="alien-font text-grey-5 caption-10">TO: {{ offer.destinatario_name }}</div>
              </div>
              <div class="listing-status">
                <div class="star-font text-accent" style="font-size: 12px;">{{ offer.preco }} XP</div>
                <div class="row items-center q-gutter-x-xs q-mt-xs">
                  <span
                    v-if="offer.comprado"
                    class="alien-font status-badge status-complete"
                  >
                    SOLD!
                  </span>
                  <span v-else class="text-grey-5 alien-font caption-10">WAITING</span>
                  <q-btn
                    flat
                    dense
                    round
                    size="xs"
                    icon="delete"
                    color="negative"
                    @click="shopStore.deletarOferta(offer.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <div style="position: fixed; left: -9999px; top: 0; z-index: -100;">
      <div ref="ticketRef" class="ticket-container" v-if="ticketData">
        <div class="ticket-header">
          <span class="star-font text-accent">RUNNER'S SHOP</span>
          <span class="ticket-id alien-font">#{{ ticketData.id.toString().slice(0, 6) }}</span>
        </div>

        <div class="ticket-body">
          <div class="ticket-row">
            <span class="alien-font text-grey-5">ITEM:</span>
            <span class="star-font text-accent">{{ ticketData.titulo }}</span>
          </div>
          <div class="ticket-row">
            <span class="alien-font text-grey-5">PRICE:</span>
            <span class="star-font text-cyan-12">{{ ticketData.preco }} XP</span>
          </div>

          <div class="ticket-dashed-line"></div>

          <div class="ticket-row small">
            <span class="alien-font">SELLER:</span>
            <span class="star-font">{{ ticketData.criador_name }}</span>
          </div>
          <div class="ticket-row small">
            <span class="alien-font">BUYER:</span>
            <span class="star-font">{{ ticketData.destinatario_name }}</span>
          </div>
        </div>

        <div class="ticket-footer">
          <span class="alien-font">VALIDATED: {{ ticketData.comprado_em ? new Date(ticketData.comprado_em).toLocaleDateString() : new Date().toLocaleDateString() }}</span>
          <div class="ticket-stamp alien-font status-failed">PAID</div>
        </div>
      </div>
    </div>

    <q-dialog v-model="showConfirmDialog" persistent backdrop-filter="blur(4px)" class="ticket-dialog">
      <q-card class="offer-card dialog-card">
        <div class="offer-card-header justify-center">
          <q-icon name="help_outline" color="accent" size="md" class="snes-blink" />
          <div class="star-font text-accent text-h6">CONFIRM PURCHASE</div>
        </div>
        <div class="offer-card-body" style="flex-direction: column; text-align: center;" v-if="offerToBuy">
          <div class="text-white alien-font text-subtitle2">
            BUY <span class="text-accent star-font">{{ offerToBuy.titulo }}</span>?
          </div>
          <div class="offer-price-tag q-mt-md" style="align-self: center;">
            <span class="alien-font text-grey-5">COST</span>
            <span class="star-font text-negative">{{ offerToBuy.preco }} XP</span>
          </div>
        </div>
        <div class="offer-card-actions justify-center q-gutter-x-md">
          <q-btn flat label="NO" color="red-13" class="alien-font border-btn" v-close-popup />
          <q-btn flat label="YES" color="green-13" class="alien-font border-btn" @click="confirmPurchase" />
        </div>
      </q-card>
    </q-dialog>

<q-dialog v-model="showTicketDialog" backdrop-filter="blur(4px)">
      <q-card class="offer-card dialog-card ticket-dialog-card">
        <div class="offer-card-header" style="flex-direction: column; gap: 4px;">
          <div class="text-h4 bttf-font bttf">TICKET ACQUIRED!</div>
          <div class="bttf-font text-grey-5" style="font-size: 10px;">
            SAVE IT AND SEND TO THE SELLER AS PROOF
          </div>
        </div>

        <div class="offer-card-body" style="justify-content: center; padding: 12px;">
          <img
            v-if="generatedTicketImg"
            :src="generatedTicketImg"
            class="ticket-preview-img"
          />
        </div>

        <div class="offer-card-actions justify-center q-gutter-x-md">
          <q-btn
            flat
            label="CLOSE"
            color="negative"
            class="alien-font border-btn"
            v-close-popup
          />

          <q-btn
            flat
            label="SAVE IMG"
            icon="download"
            color="info"
            class="alien-font border-btn"
            @click="downloadTicket"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped lang="scss">
@function multiple-box-shadow($n) {
  $value: "#{random(2000)}px #{random(2000)}px #FFF";
  @for $i from 2 through $n {
    $value: "#{$value} , #{random(2000)}px #{random(2000)}px #FFF";
  }
  @return unquote($value);
}

$shadows-small: multiple-box-shadow(700);
$shadows-medium: multiple-box-shadow(200);
$shadows-big: multiple-box-shadow(100);

.page-container {
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.star-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  z-index: 0;
  overflow: hidden;
}

#stars {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: $shadows-small;
  animation: animStar 50s linear infinite;
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: $shadows-small;
  }
}

#stars2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: $shadows-medium;
  animation: animStar 100s linear infinite;
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: $shadows-medium;
  }
}

#stars3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: $shadows-big;
  animation: animStar 150s linear infinite;
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: $shadows-big;
  }
}

@keyframes animStar {
  from { transform: translateY(0px); }
  to { transform: translateY(-2000px); }
}

.xp-wallet {
  background-color: #000;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: 0 4px 0 rgba(255, 255, 255, 0.2);
}

.retro-screen-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  border-radius: 4px;
}

.ticket-retro-screen {
  padding: 20px;
  transform: translateY(-50px) !important;
}
.retro-btn {
  border: 2px solid white;
  border-radius: 0;
}

:deep(.retro-input .q-field__control) {
  border-radius: 0 !important;
  border: 2px solid #555;
}

.item-sold {
  opacity: 0.8;
  /* Removi grayscale para o "owned" nao ficar apagado demais */
  border-color: #555;
}

.empty-shop {
  border: 2px dashed #555;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
}

.border-btn {
  border: 2px solid currentColor;
  border-radius: 0;
}

.snes-blink {
  animation: retro-blink 2s infinite;
}

@keyframes retro-blink {
  0%, 4% { opacity: 1; }
  5%, 9% { opacity: 0; }
  10%, 14% { opacity: 1; }
  15%, 19% { opacity: 0; }
  20%, 24% { opacity: 1; }
  25%, 29% { opacity: 0; }
  30%, 100% { opacity: 1; }
}

// Ticket styles
.ticket-container {
  width: 300px;
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  padding: 16px;
  color: #fff;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  position: relative;
  overflow: hidden;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  border-bottom: 2px solid #fff;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.ticket-id {
  font-size: 10px;
  color: #666;
  letter-spacing: 1px;
}

.ticket-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;

  &.small {
    font-size: 10px;
    color: #ccc;
  }
}

.ticket-dashed-line {
  border-bottom: 2px dashed #444;
  margin: 10px 0;
}

.ticket-footer {
  margin-top: 16px;
  border-top: 2px solid #fff;
  padding-top: 10px;
  font-size: 10px;
  color: #666;
  position: relative;
}

.ticket-stamp {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 3px solid #f44336;
  color: #f44336;
  padding: 3px 10px;
  font-size: 14px;
  font-weight: bold;
  transform: rotate(-12deg);
  letter-spacing: 2px;
  border-radius: 4px;
  background: rgba(244, 67, 54, 0.1);
}

.mini-avatar {
  width: 80px;
  height: 80px;
  border: 2px solid #fff;
  border-radius: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// New offer card styles
.offer-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);

  &.item-sold {
    border-color: #555;
    opacity: 0.8;
  }
}

.offer-card-header {
  display: flex;
  text-align: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  border-bottom: 1px solid #222;

  &.create-offer-header {
    justify-content: center;
    padding: 20px 12px;
    gap: 10px;
  }
}

.offer-avatar {
  width: 48px;
  height: 48px;
  border: 2px solid #fff;

  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.offer-seller-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  span:first-child {
    font-size: 10px;
    letter-spacing: 1px;
  }

  span:last-child {
    font-size: 12px;
  }
}

.offer-price-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding: 8px 12px;
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.2);


  span:first-child {
    font-size: 10px;
    letter-spacing: 1px;
  }

  span:last-child {
    font-size: 16px;
    font-weight: bold;
  }
}

.offer-card-body {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 60px;
}

.offer-title {
  font-size: 18px;
  line-height: 1.3;
  word-wrap: break-word;
  text-shadow: 2px 2px 0 #000;
}

.owned-badge {
  font-size: 10px;
  padding: 4px 8px;
  flex-shrink: 0;
  border-radius: 0;
}

.status-badge {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 2px;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.status-complete {
  background: rgba(85, 255, 85, 0.2);
  color: #55ff55;
  border: 1px solid #55ff55;
}
.status-failed {
  background: rgba(255, 85, 85, 0.2);
  color: #ff5555;
  border: 1px solid #ff5555;
}

.offer-card-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid #222;
}

.buy-btn {
  flex: 1;
}

.caption-10 {
  font-size: 10px;
}

.delete-btn {
  flex-shrink: 0;
}

// Dialog card styles
.dialog-card {
  min-width: 300px;
  max-width: 90vw;
}

.ticket-dialog-card {
  max-width: 400px;
}

.ticket-preview-img {
  max-width: 100%;
}

// Listing card styles
.listing-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);

  &.listing-sold {
    border-color: #4caf50;
    background: linear-gradient(90deg, rgba(76, 175, 80, 0.1) 0%, transparent 100%);
  }
}

.listing-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.listing-status {
  text-align: right;
  flex-shrink: 0;
}

</style>
