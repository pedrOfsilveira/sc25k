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

  const safeName = ticketData.value.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const fileName = `ticket-${safeName}-${ticketData.value.id}.png`

  const link = document.createElement('a')
  link.href = generatedTicketImg.value
  link.download = fileName // <--- AQUI ESTÁ O SEGREDO

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
        <h2 class="text-h4 street-font text-yellow snes-blink" style="text-shadow: 4px 4px 0 #000; margin-bottom: 10px;">
          ITEM SHOP
        </h2>

        <div class="xp-wallet q-pa-md q-mb-lg">
          <div class="row justify-between items-center">
            <span class="snes-font text-grey-5" style="font-size: 10px;">TOTAL EARNED:</span>
            <span class="snes-font text-white">{{ shopStore.saldoTotal }}</span>
          </div>
          <div class="row justify-between items-center">
            <span class="snes-font text-grey-5" style="font-size: 10px;">SPENT:</span>
            <span class="snes-font text-red">-{{ shopStore.totalGasto }}</span>
          </div>
          <q-separator color="grey-7" class="q-my-xs" />
          <div class="row justify-between items-center">
            <span class="snes-font text-yellow" style="font-size: 12px;">AVAILABLE:</span>
            <span class="snes-font text-yellow text-h6">{{ shopStore.saldoDisponivel }} XP</span>
          </div>
        </div>
      </div>

      <q-tabs
        v-model="tab"
        class="text-white snes-font q-mb-md"
        active-color="yellow"
        indicator-color="yellow"
        align="justify"
        dense
      >
        <q-tab name="buy" label="BUY (FOR ME)" />
        <q-tab name="sell" label="SELL (CREATE)" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="bg-transparent">
        <q-tab-panel name="buy" class="q-px-none">
          <div v-if="shopStore.loading" class="text-center text-white snes-font snes-blink">
            LOADING ITEMS...
          </div>

          <div v-else-if="shopStore.ofertasParaMim.length === 0" class="empty-shop q-pa-lg">
            <q-icon name="remove_shopping_cart" color="grey-8" size="xl" />
            <div class="text-grey snes-font q-mt-md" style="font-size: 10px">
              NO OFFERS RECEIVED.
            </div>
          </div>

          <div v-else class="q-gutter-y-md">
            <q-card
              v-for="offer in shopStore.ofertasParaMim"
              :key="offer.id"
              class="retro-screen-card q-pa-md"
              :class="{ 'item-sold': offer.comprado }"
            >
              <div class="row items-center justify-between">
                <div class="col-auto q-mr-sm">
                  <div class="mini-avatar">
                    <img v-if="offer.criador_avatar" :src="offer.criador_avatar" />
                    <q-icon v-else name="person" color="grey-5" size="sm" />
                  </div>
                </div>
                <div class="col q-pa-md">
                  <div class="text-yellow snes-font text-subtitle2">{{ offer.titulo }}</div>
                  <div class="text-grey-5 snes-font" style="font-size: 8px; margin-top: 4px;">
                    FROM: {{ offer.criador_name || 'Unknown User' }}
                  </div>
                </div>

                <div class="col-auto text-right">
                  <div class="snes-font text-white q-mb-sm">{{ offer.preco }} XP</div>

                  <div v-if="offer.comprado" class="q-gutter-y-xs">
                    <q-btn
                      flat
                      size="sm"
                      color="yellow"
                      label="VIEW TICKET"
                      icon="confirmation_number"
                      class="border-btn snes-font full-width"
                      @click="viewTicket(offer)"
                    />
                    <q-btn
                      flat
                      dense
                      size="sm"
                      color="red"
                      icon="delete"
                      class="border-btn snes-font full-width"
                      @click="shopStore.deletarOferta(offer.id)"
                    />
                  </div>

                  <div v-else class="q-gutter-y-xs">
                    <q-btn
                      size="sm"
                      color="positive"
                      label="BUY"
                      class="retro-btn snes-font full-width"
                      :loading="generatingTicket && currentOfferId === offer.id"
                      @click="askToBuy(offer)"
                    />
                    <q-btn
                      flat
                      dense
                      size="sm"
                      color="red"
                      icon="delete"
                      class="border-btn snes-font full-width"
                      @click="shopStore.deletarOferta(offer.id)"
                    />
                  </div>
                </div>
              </div>
            </q-card>
          </div>
        </q-tab-panel>

        <q-tab-panel name="sell" class="q-px-none">
          <q-card class="retro-screen-card q-pa-md q-mb-lg">
            <div class="text-white snes-font q-mb-md text-center" style="font-size: 12px;">
              CREATE NEW OFFER
            </div>
            <q-input
              v-model="novoTitulo"
              dark
              outlined
              dense
              label="ITEM NAME"
              class="retro-input q-mb-md snes-font"
              color="yellow"
            />
            <q-input
              v-model="novoNome"
              dark
              outlined
              dense
              label="FOR (NAME)"
              class="retro-input q-mb-md snes-font"
              color="yellow"
            />
            <q-input
              v-model.number="novoPreco"
              type="number"
              dark
              outlined
              dense
              label="PRICE (XP)"
              class="retro-input q-mb-md snes-font"
              color="yellow"
            />
            <q-btn
              flat
              label="LIST ITEM"
              color="purple-13"
              class="snes-font border-btn full-width"
              :disable="!novoTitulo || !novoNome || !novoPreco"
              @click="criarOferta"
            />
          </q-card>

          <div class="text-grey snes-font q-mb-sm" style="font-size: 10px">MY LISTINGS:</div>

          <div v-if="shopStore.minhasOfertas.length === 0" class="empty-shop q-pa-lg">
            <q-icon name="inventory_2" color="grey-8" size="lg" />
            <div class="text-grey snes-font q-mt-md" style="font-size: 10px">
              NO LISTINGS YET.
            </div>
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="offer in shopStore.minhasOfertas"
              :key="offer.id"
              class="retro-screen-card q-pa-sm row items-center justify-between"
              style="min-height: 50px;"
            >
              <div class="col">
                <div class="text-white snes-font" style="font-size: 10px;">{{ offer.titulo }}</div>
                <div class="text-grey-6 snes-font" style="font-size: 8px;">To: {{ offer.destinatario_name }}</div>
              </div>
              <div class="col-auto text-right">
                <div class="text-yellow snes-font" style="font-size: 10px;">{{ offer.preco }} XP</div>
                <div class="row items-center q-gutter-x-xs q-mt-xs">
                  <q-badge
                    v-if="offer.comprado"
                    color="green"
                    text-color="black"
                    class="snes-font"
                    style="font-size: 8px;"
                  >
                    SOLD!
                  </q-badge>
                  <span v-else class="text-grey-6 snes-font" style="font-size: 8px;">WAITING</span>
                  <q-btn
                    flat
                    dense
                    round
                    size="xs"
                    icon="delete"
                    color="red"
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
      <div ref="ticketRef" class="retro-ticket-container mario-font" v-if="ticketData">
        <div class="ticket-header star-font street-yellow">
          RUNNER'S SHOP
          <span class="ticket-id">#{{ ticketData.id.toString().slice(0, 6) }}</span>
        </div>
        <div class="ticket-body">
          <div class="ticket-row">
            <span class="label ">ITEM:</span>
            <span class="value street-yellow">{{ ticketData.titulo }}</span>
          </div>
          <div class="ticket-row">
            <span class="label ">PRICE:</span>
            <span class="value text-cyan-12">{{ ticketData.preco }} XP</span>
          </div>
          <div class="ticket-dashed-line"></div>
          <div class="ticket-row small">
            <span class="label">SELLER:</span>
            <span class="value">{{ ticketData.criador_name }}</span>
          </div>
          <div class="ticket-row small">
            <span class="label">BUYER:</span>
            <span class="value">{{ ticketData.destinatario_name }}</span>
          </div>
        </div>
        <div class="ticket-footer star-font">
          VALIDATED: {{ ticketData.comprado_em ? new Date(ticketData.comprado_em).toLocaleDateString() : new Date().toLocaleDateString() }}
          <div class="stamp alien-font">PAID</div>
        </div>
      </div>
    </div>

    <q-dialog v-model="showConfirmDialog" persistent backdrop-filter="blur(4px)" class="ticket-dialog">
      <q-card class="retro-screen-card text-center q-pa-md">
        <q-card-section>
          <q-icon name="help_outline" color="yellow" size="md" class="snes-blink" />
          <div class="text-h6 text-yellow snes-font q-mt-sm">CONFIRM PURCHASE</div>
          <div class="text-white snes-font q-my-md text-subtitle2" v-if="offerToBuy">
            BUY <span class="text-yellow">{{ offerToBuy.titulo }}</span>?
            <br><br>
            <span class="text-grey-5 text-caption">
              COST: <span class="text-red">{{ offerToBuy.preco }} XP</span>
            </span>
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md q-gutter-x-md">
          <q-btn flat label="NO" color="red-13" class="snes-font border-btn" v-close-popup />
          <q-btn flat label="YES" color="green-13" class="snes-font border-btn" @click="confirmPurchase" />
        </q-card-actions>
      </q-card>
    </q-dialog>

<q-dialog v-model="showTicketDialog">
      <q-card class="retro-screen-card  ticket-retro-screen text-center q-pa-md">
        <div class="text-h4 bttf-font bttf q-mb-xs">TICKET ACQUIRED!</div>
        <div class="bttf-font q-mb-md" style="font-size: 8px;">
          SAVE IT AND SEND TO THE SELLER AS PROOF.
        </div>

        <img
          v-if="generatedTicketImg"
          :src="generatedTicketImg"
          style="max-width: 100%;"
        />

        <q-card-actions align="center" class="q-mt-md q-gutter-x-md">
          <q-btn
            flat
            label="CLOSE"
            color="red"
            class="snes-font border-btn"
            v-close-popup
          />

          <q-btn
            flat
            label="SAVE IMG"
            icon="download"
            color="cyan-12"
            class="snes-font border-btn"
            @click="downloadTicket"
          />
        </q-card-actions>
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

.retro-ticket-container {
  width: 300px;
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 8px;
  padding: 16px;
  color: #fff;
  box-shadow: 5px 5px 0px #000;
  position: relative;
  overflow: hidden;
}

.ticket-header {
  text-align: center;
  font-size: 14px;
  border-bottom: 2px solid #fff;
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-id {
  font-size: 10px;
  color: #aaa;
}

.ticket-body {
  font-family: 'star';
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;

  &.small {
    font-size: 9px;
    color: #ccc;
  }
}

.ticket-dashed-line {
  border-bottom: 2px dashed #555;
  margin: 8px 0;
}

.ticket-footer {
  margin-top: 16px;
  border-top: 2px solid #fff;
  padding-top: 8px;
  text-align: center;
  font-size: 9px;
  color: #888;
  position: relative;
}

.stamp {
  position: absolute;
  bottom: 3px;
  right: 5px;
  border: 3px solid red;
  color: red;
  padding: 2px 8px;
  font-size: 14px;
  font-weight: bold;
  transform: rotate(-15deg);
  opacity: 0.8;
  text-shadow: 1px 1px 0 #000;
  border-radius: 4px;
}

.mini-avatar {
  width: 40px;
  height: 40px;
  border: 2px solid #fff;
  border-radius: 4px;
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

</style>
