export const treinos = [
  {
    id: 1,
    titulo: "WEEK 1",
    descricao: "Alterna corrida leve e caminhada.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 1, texto: 'WARM UP (5 MIN)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 1, texto: 'RUN (60s)' },
      { tipo: 'caminhada', tempo: 1, texto: 'WALK (90s)' },
      { tipo: 'arrefecimento', tempo: 1, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 2,
    titulo: "WEEK 2",
    descricao: "Aumentando a intensidade.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 3,
    titulo: "WEEK 3",
    descricao: "Primeira corrida longa de 3 minutos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 180, texto: 'RUN HARD (3m)' },
      { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
      { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' },
      { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 180, texto: 'RUN HARD (3m)' },
      { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 4,
    titulo: "WEEK 4",
    descricao: "Preparação para correr 5 minutos seguidos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' },
      { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 300, texto: 'RUN HARD (5m)' },
      { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
      { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' },
      { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
      { tipo: 'corrida', tempo: 300, texto: 'RUN HARD (5m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 5,
    titulo: "WEEK 5",
    descricao: "Duas corridas de 8 minutos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 480, texto: 'RUN EPIC (8m)' },
      { tipo: 'caminhada', tempo: 300, texto: 'RECOVER (5m)' },
      { tipo: 'corrida', tempo: 480, texto: 'RUN EPIC (8m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 6,
    titulo: "WEEK 6",
    descricao: "Corrida contínua sem pausas.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 1320, texto: 'NON-STOP (22m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 7,
    titulo: "WEEK 7",
    descricao: "Mantendo o ritmo por 25 minutos.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 1500, texto: 'NON-STOP (25m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 8,
    titulo: "WEEK 8",
    descricao: "28 minutos de resistência.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 1680, texto: 'NON-STOP (28m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  },
  {
    id: 9,
    titulo: "WEEK 9",
    descricao: "30 minutos de corrida.",
    estrutura: [
      { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP' },
      { tipo: 'corrida', tempo: 1800, texto: 'VICTORY RUN (30m)' },
      { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN' }
    ]
  }
]
