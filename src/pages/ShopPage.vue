<template>
  <q-page class="page-container q-pa-md">
    <div class="star-background">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>

    <div class="content-wrapper q-px-md full-width" style="max-width: 600px">
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
              NO OFFERS RECEIVED.<br>ASK SOMEONE TO CREATE ONE FOR YOU.
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
                <div class="col q-pa-md">
                  <div class="text-yellow snes-font text-subtitle2">{{ offer.titulo }}</div>

                  <div class="text-grey-5 snes-font" style="font-size: 8px; margin-top: 4px;">
                    FROM: {{ offer.criador_email || 'Unknown User' }}
                  </div>
                </div>

                <div class="col-auto text-right">
                  <div class="snes-font text-white q-mb-sm">{{ offer.preco }} XP</div>

                  <div v-if="offer.comprado" class="snes-font text-grey-6 text-bold" style="font-size: 10px;">
                    [ OWNED ]
                  </div>

                  <q-btn
                    v-else
                    size="sm"
                    color="positive"
                    label="BUY"
                    class="retro-btn snes-font full-width"
                    @click="shopStore.comprarItem(offer)"
                  />
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
              v-model="novoEmail"
              dark
              outlined
              dense
              label="FOR (EMAIL)"
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
              :disable="!novoTitulo || !novoEmail || !novoPreco"
              @click="criarOferta"
            />
          </q-card>

          <div class="text-grey snes-font q-mb-sm" style="font-size: 10px">MY LISTINGS:</div>

          <div v-if="shopStore.minhasOfertas.length === 0" class="empty-shop q-pa-lg">
            <q-icon name="inventory_2" color="grey-8" size="lg" />
            <div class="text-grey snes-font q-mt-md" style="font-size: 10px">
              NO LISTINGS YET.<br>CREATE YOUR FIRST OFFER ABOVE.
            </div>
          </div>

          <div v-else class="q-gutter-y-sm">
            <div
              v-for="offer in shopStore.minhasOfertas"
              :key="offer.id"
              class="retro-screen-card q-pa-sm row items-center justify-between"
              style="min-height: 50px;"
            >
              <div>
                <div class="text-white snes-font" style="font-size: 10px;">{{ offer.titulo }}</div>
                <div class="text-grey-6 snes-font" style="font-size: 8px;">To: {{ offer.destinatario_email }}</div>
              </div>

              <div class="text-right">
                <div class="text-yellow snes-font" style="font-size: 10px;">{{ offer.preco }} XP</div>
                <q-badge
                  v-if="offer.comprado"
                  color="green"
                  text-color="black"
                  class="snes-font q-mt-xs"
                  style="font-size: 8px;"
                >
                  SOLD!
                </q-badge>
                <span v-else class="text-grey-6 snes-font" style="font-size: 8px;">WAITING</span>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useShopStore } from 'stores/shopStore'

const shopStore = useShopStore()
const tab = ref('buy')

const novoTitulo = ref('')
const novoEmail = ref('')
const novoPreco = ref(null)

onMounted(() => {
  shopStore.carregarDados()
})

const criarOferta = async () => {
  const sucesso = await shopStore.criarOferta(novoEmail.value, novoTitulo.value, novoPreco.value)
  if (sucesso) {
    novoTitulo.value = ''
    novoPreco.value = null
  }
}
</script>

<style scoped lang="scss">
/* ... Mantém todo o teu estilo SCSS existente ... */
/* Copie o estilo do teu último envio se necessário,
   a única mudança importante foi no template HTML acima */

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
  background-color: #101020;
  border: 2px solid #fff;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  border-radius: 4px;
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
  opacity: 0.6;
  filter: grayscale(100%);
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
</style>
