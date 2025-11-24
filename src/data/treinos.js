// src/data/treinos.js

export const treinos = [
  // =========================================
  // NÍVEL 1: O INÍCIO (SEMANA 1)
  // Estrutura: Correr 60s, Caminhar 90s (Repetir 8x)
  // =========================================
  {
    id: 1,
    titulo: "STAGE 1: THE AWAKENING",
    descricao: "Semana 1: O corpo acorda. Alterna corrida leve e caminhada.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 2, texto: 'WARM UP (5 MIN)' },
      // Repetição 1
      { tipo: 'corrida', tempo: 2, texto: 'RUN! (60s)' },
      { tipo: 'caminhada', tempo: 2, texto: 'WALK (90s)' },
      // Repetição 2

      { tipo: 'arrefecimento', tempo: 2, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 2: GANHANDO VELOCIDADE (SEMANA 2)
  // Estrutura: Correr 90s, Caminhar 2min (Repetir 6x)
  // =========================================
  {
    id: 2,
    titulo: "STAGE 2: GAINING SPEED",
    descricao: "Semana 2: Aumentando a intensidade.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: '🚶 WALK (2m)' },

      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: '🚶 WALK (2m)' },

      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: '🚶 WALK (2m)' },

      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: '🚶 WALK (2m)' },

      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: '🚶 WALK (2m)' },

      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: '🚶 WALK (2m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 3: O COMBO (SEMANA 3)
  // Estrutura: (Correr 90s, Andar 90s, Correr 3min, Andar 3min) x 2
  // =========================================
  {
    id: 3,
    titulo: "STAGE 3: THE COMBO",
    descricao: "Semana 3: Primeira corrida longa de 3 minutos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      // Bloco 1
      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 90, texto: '🚶 WALK (90s)' },
      { tipo: 'corrida', tempo: 180, texto: '🏃 RUN HARD! (3m)' },
      { tipo: 'caminhada', tempo: 180, texto: '🚶 WALK (3m)' },

      // Bloco 2
      { tipo: 'corrida', tempo: 90, texto: '🏃 RUN! (90s)' },
      { tipo: 'caminhada', tempo: 90, texto: '🚶 WALK (90s)' },
      { tipo: 'corrida', tempo: 180, texto: '🏃 RUN HARD! (3m)' },
      { tipo: 'caminhada', tempo: 180, texto: '🚶 WALK (3m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 4: ENDURANCE TEST (SEMANA 4)
  // Estrutura: Correr 3m, Andar 90s, Correr 5m, Andar 2.5m, Correr 3m, Andar 90s, Correr 5m
  // =========================================
  {
    id: 4,
    titulo: "STAGE 4: ENDURANCE TEST",
    descricao: "Semana 4: Preparação para correr 5 minutos seguidos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 180, texto: '🏃 RUN (3m)' },
      { tipo: 'caminhada', tempo: 90, texto: '🚶 WALK (90s)' },

      { tipo: 'corrida', tempo: 300, texto: '🏃 RUN HARD (5m)' },
      { tipo: 'caminhada', tempo: 150, texto: '🚶 WALK (2.5m)' },

      { tipo: 'corrida', tempo: 180, texto: '🏃 RUN (3m)' },
      { tipo: 'caminhada', tempo: 90, texto: '🚶 WALK (90s)' },

      { tipo: 'corrida', tempo: 300, texto: '🏃 RUN HARD (5m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 5: THE WALL (SEMANA 5)
  // Estrutura: Correr 8m, Andar 5m, Correr 8m (Baseado no Dia 2)
  // =========================================
  {
    id: 5,
    titulo: "STAGE 5: THE WALL",
    descricao: "Semana 5: O desafio aumenta. Duas corridas de 8 minutos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 480, texto: '🏃 RUN EPIC (8m)' },
      { tipo: 'caminhada', tempo: 300, texto: '🚶 RECOVER (5m)' },
      { tipo: 'corrida', tempo: 480, texto: '🏃 RUN EPIC (8m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 6: NO MORE WALKING (SEMANA 6)
  // Estrutura: Corrida Contínua de 22 minutos (Baseado no Dia 3)
  // =========================================
  {
    id: 6,
    titulo: "STAGE 6: NO MORE WALKING",
    descricao: "Semana 6: O teste real. Corrida contínua sem pausas.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 1320, texto: '🏃 NON-STOP (22m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 7: STAMINA UP (SEMANA 7)
  // Estrutura: Corrida Contínua de 25 minutos
  // =========================================
  {
    id: 7,
    titulo: "STAGE 7: STAMINA UP",
    descricao: "Semana 7: Mantendo o ritmo por 25 minutos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 1500, texto: '🏃 NON-STOP (25m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 8: ALMOST THERE (SEMANA 8)
  // Estrutura: Corrida Contínua de 28 minutos
  // =========================================
  {
    id: 8,
    titulo: "STAGE 8: ALMOST THERE",
    descricao: "Semana 8: Quase no fim. 28 minutos de resistência.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 1680, texto: '🏃 NON-STOP (28m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  },

  // =========================================
  // NÍVEL 9: FINAL BOSS (SEMANA 9)
  // Estrutura: Corrida Contínua de 30 minutos (5K Goal)
  // =========================================
  {
    id: 9,
    titulo: "STAGE 9: FINAL BOSS",
    descricao: "Semana 9: A glória. 30 minutos de corrida. Você consegue!",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: '🔥 WARM UP' },

      { tipo: 'corrida', tempo: 1800, texto: '🏆 VICTORY RUN (30m)' },

      { tipo: 'arrefecimento', tempo: 300, texto: '❄️ COOL DOWN' }
    ]
  }
]
