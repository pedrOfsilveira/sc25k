<script setup>
import Cartucho from 'src/components/Cartucho.vue';


</script>

<template>
  <q-page class="q-pa-md flex justify-center">
    <Cartucho img="logo.webp"/>
  </q-page>
</template>

<style lang="scss" scoped>
  .login-card {
  display: grid;
  position: relative;
  background-color: $snes-light;
  min-width: 300px;
  min-height: 300px;
  border-radius: 14px;
  gap: 16px;
   border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 -3px 4px rgba(0, 0, 0, 0.5),
    inset 1px -2px 1px rgba(255, 255, 255, 0.5),
    0 6px 8px rgba(255, 255, 255, 0.3), 0 12px 0px darken($snes-dark, 25%);
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


</style>
