<script setup>
import { computed } from 'vue';

const props = defineProps({
  img: {
    type: String,
    default: 'logo.webp'
  }
});

const backgroundStyle = computed(() => {
  const imgUrl = new URL(`../assets/${props.img}`, import.meta.url).href;
  return {
    backgroundImage: `url('${imgUrl}')`
  };
});
</script>

<template>
<div class="cartucho">
  <div class="cartucho-centro">
    <div class="cartucho-detalhe esquerda">
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco parafuso"></div>
    </div>
    <div class="cartucho-detalhe direita">
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco"></div>
      <div class="bloco parafuso2"></div>
    </div>
     <div class="logo-wrapper">
      <div class="img" :style="backgroundStyle"></div>
    </div>
    <div class="cartucho-inset"></div>
  </div>
</div>

</template>

<style lang="scss" scoped>

.parafuso::before {
  background-color: darken($snes-dark, 20%);
  height: 15px;
  width: 15px;
  border-radius: 50%;
  content: '';
  position: absolute;
  bottom: 4px;
  left: 20%;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 1px rgba(255, 255, 255, 0.4);
}

.parafuso::after {
  background-color: darken($snes-dark, 10%);
  height: 11px;
  width: 11px;
  border-radius: 50%;
  content: '';
  position: absolute;
  bottom: 6px;
  left: 22%;

  box-shadow: 0 -2px 4px  rgba(0, 0, 0, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.2);

}
.parafuso2::before {
  background-color: darken($snes-dark, 20%);
  height: 15px;
  width: 15px;
  border-radius: 50%;
  content: '';
  position: absolute;
  bottom: 4px;
  right: 20%;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 1px rgba(255, 255, 255, 0.4);
}

.parafuso2::after {
  background-color: darken($snes-dark, 10%);
  height: 11px;
  width: 11px;
  border-radius: 50%;
  content: '';
  position: absolute;
  bottom: 6px;
  right: 22%;

  box-shadow: 0 -2px 4px  rgba(0, 0, 0, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.2);

}
.cartucho {
  margin-top: -100px;
  transform: scale(0.7);
  transition: .5s all ease;
}

.cartucho:hover {
  transform: scale(0.65) translateY(-5px);
}
.cartucho-centro {
  display: flex;
  justify-content: center;
  height: 255px;
  width: 270px;
  background-color: $snes-light;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-top: none;
  box-shadow: 0 0px 8px rgba(0, 0, 0, 0.5);
}

.bloco {
  background-color: $snes-dark;
  height: 40px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.4),
  1px 3px 2px rgba(0, 0, 0, 0.25);

}
.cartucho-detalhe {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: end;
  gap: 3px;
  width: 100px;
  height: 245px;

  z-index: -1;
  background-color: $snes-darker;
  bottom: 0;
}

.esquerda {
  left: -60px;
  & .bloco {
    transform: translateX(-2px);
  }
}
.direita {
  right: -60px;
    & .bloco {
    transform: translateX(2px);
  }
}

.logo-wrapper {
  padding: 0 6px 6px 6px;
  width: 245px;
  height: 110px;
  margin-bottom: 10px;

  background-color: darken($snes-light, 10%);

  border-radius: 0 0 14px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  border-left: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: inset 3px 3px 7px rgba(0, 0, 0, 0.3),
    inset -2px -2px 5px rgba(255, 255, 255, 0.5),
    0px 1px 1px rgba(255, 255, 255, 0.5);

  & .q-img {

    border-radius: 10px;
    filter: brightness(0.95);
  }
}

.img {
   background-size: cover;
  background-position: center;
  width: 100%;
  height: 100%;

  border-radius: 0 0 8px 8px;
  filter: brightness(0.95);
}

.cartucho-inset {
  position: absolute;
  bottom: 0;
  height: 100px;
  width: 245px;
  background-color: darken($snes-light, 5%);
  border-radius: 8px 8px 0 0;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.4);
      border: 1px solid rgba(0, 0, 0, 0.25);
      border-bottom: none;
}

.cartucho-inset::before {

  position: absolute;
  content: '';
  box-shadow: inset 2px 12px 10px rgba(0, 0, 0, 0.2),   1px 0 0 rgba(255, 255, 255, 0.2), -1px 0 0 rgba(255, 255, 255, 0.2);
  width: 60px;
  height: 70px;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}
</style>
