<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useTreinoStore } from "stores/treinoStore";
import { treinos } from "src/data/treinos.js";
import { supabase } from "boot/supabase";
import Cartucho from "src/components/Cartucho.vue";
import warmupGif from 'src/assets/warmup.gif';
import cooldownGif from 'src/assets/cooldown.gif';
import runGif from 'src/assets/run.gif';
import eskeletoGif from 'src/assets/eskeleto.gif';
import StarBackground from 'src/components/StarBackground.vue';
import { useConfetti } from 'src/composables/useConfetti.js';
import html2canvas from 'html2canvas';
import { Notify } from 'quasar';

const store = useTreinoStore();
const listaTreinos = treinos;
const { fireConfetti } = useConfetti();

const mostrarHistorico = ref(false);
const historico = ref([]);
const loadingHistorico = ref(false);
const confirmDialog = ref(false);
const fotoEvidence = ref(null);
const daySelectDialog = ref(false);
const selectedWeek = ref(null);
const helpDialog = ref(false);
const mission = ref({ week: 1, day: 1, completedAll: false });
const currentStreak = ref(0);
const onboardingDialog = ref(false);
const onboardingStep = ref(1);
const ONBOARDING_KEY = 'retroRun_onboarded';
const workoutSummaryDialog = ref(false);
const selectedDay = ref(null);
const workoutSummaryData = ref(null);

// Animated XP counter
const displayedXP = ref(0);
const shareCardRef = ref(null);
let xpAnimFrame = null;

// Variáveis do Efeito Zoom
const activeCartuchoId = ref(null);
const itemRefs = ref({});

const setItemRef = (el, id) => {
  if (el) itemRefs.value[id] = el;
};

let observer = null;

const getCurrentMission = () => {
  for (const week of listaTreinos) {
    if (!store.isWeekCompleted(week.id)) {
      const completed = store.completedDays[week.id] || [];
      const nextDay = [1, 2, 3].find((d) => !completed.includes(d)) || 1;
      return { week: week.id, day: nextDay, completedAll: false };
    }
  }

  return {
    week: listaTreinos.length,
    day: 3,
    completedAll: true
  };
};

const getCurrentStreak = () => {
  const weeks = Object.keys(store.completedDays || {})
    .map((weekId) => Number(weekId))
    .filter((weekId) => (store.completedDays[weekId] || []).length > 0)
    .sort((a, b) => a - b);

  if (weeks.length === 0) return 0;

  let streak = 0;
  let expectedWeek = weeks[weeks.length - 1];

  for (let idx = weeks.length - 1; idx >= 0; idx -= 1) {
    if (weeks[idx] !== expectedWeek) break;
    streak += 1;
    expectedWeek -= 1;
  }

  return streak;
};

const refreshProgressWidgets = () => {
  mission.value = getCurrentMission();
  currentStreak.value = getCurrentStreak();
};

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

  refreshProgressWidgets();

  // Show onboarding for first-time users
  if (!localStorage.getItem(ONBOARDING_KEY)) {
    onboardingDialog.value = true;
  }
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
  selectedWeek.value = id;
  daySelectDialog.value = true;
};

const selecionarDia = (dia) => {
  selectedDay.value = dia;
  daySelectDialog.value = false;

  // Build workout summary
  const weekData = listaTreinos.find(w => w.id === selectedWeek.value);
  if (weekData && weekData.dias && weekData.dias[dia - 1]) {
    const estrutura = weekData.dias[dia - 1].estrutura;
    const totalSeconds = estrutura.reduce((sum, step) => sum + step.tempo, 0);
    const runSeconds = estrutura.filter(s => s.tipo === 'corrida').reduce((sum, s) => sum + s.tempo, 0);
    const walkSeconds = estrutura.filter(s => s.tipo === 'caminhada').reduce((sum, s) => sum + s.tempo, 0);
    const warmupSeconds = estrutura.filter(s => s.tipo === 'aquecimento').reduce((sum, s) => sum + s.tempo, 0);
    const cooldownSeconds = estrutura.filter(s => s.tipo === 'arrefecimento').reduce((sum, s) => sum + s.tempo, 0);
    const runCycles = estrutura.filter(s => s.tipo === 'corrida').length;

    workoutSummaryData.value = {
      weekTitle: weekData.titulo,
      day: dia,
      totalMinutes: Math.round(totalSeconds / 60),
      runMinutes: Math.round(runSeconds / 60 * 10) / 10,
      walkMinutes: Math.round(walkSeconds / 60 * 10) / 10,
      warmupMinutes: Math.round(warmupSeconds / 60),
      cooldownMinutes: Math.round(cooldownSeconds / 60),
      runCycles,
      steps: estrutura
    };
    workoutSummaryDialog.value = true;
  } else {
    // Fallback: start directly
    store.carregarTreino(selectedWeek.value, dia);
    refreshProgressWidgets();
  }
};

const confirmStartWorkout = () => {
  workoutSummaryDialog.value = false;
  store.carregarTreino(selectedWeek.value, selectedDay.value);
  refreshProgressWidgets();
};

const isWeekUnlocked = (weekId) => {
  // Week 1 is always unlocked
  if (weekId === 1) return true;

  // Check if previous week is completed (all 3 days)
  return store.isWeekCompleted(weekId - 1);
};

const getDayStatus = (weekId, day) => {
  return store.getDayStatus(weekId, day);
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
    setTimeout(refreshProgressWidgets, 500);
  }
};

const abrirAjuda = () => {
  helpDialog.value = true;
};

const completeOnboarding = () => {
  localStorage.setItem(ONBOARDING_KEY, '1');
  onboardingDialog.value = false;
  onboardingStep.value = 1;
};

const nextOnboardingStep = () => {
  if (onboardingStep.value < 3) {
    onboardingStep.value++;
  } else {
    completeOnboarding();
  }
};

const prevOnboardingStep = () => {
  if (onboardingStep.value > 1) {
    onboardingStep.value--;
  }
};

// Fire confetti + animate XP when workout finishes
watch(() => store.treinoConcluido, (done) => {
  if (done) {
    fireConfetti(3500);
    animateXP();
  }
});

function animateXP() {
  const target = store.lastEarnedXP || 0;
  if (target <= 0) { displayedXP.value = 0; return; }
  displayedXP.value = 0;
  const duration = 1200; // ms
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out quad
    const eased = 1 - (1 - progress) * (1 - progress);
    displayedXP.value = Math.round(eased * target);
    if (progress < 1) {
      xpAnimFrame = requestAnimationFrame(step);
    }
  }
  xpAnimFrame = requestAnimationFrame(step);
}

async function shareCompletion() {
  try {
    const el = shareCardRef.value;
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: '#090a0f',
      scale: 2,
      logging: false
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'sc25k-run.png', { type: 'image/png' });
      const shareData = { files: [file], title: 'SC25K Run Complete!', text: 'I just completed a run on SC25K!' };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sc25k-run.png';
    a.click();
    URL.revokeObjectURL(url);
    Notify.create({ message: 'IMAGE SAVED!', color: 'positive', position: 'top', classes: 'retro-font' });
  } catch (e) {
    console.error('Share error:', e);
  }
}
</script>

<template>
  <q-page class="page-container q-pa-md">
    <StarBackground />

    <q-btn
      v-if="!store.treinoAtivo"
      flat
      dense
      label="?"
      color="accent"
      class="border-btn help-btn alien-font"
      aria-label="Help"
      @click="abrirAjuda"
    />

    <div v-if="!store.treinoAtivo" class="content-wrapper-index">
      <div class="select q-pa-md street-font flex items-center text-h3 snes-blink text-center">
        SELECT STAGE
      </div>

      <div class="mission-row q-mb-md">
        <q-card class="mission-card">
          <div class="alien-font mission-label">TODAY'S MISSION</div>
          <div class="star-font mission-value" v-if="!mission.completedAll">
            WEEK {{ mission.week }} · DAY {{ mission.day }}
          </div>
          <div class="star-font mission-value" v-else>
            ALL WEEKS COMPLETED
          </div>
        </q-card>

        <q-card class="mission-card">
          <div class="alien-font mission-label">CURRENT STREAK</div>
          <div class="star-font mission-value">{{ currentStreak }} WEEKS</div>
        </q-card>
      </div>

      <div class="cartuchos-grid">
        <div
          v-for="treino in listaTreinos"
          :key="treino.id"
          :data-id="treino.id"
          :ref="(el) => setItemRef(el, treino.id)"
          class="cartucho-wrapper"
          :class="{
            'active-card': activeCartuchoId === treino.id,
            'locked': !isWeekUnlocked(treino.id)
          }"
          @click="isWeekUnlocked(treino.id) ? selecionarTreino(treino.id) : null"
        >
          <Cartucho :treino="treino" :locked="!isWeekUnlocked(treino.id)" />
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
          <!-- Shareable card (rendered to canvas for share) -->
          <div ref="shareCardRef" class="share-card-capture">
            <h2 class="text-warning snes-blink q-mb-sm street-font text-h4">
              MISSION COMPLETE!
            </h2>
            <div class="xp-earned-row">
              <q-icon name="stars" color="accent" size="28px" />
              <span class="star-font text-accent xp-counter">+{{ displayedXP }} XP</span>
            </div>
            <div class="alien-font text-grey-5 q-mt-xs" style="font-size: 10px;">
              WEEK {{ store.currentWeek }} · DAY {{ store.currentDay }}
            </div>
          </div>

          <div class="login-card q-pa-sm q-mb-md q-mt-md">
            <div class="login-action-card">
              <div class="evidence-buttons">
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/*"
                  capture="environment"
                  style="display: none"
                  @change="(e) => fotoEvidence = e.target.files[0]"
                />
                <div class="photo-btn-wrapper" @click="$refs.fileInput.click()">
                  <div class="login-btn-blue photo-btn">
                    <q-icon name="camera_alt" size="24px" color="white" />
                  </div>
                </div>
                <q-btn
                  flat
                  class="login-btn-green photo-btn"
                  :disabled="!fotoEvidence"
                  :loading="store.salvando"
                  @click="confirmarVitoria"
                >
                  <q-icon name="send" size="20px" color="white" />
                </q-btn>
              </div>
            </div>
          </div>

          <div class="text-white q-mb-sm s-font" style="font-size: 0.7rem">
            {{ fotoEvidence ? 'TAP SEND TO SAVE' : 'TAP CAMERA TO UPLOAD EVIDENCE' }}
          </div>

          <q-btn
            flat
            dense
            icon="share"
            label="SHARE"
            color="info"
            class="alien-font border-btn q-mt-sm"
            @click="shareCompletion"
            style="font-size: 11px;"
          />
        </div>

        <div v-else class="text-center">
          <q-img v-if="store.passoAtual.tipo === 'aquecimento'" :src="warmupGif" width="60px" />
          <q-img v-if="store.passoAtual.tipo === 'arrefecimento'" :src="cooldownGif" width="60px" />
          <q-img v-if="store.passoAtual.tipo === 'corrida'" :src="runGif" width="140px" />
          <q-img v-if="store.passoAtual.tipo === 'caminhada'" :src="eskeletoGif" width="60px" />

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
          <div class="text-grey-5 alien-font q-mt-md" style="font-size: 10px; line-height: 18px;">
            PROGRESS WILL BE SAVED AS <span class="text-negative star-font">INCOMPLETE</span>.
          </div>
          <div class="text-grey-6 alien-font q-mt-sm" style="font-size: 9px; line-height: 16px; letter-spacing: 0.5px;">
            <q-icon name="info" size="10px" class="q-mr-xs" />
            YOU'LL EARN PARTIAL XP BASED ON PROGRESS. YOU CAN RETRY THIS DAY ANYTIME.
          </div>
        </div>

        <div class="dialog-card-actions justify-center q-gutter-x-md">
          <q-btn
            flat
            label="NO"
            color="green-13"
            class="alien-font border-btn"
            @click="retomarTreino"
          />
          <q-btn
            flat
            label="YES"
            color="red-13"
            class="alien-font border-btn"
            @click="confirmarCancelamento"
          />
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="daySelectDialog" backdrop-filter="blur(4px)" class="retro-dialog">
      <q-card class="confirm-dialog-card pretty-day-dialog">
        <div class="dialog-card-header justify-center">
          <div class="text-center">
            <div class="star-font text-accent text-h5" style="text-shadow: 3px 3px 0 #000">CHOOSE AN ADVENTURE</div>
            <div class="alien-font text-grey-5 caption-10 q-mt-xs">Select DAY 1, 2 or 3</div>
          </div>
        </div>

        <div class="dialog-card-body">
          <div class="day-selection-grid q-gutter-md">
            <q-btn
              v-for="day in 3"
              :key="day"
              flat
              :size="'md'"
              :color="getDayStatus(selectedWeek, day) === 'completed' ? 'positive' : 'info'"
              class="border-btn alien-font day-btn fancy-day-btn"
              @click="selecionarDia(day)"
            >
              <div class="day-btn-content">
                <q-icon :name="getDayStatus(selectedWeek, day) === 'completed' ? 'check_circle' : 'bolt'" size="20px" class="q-mr-sm" />
                <span class="alien-font">DAY {{ day }}</span>
              </div>
            </q-btn>
          </div>
        </div>

        <div class="dialog-card-actions justify-center">
          <q-btn
            flat
            size="sm"
            label="CANCEL"
            color="info"
            class="border-btn alien-font"
            @click="daySelectDialog = false"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Workout Summary Dialog -->
    <q-dialog v-model="workoutSummaryDialog" backdrop-filter="blur(4px)" class="retro-dialog">
      <q-card v-if="workoutSummaryData" class="confirm-dialog-card workout-summary-card">
        <div class="dialog-card-header justify-center">
          <div class="text-center">
            <div class="star-font text-accent text-h5" style="text-shadow: 3px 3px 0 #000">
              {{ workoutSummaryData.weekTitle }} · DAY {{ workoutSummaryData.day }}
            </div>
            <div class="alien-font text-grey-5 caption-10 q-mt-xs">WORKOUT OVERVIEW</div>
          </div>
        </div>

        <div class="dialog-card-body">
          <div class="workout-stats-grid">
            <div class="workout-stat">
              <div class="alien-font text-grey-5" style="font-size: 10px">TOTAL TIME</div>
              <div class="star-font text-white">{{ workoutSummaryData.totalMinutes }} MIN</div>
            </div>
            <div class="workout-stat">
              <div class="alien-font text-grey-5" style="font-size: 10px">RUN CYCLES</div>
              <div class="star-font text-negative">{{ workoutSummaryData.runCycles }}x</div>
            </div>
            <div class="workout-stat">
              <div class="alien-font text-grey-5" style="font-size: 10px">RUNNING</div>
              <div class="star-font text-negative">{{ workoutSummaryData.runMinutes }} MIN</div>
            </div>
            <div class="workout-stat">
              <div class="alien-font text-grey-5" style="font-size: 10px">WALKING</div>
              <div class="star-font text-info">{{ workoutSummaryData.walkMinutes }} MIN</div>
            </div>
            <div class="workout-stat">
              <div class="alien-font text-grey-5" style="font-size: 10px">WARM UP</div>
              <div class="star-font text-warning">{{ workoutSummaryData.warmupMinutes }} MIN</div>
            </div>
            <div class="workout-stat">
              <div class="alien-font text-grey-5" style="font-size: 10px">COOL DOWN</div>
              <div class="star-font text-warning">{{ workoutSummaryData.cooldownMinutes }} MIN</div>
            </div>
          </div>

          <div v-if="getDayStatus(selectedWeek, selectedDay) === 'completed'" class="q-mt-md">
            <div class="alien-font text-warning" style="font-size: 10px; letter-spacing: 1px;">
              <q-icon name="info" size="12px" class="q-mr-xs" />
              REPEAT RUN — YOU'LL EARN 50% XP
            </div>
          </div>
        </div>

        <div class="dialog-card-actions justify-center q-gutter-x-md">
          <q-btn
            flat
            size="sm"
            label="CANCEL"
            color="info"
            class="border-btn alien-font"
            @click="workoutSummaryDialog = false"
          />
          <q-btn
            flat
            size="sm"
            label="START RUN"
            color="accent"
            class="border-btn alien-font"
            @click="confirmStartWorkout"
          />
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="helpDialog" backdrop-filter="blur(4px)" class="retro-dialog">
      <q-card class="confirm-dialog-card help-dialog-card">
        <div class="dialog-card-header justify-center">
          <q-icon name="help" color="accent" size="md" class="snes-blink" />
          <div class="alien-font text-accent" style="font-size: 12px; letter-spacing: 1px; text-shadow: 2px 2px 0 #000">WHAT IS C25K?</div>
        </div>

        <div class="dialog-card-body">
          <div class="alien-font text-white text-justify" style="font-size: 12px; line-height: 18px; letter-spacing: 1px;">
            COUCH TO 5K (C25K) IS A BEGINNER PROGRAM THAT BUILDS YOU FROM WALK/RUN INTERVALS
            TO RUNNING 5K CONSISTENTLY.
          </div>

          <q-separator color="grey-8" class="q-my-md" />

          <div class="alien-font text-grey-5" style="font-size: 10px; letter-spacing: 1px;">HOW THIS APP WORKS</div>
          <div class="help-list q-mt-sm" style="letter-spacing: 1px;">
            <div class="help-step">
              <div class="help-step-num star-font text-accent">1</div>
              <div class="help-step-text alien-font text-white text-left">SELECT A WEEK (STAGE) AND PICK DAY 1/2/3.</div>
            </div>
            <div class="help-step">
              <div class="help-step-num star-font text-accent">2</div>
              <div class="help-step-text alien-font text-white text-left">FOLLOW THE TIMER: RUN / WALK / WARM UP / COOL DOWN.</div>
            </div>
            <div class="help-step">
              <div class="help-step-num star-font text-accent">3</div>
              <div class="help-step-text alien-font text-white text-left">WHEN YOU FINISH, UPLOAD EVIDENCE TO SAVE THE RUN.</div>
            </div>
            <div class="help-step">
              <div class="help-step-num star-font text-accent">4</div>
              <div class="help-step-text alien-font text-white text-left">COMPLETED DAYS UNLOCK THE NEXT WEEK.</div>
            </div>
            <div class="help-step">
              <div class="help-step-num star-font text-accent">5</div>
              <div class="help-step-text alien-font text-white text-left">EARN XP FROM RUNS AND SPEND IT IN THE SHOP.</div>
            </div>
            <div class="help-step">
              <div class="help-step-num star-font text-accent">6</div>
              <div class="help-step-text alien-font text-white text-left">CHECK YOUR PROGRESS IN PROFILE AND COMPARE ON THE RANKING.</div>
            </div>
          </div>
        </div>

        <div class="dialog-card-actions justify-center">
          <q-btn
            flat
            label="CLOSE"
            color="info"
            class="alien-font border-btn"
            @click="helpDialog = false"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Onboarding Dialog -->
    <q-dialog v-model="onboardingDialog" persistent backdrop-filter="blur(4px)" class="retro-dialog">
      <q-card class="confirm-dialog-card onboarding-card">
        <div class="dialog-card-header justify-center">
          <q-icon name="videogame_asset" color="accent" size="md" class="snes-blink" />
          <div class="alien-font text-accent" style="font-size: 12px; letter-spacing: 1px; text-shadow: 2px 2px 0 #000">
            WELCOME, RUNNER!
          </div>
        </div>

        <div class="dialog-card-body">
          <!-- Step 1 -->
          <div v-if="onboardingStep === 1" class="onboarding-step">
            <div class="star-font text-accent q-mb-md" style="font-size: 16px; text-shadow: 2px 2px 0 #000;">
              WHAT IS THIS?
            </div>
            <div class="alien-font text-white" style="font-size: 12px; line-height: 20px; letter-spacing: 1px;">
              SC25K IS A RETRO COUCH-TO-5K PROGRAM. IT TAKES YOU FROM ZERO TO RUNNING 5KM
              THROUGH 9 WEEKS OF WALK/RUN INTERVALS.
            </div>
          </div>

          <!-- Step 2 -->
          <div v-if="onboardingStep === 2" class="onboarding-step">
            <div class="star-font text-accent q-mb-md" style="font-size: 16px; text-shadow: 2px 2px 0 #000;">
              HOW TO PLAY
            </div>
            <div class="alien-font text-white" style="font-size: 12px; line-height: 20px; letter-spacing: 1px;">
              SELECT A WEEK, PICK A DAY, AND FOLLOW THE TIMER. COMPLETE 3 DAYS PER WEEK TO
              UNLOCK THE NEXT STAGE. UPLOAD A PHOTO AFTER EACH RUN TO EARN XP.
            </div>
          </div>

          <!-- Step 3 -->
          <div v-if="onboardingStep === 3" class="onboarding-step">
            <div class="star-font text-accent q-mb-md" style="font-size: 16px; text-shadow: 2px 2px 0 #000;">
              XP & SHOP
            </div>
            <div class="alien-font text-white" style="font-size: 12px; line-height: 20px; letter-spacing: 1px;">
              EARN XP FROM EVERY RUN. SPEND IT IN THE SHOP ON ITEMS CREATED BY OTHER RUNNERS.
              CHECK THE RANKING TO SEE HOW YOU COMPARE!
            </div>
          </div>

          <!-- Step indicator -->
          <div class="onboarding-dots q-mt-lg">
            <div v-for="s in 3" :key="s" class="onboarding-dot" :class="{ active: onboardingStep === s }" />
          </div>
        </div>

        <div class="dialog-card-actions justify-center q-gutter-x-md">
          <q-btn
            v-if="onboardingStep > 1"
            flat
            label="BACK"
            color="grey-5"
            class="alien-font border-btn"
            @click="prevOnboardingStep"
          />
          <q-btn
            flat
            :label="onboardingStep === 3 ? 'START!' : 'NEXT'"
            color="accent"
            class="alien-font border-btn"
            @click="nextOnboardingStep"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style lang="scss" scoped>
@use "sass:color";

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
  filter: brightness(0.6) grayscale(50%);
  opacity: 0.7;
}

.active-card {
  transform: scale(1.15);
  z-index: 10;
  filter: brightness(1.1) grayscale(0%);
  opacity: 1;
}

.locked {
  filter: brightness(0.3) grayscale(100%) !important;
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  pointer-events: none;
}
// -----------------------

.help-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 3000;
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  font-size: 14px;
  line-height: 1;
}

.help-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.help-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.help-step-num {
  width: 22px;
  height: 22px;
  border: 2px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  line-height: 1;
}

.help-step-text {
  font-size: 12px;
  line-height: 18px;
}

.retro-bar {
  border: 2px solid white;
  border-radius: 2px;
  background-color: $street-yellow !important;
  opacity: 1 !important;
  color: $street-red !important;
}

:deep(.q-linear-progress__track--light) {
  background-color: $street-yellow !important;
  background: none !important;
  opacity: 0 !important;
}

.evidence-buttons {
  display: flex;
  gap: 32px;
  justify-content: center;
  align-items: center;
}

.photo-btn-wrapper {
  cursor: pointer;
}

.photo-btn {
  border-radius: 100%;
  height: 60px;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &.q-btn {
    padding: 0;
    transform: none !important;

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.login-card {
  display: grid;
  position: relative;
  background-color: $snes-light;
  min-width: 300px;
  border-radius: 14px;
  gap: 16px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 -3px 4px rgba(0, 0, 0, 0.5),
    inset 1px -2px 1px rgba(255, 255, 255, 0.5),
    0 12px 0px color.adjust($snes-dark, $lightness: -25%);
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

.login-card::before {
  left: 12px;
}

.login-card::after {
  right: 12px;
}

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

  :deep(.q-btn) {
    border-radius: 100%;
    height: 40px;
    width: 40px;
    transform: rotate(38deg);
  }
}

.login-btn-blue {
  background: $snes-blue;
  box-shadow: 0.5px 2px 0px color.adjust($snes-blue, $lightness: -15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-red {
  background: $snes-red;
  box-shadow: 0.5px 2px 0px color.adjust($snes-red, $lightness: -15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-yellow {
  box-shadow: 0.5px 2px 0px color.adjust($snes-yellow, $lightness: -15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
  background: $snes-yellow;
}

.login-btn-green {
  box-shadow: 0.5px 2px 0px color.adjust($snes-green, $lightness: -15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
  background: $snes-green;
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

.down {
  transform: translateX(-9px);
}

.up {
  transform: translateX(9px);
}

.select {
  text-shadow: 2px 2px 0px #000;
  height: 30vh;
}

.mb { margin-bottom: 65px; }

.mission-row {
  width: 100%;
  max-width: 760px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0 auto 16px;
}

.mission-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
  padding: 10px 12px;
}

.mission-label {
  color: #a0a0a0;
  font-size: 10px;
  margin-bottom: 6px;
}

.mission-value {
  color: #fff;
  font-size: 14px;
}

.bounce { animation: bounce 0.5s infinite alternate; }

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-10px); }
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

.day-selection-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
  align-items: center;
}

.day-btn {
  width: 100%;
  justify-content: center;
  padding: 16px 24px !important;
  font-size: 14px;
}

.fancy-day-btn {
  background: rgba(0,0,0,0.25);
  transition: transform .15s ease, box-shadow .15s ease, background .2s ease;
}

.fancy-day-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  background: rgba(0,0,0,0.35);
}

.day-btn-content {
  display: flex;
  align-items: center;
}

.pretty-day-dialog {
  min-width: 300px;
  max-width: 400px;
}

.day-card {
  background-color: $snes-dark;
  border: 2px solid $snes-light;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: color.adjust($snes-dark, $lightness: 5%);
    border-color: $accent;
  }

  &.completed {
    background-color: rgba(76, 175, 80, 0.1);
    border-color: $positive;
  }
}

.day-number {
  font-size: 1.2rem;
  color: white;
  text-shadow: 2px 2px 0 #000;
}

@media (max-width: 700px) {
  .mission-row {
    grid-template-columns: 1fr;
  }
}

.onboarding-card {
  min-width: 300px;
  max-width: 400px;
}

.onboarding-step {
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.onboarding-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.onboarding-dot {
  width: 10px;
  height: 10px;
  border: 2px solid #555;
  background: transparent;
  transition: all 0.2s;

  &.active {
    background: #00e5ff;
    border-color: #00e5ff;
    box-shadow: 0 0 6px rgba(0, 229, 255, 0.5);
  }
}

.workout-summary-card {
  min-width: 300px;
  max-width: 400px;
}

.workout-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.workout-stat {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #222;
  padding: 10px;
  text-align: center;
}

// --- Completion XP & Share Card ---
.share-card-capture {
  padding: 16px;
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
}

.xp-earned-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.xp-counter {
  font-size: 28px;
  text-shadow: 2px 2px 0 #000;
  animation: xpPulse 0.6s ease-out;
}

@keyframes xpPulse {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
