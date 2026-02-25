<template>
  <div class="star-background" aria-hidden="true">
    <div class="stars"></div>
    <div class="stars stars-medium"></div>
    <div class="stars stars-big"></div>
  </div>
</template>

<style scoped lang="scss">
@function multiple-box-shadow($n) {
  $value: "#{random(2000)}px #{random(2000)}px #FFF";
  @for $i from 2 through $n {
    $value: "#{$value} , #{random(2000)}px #{random(2000)}px #FFF";
  }
  @return unquote($value);
}

$shadows-small: multiple-box-shadow(700);
$shadows-medium: multiple-box-shadow(200);
$shadows-big: multiple-box-shadow(100);

.star-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.stars {
  position: absolute;
  inset: 0;
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: $shadows-small;
  animation: animStar 50s linear infinite;
}

.stars-medium {
  width: 2px;
  height: 2px;
  box-shadow: $shadows-medium;
  animation-duration: 100s;
}

.stars-big {
  width: 3px;
  height: 3px;
  box-shadow: $shadows-big;
  animation-duration: 150s;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2000px);
  }
}
</style>
