<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useTreinoStore } from "stores/treinoStore";
import { treinos } from "src/data/treinos.js";
import { supabase } from "boot/supabase";
import Cartucho from "src/components/Cartucho.vue";

const store = useTreinoStore();
const listaTreinos = treinos;

const mostrarHistorico = ref(false);
const historico = ref([]);
const loadingHistorico = ref(false);
const confirmDialog = ref(false);
const fotoEvidence = ref(null);

// Variáveis do Efeito Zoom
const activeCartuchoId = ref(null);
const itemRefs = ref({});

const setItemRef = (el, id) => {
  if (el) itemRefs.value[id] = el;
};

let observer = null;

onMounted(() => {
  // Configuração do Observer
  const options = {
    root: null,
    // Aumentei a margem para capturar melhor (faixa de 20% no meio)
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0.1 // Precisa de pelo menos 10% do item visível nessa faixa
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeCartuchoId.value = Number(entry.target.dataset.id);
      }
    });
  }, options);

  setTimeout(() => {
    Object.values(itemRefs.value).forEach((el) => observer.observe(el));
  }, 100);
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});

// Funções Normais
const abrirHistorico = async () => {
  mostrarHistorico.value = true;
  loadingHistorico.value = true;

  const { data, error } = await supabase
    .from("historico_treinos")
    .select("*")
    .order("created_at", { ascending: false });

  if (!error) {
    historico.value = data;
  }
  loadingHistorico.value = false;
};

const selecionarTreino = (id) => {
  store.carregarTreino(id);
};

const toggleTimer = () => {
  if (store.estaRodando) {
    store.pausarTimer();
  } else {
    store.iniciarTimer();
  }
};

const tentarCancelar = () => {
  store.pausarTimer();
  confirmDialog.value = true;
};

const confirmarCancelamento = async () => {
  confirmDialog.value = false;
  await store.cancelarTreino();
};

const retomarTreino = () => {
  store.iniciarTimer();
  confirmDialog.value = false;
};

const confirmarVitoria = () => {
  if (fotoEvidence.value) {
    store.enviarComprovante(fotoEvidence.value);
    fotoEvidence.value = null;
  }
};
</script>

<template>
  <q-page class="page-container q-pa-md">
    <div class="star-background">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
    </div>

    <div v-if="!store.treinoAtivo" class="content-wrapper-index">
      <div class="select mb q-pa-md street-font flex items-center text-h3 snes-blink text-center">
        SELECT STAGE
      </div>

      <div class="cartuchos-grid">
        <div
          v-for="treino in listaTreinos"
          :key="treino.id"
          :data-id="treino.id"
          :ref="(el) => setItemRef(el, treino.id)"
          class="cartucho-wrapper"
          :class="{ 'active-card': activeCartuchoId === treino.id }"
          @click="selecionarTreino(treino.id)"
        >
          <Cartucho :treino="treino" />
        </div>
      </div>
       <div class="select mb q-pa-md street-font flex items-center text-h3 snes-blink text-center">
        THE END FOR NOW
      </div>
    </div>



    <div v-else class="content-wrapper-index">
      <div class="full-width q-mt-md" style="max-width: 600px">
        <q-linear-progress
          reverse
          size="25px"
          :value="store.progressoGeral"
          class="retro-bar"
        />

        <div v-if="store.passoAtual.tipo === 'corrida'" class="street-font flex items-center text-h6 snes-blink">RUN!</div>
        <div v-if="store.passoAtual.tipo === 'aquecimento'" class="street-font flex items-center text-h6 snes-blink">WARM UP!</div>
        <div v-if="store.passoAtual.tipo === 'arrefecimento'" class="street-font flex items-center text-h6 snes-blink">CHILL!</div>
        <div v-if="store.passoAtual.tipo === 'caminhada'" class="street-font flex items-center text-h6 snes-blink">REST!</div>
      </div>

      <div class="full-width flex flex-center column col-grow">
        <div v-if="store.treinoConcluido" class="text-center full-width q-px-md">
          <h2 class="text-warning snes-blink q-mb-md street-font text-h4">
            MISSION COMPLETE!
          </h2>

          <div class="login-card q-pa-sm">
            <q-file
              v-model="fotoEvidence"
              dark
              outlined
              label="TAKE PHOTO"
              accept="image/*"
              capture="environment"
              class="retro-input full-width q-mb-md"
              color="yellow"
            >
              <template v-slot:prepend>
                <q-icon name="camera_alt" />
              </template>
            </q-file>
          </div>

          <div class="text-white q-mb-lg s-font" style="font-size: 0.7rem">
            UPLOAD EVIDENCE TO SAVE
          </div>

          <q-btn
            label="CONFIRM UPLOAD"
            color="positive"
            text-color="white"
            class="retro-btn full-width q-py-md"
            :disable="!fotoEvidence"
            :loading="store.salvando"
            @click="confirmarVitoria"
          />
        </div>

        <div v-else class="text-center">
          <q-img v-if="store.passoAtual.tipo === 'aquecimento'" src="src/assets/warmup.gif" width="60px" />
          <q-img v-if="store.passoAtual.tipo === 'arrefecimento'" src="src/assets/cooldown.gif" width="60px" />
          <q-img v-if="store.passoAtual.tipo === 'corrida'" src="src/assets/run.gif" width="140px" />
          <q-img v-if="store.passoAtual.tipo === 'caminhada'" src="src/assets/eskeleto.gif" width="60px" />

          <div class="text-h1 street-font text-white" style="font-size: 4rem; text-shadow: 4px 4px 0 #000">
            {{ store.tempoFormatado }}
          </div>
        </div>
      </div>

      <div v-if="!store.treinoConcluido" class="full-width q-mb-md text-center">
        <div class="login-card q-pa-sm q-mt-md">
          <div class="login-action-card">
            <div class="btn-holder">
              <div class="btn-wrapper down">
                <q-btn
                  flat
                  class="login-btn-green"
                  :icon="store.estaRodando ? 'pause' : 'play_arrow'"
                  @click="toggleTimer"
                />
                <q-btn flat class="login-btn-blue" />
              </div>
              <div class="btn-wrapper up">
                <q-btn flat class="login-btn-yellow" />
                <q-btn
                  flat
                  class="login-btn-red"
                  icon="stop"
                  @click="tentarCancelar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="confirmDialog" persistent backdrop-filter="blur(4px)" class="retro-dialog">
      <q-card class="confirm-dialog-card">
        <div class="dialog-card-header justify-center">
          <q-icon name="warning" color="negative" size="md" class="snes-blink" />
          <div class="star-font text-negative text-h6">WARNING!</div>
        </div>

        <div class="dialog-card-body">
          <div class="text-white alien-font text-subtitle2">
            DO YOU WANT TO GIVE UP?
          </div>
          <div class="text-grey-5 alien-font q-mt-md" style="font-size: 10px;">
            PROGRESS WILL BE SAVED AS <span class="text-negative star-font">INCOMPLETE</span>.
          </div>
        </div>

        <div class="dialog-card-actions justify-center q-gutter-x-md">
          <q-btn
            flat
            label="NO"
            color="green-13"
            class="alien-font"
            @click="retomarTreino"
          />
          <q-btn
            flat
            label="YES"
            color="red-13"
            class="alien-font"
            @click="confirmarCancelamento"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style lang="scss">
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

.content-wrapper-index {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// --- AJUSTES DO GRID ---
.cartuchos-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 50px;
  width: 100%;
}

.cartucho-wrapper {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-origin: center center;
  filter: brightness(0.6) grayscale(50%); /* Itens fora de foco ficam mais apagados */
  opacity: 0.7;
}

.active-card {
  transform: scale(1.15);
  z-index: 10;
  filter: brightness(1.1) grayscale(0%); /* Item focado brilha */
  opacity: 1;
}
// -----------------------

.border-btn {
  border: 2px solid currentColor;
  border-radius: 0;
}

.retro-btn {
  border-radius: 0;
  border: 2px solid white;
}

.retro-bar {
  border: 2px solid white;
  border-radius: 2px;
  background-color: $street-yellow !important;
  opacity: 1 !important;
  color: $street-red !important;
}

.q-linear-progress__track--light {
  background-color: $street-yellow !important;
  background: none !important;
  opacity: 0 !important;
}

.retro-input .q-field__control {
  border-radius: 0 !important;
  border-width: 2px;
}

.login-card {
  display: grid;
  position: relative;
  bottom: 0;
  background-color: $snes-light;
  min-width: 300px;
  border-radius: 14px;
  gap: 16px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 -3px 4px rgba(0, 0, 0, 0.5),
    inset 1px -2px 1px rgba(255, 255, 255, 0.5),
    0 12px 0px darken($snes-dark, 25%);
}

.login-card::after,
.login-card::before {
  content: "";
  position: absolute;
  height: 60px;
  width: 50px;
  background-color: $snes-darker;
  border-radius: 10px;
  z-index: -1;
  top: -7px;
}

.login-card::before { left: 12px; }
.login-card::after { right: 12px; }

.login-action-card {
  background-color: $snes-dark;
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.4);

  & .q-btn {
    border-radius: 100%;
    height: 40px;
    width: 40px;
    transform: rotate(38deg);
  }
}

.btn-wrapper {
  background-color: $snes-light;
  padding: 6px;
  border-radius: 100px;
  display: flex;
  gap: 25px;
  box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.4);
}

.btn-holder {
  transform: rotate(-38deg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.down { transform: translateX(-9px); }
.up { transform: translateX(9px); }

.login-btn-blue {
  background: $snes-blue;
  box-shadow: 0.5px 2px 0px darken($snes-blue, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-red {
  background: $snes-red;
  box-shadow: 0.5px 2px 0px darken($snes-red, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-yellow {
  background: $snes-yellow;
  box-shadow: 0.5px 2px 0px darken($snes-yellow, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-green {
  background: $snes-green;
  box-shadow: 0.5px 2px 0px darken($snes-green, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.select {
  text-shadow: 2px 2px 0px #000;
  height: 30vh;
}

.mb { margin-bottom: 65px; }

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
  width: 1px; height: 1px; background: transparent;
  box-shadow: $shadows-small; animation: animStar 50s linear infinite;
  &:after { content: " "; position: absolute; top: 2000px; width: 1px; height: 1px; background: transparent; box-shadow: $shadows-small; }
}

#stars2 {
  width: 2px; height: 2px; background: transparent;
  box-shadow: $shadows-medium; animation: animStar 100s linear infinite;
  &:after { content: " "; position: absolute; top: 2000px; width: 2px; height: 2px; background: transparent; box-shadow: $shadows-medium; }
}

#stars3 {
  width: 3px; height: 3px; background: transparent;
  box-shadow: $shadows-big; animation: animStar 150s linear infinite;
  &:after { content: " "; position: absolute; top: 2000px; width: 3px; height: 3px; background: transparent; box-shadow: $shadows-big; }
}

@keyframes animStar {
  from { transform: translateY(0px); }
  to { transform: translateY(-2000px); }
}

.snes-blink { animation: retro-blink 2s infinite; }

@keyframes retro-blink {
  0%, 4% { opacity: 1; }
  5%, 9% { opacity: 0; }
  10%, 14% { opacity: 1; }
  15%, 19% { opacity: 0; }
  20%, 24% { opacity: 1; }
  25%, 29% { opacity: 0; }
  30%, 100% { opacity: 1; }
}

.bounce { animation: bounce 0.5s infinite alternate; }

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.retro-screen-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  position: relative;
}

// Confirm dialog card styles
.confirm-dialog-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  min-width: 300px;
}

.dialog-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  border-bottom: 1px solid #222;
}

.dialog-card-body {
  padding: 20px 16px;
  text-align: center;
}

.dialog-card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid #222;
}
</style>
