<template>
  <q-layout>
    <q-page-container>
      <router-view />
      <q-footer v-if="!store.treinoAtivo" class="snes-footer">
        <div class="console-front">
          <div
            class="controller-port"
            :class="{ 'plugged-in': tab === 'home' }"
            @click="tab = 'home'"
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
            :class="{ 'plugged-in': tab === 'history' }"
            @click="tab = 'history'"
          >
            <span class="label">RECORDS</span>
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
            @click="logout()"
          >
            <span class="label">QUIT</span>
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
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "boot/supabase";
import { useTreinoStore } from "stores/treinoStore";

const store = useTreinoStore();
const tab = ref("home");
const router = useRouter();

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
</script>

<style lang="scss">
.snes-footer {
  position: fixed;
  bottom: 10px;
  background: transparent;
  padding: 0 10px 10px 10px;
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
  background-color: darken($snes-darker, 20%); /* Quase preto */
  border-radius: 15px;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.4);
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
  top: 80px;
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
  box-shadow: inset 5px 3px 10px rgba(0, 0, 0, 0.6);
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
    transition: box-shadow 0.2s;
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
</style>
