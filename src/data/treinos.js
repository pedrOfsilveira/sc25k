export const treinos = [
  {
    id: 1,
    titulo: 'WEEK 1',
    descricao: 'Run 60s, walk 90s x8. 3 sessions.',
    dias: [
      { // Day 1
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          // 8 cycles of 60s run + 90s walk
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      },
      { // Day 2
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      },
      { // Day 3
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'corrida', tempo: 60, texto: 'RUN (1m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (1.5m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      }
    ]
  },
  {
    id: 2,
    titulo: 'WEEK 2',
    descricao: 'Run 90s, walk 2m x6. 3 sessions.',
    dias: [
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        // 6 cycles of 90s run + 2m walk
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]},
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]},
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 120, texto: 'WALK (2m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]}
    ]
  },
  {
    id: 3,
    titulo: 'WEEK 3',
    descricao: 'Two sets: run 90s, walk 90s, run 3m, walk 3m.',
    dias: [
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        // set x2
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]},
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]},
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
        { tipo: 'corrida', tempo: 90, texto: 'RUN (90s)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]}
    ]
  },
  {
    id: 4,
    titulo: 'WEEK 4',
    descricao: 'Run 3m, walk 90s, run 5m, walk 2.5m x2.',
    dias: [
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]},
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]},
      { estrutura: [
        { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
        { tipo: 'corrida', tempo: 180, texto: 'RUN (3m)' }, { tipo: 'caminhada', tempo: 90, texto: 'WALK (90s)' },
        { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 150, texto: 'WALK (2.5m)' },
        { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
      ]}
    ]
  },
  {
    id: 5,
    titulo: 'WEEK 5',
    descricao: 'Three different days increasing duration.',
    dias: [
      { // Day 1: 5-3-5-3-5
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
          { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
          { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      },
      { // Day 2: 8-5-8
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 480, texto: 'RUN (8m)' }, { tipo: 'caminhada', tempo: 300, texto: 'WALK (5m)' },
          { tipo: 'corrida', tempo: 480, texto: 'RUN (8m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      },
      { // Day 3: 20m continuous
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 1200, texto: 'NON-STOP (20m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      }
    ]
  },
  {
    id: 6,
    titulo: 'WEEK 6',
    descricao: 'Progress to longer continuous runs.',
    dias: [
      { // Day 1: 5-3-8-3-5
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
          { tipo: 'corrida', tempo: 480, texto: 'RUN (8m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
          { tipo: 'corrida', tempo: 300, texto: 'RUN (5m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      },
      { // Day 2: 10-3-10
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 600, texto: 'RUN (10m)' }, { tipo: 'caminhada', tempo: 180, texto: 'WALK (3m)' },
          { tipo: 'corrida', tempo: 600, texto: 'RUN (10m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      },
      { // Day 3: 25m continuous
        estrutura: [
          { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' },
          { tipo: 'corrida', tempo: 1500, texto: 'NON-STOP (25m)' },
          { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' }
        ]
      }
    ]
  },
  {
    id: 7,
    titulo: 'WEEK 7',
    descricao: 'Three runs of 25 minutes.',
    dias: [
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1500, texto: 'NON-STOP (25m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] },
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1500, texto: 'NON-STOP (25m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] },
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1500, texto: 'NON-STOP (25m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] }
    ]
  },
  {
    id: 8,
    titulo: 'WEEK 8',
    descricao: 'Three runs of 28 minutes.',
    dias: [
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1680, texto: 'NON-STOP (28m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] },
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1680, texto: 'NON-STOP (28m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] },
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1680, texto: 'NON-STOP (28m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] }
    ]
  },
  {
    id: 9,
    titulo: 'WEEK 9',
    descricao: 'Three runs of 30 minutes.',
    dias: [
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1800, texto: 'VICTORY RUN (30m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] },
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1800, texto: 'VICTORY RUN (30m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] },
      { estrutura: [ { tipo: 'aquecimento', tempo: 300, texto: 'WARM UP (5m)' }, { tipo: 'corrida', tempo: 1800, texto: 'VICTORY RUN (30m)' }, { tipo: 'arrefecimento', tempo: 300, texto: 'COOL DOWN (5m)' } ] }
    ]
  }
]
