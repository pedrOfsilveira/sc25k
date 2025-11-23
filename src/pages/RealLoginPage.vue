<template>
  <q-page class="q-pa-lg flex items-center justify-center">
    <div class="cable"></div>
    <div class="login-card q-pa-md">
      <div class="line"></div>
      <div class="detail1">
        <div class="detail-wrapper">
          <div class="black"></div>
          <div class="inner-detail"></div>
        </div>
        <div class="detail-wrapper">
          <div class="black"></div>
          <div class="inner-detail"></div>
        </div>
        <div class="detail-wrapper">
          <div class="black"></div>
          <div class="inner-detail"></div>
        </div>
        <div class="detail-wrapper">
          <div class="black"></div>
          <div class="inner-detail"></div>
        </div>
        <div class="detail-wrapper">
          <div class="black"></div>
          <div class="inner-detail"></div>
        </div>
      </div>
      <div class="detail2">
        <div class="detail-wrapper">
          <div class="inner-detail"></div>
          <div class="black"></div>
        </div>
        <div class="detail-wrapper">
          <div class="inner-detail"></div>
          <div class="black"></div>
        </div>
        <div class="detail-wrapper">
          <div class="inner-detail"></div>
          <div class="black"></div>
        </div>
        <div class="detail-wrapper">
          <div class="inner-detail"></div>
          <div class="black"></div>
        </div>
        <div class="detail-wrapper">
          <div class="inner-detail"></div>
          <div class="black"></div>
        </div>
      </div>
      <div class="logo-wrapper">
        <q-img src="/src/assets/logo.webp"></q-img>
      </div>
      <div class="q-input-wrapper">
        <q-input
          borderless
          v-model="text"
          placeholder="insert your email"
          dense
          class="q-mb-sm snes-font"
        />
        <q-input
          borderless
          v-model="text"
          placeholder="and now your password"
          type="password"
          dense
          class="snes-font"
        />
      </div>

      <div class="login-action-card">
        <div class="btn-holder">
          <div class="btn-wrapper down">
            <q-btn flat class="login-btn-green" icon="login"></q-btn>
            <q-btn flat class="login-btn-blue"></q-btn>
          </div>
          <div class="btn-wrapper up">
            <q-btn flat class="login-btn-yellow"></q-btn>
            <q-btn flat class="login-btn-red" icon="person_add"></q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss">
.line {
  width: 100%;
}
.q-page {
  overflow: hidden;
}

.detail1 {
  position: absolute;
  display: grid;
  width: 40px;
  height: 70px;
  top: 45px;
  left: -3px;
}

.detail-wrapper {
  display: flex;
}

.black {
  width: 5px;
  height: 6px;
  background-color: #12121e;
}
.inner-detail {
  background-color: darken($snes-light, 10%);
  height: 6px;
  width: 10px;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.4);
}
.detail2 {
  position: absolute;
  display: grid;
  justify-content: end;
  width: 40px;
  height: 70px;
  top: 45px;
  right: -3px;

  & .inner-detail {
    background-color: darken($snes-light, 15%);
    box-shadow: inset 1px 2px 3px rgba(0, 0, 0, 0.6),
      0 1px 0 rgba(255, 255, 255, 0.4);
  }
}

.cable {
  width: 20px;
  height: 50vh;
  top: 0;
  position: absolute;
  background-color: $snes-darker;
  box-shadow: inset 5px 3px 10px rgba(0, 0, 0, 0.6);
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

.logo-wrapper {
  padding: 6px;
  margin-bottom: 10px;

  background-color: darken($snes-light, 10%);

  border-radius: 14px;
border-bottom: 1px solid rgba(0, 0, 0, 0.15);
border-top: 1px solid rgba(0, 0, 0, 0.15);
border-left: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: inset 3px 3px 7px rgba(0, 0, 0, 0.3),
    inset -2px -2px 5px rgba(255, 255, 255, 0.5),
    0px 1px 1px rgba(255, 255, 255, 0.5);

  & .q-img {
    border-radius: 10px;
    filter: brightness(0.95);
  }
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
  box-shadow: 0.5px 2px 0px darken($snes-blue, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-red {
  background: $snes-red;
  box-shadow: 0.5px 2px 0px darken($snes-red, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
}

.login-btn-yellow {
  box-shadow: 0.5px 2px 0px darken($snes-yellow, 15%),
    -1px -2px 3px rgba(0, 0, 0, 0.5), inset 1px 2px 1px rgba(0, 0, 0, 0.5),
    inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.2),
    inset 2px 3px 4px rgba(255, 255, 255, 0.2),
    inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2),
    1px 3px 0 rgba(255, 255, 255, 0.5),
    inset -1px -1px 6px 3px rgba(0, 0, 0, 0.2);
  background: $snes-yellow;
}

.login-btn-green {
  box-shadow: 0.5px 2px 0px darken($snes-green, 15%),
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
  transform: translateX(-11px);
}

.up {
  transform: translateX(11px);
}

.q-input-wrapper {
  padding: 0 10px;
  & .q-field__control {
    background-color: darken($snes-light, 10%);
    border-radius: 8px;
 border: 1px solid rgba(0, 0, 0, 0.25);
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
