<template>
  <q-page class="flex flex-center column retro-bg">

    <div v-if="!store.treinoAtivo" class="q-pa-md text-center full-width" style="max-width: 600px">
      <h2 class="retro-title text-retro-accent">SELECT STAGE</h2>

      <q-btn
        icon="emoji_events"
        label="HALL OF FAME (HISTÓRICO)"
        color="purple"
        class="full-width q-mb-lg retro-btn"
        @click="abrirHistorico"
      />

      <div class="q-gutter-y-md">
        <div
          v-for="treino in listaTreinos"
          :key="treino.id"
          class="stage-card cursor-pointer relative-position"
          v-ripple
          @click="selecionarTreino(treino.id)"
        >
          <div class="text-h6 text-retro-secondary">{{ treino.titulo }}</div>
          <div class="text-caption text-grey-4">{{ treino.descricao }}</div>
          <div class="text-caption text-yellow-8 q-mt-sm">
            PRESS START >
          </div>
        </div>
      </div>

      <q-dialog v-model="mostrarHistorico" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card class="retro-bg text-white">
          <q-bar class="bg-primary text-white">
            <div class="text-h6 retro-font" style="font-size: 12px">RECORDS</div>
            <q-space />
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>

          <q-card-section>
            <div v-if="loadingHistorico" class="text-center q-mt-xl blink">LOADING...</div>

            <div v-else-if="historico.length === 0" class="text-center q-mt-xl">
              NO RECORDS FOUND.<br>START RUNNING!
            </div>

            <q-list v-else dark separator>
              <q-item v-for="item in historico" :key="item.id" class="q-py-md">

                <q-item-section avatar>
                  <q-avatar v-if="item.foto_url" rounded size="50px">
                    <img :src="item.foto_url" style="object-fit: cover; border: 2px solid white">
                  </q-avatar>
                  <q-icon v-else name="star" color="yellow" size="md" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="retro-font text-yellow" style="font-size: 10px">STAGE CLEAR</q-item-label>
                  <q-item-label caption class="text-white">
                    {{ new Date(item.created_at).toLocaleDateString() }}
                    <span class="text-grey-5"> | {{ new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                  </q-item-label>

                  <a v-if="item.foto_url" :href="item.foto_url" target="_blank" class="text-retro-secondary text-caption q-mt-xs" style="text-decoration: none; border-bottom: 1px dashed white;">
                    [VIEW EVIDENCE]
                  </a>
                </q-item-section>

                <q-item-section side>
                  <div class="text-retro-accent text-bold">{{ item.pontuacao }} PTS</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>

    <div v-else class="full-width column items-center justify-between window-height q-pa-md">

      <div class="full-width q-mt-md">
        <div class="row justify-between text-retro-accent q-mb-xs">
          <span class="blink" v-if="store.estaRodando">TIME</span>
          <span v-else>PAUSED</span>
          <span>P1</span>
        </div>
        <q-linear-progress
          size="25px"
          :value="store.progressoGeral"
          color="yellow-8"
          track-color="red-9"
          class="retro-bar"
        >
          <div class="absolute-full flex flex-center">
            <span class="text-black text-bold retro-font" style="font-size: 10px">ENERGY</span>
          </div>
        </q-linear-progress>
      </div>

      <div class="full-width flex flex-center column col-grow">

        <div v-if="store.treinoConcluido" class="text-center full-width q-px-md animate-pop">
          <h2 class="text-warning blink-slow q-mb-md retro-font" style="font-size: 1.5rem">MISSION COMPLETE!</h2>

          <div class="text-white q-mb-lg retro-font" style="font-size: 0.7rem; line-height: 1.5">
            UPLOAD EVIDENCE TO<br>SAVE YOUR SCORE
          </div>

          <q-file
            v-model="fotoEvidence"
            dark
            outlined
            label="TAKE PHOTO 📷"
            accept="image/*"
            capture="environment"
            class="retro-input full-width q-mb-md"
            color="yellow"
          >
            <template v-slot:prepend>
              <q-icon name="camera_alt" />
            </template>
          </q-file>

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

        <div v-else class="timer-box text-center">
          <q-icon
            :name="store.passoAtual.tipo === 'corrida' ? 'directions_run' : 'directions_walk'"
            size="5rem"
            :color="store.corAtual"
            class="q-mb-md"
            :class="store.estaRodando ? 'bounce' : ''"
          />

          <div class="text-h1 retro-font text-white" style="font-size: 4rem">
            {{ store.tempoFormatado }}
          </div>

          <div :class="`text-h4 q-mt-md text-${store.corAtual} blink-slow retro-font`">
            {{ store.passoAtual.texto }}
          </div>
        </div>

      </div>

      <div v-if="!store.treinoConcluido" class="full-width q-mb-xl text-center">
        <div class="row justify-center q-gutter-lg">
          <q-btn
            round
            size="xl"
            :icon="store.estaRodando ? 'pause' : 'play_arrow'"
            :color="store.estaRodando ? 'orange' : 'green'"
            @click="toggleTimer"
            class="retro-control-btn"
          />

          <q-btn
            round
            size="lg"
            icon="stop"
            color="red"
            @click="cancelarTreino"
            class="retro-control-btn"
          />
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useTreinoStore } from 'stores/treinoStore'
import { treinos } from 'src/data/treinos.js'
import { supabase } from 'boot/supabase'

const store = useTreinoStore()
const listaTreinos = treinos

// --- Lógica do Histórico ---
const mostrarHistorico = ref(false)
const historico = ref([])
const loadingHistorico = ref(false)

const abrirHistorico = async () => {
  mostrarHistorico.value = true
  loadingHistorico.value = true

  const { data, error } = await supabase
    .from('historico_treinos')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error) {
    historico.value = data
  }
  loadingHistorico.value = false
}

// --- Lógica do Menu ---
const selecionarTreino = (id) => {
  store.carregarTreino(id)
}

// --- Lógica dos Controles ---
const toggleTimer = () => {
  if (store.estaRodando) {
    store.pausarTimer()
  } else {
    store.iniciarTimer()
  }
}

const cancelarTreino = () => {
  store.pausarTimer()
  if (confirm('QUIT GAME? (PROGRESS WILL BE LOST)')) {
    store.$reset()
  }
}

// --- Lógica do Upload da Foto ---
const fotoEvidence = ref(null)

const confirmarVitoria = () => {
  if (fotoEvidence.value) {
    // Chama a store para subir a foto e salvar
    store.enviarComprovante(fotoEvidence.value)
    // Limpa o input local
    fotoEvidence.value = null
  }
}
</script>

<style scoped>
/* --- ESTILOS GERAIS --- */
.retro-bg {
  background-color: var(--retro-bg);
}

.retro-font {
  font-family: 'Press Start 2P', cursive;
}

/* --- MENU --- */
.retro-title {
  font-family: 'Press Start 2P', cursive;
  font-size: 1.8rem;
  text-shadow: 4px 4px #000;
  line-height: 1.5;
}

.stage-card {
  border: 4px solid var(--retro-secondary);
  padding: 20px;
  background: rgba(0,0,0,0.3);
  transition: transform 0.1s;
}
.stage-card:active {
  transform: scale(0.98);
  background: var(--retro-secondary);
}
.stage-card:active .text-h6 {
  color: white !important;
}

/* --- HUD --- */
.retro-bar {
  border: 2px solid white;
  border-radius: 0;
}

.retro-control-btn {
  border: 4px solid rgba(255,255,255,0.8);
  box-shadow: 0 0 15px rgba(255,255,255,0.2);
}

/* --- INPUTS E BOTÕES --- */
:deep(.retro-input .q-field__control) {
  border-radius: 0 !important;
  border-width: 2px;
}

.retro-btn {
  font-family: 'Press Start 2P', cursive;
  border-radius: 0;
  border: 2px solid white;
  font-size: 0.8rem;
}

/* --- ANIMAÇÕES --- */
.blink {
  animation: blinker 1s linear infinite;
}

.blink-slow {
  animation: blinker 2s linear infinite;
}

@keyframes blinker {
  50% { opacity: 0; }
}

.bounce {
  animation: bounce 0.5s infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
}

.animate-pop {
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
