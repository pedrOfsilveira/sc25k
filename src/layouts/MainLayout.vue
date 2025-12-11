<script setup>
import { ref, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "boot/supabase";
import { useTreinoStore } from "stores/treinoStore";
import { treinos } from "src/data/treinos.js";

const store = useTreinoStore();
const router = useRouter();
const route = useRoute();

const tab = ref("home");
const mostrarHistorico = ref(false);
const historico = ref([]);
const loadingHistorico = ref(false);

const resetTab = () => {
  const path = route.path;

  if (path === '/shop') {
    tab.value = 'shop';
  } else if (path === '/profile') {
    tab.value = 'profile';
  } else {
    tab.value = 'home';
  }
};

// Watch for route changes and reset tab
watch(() => route.path, async () => {
  await nextTick();
  resetTab();
});

const getNomeTreino = (id) => {
  const t = treinos.find(item => item.id === id);
  return t ? t.titulo : 'UNKNOWN STAGE';
};

const irParaHome = () => {
  tab.value = 'home';
  router.push('/');
};

const irParaShop = () => {
  tab.value = 'shop';
  router.push('/shop');
};

const irParaProfile = () => {
  tab.value = 'profile';
  router.push('/profile');
};

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};

const abrirHistorico = async () => {
  tab.value = 'history';
  mostrarHistorico.value = true;
  loadingHistorico.value = true;

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from("historico_treinos")
      .select("*")
      .eq('user_id', user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      historico.value = data;
    }
  }
  loadingHistorico.value = false;
};
</script>

<template>
  <q-layout>
    <q-page-container>
      <router-view />

      <q-footer v-if="!store.treinoAtivo" class="snes-footer">
        <div class="console-front">
          <div
            class="controller-port"
            :class="{ 'plugged-in': tab === 'home' }"
            @click="irParaHome"
          >
            <span class="label">START</span>
            <div class="port-hole">
              <div class="pin-holes"></div>
            </div>
            <div class="plug-connector">
              <div class="cable-tail"></div>
            </div>
          </div>
          <div
            class="controller-port"
            :class="{ 'plugged-in': tab === 'shop' }"
            @click="irParaShop"
          >
            <span class="label">SHOP</span>
            <div class="port-hole">
              <div class="pin-holes"></div>
            </div>
            <div class="plug-connector">
              <div class="cable-tail"></div>
            </div>
          </div>

          <div
            class="controller-port"
            :class="{ 'plugged-in': tab === 'history' }"
            @click="abrirHistorico"
          >
            <span class="label">MEMORY</span>
            <div class="port-hole">
              <div class="pin-holes"></div>
            </div>
            <div class="plug-connector">
              <div class="cable-tail"></div>
            </div>
          </div>

          <div
            class="controller-port"
            :class="{ 'plugged-in': tab === 'profile' }"
            @click="irParaProfile()"
          >
            <span class="label">PROFILE</span>
            <div class="port-hole">
              <div class="pin-holes"></div>
            </div>
            <div class="plug-connector">
              <div class="cable-tail">
                <div class="cable-tail-detail"></div>
              </div>
            </div>
          </div>
        </div>
      </q-footer>

      <q-dialog
        v-model="mostrarHistorico"
        maximized
        transition-show="slide-down"
        transition-hide="slide-up"
        backdrop-filter="blur(4px)"
        @hide="resetTab()"
      >
        <q-card class="memory-dialog-card">

          <q-bar class="memory-dialog-header q-pa-md">
            <q-icon name="save" color="accent" size="xs" />
            <div class="text-h6 star-font text-accent q-ml-sm snes-blink" style="font-size: 14px">SAVE DATA</div>
            <q-space />
            <q-btn dense flat text-color="white" icon="close" v-close-popup class="retro-close-btn" />
          </q-bar>

          <q-card-section class="q-px-md q-pb-xl full-height scroll">
            <div v-if="loadingHistorico" class="text-center q-mt-xl snes-blink alien-font text-white" style="font-size: 14px">
              READING MEMORY CARD...
            </div>

            <div v-else-if="historico.length === 0" class="empty-state q-mt-xl">
              <q-icon name="videogame_asset_off" size="64px" color="grey-6" class="q-mb-md" />
              <div class="alien-font text-grey-5" style="font-size: 10px; line-height: 20px;">
                NO DATA FOUND.<br>INSERT COIN & RUN!
              </div>
            </div>

            <template v-else>
              <div class="stats-summary q-mb-md">
                <div class="stat-item">
                  <div class="stat-label alien-font">TOTAL RUNS</div>
                  <div class="stat-value star-font text-accent">{{ historico.length }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label alien-font">COMPLETED</div>
                  <div class="stat-value star-font text-green">{{ historico.filter(h => h.status !== 'CANCELADO').length }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label alien-font">TOTAL XP</div>
                  <div class="stat-value star-font text-warning">{{ historico.reduce((sum, h) => sum + (h.pontuacao || 0), 0) }}</div>
                </div>
              </div>

              <q-list dark separator class="retro-list q-mt-md">
                <div v-for="item in historico" :key="item.id" class="memory-item-card">
                  <div class="memory-item-header">
                    <div class="pixel-avatar" :class="item.status === 'CANCELADO' ? 'avatar-failed' : 'avatar-success'">
                      <q-icon v-if="item.status === 'CANCELADO'" name="close" color="negative" />
                      <img v-else-if="item.foto_url" :src="item.foto_url">
                      <q-icon v-else name="emoji_events" color="accent" />
                    </div>
                    <div class="memory-item-info">
                      <div class="star-font text-white memory-title">{{ getNomeTreino(item.treino_id) }}</div>
                      <div class="alien-font text-grey-5 memory-date">
                        <q-icon name="access_time" size="10px" class="q-mr-xs" />
                        {{ new Date(item.created_at).toLocaleDateString() }} · {{ new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
                      </div>
                    </div>
                    <div class="score-box">
                      <div class="score-label alien-font">XP</div>
                      <div class="score-value star-font">{{ item.pontuacao }}</div>
                    </div>
                  </div>

                  <div class="memory-item-body">
                    <div class="badges-row">
                      <span
                        class="status-badge alien-font"
                        :class="item.status === 'CANCELADO' ? 'status-failed' : 'status-complete'"
                      >
                        {{ item.status === 'CANCELADO' ? 'FAILED' : 'COMPLETE' }}
                      </span>
                      <span class="cycles-badge alien-font">
                        {{ item.progresso || 'ALL' }} CYCLES
                      </span>
                    </div>

                    <a v-if="item.foto_url" :href="item.foto_url" target="_blank" class="evidence-link alien-font" @click.stop>
                      VIEW EVIDENCE
                    </a>
                  </div>
                </div>
              </q-list>
            </template>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.blink {
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% { opacity: 0; }
}

.snes-footer {
  position: fixed;
  bottom: 10px;
  background: transparent;
  padding: 0 10px 10px 10px;
  z-index: 2000;
}

.console-front {
  height: 90px;
  background-color: darken($snes-light, 5%);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 -3px 4px rgba(0, 0, 0, 0.5),
    inset 1px -2px 1px rgba(255, 255, 255, 0.5),
    0 6px 8px rgba(255, 255, 255, 0.3), 0 12px 0px darken($snes-dark, 25%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-top: 10px;
}

.controller-port {
  position: relative;
  width: 80px;
  height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.port-hole {
  width: 60px;
  height: 30px;
  background-color: darken($snes-darker, 20%);
  border-radius: 15px;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.4);
}

.pin-holes {
  width: 42px;
  height: 6px;
  background-image: radial-gradient(circle, #000 40%, transparent 50%);
  background-size: 6px 6px;
  opacity: 0.8;
}

.plug-connector {
  position: absolute;
  top: 100px;
  width: 60px;
  height: 30px;
  background-color: darken($snes-darker, 8%);
  border-radius: 15px;
  z-index: 2;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.2s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-top: none;
  box-shadow: 1px 1px 1px rgba(255, 255, 255, 0.4),
    inset 0px -5px 1px rgba(0, 0, 0, 0.6),
    inset 0 -6px 1px 0px rgba(255, 255, 255, 0.4),
    0px -2px 4px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.cable-tail {
  z-index: 1;
  position: absolute;
  width: 10px;
  height: 155px;
  background-color: darken($snes-darker, 15%);
  bottom: -152px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 4px 4px 0 0;
  box-shadow: inset 5px 3px 10px rgba(0, 0, 0, 0.7);
}

.cable-tail-detail {
  position: absolute;
  width: 14px;
  height: 12px;
  border-radius: 4px 4px 6px 6px;
  bottom: 0;
  background-color: red;
}

.plugged-in {
  .plug-connector {
    top: 24px;
    opacity: 1;
    transform: scale(1);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .port-hole {
    box-shadow: inset 0 0 10px #000;
  }
  .label {
    color: $snes-red;
    text-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
    transform: translateY(-2px);
  }
}

.label {
  margin-bottom: 6px;
  font-family: "snes";
  font-size: 12px;
  color: #555;
  text-shadow: 0 1px 0 rgba(255,255,255,0.2);
  transition: all 0.3s;
  z-index: 3;
}

.retro-screen-card {
  background-color: #101020 !important;
  border: 4px solid #fff;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.9);
  position: relative;
  overflow: hidden;
}

// Memory dialog card styles
.memory-dialog-card {
  background-color: #090a0f !important;
  border: 2px solid #fff;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.8), 0 8px 32px rgba(0,0,0,0.9);
  position: relative;
  overflow: hidden;
}

.memory-dialog-header {
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%) !important;
  border-bottom: 2px solid #fff;
  padding-top: 20px;
}

.retro-header {
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%) !important;
  border-bottom: 2px solid #fff;
  padding-top: 20px;
}

.retro-close-btn {
  transition: all 0.2s;
  &:hover {
    color: yellow !important;
    transform: rotate(90deg);
  }
}

.stats-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(0,0,0,0.4);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
  .stat-label {
    font-size: 10px;
    color: #888;
    margin-bottom: 4px;
  }
  .stat-value {
    font-size: 16px;
    font-weight: bold;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.crt-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 50%,
    rgba(0,0,0,0.2) 50%,
    rgba(0,0,0,0.2)
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 999;
  opacity: 0.3;
}

.retro-list .q-separator {
  background-color: rgba(255,255,255,0.1);
}

.retro-score-item {
  border-bottom: 1px solid rgba(255,255,255,0.08);
  transition: all 0.2s;
  &:hover {
    background-color: rgba(255,255,255,0.03);
    transform: translateX(4px);
    border-left: 3px solid yellow;
  }
}

.pixel-avatar {
  width: 48px;
  height: 48px;
  border: 2px solid;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    image-rendering: pixelated;
  }
  &.avatar-success {
    border-color: #55ff55;
    box-shadow: 0 0 10px rgba(85, 255, 85, 0.3);
  }
  &.avatar-failed {
    border-color: #ff5555;
    box-shadow: 0 0 10px rgba(255, 85, 85, 0.3);
  }
}

.retro-score-item:hover .pixel-avatar {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 255, 85, 0.4);
}

.status-badge {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 2px;
  font-weight: bold;
  letter-spacing: 0.5px;
  &.status-complete {
    background: rgba(85, 255, 85, 0.2);
    color: #55ff55;
    border: 1px solid #55ff55;
  }
  &.status-failed {
    background: rgba(255, 85, 85, 0.2);
    color: #ff5555;
    border: 1px solid #ff5555;
  }
}

.cycles-badge {
  font-size: 10px;
  color: #ffdd55;
  padding: 3px 6px;
  background: rgba(255, 221, 85, 0.1);
  border: 1px solid rgba(255, 221, 85, 0.3);
  border-radius: 2px;
}

.evidence-link {
  text-decoration: none;
  color: #4fc3f7;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  align-self: center;
  transition: all 0.2s;
  margin-top: 4px;
  &:hover {
    color: #4fc3f7;
    text-shadow: none;
    transform: none;
  }
}

.memory-date {
  font-size: 8px;
}

.score-box {
  background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%);
  padding: 8px 12px;
  border: 2px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  transition: all 0.2s;
  .score-label {
    font-size: 7px;
    color: #999;
    margin-bottom: 2px;
  }
  .score-value {
    font-size: 14px;
    color: #ffc107;
    font-weight: bold;
    text-shadow: 0 0 8px rgba(255, 193, 7, 0.5);
  }
}

.retro-score-item:hover .score-box {
  border-color: #ffc107;
  box-shadow: 0 0 16px rgba(255, 193, 7, 0.3);
  transform: scale(1.05);
}

.q-dialog__inner--maximized > div {
  height: 75%;
  width: 90%;
  max-width: 600px;
  margin: auto;
  transform: translateY(-25px);
  overflow: hidden;
}

// Memory item card redesign
.memory-item-card {
  background-color: #090a0f;
  border: 2px solid #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
  padding: 12px;
  margin-bottom: 8px;
}

.memory-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #222;
  padding-bottom: 10px;
}

.memory-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.memory-title {
  font-size: 12px;
  line-height: 1.3;
}

.memory-item-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
