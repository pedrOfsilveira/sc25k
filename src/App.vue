<script setup>
import { onMounted } from 'vue';
import { useTreinoStore } from 'stores/treinoStore';

const store = useTreinoStore();

onMounted(() => {
  // Verifica se o teu pai saiu do app sem querer ou se crashou
  store.verificarCrash();
  // Carrega dias/semana concluídos do Supabase (fallback local se offline)
  store.loadCompletedDaysFromDB();
});
</script>

<template>
  <router-view />
</template>
