<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const ready = ref(false)

const canSubmit = computed(() => {
  return password.value.length >= 6 && confirmPassword.value.length >= 6
})

const setupRecoverySession = async () => {
  // Supabase processes recovery tokens during boot (createClient) and clears
  // the URL hash/query params before this component mounts. We cannot rely on
  // URL inspection. Instead, check whether a session already exists (meaning the
  // recovery token was exchanged successfully during boot).
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    // Clean leftover URL fragments just in case
    window.history.replaceState({}, '', '/reset-password')
    ready.value = true
    return
  }

  // No session yet — the token exchange may still be in progress.
  // Listen for any auth event that produces a session.
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      subscription.unsubscribe()
      window.history.replaceState({}, '', '/reset-password')
      ready.value = true
    }
  })

  // Safety-net: if no session arrives within 8 s, the link is invalid / expired.
  setTimeout(() => {
    if (!ready.value) {
      subscription.unsubscribe()
      $q.notify({ type: 'warning', message: 'Invalid or expired reset link.' })
      router.replace('/login')
    }
  }, 8000)
}

const updatePassword = async () => {
  if (!canSubmit.value) {
    $q.notify({ type: 'warning', message: 'Password must be at least 6 characters.' })
    return
  }

  if (password.value !== confirmPassword.value) {
    $q.notify({ type: 'warning', message: 'Passwords do not match.' })
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error

    // Sign out so the router guard won't redirect away from /login
    await supabase.auth.signOut()
    $q.notify({ type: 'positive', message: 'Password updated successfully. Please login.' })
    router.replace('/login')
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to update password.' })
  } finally {
    loading.value = false
  }
}

onMounted(setupRecoverySession)
</script>

<template>
  <q-page class="q-pa-lg flex items-center justify-center">
    <div class="login-card q-pa-md">
      <div class="logo-wrapper text-center">
        <div class="star-font text-accent" style="font-size: 20px; text-shadow: 3px 3px 0 #000;">RESET PASSWORD</div>
      </div>

      <div v-if="ready" class="q-input-wrapper">
        <q-input
          borderless
          v-model="password"
          placeholder="new password"
          type="password"
          dense
          class="q-mb-sm snes-font"
        />
        <q-input
          borderless
          v-model="confirmPassword"
          placeholder="confirm new password"
          type="password"
          dense
          class="snes-font"
        />
      </div>

      <div v-else class="text-center alien-font text-grey-5 q-pa-md" style="font-size: 10px; letter-spacing: 1px;">
        VALIDATING RESET LINK...
      </div>

      <div class="login-action-card">
        <div class="btn-holder">
          <div class="btn-wrapper down">
            <q-btn
              flat
              class="login-btn-green"
              icon="check"
              :disable="!ready"
              :loading="loading"
              @click="updatePassword"
            />
            <q-btn flat class="login-btn-blue" />
          </div>
          <div class="btn-wrapper up">
            <q-btn flat class="login-btn-yellow" />
            <q-btn flat class="login-btn-red" icon="arrow_back" @click="router.replace('/login')" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss">
@use "sass:color";

.q-page {
  overflow: hidden;
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

.logo-wrapper {
  padding: 10px;
  background-color: color.adjust($snes-light, $lightness: -10%);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: inset 3px 3px 7px rgba(0, 0, 0, 0.3),
    inset -2px -2px 5px rgba(255, 255, 255, 0.5),
    0px 1px 1px rgba(255, 255, 255, 0.5);
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

  & .q-btn {
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

.q-input-wrapper {
  padding: 0 10px;

  & .q-field__control {
    background-color: color.adjust($snes-light, $lightness: -10%);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.25);
    overflow: hidden;
    box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.4);
  }

  & .q-field__native {
    padding: 12px;
  }

  & .q-field__control:before,
  & .q-field__control:after {
    border: none !important;
  }
}
</style>
