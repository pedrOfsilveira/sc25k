<template>
  <q-page class="flex flex-center retro-container">
    <div class="login-box q-pa-md">
      <h1 class="text-center retro-title">RETRO RUN</h1>
      <div class="text-center q-mb-lg text-retro-accent blink">
        INSERT COIN TO START
      </div>

      <div class="q-gutter-y-md">
        <q-input
          v-model="email"
          dark
          outlined
          label="PLAYER 1 (EMAIL)"
          color="red-5"
          class="retro-input"
        />

        <q-input
          v-model="password"
          dark
          outlined
          type="password"
          label="PASSWORD"
          color="red-5"
          class="retro-input"
        />

        <q-btn
          class="full-width retro-btn q-mt-lg"
          :label="isLogin ? 'PRESS START (LOGIN)' : 'NEW GAME (CRIAR CONTA)'"
          @click="handleAuth"
          :loading="loading"
        />

        <div class="text-center q-mt-sm cursor-pointer text-grey-5" @click="isLogin = !isLogin">
          <span v-if="isLogin">Não tens ficha? > Criar Conta</span>
          <span v-else>Já tens save? > Fazer Login</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const email = ref('')
const password = ref('')
const loading = ref(false)
const isLogin = ref(true) // Controla se estamos a fazer login ou cadastro
const router = useRouter()
const $q = useQuasar()

const handleAuth = async () => {
  loading.value = true
  try {
    if (isLogin.value) {
      // --- LÓGICA DE LOGIN ---
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      if (error) throw error
      router.push('/') // Manda o user para a Home se der certo
    } else {
      // --- LÓGICA DE CRIAR CONTA ---
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      })
      if (error) throw error
      $q.notify({ type: 'positive', message: 'Conta criada! Podes entrar.' })
      isLogin.value = true // Volta para a tela de login
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* CSS Específico desta página */
.retro-container {
  background-color: var(--retro-bg);
  flex-direction: column;
}

.retro-title {
  font-family: 'Press Start 2P', cursive;
  color: var(--retro-secondary); /* Azul Ryu */
  text-shadow: 4px 4px var(--retro-primary); /* Sombra Vermelha Ken */
  font-size: 2rem;
  line-height: 1.5;
  margin-bottom: 10px;
}

/* Caixa estilo Arcade */
.login-box {
  border: 4px solid var(--retro-text);
  background: rgba(0,0,0,0.5);
  width: 100%;
  max-width: 400px;
}

/* Animação de piscar "Insert Coin" */
.blink {
  animation: blinker 1.5s linear infinite;
  font-size: 0.8rem;
}

@keyframes blinker {
  50% { opacity: 0; }
}

/* Estilizando os Inputs do Quasar para ficarem quadrados */
:deep(.q-field--outlined .q-field__control) {
  border-radius: 0 !important; /* Remove curvas */
  border-width: 2px;
}

.retro-btn {
  background: var(--retro-primary);
  color: white;
  font-family: 'Press Start 2P', cursive;
  border-radius: 0; /* Botão quadrado */
  border: 2px solid white;
}
</style>
