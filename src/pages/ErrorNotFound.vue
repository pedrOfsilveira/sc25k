<template>
  <q-page class="page-container q-pa-md">
    <StarBackground />

    <div class="content-wrapper">
      <q-card class="retro-panel error-card text-center q-pa-xl">
        <div class="star-font error-code text-accent">404</div>
        <div class="street-font text-white error-title q-mt-sm">LEVEL NOT FOUND</div>
        <div class="alien-font text-grey-5 error-subtitle q-mt-sm">
          THIS SCREEN DOES NOT EXIST IN THE CURRENT WORLD.
        </div>

        <q-btn
          class="q-mt-lg alien-font border-btn"
          color="accent"
          text-color="black"
          flat
          to="/"
          label="RETURN HOME"
        />
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import StarBackground from 'src/components/StarBackground.vue'
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 640px;
  margin: auto;
}

.error-card {
  padding: 24px 18px;
}

.error-code {
  font-size: clamp(4rem, 18vw, 8rem);
  line-height: 1;
  text-shadow: 4px 4px 0 #000;
}

.error-title {
  font-size: 1.25rem;
  letter-spacing: 1px;
}

.error-subtitle {
  font-size: 10px;
  line-height: 18px;
}
</style>
